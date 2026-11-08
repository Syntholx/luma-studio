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
  expect(onAddCart).toHaveBeenCalledWith(1, 202, 1);
  expect(screen.getByText("Dodano do koszyka: 1 szt.")).toBeInTheDocument();
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
  expect(screen.getByText("Dodano do koszyka: 1 szt.")).toBeInTheDocument();
  expect(onAddCart).toHaveBeenCalledWith(1, 202, 1);
  await user.selectOptions(screen.getByLabelText("Rozmiar"), "204");
  expect(onAddCart).toHaveBeenCalledTimes(1);
  expect(
    screen.queryByText("Dodano do koszyka: 1 szt."),
  ).not.toBeInTheDocument();
  await user.selectOptions(screen.getByLabelText("Rozmiar"), "202");
  expect(
    screen.queryByText("Dodano do koszyka: 1 szt."),
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
    screen.getByRole("option", { name: "L - niedostępny" }),
  ).toBeDisabled();
  await user.selectOptions(screen.getByLabelText("Rozmiar"), "203");
  expect(
    screen.getByRole("button", { name: "Dodaj do koszyka" }),
  ).toBeDisabled();
  await user.click(screen.getByRole("button", { name: "Dodaj do koszyka" }));
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
  const increaseButton = screen.getByRole("button", { name: "Zwiększ ilość" });
  const user = userEvent.setup();
  await user.click(increaseButton);
  await user.click(increaseButton);
  await user.selectOptions(screen.getByLabelText("Rozmiar"), "202");
  await user.click(screen.getByRole("button", { name: "Dodaj do koszyka" }));
  expect(onAddCart).toHaveBeenCalledTimes(1);
  expect(onAddCart).toHaveBeenCalledWith(1, 202, 3);
  expect(screen.getByText("Dodano do koszyka: 3 szt.")).toBeInTheDocument();
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
  const increaseButton = screen.getByRole("button", { name: "Zwiększ ilość" });
  expect(screen.getByRole("button", { name: "Zmniejsz ilość" })).toBeDisabled();
  expect(increaseButton).toBeEnabled();
  const user = userEvent.setup();
  await user.selectOptions(screen.getByLabelText("Rozmiar"), "202");
  for (let i = 0; i < 9; i++) {
    await user.click(increaseButton);
  }
  expect(screen.getByRole("button", { name: "Zwiększ ilość" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Zmniejsz ilość" })).toBeEnabled();
  await user.click(screen.getByRole("button", { name: "Zwiększ ilość" }));
  expect(screen.getByRole("button", { name: "Zwiększ ilość" })).toBeDisabled();
  await user.click(screen.getByRole("button", { name: "Dodaj do koszyka" }));
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
  await user.selectOptions(screen.getByLabelText("Rozmiar"), "202");
  await user.click(screen.getByRole("button", { name: "Dodaj do koszyka" }));
  expect(screen.getByText("Dodano do koszyka: 1 szt.")).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Zwiększ ilość" }));
  expect(
    screen.queryByText("Dodano do koszyka: 2 szt."),
  ).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Zmniejsz ilość" }));
  expect(
    screen.queryByText("Dodano do koszyka: 1 szt."),
  ).not.toBeInTheDocument();
  expect(onAddCart).toHaveBeenCalledTimes(1);
});
