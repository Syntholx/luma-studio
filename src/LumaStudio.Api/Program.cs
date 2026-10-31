using LumaStudio.Api;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddProblemDetails();
var app = builder.Build();
app.UseExceptionHandler();
app.MapGet("/api/products", () => Results.Ok(Catalog.Products));
app.MapGet("/api/products/{slug}", (string slug) =>
{
    var product = Catalog.Products.FirstOrDefault(p =>
        string.Equals(p.Slug, slug, StringComparison.Ordinal));
    return product is null
        ? Results.Problem(statusCode: 404, title: "Product not found")
        : Results.Ok(product);
});
app.Run();
public partial class Program { }
