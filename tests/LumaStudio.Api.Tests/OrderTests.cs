using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using LumaStudio.Api;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

public sealed class DemoApiFactory : WebApplicationFactory<Program>
{
    public string DatabasePath { get; } = Path.Combine(Path.GetTempPath(), "luma-order-tests", Guid.NewGuid().ToString("N"), "orders.db");
    public TestClock Clock { get; } = new();
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureAppConfiguration((_, config) => config.AddInMemoryCollection(
            new Dictionary<string, string?> { ["Orders:DatabasePath"] = DatabasePath }));
        builder.ConfigureServices(services =>
        {
            services.AddSingleton<TimeProvider>(Clock);
            services.AddSingleton<IStartupFilter, UntrustedPeerFilter>();
        });
    }
}

public sealed class UntrustedPeerFilter : IStartupFilter
{
    public Action<Microsoft.AspNetCore.Builder.IApplicationBuilder> Configure(Action<Microsoft.AspNetCore.Builder.IApplicationBuilder> next) => app =>
    {
        app.Use((context, continuation) =>
        {
            context.Connection.RemoteIpAddress = IPAddress.Parse("192.0.2.10");
            return continuation(context);
        });
        next(app);
    };
}

public sealed class TestClock : TimeProvider
{
    public DateTimeOffset Now { get; set; } = new(2026, 11, 16, 20, 0, 0, TimeSpan.Zero);
    public override DateTimeOffset GetUtcNow() => Now;
}

public sealed class OrderTests
{
    [Theory]
    [InlineData(199.99, "pickup", 9.99)]
    [InlineData(199.99, "courier", 14.99)]
    [InlineData(200, "pickup", 0)]
    [InlineData(200, "courier", 0)]
    public void Delivery_threshold_is_inclusive(decimal total, string method, decimal expected) =>
        Assert.Equal(expected, Orders.GetDeliveryPrice(total, method));

    private static OrderRequest Valid(int quantity = 1, int variant = 202, string delivery = "pickup") =>
        new("  Demo  ", " demo@example.test ", delivery, delivery == "pickup" ? "  DEMO01  " : null,
            [new(variant, quantity)]);

    private static Task<HttpResponseMessage> Send(HttpClient client, object body, string? key = null)
    {
        var request = new HttpRequestMessage(HttpMethod.Post, "/api/orders") { Content = JsonContent.Create(body) };
        request.Headers.Add("Idempotency-Key", key ?? Guid.NewGuid().ToString("D"));
        return client.SendAsync(request);
    }

