import { afterEach, expect, test, vi } from "vitest";
import { getProducts } from "../services/products";
import { products } from "../products";

afterEach(() => {
  vi.unstubAllGlobals();
});

test("zwraca poprawny katalog z API", async () => {
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

test("odrzuca odpowiedź HTTP 500", async () => {
  const fetchMock = vi
    .fn()
    .mockResolvedValue(new Response(null, { status: 500 }));
  vi.stubGlobal("fetch", fetchMock);
  await expect(getProducts()).rejects.toThrow("Nie udało się pobrać produktów");
  expect(fetchMock).toHaveBeenCalledWith("/api/products", {
    signal: undefined,
  });
});

test("odrzuca obiekt zamiast tablicy produktów", async () => {
  const fetchMock = vi
    .fn()
    .mockResolvedValue(new Response(JSON.stringify(products[0])));
  vi.stubGlobal("fetch", fetchMock);
  await expect(getProducts()).rejects.toThrow("Nieprawidłowe dane produktów");
  expect(fetchMock).toHaveBeenCalledWith("/api/products", {
    signal: undefined,
  });
});

test("odrzuca produkt z nieprawidłową ceną wariantu", async () => {
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
  await expect(getProducts()).rejects.toThrow("Nieprawidłowe dane produktów");
  expect(fetchMock).toHaveBeenCalledWith("/api/products", {
    signal: undefined,
  });
});

test("przekazanie sygnały abbortowania do fetch", async () => {
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
