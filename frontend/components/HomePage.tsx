import { type Product } from "../products";
import { useState } from "react";
import { ProductList } from "../components/ProductList";
export function HomePage(props: {
  catalogProducts: Product[];
  isCatalogLoading: boolean;
  catalogError: string;
  onRetry: () => Promise<void>;
  searchProducts: string;
  onClearSearch: () => void;
}) {
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const normalizedSearch = props.searchProducts.trim().toLowerCase();
  const [priceSort, setPriceSort] = useState("default");
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const hasActiveFilters =
    categoryFilter !== "All" ||
    normalizedSearch !== "" ||
    priceSort !== "default" ||
    onlyAvailable;

  const filteredProducts = props.catalogProducts.filter(
    (product) =>
      (categoryFilter === "All" || product.category === categoryFilter) &&
      product.name.toLowerCase().includes(normalizedSearch) &&
      (!onlyAvailable ||
        product.variants.some((variant) => variant.isAvailable)),
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
      <section className="py-[64px]">
        <h1 className="text-[48px] font-[600] leading-[1.15] max-w-[720px]">
          Small details. Your own sparkle
        </h1>
        <p className="mt-[24px] text-[18px] leading-[1.7] max-w-[560px] text-[#6b6259]">
          Discover handmade jewellery inspired by simplicity and everyday
          moments.
        </p>
        <a
          href="#kolekcja"
          className="mt-[32px] min-h-[44px] rounded-[8px] py-[12px] px-[24px] bg-[#765341] text-[white] text-center items-center inline-flex"
        >
          Explore the collection
        </a>
      </section>
      <section
        id="kolekcja"
        className="py-[48px] border-t-[1px] border-[#e5ddd3]"
      >
        <h2 className="text-[30px] font-[600]">The collection</h2>

        <p role="status" className="mt-[16px]">
          {props.isCatalogLoading ? "Loading the catalogue…" : ""}
        </p>

        <p role="alert" className="mt-[16px]">
          {props.catalogError}
        </p>

        {!props.isCatalogLoading && props.catalogError !== "" && (
          <button
            type="button"
            onClick={props.onRetry}
            className="mt-[12px] min-h-[44px] px-[16px] py-[10px] border-[1px] border-[#e5ddd3] rounded-[8px] bg-[white] text-[#29241f]"
          >
            Try again
          </button>
        )}
        {!props.isCatalogLoading && props.catalogError === "" && (
          <>
            {props.catalogProducts.length === 0 && (
              <p className="mt-[24px] text-[16px] text-[#6b6259]">
                The collection is empty. Please check back later.
              </p>
            )}

            <>
              {props.catalogProducts.length > 0 && (
                <div>
                  <div className="mt-4 mb-4 flex w-full flex-wrap items-center justify-between gap-3">
                    <p className="text-sm font-normal text-[#6b6259]">
                      {filteredProducts.length}{" "}
                      {filteredProducts.length === 1 ? "product" : "products"}
                    </p>
                    <div className="flex flex-wrap items-center gap-3">
                      {hasActiveFilters && (
                        <button
                          type="button"
                          className="min-h-[44px] rounded-lg px-3 text-sm text-[#6b6259] underline hover:text-[#29241f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#765341]"
                          onClick={() => {
                            setCategoryFilter("All");
                            props.onClearSearch();
                            setPriceSort("default");
                            setOnlyAvailable(false);
                          }}
                        >
                          Reset filters
                        </button>
                      )}
                      <button
                        type="button"
                        aria-expanded={filtersOpen}
                        onClick={() => setFiltersOpen((open) => !open)}
                        className="min-h-[44px] rounded-lg border border-[#e5ddd3] bg-white px-3 text-sm font-medium text-[#29241f] hover:bg-[#f0e9e1] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#765341]"
                      >
                        Filters & sort
                      </button>
                    </div>
                  </div>

                  {filtersOpen && (
                    <div className="bg-[#f0e9e1] rounded-[8px] px-[16px] py-[16px]">
                      <div className="flex flex-col">
                        <label
                          htmlFor="avialable-product"
                          className="flex items-center gap-[8px] min-h-[44px] mb-[16px]"
                        >
                          <input
                            className="w-[18px] h-[18px] accent-[#765341]"
                            type="checkbox"
                            id="avialable-product"
                            name="avialable-product"
                            checked={onlyAvailable}
                            onChange={(event) =>
                              setOnlyAvailable(event.currentTarget.checked)
                            }
                          ></input>
                          Available products only
                        </label>
                      </div>
                      <div className="flex flex-col gap-[16px] md:flex-row">
                        <div className="flex flex-col gap-[8px]">
                          <label htmlFor="price-sort">Sort by</label>
                          <select
                            className="w-full max-w-[320px] min-h-[44px] px-[12px] py-[10px] bg-[white] border-[1px] border-[#e5ddd3] rounded-[8px]"
                            id="price-sort"
                            name="price-sort"
                            value={priceSort}
                            onChange={(event) =>
                              setPriceSort(event.currentTarget.value)
                            }
                          >
                            <option value="default">Default</option>
                            <option value="price-asc">
                              Price: low to high
                            </option>
                            <option value="price-desc">
                              Price: high to low
                            </option>
                          </select>
                        </div>
                        <div className="flex flex-col gap-[8px]">
                          <label htmlFor="category">Category</label>
                          <select
                            className="min-h-[44px] max-w-[320px] w-full px-[12px] py-[10px] bg-[white] border-[1px] border-[#e5ddd3] rounded-[8px]"
                            id="category"
                            value={categoryFilter}
                            onChange={(event) =>
                              setCategoryFilter(event.currentTarget.value)
                            }
                          >
                            <option value="All">All</option>
                            <option value="Bracelets">Bracelets</option>
                            <option value="Necklaces">Necklaces</option>
                            <option value="Earrings">Earrings</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                  <ProductList products={sortedProducts} />
                </div>
              )}
            </>
          </>
        )}
      </section>
    </>
  );
}
