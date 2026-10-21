import "server-only";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { plateConfigurationSchema } from "@/lib/orderSchemas";
import type { AddressDetails, PriceLine } from "@/types/order";
import type { AdminActor, AdminDashboardMetrics, AdminOrder, AdminOrderFilters, AdminOrderItem, AdminOrderRepository } from "@/types/admin";
import type { PaymentStatus, VerificationStatus } from "@/types/orderApi";

type OrderRow = {
  id: string;
  reference: string;
  created_at: string;
  payment_status: string;
  verification_status: string;
  fulfilment_status: string;
  customer: unknown;
  delivery_address: unknown;
  billing_address: unknown;
  subtotal_pence: number;
  delivery_pence: number;
  total_pence: number;
  currency: string;
  order_notes: string;
  carrier: string;
  tracking_reference: string;
};

const ORDER_SELECT = "id,reference,created_at,payment_status,verification_status,fulfilment_status,customer,delivery_address,billing_address,subtotal_pence,delivery_pence,total_pence,currency,order_notes,carrier,tracking_reference";

function address(value: unknown): AddressDetails {
  const item = value as Partial<AddressDetails> | null;
  return {
    addressLine1: String(item?.addressLine1 ?? ""),
    addressLine2: String(item?.addressLine2 ?? ""),
    town: String(item?.town ?? ""),
    county: String(item?.county ?? ""),
    postcode: String(item?.postcode ?? ""),
    country: String(item?.country ?? "United Kingdom"),
  };
}

function customer(row: OrderRow) {
  const item = row.customer as Record<string, unknown> | null;
  return {
    firstName: String(item?.firstName ?? ""),
    lastName: String(item?.lastName ?? ""),
    email: String(item?.email ?? ""),
    telephone: String(item?.telephone ?? ""),
    deliveryAddress: address(row.delivery_address),
    billingAddress: address(row.billing_address),
  };
}

function priceBreakdown(value: unknown): PriceLine[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((line) => {
    if (!line || typeof line !== "object") return [];
    const record = line as Record<string, unknown>;
    const label = String(record.label ?? "");
    const amountPence = Number(record.amountPence ?? 0);
    return label && Number.isFinite(amountPence) ? [{ label, amount: amountPence / 100 }] : [];
  });
}

