// Zod schema for validating the incoming chat request body.

import { z } from "zod";
import { SemanticGraphSchema } from "./semanticEdge";

export const ChatRequestSchema = z.object({
  message: z.string().min(1, "Message cannot be empty"),
  graph: SemanticGraphSchema,
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      })
    )
    .default([]),
});
