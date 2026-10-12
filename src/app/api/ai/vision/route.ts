// POST /api/ai/vision — Vision OCR & Screenshot-to-Architecture Scanner.
// Accepts an image (base64 data URL or raw base64) and uses GPT-4o multimodal vision
// to extract semantic components and connections into a structured AIMutationPlan.

import { z } from "zod";
import { generateText } from "ai";
import { isAIConfigured, getVisionModel } from "@/lib/models";
import { AIMutationPlanSchema } from "@/schemas/mutations";
import { ServerTiming } from "@/lib/serverTiming";
import type { AIMutationPlan } from "@/types/mutations";

export const maxDuration = 45;

const VisionRequestSchema = z.object({
  image: z.string().min(10, "Image data is required"),
  mimeType: z.string().default("image/png"),
  hint: z.string().max(500).optional(),
});

const VISION_SYSTEM_PROMPT = `You are an expert distributed systems architect and technical diagram reverse-engineer.
Your task is to analyze the provided architecture diagram, whiteboard sketch, or meeting screenshot and reconstruct it into Flowboard's semantic architecture format.

Rules:
1. Identify all architecture components and classify each node into one of these semantic types:
   - "service" (backend services, workers, microservices)
   - "database" (relational, NoSQL, document databases)
   - "api" (REST, GraphQL, gRPC API boundaries)
   - "queue" (Kafka, RabbitMQ, SQS, event brokers)
   - "cache" (Redis, Memcached, CDN caches)
   - "gateway" (API gateways, reverse proxies, ingress controllers)
   - "client" (web apps, mobile apps, frontend clients, IoT)

2. For each node, extract:
   - "id": A clean kebab-case identifier (e.g., "srv-orders", "db-postgres", "gw-kong", "queue-kafka")
   - "type": One of the valid node types above
   - "name": Clean human-readable title (e.g., "Order Processing Service")
   - "technology": Inferred or visible technology (e.g., "Node.js", "PostgreSQL", "Apache Kafka", "Redis")
   - "description": Brief 1-sentence responsibility description
   - "responsibilities": Array of key duties

3. For each arrow or connection, extract:
   - "source": Source node ID
   - "target": Target node ID
   - "relationship": One of "connects_to" | "reads_from" | "writes_to" | "publishes_to" | "subscribes_to"
   - "label": Short connection text (e.g., "HTTP/REST", "stream events", "persist records")
   - "protocol": Inferred protocol (e.g., "HTTPS", "gRPC", "AMQP", "TCP/RESP")

4. Output valid JSON adhering to the AIMutationPlan schema:
{
  "explanation": "Scanned architecture summary...",
  "mutations": [
    {
      "action": "ADD_NODE",
      "node": { "id": "...", "type": "...", "name": "...", "technology": "...", "description": "..." }
    },
    {
      "action": "ADD_EDGE",
      "edge": { "source": "...", "target": "...", "relationship": "...", "label": "..." }
    }
  ]
}

Important:
- Return ONLY valid JSON inside a \`\`\`json markdown fence or raw JSON.
- Ensure all edge source and target IDs reference existing or newly added node IDs.
- Do NOT include 'id' inside the edge object (the mutation engine auto-generates edge IDs).
- Avoid self-loops (source !== target).`;

