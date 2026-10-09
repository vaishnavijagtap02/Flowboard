// POST /api/ai/chat — AI chat endpoint.
// Receives a user message + current graph context.
// Features:
//   - Sensitive data / secret redaction (sanitizer)
//   - Subgraph scoping & token pruning (subgraph engine)
//   - Intelligent model tier routing (fast vs standard vs reasoning)
//   - Deterministic graph hashing for caching headers

import { streamText } from "ai";
import { CHAT_SYSTEM_PROMPT } from "@/lib/prompts";
import { ChatRequestSchema } from "@/schemas/chat";
import { sanitizeGraph, sanitizeText } from "@/lib/sanitizer";
import { computeGraphHash, findFocalNodes, extractSubgraph } from "@/engine/subgraph";
import { inferModelTier, getModelForTier, MODEL_PROFILES } from "@/lib/models";

// Allow streaming responses up to 45 seconds
export const maxDuration = 45;

export async function POST(req: Request) {
  try {
    const rawBody = await req.json();

    // ── Step 1: Zod validation ──────────────────────────────────────────────
    const parsed = ChatRequestSchema.safeParse(rawBody);
    if (!parsed.success) {
      return Response.json(
        {
          error: "Validation error",
          code: "VALIDATION_ERROR" as const,
          details: parsed.error.issues
            .map((i) => `${i.path.join(".")}: ${i.message}`)
            .join("; "),
        },
        { status: 400 }
      );
    }

    const { message, graph, history } = parsed.data;

    // ── Step 2: Secret & PII Sanitization ───────────────────────────────────
    const { sanitizedGraph, redactionCount: graphRedactions } = sanitizeGraph(graph);
    const { text: sanitizedMessage, redactionCount: messageRedactions } = sanitizeText(message);
    const totalRedactions = graphRedactions + messageRedactions;

    // ── Step 3: Graph Hash & Subgraph Scoping ───────────────────────────────
    const graphHash = computeGraphHash(sanitizedGraph);
    const focalNodeIds = findFocalNodes(sanitizedMessage, sanitizedGraph);
    const { subgraph, tokenReductionRatio } = extractSubgraph(sanitizedGraph, focalNodeIds, 1);

    // ── Step 4: Model Tier Selection ────────────────────────────────────────
    const tier = inferModelTier(sanitizedMessage, sanitizedGraph.nodes.length);
    const model = getModelForTier(tier);
    const profile = MODEL_PROFILES[tier];

    // ── Step 5: Build Chat Messages ─────────────────────────────────────────
    const messages = history.map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: sanitizeText(msg.content).text,
    }));

    // Inject the sanitized (and potentially scoped) graph as context
    const contextHeader = tokenReductionRatio > 0
      ? `CURRENT ARCHITECTURE GRAPH (Scoped to active components):\n${JSON.stringify(subgraph, null, 2)}`
      : `CURRENT ARCHITECTURE GRAPH:\n${JSON.stringify(sanitizedGraph, null, 2)}`;

    messages.push({
      role: "user" as const,
      content: `${contextHeader}\n\nUSER REQUEST:\n${sanitizedMessage}`,
    });

    // ── Step 6: Stream LLM response ─────────────────────────────────────────
    const result = streamText({
      model: model,
      system: CHAT_SYSTEM_PROMPT,
      messages: messages,
      temperature: profile.temperature,
    });

    const response = result.toTextStreamResponse();

    // Add architecture telemetry headers for client
    response.headers.set("X-Flowboard-Graph-Hash", graphHash);
    response.headers.set("X-Flowboard-Model-Tier", tier);
    response.headers.set("X-Flowboard-Token-Reduction-Pct", `${Math.round(tokenReductionRatio * 100)}%`);
    response.headers.set("X-Flowboard-Redactions", String(totalRedactions));

    return response;
  } catch (error) {
    console.error("AI Chat API Error:", error);

    // Distinguish known error types
    if (error instanceof SyntaxError) {
      return Response.json(
        { error: "Invalid JSON in request body", code: "VALIDATION_ERROR" as const },
        { status: 400 }
      );
    }

    return Response.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" as const },
      { status: 500 }
    );
  }
}
