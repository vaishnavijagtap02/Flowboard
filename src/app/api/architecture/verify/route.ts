// POST /api/architecture/verify — Architecture verification and linting endpoint.
// Runs static graph analysis to detect synchronous cycles, tier breaches, SPOFs,
// and returns an architectural health score with actionable recommendations.

import { z } from "zod";
import { lintArchitecture } from "@/engine/linter";
import { sanitizeGraph } from "@/lib/sanitizer";
import { SemanticNodeSchema } from "@/schemas/semanticNode";
import { SemanticEdgeSchema } from "@/schemas/semanticEdge";
import { ServerTiming } from "@/lib/serverTiming";

const VerifyRequestSchema = z.object({
  graph: z.object({
    nodes: z.array(SemanticNodeSchema),
    edges: z.array(SemanticEdgeSchema),
  }),
});

export async function POST(req: Request) {
  const timing = new ServerTiming();
  try {
    timing.start("validation");
    const rawBody = await req.json();

    const parsed = VerifyRequestSchema.safeParse(rawBody);
    if (!parsed.success) {
      return Response.json(
        {
          error: "Validation error",
          code: "VALIDATION_ERROR",
          details: parsed.error.issues
            .map((i) => `${i.path.join(".")}: ${i.message}`)
            .join("; "),
        },
        { status: 400 }
      );
    }
    timing.stop("validation", "Zod Schema Validation");

    const { graph } = parsed.data;

    // Sanitize in case sensitive properties exist
    timing.start("sanitize");
    const { sanitizedGraph, redactionCount } = sanitizeGraph(graph);
    timing.stop("sanitize", "Sensitive data scrubbing");

    // Run deterministic linter
    timing.start("linter");
    const report = lintArchitecture(sanitizedGraph);
    timing.stop("linter", "Graph cycle & SPOF analysis");

    const headers = new Headers({ "Content-Type": "application/json" });
    timing.applyToHeaders(headers);
    headers.set("X-Flowboard-Redactions", String(redactionCount));

    return new Response(
      JSON.stringify({
        success: true,
        report,
      }),
      { status: 200, headers }
    );
  } catch (error) {
    console.error("Architecture Verification API Error:", error);

    if (error instanceof SyntaxError) {
      return Response.json(
        { error: "Invalid JSON in request body", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    return Response.json(
      { error: "Internal server error during verification", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
