import "server-only";
import { randomInt, randomUUID } from "node:crypto";
import type Stripe from "stripe";
import { getOrderServerEnv } from "@/lib/env";
import { createOrderAccess, verifyOrderAccessToken } from "@/lib/orderAccess";
import type { ValidatedOrderFile } from "@/lib/orderFiles";
import { getStripeClient } from "@/lib/stripeClient";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import type { CheckoutSubmissionValues } from "@/lib/orderSchemas";
import type { OrderConfirmationData, PaymentStatus, VerificationStatus } from "@/types/orderApi";
import type { PlateConfiguration, PriceLine } from "@/types/order";
import { canonicalizeCheckoutSubmission, type OrderItemFiles, OrderValidationError } from "@/services/orderValidation.service";

type StoredOrderItem = {
  id: string;
  position: number;
  configuration: PlateConfiguration;
  price_breakdown: Array<{ label: string; amountPence: number }>;
  quantity: number;
  unit_total_pence: number;
  line_total_pence: number;
};

type StoredOrder = {
  id: string;
  reference: string;
  payment_status: PaymentStatus;
  verification_status: VerificationStatus;
  customer: { email: string };
  subtotal_pence: number;
  delivery_pence: number;
  total_pence: number;
  currency: "gbp";
  order_notes: string;
  checkout_access_token_hash: string;
  stripe_checkout_session_id: string | null;
  created_at: string;
  items: StoredOrderItem[];
};

function createReference() {
  const year = new Date().getUTCFullYear().toString().slice(-2);
  return `RT-${year}${randomInt(100000, 1000000)}`;
}

function stripePaymentIntentId(session: Stripe.Checkout.Session) {
  return typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? null;
}

async function createStripeCheckoutSession(order: StoredOrder, attemptNumber: number) {
  const stripe = getStripeClient();
  const env = getOrderServerEnv();
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: order.customer.email,
    client_reference_id: order.id,
    metadata: { orderId: order.id, orderReference: order.reference },
    payment_intent_data: { metadata: { orderId: order.id, orderReference: order.reference } },
    line_items: order.items.map((item) => ({
      quantity: item.quantity,
      price_data: {
        currency: "gbp",
        unit_amount: item.unit_total_pence,
        product_data: { name: item.configuration.productName, description: `Registration ${item.configuration.registration}` },
      },
    })),
    success_url: `${env.siteUrl}/order-confirmation?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${env.siteUrl}/checkout?payment=cancelled&reference=${encodeURIComponent(order.reference)}`,
  }, { idempotencyKey: `order-${order.id}-attempt-${attemptNumber}` });
  if (!session.url) throw new Error("Stripe did not return a checkout URL.");
  return session;
}

async function uploadOrderFile(orderId: string, orderItemId: string, kind: "v5c" | "artwork", file: ValidatedOrderFile) {
  const supabase = getSupabaseAdmin();
  const bucket = kind === "v5c" ? "v5c-documents" : "order-artwork";
  const objectPath = `${orderId}/${orderItemId}/${kind}-${randomUUID()}.${file.extension}`;
  const { error: uploadError } = await supabase.storage.from(bucket).upload(objectPath, file.bytes, { contentType: file.mimeType, upsert: false });
  if (uploadError) throw new Error(`Unable to store the ${kind} file.`);
  const { error: fileError } = await supabase.from("order_files").insert({
    order_id: orderId, order_item_id: orderItemId, kind, bucket, object_path: objectPath,
    original_name: file.originalName, mime_type: file.mimeType, size_bytes: file.size,
  });
  if (fileError) {
    await supabase.storage.from(bucket).remove([objectPath]);
    throw new Error(`Unable to associate the ${kind} file with the order.`);
  }
  return { bucket, objectPath };
}

async function cleanupFailedOrder(orderId: string, uploads: Array<{ bucket: string; objectPath: string }>) {
  const supabase = getSupabaseAdmin();
  await Promise.all(uploads.map(({ bucket, objectPath }) => supabase.storage.from(bucket).remove([objectPath])));
  await supabase.from("orders").delete().eq("id", orderId);
}

