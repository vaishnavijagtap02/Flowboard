// Node type registry for React Flow.
// Maps our semantic node types to React Flow custom node components.
// Since BaseNode renders differently based on data.type, all types
// share the same component — the visual difference is data-driven.

import { BaseNode } from "./BaseNode";
import type { NodeTypes } from "@xyflow/react";

// React Flow nodeTypes registry
// Each key maps to the `type` field on a FlowNode.
export const nodeTypes: NodeTypes = {
  service: BaseNode,
  database: BaseNode,
  api: BaseNode,
  queue: BaseNode,
  cache: BaseNode,
  gateway: BaseNode,
  client: BaseNode,
};
