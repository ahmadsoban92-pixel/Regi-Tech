import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const forwardedProtocol = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const host = forwardedHost || request.headers.get("host");
  const protocol = forwardedProtocol || request.nextUrl.protocol.replace(":", "");
  const expectedOrigin = host ? `${protocol}://${host}` : request.nextUrl.origin;
  if (origin && origin !== expectedOrigin) {
    return new Response(null, { status: 403 });
  }

  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut({ scope: "local" });

  const response = NextResponse.redirect(new URL("/admin/login", request.url), 303);
  response.headers.set("Cache-Control", "no-store");
  return response;
}
