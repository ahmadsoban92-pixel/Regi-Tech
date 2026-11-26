import { beforeEach, describe, expect, it, vi } from "vitest";

const rpc = vi.hoisted(() => vi.fn());
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabaseAdmin", () => ({ getSupabaseAdmin: () => ({ rpc }) }));

import { adminRepository } from "@/services/admin.service";
import type { AdminOrderFilters } from "@/types/admin";

const filters: AdminOrderFilters = {
  query: "",
  registration: "",
  from: "",
  to: "",
  payment: "all",
  fulfilment: "all",
  verification: "all",
  page: 1,
};

describe("admin order search compatibility", () => {
  beforeEach(() => rpc.mockReset());

  it("loads ordinary orders with the older database function when the new signature is missing", async () => {
    rpc.mockResolvedValueOnce({ data: null, error: { code: "PGRST202" } });
    rpc.mockResolvedValueOnce({ data: [], error: null });

    const result = await adminRepository.listOrders(filters);

    expect(result).toMatchObject({ orders: [], total: 0, migrationRequired: false });
    expect(rpc).toHaveBeenCalledTimes(2);
    expect(rpc.mock.calls[0][1]).toHaveProperty("p_registration");
    expect(rpc.mock.calls[1][1]).not.toHaveProperty("p_registration");
    expect(rpc.mock.calls[1][1]).not.toHaveProperty("p_verification_status");
  });

  it("reports that registration search needs the database update", async () => {
    rpc.mockResolvedValueOnce({ data: null, error: { code: "PGRST202" } });

    const result = await adminRepository.listOrders({ ...filters, registration: "AS66 RTY" });

    expect(result).toMatchObject({ orders: [], total: 0, migrationRequired: true });
    expect(rpc).toHaveBeenCalledTimes(1);
  });

  it("does not hide unrelated database errors", async () => {
    rpc.mockResolvedValueOnce({ data: null, error: { code: "42501" } });
    await expect(adminRepository.listOrders(filters)).rejects.toThrow("Unable to load orders.");
    expect(rpc).toHaveBeenCalledTimes(1);
  });
});
