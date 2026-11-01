import { useParams } from "react-router-dom";
import type { Product } from "../products";
import { Link } from "react-router-dom";
import { formatPrice } from "../format-price";
import { useState } from "react";
export function ProductDetailsPage(props: {
  onAddCart: (productId: number, variantId: number) => void;
  products: Product[];
  isLoading: boolean;
  catalogError: string;
  onRetry: () => void;
}) {
  const { slug } = useParams();
  const [addedVariantId, setAddedVariantId] = useState("");
  const [selectedVariantId, setVariantId] = useState("");

  const product = props.products.find((product) => product.slug === slug);

  if (props.isLoading)
    return (
      <section className="py-[48px]">
        <p role="status">Ładowanie produktu...</p>
      </section>
    );
  if (props.catalogError !== "")
    return (
      <section className="py-[48px]">
        <p role="alert">{props.catalogError}</p>
        <button
          type="button"
          className="mt-[12px] min-h-[44px] px-[16px] py-[10px] border-[1px] border-[#e5ddd3] rounded-[8px] bg-[white] text-[#29241f]"
          onClick={props.onRetry}
        >
          Spróbuj ponownie
        </button>
      </section>
    );

  if (product === undefined) {
    return (
      <section className="py-[48px]">
        <h1 className="text-[30px] font-[600]">Nie znaleziono produktu</h1>
        <Link
          to="/#kolekcja"
          className="mt-[24px] min-h-[44px]  inline-flex items-center text-[#765341] font-[600] hover:underline"
        >
          Wróć do kolekcji
        </Link>
      </section>
    );
  }

  const selectedVariant = product.variants.find(
    (productVariant) => productVariant.id === Number(selectedVariantId),
  );
  const sizeOption = product.variants.map((productSize) => (
    <option
      key={productSize.id}
      value={productSize.id}
      disabled={!productSize.isAvailable}
    >
      {productSize.size} {!productSize.isAvailable && "- niedostępny"}
    </option>
  ));

  return (
    <section className="py-[48px]">
      <h1 className="text-[36px] font-[600] leading-[1.2]">{product.name}</h1>
      <p className="text-[12px] mt-[12px] text-[#6b6259] uppercase">
        {product.category}
      </p>
      <p className="mt-[24px] max-w-[680px] leading-[1.7] text-[#6b6259]">
        {product.description}
      </p>
      <p className="mt-[24px] text-[24px] font-[600]">
        {selectedVariant !== undefined
          ? formatPrice(selectedVariant.price)
          : formatPrice(product.price)}
      </p>
      <div className="mt-[24px] flex flex-col gap-[8px]">
        <label htmlFor="size">Rozmiar</label>
        <select
          id="size"
          className="w-full max-w-[320px] min-h-[44px] border-[1px] border-[#e5ddd3] rounded-[8px] bg-[white] text-[#29241f] px-[12px] py-[10px]"
          name="size"
          value={selectedVariantId}
          onChange={(event) => {
            setVariantId(event.currentTarget.value);
            setAddedVariantId("");
          }}
        >
          <option value="" disabled>
            Wybierz rozmiar
          </option>
          {sizeOption}
        </select>
        <button
          type="button"
          className="mt-[8px] self-start min-h-[44px] px-[24px] rounded-[8px] bg-[#765341] text-[white] disabled:opacity-[50%] disabled:cursor-not-allowed "
          disabled={
            selectedVariant === undefined || !selectedVariant.isAvailable
          }
          onClick={() => {
            if (selectedVariant === undefined || !selectedVariant.isAvailable)
              return;
            props.onAddCart(product.id, selectedVariant.id);
            setAddedVariantId(selectedVariantId);
          }}
        >
          Dodaj do koszyka
        </button>
        <p role="status">
          {addedVariantId !== "" && addedVariantId === selectedVariantId
            ? "Dodano do koszyka"
            : ""}
        </p>
        {selectedVariant !== undefined && (
          <p>Wybrany rozmiar: {selectedVariant.size}</p>
        )}
      </div>
      <Link
        to="/#kolekcja"
        className="mt-[24px] min-h-[44px]  inline-flex items-center text-[#765341] font-[600] hover:underline"
      >
        Wróć do kolekcji
      </Link>
    </section>
  );
}
