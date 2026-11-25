import type { Product } from "../products";
import type { ProductVariant } from "../products";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isProductVariant(value: unknown): value is ProductVariant {
  if (!isRecord(value)) {
    return false;
  }
  return (
    typeof value.id === "number" &&
    Number.isInteger(value.id) &&
    value.id > 0 &&
    typeof value.size === "string" &&
    value.size.trim().length > 0 &&
    typeof value.price === "number" &&
    Number.isFinite(value.price) &&
    value.price >= 0 &&
    typeof value.isAvailable === "boolean"
  );
}
function isProduct(value: unknown): value is Product {
  if (!isRecord(value)) {
    return false;
  }
  return (
    typeof value.id === "number" &&
    Number.isInteger(value.id) &&
    value.id > 0 &&
    typeof value.name === "string" &&
    value.name.trim().length > 0 &&
    typeof value.category === "string" &&
    value.category.trim().length > 0 &&
    typeof value.description === "string" &&
    value.description.trim().length > 0 &&
    typeof value.slug === "string" &&
    value.slug.trim().length > 0 &&
    typeof value.price === "number" &&
    Number.isFinite(value.price) &&
    value.price >= 0 &&
    Array.isArray(value.variants) &&
    value.variants.length > 0 &&
    value.variants.every(isProductVariant) &&
    typeof value.imageUrl === "string" &&
    value.imageUrl.trim().length > 0 &&
    typeof value.imageAlt === "string" &&
    value.imageAlt.trim().length > 0
  );
}

export async function getProducts(signal?: AbortSignal): Promise<Product[]> {
  const productResponse = await fetch("/api/products", { signal });
  if (!productResponse.ok) {
    throw new Error("Could not load products.");
  }
  const productsData: unknown = await productResponse.json();
  if (!Array.isArray(productsData)) {
    throw new Error("Invalid product data.");
  }
  if (!productsData.every(isProduct)) {
    throw new Error("Invalid product data.");
  }
  return productsData;
}
