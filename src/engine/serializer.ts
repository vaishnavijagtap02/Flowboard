// engine/serializer.ts — Converts full React Flow state into a token-efficient
// semantic-only representation for the LLM.
//
// Rules (from SYSTEM_DESIGN §5.2.1):
//   - Strip all visual properties (position, width, height, selected, dragging)
//   - Strip all React Flow internal properties (__rf, internals)
//   - Preserve only node.data (semantic) and edge relationship data
//   - Sort nodes by ID for deterministic output
//   - Omit empty optional fields to save tokens

import type { FlowNode, FlowEdge } from "@/types/canvas";
import type { SemanticNode, SemanticEdge, SemanticGraph } from "@/types/semantic";

/**
 * Strips a single FlowNode down to its semantic payload.
 * Removes all visual/canvas properties — position, dimensions, selection,
 * React Flow internals, etc.
 */
function stripNodeToSemantic(node: FlowNode): SemanticNode {
  const d = node.data;
  const result: SemanticNode = {
    id: d.id,
    type: d.type,
    name: d.name,
  };

  // Only include optional fields if they carry meaningful data (saves tokens)
  if (d.technology) result.technology = d.technology;
  if (d.description) result.description = d.description;
  if (d.responsibilities && d.responsibilities.length > 0) {
    result.responsibilities = d.responsibilities;
  }
  if (d.properties && Object.keys(d.properties).length > 0) {
    result.properties = d.properties;
  }

  return result;
}

/**
 * Strips a single FlowEdge down to its semantic payload.
 */
function stripEdgeToSemantic(edge: FlowEdge): SemanticEdge {
  const result: SemanticEdge = {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    relationship: edge.data?.relationship ?? "connects_to",
  };

  if (edge.data?.label) result.label = edge.data.label;
  if (edge.data?.protocol) result.protocol = edge.data.protocol;

  return result;
}

/**
 * serializeForAI — Converts a full React Flow graph into a compact, semantic-only
 * JSON object suitable for sending to the LLM.
 *
 * This is the single source of truth for "what does the AI see?".
 * Everything visual (positions, styles, React Flow internals) is stripped.
 * Nodes are sorted by ID for deterministic output across serializations.
 */
export function serializeForAI(
  nodes: FlowNode[],
  edges: FlowEdge[]
): SemanticGraph {
  return {
    nodes: nodes
      .map(stripNodeToSemantic)
      .sort((a, b) => a.id.localeCompare(b.id)),
    edges: edges.map(stripEdgeToSemantic),
  };
}
