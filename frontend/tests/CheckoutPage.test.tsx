import { afterEach, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import { CheckoutPage } from "../components/CheckoutPage";
import { products } from "../products";
import type { OrderConfirmation } from "../orders";
import { createOrder } from "../services/orders";

vi.mock("../services/orders", () => ({ createOrder: vi.fn() }));
const createOrderMock = vi.mocked(createOrder);

afterEach(() => {
  createOrderMock.mockReset();
});

const pickupOrder: OrderConfirmation = {
  orderId: "DEMO-test",
  createdAt: "2026-11-23T19:00:00Z",
  expiresAt: "2026-11-24T19:00:00Z",
  isDemo: true,
  currency: "PLN",
  items: [
    {
      productId: 1,
      variantId: 204,
      name: "Bransoletka Aura",
      size: "S",
      unitPrice: 89.5,
      quantity: 1,
      lineTotal: 89.5,
    },
  ],
  totalQuantity: 1,
  totalPrice: 89.5,
  deliveryMethodId: "pickup",
  deliveryName: "Punkt odbioru",
  deliveryPrice: 9.99,
  pickupPoint: "DEMO01",
  grandTotal: 99.49,
};

test("pokazuje pole kodu dla domyślnego punktu odbioru", () => {
  render(
    <MemoryRouter>
      <CheckoutPage
        items={[{ productId: 1, variantId: 204, quantity: 1 }]}
        products={products}
        onClearCart={vi.fn()}
        isLoading={false}
        catalogError={""}
        onRetry={vi.fn()}
      />
    </MemoryRouter>,
  );

  expect(screen.getByLabelText("Kod punktu odbioru")).toBeInTheDocument();
});

test("ukrywa pole kodu po wybraniu kuriera", async () => {
  render(
    <MemoryRouter>
      <CheckoutPage
        items={[{ productId: 1, variantId: 204, quantity: 1 }]}
        products={products}
        isLoading={false}
        catalogError={""}
        onRetry={vi.fn()}
        onClearCart={vi.fn()}
      />
    </MemoryRouter>,
  );
  const user = userEvent.setup();
  expect(screen.getByLabelText("Kod punktu odbioru")).toBeInTheDocument();
  await user.click(screen.getByRole("radio", { name: /Kurier/ }));
  expect(screen.queryByLabelText("Kod punktu odbioru")).not.toBeInTheDocument();
  expect(screen.getByRole("radio", { name: /Kurier/ })).toBeChecked();
});

test("ponownie pokazuje pole po powrocie do punktu odbioru", async () => {
  render(
    <MemoryRouter>
      <CheckoutPage
        items={[{ productId: 1, variantId: 204, quantity: 1 }]}
        onClearCart={vi.fn()}
        products={products}
        isLoading={false}
        catalogError={""}
        onRetry={vi.fn()}
      />
    </MemoryRouter>,
  );
  const user = userEvent.setup();
  await user.click(screen.getByRole("radio", { name: /Kurier/ }));
  expect(screen.queryByLabelText("Kod punktu odbioru")).not.toBeInTheDocument();
  await user.click(screen.getByRole("radio", { name: /Punkt odbioru/ }));
  expect(screen.queryByLabelText("Kod punktu odbioru")).toBeInTheDocument();
  expect(screen.getByRole("radio", { name: /Punkt odbioru/ })).toBeChecked();
});

test("zatwierdza odbiór i pokazuje kod bez skrajnych spacji", async () => {
  createOrderMock.mockResolvedValueOnce(pickupOrder);
  const onClearCart = vi.fn();
  render(
    <MemoryRouter>
      <CheckoutPage
        products={products}
        items={[
          {
            productId: 1,
            variantId: 204,
            quantity: 1,
          },
        ]}
        onClearCart={onClearCart}
        isLoading={false}
        catalogError={""}
        onRetry={vi.fn()}
      />
    </MemoryRouter>,
  );
  const user = userEvent.setup();

  await user.type(screen.getByLabelText("Imię"), "Tester");
  await user.type(
    screen.getByLabelText("Podaj swój e-mail"),
    "demo@example.test",
  );
  await user.type(screen.getByLabelText("Kod punktu odbioru"), " DEMO01 ");
  await user.click(
    screen.getByRole("button", {
      name: "Zatwierdź zamówienie demonstracyjne",
    }),
  );
  const pickupConfirmation = await screen.findByText(/Kod punktu odbioru:/);
  expect(pickupConfirmation.textContent).toBe("Kod punktu odbioru: DEMO01");
  expect(createOrderMock).toHaveBeenCalledWith(
    expect.objectContaining({
      deliveryMethodId: "pickup",
      pickupPoint: "DEMO01",
    }),
    expect.any(String),
  );

  expect(
    screen.getByRole("heading", {
      name: "Zamówienie demonstracyjne zatwierdzone",
      level: 1,
    }),
  ).toBeInTheDocument();
  expect(onClearCart).toHaveBeenCalledTimes(1);
});
test("zatwierdza dostawę kurierem bez kodu punktu odbioru", async () => {
  createOrderMock.mockResolvedValueOnce({
    ...pickupOrder,
    deliveryMethodId: "courier",
    deliveryName: "Kurier",
    deliveryPrice: 14.99,
    pickupPoint: null,
    grandTotal: 104.49,
  });
  const onClearCart = vi.fn();
  render(
    <MemoryRouter>
      <CheckoutPage
        products={products}
        items={[
          {
            productId: 1,
            variantId: 204,
            quantity: 1,
          },
        ]}
        onClearCart={onClearCart}
        isLoading={false}
        catalogError={""}
        onRetry={vi.fn()}
      />
    </MemoryRouter>,
  );
  const user = userEvent.setup();
  await user.click(screen.getByRole("radio", { name: /Kurier/ }));
  expect(screen.queryByLabelText("Kod punktu odbioru")).not.toBeInTheDocument();
  await user.type(screen.getByLabelText("Imię"), "Tester");
  await user.type(
    screen.getByLabelText("Podaj swój e-mail"),
    "demo@example.test",
  );
  await user.click(
    screen.getByRole("button", {
      name: "Zatwierdź zamówienie demonstracyjne",
    }),
  );
  expect(
    await screen.findByRole("heading", {
      name: "Zamówienie demonstracyjne zatwierdzone",
      level: 1,
    }),
  ).toBeInTheDocument();
  expect(onClearCart).toHaveBeenCalledTimes(1);
  expect(screen.queryByText(/Kod punktu odbioru:/)).not.toBeInTheDocument();
  expect(createOrderMock).toHaveBeenCalledWith(
    expect.objectContaining({ deliveryMethodId: "courier", pickupPoint: null }),
    expect.any(String),
  );
});
