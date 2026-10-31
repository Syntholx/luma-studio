using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

public sealed class CatalogTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient client;
    public CatalogTests(WebApplicationFactory<Program> factory) => client = factory.CreateClient();

    [Fact]
    public async Task List_preserves_contract()
    {
        var response = await client.GetAsync("/api/products");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("application/json", response.Content.Headers.ContentType?.MediaType);
        var products = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(3, products.GetArrayLength());
        Assert.Equal(new[] { 2, 1, 3 }, products.EnumerateArray().Select(p => p.GetProperty("id").GetInt32()));
        foreach (var product in products.EnumerateArray())
        {
            Assert.Equal(new[] { "category", "description", "id", "name", "price", "slug", "variants" },
                product.EnumerateObject().Select(p => p.Name).Order());
            Assert.Equal(JsonValueKind.Number, product.GetProperty("price").ValueKind);
            foreach (var variant in product.GetProperty("variants").EnumerateArray())
                Assert.Equal(new[] { "id", "isAvailable", "price", "size" },
                    variant.EnumerateObject().Select(p => p.Name).Order());
        }
    }

    [Theory]
    [InlineData("naszyjnik-sol", 2)]
    [InlineData("bransoletka-aura", 1)]
    [InlineData("kolczyki-luna", 3)]
    public async Task Details_match_list(string slug, int id)
    {
        var list = await client.GetFromJsonAsync<JsonElement>("/api/products");
        var detail = await client.GetFromJsonAsync<JsonElement>($"/api/products/{slug}");
        Assert.Equal(id, detail.GetProperty("id").GetInt32());
        Assert.Equal(list.EnumerateArray().Single(p => p.GetProperty("id").GetInt32() == id).GetRawText(), detail.GetRawText());
    }

    [Fact]
    public async Task Aura_preserves_variants()
    {
        var product = await client.GetFromJsonAsync<JsonElement>("/api/products/bransoletka-aura");
        var variants = product.GetProperty("variants").EnumerateArray().ToArray();
        Assert.Equal(new[] { 204, 202, 203 }, variants.Select(v => v.GetProperty("id").GetInt32()));
        Assert.Equal(new[] { 89.5m, 94.5m, 89.5m }, variants.Select(v => v.GetProperty("price").GetDecimal()));
        Assert.Equal(new[] { true, true, false }, variants.Select(v => v.GetProperty("isAvailable").GetBoolean()));
    }

    [Fact]
    public async Task Missing_slug_returns_problem()
    {
        var response = await client.GetAsync("/api/products/missing");
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
        var problem = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(404, problem.GetProperty("status").GetInt32());
    }

    [Fact]
    public async Task Writes_are_not_supported()
    {
        var response = await client.PostAsJsonAsync("/api/products", new { name = "Unexpected" });
        Assert.Equal(HttpStatusCode.MethodNotAllowed, response.StatusCode);
    }
}
