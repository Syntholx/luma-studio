import { expect, test } from "vitest";
import { getCartTotal, parseCart } from "../cart";
import { hasUnavailableCartItems } from "../cart";
import { products } from "../products";

test("returns an empty cart for null", () => {
  expect(parseCart(null)).toEqual([]);
});

test("keeps a valid cart item", () => {
  expect(parseCart([{ productId: 1, variantId: 204, quantity: 2 }])).toEqual([
    { productId: 1, variantId: 204, quantity: 2 },
  ]);
});

test("rejects negative quantities", () => {
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

test("keeps structurally valid entries without checking the catalogue", () => {
  expect(
    parseCart([
      {
        productId: 1,
        variantId: 205,
        quantity: 1,
      },
    ]),
  ).toEqual([{ productId: 1, variantId: 205, quantity: 1 }]);
});

test("keeps valid entries and skips invalid ones", () => {
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

test("totals variant prices using quantities", () => {
  expect(
    getCartTotal(
      [
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
      ],
      products,
    ),
  ).toBeCloseTo(273.5, 2);
});

test("detects an unavailable variant", () => {
  expect(
    hasUnavailableCartItems(
      [
        {
          productId: 1,
          variantId: 203,
          quantity: 1,
        },
      ],
      products,
    ),
  ).toBe(true);
});
test("allows available variants", () => {
  expect(
    hasUnavailableCartItems(
      [
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
      ],
      products,
    ),
  ).toBe(false);
});

test("blocks a variant belonging to another product", () => {
  expect(
    hasUnavailableCartItems(
      [
        {
          productId: 1,
          variantId: 205,
          quantity: 1,
        },
      ],
      products,
    ),
  ).toBe(true);
});

test("detects an unavailable variant in a mixed cart", () => {
  expect(
    hasUnavailableCartItems(
      [
        {
          productId: 1,
          variantId: 204,
          quantity: 1,
        },
        {
          productId: 1,
          variantId: 203,
          quantity: 1,
        },
      ],
      products,
    ),
  ).toBe(true);
});
