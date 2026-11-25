import { type Product } from "../products";
import { ProductCard } from "./ProductCard";
export function ProductList(props: { products: Product[] }) {
  if (props.products.length === 0) {
    return (
      <p className="mt-[32px] px-[24px] py-[24px] text-[#6b6259] border-[1px] rounded-[16px] border-[#e5ddd3]">
        No matching products.
      </p>
    );
  }
  return (
    <div className="mt-[32px] grid grid-cols-1 gap-[24px] md:grid-cols-2 ">
      {props.products.map((product) => (
        <ProductCard product={product} key={product.id} />
      ))}
    </div>
  );
}
