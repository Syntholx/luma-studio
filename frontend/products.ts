export type Product = {
  id: number;
  name: string;
  category: string;
  price: number;
  description: string;
  slug: string;
  variants: ProductVariant[];
};

export const products: Product[] = [
  {
    id: 2,
    name: "Naszyjnik Sol",
    category: "Naszyjniki",
    price: 122,
    description: "Subtelny naszyjnik inspirowany ciepłem słońca.",
    slug: "naszyjnik-sol",
    variants: [
      {
        id: 201,
        size: "Uniwersalny",
        price: 122,
        isAvailable: true,
      },
    ],
  },
  {
    id: 1,
    name: "Bransoletka Aura",
    category: "Bransoletki",
    price: 89.5,
    description: "Delikatna bransoletka z kolorowych koralików.",
    slug: "bransoletka-aura",
    variants: [
      {
        id: 204,
        size: "S",
        price: 89.5,
        isAvailable: true,
      },
      {
        id: 202,
        size: "M",
        price: 94.5,
        isAvailable: true,
      },
      {
        id: 203,
        size: "L",
        price: 89.5,
        isAvailable: false,
      },
    ],
  },
  {
    id: 3,
    name: "Kolczyki Luna",
    category: "Kolczyki",
    price: 109,
    description: "Lekkie kolczyki na co dzień i wyjątkowe okazje.",
    slug: "kolczyki-luna",
    variants: [
      {
        id: 205,
        size: "Uniwersalny",
        price: 109,
        isAvailable: true,
      },
    ],
  },
];

export type ProductVariant = {
  id: number;
  size: string;
  price: number;
  isAvailable: boolean;
};
