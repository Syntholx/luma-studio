import { useState } from "react";
import { products } from "./products";
import { ProductList } from "./components/ProductList";

export function App() {
  const [categoryFilter, setCategoryFilter] = useState("Wszystkie");
  const [searchProducts, setSearchProducts] = useState("");
  const normalizedSearch = searchProducts.trim().toLowerCase();
  const [priceSort, setPriceSort] = useState("default");
  const filteredProducts = products.filter(
    (product) =>
      (categoryFilter === "Wszystkie" || product.category === categoryFilter) &&
      product.name.toLowerCase().includes(normalizedSearch),
  );
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (priceSort === "price-asc") {
      return a.price - b.price;
    }
    if (priceSort === "price-desc") {
      return b.price - a.price;
    }
    return 0;
  });
  return (
    <>
      <header className="flex items-center justify-between p-6">
        <a href="/" className="text-xl font-bold">
          Luma Studio
        </a>
        <nav aria-label="Nawigacja główna" className="flex gap-6">
          <a href="/#o-marce" className="min-h-[44px] inline-flex items-center">
            O marce
          </a>
          <a
            href="/#kolekcja"
            className="min-h-[44px] inline-flex items-center"
          >
            Kolekcja
          </a>
        </nav>
      </header>
      <main className="max-w-[1120px] mx-auto px-[24px]">
        <section className="py-[64px]">
          <h1 className="text-[48px] font-[600] leading-[1.15] max-w-[720px]">
            Małe detale. Twój własny blask
          </h1>
          <p className="mt-[24px] text-[18px] leading-[1.7] max-w-[560px] text-[#6b6259]">
            Odkryj ręcznie tworzoną biżuterie inspirowaną prostotą i codziennymi
            chwilami.
          </p>
          <a
            href="#kolekcja"
            className="mt-[32px] min-h-[44px] rounded-[8px] py-[12px] px-[24px] bg-[#765341] text-[white] text-center items-center inline-flex"
          >
            Poznaj kolekcję
          </a>
        </section>
        <section
          id="o-marce"
          className="py-[48px] border-t-[1px] border-[#e5ddd3]"
        >
          <h2 className="text-[30px] font-[600]">Tworzone z uważnością</h2>
          <p className="mt-[16px] max-w-[680px] text-[#6b6259] leading-[1.7]">
            Luma Studio to demonstracyjna marka biżuterii, w której delikatne
            formy spotykają się z kolorem. Poznaj kolekcję bransoletek,
            naszyjników i kolczyków.
          </p>
        </section>
        <section
          id="kolekcja"
          className="py-[48px] border-t-[1px] border-[#e5ddd3]"
        >
          <h2 className="text-[30px] font-[600]">Znajdź swój ulubiony detal</h2>
          <p className="mt-[16px] max-w-[680px] text-[#6b6259] leading-[1.7]">
            Subtelny akcent na co dzień czy dodatek na wyjątkową okazję?
            Sprawdź, co przygotowaliśmy.
          </p>
          <div className="mt-[24px] flex flex-col gap-[8px]">
            <label htmlFor="price-sort">Sortowanie</label>
            <select
              className="w-full max-w-[320px] min-h-[44px] px-[12px] py-[10px] bg-[white] border-[1px] border-[#e5ddd3] rounded-[8px]"
              id="price-sort"
              name="price-sort"
              value={priceSort}
              onChange={(event) => setPriceSort(event.currentTarget.value)}
            >
              <option value="default">Domyślnie</option>
              <option value="price-asc">Cena rosnąco</option>
              <option value="price-desc">Cena malejąco</option>
            </select>
          </div>

          <div className="flex mt-[24px] flex-col gap-[8px]">
            <label htmlFor="search-product">Szukaj produktu</label>
            <input
              className="w-full max-w-[320px] min-h-[44px] px-[12px] py-[10px] bg-[white] border-[1px] border-[#e5ddd3] rounded-[8px] "
              id="search-product"
              name="search-product"
              value={searchProducts}
              onChange={(event) => setSearchProducts(event.currentTarget.value)}
            ></input>
          </div>

          <div className="mt-[24px] flex flex-col gap-[8px]">
            <label htmlFor="category">Kategoria</label>
            <select
              className="min-h-[44px] max-w-[320px] w-full px-[12px] py-[10px] bg-[white] border-[1px] border-[#e5ddd3] rounded-[8px]"
              id="category"
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.currentTarget.value)}
            >
              <option value="Wszystkie">Wszystkie</option>
              <option value="Bransoletki">Bransoletki</option>
              <option value="Naszyjniki">Naszyjniki</option>
              <option value="Kolczyki">Kolczyki</option>
            </select>
          </div>
          <button
            type="button"
            className="mt-[12px] min-h-[44px] px-[16px] py-[10px] border-[1px] border-[#e5ddd3] rounded-[8px] bg-[white] text-[#29241f] cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
            disabled={
              categoryFilter === "Wszystkie" &&
              searchProducts === "" &&
              priceSort === "default"
            }
            onClick={() => {
              setCategoryFilter("Wszystkie");
              setSearchProducts("");
              setPriceSort("default");
            }}
          >
            Resetuj widok
          </button>
          <p className="mt-[16px] text-[14px] text-[#6b6259]">
            Widoczne produkty: {filteredProducts.length}
          </p>
          <ProductList products={sortedProducts} />
        </section>
      </main>
      <footer className="max-w-[1120px] mx-auto py-[32px] px-[24px]">
        <p>© 2026 Luma Studio</p>
        <p>
          Projekt demonstracyjny — sklep nie prowadzi rzeczywistej sprzedaży.
        </p>
      </footer>
    </>
  );
}
