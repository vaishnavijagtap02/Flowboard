// src/lib/supabase.ts
// Supabase client initialization for server-side persistence and versioning.

import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let clientInstance: SupabaseClient | null = null;

/**
 * Returns a configured Supabase client if environment variables are present,
 * or null if Supabase is not yet configured.
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (clientInstance) return clientInstance;

  if (supabaseUrl && supabaseKey) {
    clientInstance = createClient(supabaseUrl, supabaseKey);
    return clientInstance;
  }

  return null;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseKey);
}
