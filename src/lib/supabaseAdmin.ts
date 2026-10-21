import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseServerEnv } from "@/lib/env";
import type { Database } from "@/types/database";

let client: SupabaseClient<Database> | null = null;

export function getSupabaseAdmin(): SupabaseClient<Database> {
  if (client) return client;
  const env = getSupabaseServerEnv();
  client = createClient(env.supabaseUrl, env.supabaseSecretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return client;
}
