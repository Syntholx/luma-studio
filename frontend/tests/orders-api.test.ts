import { expect, test } from "vitest";
import { isOrderConfirmation } from "../services/orders";
import type { OrderConfirmation } from "../orders";
test("akceptuje poprawne potwierdzenie z darmową dostawą", () => {
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
  expect(isOrderConfirmation(confirmation)).toBe(true);
});