    [Theory]
    [InlineData(1, "pickup", 94.5, 9.99, 104.49)]
    [InlineData(1, "courier", 94.5, 14.99, 109.49)]
    [InlineData(3, "courier", 283.5, 0, 283.5)]
    public async Task Creates_authoritative_summary(int quantity, string delivery, decimal total, decimal fee, decimal grand)
    {
        using var factory = new DemoApiFactory();
        using var client = factory.CreateClient();
        var response = await Send(client, Valid(quantity, delivery: delivery));
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        Assert.Equal("no-store", response.Headers.CacheControl?.ToString());
        var order = (await response.Content.ReadFromJsonAsync<OrderConfirmation>())!;
        Assert.True(order.IsDemo);
        Assert.StartsWith("DEMO-", order.OrderId);
        Assert.Equal("PLN", order.Currency);
        Assert.Equal(total, order.TotalPrice);
        Assert.Equal(fee, order.DeliveryPrice);
        Assert.Equal(grand, order.GrandTotal);
        Assert.Equal(quantity, order.TotalQuantity);
        Assert.Equal(94.5m, Assert.Single(order.Items).UnitPrice);
        Assert.Equal(delivery == "pickup" ? "DEMO01" : null, order.PickupPoint);
        Assert.Equal(TimeSpan.FromHours(24), order.ExpiresAt - order.CreatedAt);
        var json = await response.Content.ReadAsStringAsync();
        Assert.DoesNotContain("email", json, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("customerName", json);
    }

    [Fact]
    public async Task Ignores_client_supplied_prices()
    {
        using var factory = new DemoApiFactory();
        using var client = factory.CreateClient();
        var response = await Send(client, new { customerName = "Demo", email = "demo@example.test",
            deliveryMethodId = "courier", totalPrice = 0, deliveryPrice = 0,
            items = new[] { new { variantId = 202, quantity = 1, price = 0 } } });
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        Assert.Equal(109.49m, (await response.Content.ReadFromJsonAsync<OrderConfirmation>())!.GrandTotal);
    }

    [Theory]
    [InlineData(203)]
    [InlineData(999)]
    public async Task Rejects_missing_or_unavailable_variant(int variant)
    {
        using var factory = new DemoApiFactory();
        using var client = factory.CreateClient();
        var response = await Send(client, Valid(variant: variant));
        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        var problem = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("items_unavailable", problem.GetProperty("code").GetString());
        Assert.True(problem.GetProperty("errors").TryGetProperty($"variants.{variant}", out _));
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    [InlineData(11)]
    public async Task Rejects_invalid_quantity(int quantity)
    {
        using var factory = new DemoApiFactory();
        var response = await Send(factory.CreateClient(), Valid(quantity));
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Theory]
    [InlineData("name")]
    [InlineData("email")]
    [InlineData("delivery")]
    [InlineData("pickup")]
    [InlineData("courierPickup")]
    [InlineData("empty")]
    [InlineData("null")]
    [InlineData("duplicates")]
    [InlineData("tooMany")]
    public async Task Rejects_invalid_request(string scenario)
    {
        using var factory = new DemoApiFactory();
        var body = Valid();
        body = scenario switch
        {
            "name" => body with { CustomerName = "  " },
            "email" => body with { Email = "real@example.com" },
            "delivery" => body with { DeliveryMethodId = "unknown" },
            "pickup" => body with { PickupPoint = " " },
            "courierPickup" => body with { DeliveryMethodId = "courier" },
            "empty" => body with { Items = [] },
            "null" => body with { Items = [null] },
            "duplicates" => body with { Items = [new(202, 1), new(202, 1)] },
            "tooMany" => body with { Items = Enumerable.Range(1, 21).Select(id => new OrderItemRequest(id, 1)).ToArray() },
            _ => throw new InvalidOperationException()
        };
        var response = await Send(factory.CreateClient(), body);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
    }

    [Fact]
    public async Task Requires_uuid_key_and_rejects_malformed_json()
    {
        using var factory = new DemoApiFactory();
        using var client = factory.CreateClient();
        Assert.Equal(HttpStatusCode.BadRequest, (await client.PostAsJsonAsync("/api/orders", Valid())).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await Send(client, Valid(), "wrong")).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await client.PostAsync("/api/orders",
            new StringContent("{broken", Encoding.UTF8, "application/json"))).StatusCode);
    }

