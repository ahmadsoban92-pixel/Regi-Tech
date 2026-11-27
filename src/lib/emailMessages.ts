import { createHash } from "node:crypto";

const SUPPORT_EMAIL = "info@regitech.co.uk";
const DEFAULT_SITE_URL = "https://regitech.co.uk";

export type EmailMessage = {
  to: string;
  replyTo: string;
  subject: string;
  text: string;
  html: string;
  messageId: string;
};

export type OrderEmailInput = {
  reference: string;
  customer: { firstName: string; lastName: string; email: string };
  items: Array<{
    productName: string;
    registration: string;
    quantity: number;
    lineTotalPence: number;
    useType: string;
  }>;
  subtotalPence: number;
  deliveryPence: number;
  discountPence: number;
  totalPence: number;
  createdAt: string;
  siteUrl?: string;
};

export type DispatchEmailInput = {
  reference: string;
  customer: { firstName: string; lastName: string; email: string };
  carrier: string;
  trackingReference: string;
  dispatchedAt: string;
  siteUrl?: string;
};

export type ContactEmailInput = {
  id: string;
  name: string;
  email: string;
  orderReference: string;
  message: string;
  createdAt: string;
  siteUrl?: string;
};

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[character]!);
}

function money(pence: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(pence / 100);
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return value;
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/London" }).format(date);
}

function publicUrl(value?: string) {
  try {
    const url = new URL(value || DEFAULT_SITE_URL);
    return url.protocol === "https:" ? url.origin : DEFAULT_SITE_URL;
  } catch {
    return DEFAULT_SITE_URL;
  }
}

