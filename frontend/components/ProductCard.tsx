import { type Product } from "../products";
import { Link } from "react-router-dom";
import { formatPrice } from "../format-price";
import { ProductImage } from "./ProductImage";

export function ProductCard(props: { product: Product }) {
  return (
    <article className=" px-[24px] py-[24px] bg-[white] border-[1px] border-[#e5ddd3] rounded-[16px]">
      <ProductImage
        imageUrl={props.product.imageUrl}
        imageAlt={props.product.imageAlt}
        key={props.product.imageUrl}
        className="w-full rounded-[12px] mb-[16px] aspect-square object-contain"
      />
      <p className="text-[12px] text-[#6b6259] uppercase">
        {props.product.category}
      </p>
      <h3 className="mt-[8px] text-[22px] font-[600]">{props.product.name}</h3>
      <p className="mt-[8px] text-[#6b6259] leading-[1.7]">
        {props.product.description}
      </p>
      <p className="mt-[16px] text-[18px] font-[600]">
        {formatPrice(props.product.price)}
      </p>
      <Link
        to={`/produkty/${props.product.slug}`}
        className="mt-[16px] min-h-[44px] inline-flex items-center w-fit text-[#765341] font-[600] hover:underline"
      >
        Zobacz produkt
      </Link>
    </article>
  );
}
