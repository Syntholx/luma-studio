import { afterEach, expect, test, vi } from "vitest";
import { getProducts } from "../services/products";
import { products } from "../products";

afterEach(() => {
  vi.unstubAllGlobals();
});

test("returns a valid catalogue", async () => {
  const fetchMock = vi
    .fn()
    .mockResolvedValue(new Response(JSON.stringify(products), { status: 200 }));
  vi.stubGlobal("fetch", fetchMock);

  const result = await getProducts();

  expect(result).toEqual(products);
  expect(fetchMock).toHaveBeenCalledWith("/api/products", {
    signal: undefined,
  });
});

test("rejects HTTP 500", async () => {
  const fetchMock = vi
    .fn()
    .mockResolvedValue(new Response(null, { status: 500 }));
  vi.stubGlobal("fetch", fetchMock);
  await expect(getProducts()).rejects.toThrow("Could not load products");
  expect(fetchMock).toHaveBeenCalledWith("/api/products", {
    signal: undefined,
  });
});

test("rejects an object instead of an array", async () => {
  const fetchMock = vi
    .fn()
    .mockResolvedValue(new Response(JSON.stringify(products[0])));
  vi.stubGlobal("fetch", fetchMock);
  await expect(getProducts()).rejects.toThrow("Invalid product data");
  expect(fetchMock).toHaveBeenCalledWith("/api/products", {
    signal: undefined,
  });
});

test("rejects an invalid variant price", async () => {
  const invalidProducts = [
    {
      ...products[0],
      variants: [{ ...products[0].variants[0], price: -10 }],
    },
  ];
  const fetchMock = vi
    .fn()
    .mockResolvedValue(new Response(JSON.stringify(invalidProducts)));
  vi.stubGlobal("fetch", fetchMock);
  await expect(getProducts()).rejects.toThrow("Invalid product data");
  expect(fetchMock).toHaveBeenCalledWith("/api/products", {
    signal: undefined,
  });
});

test("passes the abort signal to fetch", async () => {
  const abortController = new AbortController();
  const fetchMock = vi
    .fn()
    .mockResolvedValue(new Response(JSON.stringify(products), { status: 200 }));
  vi.stubGlobal("fetch", fetchMock);
  const result = await getProducts(abortController.signal);
  expect(result).toEqual(products);
  expect(fetchMock).toHaveBeenCalledWith("/api/products", {
    signal: abortController.signal,
  });
});
