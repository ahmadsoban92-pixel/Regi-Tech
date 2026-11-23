import { assertRoyalMailBookingAllowed, buildRoyalMailOrder, selectRoyalMailService, type ParcelMeasurements, type RoyalMailOrderSource } from "./royalMail";

export type RoyalMailShipment = {
  orderId: string;
  reservationToken: string;
  status: "reserved" | "booked" | "dispatched";
  serviceCode: string;
  weightGrams: number;
  lengthMm: number;
  widthMm: number;
  depthMm: number;
  externalOrderId: number | null;
  trackingNumber: string;
};
export type ShippingOrder = RoyalMailOrderSource & {
  id: string; paymentStatus: string; verificationStatus: string; fulfilmentStatus: string;
};
export type ShippingActor = { userId: string; displayName: string };
export type ShipmentRepository = {
  reserve(orderId: string, parcel: ParcelMeasurements, serviceCode: string, actorId: string): Promise<{ created: boolean; shipment: RoyalMailShipment }>;
  confirm(orderId: string, token: string, externalOrderId: number, tracking: string, actor: ShippingActor): Promise<boolean>;
  finishDispatch(orderId: string, actor: ShippingActor): Promise<boolean>;
};
export type ShippingApi = {
  createOrder(reference: string, payload: unknown): Promise<{ orderIdentifier: number; trackingNumber: string }>;
  findOrder(reference: string): Promise<{ orderIdentifier: number; trackingNumber: string } | null>;
  markDespatched(orderIdentifier: number): Promise<void>;
};

export function createRoyalMailWorkflow(repository: ShipmentRepository, api: ShippingApi) {
  return {
    async book(order: ShippingOrder, parcel: ParcelMeasurements, actor: ShippingActor) {
      assertRoyalMailBookingAllowed(order);
      const payload = buildRoyalMailOrder(order, parcel);
      const service = selectRoyalMailService(parcel);
      const { created, shipment } = await repository.reserve(order.id, parcel, service.code, actor.userId);
      if (!created) throw new Error("A Royal Mail booking has already started. Check Click & Drop before taking another action.");
      try {
        const booking = await api.findOrder(order.reference) ?? await api.createOrder(order.reference, payload);
        if (!await repository.confirm(order.id, shipment.reservationToken, booking.orderIdentifier, booking.trackingNumber, actor)) {
          throw new Error("Unable to save the Royal Mail booking.");
        }
        return booking;
      } catch {
        throw new Error("Booking outcome is uncertain. Check Click & Drop for this order reference, then use Recover booking. Do not create another label.");
      }
    },
    async recover(order: ShippingOrder, shipment: RoyalMailShipment, actor: ShippingActor) {
      if (shipment.status !== "reserved") throw new Error("This booking does not need recovery.");
      const booking = await api.findOrder(order.reference);
      if (!booking) throw new Error("No matching booking was found. Check Click & Drop manually before another attempt.");
      if (!await repository.confirm(order.id, shipment.reservationToken, booking.orderIdentifier, booking.trackingNumber, actor)) {
        throw new Error("Unable to save the recovered booking.");
      }
      return booking;
    },
    async dispatch(order: ShippingOrder, shipment: RoyalMailShipment, actor: ShippingActor) {
      assertRoyalMailBookingAllowed(order);
      if (shipment.status !== "booked" || !shipment.externalOrderId || !shipment.trackingNumber) {
        throw new Error("A Royal Mail label and tracking number are required before dispatch.");
      }
      await api.markDespatched(shipment.externalOrderId);
      if (!await repository.finishDispatch(order.id, actor)) throw new Error("Royal Mail was updated, but local dispatch could not be saved. Retry or reconcile this order.");
    },
  };
}
