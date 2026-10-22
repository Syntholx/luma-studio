import { type Product } from "../products";

const formatter = new Intl.NumberFormat("pl-Pl", {
  style: "currency",
  currency: "PLN",
});

export function ProductCard(props: { product: Product }) {
  return (
    <article className=" px-[24px] py-[24px] bg-[white] border-[1px] border-[#e5ddd3] rounded-[16px]">
      <p className="text-[12px] text-[#6b6259] uppercase">
        {props.product.category}
      </p>
      <h3 className="mt-[8px] text-[22px] font-[600]">{props.product.name}</h3>
      <p className="mt-[8px] text-[#6b6259] leading-[1.7]">
        {props.product.description}
      </p>
      <p className="mt-[16px] text-[18px] font-[600]">
        {formatter.format(props.product.price)}
      </p>
    </article>
  );
}
