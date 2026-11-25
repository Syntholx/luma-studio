namespace LumaStudio.Api;

public sealed record ProductVariant(int Id, string Size, decimal Price, bool IsAvailable);
public sealed record Product(int Id, string Name, string Category, decimal Price,
    string Description, string Slug, string ImageUrl, string ImageAlt,
    IReadOnlyList<ProductVariant> Variants);

public static class Catalog
{
    public static IReadOnlyList<Product> Products { get; } = Array.AsReadOnly<Product>([
        new(2, "Sol Necklace", "Necklaces", 122m,
            "A delicate necklace inspired by the warmth of the sun.", "naszyjnik-sol",
            "/images/products/naszyjnik-sol.webp",
            "Sol necklace with a fine gold chain and sun pendant",
            Array.AsReadOnly<ProductVariant>([new(201, "One size", 122m, true)])),
        new(1, "Aura Bracelet", "Bracelets", 89.5m,
            "A delicate bracelet made with colourful beads.", "bransoletka-aura",
            "/images/products/bransoletka-aura.webp",
            "Aura bracelet with colourful beads and gold spacers",
            Array.AsReadOnly<ProductVariant>([
                new(204, "S", 89.5m, true), new(202, "M", 94.5m, true),
                new(203, "L", 89.5m, false)])),
        new(3, "Luna Earrings", "Earrings", 109m,
            "Lightweight earrings for everyday wear and special occasions.", "kolczyki-luna",
            "/images/products/kolczyki-luna.webp",
            "Luna earrings with gold hooks and cream crescent moon pendants",
            Array.AsReadOnly<ProductVariant>([new(205, "One size", 109m, true)]))
    ]);
}
