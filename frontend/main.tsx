import { BrowserRouter } from "react-router-dom";
import { createRoot } from "react-dom/client";
import "./styles.css";
import { ProductCard } from "./components/ProductCard";
import { products } from "./products";

const app = document.getElementById("app");
if (!(app instanceof HTMLElement)) {
  throw new Error("Nie znaleziono elementu");
}

function App() {
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
          <div className="mt-[32px] grid grid-cols-1 gap-[24px] md:grid-cols-2 ">
            {products.map((product) => (
              <ProductCard product={product} key={product.id} />
            ))}
          </div>
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

createRoot(app).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
);