    [Fact]
    public async Task Replays_same_payload_and_rejects_changed_payload()
    {
        using var factory = new DemoApiFactory();
        using var client = factory.CreateClient();
        var key = Guid.NewGuid().ToString("D");
        var first = await Send(client, Valid(), key);
        var replay = await Send(client, Valid() with { PickupPoint = "DEMO01", CustomerName = "Demo" }, key);
        Assert.Equal(HttpStatusCode.Created, first.StatusCode);
        Assert.Equal(HttpStatusCode.OK, replay.StatusCode);
        Assert.Equal("true", replay.Headers.GetValues("Idempotency-Replayed").Single());
        Assert.Equal(await first.Content.ReadAsStringAsync(), await replay.Content.ReadAsStringAsync());
        var conflict = await Send(client, Valid(2), key);
        Assert.Equal(HttpStatusCode.Conflict, conflict.StatusCode);
        Assert.Equal("idempotency_conflict", (await conflict.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("code").GetString());
    }

    [Fact]
    public async Task Concurrent_retries_create_only_one_row()
    {
        using var factory = new DemoApiFactory();
        using var client = factory.CreateClient();
        var key = Guid.NewGuid().ToString("D");
        var results = await Task.WhenAll(Enumerable.Range(0, 4).Select(_ => Send(client, Valid(), key)));
        Assert.Single(results, r => r.StatusCode == HttpStatusCode.Created);
        Assert.Equal(3, results.Count(r => r.StatusCode == HttpStatusCode.OK));
        Assert.Single((await Task.WhenAll(results.Select(r => r.Content.ReadAsStringAsync()))).Distinct());
        using var connection = new SqliteConnection($"Data Source={factory.DatabasePath}");
        connection.Open();
        using var command = connection.CreateCommand();
        command.CommandText = "SELECT COUNT(*) FROM DemoOrders";
        Assert.Equal(1L, command.ExecuteScalar());
    }

    [Fact]
    public async Task Rate_limit_cannot_be_bypassed_by_untrusted_forwarded_header()
    {
        using var factory = new DemoApiFactory();
        using var client = factory.CreateClient();
        for (var i = 0; i < 5; i++)
        {
            client.DefaultRequestHeaders.Remove("X-Forwarded-For");
            client.DefaultRequestHeaders.Add("X-Forwarded-For", $"198.51.100.{i + 1}");
            Assert.Equal(HttpStatusCode.Created, (await Send(client, Valid())).StatusCode);
        }
        var limited = await Send(client, Valid());
        Assert.Equal(HttpStatusCode.TooManyRequests, limited.StatusCode);
        Assert.NotNull(limited.Headers.RetryAfter);
        Assert.Equal("rate_limited", (await limited.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("code").GetString());
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/api/products")).StatusCode);
    }

    [Fact]
    public async Task Trusted_proxy_partitions_limit_by_forwarded_client_ip()
    {
        using var factory = new DemoApiFactory();
        using var host = factory.WithWebHostBuilder(builder => builder.ConfigureAppConfiguration((_, config) =>
            config.AddInMemoryCollection(new Dictionary<string, string?> { ["Orders:KnownProxy"] = "192.0.2.10" })));
        using var client = host.CreateClient();
        for (var i = 0; i < 6; i++)
        {
            client.DefaultRequestHeaders.Remove("X-Forwarded-For");
            client.DefaultRequestHeaders.Add("X-Forwarded-For", $"198.51.100.{i + 1}");
            Assert.Equal(HttpStatusCode.Created, (await Send(client, Valid())).StatusCode);
        }
    }

    [Fact]
    public async Task Persistence_survives_new_store_and_expired_rows_are_deleted_without_traffic()
    {
        using var factory = new DemoApiFactory();
        using var client = factory.CreateClient();
        var key = Guid.NewGuid().ToString("D");
        var first = (await Send(client, Valid(), key));
        var env = factory.Services.GetRequiredService<Microsoft.Extensions.Hosting.IHostEnvironment>();
        var config = factory.Services.GetRequiredService<IConfiguration>();
        var store = new OrderStore(config, env, factory.Clock);
        var replay = store.Create(key, Orders.Normalize(Valid()));
        Assert.True(replay.Replayed);
        Assert.Equal(await first.Content.ReadAsStringAsync(), JsonSerializer.Serialize(replay.Confirmation, Orders.JsonOptions));
        factory.Clock.Now = factory.Clock.Now.AddHours(24);
        store.PurgeExpired();
        using var connection = new SqliteConnection($"Data Source={factory.DatabasePath}");
        connection.Open();
        using var command = connection.CreateCommand();
        command.CommandText = "SELECT COUNT(*) FROM DemoOrders";
        Assert.Equal(0L, command.ExecuteScalar());
        Assert.False(store.Create(key, Orders.Normalize(Valid())).Replayed);
    }

    [Fact]
    public async Task No_public_order_read_endpoint()
    {
        using var factory = new DemoApiFactory();
        using var client = factory.CreateClient();
        Assert.Equal(HttpStatusCode.MethodNotAllowed, (await client.GetAsync("/api/orders")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await client.GetAsync("/api/orders/DEMO-anything")).StatusCode);
    }
}
