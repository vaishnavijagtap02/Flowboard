// POST /api/ai/artifacts — Artifact generation endpoint.
// Receives the graph + desired artifact type. Returns the generated artifact content
// along with metadata (filename, language) as a custom header for the client.
//
// From SYSTEM_DESIGN §8.1:
//   1. Parse and validate request body (Zod)
//   2. Select artifact-specific prompt template
//   3. Inject serialized graph as context
//   4. Call LLM via Vercel AI SDK
//   5. Stream artifact content back to client

import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { getArtifactPrompt } from "@/lib/prompts";
import { ArtifactRequestSchema, ARTIFACT_METADATA } from "@/schemas/artifacts";

// Allow streaming responses up to 60 seconds (artifact generation can be longer)
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const rawBody = await req.json();

    // ── Step 1: Zod validation ──────────────────────────────────────────────
    const parsed = ArtifactRequestSchema.safeParse(rawBody);
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

    const { graph, artifactType } = parsed.data;

    // ── Step 2: Get artifact-specific prompt and metadata ───────────────────
    const systemPrompt = getArtifactPrompt(artifactType);
    const metadata = ARTIFACT_METADATA[artifactType];

    // ── Step 3–4: Call the LLM ──────────────────────────────────────────────
    const result = streamText({
      model: openai("gpt-4o"),
      system: systemPrompt,
      prompt: `Please generate the artifact based on this architecture graph:\n\n${JSON.stringify(graph, null, 2)}`,
      temperature: 0.1, // Very low for precise code/config generation
    });

    // ── Step 5: Stream with metadata headers ────────────────────────────────
    const response = result.toTextStreamResponse();

    // Attach artifact metadata as custom headers so the client knows
    // what filename/language to use for preview and download
    response.headers.set("X-Artifact-Filename", metadata.filename);
    response.headers.set("X-Artifact-Language", metadata.language);
    response.headers.set("X-Artifact-Type", artifactType);

    return response;
  } catch (error) {
    console.error("AI Artifact API Error:", error);

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
