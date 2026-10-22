export type Product = {
  id: number;
  name: string;
  category: string;
  price: number;
  description: string;
};

export const products: Product[] = [
  {
    id: 2,
    name: "Naszyjnik Sol",
    category: "Naszyjniki",
    price: 122,
    description: "Subtelny naszyjnik inspirowany ciepłem słońca.",
  },
  {
    id: 1,
    name: "Bransoletka Aura",
    category: "Bransoletki",
    price: 89.5,
    description: "Delikatna bransoletka z kolorowych koralików.",
  },
  {
    id: 3,
    name: "Kolczyki Luna",
    category: "Kolczyki",
    price: 109,
    description: "Lekkie kolczyki na co dzień i wyjątkowe okazje.",
  },
];
