import { NextResponse } from "next/server";
import type { ApiEnvelope } from "@/types/address";

export function sendSuccess<T>(data: T, message: string, status = 200) {
  return NextResponse.json<ApiEnvelope<T>>({ success: true, data, message }, { status, headers: { "Cache-Control": "no-store" } });
}

export function sendError(message: string, status: number, errors?: Record<string, string[]>) {
  return NextResponse.json<ApiEnvelope<never>>({ success: false, message, errors }, { status, headers: { "Cache-Control": "no-store" } });
}
