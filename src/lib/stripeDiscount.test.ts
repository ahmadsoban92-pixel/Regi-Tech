import { describe, expect, it } from "vitest";
import { getPaidSessionAmounts } from "@/lib/stripeDiscount";

describe("getPaidSessionAmounts", () => {
  const base = { currency: "gbp", amount_subtotal: 2000, amount_total: 2000, total_details: { amount_discount: 0 } };

  it("accepts an undiscounted checkout", () => {
    expect(getPaidSessionAmounts(base)).toEqual({ totalPence: 2000, discountPence: 0 });
  });

  it("accepts percentage and fixed-value reductions from Stripe", () => {
    expect(getPaidSessionAmounts({ ...base, amount_total: 1800, total_details: { amount_discount: 200 } })).toEqual({ totalPence: 1800, discountPence: 200 });
    expect(getPaidSessionAmounts({ ...base, amount_total: 1500, total_details: { amount_discount: 500 } })).toEqual({ totalPence: 1500, discountPence: 500 });
  });

  it("rejects a mismatched currency, subtotal, total or discount", () => {
    expect(() => getPaidSessionAmounts({ ...base, currency: "usd" })).toThrow();
    expect(() => getPaidSessionAmounts({ ...base, amount_subtotal: 1000 })).toThrow();
    expect(() => getPaidSessionAmounts({ ...base, amount_total: 2200 })).toThrow();
    expect(() => getPaidSessionAmounts({ ...base, amount_total: 1500, total_details: { amount_discount: 100 } })).toThrow();
  });
});