function htmlLayout(title: string, preheader: string, content: string, siteUrl?: string) {
  const home = escapeHtml(publicUrl(siteUrl));
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;background:#f3f4f6;color:#111827;font-family:Arial,sans-serif">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(preheader)}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f4f6"><tr><td align="center" style="padding:24px 12px">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border-radius:12px;overflow:hidden">
      <tr><td style="background:#111111;color:#ffd500;padding:22px 28px;font-size:22px;font-weight:700">Regi Tech</td></tr>
      <tr><td style="padding:28px;font-size:15px;line-height:1.6">${content}</td></tr>
      <tr><td style="padding:18px 28px;background:#f9fafb;color:#6b7280;font-size:12px">Regi Tech Motorcycle Plates · <a href="${home}" style="color:#6b7280">${home}</a></td></tr>
    </table>
  </td></tr></table>
</body></html>`;
}

export function messageIdForDeduplicationKey(key: string) {
  return `<${createHash("sha256").update(key, "utf8").digest("hex")}@regitech.co.uk>`;
}

export function buildOrderConfirmationMessage(input: OrderEmailInput): EmailMessage {
  const name = `${input.customer.firstName} ${input.customer.lastName}`.trim();
  const itemText = input.items.map((item) => `${item.quantity} × ${item.productName} — ${item.registration}`);
  const itemHtml = input.items.map((item) => `<li style="margin:0 0 8px"><strong>${item.quantity} × ${escapeHtml(item.productName)}</strong> — ${escapeHtml(item.registration)} <span style="float:right">${escapeHtml(money(item.lineTotalPence))}</span></li>`).join("");
  const roadLegal = input.items.some((item) => item.useType === "road-legal");
  const totalsText = [
    `Subtotal: ${money(input.subtotalPence)}`,
    ...(input.discountPence > 0 ? [`Discount: -${money(input.discountPence)}`] : []),
    `Delivery: ${input.deliveryPence ? money(input.deliveryPence) : "Free"}`,
    `Total: ${money(input.totalPence)}`,
  ];
  const totalsHtml = [
    `<tr><td>Subtotal</td><td align="right">${escapeHtml(money(input.subtotalPence))}</td></tr>`,
    ...(input.discountPence > 0 ? [`<tr><td>Discount</td><td align="right">-${escapeHtml(money(input.discountPence))}</td></tr>`] : []),
    `<tr><td>Delivery</td><td align="right">${input.deliveryPence ? escapeHtml(money(input.deliveryPence)) : "Free"}</td></tr>`,
    `<tr><td style="padding-top:8px;font-weight:700">Total</td><td align="right" style="padding-top:8px;font-weight:700">${escapeHtml(money(input.totalPence))}</td></tr>`,
  ].join("");
  const reminder = roadLegal ? "Road-legal documents must be approved before dispatch. We will contact you if anything else is needed." : "";
  const subject = `Order confirmed — ${input.reference}`;
  return {
    to: input.customer.email,
    replyTo: SUPPORT_EMAIL,
    subject,
    messageId: messageIdForDeduplicationKey(`order-confirmation:${input.reference}`),
    text: [
      `Hi ${name},`,
      "",
      `Thank you for your order. Your payment has been confirmed for ${input.reference}.`,
      `Placed: ${formatDate(input.createdAt)}`,
      "",
      ...itemText,
      "",
      ...totalsText,
      ...(reminder ? ["", reminder] : []),
      "",
      `Questions? Reply to this email or visit ${publicUrl(input.siteUrl)}.`,
    ].join("\n"),
    html: htmlLayout(subject, `Payment confirmed for ${input.reference}`, `
      <h1 style="margin:0 0 16px;font-size:24px">Thank you for your order</h1>
      <p>Hi ${escapeHtml(name)},</p>
      <p>Your payment has been confirmed for <strong>${escapeHtml(input.reference)}</strong>.</p>
      <p style="color:#6b7280;font-size:13px">Placed ${escapeHtml(formatDate(input.createdAt))}</p>
      <ul style="padding-left:20px">${itemHtml}</ul>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="4" style="border-top:1px solid #e5e7eb;margin-top:18px">${totalsHtml}</table>
      ${reminder ? `<p style="margin-top:20px;padding:12px;background:#fff7cc;border-left:4px solid #ffd500">${escapeHtml(reminder)}</p>` : ""}
      <p style="margin-top:20px">Questions? Reply to this email and we will help.</p>`, input.siteUrl),
  };
}

export function buildDispatchMessage(input: DispatchEmailInput): EmailMessage {
  const name = `${input.customer.firstName} ${input.customer.lastName}`.trim();
  const subject = `Your Regi-Tech order has been dispatched — ${input.reference}`;
  return {
    to: input.customer.email,
    replyTo: SUPPORT_EMAIL,
    subject,
    messageId: messageIdForDeduplicationKey(`dispatch-confirmation:${input.reference}`),
    text: [
      `Hi ${name},`,
      "",
      `Your order ${input.reference} has been dispatched.`,
      `Carrier: ${input.carrier || "Delivery service"}`,
      `Tracking reference: ${input.trackingReference || "Not provided"}`,
      `Dispatched: ${formatDate(input.dispatchedAt)}`,
      "",
      "Royal Mail Tracked 48 is normally estimated at 2–3 working days after dispatch.",
      `Questions? Reply to this email or visit ${publicUrl(input.siteUrl)}.`,
    ].join("\n"),
    html: htmlLayout(subject, `Order ${input.reference} is on its way`, `
      <h1 style="margin:0 0 16px;font-size:24px">Your order is on its way</h1>
      <p>Hi ${escapeHtml(name)},</p>
      <p>Your order <strong>${escapeHtml(input.reference)}</strong> has been dispatched.</p>
      <p><strong>Carrier:</strong> ${escapeHtml(input.carrier || "Delivery service")}<br><strong>Tracking reference:</strong> ${escapeHtml(input.trackingReference || "Not provided")}</p>
      <p style="color:#6b7280;font-size:13px">Dispatched ${escapeHtml(formatDate(input.dispatchedAt))}</p>
      <p>Royal Mail Tracked 48 is normally estimated at 2–3 working days after dispatch.</p>
      <p>Questions? Reply to this email and we will help.</p>`, input.siteUrl),
  };
}

export function buildContactAlertMessage(input: ContactEmailInput): EmailMessage {
  const subject = input.orderReference ? `Website enquiry — ${input.orderReference}` : "New website enquiry";
  return {
    to: SUPPORT_EMAIL,
    replyTo: input.email,
    subject,
    messageId: messageIdForDeduplicationKey(`contact-alert:${input.id}`),
    text: [
      `From: ${input.name} <${input.email}>`,
      ...(input.orderReference ? [`Order reference: ${input.orderReference}`] : []),
      `Received: ${formatDate(input.createdAt)}`,
      "",
      input.message,
    ].join("\n"),
    html: htmlLayout(subject, `New message from ${input.name}`, `
      <h1 style="margin:0 0 16px;font-size:24px">New website enquiry</h1>
      <p><strong>From:</strong> ${escapeHtml(input.name)} &lt;${escapeHtml(input.email)}&gt;</p>
      ${input.orderReference ? `<p><strong>Order reference:</strong> ${escapeHtml(input.orderReference)}</p>` : ""}
      <p style="color:#6b7280;font-size:13px">Received ${escapeHtml(formatDate(input.createdAt))}</p>
      <div style="white-space:pre-wrap;padding:14px;background:#f9fafb;border-left:4px solid #ffd500">${escapeHtml(input.message)}</div>
      <p>Reply to this email to respond directly to the customer.</p>`, input.siteUrl),
  };
}
