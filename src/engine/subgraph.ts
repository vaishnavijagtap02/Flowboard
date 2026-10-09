// src/engine/subgraph.ts
// Graph scoping and delta utilities for token-efficient LLM interactions.
// Computes deterministic graph hashes and extracts k-hop subgraphs around focal nodes.

import { SemanticGraph, SemanticNode, SemanticEdge } from "@/types/semantic";

/**
 * Computes a fast deterministic FNV-1a / DJB2-based hash of a semantic graph string
 * to detect state changes and enable prompt caching.
 */
export function computeGraphHash(graph: SemanticGraph): string {
  const normalized = JSON.stringify({
    nodes: [...graph.nodes].sort((a, b) => a.id.localeCompare(b.id)),
    edges: [...graph.edges].sort((a, b) => a.id.localeCompare(b.id)),
  });

  let hash = 2166136261;
  for (let i = 0; i < normalized.length; i++) {
    hash ^= normalized.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
}

/**
 * Finds focal node IDs mentioned in a natural language prompt or query.
 */
export function findFocalNodes(query: string, graph: SemanticGraph): string[] {
  const lowerQuery = query.toLowerCase();
  const matchedIds = new Set<string>();

  for (const node of graph.nodes) {
    const idLower = node.id.toLowerCase();
    const nameLower = node.name.toLowerCase();

    if (lowerQuery.includes(idLower) || lowerQuery.includes(nameLower)) {
      matchedIds.add(node.id);
      continue;
    }

    if (node.technology && lowerQuery.includes(node.technology.toLowerCase())) {
      matchedIds.add(node.id);
      continue;
    }
  }

  return Array.from(matchedIds);
}

/**
 * Extracts a k-hop neighborhood subgraph centered around focalNodeIds.
 * When a user asks about a specific service, this prunes distant unrelated nodes,
 * drastically reducing tokens and preventing LLM hallucination on unrelated components.
 *
 * @param graph The full semantic graph
 * @param focalNodeIds Array of node IDs to anchor the subgraph
 * @param hops Neighborhood radius (default 1 hop)
 */
export function extractSubgraph(
  graph: SemanticGraph,
  focalNodeIds: string[],
  hops: number = 1
): { subgraph: SemanticGraph; tokenReductionRatio: number } {
  if (!focalNodeIds || focalNodeIds.length === 0 || graph.nodes.length <= 10) {
    // If graph is small or no specific focal nodes identified, keep the full graph
    return { subgraph: graph, tokenReductionRatio: 0 };
  }

  const includedNodeIds = new Set<string>(focalNodeIds);
  let currentFrontier = new Set<string>(focalNodeIds);

  // Traverse outward by `hops`
  for (let h = 0; h < hops; h++) {
    const nextFrontier = new Set<string>();

    for (const edge of graph.edges) {
      if (currentFrontier.has(edge.source) && !includedNodeIds.has(edge.target)) {
        includedNodeIds.add(edge.target);
        nextFrontier.add(edge.target);
      }
      if (currentFrontier.has(edge.target) && !includedNodeIds.has(edge.source)) {
        includedNodeIds.add(edge.source);
        nextFrontier.add(edge.source);
      }
    }

    currentFrontier = nextFrontier;
    if (currentFrontier.size === 0) break;
  }

  const filteredNodes = graph.nodes.filter((n) => includedNodeIds.has(n.id));
  const filteredEdges = graph.edges.filter(
    (e) => includedNodeIds.has(e.source) && includedNodeIds.has(e.target)
  );

  const originalTokensEst = JSON.stringify(graph).length;
  const prunedTokensEst = JSON.stringify({ nodes: filteredNodes, edges: filteredEdges }).length;
  const reductionRatio = originalTokensEst > 0 ? (originalTokensEst - prunedTokensEst) / originalTokensEst : 0;

  return {
    subgraph: {
      nodes: filteredNodes,
      edges: filteredEdges,
    },
    tokenReductionRatio: Math.max(0, reductionRatio),
  };
}
