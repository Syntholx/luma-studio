using Microsoft.AspNetCore.Identity;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.Options;
using System.Net.Mail;
using System.Security.Cryptography;

namespace LumaStudio.Api;

internal sealed record Credentials(string? Email, string? Password);
internal sealed record DemoAccount(string Id, string Email);

internal sealed class AccountStore
{
    internal const string Cookie = "__Host-luma-session";
    private readonly string connectionString;
    private readonly TimeProvider clock;
    private readonly PasswordHasher<DemoAccount> hasher = new(
        Options.Create(new PasswordHasherOptions { IterationCount = 210_000 }));
    private readonly DemoAccount dummy = new("", "");
    private readonly string dummyHash;

    public AccountStore(IConfiguration configuration, IHostEnvironment environment, TimeProvider clock)
    {
        this.clock = clock;
        dummyHash = hasher.HashPassword(dummy, Convert.ToHexString(RandomNumberGenerator.GetBytes(32)));
        var path = Path.GetFullPath(configuration["Accounts:DatabasePath"] ??
            Path.Combine(environment.ContentRootPath, "data", "accounts.db"));
        Directory.CreateDirectory(Path.GetDirectoryName(path)!);
        connectionString = new SqliteConnectionStringBuilder { DataSource = path, Pooling = false }.ToString();
        using var db = Open();
        using var command = Command(db, """
            CREATE TABLE IF NOT EXISTS DemoAccounts (
                Id TEXT PRIMARY KEY, Email TEXT NOT NULL UNIQUE, PasswordHash TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS DemoSessions (
                TokenHash TEXT PRIMARY KEY, AccountId TEXT NOT NULL, ExpiresAt INTEGER NOT NULL,
                FOREIGN KEY (AccountId) REFERENCES DemoAccounts(Id) ON DELETE CASCADE
            );
            CREATE INDEX IF NOT EXISTS IX_DemoSessions_AccountId ON DemoSessions(AccountId);
            """);
        command.ExecuteNonQuery();
    }

    private SqliteConnection Open()
    {
        var db = new SqliteConnection(connectionString);
        db.Open();
        using var command = Command(db, "PRAGMA foreign_keys=ON;");
        command.ExecuteNonQuery();
        return db;
    }

    private static SqliteCommand Command(SqliteConnection db, string sql,
        params (string Name, object Value)[] parameters)
    {
        var command = db.CreateCommand();
        command.CommandText = sql;
        foreach (var (name, value) in parameters) command.Parameters.AddWithValue(name, value);
        return command;
    }

    public (DemoAccount? Account, string? Error) Register(string email, string password)
    {
        var account = new DemoAccount(Guid.NewGuid().ToString("N"), email);
        var hash = hasher.HashPassword(account, password);
        using var db = Open();
        using var tx = db.BeginTransaction(deferred: false);
        using var check = Command(db, "SELECT COUNT(*), COUNT(CASE WHEN Email=$email THEN 1 END) FROM DemoAccounts", ("$email", email));
        check.Transaction = tx;
        using var reader = check.ExecuteReader();
        reader.Read();
        if (reader.GetInt64(1) != 0) return (null, "email_taken");
        if (reader.GetInt64(0) >= 500) return (null, "account_limit");
        reader.Close();
        using var insert = Command(db, "INSERT INTO DemoAccounts VALUES ($id,$email,$hash)",
            ("$id", account.Id), ("$email", email), ("$hash", hash));
        insert.Transaction = tx;
        insert.ExecuteNonQuery();
        tx.Commit();
        return (account, null);
    }

    public DemoAccount? Authenticate(string email, string password)
    {
        using var db = Open();
        using var command = Command(db, "SELECT Id, PasswordHash FROM DemoAccounts WHERE Email=$email", ("$email", email));
        using var reader = command.ExecuteReader();
        var found = reader.Read();
        var account = found ? new DemoAccount(reader.GetString(0), email) : dummy;
        var hash = found ? reader.GetString(1) : dummyHash;
        var valid = hasher.VerifyHashedPassword(account, hash, password) != PasswordVerificationResult.Failed;
        return found && valid ? account : null;
    }

    private static string HashToken(string token) =>
        Convert.ToHexString(SHA256.HashData(System.Text.Encoding.ASCII.GetBytes(token)));

    private static string? ReadToken(HttpContext context) =>
        context.Request.Cookies.TryGetValue(Cookie, out var token) &&
        token.Length == 64 && token.All(char.IsAsciiHexDigit) ? token : null;

