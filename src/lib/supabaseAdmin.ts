import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getOrderServerEnv } from "@/lib/env";

let client: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (client) return client;
  const env = getOrderServerEnv();
  client = createClient(env.supabaseUrl, env.supabaseSecretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return client;
}
