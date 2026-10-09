// src/engine/gitDiff.ts
// Architecture-as-Code (AaC) specification serializer and PR diff generator.
// Computes semantic architecture diffs between git branches/commits
// and formats Markdown summaries for GitHub Pull Requests.

import { SemanticGraph, SemanticNode, SemanticEdge } from "@/types/semantic";
import { SemanticNodeSchema } from "@/schemas/semanticNode";
import { SemanticEdgeSchema } from "@/schemas/semanticEdge";
import { z } from "zod";

export interface NodeDiff {
  type: "added" | "removed" | "modified";
  node: SemanticNode;
  changes?: Record<string, { from: unknown; to: unknown }>;
}

export interface EdgeDiff {
  type: "added" | "removed";
  edge: SemanticEdge;
}

export interface ArchitectureDiffResult {
  hasChanges: boolean;
  nodeDiffs: NodeDiff[];
  edgeDiffs: EdgeDiff[];
  summary: {
    nodesAdded: number;
    nodesRemoved: number;
    nodesModified: number;
    edgesAdded: number;
    edgesRemoved: number;
  };
}

const FlowboardSpecSchema = z.object({
  version: z.number().default(1),
  generator: z.string().default("Flowboard"),
  updatedAt: z.string(),
  architecture: z.object({
    nodes: z.array(SemanticNodeSchema),
    edges: z.array(SemanticEdgeSchema),
  }),
});

/**
 * Serializes a SemanticGraph into the standardized .flowboard/architecture.json format.
 */
export function serializeArchitectureSpec(
  graph: SemanticGraph,
  version: number = 1
): string {
  const spec = {
    version,
    generator: "Flowboard — AI Architecture Compiler",
    updatedAt: new Date().toISOString(),
    architecture: {
      nodes: [...graph.nodes].sort((a, b) => a.id.localeCompare(b.id)),
      edges: [...graph.edges].sort((a, b) => a.id.localeCompare(b.id)),
    },
  };

  return JSON.stringify(spec, null, 2);
}

/**
 * Parses and validates a .flowboard/architecture.json file into a SemanticGraph.
 */
export function parseArchitectureSpec(rawJson: string): SemanticGraph {
  const parsed = JSON.parse(rawJson);
  const validated = FlowboardSpecSchema.safeParse(parsed);

  if (validated.success) {
    return validated.data.architecture;
  }

  // Fallback: If raw object is directly { nodes, edges }
  const directSchema = z.object({
    nodes: z.array(SemanticNodeSchema),
    edges: z.array(SemanticEdgeSchema),
  });

  const directResult = directSchema.parse(parsed);
  return directResult;
}

/**
 * Computes semantic differences between two architecture graphs.
 */
export function calculateArchitectureDiff(
  baseGraph: SemanticGraph,
  headGraph: SemanticGraph
): ArchitectureDiffResult {
  const baseNodes = new Map<string, SemanticNode>(baseGraph.nodes.map((n) => [n.id, n]));
  const headNodes = new Map<string, SemanticNode>(headGraph.nodes.map((n) => [n.id, n]));

  const baseEdges = new Map<string, SemanticEdge>(baseGraph.edges.map((e) => [e.id, e]));
  const headEdges = new Map<string, SemanticEdge>(headGraph.edges.map((e) => [e.id, e]));

  const nodeDiffs: NodeDiff[] = [];
  const edgeDiffs: EdgeDiff[] = [];

  // 1. Detect added & modified nodes
  for (const [id, headNode] of headNodes) {
    if (!baseNodes.has(id)) {
      nodeDiffs.push({ type: "added", node: headNode });
    } else {
      const baseNode = baseNodes.get(id)!;
      const changes: Record<string, { from: unknown; to: unknown }> = {};

      if (baseNode.name !== headNode.name) {
        changes.name = { from: baseNode.name, to: headNode.name };
      }
      if (baseNode.type !== headNode.type) {
        changes.type = { from: baseNode.type, to: headNode.type };
      }
      if (baseNode.technology !== headNode.technology) {
        changes.technology = { from: baseNode.technology, to: headNode.technology };
      }

      if (Object.keys(changes).length > 0) {
        nodeDiffs.push({ type: "modified", node: headNode, changes });
      }
    }
  }

  // 2. Detect removed nodes
  for (const [id, baseNode] of baseNodes) {
    if (!headNodes.has(id)) {
      nodeDiffs.push({ type: "removed", node: baseNode });
    }
  }

  // 3. Detect added edges
  for (const [id, headEdge] of headEdges) {
    if (!baseEdges.has(id)) {
      edgeDiffs.push({ type: "added", edge: headEdge });
    }
  }

  // 4. Detect removed edges
  for (const [id, baseEdge] of baseEdges) {
    if (!headEdges.has(id)) {
      edgeDiffs.push({ type: "removed", edge: baseEdge });
    }
  }

  const nodesAdded = nodeDiffs.filter((d) => d.type === "added").length;
  const nodesRemoved = nodeDiffs.filter((d) => d.type === "removed").length;
  const nodesModified = nodeDiffs.filter((d) => d.type === "modified").length;
  const edgesAdded = edgeDiffs.filter((d) => d.type === "added").length;
  const edgesRemoved = edgeDiffs.filter((d) => d.type === "removed").length;

  const hasChanges =
    nodesAdded > 0 ||
    nodesRemoved > 0 ||
    nodesModified > 0 ||
    edgesAdded > 0 ||
    edgesRemoved > 0;

  return {
    hasChanges,
    nodeDiffs,
    edgeDiffs,
    summary: {
      nodesAdded,
      nodesRemoved,
      nodesModified,
      edgesAdded,
      edgesRemoved,
    },
  };
}