    public void StartSession(HttpContext context, DemoAccount account)
    {
        var token = Convert.ToHexString(RandomNumberGenerator.GetBytes(32));
        var now = clock.GetUtcNow();
        var expires = now.AddHours(8);
        using var db = Open();
        using var tx = db.BeginTransaction(deferred: false);
        using var cleanup = Command(db, """
            DELETE FROM DemoSessions WHERE ExpiresAt <= $now OR TokenHash = $old;
            DELETE FROM DemoSessions WHERE AccountId = $id AND TokenHash NOT IN
                (SELECT TokenHash FROM DemoSessions WHERE AccountId = $id ORDER BY ExpiresAt DESC, rowid DESC LIMIT 4);
            """, ("$now", now.ToUnixTimeMilliseconds()),
            ("$old", ReadToken(context) is { } old ? HashToken(old) : ""), ("$id", account.Id));
        cleanup.Transaction = tx;
        cleanup.ExecuteNonQuery();
        using var insert = Command(db, "INSERT INTO DemoSessions VALUES ($hash,$id,$expires)",
            ("$hash", HashToken(token)), ("$id", account.Id), ("$expires", expires.ToUnixTimeMilliseconds()));
        insert.Transaction = tx;
        insert.ExecuteNonQuery();
        tx.Commit();
        context.Response.Cookies.Append(Cookie, token, CookieSettings(expires));
    }

    public DemoAccount? Current(HttpContext context)
    {
        if (ReadToken(context) is not { } token) return null;
        using var db = Open();
        using var command = Command(db, """
            SELECT a.Id,a.Email FROM DemoSessions s JOIN DemoAccounts a ON a.Id=s.AccountId
            WHERE s.TokenHash=$hash AND s.ExpiresAt>$now
            """, ("$hash", HashToken(token)), ("$now", clock.GetUtcNow().ToUnixTimeMilliseconds()));
        using var reader = command.ExecuteReader();
        return reader.Read() ? new(reader.GetString(0), reader.GetString(1)) : null;
    }

    public void EndSession(HttpContext context)
    {
        if (ReadToken(context) is { } token)
        {
            using var db = Open();
            using var command = Command(db, "DELETE FROM DemoSessions WHERE TokenHash=$hash", ("$hash", HashToken(token)));
            command.ExecuteNonQuery();
        }
        context.Response.Cookies.Delete(Cookie, CookieSettings());
    }

    private static CookieOptions CookieSettings(DateTimeOffset? expires = null) =>
        new() { HttpOnly = true, Secure = true, SameSite = SameSiteMode.Strict, Path = "/", Expires = expires };

    internal static string? NormalizeEmail(string? input)
    {
        var email = input?.Trim().ToLowerInvariant();
        if (email is null || email.Length > 254 || email.Any(c => !char.IsAscii(c) || char.IsControl(c)) ||
            !MailAddress.TryCreate(email, out var parsed) || parsed.Address != email) return null;
        var domain = parsed.Host;
        return domain.EndsWith(".test", StringComparison.Ordinal) ||
               domain.EndsWith(".invalid", StringComparison.Ordinal) ||
               domain.EndsWith(".example", StringComparison.Ordinal) ? email : null;
    }
}

internal static class AccountEndpoints
{
    public static void MapAccounts(this WebApplication app)
    {
        var auth = app.MapGroup("/api/auth");
        auth.MapPost("/register", (Credentials input, HttpContext context, AccountStore store) =>
        {
            var email = AccountStore.NormalizeEmail(input.Email);
            var errors = new Dictionary<string, string[]>();
            if (email is null) errors["email"] = ["Use a fictional email address, e.g. demo@example.test."];
            if (input.Password is not { Length: >= 12 and <= 128 } || string.IsNullOrWhiteSpace(input.Password))
                errors["password"] = ["Use a unique demo password of 12–128 characters."];
            if (errors.Count > 0)
                return Results.ValidationProblem(errors, extensions: new Dictionary<string, object?> { ["code"] = "validation_failed" });
            var result = store.Register(email!, input.Password!);
            if (result.Account is null)
                return result.Error == "email_taken"
                    ? Problem(409, "email_taken", "This demo email is already registered.")
                    : Problem(503, "account_limit", "The demo account limit has been reached.");

            store.StartSession(context, result.Account);
            return Results.Json(result.Account, statusCode: 201);
        }).RequireRateLimiting("accounts");

        auth.MapPost("/login", (Credentials input, HttpContext context, AccountStore store) =>
        {
            var email = AccountStore.NormalizeEmail(input.Email);
            var account = email is not null && input.Password is { Length: >= 12 and <= 128 }
                ? store.Authenticate(email, input.Password) : null;
            if (account is null) return Problem(401, "invalid_credentials", "Invalid email or password.");
            store.StartSession(context, account);
            return Results.Ok(account);
        }).RequireRateLimiting("accounts");

        auth.MapGet("/me", (HttpContext context, AccountStore store) =>
            store.Current(context) is { } account
                ? Results.Ok(account) : Problem(401, "not_authenticated", "Sign in to continue."));
        auth.MapPost("/logout", (HttpContext context, AccountStore store) =>
        {
            if (context.Request.Headers["X-Luma-Action"] != "logout")
                return Problem(400, "invalid_request", "Missing logout action header.");
            store.EndSession(context);
            return Results.NoContent();
        });
    }

    private static IResult Problem(int status, string code, string title) =>
        Results.Problem(statusCode: status, title: title,
            extensions: new Dictionary<string, object?> { ["code"] = code });
}
