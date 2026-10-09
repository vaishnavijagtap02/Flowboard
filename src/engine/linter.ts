// src/engine/linter.ts
// Deterministic Architecture Linter and Health Analyzer.
// Statically inspects the semantic graph for distributed system antipatterns,
// security tier breaches, synchronous deadlocks, and SPOFs.

import { SemanticGraph, SemanticNode, SemanticEdge } from "@/types/semantic";

export type IssueSeverity = "error" | "warning" | "info";

export interface ArchitectureIssue {
  id: string;
  code: string;
  title: string;
  message: string;
  severity: IssueSeverity;
  affectedNodeIds: string[];
  affectedEdgeIds?: string[];
  recommendation: string;
}

export interface ArchitectureReport {
  score: number; // 0 - 100
  summary: {
    totalComponents: number;
    totalConnections: number;
    errorsCount: number;
    warningsCount: number;
    infosCount: number;
  };
  issues: ArchitectureIssue[];
  passedChecks: string[];
}

/**
 * Detects cycles in synchronous call paths ("connects_to") using DFS.
 */
function detectSynchronousCycles(graph: SemanticGraph): ArchitectureIssue[] {
  const issues: ArchitectureIssue[] = [];
  const syncEdges = graph.edges.filter((e) => e.relationship === "connects_to");

  const adj = new Map<string, Array<{ target: string; edgeId: string }>>();
  for (const edge of syncEdges) {
    if (!adj.has(edge.source)) adj.set(edge.source, []);
    adj.get(edge.source)!.push({ target: edge.target, edgeId: edge.id });
  }

  const visited = new Set<string>();
  const recStack = new Set<string>();
  const path: string[] = [];
  const edgePath: string[] = [];

  function dfs(u: string): boolean {
    visited.add(u);
    recStack.add(u);
    path.push(u);

    const neighbors = adj.get(u) || [];
    for (const { target, edgeId } of neighbors) {
      edgePath.push(edgeId);

      if (!visited.has(target)) {
        if (dfs(target)) return true;
      } else if (recStack.has(target)) {
        // Cycle detected
        const cycleStartIndex = path.indexOf(target);
        const cycleNodes = path.slice(cycleStartIndex);
        cycleNodes.push(target);

        issues.push({
          id: `cycle-${u}-${target}`,
          code: "SYNC_CALL_CYCLE",
          title: "Circular Synchronous Dependency",
          message: `Synchronous cycle detected: ${cycleNodes.join(" ➔ ")}. This can lead to distributed deadlocks and cascading timeouts.`,
          severity: "error",
          affectedNodeIds: Array.from(new Set(cycleNodes)),
          affectedEdgeIds: [...edgePath],
          recommendation: "Decouple synchronous cycles using an asynchronous message queue or event bus.",
        });
        return true;
      }

      edgePath.pop();
    }

    recStack.delete(u);
    path.pop();
    return false;
  }

  for (const node of graph.nodes) {
    if (!visited.has(node.id)) {
      dfs(node.id);
    }
  }

  return issues;
}

/**
 * Checks tier boundary rules (Security and Network Ingress).
 */
function checkTierBoundaries(graph: SemanticGraph): ArchitectureIssue[] {
  const issues: ArchitectureIssue[] = [];
  const nodeMap = new Map<string, SemanticNode>(graph.nodes.map((n) => [n.id, n]));

  for (const edge of graph.edges) {
    const source = nodeMap.get(edge.source);
    const target = nodeMap.get(edge.target);
    if (!source || !target) continue;

    // Rule 1: Client cannot connect directly to Database
    if (source.type === "client" && target.type === "database") {
      issues.push({
        id: `tier-client-db-${edge.id}`,
        code: "CLIENT_DIRECT_DATABASE_ACCESS",
        title: "Client Directly Accessing Database",
        message: `Client "${source.name}" is directly connected to Database "${target.name}". This exposes internal database ports to public clients.`,
        severity: "error",
        affectedNodeIds: [source.id, target.id],
        affectedEdgeIds: [edge.id],
        recommendation: `Route client requests through an API Gateway or Backend Service (e.g., Client ➔ Gateway ➔ Service ➔ Database).`,
      });
    }

    // Rule 2: Client directly connected to Queue or Cache
    if (source.type === "client" && (target.type === "queue" || target.type === "cache")) {
      issues.push({
        id: `tier-client-infra-${edge.id}`,
        code: "CLIENT_DIRECT_INFRA_ACCESS",
        title: "Client Directly Accessing Internal Infrastructure",
        message: `Client "${source.name}" is directly connected to internal ${target.type} "${target.name}".`,
        severity: "warning",
        affectedNodeIds: [source.id, target.id],
        affectedEdgeIds: [edge.id],
        recommendation: `Place an API Gateway or Service in front of the ${target.type}.`,
      });
    }

    // Rule 3: Direct DB to DB connection
    if (source.type === "database" && target.type === "database" && edge.relationship === "connects_to") {
      issues.push({
        id: `tier-db-db-${edge.id}`,
        code: "DATABASE_CROSS_DEPENDENCY",
        title: "Direct Cross-Database Coupling",
        message: `Database "${source.name}" directly communicates with Database "${target.name}".`,
        severity: "warning",
        affectedNodeIds: [source.id, target.id],
        affectedEdgeIds: [edge.id],
        recommendation: "Manage cross-database sync via CDC (Change Data Capture) or an event-driven service.",
      });
    }
  }

  return issues;
}

