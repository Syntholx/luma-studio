import { type CartItem } from "../cart";
import { Link } from "react-router-dom";
import { useState, type FormEvent, useEffect } from "react";
import { getCartTotal } from "../cart";
import { formatPrice } from "../format-price";
import type { Product } from "../products";
import { useRef } from "react";
import { hasUnavailableCartItems } from "../cart";
import { deliveryMethods } from "../delivery";
import { freeDeliveryThreshold } from "../delivery";
import { getDeliveryPrice } from "../delivery";
import { ProductImage } from "./ProductImage";
import type { OrderRequest } from "../orders";
import { createOrder } from "../services/orders";

type OrderConfirmation = {
  totalQuantity: number;
  totalPrice: number;
  deliveryName: string;
  deliveryPrice: number;
  grandTotal: number;
  pickupPoint: string | null;
};

export function CheckoutPage(props: {
  items: CartItem[];
  onClearCart: () => void;
  products: Product[];
  isLoading: boolean;
  catalogError: string;
  onRetry: () => void;
}) {
  const [selectedDeliveryId, setSelectedDeliveryId] = useState("pickup");
  const selectedDelivery = deliveryMethods.find(
    (delivery) => delivery.id === selectedDeliveryId,
  );
  const hasUnavailableItems = hasUnavailableCartItems(
    props.items,
    props.products,
  );
  const [orderConfirmation, setOrderConfirmation] =
    useState<OrderConfirmation | null>(null);
  const confirmationHeadingRef = useRef<HTMLHeadingElement>(null);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingAttempt, setPendingAttempt] = useState<{
    order: OrderRequest;
    key: string;
  } | null>(null);
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;
    setFormError("");
    let normalizedPickupPoint: string | null = null;

    let attempt = pendingAttempt;
    if (attempt === null) {
      if (hasUnavailableItems) {
        setFormError("Remove unavailable products to continue.");
        return;
      }
      if (selectedDelivery === undefined) {
        setFormError("Choose a delivery method");
        return;
      }
      const formData = new FormData(event.currentTarget);
      const email = formData.get("email");
      const firstName = formData.get("firstName");
      const pickupPoint = formData.get("pickupPoint");
      if (typeof email !== "string" || typeof firstName !== "string") return;
      const normalizedEmail = email.trim();
      const normalizedFirstName = firstName.trim();
      if (normalizedEmail === "" || normalizedFirstName === "") {
        setFormError("Enter your name and email address");
        return;
      }
      if (selectedDelivery.id === "pickup") {
        if (typeof pickupPoint !== "string") {
          setFormError("Enter the pickup point code");
          return;
        }
        normalizedPickupPoint = pickupPoint.trim();
        if (normalizedPickupPoint === "") {
          setFormError("Enter the pickup point code.");
          return;
        }
      }
      const order: OrderRequest = {
        customerName: normalizedFirstName,
        email: normalizedEmail,
        deliveryMethodId: selectedDelivery.id,
        pickupPoint: normalizedPickupPoint,
        items: props.items.map((item) => ({
          variantId: item.variantId,
          quantity: item.quantity,
        })),
      };
      const key = crypto.randomUUID();
      attempt = { order, key };
      setPendingAttempt(attempt);
    }
    try {
      setIsSubmitting(true);
      const confirmation = await createOrder(attempt.order, attempt.key);
      setOrderConfirmation(confirmation);
      setPendingAttempt(null);
      props.onClearCart();
    } catch (error) {
      setFormError("Could not submit your order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }
  useEffect(() => {
    if (orderConfirmation !== null) {
      confirmationHeadingRef.current?.focus();
    }
  }, [orderConfirmation]);
  if (orderConfirmation !== null) {
    return (
      <section className="py-[48px]">
        <h1
          className="text-[36px] font-[600]"
          ref={confirmationHeadingRef}
          tabIndex={-1}
        >
          Demo order confirmed
        </h1>
        <p className="mt-[16px] text-[#6b6259]">
          This is a simulation. No real order was placed or payment
          taken.
        </p>
        <p className="text-[16px] font-[400]">
          Total quantity: {orderConfirmation.totalQuantity}
        </p>
        <p className="text-[16px] font-[400]">
          Items {formatPrice(orderConfirmation.totalPrice)}
        </p>
        <p className="text-[16px] font-[400]">
          Delivery {orderConfirmation.deliveryName}{" "}
          {formatPrice(orderConfirmation.deliveryPrice)}
        </p>
        {orderConfirmation.pickupPoint !== null && (
          <p>Pickup point code: {orderConfirmation.pickupPoint}</p>
        )}
        <p className="text-[24px] font-[600]">
          Total {formatPrice(orderConfirmation.grandTotal)}
        </p>
        <Link
          to={"/#kolekcja"}
          className="mt-[24px] min-h-[44px] text-[#765341] font-[600] hover:underline inline-flex items-center"
        >
          Back to the collection
        </Link>
      </section>
    );
  }
  if (props.isLoading) {
    return (
      <section className="py-[48px]">
        <p role="status">Loading your order…</p>
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
  if (props.items.length === 0) {
    return (
      <section className="py-[48px]">
        <h1 className="text-[36px] font-[600]">Your cart is empty</h1>
        <Link
          to={"/#kolekcja"}
          className="mt-[24px] inline-flex items-center min-h-[44px] text-[#765341] font-[600] hover:underline"
        >
          Back to the collection
        </Link>
      </section>
    );
  }

  if (selectedDelivery === undefined) {
    return (
      <section className="py-[48px]">
        <h1 className="text-[36px] font-[600]">
          Delivery method not found
        </h1>
        <p>Return to your cart and try again.</p>
      </section>
    );
  }

  const totalPrice = getCartTotal(props.items, props.products);
  const deliveryPrice = getDeliveryPrice(totalPrice, selectedDelivery.price);
  const grandTotal = totalPrice + deliveryPrice;

  const totalQuantity = props.items.reduce(
    (sum, cartItem) => sum + cartItem.quantity,
    0,
  );

  return (
    <section className="py-[48px]">
      <h1 className="text-[36px] font-[600]">Demo order</h1>
      <p className="mt-[16px] text-[#6b6259]">
        This is a demo. Please use fictional details.
      </p>
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-[480px] flex flex-col gap-[24px] mt-[32px]"
      >
        <div className="flex flex-col gap-[8px]">
          <label htmlFor="firstName">First name</label>
          <input
            className="bg-[white] border-[#e5ddd3] rounded-[8px] min-h-[44px] px-[12px] py-[10px] border-[1px]"
            id="firstName"
            name="firstName"
            type="text"
            required
            autoComplete="given-name"
            disabled={pendingAttempt !== null}
          ></input>
        </div>
        <div className="flex flex-col gap-[8px]">
          <label htmlFor="email">Enter your email address</label>
          <input
            className="bg-[white] border-[#e5ddd3] rounded-[8px] min-h-[44px] px-[12px] py-[10px] border-[1px]"
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            disabled={pendingAttempt !== null}
          ></input>
        </div>

        <fieldset disabled={pendingAttempt !== null}>
          <legend>Delivery method</legend>
          <div className="flex flex-col gap-[12px]">
            {deliveryMethods.map((delivery) => {
              return (
                <label
                  key={delivery.id}
                  className="flex items-center gap-[8px] min-h-[44px]"
                >
                  <input
                    className="w-[20px] h-[20px] shrink-0"
                    name="delivery"
                    type="radio"
                    value={delivery.id}
                    checked={delivery.id === selectedDeliveryId}
                    onChange={(event) =>
                      setSelectedDeliveryId(event.currentTarget.value)
                    }
                  ></input>
                  {delivery.name}{" "}
                  {formatPrice(getDeliveryPrice(totalPrice, delivery.price))}
                </label>
              );
            })}
          </div>
          <p className="mt-[12px] text-[14px] text-[#6b6259]">
            {totalPrice >= freeDeliveryThreshold
              ? "Free delivery"
              : "Amount remaining for free delivery " +
                formatPrice(freeDeliveryThreshold - totalPrice)}
          </p>
        </fieldset>

        {selectedDelivery.id === "pickup" && (
          <div className="flex flex-col gap-[8px]">
            <label htmlFor="pickupPoint">Pickup point code</label>
            <input
              className="bg-[white] border-[#e5ddd3] rounded-[8px] min-h-[44px] px-[12px] py-[10px] border-[1px]"
              type="text"
              id="pickupPoint"
              name="pickupPoint"
              required
              disabled={pendingAttempt !== null}
            ></input>
            <p className="text-[14px] text-[#6b6259]">
              Enter a fictional code, e.g. DEMO01.
            </p>
          </div>
        )}

        {hasUnavailableItems && (
          <p className="text-[14px] text-[#9b2c2c]">
            Remove unavailable items before placing your order.
          </p>
        )}
        <button
          type="submit"
          disabled={
            isSubmitting || (pendingAttempt === null && hasUnavailableItems)
          }
          className="px-[24px] rounded-[8px]  inline-flex self-start items-center justify-center min-h-[44px] text-[white] bg-[#765341] font-[600] disabled:opacity-[50%] disabled:cursor-not-allowed"
        >
          {isSubmitting
            ? "Submitting order…"
            : pendingAttempt !== null
              ? "Try submitting again"
              : "Place demo order"}
        </button>
        <p role="alert">{formError}</p>
      </form>
      <section className="mt-[24px] px-[24px] py-[24px] bg-[#f0e9e1] rounded-[12px]">
        <h2 className="text-[20px] font-[600]">Order summary</h2>
        <ul className="mt-[16px] flex flex-col gap-[12px]">
          {props.items.map((cartItem) => {
            const product = props.products.find(
              (product) => product.id === cartItem.productId,
            );
            if (product === undefined) return null;
            const variant = product.variants.find(
              (variant) => variant.id === cartItem.variantId,
            );
            if (variant === undefined) return null;

            return (
              <li
                key={cartItem.variantId}
                className="pb-[12px] border-b-[1px] border-[#e5ddd3] flex items-center gap-3"
              >
                <ProductImage
                  key={product.imageUrl}
                  className=" w-16 h-16 rounded-lg object-contain flex-shrink-0"
                  imageUrl={product.imageUrl}
                  imageAlt={product.imageAlt}
                />
                <div className="flex flex-col min-w-0 gap-[8px]">
                  <p>{product.name}</p>
                  <p>
                    Size: {variant.size} · Quantity: {cartItem.quantity}
                  </p>
                  <p>{formatPrice(variant.price * cartItem.quantity)}</p>
                  {!variant.isAvailable && (
                    <p className="text-[14px] font-[600] text-[#9b2c2c]">
                      Product unavailable
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>

        <p className="text-[16px] font-[400]"> Quantity: {totalQuantity}</p>
        <p className="text-[16px] font-[400]">
          Items: {formatPrice(totalPrice)}
        </p>
        <p>
          Delivery: {selectedDelivery.name} {formatPrice(deliveryPrice)}
        </p>

        <p className="text-[24px] font-[600]">
          Total {formatPrice(grandTotal)}
        </p>
      </section>
      <Link
        to={"/koszyk"}
        className="mt-[24px] min-h-[44px] text-[#765341] font-[600] hover:underline inline-flex items-center"
      >
        Back to cart
      </Link>
    </section>
  );
}
