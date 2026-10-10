// Flowboard constants — Node type registry, edge relationships, and defaults.
// All visual differentiation for semantic types is driven from here.

import type { NodeType, EdgeRelationship } from "@/types/semantic";

// ─── Node Type Registry ───────────────────────────────────────────────────────

export interface NodeTypeConfig {
  label: string;
  category: "compute" | "data" | "networking" | "messaging" | "client";
  icon: string;       // Lucide icon name
  color: string;      // Primary accent color
  bgColor: string;    // Light background for fallback
  borderColor: string;
  darkBg: string;     // Premium dark card surface
  glowColor: string;
  shortcut: string;   // Keyboard shortcut hint
  description: string;
  defaultTech: string[];
}

export const NODE_TYPE_CONFIG: Record<NodeType, NodeTypeConfig> = {
  service: {
    label: "Service",
    category: "compute",
    icon: "Server",
    color: "#0284C7",
    bgColor: "#FFFFFF",
    borderColor: "rgba(2, 132, 199, 0.3)",
    darkBg: "#101A29",
    glowColor: "rgba(2, 132, 199, 0.2)",
    shortcut: "S",
    description: "A backend service, microservice, or worker",
    defaultTech: ["Node.js", "Go", "FastAPI", "Rust", "Spring Boot", "Next.js"],
  },
  database: {
    label: "Database",
    category: "data",
    icon: "Database",
    color: "#2563EB",
    bgColor: "#FFFFFF",
    borderColor: "rgba(37, 99, 235, 0.3)",
    darkBg: "#0F1829",
    glowColor: "rgba(37, 99, 235, 0.2)",
    shortcut: "D",
    description: "A relational database, document store, or data warehouse",
    defaultTech: ["PostgreSQL", "MySQL", "MongoDB", "ClickHouse", "DynamoDB"],
  },
  api: {
    label: "API Endpoint",
    category: "networking",
    icon: "Globe",
    color: "#06B6D4",
    bgColor: "#FFFFFF",
    borderColor: "rgba(6, 182, 212, 0.3)",
    darkBg: "#0E1B2B",
    glowColor: "rgba(6, 182, 212, 0.2)",
    shortcut: "A",
    description: "An external or internal HTTP / gRPC API boundary",
    defaultTech: ["REST", "GraphQL", "gRPC", "tRPC", "WebSocket"],
  },
  queue: {
    label: "Queue / Bus",
    category: "messaging",
    icon: "ArrowLeftRight",
    color: "#6366F1",
    bgColor: "#FFFFFF",
    borderColor: "rgba(99, 102, 241, 0.3)",
    darkBg: "#12172D",
    glowColor: "rgba(99, 102, 241, 0.2)",
    shortcut: "Q",
    description: "A message broker, stream, or event bus",
    defaultTech: ["Kafka", "RabbitMQ", "AWS SQS", "NATS", "Redis Streams"],
  },
  cache: {
    label: "Cache",
    category: "data",
    icon: "Zap",
    color: "#D97706",
    bgColor: "#FFFFFF",
    borderColor: "rgba(217, 119, 6, 0.3)",
    darkBg: "#1E1A14",
    glowColor: "rgba(217, 119, 6, 0.2)",
    shortcut: "C",
    description: "An in-memory caching layer or key-value store",
    defaultTech: ["Redis", "Memcached", "Dragonfly", "Upstash"],
  },
  gateway: {
    label: "API Gateway",
    category: "networking",
    icon: "Shield",
    color: "#0D9488",
    bgColor: "#FFFFFF",
    borderColor: "rgba(13, 148, 136, 0.3)",
    darkBg: "#0D1C22",
    glowColor: "rgba(13, 148, 136, 0.2)",
    shortcut: "G",
    description: "An ingress gateway, reverse proxy, or load balancer",
    defaultTech: ["Kong", "Envoy", "Traefik", "NGINX", "Cloudflare"],
  },
  client: {
    label: "Client App",
    category: "client",
    icon: "Monitor",
    color: "#38BDF8",
    bgColor: "#FFFFFF",
    borderColor: "rgba(56, 189, 248, 0.3)",
    darkBg: "#0E1C2B",
    glowColor: "rgba(56, 189, 248, 0.2)",
    shortcut: "W",
    description: "A client application (web app, mobile app, CLI)",
    defaultTech: ["React / Web", "iOS / Android", "CLI Tool", "Electron"],
  },
} as const;

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
    color: "#0284C7",
  },
  reads_from: {
    label: "reads from",
    style: "solid",
    animated: false,
    color: "#38BDF8",
  },
  writes_to: {
    label: "writes to",
    style: "solid",
    animated: true,
    color: "#2563EB",
  },
  publishes_to: {
    label: "publishes to",
    style: "dashed",
    animated: true,
    color: "#6366F1",
  },
  subscribes_to: {
    label: "subscribes to",
    style: "dashed",
    animated: true,
    color: "#06B6D4",
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
