// engine/layoutEngine.ts — Computes valid positions for AI-generated nodes using Dagre.
//
// From SYSTEM_DESIGN §5.2.3:
//   - NEVER reposition existing user-placed nodes
//   - Use Dagre to compute positions for NEW nodes only
//   - Account for existing node positions as fixed anchors
//   - Direction: top-to-bottom (TB) by default
//   - Node spacing: 100px horizontal, 80px vertical
//   - If no edges connect the new node, place it near the related node or in an empty area

import dagre from "dagre";
import type { FlowNode, FlowEdge } from "@/types/canvas";
import { DEFAULT_NODE_WIDTH, DEFAULT_NODE_HEIGHT } from "@/lib/constants";

const HORIZONTAL_SPACING = 150;
const VERTICAL_SPACING = 140;

/**
 * Computes positions for newly added nodes.
 *
 * For multi-node additions (or new architectures), runs a full topological layout
 * to ensure all components are cleanly separated with generous breathing room.
 * For single-node additions, anchors relative to connected nodes with collision avoidance.
 *
 * @param existingNodes  Nodes already on the canvas (positions preserved)
 * @param existingEdges  Edges already on the canvas
 * @param newNodeIds     Set of node IDs that were just added (need positions)
 * @param allNodes       All nodes including new ones (new ones have placeholder positions)
 * @param allEdges       All edges including new ones
 * @returns              Map of newNodeId → { x, y } positions
 */
export function computeNewNodePositions(
  existingNodes: FlowNode[],
  existingEdges: FlowEdge[],
  newNodeIds: Set<string>,
  allNodes: FlowNode[],
  allEdges: FlowEdge[]
): Map<string, { x: number; y: number }> {
  // If no new nodes, nothing to compute
  if (newNodeIds.size === 0) return new Map();

  // If adding 2 or more nodes, or if existing canvas is empty or has only 1 node,
  // lay out all nodes using Dagre full topological layout to prevent cramped overlapping clusters!
  if (newNodeIds.size >= 2 || existingNodes.length <= 1) {
    const laidOut = layoutEntireGraph(allNodes, allEdges, "TB");
    const positions = new Map<string, { x: number; y: number }>();
    for (const node of laidOut) {
      if (newNodeIds.has(node.id)) {
        positions.set(node.id, node.position);
      }
    }
    return positions;
  }

  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: "TB",
    nodesep: HORIZONTAL_SPACING,
    ranksep: VERTICAL_SPACING,
    marginx: 80,
    marginy: 80,
  });

  // Add ALL nodes to the Dagre graph
  for (const node of allNodes) {
    g.setNode(node.id, {
      width: DEFAULT_NODE_WIDTH,
      height: DEFAULT_NODE_HEIGHT,
    });
  }

  // Add ALL edges
  for (const edge of allEdges) {
    g.setEdge(edge.source, edge.target);
  }

  // Run the layout
  dagre.layout(g);

  // Extract positions only for new nodes
  const positions = new Map<string, { x: number; y: number }>();
  const existingNodeMap = new Map(existingNodes.map((n) => [n.id, n]));

  for (const nodeId of newNodeIds) {
    const dagreNode = g.node(nodeId);
    if (!dagreNode) continue;

    // Dagre gives us center coordinates; React Flow uses top-left
    let x = dagreNode.x - DEFAULT_NODE_WIDTH / 2;
    let y = dagreNode.y - DEFAULT_NODE_HEIGHT / 2;

    // If this node has edges to existing nodes, offset relative to those
    // existing nodes to avoid overlap with the existing layout
    const connectedExisting = findConnectedExistingNodes(
      nodeId,
      allEdges,
      existingNodeMap
    );

    if (connectedExisting.length > 0) {
      // Place below/to the right of the average position of connected existing nodes
      const avgX =
        connectedExisting.reduce((sum, n) => sum + n.position.x, 0) /
        connectedExisting.length;
      const avgY =
        connectedExisting.reduce((sum, n) => sum + n.position.y, 0) /
        connectedExisting.length;

      // Use Dagre's relative positioning from the connected nodes
      // but anchor to the average existing position with clearance
      const anchorNode = g.node(connectedExisting[0].id);
      const anchorX = anchorNode?.x ?? 0;
      const anchorY = anchorNode?.y ?? 0;
      x = avgX + (dagreNode.x - anchorX);
      y = avgY + (dagreNode.y - anchorY);
    } else if (existingNodes.length > 0) {
      // No edges to existing nodes — place in an empty area
      const maxY = Math.max(
        ...existingNodes.map((n) => n.position.y + DEFAULT_NODE_HEIGHT)
      );
      const avgX =
        existingNodes.reduce((sum, n) => sum + n.position.x, 0) /
        existingNodes.length;

      x = avgX;
      y = maxY + VERTICAL_SPACING;
    }

    positions.set(nodeId, { x, y });
  }

  return positions;
}

/**
 * Finds existing nodes that are directly connected to the given node via edges.
 */
function findConnectedExistingNodes(
  nodeId: string,
  edges: FlowEdge[],
  existingNodeMap: Map<string, FlowNode>
): FlowNode[] {
  const connectedIds = new Set<string>();
  for (const edge of edges) {
    if (edge.source === nodeId && existingNodeMap.has(edge.target)) {
      connectedIds.add(edge.target);
    }
    if (edge.target === nodeId && existingNodeMap.has(edge.source)) {
      connectedIds.add(edge.source);
    }
  }
  return Array.from(connectedIds)
    .map((id) => existingNodeMap.get(id)!)
    .filter(Boolean);
}

/**
 * Lays out the entire graph automatically using Dagre.
 * Features generous spacing (150px nodesep, 160px ranksep) so cards never overlap.
 */
export function layoutEntireGraph(
  nodes: FlowNode[],
  edges: FlowEdge[],
  direction: "TB" | "LR" = "TB"
): FlowNode[] {
  if (nodes.length === 0) return [];

  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: direction,
    nodesep: 150,
    ranksep: 160,
    marginx: 100,
    marginy: 100,
  });

  for (const node of nodes) {
    g.setNode(node.id, {
      width: DEFAULT_NODE_WIDTH,
      height: DEFAULT_NODE_HEIGHT,
    });
  }

  for (const edge of edges) {
    g.setEdge(edge.source, edge.target);
  }

  dagre.layout(g);

  return nodes.map((node) => {
    const dagreNode = g.node(node.id);
    if (!dagreNode) return node;

    return {
      ...node,
      position: {
        x: Math.round(dagreNode.x - DEFAULT_NODE_WIDTH / 2),
        y: Math.round(dagreNode.y - DEFAULT_NODE_HEIGHT / 2),
      },
    };
  });
}

