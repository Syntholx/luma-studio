import { expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import { products } from "../products";
import { ProductDetailsPage } from "../components/ProductDetailsPage";
test("selects a variant and adds it to the cart", async () => {
  const onAddCart = vi.fn();
  render(
    <MemoryRouter initialEntries={["/products/aura-bracelet"]}>
      <Routes>
        <Route
          path="/products/:slug"
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

test("clears confirmation when the size changes", async () => {
  const onAddCart = vi.fn();
  render(
    <MemoryRouter initialEntries={["/products/aura-bracelet"]}>
      <Routes>
        <Route
          path="/products/:slug"
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

test("prevents adding unavailable size L", async () => {
  const onAddCart = vi.fn();
  render(
    <MemoryRouter initialEntries={["/products/aura-bracelet"]}>
      <Routes>
        <Route
          path="/products/:slug"
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

test("adds three units of the selected variant", async () => {
  const onAddCart = vi.fn();
  render(
    <MemoryRouter initialEntries={["/products/aura-bracelet"]}>
      <Routes>
        <Route
          path="/products/:slug"
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

test("enforces quantity limits from 1 to 10", async () => {
  const onAddCart = vi.fn();
  render(
    <MemoryRouter initialEntries={["/products/aura-bracelet"]}>
      <Routes>
        <Route
          path="/products/:slug"
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

test("clears confirmation when the quantity changes", async () => {
  const onAddCart = vi.fn();
  render(
    <MemoryRouter initialEntries={["/products/aura-bracelet"]}>
      <Routes>
        <Route
          path="/products/:slug"
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

test("hides purchase controls for unavailable products", async () => {
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
    <MemoryRouter initialEntries={["/products/aura-bracelet"]}>
      <Routes>
        <Route
          path="/products/:slug"
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
