// src/lib/supabase.ts
// Supabase client initialization for browser authentication and database persistence.

import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let browserClient: SupabaseClient | null = null;
let serverClient: SupabaseClient | null = null;

/**
 * Returns true if public Supabase environment variables are available.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

/**
 * Returns a Supabase client configured for browser-side authentication and querying.
 */
export function getBrowserSupabaseClient(): SupabaseClient | null {
  if (browserClient) return browserClient;

  if (supabaseUrl && supabaseAnonKey) {
    browserClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    return browserClient;
  }

  return null;
}

/**
 * Returns a Supabase client for server-side persistence (API routes),
 * using the service role key if present, or falling back to anon key.
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (serverClient) return serverClient;

  const key = supabaseServiceKey || supabaseAnonKey;
  if (supabaseUrl && key) {
    serverClient = createClient(supabaseUrl, key);
    return serverClient;
  }

  return null;
}
