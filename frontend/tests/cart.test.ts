import { expect, test } from "vitest";
import { parseCart } from "../cart";

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
