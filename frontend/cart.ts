import { products } from "./products";

export type CartItem = {
  productId: number;
  variantId: number;
  quantity: number;
};

export function parseCart(value: unknown): CartItem[] {
  if (!Array.isArray(value)) return [];
  const result: CartItem[] = [];
  for (const item of value) {
    if (typeof item !== "object" || item === null) continue;
    if (
      !Number.isInteger(item.productId) ||
      item.productId <= 0 ||
      !Number.isInteger(item.variantId) ||
      item.variantId <= 0 ||
      !Number.isInteger(item.quantity) ||
      item.quantity <= 0
    )
      continue;
    const product = products.find((product) => product.id === item.productId);
    if (product === undefined) continue;

    const variant = product.variants.find(
      (variant) => variant.id === item.variantId,
    );
    if (variant === undefined) continue;
    result.push({
      productId: product.id,
      variantId: variant.id,
      quantity: item.quantity,
    });
  }
  return result;
}

export function loadCart(): CartItem[] {
  try {
    const savedCart = localStorage.getItem("luma-studio-cart");
    if (savedCart === null) return [];
    return parseCart(JSON.parse(savedCart));
  } catch {
    return [];
  }
}

export function getCartTotal(items: CartItem[]): number {
  const totalPrice = items.reduce((sum, cartItem) => {
    const product = products.find(
      (product) => product.id === cartItem.productId,
    );
    if (product === undefined) return sum;

    const variant = product.variants.find(
      (variant) => variant.id === cartItem.variantId,
    );
    if (variant === undefined) return sum;

    return sum + variant.price * cartItem.quantity;
  }, 0);
  return totalPrice;
}

export function hasUnavailableCartItems(items: CartItem[]): boolean {
  const hasUnavailableItems = items.some((cartItem) => {
    const product = products.find(
      (product) => product.id === cartItem.productId,
    );
    if (product === undefined) return true;

    const variant = product.variants.find(
      (variants) => variants.id === cartItem.variantId,
    );
    if (variant === undefined) return true;
    return !variant.isAvailable;
  });
  return hasUnavailableItems;
}
