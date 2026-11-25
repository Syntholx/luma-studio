import { expect, test } from "vitest";
import { getDeliveryPrice } from "../delivery";

test("Obliczenie kosztu dostawy, zachowuje koszt dostawy poniżej 200 ", () => {
  expect(getDeliveryPrice(199.99, 14.99)).toBe(14.99);
});

test("qualifies for free shipping at exactly €200", () => {
  expect(getDeliveryPrice(200, 14.99)).toBe(0);
});

test("Koszt produktu 200.01, zapewnia darmową dostawę powyżej 200", () => {
  expect(getDeliveryPrice(200.01, 14.99)).toBe(0);
});
