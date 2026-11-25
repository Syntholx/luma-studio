const formatter = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "EUR",
});

export function formatPrice(price: number) {
  return formatter.format(price);
}
