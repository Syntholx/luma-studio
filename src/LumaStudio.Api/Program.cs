using LumaStudio.Api;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.Diagnostics;
using System.Net;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddProblemDetails();
builder.WebHost.ConfigureKestrel(options => options.Limits.MaxRequestBodySize = 16 * 1024);
builder.Services.AddSingleton(TimeProvider.System);
builder.Services.AddSingleton<OrderStore>();
builder.Services.AddHostedService<OrderRetentionService>();
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor;
    options.ForwardLimit = 1;
    if (IPAddress.TryParse(builder.Configuration["Orders:KnownProxy"], out var proxy))
        options.KnownProxies.Add(proxy);
});
builder.Services.AddRateLimiter(options =>
{
    options.AddPolicy("orders", context => RateLimitPartition.GetFixedWindowLimiter(
        context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 5, Window = TimeSpan.FromMinutes(1), QueueLimit = 0,
            AutoReplenishment = true
        }));
    options.OnRejected = async (context, token) =>
    {
        var seconds = context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retry)
            ? Math.Max(1, (int)Math.Ceiling(retry.TotalSeconds)) : 60;
        context.HttpContext.Response.Headers.RetryAfter = seconds.ToString(System.Globalization.CultureInfo.InvariantCulture);
        await Results.Problem(statusCode: 429, title: "Zbyt wiele prób. Spróbuj później.",
            extensions: new Dictionary<string, object?> { ["code"] = "rate_limited" })
            .ExecuteAsync(context.HttpContext);
    };
});
var app = builder.Build();
app.UseExceptionHandler(errorApp => errorApp.Run(async context =>
{
    var exception = context.Features.Get<IExceptionHandlerFeature>()?.Error;
    var status = exception is BadHttpRequestException badRequest ? badRequest.StatusCode : 500;
    await Results.Problem(statusCode: status,
        title: status == 500 ? "Błąd serwera. Spróbuj ponownie z tym samym kluczem." : "Nieprawidłowe żądanie.",
        extensions: new Dictionary<string, object?> { ["code"] = status == 500 ? "server_error" : "invalid_request" })
        .ExecuteAsync(context);
}));
app.UseForwardedHeaders();
app.Use(async (context, next) =>
{
    if (context.Request.Path.StartsWithSegments("/api/orders"))
        context.Response.Headers.CacheControl = "no-store";
    await next();
});
app.UseStatusCodePages();
app.UseRateLimiter();
app.MapGet("/api/products", () => Results.Ok(Catalog.Products));
app.MapGet("/api/products/{slug}", (string slug) =>
{
    var product = Catalog.Products.FirstOrDefault(p =>
        string.Equals(p.Slug, slug, StringComparison.Ordinal));
    return product is null
        ? Results.Problem(statusCode: 404, title: "Product not found")
        : Results.Ok(product);
});
app.MapPost("/api/orders", (OrderRequest request, HttpContext context, OrderStore store) =>
{
    var header = context.Request.Headers["Idempotency-Key"];
    if (header.Count != 1 || !Guid.TryParseExact(header[0], "D", out var key))
        return Results.Problem(statusCode: 400, title: "Wymagany nagłówek Idempotency-Key w formacie UUID.",
            extensions: new Dictionary<string, object?> { ["code"] = "invalid_idempotency_key" });
    try
    {
        var normalized = Orders.Normalize(request);
        var result = store.Create(key.ToString("D"), normalized);
        if (result.Conflict)
            return Results.Problem(statusCode: 409, title: "Ten klucz został użyty dla innych danych zamówienia.",
                extensions: new Dictionary<string, object?> { ["code"] = "idempotency_conflict" });
        context.Response.Headers["Idempotency-Replayed"] = result.Replayed ? "true" : "false";
        return Results.Json(result.Confirmation, statusCode: result.Replayed ? 200 : 201);
    }
    catch (OrderValidationException exception)
    {
        return Results.ValidationProblem(exception.Errors, statusCode: exception.Code == "items_unavailable" ? 409 : 400,
            title: "Nie można zatwierdzić zamówienia demonstracyjnego.",
            extensions: new Dictionary<string, object?> { ["code"] = exception.Code });
    }
}).RequireRateLimiting("orders");
app.Run();
public partial class Program { }