export async function POST(req: Request) {
  const timing = new ServerTiming();

  try {
    timing.start("validation");
    const raw = await req.json();
    const parsed = VisionRequestSchema.safeParse(raw);

    if (!parsed.success) {
      return Response.json(
        {
          error: "Invalid request payload",
          code: "VALIDATION_ERROR",
          details: parsed.error.issues.map((i) => i.message).join(", "),
        },
        { status: 400 }
      );
    }

    const { image, mimeType, hint } = parsed.data;
    timing.stop("validation", "Zod request schema validation");

    // Clean image data string if it includes data URL prefix
    let cleanBase64 = image;
    let resolvedMime = mimeType;

    if (image.startsWith("data:")) {
      const match = image.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        resolvedMime = match[1];
        cleanBase64 = match[2];
      }
    }

    // ── Zero-config Demo Mode Fallback ──────────────────────────────────────
    if (!isAIConfigured()) {
      const demoId = Date.now().toString(36).slice(-4);
      const hintLower = (hint || "").toLowerCase();

      let plan: AIMutationPlan;

      if (hintLower.includes("payment") || hintLower.includes("checkout")) {
        plan = {
          explanation:
            "[DEMO SCANNER — Simulated Vision Analysis (OPENAI_API_KEY Unconfigured)]\n\nIdentified a microservices checkout topology with asynchronous payments, distributed event bus, and database persistence.",
          mutations: [
            {
              action: "ADD_NODE",
              node: {
                id: `client-checkout-${demoId}`,
                type: "client",
                name: "Web Storefront",
                technology: "Next.js / React",
                description: "Customer checkout web client",
              },
            },
            {
              action: "ADD_NODE",
              node: {
                id: `gw-ingress-${demoId}`,
                type: "gateway",
                name: "Kong API Gateway",
                technology: "Kong Gateway",
                description: "Central entry point routing and authentication",
              },
            },
            {
              action: "ADD_NODE",
              node: {
                id: `srv-checkout-${demoId}`,
                type: "service",
                name: "Checkout Service",
                technology: "Go / Gin",
                description: "Coordinates shopping cart orders",
              },
            },
            {
              action: "ADD_NODE",
              node: {
                id: `queue-payments-${demoId}`,
                type: "queue",
                name: "Kafka Payment Bus",
                technology: "Apache Kafka",
                description: "Buffering payment transaction events",
              },
            },
            {
              action: "ADD_NODE",
              node: {
                id: `srv-payment-worker-${demoId}`,
                type: "service",
                name: "Stripe Settlement Worker",
                technology: "Node.js / TypeScript",
                description: "Asynchronous card settlement worker",
              },
            },
            {
              action: "ADD_NODE",
              node: {
                id: `db-orders-${demoId}`,
                type: "database",
                name: "Orders PostgreSQL",
                technology: "PostgreSQL 16",
                description: "ACID store for ledger orders",
              },
            },
            {
              action: "ADD_EDGE",
              edge: {
                source: `client-checkout-${demoId}`,
                target: `gw-ingress-${demoId}`,
                relationship: "connects_to",
                label: "HTTPS/REST",
              },
            },
            {
              action: "ADD_EDGE",
              edge: {
                source: `gw-ingress-${demoId}`,
                target: `srv-checkout-${demoId}`,
                relationship: "connects_to",
                label: "internal RPC",
              },
            },
            {
              action: "ADD_EDGE",
              edge: {
                source: `srv-checkout-${demoId}`,
                target: `queue-payments-${demoId}`,
                relationship: "publishes_to",
                label: "order.created",
              },
            },
            {
              action: "ADD_EDGE",
              edge: {
                source: `queue-payments-${demoId}`,
                target: `srv-payment-worker-${demoId}`,
                relationship: "subscribes_to",
                label: "consume events",
              },
            },
            {
              action: "ADD_EDGE",
              edge: {
                source: `srv-payment-worker-${demoId}`,
                target: `db-orders-${demoId}`,
                relationship: "writes_to",
                label: "record audit",
              },
            },
          ],
        };
      } else {
        plan = {
          explanation:
            "[DEMO SCANNER — Simulated Vision Analysis (OPENAI_API_KEY Unconfigured)]\n\nDetected an enterprise tiered topology from the screenshot: Ingress Gateway, Core Microservice with low-latency Redis cache, Message Queue, and Sharded Relational Database.",
          mutations: [
            {
              action: "ADD_NODE",
              node: {
                id: `gw-api-${demoId}`,
                type: "gateway",
                name: "Cloudflare Ingress",
                technology: "Cloudflare / Envoy",
                description: "Global edge routing and DDoS mitigation",
              },
            },
            {
              action: "ADD_NODE",
              node: {
                id: `srv-core-${demoId}`,
                type: "service",
                name: "Core Application Service",
                technology: "Rust / Axum",
                description: "High-throughput core domain business service",
              },
            },
            {
              action: "ADD_NODE",
              node: {
                id: `cache-layer-${demoId}`,
                type: "cache",
                name: "Redis Cluster",
                technology: "Redis 7.2",
                description: "Sub-millisecond query cache",
              },
            },
            {
              action: "ADD_NODE",
              node: {
                id: `queue-events-${demoId}`,
                type: "queue",
                name: "Event Stream",
                technology: "RabbitMQ / AMQP",
                description: "Reliable async message queue",
              },
            },
            {
              action: "ADD_NODE",
              node: {
                id: `db-primary-${demoId}`,
                type: "database",
                name: "Primary Database",
                technology: "PostgreSQL",
                description: "Durable persistent relational storage",
              },
            },
            {
              action: "ADD_EDGE",
              edge: {
                source: `gw-api-${demoId}`,
                target: `srv-core-${demoId}`,
                relationship: "connects_to",
                label: "route traffic",
              },
            },
            {
              action: "ADD_EDGE",
              edge: {
                source: `srv-core-${demoId}`,
                target: `cache-layer-${demoId}`,
                relationship: "reads_from",
                label: "read cache",
              },
            },
            {
              action: "ADD_EDGE",
              edge: {
                source: `srv-core-${demoId}`,
                target: `queue-events-${demoId}`,
                relationship: "publishes_to",
                label: "publish tasks",
              },
            },
            {
              action: "ADD_EDGE",
              edge: {
                source: `srv-core-${demoId}`,
                target: `db-primary-${demoId}`,
                relationship: "writes_to",
                label: "store records",
              },
            },
          ],
        };
      }

      return Response.json({ success: true, plan });
    }

    // ── Live GPT-4o Multimodal Vision Call ──────────────────────────────────
    timing.start("vision_inference");

    const imageBuffer = Buffer.from(cleanBase64, "base64");
    const userPromptText = hint
      ? `Here is a technical whiteboard sketch or architecture screenshot. Meeting context / user notes: "${hint}". Extract all components, protocols, and connections into a structured Flowboard mutation plan.`
      : "Extract all components, protocols, technologies, and connection arrows from this architecture screenshot into a structured Flowboard mutation plan.";

    const result = await generateText({
      model: getVisionModel(),
      system: VISION_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: userPromptText,
            },
            {
              type: "image",
              image: imageBuffer,
              mediaType: resolvedMime,
            },
          ],
        },
      ],
      temperature: 0.1,
    });

    timing.stop("vision_inference", "GPT-4o Vision multimodal analysis");

    // Parse returned JSON from the model
    let rawText = result.text.trim();
    if (rawText.startsWith("```")) {
      rawText = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    }

    const jsonParsed = JSON.parse(rawText);
    const planResult = AIMutationPlanSchema.safeParse(jsonParsed);

    if (!planResult.success) {
      return Response.json(
        {
          error: "Failed to validate architecture from vision model",
          details: planResult.error.issues.map((i) => i.message).join(", "),
        },
        { status: 502 }
      );
    }

    return Response.json({
      success: true,
      plan: planResult.data,
      meta: {
        extractedNodes: planResult.data.mutations.filter((m) => m.action === "ADD_NODE").length,
        extractedEdges: planResult.data.mutations.filter((m) => m.action === "ADD_EDGE").length,
      },
    });
  } catch (err: unknown) {
    console.error("Vision OCR endpoint error:", err);
    return Response.json(
      {
        error: err instanceof Error ? err.message : "Internal vision processing error",
      },
      { status: 500 }
    );
  }
}
