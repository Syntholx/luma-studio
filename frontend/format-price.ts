const formatter = new Intl.NumberFormat("pl-Pl", {
  style: "currency",
  currency: "PLN",
});

export function formatPrice(price: number) {
  return formatter.format(price);
}
