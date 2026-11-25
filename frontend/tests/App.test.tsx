import { expect, test, vi } from "vitest";
import { render, act, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { App } from "../App";
import { afterEach } from "vitest";
import { StrictMode } from "react";
import { products } from "../products";
import userEvent from "@testing-library/user-event";

afterEach(() => {
  vi.unstubAllGlobals();
});

test("odmotowanie App podczas trwającego pobierania, które anuluje", () => {
  const pendingResponse = new Promise<Response>(() => {});
  const fetchMock = vi.fn<typeof fetch>().mockReturnValue(pendingResponse);
  vi.stubGlobal("fetch", fetchMock);
  const { unmount } = render(
    <MemoryRouter>
      <App />
    </MemoryRouter>,
  );
  const signal = fetchMock.mock.calls[0]?.[1]?.signal;
  expect(signal).toBeInstanceOf(AbortSignal);
  expect(signal?.aborted).toBe(false);
  unmount();
  expect(signal?.aborted).toBe(true);
});

test("starsza odpowiedź nie nadpisuje nowszego katalogu", async () => {
  let finishFirst!: (response: Response) => void;
  let finishSecond!: (response: Response) => void;
  const firstResponse = new Promise<Response>((resolve) => {
    finishFirst = resolve;
  });
  const secondResponse = new Promise<Response>((resolve) => {
    finishSecond = resolve;
  });
  const fetchMock = vi
    .fn<typeof fetch>()
    .mockReturnValueOnce(firstResponse)
    .mockReturnValueOnce(secondResponse);

  vi.stubGlobal("fetch", fetchMock);
  render(
    <StrictMode>
      <MemoryRouter>
        <App />
      </MemoryRouter>
    </StrictMode>,
  );
  expect(fetchMock).toHaveBeenCalledTimes(2);
  await act(async () => {
    finishSecond(
      new Response(
        JSON.stringify([{ ...products[0], name: "Nowszy produkt" }]),
      ),
    );
  });
  expect(
    screen.getByRole("heading", { name: "Nowszy produkt" }),
  ).toBeInTheDocument();
  await act(async () => {
    finishFirst(
      new Response(
        JSON.stringify([{ ...products[0], name: "Starszy produkt" }]),
      ),
    );
  });
  expect(
    screen.getByRole("heading", { name: "Nowszy produkt" }),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("heading", { name: "Starszy produkt" }),
  ).not.toBeInTheDocument();
});
test("spóźniony error, nie zasłania nowszego katalogu", async () => {
  let firstFinish!: (response: Response) => void;
  let secondFinish!: (response: Response) => void;
  const firstResponse = new Promise<Response>((resolve) => {
    firstFinish = resolve;
  });
  const secondResponse = new Promise<Response>((resolve) => {
    secondFinish = resolve;
  });

  const fetchMock = vi
    .fn<typeof fetch>()
    .mockReturnValueOnce(firstResponse)
    .mockReturnValueOnce(secondResponse);
  vi.stubGlobal("fetch", fetchMock);
  render(
    <StrictMode>
      <MemoryRouter>
        <App />
      </MemoryRouter>
    </StrictMode>,
  );
  expect(fetchMock).toHaveBeenCalledTimes(2);
  await act(async () => {
    secondFinish(
      new Response(
        JSON.stringify([{ ...products[0], name: "Nowszy produkt" }]),
      ),
    );
  });
  expect(
    screen.getByRole("heading", { name: "Nowszy produkt" }),
  ).toBeInTheDocument();
  await act(async () => {
    firstFinish(new Response(null, { status: 500 }));
  });

  expect(
    screen.getByRole("heading", { name: "Nowszy produkt" }),
  ).toBeInTheDocument();
  expect(
    screen.queryByText("Could not load the catalogue. Please try again."),
  ).not.toBeInTheDocument();
});

test("stare żądanie nie wyłącza ładowania nowego", async () => {
  let firstFinish!: (response: Response) => void;
  let secondFinish!: (response: Response) => void;
  const firstResponse = new Promise<Response>((resolve) => {
    firstFinish = resolve;
  });
  const secondResponse = new Promise<Response>((resolve) => {
    secondFinish = resolve;
  });

  const fetchMock = vi
    .fn<typeof fetch>()
    .mockReturnValueOnce(firstResponse)
    .mockReturnValueOnce(secondResponse);
  vi.stubGlobal("fetch", fetchMock);
  render(
    <StrictMode>
      <MemoryRouter>
        <App />
      </MemoryRouter>
    </StrictMode>,
  );
  expect(fetchMock).toHaveBeenCalledTimes(2);
  await act(async () => {
    firstFinish(
      new Response(
        JSON.stringify([{ ...products[0], name: "Starsza odpowiedź" }]),
      ),
    );
  });
  expect(screen.getByText("Loading the catalogue…")).toBeInTheDocument();
  await act(async () => {
    secondFinish(
      new Response(
        JSON.stringify([{ ...products[0], name: "Nowsza odpowiedź" }]),
      ),
    );
  });
  expect(
    screen.getByRole("heading", { name: "Nowsza odpowiedź" }),
  ).toBeInTheDocument();
  expect(screen.queryByText("Loading the catalogue…")).not.toBeInTheDocument();
});

test("ponownienie przyciskiem po błędzie", async () => {
  let firstFinish!: (response: Response) => void;
  let secondFinish!: (response: Response) => void;
  const firstResponse = new Promise<Response>((resolve) => {
    firstFinish = resolve;
  });
  const secondResponse = new Promise<Response>((resolve) => {
    secondFinish = resolve;
  });

  const fetchMock = vi
    .fn<typeof fetch>()
    .mockReturnValueOnce(firstResponse)
    .mockReturnValueOnce(secondResponse);
  vi.stubGlobal("fetch", fetchMock);
  render(
    <MemoryRouter>
      <App />
    </MemoryRouter>,
  );

  await act(async () => {
    firstFinish(new Response(null, { status: 500 }));
  });
  const retryButton = await screen.findByRole("button", {
    name: "Try again",
  });
  const user = userEvent.setup();
  await user.click(retryButton);
  expect(screen.getByText("Loading the catalogue…")).toBeInTheDocument();
  expect(
    screen.queryByText("Could not load the catalogue. Please try again."),
  ).not.toBeInTheDocument();
  await act(async () => {
    secondFinish(
      new Response(
        JSON.stringify([{ ...products[0], name: "Nowsza odpowiedź" }]),
      ),
    );
  });
  expect(
    screen.getByRole("heading", { name: "Nowsza odpowiedź" }),
  ).toBeInTheDocument();
  expect(
    screen.queryByText("Could not load the catalogue. Please try again."),
  ).not.toBeInTheDocument();
  expect(fetchMock).toHaveBeenCalledTimes(2);
});

test("pokazuje komunikat pustego katalogu i ukrywa kontrolki", async () => {
  const fetchMock = vi
    .fn<typeof fetch>()
    .mockResolvedValue(new Response(JSON.stringify([])));
  vi.stubGlobal("fetch", fetchMock);
  render(
    <MemoryRouter>
      <App />
    </MemoryRouter>,
  );
  expect(
    await screen.findByText(
      "The collection is empty. Please check back later.",
    ),
  ).toBeInTheDocument();
  expect(screen.queryByLabelText("Search products")).not.toBeInTheDocument();
  expect(screen.queryByLabelText("Category")).not.toBeInTheDocument();
  expect(screen.queryByLabelText("Sort by")).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Filters & sort" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Reset filters" })).not.toBeInTheDocument();
  expect(
    screen.getByRole("heading", { name: "The collection" }),
  ).toBeInTheDocument();
});
test("zachowuje kontrolki, gdy wyszukiwanie nie znajduję produktów", async () => {
  const fetchMock = vi
    .fn<typeof fetch>()
    .mockResolvedValue(new Response(JSON.stringify(products)));
  vi.stubGlobal("fetch", fetchMock);
  render(
    <MemoryRouter>
      <App />
    </MemoryRouter>,
  );
  const user = userEvent.setup();
  await screen.findByRole("heading", { name: "Aura Bracelet" });
  expect(screen.queryByRole("searchbox", { name: "Search products" })).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: /Search/ }));
  const searchInput = screen.getByRole("searchbox", { name: "Search products" });
  await user.type(searchInput, "nieistniejacyprodukt");

  expect(
    screen.queryByText("No matching products."),
  ).toBeInTheDocument();
  expect(screen.queryByLabelText("Search products")).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Filters & sort" }));
  expect(screen.getByLabelText("Category")).toBeInTheDocument();
  expect(screen.getByLabelText("Sort by")).toBeInTheDocument();
  expect(
    screen.queryByText(
      "The collection is empty. Please check back later.",
    ),
  ).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Reset filters" }));
  expect(searchInput).toHaveValue("");
  expect(screen.getByRole("heading", { name: "Aura Bracelet" })).toBeInTheDocument();
});

