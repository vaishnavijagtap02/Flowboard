import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { getArtifactPrompt } from "@/lib/prompts";
import type { ArtifactRequest } from "@/types/artifacts";

// Allow streaming responses up to 60 seconds (artifact generation might take longer than chat)
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ArtifactRequest;
    
    // Basic validation
    if (!body.graph || !body.artifactType) {
      return new Response(JSON.stringify({ error: "Missing required fields (graph, artifactType)" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { graph, artifactType } = body;

    // Get the specific system prompt for this artifact type
    const systemPrompt = getArtifactPrompt(artifactType);

    // Call the LLM to generate the artifact
    const result = streamText({
      model: openai("gpt-4o"),
      system: systemPrompt,
      prompt: `Please generate the artifact based on this architecture graph:\n\n${JSON.stringify(graph, null, 2)}`,
      temperature: 0.1, // Very low temperature for code/artifact generation to be precise
    });

    // Stream the generated code directly to the client
    return result.toTextStreamResponse();
  } catch (error) {
    console.error("AI Artifact API Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
