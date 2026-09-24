// Flowboard constants — Node type registry, edge relationships, and defaults.
// All visual differentiation for semantic types is driven from here.

import type { NodeType, EdgeRelationship } from "@/types/semantic";

// ─── Node Type Registry ───────────────────────────────────────────────────────

export interface NodeTypeConfig {
  label: string;
  icon: string;       // Lucide icon name
  color: string;      // Primary accent color
  bgColor: string;    // Light background for the node
  borderColor: string;
  description: string;
}

export const NODE_TYPE_CONFIG: Record<NodeType, NodeTypeConfig> = {
  service: {
    label: "Service",
    icon: "Server",
    color: "#3B82F6",
    bgColor: "#EFF6FF",
    borderColor: "#93C5FD",
    description: "A backend service or microservice",
  },
  database: {
    label: "Database",
    icon: "Database",
    color: "#10B981",
    bgColor: "#ECFDF5",
    borderColor: "#6EE7B7",
    description: "A database or data store",
  },
  api: {
    label: "API",
    icon: "Globe",
    color: "#F59E0B",
    bgColor: "#FFFBEB",
    borderColor: "#FCD34D",
    description: "An API endpoint or external API",
  },
  queue: {
    label: "Queue",
    icon: "ArrowLeftRight",
    color: "#8B5CF6",
    bgColor: "#F5F3FF",
    borderColor: "#C4B5FD",
    description: "A message queue or event bus",
  },
  cache: {
    label: "Cache",
    icon: "Zap",
    color: "#EF4444",
    bgColor: "#FEF2F2",
    borderColor: "#FCA5A5",
    description: "A caching layer",
  },
  gateway: {
    label: "Gateway",
    icon: "Shield",
    color: "#14B8A6",
    bgColor: "#F0FDFA",
    borderColor: "#5EEAD4",
    description: "An API gateway or load balancer",
  },
  client: {
    label: "Client",
    icon: "Monitor",
    color: "#6B7280",
    bgColor: "#F9FAFB",
    borderColor: "#D1D5DB",
    description: "A client application (web, mobile, CLI)",
  },
} as const;

// All available node types as an array (for palette rendering)
export const NODE_TYPES: NodeType[] = [
  "service",
  "database",
  "api",
  "queue",
  "cache",
  "gateway",
  "client",
];

// ─── Edge Relationship Registry ───────────────────────────────────────────────

export interface EdgeRelationshipConfig {
  label: string;
  style: "solid" | "dashed";
  animated: boolean;
  color: string;
}

export const EDGE_RELATIONSHIP_CONFIG: Record<EdgeRelationship, EdgeRelationshipConfig> = {
  connects_to: {
    label: "connects to",
    style: "solid",
    animated: false,
    color: "#6B7280",
  },
  reads_from: {
    label: "reads from",
    style: "solid",
    animated: false,
    color: "#3B82F6",
  },
  writes_to: {
    label: "writes to",
    style: "solid",
    animated: true,
    color: "#10B981",
  },
  publishes_to: {
    label: "publishes to",
    style: "dashed",
    animated: true,
    color: "#8B5CF6",
  },
  subscribes_to: {
    label: "subscribes to",
    style: "dashed",
    animated: true,
    color: "#F59E0B",
  },
} as const;

export const EDGE_RELATIONSHIPS: EdgeRelationship[] = [
  "connects_to",
  "reads_from",
  "writes_to",
  "publishes_to",
  "subscribes_to",
];

// ─── Defaults ─────────────────────────────────────────────────────────────────

export const DEFAULT_NODE_WIDTH = 220;
export const DEFAULT_NODE_HEIGHT = 80;

export const LOCALSTORAGE_KEY = "flowboard:canvas";

export const AUTO_SAVE_DEBOUNCE_MS = 2000;
