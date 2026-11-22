import { afterEach, expect, test, vi } from "vitest";
import { createOrder, isOrderConfirmation } from "../services/orders";
import type { OrderConfirmation, OrderRequest } from "../orders";

afterEach(() => {
  vi.unstubAllGlobals();
});

const confirmation: OrderConfirmation = {
    isDemo: true,
    currency: "PLN",
    deliveryMethodId: "pickup",
    pickupPoint: "Demo001",
    createdAt: "2026-11-17T19:00:00Z",
    expiresAt: "2026-11-18T19:00:00Z",
    orderId: "DEMO-test",
    deliveryName: "pickup",
    totalQuantity: 3,
    totalPrice: 283.5,
    deliveryPrice: 0,
    grandTotal: 283.5,
    items: [
      {
        productId: 1,
        variantId: 202,
        quantity: 3,
        name: "Bransoletka Aura",
        size: "M",
        unitPrice: 94.5,
        lineTotal: 283.5,
      },
    ],
};

test("akceptuje poprawne potwierdzenie z darmową dostawą", () => {
  expect(isOrderConfirmation(confirmation)).toBe(true);
});

test("odrzucenie negatywnej odpowiedzi przy quantity 0", () => {
  const confirmation: OrderConfirmation = {
    isDemo: true,
    currency: "PLN",
    deliveryMethodId: "pickup",
    pickupPoint: "Demo001",
    createdAt: "2026-11-17T19:00:00Z",
    expiresAt: "2026-11-18T19:00:00Z",
    orderId: "DEMO-test",
    deliveryName: "pickup",
    totalQuantity: 3,
    totalPrice: 283.5,
    deliveryPrice: 0,
    grandTotal: 283.5,
    items: [
      {
        productId: 1,
        variantId: 202,
        quantity: 0,
        name: "Bransoletka Aura",
        size: "M",
        unitPrice: 94.5,
        lineTotal: 283.5,
      },
    ],
  };
  expect(isOrderConfirmation(confirmation)).toBe(false);
});

test("niepoprawna data odrzuca walidator", () => {
  const confirmation: OrderConfirmation = {
    isDemo: true,
    currency: "PLN",
    deliveryMethodId: "pickup",
    pickupPoint: "Demo001",
    createdAt: "niepoprawna-data",
    expiresAt: "2026-11-18T19:00:00Z",
    orderId: "DEMO-test",
    deliveryName: "pickup",
    totalQuantity: 3,
    totalPrice: 283.5,
    deliveryPrice: 0,
    grandTotal: 283.5,
    items: [
      {
        productId: 1,
        variantId: 202,
        quantity: 3,
        name: "Bransoletka Aura",
        size: "M",
        unitPrice: 94.5,
        lineTotal: 283.5,
      },
    ],
  };
  expect(isOrderConfirmation(confirmation)).toBe(false);
});

test("wysyła zamówienie z przekazanym kluczem i zwraca potwierdzenie po 201", async () => {
  const order: OrderRequest = {
    customerName: "Demo",
    email: "demo@example.test",
    deliveryMethodId: "pickup",
    pickupPoint: "Demo001",
    items: [{ variantId: 202, quantity: 3 }],
  };
  const idempotencyKey = "123e4567-e89b-42d3-a456-426614174000";
  const fetchMock = vi
    .fn()
    .mockResolvedValue(
      new Response(JSON.stringify(confirmation), { status: 201 }),
    );
  vi.stubGlobal("fetch", fetchMock);

  const result = await createOrder(order, idempotencyKey);

  expect(result).toEqual(confirmation);
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(fetchMock).toHaveBeenCalledWith("/api/orders", {
    method: "POST",
    body: JSON.stringify(order),
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
  });
});
