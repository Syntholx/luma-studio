export type OrderRequest = {
  customerName: string;
  email: string;
  deliveryMethodId: "pickup" | "courier";
  pickupPoint: string | null;
  items: OrderItemRequest[];
};

export type OrderItemRequest = {
  variantId: number;
  quantity: number;
};

export type OrderLine = {
  productId: number;
  variantId: number;
  quantity: number;
  name: string;
  size: string;
  unitPrice: number;
  lineTotal: number;
};

export type OrderConfirmation = {
  items: OrderLine[];
  isDemo: true;
  currency: "EUR";
  deliveryMethodId: "pickup" | "courier";
  pickupPoint: string | null;
  createdAt: string;
  expiresAt: string;
  orderId: string;
  deliveryName: string;
  totalQuantity: number;
  totalPrice: number;
  deliveryPrice: number;
  grandTotal: number;
};
