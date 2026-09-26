import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { CHAT_SYSTEM_PROMPT } from "@/lib/prompts";
import type { SemanticGraph } from "@/types/semantic";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

interface ChatRequest {
  message: string;
  graph: SemanticGraph;
  history: {
    role: "user" | "assistant";
    content: string;
  }[];
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ChatRequest;
    
    // Basic validation
    if (!body.message || !body.graph) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { message, graph, history = [] } = body;

    // Convert history to format expected by Vercel AI SDK
    const messages = history.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    // Append the current message with the graph context
    messages.push({
      role: "user",
      content: `CURRENT GRAPH:\n${JSON.stringify(graph, null, 2)}\n\nUSER REQUEST:\n${message}`,
    });

    // Call the LLM
    const result = streamText({
      model: openai("gpt-4o"),
      system: CHAT_SYSTEM_PROMPT,
      messages: messages,
      temperature: 0.2, // Low temperature for more deterministic JSON outputs
    });

    // Return the stream directly to the client
    return result.toTextStreamResponse();
  } catch (error) {
    console.error("AI Chat API Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
