import { HomePage } from "./components/HomePage";
import { Navigate, Routes, Route, useLocation, useParams } from "react-router-dom";
import { ProductDetailsPage } from "./components/ProductDetailsPage";
import { Link } from "react-router-dom";
import { CartPage } from "./components/CartPage";
import { CheckoutPage } from "./components/CheckoutPage";
import { useCatalog } from "./hooks/useCatalog";
import { useCart } from "./hooks/useCart";
import { useEffect, useState } from "react";

const legacySlugs = new Map([
  ["naszyjnik-sol", "sol-necklace"],
  ["bransoletka-aura", "aura-bracelet"],
  ["kolczyki-luna", "luna-earrings"],
]);

function LegacyProductRedirect() {
  const { slug = "" } = useParams();
  return <Navigate replace to={`/products/${encodeURIComponent(legacySlugs.get(slug) ?? slug)}`} />;
}

export function App() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (pathname === "/" && (hash === "#collection" || hash === "#kolekcja")) {
      document.getElementById("collection")?.scrollIntoView?.();
    }
  }, [pathname, hash]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchProducts, setSearchProducts] = useState("");
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
            to="/#collection"
            className="min-h-[44px] inline-flex items-center"
          >
            Collection
          </Link>
          <button
            type="button"
            aria-expanded={isSearchOpen}
            onClick={() => setIsSearchOpen((open) => !open)}
          >
            🔍 Search
          </button>
          <Link to="/cart" className="min-h-[44px] inline-flex items-center">
            Cart ({cartQuantity})
          </Link>
        </nav>
      </header>

      <main className="max-w-[1120px] mx-auto px-[24px]">
        {isSearchOpen && (
          <input
            type="search"
            aria-label="Search products"
            placeholder="Search products..."
            className="block min-h-[44px] w-full rounded-lg border border-[#e5ddd3] bg-white px-3 text-sm text-[#29241f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#765341] md:ml-auto md:max-w-[320px]"
            value={searchProducts}
            onChange={(event) => setSearchProducts(event.currentTarget.value)}
          />
        )}
        <Routes>
          <Route path="/produkty/:slug" element={<LegacyProductRedirect />} />
          <Route path="/koszyk" element={<Navigate replace to="/cart" />} />
          <Route path="/zamowienie" element={<Navigate replace to="/checkout" />} />
          <Route
            path="/"
            element={
              <HomePage
                onRetry={loadCatalog}
                catalogProducts={catalogProducts}
                isCatalogLoading={isCatalogLoading}
                catalogError={catalogError}
                searchProducts={searchProducts}
                onClearSearch={() => setSearchProducts("")}
              />
            }
          />
          <Route
            path={"/products/:slug"}
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
                <h1 className="text-[30px] font-[600]">Page not found</h1>
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
            path={"/cart"}
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
            path="/checkout"
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
        <p>Delicate jewellery with a touch of colour.</p>
        <p>Demo store. No real purchases are made.</p>
      </footer>
    </>
  );
}
