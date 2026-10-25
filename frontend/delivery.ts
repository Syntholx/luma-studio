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
