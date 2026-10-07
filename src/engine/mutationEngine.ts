// engine/mutationEngine.ts — Validates and applies AI-generated mutations to the graph.
//
// From SYSTEM_DESIGN §5.2.2:
//   Pipeline:
//     1. Parse raw AI output against AIMutationPlan Zod schema
//     2. For each mutation:
//        a. Validate schema (Zod)
//        b. Validate referential integrity (validator.ts)
//        c. If valid → queue for application
//        d. If invalid → add to rejected list with reason
//     3. For ADD_NODE mutations: generate position via layoutEngine.ts
//     4. Apply all valid mutations to canvasStore
//     5. Return result summary

import { nanoid } from "nanoid";
import { AIMutationPlanSchema, GraphMutationSchema } from "@/schemas/mutations";
import { validateMutation } from "./validator";
import { computeNewNodePositions } from "./layoutEngine";
import type { FlowNode, FlowEdge } from "@/types/canvas";
import type {
  GraphMutation,
  AIMutationPlan,
  MutationResult,
} from "@/types/mutations";

/**
 * Parses and validates a raw mutation plan from AI output.
 * Returns the typed plan or null if parsing fails.
 */
export function parseMutationPlan(raw: unknown): AIMutationPlan | null {
  let target = raw;

  if (typeof raw === "string") {
    try {
      // Strip markdown code fences if present (e.g. ```json ... ``` or ``` ...)
      let cleaned = raw.trim();
      if (cleaned.startsWith("```")) {
        cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
      }
      target = JSON.parse(cleaned);
    } catch (e) {
      console.error("Failed to parse mutation plan JSON string:", e);
      return null;
    }
  }

  const result = AIMutationPlanSchema.safeParse(target);
  if (result.success) {
    return result.data as AIMutationPlan;
  }
  console.error("Mutation plan validation failed:", result.error.issues);
  return null;
}

/**
 * Validates and applies a mutation plan to a snapshot of nodes/edges.
 *
 * This is a pure function — it computes the new nodes/edges arrays and returns them
 * along with the mutation result. The caller is responsible for updating the store.
 *
 * Processing order matters: mutations are applied sequentially so that ADD_NODE
 * in mutation[0] makes the node available for ADD_EDGE in mutation[1].
 */
export function processAndApplyMutations(
  plan: AIMutationPlan,
  currentNodes: FlowNode[],
  currentEdges: FlowEdge[]
): {
  nodes: FlowNode[];
  edges: FlowEdge[];
  result: MutationResult;
} {
  const result: MutationResult = { applied: [], rejected: [] };

  // Working copies that accumulate changes as we process mutations
  let workingNodes = [...currentNodes];
  let workingEdges = [...currentEdges];

  // Track which node IDs are newly added (for layout computation)
  const newNodeIds = new Set<string>();

  for (const mutation of plan.mutations) {
    // Step 1: Zod structural validation
    const schemaResult = GraphMutationSchema.safeParse(mutation);
    if (!schemaResult.success) {
      result.rejected.push({
        mutation,
        reason: `Schema validation failed: ${schemaResult.error.issues.map((i) => i.message).join(", ")}`,
      });
      continue;
    }

    // Step 2: Referential integrity validation
    const validation = validateMutation(mutation, workingNodes, workingEdges);
    if (!validation.valid) {
      result.rejected.push({
        mutation,
        reason: validation.reason ?? "Validation failed",
      });
      continue;
    }

    // Step 3: Apply the mutation to working state
    switch (mutation.action) {
      case "ADD_NODE": {
        const newNode: FlowNode = {
          id: mutation.node.id,
          type: mutation.node.type,
          position: { x: 0, y: 0 }, // Placeholder — will be set by layout engine
          data: { ...mutation.node },
        };
        workingNodes.push(newNode);
        newNodeIds.add(mutation.node.id);
        result.applied.push(mutation);
        break;
      }

      case "REMOVE_NODE": {
        workingNodes = workingNodes.filter((n) => n.id !== mutation.nodeId);
        // Cascade: remove all edges connected to this node
        workingEdges = workingEdges.filter(
          (e) => e.source !== mutation.nodeId && e.target !== mutation.nodeId
        );
        result.applied.push(mutation);
        break;
      }

      case "UPDATE_NODE": {
        workingNodes = workingNodes.map((node) =>
          node.id === mutation.nodeId
            ? { ...node, data: { ...node.data, ...mutation.updates } }
            : node
        );
        result.applied.push(mutation);
        break;
      }

      case "ADD_EDGE": {
        const newEdge: FlowEdge = {
          id: `e-${nanoid(8)}`,
          source: mutation.edge.source,
          target: mutation.edge.target,
          type: "semantic",
          data: {
            relationship: mutation.edge.relationship,
            label: mutation.edge.label,
            protocol: mutation.edge.protocol,
          },
        };
        workingEdges.push(newEdge);
        result.applied.push(mutation);
        break;
      }

      case "REMOVE_EDGE": {
        workingEdges = workingEdges.filter((e) => e.id !== mutation.edgeId);
        result.applied.push(mutation);
        break;
      }
    }
  }

  // Step 4: Compute positions for newly added nodes via Dagre
  if (newNodeIds.size > 0) {
    const positions = computeNewNodePositions(
      currentNodes, // Original nodes (fixed anchors)
      currentEdges, // Original edges
      newNodeIds,
      workingNodes,
      workingEdges
    );

    // Apply computed positions to the working nodes
    workingNodes = workingNodes.map((node) => {
      const pos = positions.get(node.id);
      if (pos) {
        return { ...node, position: pos };
      }
      return node;
    });
  }

  return { nodes: workingNodes, edges: workingEdges, result };
}
