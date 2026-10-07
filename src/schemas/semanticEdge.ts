// schemas/semanticEdge.ts — Zod schemas for SemanticEdge and SemanticGraph validation.
// Matches TypeScript types in src/types/semantic.ts.

import { z } from "zod";
import { SemanticNodeSchema } from "./semanticNode";

export const EdgeRelationshipSchema = z.enum([
  "connects_to",
  "reads_from",
  "writes_to",
  "publishes_to",
  "subscribes_to",
]);

export const SemanticEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  relationship: EdgeRelationshipSchema,
  label: z.string().optional(),
  protocol: z.string().optional(),
});

export const SemanticGraphSchema = z.object({
  nodes: z.array(SemanticNodeSchema),
  edges: z.array(SemanticEdgeSchema),
});
