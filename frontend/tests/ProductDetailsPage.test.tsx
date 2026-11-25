import { expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import { products } from "../products";
import { ProductDetailsPage } from "../components/ProductDetailsPage";
test("wybór wariantu i dodanie go do koszyka", async () => {
  const onAddCart = vi.fn();
  render(
    <MemoryRouter initialEntries={["/produkty/bransoletka-aura"]}>
      <Routes>
        <Route
          path="/produkty/:slug"
          element={
            <ProductDetailsPage
              products={products}
              isLoading={false}
              catalogError={""}
              onRetry={vi.fn()}
              onAddCart={onAddCart}
            />
          }
        />
      </Routes>
    </MemoryRouter>,
  );
  expect(
    screen.getByRole("button", { name: "Add to cart" }),
  ).toBeDisabled();
  const user = userEvent.setup();
  await user.selectOptions(screen.getByLabelText("Size"), "202");
  expect(
    screen.getByRole("button", { name: "Add to cart" }),
  ).toBeEnabled();
  await user.click(screen.getByRole("button", { name: "Add to cart" }));
  expect(onAddCart).toHaveBeenCalledTimes(1);
  expect(onAddCart).toHaveBeenCalledWith(1, 202, 1);
  expect(screen.getByText("Added to cart: 1")).toBeInTheDocument();
});

test("po zmianie rozmiaru znika komunikat poprzedniego dodania", async () => {
  const onAddCart = vi.fn();
  render(
    <MemoryRouter initialEntries={["/produkty/bransoletka-aura"]}>
      <Routes>
        <Route
          path="/produkty/:slug"
          element={
            <ProductDetailsPage
              products={products}
              isLoading={false}
              catalogError={""}
              onRetry={vi.fn()}
              onAddCart={onAddCart}
            />
          }
        />
      </Routes>
    </MemoryRouter>,
  );
  const user = userEvent.setup();
  await user.selectOptions(screen.getByLabelText("Size"), "202");
  expect(
    screen.getByRole("button", { name: "Add to cart" }),
  ).toBeEnabled();
  await user.click(screen.getByRole("button", { name: "Add to cart" }));
  expect(screen.getByText("Added to cart: 1")).toBeInTheDocument();
  expect(onAddCart).toHaveBeenCalledWith(1, 202, 1);
  await user.selectOptions(screen.getByLabelText("Size"), "204");
  expect(onAddCart).toHaveBeenCalledTimes(1);
  expect(
    screen.queryByText("Added to cart: 1"),
  ).not.toBeInTheDocument();
  await user.selectOptions(screen.getByLabelText("Size"), "202");
  expect(
    screen.queryByText("Added to cart: 1"),
  ).not.toBeInTheDocument();
  expect(onAddCart).toHaveBeenCalledTimes(1);
});

test("niedostępny rozmiar L jest zablokowany, nie da się go kupić", async () => {
  const onAddCart = vi.fn();
  render(
    <MemoryRouter initialEntries={["/produkty/bransoletka-aura"]}>
      <Routes>
        <Route
          path="/produkty/:slug"
          element={
            <ProductDetailsPage
              products={products}
              isLoading={false}
              catalogError={""}
              onRetry={vi.fn()}
              onAddCart={onAddCart}
            />
          }
        />
      </Routes>
    </MemoryRouter>,
  );
  const user = userEvent.setup();
  expect(
    screen.getByRole("option", { name: "L - unavailable" }),
  ).toBeDisabled();
  await user.selectOptions(screen.getByLabelText("Size"), "203");
  expect(
    screen.getByRole("button", { name: "Add to cart" }),
  ).toBeDisabled();
  await user.click(screen.getByRole("button", { name: "Add to cart" }));
  expect(onAddCart).toHaveBeenCalledTimes(0);
});

test("wybór 3 sztuk, potwierdzenie wywołania", async () => {
  const onAddCart = vi.fn();
  render(
    <MemoryRouter initialEntries={["/produkty/bransoletka-aura"]}>
      <Routes>
        <Route
          path="/produkty/:slug"
          element={
            <ProductDetailsPage
              products={products}
              isLoading={false}
              catalogError={""}
              onRetry={vi.fn()}
              onAddCart={onAddCart}
            />
          }
        />
      </Routes>
    </MemoryRouter>,
  );
  const increaseButton = screen.getByRole("button", { name: "Increase quantity" });
  const user = userEvent.setup();
  await user.click(increaseButton);
  await user.click(increaseButton);
  await user.selectOptions(screen.getByLabelText("Size"), "202");
  await user.click(screen.getByRole("button", { name: "Add to cart" }));
  expect(onAddCart).toHaveBeenCalledTimes(1);
  expect(onAddCart).toHaveBeenCalledWith(1, 202, 3);
  expect(screen.getByText("Added to cart: 3")).toBeInTheDocument();
});

test("graniicy ilości 1-10", async () => {
  const onAddCart = vi.fn();
  render(
    <MemoryRouter initialEntries={["/produkty/bransoletka-aura"]}>
      <Routes>
        <Route
          path="/produkty/:slug"
          element={
            <ProductDetailsPage
              products={products}
              isLoading={false}
              catalogError={""}
              onRetry={vi.fn()}
              onAddCart={onAddCart}
            />
          }
        />
      </Routes>
    </MemoryRouter>,
  );
  const increaseButton = screen.getByRole("button", { name: "Increase quantity" });
  expect(screen.getByRole("button", { name: "Decrease quantity" })).toBeDisabled();
  expect(increaseButton).toBeEnabled();
  const user = userEvent.setup();
  await user.selectOptions(screen.getByLabelText("Size"), "202");
  for (let i = 0; i < 9; i++) {
    await user.click(increaseButton);
  }
  expect(screen.getByRole("button", { name: "Increase quantity" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Decrease quantity" })).toBeEnabled();
  await user.click(screen.getByRole("button", { name: "Increase quantity" }));
  expect(screen.getByRole("button", { name: "Increase quantity" })).toBeDisabled();
  await user.click(screen.getByRole("button", { name: "Add to cart" }));
  expect(onAddCart).toHaveBeenCalledTimes(1);
  expect(onAddCart).toHaveBeenCalledWith(1, 202, 10);
});

test("czyszczenia potwierdzenia po zmianie ilości", async () => {
  const onAddCart = vi.fn();
  render(
    <MemoryRouter initialEntries={["/produkty/bransoletka-aura"]}>
      <Routes>
        <Route
          path="/produkty/:slug"
          element={
            <ProductDetailsPage
              products={products}
              isLoading={false}
              catalogError={""}
              onRetry={vi.fn()}
              onAddCart={onAddCart}
            />
          }
        />
      </Routes>
    </MemoryRouter>,
  );
  const user = userEvent.setup();
  await user.selectOptions(screen.getByLabelText("Size"), "202");
  await user.click(screen.getByRole("button", { name: "Add to cart" }));
  expect(screen.getByText("Added to cart: 1")).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Increase quantity" }));
  expect(
    screen.queryByText("Added to cart: 2"),
  ).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Decrease quantity" }));
  expect(
    screen.queryByText("Added to cart: 1"),
  ).not.toBeInTheDocument();
  expect(onAddCart).toHaveBeenCalledTimes(1);
});

test("przy niedostępności ukrywa niektóre funkcje", async () => {
  const onAddCart = vi.fn();
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

  render(
    <MemoryRouter initialEntries={["/produkty/bransoletka-aura"]}>
      <Routes>
        <Route
          path="/produkty/:slug"
          element={
            <ProductDetailsPage
              products={catalogWithUnavailableAura}
              isLoading={false}
              catalogError={""}
              onRetry={vi.fn()}
              onAddCart={onAddCart}
            />
          }
        />
      </Routes>
    </MemoryRouter>,
  );
  expect(
    screen.getByText("This product is currently unavailable."),
  ).toBeInTheDocument();
  expect(screen.queryByLabelText("Size")).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Increase quantity" }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Decrease quantity" }),
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole("heading", { name: "Aura Bracelet" }),
  ).toBeInTheDocument();
  expect(
    screen.getByText("A delicate bracelet made with colourful beads."),
  ).toBeInTheDocument();
  expect(screen.getByRole("img")).toBeInTheDocument();
  expect(
    screen.getByRole("link", { name: "Back to the collection" }),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Add to cart" }),
  ).not.toBeInTheDocument();
  expect(onAddCart).toHaveBeenCalledTimes(0);
});
