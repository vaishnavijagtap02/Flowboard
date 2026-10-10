// GET /api/health — Deployment uptime check & environment readiness status.

import { isSupabaseConfigured } from "@/lib/supabase";

export async function GET() {
  return Response.json({
    status: "ok",
    service: "flowboard",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    integrations: {
      openai: Boolean(process.env.OPENAI_API_KEY),
      supabase: isSupabaseConfigured(),
    },
  });
}
