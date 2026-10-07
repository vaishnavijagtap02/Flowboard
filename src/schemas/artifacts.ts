// Zod runtime schemas for artifact request/response validation.
// Used by the /api/ai/artifacts route to validate incoming requests.

import { z } from "zod";
import { SemanticGraphSchema } from "./semanticEdge";

// ─── Artifact Types ─────────────────────────────────────────────────────────

export const ArtifactTypeSchema = z.enum([
  "architecture-readme",
  "docker-compose",
  "api-contracts",
  "env-template",
]);

// ─── Request Schema ─────────────────────────────────────────────────────────

export const ArtifactRequestSchema = z.object({
  graph: SemanticGraphSchema,
  artifactType: ArtifactTypeSchema,
});

// ─── Artifact Metadata (returned alongside streamed content) ─────────────────

export const ARTIFACT_METADATA: Record<
  z.infer<typeof ArtifactTypeSchema>,
  { filename: string; language: string }
> = {
  "architecture-readme": { filename: "ARCHITECTURE.md", language: "markdown" },
  "docker-compose": { filename: "docker-compose.yml", language: "yaml" },
  "api-contracts": { filename: "api-contracts.ts", language: "typescript" },
  "env-template": { filename: ".env.example", language: "dotenv" },
};
