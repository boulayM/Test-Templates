type LineWithPrice = {
  quantity: number;
  price: number;
};

export function computeCartSubtotalCents(items: LineWithPrice[]): number {
  const subtotal = items.reduce(
    (sum, item) => sum + item.quantity * item.price,
    0,
  );
  return Math.round(subtotal * 100);
}

export function computeCartSubtotalEuros(items: LineWithPrice[]): number {
  return computeCartSubtotalCents(items) / 100;
}
