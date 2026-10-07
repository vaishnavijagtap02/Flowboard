// POST /api/ai/chat — AI chat endpoint.
// Receives a user message + current graph context.
// Returns a streaming response with an explanation and optionally a mutation plan.
//
// From SYSTEM_DESIGN §8.1:
//   1. Parse and validate request body (Zod)
//   2. Construct system prompt
//   3. Inject serialized graph as context
//   4. Call LLM via Vercel AI SDK
//   5. Stream response back to client

import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { CHAT_SYSTEM_PROMPT } from "@/lib/prompts";
import { ChatRequestSchema } from "@/schemas/chat";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

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

    // ── Step 2–3: Build messages with graph context ─────────────────────────
    const messages = history.map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    }));

    // Append current message with the graph injected as context
    messages.push({
      role: "user" as const,
      content: `CURRENT ARCHITECTURE GRAPH:\n${JSON.stringify(graph, null, 2)}\n\nUSER REQUEST:\n${message}`,
    });

    // ── Step 4: Call the LLM ────────────────────────────────────────────────
    const result = streamText({
      model: openai("gpt-4o"),
      system: CHAT_SYSTEM_PROMPT,
      messages: messages,
      temperature: 0.2, // Low temperature for deterministic structured outputs
    });

    // ── Step 5: Stream response ─────────────────────────────────────────────
    return result.toTextStreamResponse();
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