export async function createCheckoutOrder(submission: CheckoutSubmissionValues, filesByItemId: Record<string, OrderItemFiles>) {
  const canonical = canonicalizeCheckoutSubmission(submission, filesByItemId);
  const supabase = getSupabaseAdmin();
  const orderId = randomUUID();
  const reference = createReference();
  const access = createOrderAccess(reference);
  const verificationStatus: VerificationStatus = canonical.items.some((item) => item.config.useType === "road-legal") ? "pending" : "not_required";
  const firstItem = canonical.items[0];
  const totalQuantity = canonical.items.reduce((total, item) => total + item.quantity, 0);
  const insert = {
    id: orderId, reference, payment_status: "pending_payment" as PaymentStatus, verification_status: verificationStatus,
    customer: { firstName: canonical.customer.firstName, lastName: canonical.customer.lastName, email: canonical.customer.email, telephone: canonical.customer.telephone },
    delivery_address: canonical.customer.deliveryAddress, billing_address: canonical.customer.billingAddress,
    configuration: firstItem.config,
    price_breakdown: firstItem.priceBreakdown.map((line) => ({ label: line.label, amountPence: Math.round(line.amount * 100) })),
    quantity: totalQuantity, subtotal_pence: canonical.subtotalPence, delivery_pence: canonical.deliveryPence,
    total_pence: canonical.totalPence, currency: "gbp" as const,
    special_instructions: "", order_notes: canonical.orderNotes, additional_notes: canonical.customer.additionalNotes,
    checkout_access_token_hash: access.tokenHash,
  };
  const { error: orderError } = await supabase.from("orders").insert(insert);
  if (orderError) throw new Error("Unable to create the order record.");

  const storedItems: StoredOrderItem[] = canonical.items.map((item, position) => ({
    id: randomUUID(), position, configuration: item.config,
    price_breakdown: item.priceBreakdown.map((line) => ({ label: line.label, amountPence: Math.round(line.amount * 100) })),
    quantity: item.quantity, unit_total_pence: item.unitTotalPence, line_total_pence: item.lineTotalPence,
  }));
  const uploads: Array<{ bucket: string; objectPath: string }> = [];
  try {
    const { error: itemsError } = await supabase.from("order_items").insert(storedItems.map((item) => ({ ...item, order_id: orderId })));
    if (itemsError) throw new Error("Unable to create the order items.");
    for (let index = 0; index < canonical.items.length; index += 1) {
      const item = canonical.items[index];
      const storedItem = storedItems[index];
      if (item.files.v5c) uploads.push(await uploadOrderFile(orderId, storedItem.id, "v5c", item.files.v5c));
      if (item.files.artwork) uploads.push(await uploadOrderFile(orderId, storedItem.id, "artwork", item.files.artwork));
    }
    const storedOrder: StoredOrder = { ...insert, items: storedItems, stripe_checkout_session_id: null, created_at: new Date().toISOString() };
    const session = await createStripeCheckoutSession(storedOrder, 1);
    const { error: attemptError } = await supabase.rpc("register_payment_attempt", { p_order_id: orderId, p_session_id: session.id, p_amount_pence: canonical.totalPence });
    if (attemptError) { await getStripeClient().checkout.sessions.expire(session.id).catch(() => undefined); throw new Error("Unable to register the payment attempt."); }
    return { reference, checkoutUrl: session.url!, cookieValue: access.cookieValue };
  } catch (error) {
    await cleanupFailedOrder(orderId, uploads);
    throw error;
  }
}

async function loadStoredOrder(reference: string): Promise<StoredOrder> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("orders").select("id,reference,payment_status,verification_status,customer,subtotal_pence,delivery_pence,total_pence,currency,order_notes,checkout_access_token_hash,stripe_checkout_session_id,created_at").eq("reference", reference).maybeSingle();
  if (error || !data) throw new OrderValidationError("The order could not be found.");
  const { data: items, error: itemsError } = await supabase.from("order_items").select("id,position,configuration,price_breakdown,quantity,unit_total_pence,line_total_pence").eq("order_id", data.id).order("position", { ascending: true });
  if (itemsError || !items?.length) throw new OrderValidationError("The order items could not be found.");
  return { ...data, items } as StoredOrder;
}

