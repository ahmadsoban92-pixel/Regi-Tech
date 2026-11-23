import "server-only";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getRoyalMailServerEnv } from "@/lib/env";
import { createRoyalMailApi } from "@/services/royalMailApi.service";
import { createRoyalMailWorkflow, type RoyalMailShipment, type ShipmentRepository, type ShippingActor } from "@/lib/royalMailWorkflow";
import type { ParcelMeasurements } from "@/lib/royalMail";
import type { AdminOrder } from "@/types/admin";
import type { Database } from "@/types/database";

type ShipmentRow = Database["public"]["Tables"]["royal_mail_shipments"]["Row"];

function toShipment(row: ShipmentRow): RoyalMailShipment {
  if (!["reserved", "booked", "dispatched"].includes(row.status)) throw new Error("Unknown Royal Mail shipment status.");
  return {
    orderId: row.order_id, reservationToken: row.reservation_token,
    status: row.status as RoyalMailShipment["status"], serviceCode: row.service_code,
    weightGrams: row.weight_grams, lengthMm: row.length_mm, widthMm: row.width_mm,
    depthMm: row.depth_mm, externalOrderId: row.external_order_id,
    trackingNumber: row.tracking_number,
  };
}

export async function getRoyalMailShipment(orderId: string): Promise<RoyalMailShipment | null> {
  const { data, error } = await getSupabaseAdmin().from("royal_mail_shipments").select("*").eq("order_id", orderId).maybeSingle();
  // Older staging databases can still serve normal Admin orders before this additive migration is applied.
  if (error?.code === "42P01" || error?.code === "PGRST205") return null;
  if (error) throw new Error("Unable to load Royal Mail shipment.");
  return data ? toShipment(data) : null;
}

const repository: ShipmentRepository = {
  async reserve(orderId, parcel, serviceCode, actorId) {
    const { data, error } = await getSupabaseAdmin().rpc("admin_reserve_royal_mail_shipment", {
      p_order_id: orderId, p_service_code: serviceCode, p_weight_grams: parcel.weightGrams,
      p_length_mm: parcel.lengthMm, p_width_mm: parcel.widthMm, p_depth_mm: parcel.depthMm,
      p_actor_id: actorId,
    });
    if (error || !data || typeof data !== "object" || Array.isArray(data) || !data.shipment) {
      throw new Error(error?.message || "Unable to reserve the Royal Mail shipment.");
    }
    return { created: data.created === true, shipment: toShipment(data.shipment as ShipmentRow) };
  },
  async confirm(orderId, token, externalOrderId, tracking, actor) {
    const { data, error } = await getSupabaseAdmin().rpc("admin_confirm_royal_mail_shipment", {
      p_order_id: orderId, p_reservation_token: token, p_external_order_id: externalOrderId,
      p_tracking_number: tracking, p_actor_id: actor.userId, p_actor_name: actor.displayName,
    });
    if (error) throw new Error("Unable to save the Royal Mail booking.");
    return data === true;
  },
  async finishDispatch(orderId, actor) {
    const { data, error } = await getSupabaseAdmin().rpc("admin_finish_royal_mail_dispatch", {
      p_order_id: orderId, p_actor_id: actor.userId, p_actor_name: actor.displayName,
    });
    if (error) throw new Error("Unable to record Royal Mail dispatch.");
    return data === true;
  },
};

function workflow() {
  const { apiKey } = getRoyalMailServerEnv();
  return createRoyalMailWorkflow(repository, createRoyalMailApi(apiKey));
}

export async function bookRoyalMailShipment(order: AdminOrder, parcel: ParcelMeasurements, actor: ShippingActor) {
  return workflow().book(order, parcel, actor);
}

export async function recoverRoyalMailShipment(order: AdminOrder, actor: ShippingActor) {
  const shipment = await getRoyalMailShipment(order.id);
  if (!shipment) throw new Error("There is no Royal Mail booking to recover.");
  return workflow().recover(order, shipment, actor);
}

export async function dispatchRoyalMailShipment(order: AdminOrder, actor: ShippingActor) {
  const shipment = await getRoyalMailShipment(order.id);
  if (!shipment) throw new Error("There is no Royal Mail booking for this order.");
  return workflow().dispatch(order, shipment, actor);
}

export async function downloadRoyalMailLabel(order: AdminOrder) {
  const shipment = await getRoyalMailShipment(order.id);
  if (!shipment?.externalOrderId || shipment.status === "reserved") throw new Error("Royal Mail label is not ready.");
  const { apiKey } = getRoyalMailServerEnv();
  return createRoyalMailApi(apiKey).getLabel(shipment.externalOrderId);
}
