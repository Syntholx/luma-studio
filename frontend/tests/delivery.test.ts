import { expect, test } from "vitest";
import { getDeliveryPrice } from "../delivery";

test("charges for delivery below €200", () => {
  expect(getDeliveryPrice(199.99, 14.99)).toBe(14.99);
});

test("qualifies for free shipping at exactly €200", () => {
  expect(getDeliveryPrice(200, 14.99)).toBe(0);
});

test("qualifies for free shipping above €200", () => {
  expect(getDeliveryPrice(200.01, 14.99)).toBe(0);
});
