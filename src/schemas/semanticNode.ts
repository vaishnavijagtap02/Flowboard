// schemas/semanticNode.ts — Zod schema for SemanticNode validation.
// Matches TypeScript types in src/types/semantic.ts.

import { z } from "zod";

export const NodeTypeSchema = z.enum([
  "service",
  "database",
  "api",
  "queue",
  "cache",
  "gateway",
  "client",
]);

export const SemanticNodeSchema = z.object({
  id: z.string(),
  type: NodeTypeSchema,
  name: z.string(),
  technology: z.string().optional(),
  description: z.string().optional(),
  responsibilities: z.array(z.string()).optional(),
  properties: z.record(z.string(), z.string()).optional(),
});
