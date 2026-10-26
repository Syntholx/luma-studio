export type DeliveryMethod = {
  id: string;
  name: string;
  price: number;
};

export const deliveryMethods: DeliveryMethod[] = [
  {
    id: "pickup",
    name: "Punkt odbioru",
    price: 9.99,
  },
  {
    id: "courier",
    name: "Kurier",
    price: 14.99,
  },
];

export function getDeliveryPrice(
  productsTotal: number,
  basePrice: number,
): number {
  if (productsTotal < freeDeliveryThreshold) {
    return basePrice;
  }
  return 0;
}

export const freeDeliveryThreshold = 200;
