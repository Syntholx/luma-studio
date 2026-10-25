import { expect, test } from "vitest";
import { getCartTotal, parseCart } from "../cart";
import { hasUnavailableCartItems } from "../cart";

test("zwraca pusty koszyk dla null", () => {
  expect(parseCart(null)).toEqual([]);
});

test("zachowuje poprawną pozycje koszyka", () => {
  expect(parseCart([{ productId: 1, variantId: 204, quantity: 2 }])).toEqual([
    { productId: 1, variantId: 204, quantity: 2 },
  ]);
});

test("odrzuca pozycje z ujemną ilością", () => {
  expect(
    parseCart([
      {
        productId: 1,
        variantId: 204,
        quantity: -2,
      },
    ]),
  ).toEqual([]);
});

test("odrzuca wariant niepasujący do produktu", () => {
  expect(
    parseCart([
      {
        productId: 1,
        variantId: 205,
        quantity: 1,
      },
    ]),
  ).toEqual([]);
});

test("zachowuje poprawne wpisy i pomija błędne", () => {
  expect(
    parseCart([
      {
        productId: 1,
        variantId: 204,
        quantity: 2,
      },
      {
        productId: 3,
        variantId: 205,
        quantity: -1,
      },
    ]),
  ).toEqual([{ productId: 1, variantId: 204, quantity: 2 }]);
});

test("sumuje ceny wariantów z uwzględnieniem ilości", () => {
  expect(
    getCartTotal([
      {
        productId: 1,
        variantId: 204,
        quantity: 2,
      },
      {
        productId: 1,
        variantId: 202,
        quantity: 1,
      },
    ]),
  ).toBeCloseTo(273.5, 2);
});

test("wykrywa niedostępny wariant w koszyku", () => {
  expect(
    hasUnavailableCartItems([
      {
        productId: 1,
        variantId: 203,
        quantity: 1,
      },
    ]),
  ).toBe(true);
});
test("Nie blokuje dostępnych wariantów", () => {
  expect(
    hasUnavailableCartItems([
      {
        productId: 1,
        variantId: 204,
        quantity: 2,
      },
      {
        productId: 3,
        variantId: 205,
        quantity: 1,
      },
    ]),
  ).toBe(false);
});

test("blokuje wariant niepasujący do produktu", () => {
  expect(
    hasUnavailableCartItems([
      {
        productId: 1,
        variantId: 205,
        quantity: 1,
      },
    ]),
  ).toBe(true);
});
