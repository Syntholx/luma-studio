import { HomePage } from "./components/HomePage";
import { Routes, Route } from "react-router-dom";
import { ProductDetailsPage } from "./components/ProductDetailsPage";
import { Link } from "react-router-dom";
import { CartPage } from "./components/CartPage";
import { CheckoutPage } from "./components/CheckoutPage";
import { useCatalog } from "./hooks/useCatalog";
import { useCart } from "./hooks/useCart";
export function App() {
  const { catalogProducts, isCatalogLoading, catalogError, loadCatalog } =
    useCatalog();
  const {
    clearCart,
    addToCart,
    removeFromCart,
    changeQuantity,
    cartQuantity,
    cart,
  } = useCart({ catalogProducts });

  return (
    <>
      <header className="w-full max-w-[1120px] mx-auto px-[24px] py-[24px] flex flex-col md:flex-row items-center justify-between gap-4">
        <Link to="/" className="text-xl font-bold">
          Luma Studio
        </Link>
        <nav aria-label="Main navigation" className="flex gap-6">
          <Link
            to="/#o-marce"
            className="min-h-[44px] inline-flex items-center"
          >
            About us
          </Link>
          <Link
            to="/#kolekcja"
            className="min-h-[44px] inline-flex items-center"
          >
            Collection
          </Link>
          <Link to="/koszyk" className="min-h-[44px] inline-flex items-center">
            Cart ({cartQuantity})
          </Link>
        </nav>
      </header>
      <main className="max-w-[1120px] mx-auto px-[24px]">
        <Routes>
          <Route
            path="/"
            element={
              <HomePage
                onRetry={loadCatalog}
                catalogProducts={catalogProducts}
                isCatalogLoading={isCatalogLoading}
                catalogError={catalogError}
              />
            }
          />
          <Route
            path={"/produkty/:slug"}
            element={
              <ProductDetailsPage
                onAddCart={addToCart}
                products={catalogProducts}
                isLoading={isCatalogLoading}
                catalogError={catalogError}
                onRetry={loadCatalog}
              />
            }
          />
          <Route
            path="*"
            element={
              <section className="py-[48px]">
                <h1 className="text-[30px] font-[600]">
                  Page not found
                </h1>
                <Link
                  to="/"
                  className="mt-[24px] min-h-[44px]  inline-flex items-center text-[#765341] font-[600] hover:underline"
                >
                  Back to home
                </Link>
              </section>
            }
          />
          <Route
            path={"/koszyk"}
            element={
              <CartPage
                isLoading={isCatalogLoading}
                onClearCart={clearCart}
                catalogError={catalogError}
                onRetry={loadCatalog}
                items={cart}
                products={catalogProducts}
                onRemoveFromCart={removeFromCart}
                onChangeQuantity={changeQuantity}
              />
            }
          />
          <Route
            path={"/zamowienie"}
            element={
              <CheckoutPage
                items={cart}
                onClearCart={clearCart}
                products={catalogProducts}
                isLoading={isCatalogLoading}
                catalogError={catalogError}
                onRetry={loadCatalog}
              />
            }
          />
        </Routes>
      </main>
      <footer className="max-w-[1120px] mx-auto py-[32px] px-[24px]">
        <p>© 2026 Luma Studio</p>
        <p>
          Demo store. No real purchases are made.
        </p>
      </footer>
    </>
  );
}
