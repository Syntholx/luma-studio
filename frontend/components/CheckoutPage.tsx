import { type CartItem } from "../cart";
import { Link } from "react-router-dom";
import { useState, type FormEvent, useEffect } from "react";
import { getCartTotal } from "../cart";
import { formatPrice } from "../format-price";
import { products } from "../products";
import { useRef } from "react";
import { hasUnavailableCartItems } from "../cart";
import { deliveryMethods } from "../delivery";
type OrderConfirmation = {
  totalQuantity: number;
  totalPrice: number;
  deliveryName: string;
  deliveryPrice: number;
  grandTotal: number;
};

export function CheckoutPage(props: {
  items: CartItem[];
  onClearCart: () => void;
}) {
  const [selectedDeliveryId, setSelectedDeliveryId] = useState("pickup");
  const selectedDelivery = deliveryMethods.find(
    (delivery) => delivery.id === selectedDeliveryId,
  );
  const hasUnavailableItems = hasUnavailableCartItems(props.items);
  const [orderConfirmation, setOrderConfirmation] =
    useState<OrderConfirmation | null>(null);
  const confirmationHeadingRef = useRef<HTMLHeadingElement>(null);
  const [formError, setFormError] = useState("");
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    if (hasUnavailableItems) {
      setFormError("Usuń niedostępne produkty, by kontynuować.");
      return;
    }
    if (selectedDelivery === undefined) {
      setFormError("Wybierz sposób dostawy");
      return;
    }
    const formData = new FormData(event.currentTarget);
    const email = formData.get("email");
    const firstName = formData.get("firstName");
    if (typeof email !== "string" || typeof firstName !== "string") return;
    const normalizedEmail = email.trim();
    const normalizedFirstName = firstName.trim();
    if (normalizedEmail === "" || normalizedFirstName === "") {
      setFormError("Uzupelnij imię i adres e-mail");
      return;
    }

    setOrderConfirmation({
      totalPrice,
      totalQuantity,
      deliveryName: selectedDelivery.name,
      deliveryPrice: selectedDelivery.price,
      grandTotal,
    });
    props.onClearCart();
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
          Zamówienie demonstracyjne zatwierdzone
        </h1>
        <p className="mt-[16px] text-[#6b6259]">
          To tylko symulacja. Nie utworzono prawdziwego zamówienia ani
          płatności.
        </p>
        <p className="text-[16px] font-[400]">
          Ilość sztuk: {orderConfirmation.totalQuantity}
        </p>
        <p className="text-[16px] font-[400]">
          Produkty {formatPrice(orderConfirmation.totalPrice)}
        </p>
        <p className="text-[16px] font-[400]">
          Dostawa {orderConfirmation.deliveryName}{" "}
          {formatPrice(orderConfirmation.deliveryPrice)}
        </p>
        <p className="text-[24px] font-[600]">
          Razem {formatPrice(orderConfirmation.grandTotal)}
        </p>
        <Link
          to={"/#kolekcja"}
          className="mt-[24px] min-h-[44px] text-[#765341] font-[600] hover:underline inline-flex items-center"
        >
          Wróć do kolekcji
        </Link>
      </section>
    );
  }

  if (props.items.length === 0) {
    return (
      <section className="py-[48px]">
        <h1 className="text-[36px] font-[600]">Twój koszyk jest pusty</h1>
        <Link
          to={"/#kolekcja"}
          className="mt-[24px] inline-flex items-center min-h-[44px] text-[#765341] font-[600] hover:underline"
        >
          Wróć do kolekcji
        </Link>
      </section>
    );
  }

  if (selectedDelivery === undefined) {
    return (
      <section className="py-[48px]">
        <h1 className="text-[36px] font-[600]">
          Nie znaleziono sposobu dostawy
        </h1>
        <p>Wróć do koszyka i spróbuj ponownie.</p>
      </section>
    );
  }

  const totalPrice = getCartTotal(props.items);
  const grandTotal = totalPrice + selectedDelivery.price;

  const totalQuantity = props.items.reduce(
    (sum, cartItem) => sum + cartItem.quantity,
    0,
  );

  return (
    <section className="py-[48px]">
      <h1 className="text-[36px] font-[600]">Zamówienie demonstracyjne</h1>
      <p className="mt-[16px] text-[#6b6259]">
        To wersja demonstracyjna. Nie podawaj prawdziwych danych.
      </p>
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-[480px] flex flex-col gap-[24px] mt-[32px]"
      >
        <div className="flex flex-col gap-[8px]">
          <label htmlFor="firstName">Imię</label>
          <input
            className="bg-[white] border-[#e5ddd3] rounded-[8px] min-h-[44px] px-[12px] py-[10px] border-[1px]"
            id="firstName"
            name="firstName"
            type="text"
            required
            autoComplete="given-name"
          ></input>
        </div>
        <div className="flex flex-col gap-[8px]">
          <label htmlFor="email">Podaj swój e-mail</label>
          <input
            className="bg-[white] border-[#e5ddd3] rounded-[8px] min-h-[44px] px-[12px] py-[10px] border-[1px]"
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
          ></input>
        </div>

        <fieldset>
          <legend>Sposób dostawy</legend>
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
                  {delivery.name} {formatPrice(delivery.price)}
                </label>
              );
            })}
          </div>
        </fieldset>

        {hasUnavailableItems && (
          <p className="text-[14px] text-[#9b2c2c]">
            Usuń niedostępne produkty z koszyka, aby zatwierdzić zamówienie.
          </p>
        )}
        <button
          type="submit"
          disabled={hasUnavailableItems}
          className="px-[24px] rounded-[8px]  inline-flex self-start items-center justify-center min-h-[44px] text-[white] bg-[#765341] font-[600] disabled:opacity-[50%] disabled:cursor-not-allowed"
        >
          Zatwierdź zamówienie demonstracyjne
        </button>
        <p role="alert">{formError}</p>
      </form>
      <section className="mt-[24px] px-[24px] py-[24px] bg-[#f0e9e1] rounded-[12px]">
        <h2 className="text-[20px] font-[600]">Podsumowanie zamówienia</h2>
        <ul className="mt-[16px] flex flex-col gap-[12px]">
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
              <li
                key={cartItem.variantId}
                className="pb-[12px] border-b-[1px] border-[#e5ddd3]"
              >
                <p>{product.name}</p>
                <p>
                  Rozmiar: {variant.size} · Ilość: {cartItem.quantity}
                </p>
                <p>{formatPrice(variant.price * cartItem.quantity)}</p>
                {!variant.isAvailable && (
                  <p className="text-[14px] font-[600] text-[#9b2c2c]">
                    Produkt niedostępny
                  </p>
                )}
              </li>
            );
          })}
        </ul>

        <p className="text-[16px] font-[400]"> Ilość: {totalQuantity}</p>
        <p className="text-[16px] font-[400]">
          Produkty: {formatPrice(totalPrice)}
        </p>
        <p>
          Dostawa: {selectedDelivery.name} {formatPrice(selectedDelivery.price)}
        </p>
        <p className="text-[24px] font-[600]">
          Razem {formatPrice(grandTotal)}
        </p>
      </section>
      <Link
        to={"/koszyk"}
        className="mt-[24px] min-h-[44px] text-[#765341] font-[600] hover:underline inline-flex items-center"
      >
        Wróć do koszyka
      </Link>
    </section>
  );
}