/**
 * Checks for Single Points of Failure (SPOF) and isolated/orphan nodes.
 */
function checkResilienceAndTopology(graph: SemanticGraph): ArchitectureIssue[] {
  const issues: ArchitectureIssue[] = [];
  const incoming = new Map<string, number>();
  const outgoing = new Map<string, number>();

  for (const node of graph.nodes) {
    incoming.set(node.id, 0);
    outgoing.set(node.id, 0);
  }

  for (const edge of graph.edges) {
    incoming.set(edge.target, (incoming.get(edge.target) || 0) + 1);
    outgoing.set(edge.source, (outgoing.get(edge.source) || 0) + 1);
  }

  for (const node of graph.nodes) {
    const inCount = incoming.get(node.id) || 0;
    const outCount = outgoing.get(node.id) || 0;

    // Check for Orphan Nodes
    if (inCount === 0 && outCount === 0 && graph.nodes.length > 1) {
      issues.push({
        id: `orphan-${node.id}`,
        code: "ORPHAN_COMPONENT",
        title: "Orphaned Component",
        message: `Component "${node.name}" (${node.type}) has no incoming or outgoing connections.`,
        severity: "info",
        affectedNodeIds: [node.id],
        recommendation: "Connect this component to the system architecture or remove it if unused.",
      });
    }

    // Check for high-traffic bottleneck SPOF
    if (node.type === "database" && inCount >= 4) {
      issues.push({
        id: `spof-db-${node.id}`,
        code: "DATABASE_CONCURRENCY_BOTTLENECK",
        title: "Potential Database Bottleneck",
        message: `Database "${node.name}" has ${inCount} services connecting to it without a caching layer.`,
        severity: "warning",
        affectedNodeIds: [node.id],
        recommendation: "Introduce a Redis or Memcached cache or read replicas to relieve database contention.",
      });
    }

    // Check for queue with no consumers
    if (node.type === "queue" && outCount === 0 && inCount > 0) {
      issues.push({
        id: `queue-no-consumer-${node.id}`,
        code: "QUEUE_WITHOUT_CONSUMER",
        title: "Queue Without Consumer",
        message: `Message Queue "${node.name}" has producers writing to it, but no consumers subscribed to process messages.`,
        severity: "error",
        affectedNodeIds: [node.id],
        recommendation: "Attach a subscriber service with a 'subscribes_to' relationship to process queue messages.",
      });
    }
  }

  return issues;
}

/**
 * Main Architecture Linter entry point.
 * Performs all static analysis checks and returns a calculated health score and report.
 */
export function lintArchitecture(graph: SemanticGraph): ArchitectureReport {
  const issues: ArchitectureIssue[] = [];
  const passedChecks: string[] = [];

  // Check 1: Synchronous cycle detection
  const cycleIssues = detectSynchronousCycles(graph);
  if (cycleIssues.length === 0) {
    passedChecks.push("No synchronous call cycles or distributed deadlocks detected");
  } else {
    issues.push(...cycleIssues);
  }

  // Check 2: Tier boundaries
  const tierIssues = checkTierBoundaries(graph);
  if (tierIssues.length === 0) {
    passedChecks.push("Network tier boundaries and ingress security respected");
  } else {
    issues.push(...tierIssues);
  }

  // Check 3: Topology & SPOF checks
  const topologyIssues = checkResilienceAndTopology(graph);
  issues.push(...topologyIssues);

  const errorsCount = issues.filter((i) => i.severity === "error").length;
  const warningsCount = issues.filter((i) => i.severity === "warning").length;
  const infosCount = issues.filter((i) => i.severity === "info").length;

  // Calculate Health Score (100 base)
  let calculatedScore = 100 - errorsCount * 25 - warningsCount * 10 - infosCount * 2;
  calculatedScore = Math.max(0, Math.min(100, calculatedScore));

  return {
    score: calculatedScore,
    summary: {
      totalComponents: graph.nodes.length,
      totalConnections: graph.edges.length,
      errorsCount,
      warningsCount,
      infosCount,
    },
    issues,
    passedChecks,
  };
}
