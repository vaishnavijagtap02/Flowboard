// GET /api/health — Deployment uptime check, system metrics & environment readiness status.

import { isSupabaseConfigured } from "@/lib/supabase";
import { getStorageMetrics } from "@/lib/storage";
import { ServerTiming } from "@/lib/serverTiming";

export async function GET() {
  const timing = new ServerTiming();
  timing.start("health_metrics");

  const mem = process.memoryUsage();
  const uptimeSeconds = Math.floor(process.uptime());
  const hours = Math.floor(uptimeSeconds / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);
  const seconds = uptimeSeconds % 60;
  const humanUptime = `${hours}h ${minutes}m ${seconds}s`;

  const storageMetrics = getStorageMetrics();
  timing.stop("health_metrics", "Gather system metrics");

  const headers = new Headers({
    "Content-Type": "application/json",
    "Cache-Control": "no-cache, no-store, must-revalidate",
  });
  timing.applyToHeaders(headers);

  return new Response(
    JSON.stringify({
      status: "healthy",
      service: "flowboard",
      timestamp: new Date().toISOString(),
      uptime: {
        seconds: uptimeSeconds,
        formatted: humanUptime,
      },
      metrics: {
        memory: {
          heapUsedMB: Number((mem.heapUsed / 1024 / 1024).toFixed(2)),
          heapTotalMB: Number((mem.heapTotal / 1024 / 1024).toFixed(2)),
          rssMB: Number((mem.rss / 1024 / 1024).toFixed(2)),
          externalMB: Number((mem.external / 1024 / 1024).toFixed(2)),
        },
        storage: storageMetrics,
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
      },
      integrations: {
        openai: Boolean(process.env.OPENAI_API_KEY),
        supabase: isSupabaseConfigured(),
      },
    }),
    {
      status: 200,
      headers,
    }
  );
}
