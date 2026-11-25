import { getCartTotal, type CartItem } from "../cart";
import type { Product } from "../products";
import { formatPrice } from "../format-price";
import { Link } from "react-router-dom";
import { hasUnavailableCartItems } from "../cart";
import { ProductImage } from "./ProductImage";
export function CartPage(props: {
  items: CartItem[];
  onRemoveFromCart: (variantId: number) => void;
  onChangeQuantity: (variantId: number, change: number) => void;
  products: Product[];
  isLoading: boolean;
  catalogError: string;
  onRetry: () => void;
  onClearCart: () => void;
}) {
  if (props.isLoading) {
    return (
      <section className="py-[48px]">
        <p role="status" className="mt-[16px]">
          Loading your cart…
        </p>
      </section>
    );
  }
  if (props.catalogError) {
    return (
      <section className="py-[48px]">
        <p role="alert" className="mt-[16px] text-[#9b2c2c]">
          {props.catalogError}
        </p>
        <button
          type="button"
          className="mt-[16px] min-h-[44px] px-[16px] py-[10px] border-[1px] border-[#e5ddd3] rounded-[8px] bg-[white] text-[#29241f] cursor-pointer"
          onClick={props.onRetry}
        >
          Try again
        </button>
      </section>
    );
  }

  const hasUnavailableCart = hasUnavailableCartItems(
    props.items,
    props.products,
  );

  const totalQuantity = props.items.reduce(
    (sum, cartItem) => sum + cartItem.quantity,
    0,
  );

  const totalPrice = getCartTotal(props.items, props.products);
  return (
    <section className="py-[48px]">
      <h1 className="text-[36px] font-[600]">Cart</h1>
      <p>Total quantity: {totalQuantity}</p>
      {props.items.length > 0 && (
        <button
          className="text-left min-h-[44px] self-start px-[16px] border-[1px] border-[#e5ddd3] rounded-[8px] mt-[16px]"
          type="button"
          onClick={() => {
            props.onClearCart();
          }}
        >
          Clear cart
        </button>
      )}
      {props.items.length === 0 && (
        <>
          <p className="mt-[24px]">Your cart is empty </p>
          <Link
            to="/#kolekcja"
            className="mt-[16px] min-h-[44px] inline-flex items-center text-[#765341] font-[600] hover:underline"
          >
            Browse the collection
          </Link>
        </>
      )}
      {props.items.map((cartItem) => {
        const product = props.products.find(
          (product) => product.id === cartItem.productId,
        );
        if (product === undefined) {
          return (
            <div
              key={cartItem.variantId}
              className="bg-[white] border-[1px] border-[#e5ddd3] rounded-[12px]
          px-[24px] py-[24px] mt-[16px] flex flex-col gap-[8px]
          "
            >
              <p role="status" className="text-[#9b2c2c]">
                This item is no longer available in the catalogue.
              </p>
              <button
                type="button"
                className="text-left min-h-[44px] self-start px-[16px] border-[1px] border-[#e5ddd3] rounded-[8px]"
                onClick={() => props.onRemoveFromCart(cartItem.variantId)}
              >
                Remove
              </button>
            </div>
          );
        }
        const variant = product.variants.find(
          (variant) => variant.id === cartItem.variantId,
        );
        if (variant === undefined) {
          return (
            <div
              key={cartItem.variantId}
              className="bg-[white] border-[1px] border-[#e5ddd3] rounded-[12px]
          px-[24px] py-[24px] mt-[16px] flex flex-col gap-[8px]
          "
            >
              <p role="status" className="text-[#9b2c2c]">
                This item is no longer available in the catalogue.
              </p>
              <button
                type="button"
                className="text-left min-h-[44px] self-start px-[16px] border-[1px] border-[#e5ddd3] rounded-[8px]"
                onClick={() => props.onRemoveFromCart(cartItem.variantId)}
              >
                Remove
              </button>
            </div>
          );
        }

        return (
          <div
            key={cartItem.variantId}
            className="bg-[white] border-[1px] border-[#e5ddd3] rounded-[12px]
          px-[24px] py-[24px] mt-[16px] flex flex-col gap-[8px]
          "
          >
            <div className="flex flex-col md:flex-row gap-4 items-start">
              <ProductImage
                className="w-20 h-20 md:w-24 md:h-24 flex-shrink-0 object-contain rounded-lg"
                key={product.imageUrl}
                imageUrl={product.imageUrl}
                imageAlt={product.imageAlt}
              />
              <div className="flex flex-col gap-[8px]">
                <h2 className="text-[20px] font-[600]">
                  <Link
                    to={`/produkty/${product.slug}`}
                    className="hover:underline"
                  >
                    {product.name}
                  </Link>
                </h2>
                <p className="text-[#6b6259]">
                  Size: {variant.size} · Quantity: {cartItem.quantity}
                </p>

                {!variant.isAvailable && (
                  <p className="text-[14px] font-[600] text-[#9b2c2c]">
                    Product unavailable
                  </p>
                )}
                <p>Unit price: {formatPrice(variant.price)} </p>
                <p className="font-[600]">
                  Line total:{" "}
                  {formatPrice(variant.price * cartItem.quantity)}
                </p>
                <div className="flex items-center gap-[12px]">
                  <button
                    disabled={cartItem.quantity <= 1}
                    className="w-[44px] h-[44px] border-[1px] border-[#e5ddd3] rounded-[8px] disabled:opacity-[50%] disabled:cursor-not-allowed"
                    type="button"
                    aria-label={`Decrease quantity for ${product.name} ${variant.size}`}
                    onClick={() =>
                      props.onChangeQuantity(cartItem.variantId, -1)
                    }
                  >
                    −
                  </button>
                  <span>{cartItem.quantity}</span>
                  <button
                    disabled={!variant.isAvailable}
                    aria-label={`Increase quantity for ${product.name} ${variant.size}`}
                    type="button"
                    className="h-[44px] w-[44px] border-[#e5ddd3] border-[1px] rounded-[8px] disabled:opacity-[50%] disabled:cursor-not-allowed"
                    onClick={() =>
                      props.onChangeQuantity(cartItem.variantId, +1)
                    }
                  >
                    +
                  </button>
                </div>
                <button
                  aria-label={`Remove ${product.name}, size ${variant.size}, from cart`}
                  type="button"
                  className="text-left min-h-[44px] self-start px-[16px] border-[1px] border-[#e5ddd3] rounded-[8px]"
                  onClick={() => props.onRemoveFromCart(cartItem.variantId)}
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        );
      })}
      {props.items.length > 0 && (
        <div className="mt-[24px] px-[24px] py-[24px] bg-[#f0e9e1] rounded-[12px]">
          <h2 className="text-[20px] font-[600]">Summary</h2>
          <p className="mt-[12px] text-[24px] font-[600]">
            Total: {formatPrice(totalPrice)}
          </p>
          {hasUnavailableCart && (
            <p className="text-[14px] text-[#9b2c2c] mt-[16px]">
              Your cart contains unavailable items. Remove them before placing
              your order.
            </p>
          )}
          <Link
            to={"/zamowienie"}
            className="mt-[24px] min-h-[44px] px-[24px] bg-[#765341] text-[white] rounded-[8px] w-auto inline-flex items-center "
          >
            Proceed to checkout
          </Link>
        </div>
      )}
    </section>
  );
}
