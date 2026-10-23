import { type CartItem } from "../cart";
import { products } from "../products";
import { formatPrice } from "../format-price";
export function CartPage(props: {
  items: CartItem[];
  onRemoveFromCart: (variantId: number) => void;
  onChangeQuantity: (variantId: number, change: number) => void;
}) {
  const totalQuantity = props.items.reduce(
    (sum, cartItem) => sum + cartItem.quantity,
    0,
  );

  const totalPrice = props.items.reduce((sum, cartItem) => {
    const product = products.find(
      (product) => product.id === cartItem.productId,
    );
    if (product === undefined) return sum;

    const variant = product.variants.find(
      (variant) => variant.id === cartItem.variantId,
    );
    if (variant === undefined) return sum;

    return sum + variant.price * cartItem.quantity;
  }, 0);
  return (
    <section className="py-[48px]">
      <h1 className="text-[36px] font-[600]">Koszyk</h1>
      <p>Liczba sztuk: {totalQuantity}</p>
      {props.items.length === 0 && (
        <p className="mt-[24px]">Twój koszyk jest pusty </p>
      )}
      {props.items.map((cartItem) => {
        const product = products.find(
          (product) => product.id === cartItem.productId,
        );
        if (product === undefined) return null;
        const variant = product.variants.find(
          (variant) => variant.id === cartItem.variantId,
        );
        if (variant === undefined) return null;

        return (
          <div
            key={cartItem.variantId}
            className="bg-[white] border-[1px] border-[#e5ddd3] rounded-[12px]
          px-[24px] py-[24px] mt-[16px] flex flex-col gap-[8px]
          "
          >
            <h2 className="text-[20px] font-[600]">{product.name}</h2>
            <p className="text-[#6b6259]">
              Rozmiar: {variant.size} · Ilość: {cartItem.quantity}
            </p>
            <p>Cena jednej sztuki: {formatPrice(variant.price)} </p>
            <p className="font-[600]">
              Wartość pozycji: {formatPrice(variant.price * cartItem.quantity)}
            </p>
            <div className="flex items-center gap-[12px]">
              <button
                disabled={cartItem.quantity <= 1}
                className="w-[44px] h-[44px] border-[1px] border-[#e5ddd3] rounded-[8px] disabled:opacity-[50%] disabled:cursor-not-allowed"
                type="button"
                aria-label={`Zmniejsz ilość ${product.name} ${variant.size}`}
                onClick={() => props.onChangeQuantity(cartItem.variantId, -1)}
              >
                −
              </button>
              <span>{cartItem.quantity}</span>
              <button
                aria-label={`Zwiększ ilość ${product.name} ${variant.size}`}
                type="button"
                className="h-[44px] w-[44px] border-[#e5ddd3] border-[1px] rounded-[8px]"
                onClick={() => props.onChangeQuantity(cartItem.variantId, +1)}
              >
                +
              </button>
            </div>
            <button
              aria-label={`Usuń ${product.name} rozmiar ${variant.size} z koszyka`}
              type="button"
              className="text-left min-h-[44px] self-start px-[16px] border-[1px] border-[#e5ddd3] rounded-[8px]"
              onClick={() => props.onRemoveFromCart(cartItem.variantId)}
            >
              Usuń
            </button>
          </div>
        );
      })}
      {props.items.length > 0 && (
        <div className="mt-[24px] px-[24px] py-[24px] bg-[#f0e9e1] rounded-[12px]">
          <h2 className="text-[20px] font-[600]">Podsumowanie</h2>
          <p className="mt-[12px] text-[24px] font-[600]">
            Razem: {formatPrice(totalPrice)}
          </p>
        </div>
      )}
    </section>
  );
}
