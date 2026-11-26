using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Xunit;

public sealed class AccountTests
{
    private const string Password = "only-a-demo-password";
    private const string Email = "demo@example.test";

    private static WebApplicationFactory<Program> CreateHost(DemoApiFactory factory, bool enabled = true) =>
        factory.WithWebHostBuilder(builder => builder.UseEnvironment("Production").ConfigureAppConfiguration((_, config) =>
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Accounts:Enabled"] = enabled.ToString(),
                ["Accounts:DatabasePath"] = Path.ChangeExtension(factory.DatabasePath, ".accounts.db"),
            })));

    private static HttpClient Client(WebApplicationFactory<Program> host) =>
        host.CreateClient(new WebApplicationFactoryClientOptions { BaseAddress = new Uri("https://localhost"), HandleCookies = false });

    private static string ReadCookie(HttpResponseMessage response) =>
        response.Headers.GetValues("Set-Cookie").Single().Split(';')[0];

    [Fact]
    public async Task Production_auth_is_disabled_without_opt_in()
    {
        using var factory = new DemoApiFactory();
        using var host = CreateHost(factory, enabled: false);
        using var client = Client(host);
        Assert.Equal(HttpStatusCode.NotFound, (await client.GetAsync("/api/auth/me")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/api/products")).StatusCode);
    }

    private static Task<HttpResponseMessage> WithSession(HttpClient client, string cookie, bool logout = false)
    {
        var request = new HttpRequestMessage(logout ? HttpMethod.Post : HttpMethod.Get,
            logout ? "/api/auth/logout" : "/api/auth/me");
        request.Headers.Add("Cookie", cookie);
        if (logout) request.Headers.Add("X-Luma-Action", "logout");
        return client.SendAsync(request);
    }

    [Fact]
    public async Task Registration_signs_in_and_logout_revokes_the_session()
    {
        using var factory = new DemoApiFactory();
        using var host = CreateHost(factory);
        using var client = Client(host);
        var registration = await client.PostAsJsonAsync("/api/auth/register", new { email = " DEMO@example.test ", password = Password });
        Assert.Equal(HttpStatusCode.Created, registration.StatusCode);
        var account = await registration.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(Email, account.GetProperty("email").GetString());
        Assert.Equal(2, account.EnumerateObject().Count());
        Assert.Equal("no-store", registration.Headers.CacheControl?.ToString());
        var header = registration.Headers.GetValues("Set-Cookie").Single();
        Assert.Contains("httponly", header, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("secure", header, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("samesite=strict", header, StringComparison.OrdinalIgnoreCase);
        var cookie = ReadCookie(registration);
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync("/api/auth/me")).StatusCode);
        var current = await WithSession(client, cookie);
        Assert.Equal(HttpStatusCode.OK, current.StatusCode);
        Assert.Equal(account.GetRawText(), await current.Content.ReadAsStringAsync());
        Assert.Equal(HttpStatusCode.BadRequest, (await client.PostAsync("/api/auth/logout", null)).StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, (await WithSession(client, cookie, logout: true)).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await WithSession(client, cookie)).StatusCode);
    }

    [Fact]
    public async Task Login_checks_credentials_and_sessions_expire()
    {
        using var factory = new DemoApiFactory();
        using var host = CreateHost(factory);
        using var client = Client(host);
        Assert.Equal(HttpStatusCode.Created, (await client.PostAsJsonAsync("/api/auth/register",
            new { email = Email, password = Password })).StatusCode);
        var wrong = await client.PostAsJsonAsync("/api/auth/login", new { email = Email, password = "incorrect-password" });
        var absent = await client.PostAsJsonAsync("/api/auth/login", new { email = "absent@example.test", password = "incorrect-password" });
        Assert.Equal(HttpStatusCode.Unauthorized, wrong.StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, absent.StatusCode);
        Assert.False(wrong.Headers.Contains("Set-Cookie"));
        Assert.False(absent.Headers.Contains("Set-Cookie"));
        var login = await client.PostAsJsonAsync("/api/auth/login", new { email = Email, password = Password });
        Assert.Equal(HttpStatusCode.OK, login.StatusCode);
        var cookie = ReadCookie(login);
        Assert.Equal(HttpStatusCode.OK, (await WithSession(client, cookie)).StatusCode);
        factory.Clock.Now = factory.Clock.Now.AddHours(8);
        Assert.Equal(HttpStatusCode.Unauthorized, (await WithSession(client, cookie)).StatusCode);
    }

    [Fact]
    public async Task Registration_validates_input_and_rejects_duplicate_emails()
    {
        using var factory = new DemoApiFactory();
        using var host = CreateHost(factory);
        using var client = Client(host);
        var invalid = await client.PostAsJsonAsync("/api/auth/register", new { email = "demo@example.com", password = "short" });
        Assert.Equal(HttpStatusCode.BadRequest, invalid.StatusCode);
        var problem = await invalid.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("validation_failed", problem.GetProperty("code").GetString());
        Assert.True(problem.GetProperty("errors").TryGetProperty("email", out _));
        Assert.True(problem.GetProperty("errors").TryGetProperty("password", out _));
        var credentials = new { email = Email, password = Password };
        Assert.Equal(HttpStatusCode.Created, (await client.PostAsJsonAsync("/api/auth/register", credentials)).StatusCode);
        var duplicate = await client.PostAsJsonAsync("/api/auth/register", credentials);
        Assert.Equal(HttpStatusCode.Conflict, duplicate.StatusCode);
        Assert.False(duplicate.Headers.Contains("Set-Cookie"));
    }

    [Fact]
    public async Task Authentication_attempts_are_rate_limited()
    {
        using var factory = new DemoApiFactory();
        using var host = CreateHost(factory);
        using var client = Client(host);
        for (var i = 0; i < 5; i++)
            Assert.Equal(HttpStatusCode.Unauthorized, (await client.PostAsJsonAsync("/api/auth/login",
                new { email = Email, password = Password })).StatusCode);
        var limited = await client.PostAsJsonAsync("/api/auth/register", new { email = Email, password = Password });
        Assert.Equal(HttpStatusCode.TooManyRequests, limited.StatusCode);
        Assert.NotNull(limited.Headers.RetryAfter);
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/api/products")).StatusCode);
    }
}
