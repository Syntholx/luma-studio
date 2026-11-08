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
    screen.getByRole("button", { name: "Dodaj do koszyka" }),
  ).toBeDisabled();
  const user = userEvent.setup();
  await user.selectOptions(screen.getByLabelText("Rozmiar"), "202");
  expect(
    screen.getByRole("button", { name: "Dodaj do koszyka" }),
  ).toBeEnabled();
  await user.click(screen.getByRole("button", { name: "Dodaj do koszyka" }));
  expect(onAddCart).toHaveBeenCalledTimes(1);
  expect(onAddCart).toHaveBeenCalledWith(1, 202);
  expect(screen.getByText("Dodano do koszyka")).toBeInTheDocument();
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
  await user.selectOptions(screen.getByLabelText("Rozmiar"), "202");
  expect(
    screen.getByRole("button", { name: "Dodaj do koszyka" }),
  ).toBeEnabled();
  await user.click(screen.getByRole("button", { name: "Dodaj do koszyka" }));
  expect(screen.getByText("Dodano do koszyka")).toBeInTheDocument();
  expect(onAddCart).toHaveBeenCalledWith(1, 202);
  await user.selectOptions(screen.getByLabelText("Rozmiar"), "204");
  expect(onAddCart).toHaveBeenCalledTimes(1);
  expect(screen.queryByText("Dodano do koszyka")).not.toBeInTheDocument();
  await user.selectOptions(screen.getByLabelText("Rozmiar"), "202");
  expect(screen.queryByText("Dodano do koszyka")).not.toBeInTheDocument();
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
    screen.getByRole("option", { name: "L - niedostępny" }),
  ).toBeDisabled();
  await user.selectOptions(screen.getByLabelText("Rozmiar"), "203");
  expect(
    screen.getByRole("button", { name: "Dodaj do koszyka" }),
  ).toBeDisabled();
  user.click(screen.getByRole("button", { name: "Dodaj do koszyka" }));
  expect(onAddCart).toHaveBeenCalledTimes(0);
});
