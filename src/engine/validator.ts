// engine/validator.ts — Referential integrity checks for AI-generated mutations.
//
// These checks run AFTER Zod structural validation and BEFORE mutations are
// applied to the store. They ensure the mutation plan is internally consistent
// and consistent with the current graph state.
//
// From SYSTEM_DESIGN §5.2.4:
//   - ADD_EDGE: source node exists AND target node exists (considering pending ADD_NODEs)
//   - REMOVE_NODE: node exists in current graph
//   - UPDATE_NODE: node exists in current graph
//   - REMOVE_EDGE: edge exists in current graph
//   - ADD_NODE: node ID does not already exist (prevent duplicates)
//   - No circular self-edges (source !== target)

import type { FlowNode, FlowEdge } from "@/types/canvas";
import type { GraphMutation } from "@/types/mutations";

export interface ValidationResult {
  valid: boolean;
  reason?: string;
}

/**
 * Validates a single mutation against the current graph state.
 *
 * @param mutation   The mutation to validate
 * @param nodes      Current graph nodes (including any nodes added earlier in the same plan)
 * @param edges      Current graph edges (including any edges added earlier in the same plan)
 */
export function validateMutation(
  mutation: GraphMutation,
  nodes: FlowNode[],
  edges: FlowEdge[]
): ValidationResult {
  switch (mutation.action) {
    case "ADD_NODE": {
      const exists = nodes.some((n) => n.id === mutation.node.id);
      if (exists) {
        return {
          valid: false,
          reason: `Node "${mutation.node.id}" already exists`,
        };
      }
      return { valid: true };
    }

    case "REMOVE_NODE": {
      const exists = nodes.some((n) => n.id === mutation.nodeId);
      if (!exists) {
        return {
          valid: false,
          reason: `Node "${mutation.nodeId}" not found`,
        };
      }
      return { valid: true };
    }

    case "UPDATE_NODE": {
      const exists = nodes.some((n) => n.id === mutation.nodeId);
      if (!exists) {
        return {
          valid: false,
          reason: `Node "${mutation.nodeId}" not found`,
        };
      }
      return { valid: true };
    }

    case "ADD_EDGE": {
      // Self-edge check
      if (mutation.edge.source === mutation.edge.target) {
        return {
          valid: false,
          reason: "Self-referencing edges not allowed",
        };
      }

      const sourceExists = nodes.some((n) => n.id === mutation.edge.source);
      if (!sourceExists) {
        return {
          valid: false,
          reason: `Source node "${mutation.edge.source}" not found`,
        };
      }

      const targetExists = nodes.some((n) => n.id === mutation.edge.target);
      if (!targetExists) {
        return {
          valid: false,
          reason: `Target node "${mutation.edge.target}" not found`,
        };
      }

      return { valid: true };
    }

    case "REMOVE_EDGE": {
      const exists = edges.some((e) => e.id === mutation.edgeId);
      if (!exists) {
        return {
          valid: false,
          reason: `Edge "${mutation.edgeId}" not found`,
        };
      }
      return { valid: true };
    }

    default:
      return {
        valid: false,
        reason: `Unknown mutation action`,
      };
  }
}
