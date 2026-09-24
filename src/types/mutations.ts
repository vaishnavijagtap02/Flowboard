// AI mutation types — the strict protocol for how the AI modifies the graph.
// The AI NEVER outputs a full graph. It outputs an array of atomic mutations.

import type { SemanticNode, SemanticEdge } from "./semantic";

export interface AddNodeMutation {
  action: "ADD_NODE";
  node: SemanticNode;
}

export interface RemoveNodeMutation {
  action: "REMOVE_NODE";
  nodeId: string;
}

export interface UpdateNodeMutation {
  action: "UPDATE_NODE";
  nodeId: string;
  updates: Partial<Omit<SemanticNode, "id">>;
}

export interface AddEdgeMutation {
  action: "ADD_EDGE";
  edge: Omit<SemanticEdge, "id">;
}

export interface RemoveEdgeMutation {
  action: "REMOVE_EDGE";
  edgeId: string;
}

export type GraphMutation =
  | AddNodeMutation
  | RemoveNodeMutation
  | UpdateNodeMutation
  | AddEdgeMutation
  | RemoveEdgeMutation;

export type MutationAction = GraphMutation["action"];

export interface AIMutationPlan {
  explanation: string;
  mutations: GraphMutation[];
}

export interface MutationResult {
  applied: GraphMutation[];
  rejected: { mutation: GraphMutation; reason: string }[];
}
