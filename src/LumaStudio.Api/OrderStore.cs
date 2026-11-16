using Microsoft.Data.Sqlite;
using System.Text.Json;

namespace LumaStudio.Api;

public sealed record StoredOrder(OrderConfirmation? Confirmation, bool Replayed, bool Conflict);

public sealed class OrderStore
{
    private readonly string connectionString;
    private readonly TimeProvider clock;

    public OrderStore(IConfiguration configuration, IHostEnvironment environment, TimeProvider clock)
    {
        this.clock = clock;
        var path = configuration["Orders:DatabasePath"] ?? Path.Combine(environment.ContentRootPath, "data", "orders.db");
        Directory.CreateDirectory(Path.GetDirectoryName(Path.GetFullPath(path))!);
        connectionString = new SqliteConnectionStringBuilder { DataSource = path, Pooling = false }.ToString();
        using var connection = Open();
        using var command = connection.CreateCommand();
        command.CommandText = """
            CREATE TABLE IF NOT EXISTS DemoOrders (
                IdempotencyKey TEXT PRIMARY KEY,
                RequestHash TEXT NOT NULL,
                ResponseJson TEXT NOT NULL,
                ExpiresAt INTEGER NOT NULL
            );
            CREATE INDEX IF NOT EXISTS IX_DemoOrders_ExpiresAt ON DemoOrders(ExpiresAt);
            """;
        command.ExecuteNonQuery();
        PurgeExpired();
    }

    private SqliteConnection Open()
    {
        var connection = new SqliteConnection(connectionString);
        connection.Open();
        using var command = connection.CreateCommand();
        command.CommandText = "PRAGMA secure_delete=ON;";
        command.ExecuteNonQuery();
        return connection;
    }

    public StoredOrder Create(string key, OrderRequest request)
    {
        using var connection = Open();
        // Immediate transaction serializes the check+insert across concurrent requests/processes.
        using var transaction = connection.BeginTransaction(deferred: false);
        var now = clock.GetUtcNow();
        using var command = connection.CreateCommand();
        command.Transaction = transaction;
        command.CommandText = "DELETE FROM DemoOrders WHERE ExpiresAt <= $now";
        command.Parameters.AddWithValue("$now", now.ToUnixTimeMilliseconds());
        command.ExecuteNonQuery();
        command.Parameters.Clear();
        command.CommandText = "SELECT RequestHash, ResponseJson FROM DemoOrders WHERE IdempotencyKey = $key";
        command.Parameters.AddWithValue("$key", key);
        var hash = Orders.Fingerprint(request);
        using (var reader = command.ExecuteReader())
        {
            if (reader.Read())
            {
                if (reader.GetString(0) != hash) return new(null, false, true);
                var confirmation = JsonSerializer.Deserialize<OrderConfirmation>(reader.GetString(1), Orders.JsonOptions)!;
                reader.Close();
                transaction.Commit();
                return new(confirmation, true, false);
            }
        }
        var result = Orders.Price(request, now);
        command.Parameters.Clear();
        command.CommandText = "INSERT INTO DemoOrders VALUES ($key, $hash, $response, $expires)";
        command.Parameters.AddWithValue("$key", key);
        command.Parameters.AddWithValue("$hash", hash);
        command.Parameters.AddWithValue("$response", JsonSerializer.Serialize(result, Orders.JsonOptions));
        command.Parameters.AddWithValue("$expires", result.ExpiresAt.ToUnixTimeMilliseconds());
        command.ExecuteNonQuery();
        transaction.Commit();
        return new(result, false, false);
    }

    public void PurgeExpired()
    {
        using var connection = Open();
        using var command = connection.CreateCommand();
        command.CommandText = "DELETE FROM DemoOrders WHERE ExpiresAt <= $now";
        command.Parameters.AddWithValue("$now", clock.GetUtcNow().ToUnixTimeMilliseconds());
        command.ExecuteNonQuery();
    }
}

public sealed class OrderRetentionService(OrderStore store, ILogger<OrderRetentionService> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromMinutes(1));
        while (await timer.WaitForNextTickAsync(stoppingToken))
        {
            try { store.PurgeExpired(); }
            catch (Exception) { logger.LogError("Demo order retention cleanup failed; will retry."); }
        }
    }
}
