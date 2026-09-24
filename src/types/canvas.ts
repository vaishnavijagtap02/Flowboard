// Canvas types — bridges React Flow's visual model with our semantic model.
// FlowNode wraps SemanticNode as `data`, adding position and visual properties.

import type { Node, Edge } from "@xyflow/react";
import type { SemanticNode, EdgeRelationship } from "./semantic";

// The data payload inside every React Flow node IS the SemanticNode
export type FlowNodeData = SemanticNode;

// A React Flow node carrying semantic data
export type FlowNode = Node<FlowNodeData>;

// Data attached to each edge
export interface FlowEdgeData {
  relationship: EdgeRelationship;
  label?: string;
  protocol?: string;
  [key: string]: unknown;
}

// A React Flow edge carrying semantic relationship data
export type FlowEdge = Edge<FlowEdgeData>;

// Viewport state for camera position
export interface ViewportState {
  x: number;
  y: number;
  zoom: number;
}

// Full canvas state for persistence
export interface CanvasState {
  nodes: FlowNode[];
  edges: FlowEdge[];
  viewport: ViewportState;
}
