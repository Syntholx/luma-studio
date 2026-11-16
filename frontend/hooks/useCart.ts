import { loadCart } from "../cart";
import { useState } from "react";
import { type CartItem } from "../cart";
import { useEffect } from "react";
import { type Product } from "../products";

export function useCart(props: { catalogProducts: Product[] }) {
  const [cart, setCart] = useState<CartItem[]>(loadCart);
  useEffect(() => {
    try {
      localStorage.setItem("luma-studio-cart", JSON.stringify(cart));
    } catch (error) {
      console.warn("Nie udało się zapisać koszyka");
    }
  }, [cart]);
  function clearCart() {
    setCart([]);
  }
  function addToCart(
    productId: number,
    variantId: number,
    countAddProducts: number,
  ) {
    setCart((previousCart) => {
      const existingItem = previousCart.find(
        (cartItem) =>
          cartItem.productId === productId && cartItem.variantId === variantId,
      );
      if (existingItem !== undefined) {
        return previousCart.map((cartItem) =>
          cartItem.productId === productId && cartItem.variantId === variantId
            ? { ...cartItem, quantity: cartItem.quantity + countAddProducts }
            : cartItem,
        );
      }
      return [
        ...previousCart,
        { productId, variantId, quantity: countAddProducts },
      ];
    });
  }
  function removeFromCart(variantId: number) {
    setCart((previousCart) => {
      const removeCart = previousCart.filter(
        (cartItem) => cartItem.variantId !== variantId,
      );
      return removeCart;
    });
  }
  function changeQuantity(variantId: number, change: number) {
    setCart((previousCart) => {
      const existingItem = previousCart.find(
        (cartItem) => cartItem.variantId === variantId,
      );
      if (existingItem === undefined) return previousCart;
      const product = props.catalogProducts.find(
        (product) => product.id === existingItem.productId,
      );
      if (product === undefined) return previousCart;

      const variant = product.variants.find(
        (variant) => variant.id === variantId,
      );
      if (variant === undefined) return previousCart;
      if (!variant.isAvailable && change > 0) return previousCart;

      const updatedCart = previousCart.map((cartItem) =>
        cartItem.variantId === variantId
          ? { ...cartItem, quantity: Math.max(1, cartItem.quantity + change) }
          : cartItem,
      );
      return updatedCart;
    });
  }
  const cartQuantity = cart.reduce(
    (sum, cartItem) => sum + cartItem.quantity,
    0,
  );
  return {
    clearCart,
    addToCart,
    removeFromCart,
    changeQuantity,
    cartQuantity,
    cart,
  };
}
