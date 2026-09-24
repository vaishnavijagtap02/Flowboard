// Core semantic types for Flowboard architecture modeling
// These types represent the machine-readable architecture model
// that the AI reasons about — completely independent of visual/canvas state.

export type NodeType =
  | "service"
  | "database"
  | "api"
  | "queue"
  | "cache"
  | "gateway"
  | "client";

export type EdgeRelationship =
  | "connects_to"
  | "reads_from"
  | "writes_to"
  | "publishes_to"
  | "subscribes_to";

export interface SemanticNode {
  id: string;
  type: NodeType;
  name: string;
  technology?: string;
  description?: string;
  responsibilities?: string[];
  properties?: Record<string, string>;
}

export interface SemanticEdge {
  id: string;
  source: string;
  target: string;
  relationship: EdgeRelationship;
  label?: string;
  protocol?: string;
}

export interface SemanticGraph {
  nodes: SemanticNode[];
  edges: SemanticEdge[];
}
