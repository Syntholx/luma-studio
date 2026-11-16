using System.ComponentModel.DataAnnotations;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace LumaStudio.Api;

public sealed record OrderItemRequest(int VariantId, int Quantity);
public sealed record OrderRequest(string? CustomerName, string? Email, string? DeliveryMethodId,
    string? PickupPoint, OrderItemRequest?[]? Items);
public sealed record OrderLine(int ProductId, int VariantId, string Name, string Size,
    decimal UnitPrice, int Quantity, decimal LineTotal);
public sealed record OrderConfirmation(string OrderId, DateTimeOffset CreatedAt,
    DateTimeOffset ExpiresAt, bool IsDemo, string Currency, IReadOnlyList<OrderLine> Items,
    int TotalQuantity, decimal TotalPrice, string DeliveryMethodId, string DeliveryName,
    decimal DeliveryPrice, string? PickupPoint, decimal GrandTotal);
public sealed class OrderValidationException(Dictionary<string, string[]> errors, string code = "validation_failed") : Exception
{
    public Dictionary<string, string[]> Errors { get; } = errors;
    public string Code { get; } = code;
}

public static class Orders
{
    public static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public static OrderRequest Normalize(OrderRequest request)
    {
        var errors = new Dictionary<string, string[]>();
        var name = request.CustomerName?.Trim();
        var email = request.Email?.Trim();
        var pickup = request.PickupPoint?.Trim();
        if (string.IsNullOrEmpty(name) || name.Length > 80 || name.Any(char.IsControl))
            errors["customerName"] = ["Podaj fikcyjne imię (1–80 znaków)."];
        if (string.IsNullOrEmpty(email) || email.Length > 254 ||
            !new EmailAddressAttribute().IsValid(email) || email.Any(char.IsControl) ||
            !(email.EndsWith(".test", StringComparison.OrdinalIgnoreCase) ||
              email.EndsWith(".invalid", StringComparison.OrdinalIgnoreCase) ||
              email.EndsWith(".example", StringComparison.OrdinalIgnoreCase)))
            errors["email"] = ["Użyj fikcyjnego e-maila, np. demo@example.test."];
        if (request.DeliveryMethodId is not ("pickup" or "courier"))
            errors["deliveryMethodId"] = ["Wybierz obsługiwany sposób dostawy."];
        if (request.DeliveryMethodId == "pickup" &&
            (string.IsNullOrEmpty(pickup) || pickup.Length > 30 ||
             pickup.Any(c => !char.IsAsciiLetterOrDigit(c) && c != '-')))
            errors["pickupPoint"] = ["Podaj fikcyjny kod punktu: 1–30 liter, cyfr lub myślników."];
        if (request.DeliveryMethodId == "courier" && !string.IsNullOrEmpty(pickup))
            errors["pickupPoint"] = ["Dla kuriera kod punktu musi być pusty lub null."];
        if (request.Items is not { Length: >= 1 and <= 20 })
            errors["items"] = ["Zamówienie musi zawierać od 1 do 20 różnych wariantów."];
        else
        {
            for (var i = 0; i < request.Items.Length; i++)
            {
                var item = request.Items[i];
                if (item is null || item.VariantId <= 0 || item.Quantity is < 1 or > 10)
                    errors[$"items[{i}]"] = ["Podaj dodatni identyfikator wariantu i ilość od 1 do 10."];
            }
            if (request.Items.Where(i => i is not null).GroupBy(i => i!.VariantId).Any(g => g.Count() > 1))
                errors["items"] = ["Każdy wariant może wystąpić tylko raz; zsumuj ilości."];
        }
        if (errors.Count > 0) throw new OrderValidationException(errors);
        return request with { CustomerName = name, Email = email,
            PickupPoint = request.DeliveryMethodId == "pickup" ? pickup : null,
            Items = request.Items!.OrderBy(i => i!.VariantId).ToArray() };
    }

    public static string Fingerprint(OrderRequest request) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(JsonSerializer.Serialize(request, JsonOptions))));

    public static OrderConfirmation Price(OrderRequest request, DateTimeOffset now)
    {
        var lines = new List<OrderLine>();
        var errors = new Dictionary<string, string[]>();
        foreach (var item in request.Items!)
        {
            var product = Catalog.Products.FirstOrDefault(p => p.Variants.Any(v => v.Id == item!.VariantId));
            var variant = product?.Variants.FirstOrDefault(v => v.Id == item!.VariantId);
            if (product is null || variant is null || !variant.IsAvailable)
            {
                errors[$"variants.{item!.VariantId}"] = ["Wariant nie istnieje lub jest niedostępny. Odśwież katalog."];
                continue;
            }
            lines.Add(new(product.Id, variant.Id, product.Name, variant.Size,
                variant.Price, item!.Quantity, variant.Price * item.Quantity));
        }
        if (errors.Count > 0) throw new OrderValidationException(errors, "items_unavailable");
        var total = lines.Sum(l => l.LineTotal);
        var delivery = GetDeliveryPrice(total, request.DeliveryMethodId!);
        return new($"DEMO-{Guid.NewGuid():N}", now, now.AddHours(24), true, "PLN", lines,
            lines.Sum(l => l.Quantity), total, request.DeliveryMethodId!,
            request.DeliveryMethodId == "pickup" ? "Punkt odbioru" : "Kurier",
            delivery, request.PickupPoint, total + delivery);
    }

    public static decimal GetDeliveryPrice(decimal total, string method) =>
        total >= 200m ? 0m : method == "pickup" ? 9.99m : 14.99m;
}
