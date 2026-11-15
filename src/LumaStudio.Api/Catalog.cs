namespace LumaStudio.Api;

public sealed record ProductVariant(int Id, string Size, decimal Price, bool IsAvailable);
public sealed record Product(int Id, string Name, string Category, decimal Price,
    string Description, string Slug, string ImageUrl, string ImageAlt,
    IReadOnlyList<ProductVariant> Variants);

public static class Catalog
{
    public static IReadOnlyList<Product> Products { get; } = Array.AsReadOnly<Product>([
        new(2, "Naszyjnik Sol", "Naszyjniki", 122m,
            "Subtelny naszyjnik inspirowany ciepłem słońca.", "naszyjnik-sol",
            "/images/products/naszyjnik-sol.webp",
            "Naszyjnik Sol z delikatnym złotym łańcuszkiem i zawieszką w kształcie słońca",
            Array.AsReadOnly<ProductVariant>([new(201, "Uniwersalny", 122m, true)])),
        new(1, "Bransoletka Aura", "Bransoletki", 89.5m,
            "Delikatna bransoletka z kolorowych koralików.", "bransoletka-aura",
            "/images/products/bransoletka-aura.webp",
            "Bransoletka Aura z kolorowych koralików i złotych przekładek",
            Array.AsReadOnly<ProductVariant>([
                new(204, "S", 89.5m, true), new(202, "M", 94.5m, true),
                new(203, "L", 89.5m, false)])),
        new(3, "Kolczyki Luna", "Kolczyki", 109m,
            "Lekkie kolczyki na co dzień i wyjątkowe okazje.", "kolczyki-luna",
            "/images/products/kolczyki-luna.webp",
            "Kolczyki Luna ze złotymi biglami i kremowymi zawieszkami w kształcie półksiężyców",
            Array.AsReadOnly<ProductVariant>([new(205, "Uniwersalny", 109m, true)]))
    ]);
}