function sizeLabel(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function loadItems(orderIds: string[]) {
  const map = new Map<string, AdminOrderItem[]>();
  if (!orderIds.length) return map;
  const { data, error } = await getSupabaseAdmin().from("order_items")
    .select("id,order_id,position,configuration,price_breakdown,quantity,unit_total_pence,line_total_pence")
    .in("order_id", orderIds)
    .order("position", { ascending: true });
  if (error) throw new Error("Unable to load order items.");
  for (const row of data ?? []) {
    const parsed = plateConfigurationSchema.safeParse(row.configuration);
    if (!parsed.success) continue;
    const list = map.get(row.order_id) ?? [];
    list.push({
      id: row.id,
      position: row.position,
      config: parsed.data,
      quantity: row.quantity,
      priceBreakdown: priceBreakdown(row.price_breakdown),
      unitTotalPence: row.unit_total_pence,
      lineTotalPence: row.line_total_pence,
    });
    map.set(row.order_id, list);
  }
  return map;
}

async function mapOrders(rows: OrderRow[], detailed = false): Promise<AdminOrder[]> {
  const ids = rows.map((row) => row.id);
  const items = await loadItems(ids);
  const uploadsByOrder = new Map<string, AdminOrder["uploads"]>();
  const notesByOrder = new Map<string, AdminOrder["privateNotes"]>();
  const eventsByOrder = new Map<string, AdminOrder["timeline"]>();

  if (detailed && ids.length) {
    const supabase = getSupabaseAdmin();
    const [files, notes, events] = await Promise.all([
      supabase.from("order_files").select("id,order_id,order_item_id,kind,original_name,mime_type,size_bytes").in("order_id", ids).order("created_at"),
      supabase.from("order_notes").select("id,order_id,author_name,body,created_at").in("order_id", ids).order("created_at", { ascending: false }),
      supabase.from("order_events").select("id,order_id,title,actor_name,created_at").in("order_id", ids).order("created_at", { ascending: false }),
    ]);
    if (files.error || notes.error || events.error) throw new Error("Unable to load complete order details.");
    for (const file of files.data ?? []) {
      const list = uploadsByOrder.get(file.order_id) ?? [];
      list.push({ id: file.id, itemId: file.order_item_id ?? "", kind: file.kind as "v5c" | "artwork", name: file.original_name, mimeType: file.mime_type, sizeLabel: sizeLabel(file.size_bytes) });
      uploadsByOrder.set(file.order_id, list);
    }
    for (const note of notes.data ?? []) {
      const list = notesByOrder.get(note.order_id) ?? [];
      list.push({ id: note.id, author: note.author_name, body: note.body, createdAt: note.created_at });
      notesByOrder.set(note.order_id, list);
    }
    for (const event of events.data ?? []) {
      const list = eventsByOrder.get(event.order_id) ?? [];
      list.push({ id: event.id, title: event.title, actor: event.actor_name, createdAt: event.created_at });
      eventsByOrder.set(event.order_id, list);
    }
  }

  return rows.map((row) => ({
    id: row.id,
    reference: row.reference,
    createdAt: row.created_at,
    paymentStatus: row.payment_status as PaymentStatus,
    verificationStatus: row.verification_status as VerificationStatus,
    fulfilmentStatus: row.fulfilment_status as AdminOrder["fulfilmentStatus"],
    customer: customer(row),
    items: items.get(row.id) ?? [],
    subtotalPence: row.subtotal_pence,
    deliveryPence: row.delivery_pence,
    totalPence: row.total_pence,
    currency: "gbp",
    orderNotes: row.order_notes,
    uploads: uploadsByOrder.get(row.id) ?? [],
    privateNotes: notesByOrder.get(row.id) ?? [],
    timeline: eventsByOrder.get(row.id) ?? [],
    carrier: row.carrier,
    trackingReference: row.tracking_reference,
  }));
}

async function findOrderId(reference: string) {
  const { data, error } = await getSupabaseAdmin().from("orders").select("id").eq("reference", reference.toUpperCase()).maybeSingle();
  if (error || !data) throw new Error("Order not found.");
  return data.id;
}

async function reload(reference: string) {
  const order = await adminRepository.getOrder(reference);
  if (!order) throw new Error("Order not found.");
  return order;
}

export const adminRepository: AdminOrderRepository = {
  async getDashboard() {
    const supabase = getSupabaseAdmin();
    const [total, fulfilment, verification, paid, latest] = await Promise.all([
      supabase.from("orders").select("id", { count: "exact", head: true }),
      supabase.from("orders").select("id", { count: "exact", head: true }).in("fulfilment_status", ["new", "in_production"]),
      supabase.from("orders").select("id", { count: "exact", head: true }).eq("verification_status", "pending"),
      supabase.from("orders").select("total_pence").eq("payment_status", "paid"),
      supabase.from("orders").select(ORDER_SELECT).order("created_at", { ascending: false }).limit(5),
    ]);
    if (total.error || fulfilment.error || verification.error || paid.error || latest.error) throw new Error("Unable to load the admin dashboard.");
    const metrics: AdminDashboardMetrics = {
      totalOrders: total.count ?? 0,
      awaitingFulfilment: fulfilment.count ?? 0,
      awaitingVerification: verification.count ?? 0,
      paidOrderValuePence: (paid.data ?? []).reduce((sum, row) => sum + row.total_pence, 0),
    };
    return { metrics, latestOrders: await mapOrders((latest.data ?? []) as OrderRow[]) };
  },

  async listOrders(filters: AdminOrderFilters) {
    const pageSize = 25;
    const requestedPage = Math.max(1, filters.page);
    const args = {
      p_query: filters.query.trim(),
      p_from: filters.from ? `${filters.from}T00:00:00.000Z` : undefined,
      p_to: filters.to ? `${filters.to}T23:59:59.999Z` : undefined,
      p_payment_status: filters.payment === "all" ? undefined : filters.payment,
      p_fulfilment_status: filters.fulfilment === "all" ? undefined : filters.fulfilment,
      p_page: requestedPage,
      p_page_size: pageSize,
    };
    let page = requestedPage;
    let { data, error } = await getSupabaseAdmin().rpc("admin_list_orders", args);
    if (error) throw new Error("Unable to load orders.");
    if (!data?.length && requestedPage > 1) {
      const fallback = await getSupabaseAdmin().rpc("admin_list_orders", { ...args, p_page: 1 });
      data = fallback.data;
      error = fallback.error;
      page = 1;
    }
    if (error) throw new Error("Unable to load orders.");
    const total = Number(data?.[0]?.total_count ?? 0);
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    page = data?.length ? Math.min(page, totalPages) : 1;
    return { orders: await mapOrders((data ?? []) as OrderRow[]), total, page, pageSize, totalPages };
  },

  async getOrder(reference: string) {
    const { data, error } = await getSupabaseAdmin().from("orders").select(ORDER_SELECT).eq("reference", reference.toUpperCase()).maybeSingle();
    if (error) throw new Error("Unable to load the order.");
    if (!data) return null;
    return (await mapOrders([data as OrderRow], true))[0] ?? null;
  },

  async updateFulfilment(reference, status, actor, details = {}) {
    const orderId = await findOrderId(reference);
    const { data, error } = await getSupabaseAdmin().rpc("admin_set_fulfilment", {
      p_order_id: orderId, p_status: status, p_actor_id: actor.userId, p_actor_name: actor.displayName,
      p_carrier: details.carrier ?? "", p_tracking_reference: details.trackingReference ?? "", p_cancellation_reason: details.cancellationReason ?? "",
    });
    if (error || !data) throw new Error(error?.message || "Unable to update fulfilment.");
    return reload(reference);
  },

  async updateVerification(reference, status, actor) {
    const orderId = await findOrderId(reference);
    const { data, error } = await getSupabaseAdmin().rpc("admin_set_verification", { p_order_id: orderId, p_status: status, p_actor_id: actor.userId, p_actor_name: actor.displayName });
    if (error || !data) throw new Error(error?.message || "Unable to update verification.");
    return reload(reference);
  },

  async saveCarrier(reference, carrier, trackingReference, actor) {
    const orderId = await findOrderId(reference);
    const { data, error } = await getSupabaseAdmin().rpc("admin_save_tracking", {
      p_order_id: orderId, p_actor_id: actor.userId, p_actor_name: actor.displayName,
      p_carrier: carrier, p_tracking_reference: trackingReference,
    });
    if (error || !data) throw new Error(error?.message || "Unable to save tracking information.");
    return reload(reference);
  },

  async addNote(reference, body, actor) {
    const orderId = await findOrderId(reference);
    const { error } = await getSupabaseAdmin().rpc("admin_add_order_note", { p_order_id: orderId, p_actor_id: actor.userId, p_actor_name: actor.displayName, p_body: body });
    if (error) throw new Error(error.message || "Unable to add the note.");
    return reload(reference);
  },

  async cancelOrder(reference, reason, actor) {
    return adminRepository.updateFulfilment(reference, "cancelled", actor, { cancellationReason: reason });
  },
};