/**
 * Formats an ArchitectureDiffResult into a GitHub Flavored Markdown summary for Pull Requests.
 */
export function generateArchitectureDiffMarkdown(
  diff: ArchitectureDiffResult,
  options?: { boardName?: string }
): string {
  const { summary, nodeDiffs, edgeDiffs } = diff;
  const boardTitle = options?.boardName || "Flowboard Architecture";

  if (!diff.hasChanges) {
    return `### 🏗️ ${boardTitle} Review\n\nNo structural changes detected between this revision and the target branch.`;
  }

  let md = `## 🏗️ ${boardTitle} — Pull Request Architecture Diff\n\n`;
  md += `> Machine-generated architecture review powered by **Flowboard**.\n\n`;

  // Summary Table
  md += `| Category | ➕ Added | ✏️ Modified | ❌ Removed |\n`;
  md += `| :--- | :---: | :---: | :---: |\n`;
  md += `| **Components (Nodes)** | ${summary.nodesAdded} | ${summary.nodesModified} | ${summary.nodesRemoved} |\n`;
  md += `| **Connections (Edges)** | ${summary.edgesAdded} | — | ${summary.edgesRemoved} |\n\n`;

  // Added Nodes
  const addedNodes = nodeDiffs.filter((d) => d.type === "added");
  if (addedNodes.length > 0) {
    md += `### ➕ Added Components\n`;
    for (const d of addedNodes) {
      const tech = d.node.technology ? ` (\`${d.node.technology}\`)` : "";
      md += `- **${d.node.name}** — \`${d.node.type}\`${tech}\n`;
    }
    md += `\n`;
  }

  // Modified Nodes
  const modifiedNodes = nodeDiffs.filter((d) => d.type === "modified");
  if (modifiedNodes.length > 0) {
    md += `### ✏️ Modified Components\n`;
    for (const d of modifiedNodes) {
      md += `- **${d.node.name}**:\n`;
      if (d.changes) {
        for (const [field, delta] of Object.entries(d.changes)) {
          md += `  - \`${field}\`: \`${String(delta.from || "none")}\` ➔ \`${String(delta.to || "none")}\`\n`;
        }
      }
    }
    md += `\n`;
  }

  // Removed Nodes
  const removedNodes = nodeDiffs.filter((d) => d.type === "removed");
  if (removedNodes.length > 0) {
    md += `### ❌ Removed Components\n`;
    for (const d of removedNodes) {
      md += `- ~${d.node.name}~ (\`${d.node.type}\`)\n`;
    }
    md += `\n`;
  }

  // Connection Edges
  if (edgeDiffs.length > 0) {
    md += `### 🔗 Connection Changes\n`;
    for (const e of edgeDiffs) {
      const symbol = e.type === "added" ? "➕" : "❌";
      md += `- ${symbol} \`${e.edge.source}\` ➔ \`${e.edge.relationship}\` ➔ \`${e.edge.target}\`\n`;
    }
    md += `\n`;
  }

  md += `---\n*Automated review generated from \`.flowboard/architecture.json\`.*`;
  return md;
}
