// Artifact types for AI-generated implementation files.

import type { SemanticGraph } from "./semantic";

export type ArtifactType =
  | "architecture-readme"
  | "docker-compose"
  | "api-contracts"
  | "env-template";

export interface ArtifactRequest {
  graph: SemanticGraph;
  artifactType: ArtifactType;
}

export interface GeneratedArtifact {
  type: ArtifactType;
  filename: string;
  language: string;
  content: string;
  timestamp: number;
}
