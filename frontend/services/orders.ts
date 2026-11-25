import type { OrderLine, OrderRequest } from "../orders";
import type { OrderConfirmation } from "../orders";
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function isOrderLine(value: unknown): value is OrderLine {
  if (!isRecord(value)) {
    return false;
  }
  return (
    typeof value.productId === "number" &&
    Number.isInteger(value.productId) &&
    value.productId > 0 &&
    typeof value.variantId === "number" &&
    Number.isInteger(value.variantId) &&
    value.variantId > 0 &&
    typeof value.quantity === "number" &&
    Number.isInteger(value.quantity) &&
    value.quantity >= 1 &&
    value.quantity <= 10 &&
    typeof value.name === "string" &&
    value.name.trim().length > 0 &&
    typeof value.size === "string" &&
    value.size.trim().length > 0 &&
    typeof value.unitPrice === "number" &&
    Number.isFinite(value.unitPrice) &&
    value.unitPrice >= 0 &&
    typeof value.lineTotal === "number" &&
    Number.isFinite(value.lineTotal) &&
    value.lineTotal >= 0
  );
}
export function isOrderConfirmation(
  value: unknown,
): value is OrderConfirmation {
  if (!isRecord(value)) {
    return false;
  }
  return (
    value.isDemo === true &&
    value.currency === "EUR" &&
    (value.deliveryMethodId === "pickup" ||
      value.deliveryMethodId === "courier") &&
    (typeof value.pickupPoint === "string" || value.pickupPoint === null) &&
    typeof value.orderId === "string" &&
    value.orderId.trim().length > 0 &&
    typeof value.deliveryName === "string" &&
    value.deliveryName.trim().length > 0 &&
    typeof value.totalQuantity === "number" &&
    Number.isInteger(value.totalQuantity) &&
    value.totalQuantity > 0 &&
    typeof value.totalPrice === "number" &&
    Number.isFinite(value.totalPrice) &&
    value.totalPrice >= 0 &&
    typeof value.deliveryPrice === "number" &&
    Number.isFinite(value.deliveryPrice) &&
    value.deliveryPrice >= 0 &&
    typeof value.grandTotal === "number" &&
    Number.isFinite(value.grandTotal) &&
    value.grandTotal >= 0 &&
    typeof value.createdAt === "string" &&
    Number.isFinite(Date.parse(value.createdAt)) &&
    typeof value.expiresAt === "string" &&
    Number.isFinite(Date.parse(value.expiresAt)) &&
    Array.isArray(value.items) &&
    value.items.length >= 1 &&
    value.items.length <= 20 &&
    value.items.every(isOrderLine)
  );
}

export async function createOrder(
  order: OrderRequest,
  idempotencyKey: string,
): Promise<OrderConfirmation> {
  const orderResponse = await fetch("/api/orders", {
    method: "POST",
    body: JSON.stringify(order),
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
  });
  if (orderResponse.status === 201 || orderResponse.status === 200) {
    const data: unknown = await orderResponse.json();
    if (!isOrderConfirmation(data)) {
      throw new Error("Invalid order confirmation.");
    }
    return data;
  }
  throw new Error("Could not place your order");
}
