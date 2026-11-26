export type Product = {
  id: number;
  name: string;
  category: string;
  price: number;
  description: string;
  slug: string;
  variants: ProductVariant[];
  imageUrl: string;
  imageAlt: string;
};

export const products: Product[] = [
  {
    id: 2,
    name: "Sol Necklace",
    category: "Necklaces",
    price: 122,
    description: "A delicate necklace inspired by the warmth of the sun.",
    slug: "sol-necklace",
    imageUrl: "/images/products/sol-necklace.webp",
    imageAlt:
      "Sol necklace with a fine gold chain and sun pendant",
    variants: [
      {
        id: 201,
        size: "One size",
        price: 122,
        isAvailable: true,
      },
    ],
  },
  {
    id: 1,
    name: "Aura Bracelet",
    category: "Bracelets",
    price: 89.5,
    description: "A delicate bracelet made with colourful beads.",
    slug: "aura-bracelet",
    imageUrl: "/images/products/aura-bracelet.webp",
    imageAlt: "Aura bracelet with colourful beads and gold spacers",
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
    name: "Luna Earrings",
    category: "Earrings",
    price: 109,
    description: "Lightweight earrings for everyday wear and special occasions.",
    slug: "luna-earrings",
    imageUrl: "/images/products/luna-earrings.webp",
    imageAlt:
      "Luna earrings with gold hooks and cream crescent moon pendants",
    variants: [
      {
        id: 205,
        size: "One size",
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
