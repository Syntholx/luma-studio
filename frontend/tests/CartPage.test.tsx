import { expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import { CartPage } from "../components/CartPage";
import { products } from "../products";

test("pokazuje komunikat i można usunąć produkt z koszyka", async () => {
  const onRemoveFromCart = vi.fn();
  render(
    <MemoryRouter>
      <CartPage
        onClearCart={vi.fn()}
        items={[{ productId: 999, variantId: 999, quantity: 1 }]}
        products={products}
        onRemoveFromCart={onRemoveFromCart}
        onChangeQuantity={vi.fn()}
        isLoading={false}
        catalogError={""}
        onRetry={vi.fn()}
      />
    </MemoryRouter>,
  );

  const user = userEvent.setup();
  expect(
    screen.getByText("This item is no longer available in the catalogue."),
  ).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Remove" }));
  expect(screen.getByRole("button", { name: "Remove" })).toBeInTheDocument();
  expect(onRemoveFromCart).toHaveBeenCalledWith(999);
});

test("pokazuje komunikat i można usunąć produkt, gdy wariant nie istnieje", async () => {
  const onRemoveFromCart = vi.fn();
  render(
    <MemoryRouter>
      <CartPage
        onClearCart={vi.fn()}
        items={[{ productId: 1, variantId: 999, quantity: 1 }]}
        products={products}
        onRemoveFromCart={onRemoveFromCart}
        onChangeQuantity={vi.fn()}
        isLoading={false}
        catalogError={""}
        onRetry={vi.fn()}
      />
    </MemoryRouter>,
  );

  expect(
    screen.getByText("This item is no longer available in the catalogue."),
  ).toBeInTheDocument();
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "Remove" }));
  expect(screen.getByRole("button", { name: "Remove" })).toBeInTheDocument();
  expect(onRemoveFromCart).toHaveBeenCalledWith(999);
});