test("łączy kolejne dodania wariantu w jedną pozycję koszyka", async () => {
  localStorage.clear();
  const fetchMock = vi
    .fn<typeof fetch>()
    .mockResolvedValue(new Response(JSON.stringify(products)));

  vi.stubGlobal("fetch", fetchMock);
  render(
    <MemoryRouter initialEntries={["/produkty/bransoletka-aura"]}>
      <App />
    </MemoryRouter>,
  );
  expect(screen.getByRole("link", { name: "Cart (0)" })).toBeInTheDocument();
  const user = userEvent.setup();
  const sizeSelect = await screen.findByLabelText("Size");
  await user.selectOptions(sizeSelect, "202");
  await user.click(screen.getByRole("button", { name: "Increase quantity" }));
  await user.click(screen.getByRole("button", { name: "Increase quantity" }));
  await user.click(screen.getByRole("button", { name: "Add to cart" }));
  expect(screen.getByText("Added to cart: 3")).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Decrease quantity" }));
  await user.click(screen.getByRole("button", { name: "Add to cart" }));
  expect(screen.getByText("Added to cart: 2")).toBeInTheDocument();
  await user.click(screen.getByRole("link", { name: "Cart (5)" }));
  expect(screen.getByRole("heading", { name: "Cart" })).toBeInTheDocument();
  expect(screen.getByText("Size: M · Quantity: 5")).toBeInTheDocument();
  expect(screen.getByText("Total quantity: 5")).toBeInTheDocument();
  expect(screen.getByText(/Total:\s*€\s*472\.50/)).toBeInTheDocument();
  expect(
    screen.getAllByRole("link", { name: "Aura Bracelet" }),
  ).toHaveLength(1);
});

