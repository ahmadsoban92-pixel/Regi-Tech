type SessionAmounts = {
  currency: string | null;
  amount_subtotal: number | null;
  amount_total: number | null;
  total_details: { amount_discount: number } | null;
};

export function getPaidSessionAmounts(session: SessionAmounts) {
  const subtotal = session.amount_subtotal;
  const total = session.amount_total;
  const discount = session.total_details?.amount_discount;
  if (session.currency?.toLowerCase() !== "gbp"
    || !Number.isSafeInteger(subtotal) || subtotal === null || subtotal < 0
    || !Number.isSafeInteger(total) || total === null || total < 0
    || !Number.isSafeInteger(discount) || discount === undefined || discount < 0
    || total + discount !== subtotal) {
    throw new Error("Stripe payment amounts do not match the order.");
  }
  return { totalPence: total, discountPence: discount };
}
