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
import { ServerTiming } from "@/lib/serverTiming";

// Allow streaming responses up to 45 seconds
export const maxDuration = 45;

export async function POST(req: Request) {
  const timing = new ServerTiming();
  try {
    timing.start("validation");
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
    timing.stop("validation", "Request schema validation");

    const { message, graph, history } = parsed.data;

    // ── Step 2: Secret & PII Sanitization ───────────────────────────────────
    timing.start("sanitize");
    const { sanitizedGraph, redactionCount: graphRedactions } = sanitizeGraph(graph);
    const { text: sanitizedMessage, redactionCount: messageRedactions } = sanitizeText(message);
    const totalRedactions = graphRedactions + messageRedactions;
    timing.stop("sanitize", "Data scrubbing & redaction");

    // ── Step 3: Graph Hash & Subgraph Scoping ───────────────────────────────
    timing.start("scoping");
    const graphHash = computeGraphHash(sanitizedGraph);
    const focalNodeIds = findFocalNodes(sanitizedMessage, sanitizedGraph);
    const { subgraph, tokenReductionRatio } = extractSubgraph(sanitizedGraph, focalNodeIds, 1);
    timing.stop("scoping", "Subgraph focal neighborhood extraction");

    // ── Step 4: Model Tier Selection ────────────────────────────────────────
    timing.start("tier_selection");
    const tier = inferModelTier(sanitizedMessage, sanitizedGraph.nodes.length);
    const model = getModelForTier(tier);
    const profile = MODEL_PROFILES[tier];
    timing.stop("tier_selection", "Routing to optimal model tier");

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

    // ── Step 6: Stream LLM response (or dev mode fallback) ───────────────────
    if (!process.env.OPENAI_API_KEY) {
      const lower = sanitizedMessage.toLowerCase();
      let explanation = "";
      const mutations: any[] = [];
      const DEMO_HEADER = `[DEMONSTRATION ENGINE — Propose-Review-Apply Workflow (OPENAI_API_KEY Unconfigured)]\n\n`;

      if (lower.includes("redis") || lower.includes("cache")) {
        explanation = DEMO_HEADER + "I analyzed your architecture and recommend adding a dedicated Redis in-memory cache to absorb read spikes and offload backend queries. Review the proposal below:";
        const cacheId = `cache-redis-${Date.now().toString(36).slice(-4)}`;
        mutations.push({
          action: "ADD_NODE",
          node: {
            id: cacheId,
            type: "cache",
            name: "Redis Cache Layer",
            technology: "Redis 7.2",
            description: "Low-latency in-memory cache for fast session and query retrieval",
            responsibilities: ["Session Storage", "Sub-millisecond Read Hits"],
          },
        });
        const targetNode = sanitizedGraph.nodes.find((n) => n.type === "service" || n.type === "gateway") || sanitizedGraph.nodes[0];
        if (targetNode) {
          mutations.push({
            action: "ADD_EDGE",
            edge: {
              id: `e-${targetNode.id}-${cacheId}`,
              source: targetNode.id,
              target: cacheId,
              relationship: "reads_from",
              label: "read cache",
              protocol: "TCP/RESP",
            },
          });
        }
      } else if (lower.includes("kafka") || lower.includes("queue")) {
        explanation = DEMO_HEADER + "I recommend decoupling asynchronous workflows using an event-driven Kafka message stream. Review the proposal below:";
        const queueId = `queue-kafka-${Date.now().toString(36).slice(-4)}`;
        mutations.push({
          action: "ADD_NODE",
          node: {
            id: queueId,
            type: "queue",
            name: "Kafka Event Broker",
            technology: "Apache Kafka",
            description: "High-throughput distributed event log for asynchronous workflows",
            responsibilities: ["Event Buffering", "Decoupled Processing"],
          },
        });
        const sourceNode = sanitizedGraph.nodes.find((n) => n.type === "service") || sanitizedGraph.nodes[0];
        if (sourceNode) {
          mutations.push({
            action: "ADD_EDGE",
            edge: {
              id: `e-${sourceNode.id}-${queueId}`,
              source: sourceNode.id,
              target: queueId,
              relationship: "publishes_to",
              label: "stream events",
              protocol: "TCP/Kafka",
            },
          });
        }
      } else if (lower.includes("gateway")) {
        explanation = DEMO_HEADER + "Adding an API Gateway at the ingress tier to handle SSL termination, authentication routing, and rate limiting. Review the proposal below:";
        const gwId = `gateway-${Date.now().toString(36).slice(-4)}`;
        mutations.push({
          action: "ADD_NODE",
          node: {
            id: gwId,
            type: "gateway",
            name: "API Ingress Gateway",
            technology: "Kong / Envoy",
            description: "Unified entry point with rate limiting and JWT auth verification",
            responsibilities: ["Rate Limiting", "TLS Termination", "Auth Proxy"],
          },
        });
      } else if (lower.includes("bottleneck") || lower.includes("spof") || lower.includes("analyze") || lower.includes("issue") || lower.includes("fix")) {
        explanation = `${DEMO_HEADER}Architectural Analysis for current system (${sanitizedGraph.nodes.length} components, ${sanitizedGraph.edges.length} connections):\n\n1. **High Availability**: Critical stateful services should be partitioned across availability zones.\n2. **Decoupling**: High-volume synchronous RPCs should leverage an event stream or message queue to protect against cascading failures.\n3. **Edge Ingress**: Client connections should terminate at an API Gateway before reaching internal microservices.\n\n*(Note: Add OPENAI_API_KEY to .env.local to enable live model reasoning on arbitrary prompts!)*`;
      } else {
        explanation = `${DEMO_HEADER}I reviewed your architecture graph (${sanitizedGraph.nodes.length} components, ${sanitizedGraph.edges.length} connections).\n\n💡 To enable open-ended natural language reasoning with live GPT-4o models, add your \`OPENAI_API_KEY\` to \`.env.local\`.\n\nIn this demonstration environment, you can test the Propose → Review → Apply engine with:\n- "Add a Redis cache"\n- "Add a Kafka queue"\n- "Add an API Gateway"`;
      }

      let fullPayload = explanation;
      if (mutations.length > 0) {
        fullPayload += `\n\n===MUTATION_PLAN===\n${JSON.stringify({ mutations }, null, 2)}`;
      }

      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          const chunks = fullPayload.split(" ");
          for (const chunk of chunks) {
            controller.enqueue(encoder.encode(chunk + " "));
            await new Promise((r) => setTimeout(r, 15));
          }
          controller.close();
        },
      });

      const response = new Response(stream, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "X-Flowboard-Mode": "simulation",
        },
      });
      response.headers.set("X-Flowboard-Graph-Hash", graphHash);
      response.headers.set("X-Flowboard-Model-Tier", tier);
      timing.applyToHeaders(response.headers);
      return response;
    }

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
    timing.applyToHeaders(response.headers);

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
