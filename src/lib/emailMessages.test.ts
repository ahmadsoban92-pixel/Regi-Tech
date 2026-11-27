import { describe, expect, it } from "vitest";
import {
  buildContactAlertMessage,
  buildDispatchMessage,
  buildOrderConfirmationMessage,
  messageIdForDeduplicationKey,
  type OrderEmailInput,
} from "@/lib/emailMessages";

const order: OrderEmailInput = {
  reference: "RT-26123456",
  customer: { firstName: "Alex", lastName: "Rider", email: "alex@example.com" },
  items: [
    {
      productName: "Crystal 3D",
      registration: "AB76 BCD",
      quantity: 2,
      lineTotalPence: 3998,
      useType: "show",
    },
  ],
  subtotalPence: 3998,
  deliveryPence: 0,
  discountPence: 0,
  totalPence: 3998,
  createdAt: "2026-11-27T05:00:00.000Z",
};

describe("transactional email messages", () => {
  it("escapes customer text in HTML without changing plain text", () => {
    const message = buildOrderConfirmationMessage({
      ...order,
      customer: { ...order.customer, firstName: "Alex <script>alert('x')</script>" },
      items: [{ ...order.items[0], registration: "AB76 & BCD" }],
    });

    expect(message.html).not.toContain("<script>");
    expect(message.html).toContain("Alex &lt;script&gt;alert(&#39;x&#39;)&lt;/script&gt;");
    expect(message.html).toContain("AB76 &amp; BCD");
    expect(message.text).toContain("Alex <script>alert('x')</script>");
    expect(message.text).toContain("AB76 & BCD");
  });

  it("renders paid order totals and omits a zero discount", () => {
    const message = buildOrderConfirmationMessage(order);

    expect(message.to).toBe("alex@example.com");
    expect(message.replyTo).toBe("info@regitech.co.uk");
    expect(message.subject).toBe("Order confirmed — RT-26123456");
    expect(message.text).toContain("2 × Crystal 3D — AB76 BCD");
    expect(message.text).toContain("Subtotal: £39.98");
    expect(message.text).toContain("Delivery: Free");
    expect(message.text).toContain("Total: £39.98");
    expect(message.text).not.toContain("Discount:");
  });

  it("renders a discount and road-legal verification reminder when present", () => {
    const message = buildOrderConfirmationMessage({
      ...order,
      items: [{ ...order.items[0], useType: "road-legal" }],
      discountPence: 500,
      totalPence: 3498,
    });

    expect(message.text).toContain("Discount: -£5.00");
    expect(message.text).toContain("Total: £34.98");
    expect(message.text).toContain("Road-legal documents must be approved before dispatch");
  });

  it("renders carrier and tracking in a dispatch message", () => {
    const message = buildDispatchMessage({
      reference: order.reference,
      customer: order.customer,
      carrier: "Royal Mail",
      trackingReference: "AA123456789GB",
      dispatchedAt: "2026-11-27T06:00:00.000Z",
    });

    expect(message.subject).toBe("Your Regi-Tech order has been dispatched — RT-26123456");
    expect(message.text).toContain("Carrier: Royal Mail");
    expect(message.text).toContain("Tracking reference: AA123456789GB");
    expect(message.html).toContain("AA123456789GB");
  });

  it("uses the customer address as Reply-To for a Contact alert", () => {
    const message = buildContactAlertMessage({
      id: "82cc2ee8-c9a3-495a-a52b-9a29270504b6",
      name: "Alex Rider",
      email: "alex@example.com",
      orderReference: "RT-26123456",
      message: "Please confirm the finish.",
      createdAt: "2026-11-27T05:30:00.000Z",
    });

    expect(message.to).toBe("info@regitech.co.uk");
    expect(message.replyTo).toBe("alex@example.com");
    expect(message.subject).toBe("Website enquiry — RT-26123456");
    expect(message.text).toContain("Please confirm the finish.");
  });

  it("returns the same Message-ID for the same deduplication key", () => {
    const first = messageIdForDeduplicationKey("order-confirmation:order-1");
    const second = messageIdForDeduplicationKey("order-confirmation:order-1");
    const other = messageIdForDeduplicationKey("order-confirmation:order-2");

    expect(first).toBe(second);
    expect(first).not.toBe(other);
    expect(first).toMatch(/^<[a-f0-9]{64}@regitech\.co\.uk>$/);
  });
});
