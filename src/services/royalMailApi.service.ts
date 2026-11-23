import "server-only";
import { parseRoyalMailCreatedOrder } from "@/lib/royalMail";

const BASE_URL = "https://api.parcel.royalmail.com/api/v1";

type RoyalMailBooking = { orderIdentifier: number; trackingNumber: string };

function parseExistingOrder(response: unknown, reference: string): RoyalMailBooking | null {
  if (!Array.isArray(response)) throw new Error("Royal Mail returned an invalid order lookup.");
  const match = response.find((item) => item && typeof item === "object" && item.orderReference === reference);
  if (!match) return null;
  if (!Number.isSafeInteger(match.orderIdentifier) || match.orderIdentifier <= 0) throw new Error("Royal Mail returned an invalid order identifier.");
  const trackingNumber = typeof match.trackingNumber === "string" && match.trackingNumber ? match.trackingNumber :
    Array.isArray(match.packages) && typeof match.packages[0]?.trackingNumber === "string" ? match.packages[0].trackingNumber : "";
  return { orderIdentifier: match.orderIdentifier, trackingNumber };
}

export function createRoyalMailApi(apiKey: string, fetcher: typeof fetch = fetch) {
  if (!apiKey.trim()) throw new Error("Royal Mail is not configured on this server.");

  async function request(path: string, method = "GET", body?: unknown, accept = "application/json") {
    const response = await fetcher(`${BASE_URL}${path}`, {
      method,
      headers: { Authorization: apiKey.trim(), Accept: accept, ...(body === undefined ? {} : { "Content-Type": "application/json" }) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(15_000),
    });
    return response;
  }

  return {
    async createOrder(reference: string, payload: unknown): Promise<RoyalMailBooking> {
      const response = await request("/orders", "POST", payload);
      if (!response.ok) throw new Error(`Royal Mail booking failed (${response.status}).`);
      return parseRoyalMailCreatedOrder(await response.json(), reference);
    },
    async findOrder(reference: string): Promise<RoyalMailBooking | null> {
      const path = `/orders/%22${encodeURIComponent(reference)}%22`;
      const response = await request(path);
      if (response.status === 404) return null;
      if (!response.ok) throw new Error(`Royal Mail order lookup failed (${response.status}).`);
      return parseExistingOrder(await response.json(), reference);
    },
    async getLabel(orderIdentifier: number): Promise<Uint8Array> {
      if (!Number.isSafeInteger(orderIdentifier) || orderIdentifier <= 0) throw new Error("Invalid Royal Mail order identifier.");
      const response = await request(`/orders/${orderIdentifier}/label`, "GET", undefined, "application/pdf");
      if (!response.ok) throw new Error(`Royal Mail label download failed (${response.status}).`);
      const bytes = new Uint8Array(await response.arrayBuffer());
      if (bytes.length < 4 || bytes.length > 10 * 1024 * 1024 ||
          bytes[0] !== 0x25 || bytes[1] !== 0x50 || bytes[2] !== 0x44 || bytes[3] !== 0x46) {
        throw new Error("Royal Mail did not return a valid PDF label.");
      }
      return bytes;
    },
    async markDespatched(orderIdentifier: number): Promise<void> {
      if (!Number.isSafeInteger(orderIdentifier) || orderIdentifier <= 0) throw new Error("Invalid Royal Mail order identifier.");
      const response = await request("/orders/status", "PUT", { items: [{ orderIdentifier, status: "despatched" }] });
      if (!response.ok) throw new Error(`Royal Mail dispatch update failed (${response.status}).`);
      const result = await response.json() as { updatedOrders?: Array<{ orderIdentifier?: number; status?: string }>; errors?: unknown[] };
      if (result.errors?.length || !result.updatedOrders?.some((item) => item.orderIdentifier === orderIdentifier && item.status === "despatched")) {
        throw new Error("Royal Mail did not confirm dispatch.");
      }
    },
  };
}