test("ukrywa niedostępny produkt i przywraca go po zresetowaniu filtrów", async () => {
  const catalogWithUnavailableAura = products.map((product) => {
    if (product.id !== 1) {
      return product;
    }

    return {
      ...product,
      variants: product.variants.map((variant) => ({
        ...variant,
        isAvailable: false,
      })),
    };
  });
  const fetchMock = vi
    .fn<typeof fetch>()
    .mockResolvedValue(
      new Response(JSON.stringify(catalogWithUnavailableAura)),
    );

  vi.stubGlobal("fetch", fetchMock);
  render(
    <MemoryRouter>
      <App />
    </MemoryRouter>,
  );
  const user = userEvent.setup();
  expect(
    await screen.findByRole("heading", { name: "Aura Bracelet" }),
  ).toBeInTheDocument();
  const filtersButton = screen.getByRole("button", { name: "Filters & sort" });
  expect(screen.queryByLabelText("Available products only")).not.toBeInTheDocument();
  await user.click(filtersButton);
  expect(screen.getByLabelText("Available products only")).not.toBeChecked();
  expect(screen.getByText("Product unavailable")).toBeInTheDocument();
  await user.click(
    screen.getByRole("checkbox", { name: "Available products only" }),
  );
  expect(
    screen.getByRole("checkbox", { name: "Available products only" }),
  ).toBeChecked();
  expect(
    screen.queryByRole("heading", { name: "Aura Bracelet" }),
  ).not.toBeInTheDocument();
  expect(screen.queryByText("Product unavailable")).not.toBeInTheDocument();
  await user.click(filtersButton);
  expect(screen.queryByLabelText("Available products only")).not.toBeInTheDocument();
  expect(screen.queryByRole("heading", { name: "Aura Bracelet" })).not.toBeInTheDocument();
  await user.click(filtersButton);
  expect(screen.getByLabelText("Available products only")).toBeChecked();
  expect(
    screen.getByRole("heading", { name: "Sol Necklace" }),
  ).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Reset filters" })).toBeEnabled();
  await user.click(screen.getByRole("button", { name: "Reset filters" }));
  expect(screen.getByLabelText("Available products only")).not.toBeChecked();
  expect(
    screen.getByRole("heading", { name: "Aura Bracelet" }),
  ).toBeInTheDocument();
  expect(screen.getByText("Product unavailable")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Reset filters" })).not.toBeInTheDocument();
});
