import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { signOut } = vi.hoisted(() => ({ signOut: vi.fn() }));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: async () => ({ auth: { signOut } }),
}));

import { POST } from "./route";

describe("admin logout", () => {
  beforeEach(() => signOut.mockResolvedValue({ error: null }));

  it("ends the local session and redirects to the login page", async () => {
    const request = new NextRequest("https://regitech.example/api/v1/admin/logout", {
      method: "POST",
      headers: { origin: "https://regitech.example" },
    });

    const response = await POST(request);

    expect(signOut).toHaveBeenCalledWith({ scope: "local" });
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("https://regitech.example/admin/login");
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("rejects cross-origin submissions", async () => {
    const request = new NextRequest("https://regitech.example/api/v1/admin/logout", {
      method: "POST",
      headers: { origin: "https://attacker.example" },
    });

    const response = await POST(request);

    expect(response.status).toBe(403);
    expect(signOut).not.toHaveBeenCalled();
  });
});
