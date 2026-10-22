import { useParams } from "react-router-dom";
import { products } from "../products";
import { Link } from "react-router-dom";
import { formatPrice } from "../format-price";
export function ProductDetailsPage() {
  const { slug } = useParams();
  const product = products.find((product) => product.slug === slug);

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
        {formatPrice(product.price)}
      </p>
      <Link
        to="/#kolekcja"
        className="mt-[24px] min-h-[44px]  inline-flex items-center text-[#765341] font-[600] hover:underline"
      >
        Wróć do kolekcji
      </Link>
    </section>
  );
}