export async function retryCheckoutOrder(reference: string, accessToken: string) {
  const supabase = getSupabaseAdmin();
  const order = await loadStoredOrder(reference);
  if (!verifyOrderAccessToken(accessToken, order.checkout_access_token_hash)) throw new OrderValidationError("The checkout session is no longer available.");
  if (order.payment_status === "paid") throw new OrderValidationError("This order has already been paid.");
  if (order.stripe_checkout_session_id) {
    const existing = await getStripeClient().checkout.sessions.retrieve(order.stripe_checkout_session_id);
    if (existing.status === "open" && existing.url) return { reference, checkoutUrl: existing.url };
  }
  const { count } = await supabase.from("payment_attempts").select("id", { count: "exact", head: true }).eq("order_id", order.id);
  const session = await createStripeCheckoutSession(order, (count ?? 0) + 1);
  const { error: attemptError } = await supabase.rpc("register_payment_attempt", { p_order_id: order.id, p_session_id: session.id, p_amount_pence: order.total_pence });
  if (attemptError) throw new Error("Unable to register the payment retry.");
  return { reference, checkoutUrl: session.url! };
}

export async function getOrderConfirmationBySessionId(sessionId: string, accessToken: string): Promise<OrderConfirmationData | null> {
  const supabase = getSupabaseAdmin();
  const { data: attempt, error: attemptError } = await supabase.from("payment_attempts").select("order_id").eq("stripe_checkout_session_id", sessionId).maybeSingle();
  if (attemptError || !attempt) return null;
  const { data, error } = await supabase.from("orders").select("reference,payment_status,verification_status,order_notes,subtotal_pence,delivery_pence,total_pence,currency,checkout_access_token_hash,created_at").eq("id", attempt.order_id).maybeSingle();
  if (error || !data || !verifyOrderAccessToken(accessToken, data.checkout_access_token_hash)) return null;
  const { data: items, error: itemsError } = await supabase.from("order_items").select("id,position,configuration,price_breakdown,quantity,unit_total_pence,line_total_pence").eq("order_id", attempt.order_id).order("position", { ascending: true });
  if (itemsError || !items) return null;
  return {
    reference: data.reference, paymentStatus: data.payment_status, verificationStatus: data.verification_status,
    items: (items as StoredOrderItem[]).map((item) => ({ id: item.id, position: item.position, config: item.configuration, quantity: item.quantity, priceBreakdown: item.price_breakdown.map((line) => ({ label: line.label, amount: line.amountPence / 100 })), unitTotalPence: item.unit_total_pence, lineTotalPence: item.line_total_pence })),
    orderNotes: data.order_notes, subtotalPence: data.subtotal_pence, deliveryPence: data.delivery_pence,
    totalPence: data.total_pence, currency: data.currency, createdAt: data.created_at,
  };
}

export async function applyStripeCheckoutEvent(event: Stripe.Event) {
  const supported = new Set(["checkout.session.completed", "checkout.session.async_payment_succeeded", "checkout.session.async_payment_failed", "checkout.session.expired"]);
  if (!supported.has(event.type)) return { processed: false, ignored: true };
  const session = event.data.object as Stripe.Checkout.Session;
  let paymentStatus: PaymentStatus = "pending_payment";
  let attemptStatus: "open" | "complete" | "failed" | "expired" = "open";
  if (event.type === "checkout.session.async_payment_failed") { paymentStatus = "payment_failed"; attemptStatus = "failed"; }
  else if (event.type === "checkout.session.expired") { paymentStatus = "expired"; attemptStatus = "expired"; }
  else if (event.type === "checkout.session.async_payment_succeeded" || session.payment_status === "paid") { paymentStatus = "paid"; attemptStatus = "complete"; }
  const { data, error } = await getSupabaseAdmin().rpc("apply_stripe_event", { p_event_id: event.id, p_event_type: event.type, p_session_id: session.id, p_payment_status: paymentStatus, p_attempt_status: attemptStatus, p_payment_intent_id: stripePaymentIntentId(session), p_paid_at: paymentStatus === "paid" ? new Date().toISOString() : null });
  if (error) throw new Error("Unable to apply the Stripe event.");
  return { processed: Boolean(data), ignored: false };
}
