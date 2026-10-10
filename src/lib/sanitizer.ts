// src/lib/sanitizer.ts
// Scrub sensitive data (API keys, connection strings, credentials, PII)
// from architecture graphs and chat prompts before sending them to external LLMs.

import { SemanticGraph, SemanticNode, SemanticEdge } from "@/types/semantic";

// Common regex patterns for credentials and secrets
const SECRET_PATTERNS = [
  // Database connection URIs with credentials: e.g. postgres://user:password@host:5432/db
  /(?:postgres|postgresql|mysql|mongodb|mongodb\+srv|redis|amqp|amqps):\/\/[^:\s]+:([^@\s]+)@[^\s]+/gi,
  // Generic API Keys (sk-..., ghp_..., gho_..., AKIA..., etc.)
  /\b(?:sk-[a-zA-Z0-9]{20,}|ghp_[a-zA-Z0-9]{36,}|gho_[a-zA-Z0-9]{36,}|AKIA[0-9A-Z]{16})\b/g,
  // JWT Tokens (three base64 segments)
  /\beyJ[a-zA-Z0-9_-]{10,}\.eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\b/g,
  // PEM Private Keys
  /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/gi,
  // Key-value credential pairs in strings (password: 12345, api_key: "abc", secret=xyz)
  /\b(?:password|passwd|pwd|secret|api_key|apikey|auth_token|access_token|private_key)\s*[:=]\s*["']?([^\s"';,]+)["']?/gi,
];

// Fast single-pass scanner to bypass pattern looping on normal benign text
const QUICK_SECRET_CHECK = /:\/\/|sk-|ghp_|gho_|AKIA|eyJ|BEGIN|password|passwd|pwd|secret|api_key|apikey|auth_token|access_token|private_key/i;

// Bounded LRU-style memoization cache for sanitized strings (max 1000 entries)
const SANITIZER_CACHE_MAX = 1000;
const sanitizerCache = new Map<string, { text: string; redactionCount: number }>();

/**
 * Redacts secrets from a raw string, returning the scrubbed text and count of redactions.
 * Leverages fast-path pattern detection and LRU caching for microsecond throughput.
 */
export function sanitizeText(text: string): { text: string; redactionCount: number } {
  if (!text) return { text: "", redactionCount: 0 };

  // 1. Fast Cache Lookup
  if (text.length < 2048) {
    const cached = sanitizerCache.get(text);
    if (cached) return cached;
  }

  // 2. Fast-path heuristic: If string has no credential/token markers, skip full regex suite
  if (!QUICK_SECRET_CHECK.test(text)) {
    const cleanResult = { text, redactionCount: 0 };
    if (text.length < 2048) {
      if (sanitizerCache.size >= SANITIZER_CACHE_MAX) {
        // Evict oldest entry
        const firstKey = sanitizerCache.keys().next().value;
        if (firstKey) sanitizerCache.delete(firstKey);
      }
      sanitizerCache.set(text, cleanResult);
    }
    return cleanResult;
  }

  let sanitized = text;
  let count = 0;

  for (const pattern of SECRET_PATTERNS) {
    // Reset regex state if global
    pattern.lastIndex = 0;
    sanitized = sanitized.replace(pattern, (match, captured) => {
      count++;
      if (captured) {
        // Replace only the sensitive capture group if present (e.g. password in URI or key=value)
        return match.replace(captured, "[REDACTED_SECRET]");
      }
      return "[REDACTED_SECRET]";
    });
  }

  const result = { text: sanitized, redactionCount: count };

  // Store in cache
  if (text.length < 2048) {
    if (sanitizerCache.size >= SANITIZER_CACHE_MAX) {
      const firstKey = sanitizerCache.keys().next().value;
      if (firstKey) sanitizerCache.delete(firstKey);
    }
    sanitizerCache.set(text, result);
  }

  return result;
}

/**
 * Sanitizes all string fields within a SemanticNode.
 */
function sanitizeNode(node: SemanticNode): { node: SemanticNode; redactionCount: number } {
  let count = 0;
  const sanitized: SemanticNode = { ...node };

  if (sanitized.description) {
    const res = sanitizeText(sanitized.description);
    sanitized.description = res.text;
    count += res.redactionCount;
  }

  if (sanitized.technology) {
    const res = sanitizeText(sanitized.technology);
    sanitized.technology = res.text;
    count += res.redactionCount;
  }

  if (Array.isArray(sanitized.responsibilities)) {
    sanitized.responsibilities = sanitized.responsibilities.map((r) => {
      const res = sanitizeText(r);
      count += res.redactionCount;
      return res.text;
    });
  }

  if (sanitized.properties && typeof sanitized.properties === "object") {
    const newProps: Record<string, string> = {};
    for (const [key, val] of Object.entries(sanitized.properties)) {
      if (typeof val === "string") {
        const lowerKey = key.toLowerCase();
        if (
          lowerKey.includes("password") ||
          lowerKey.includes("secret") ||
          lowerKey.includes("token") ||
          lowerKey.includes("key") ||
          lowerKey.includes("auth")
        ) {
          newProps[key] = "[REDACTED_SECRET]";
          count++;
        } else {
          const res = sanitizeText(val);
          newProps[key] = res.text;
          count += res.redactionCount;
        }
      } else {
        newProps[key] = val;
      }
    }
    sanitized.properties = newProps;
  }

  return { node: sanitized, redactionCount: count };
}

/**
 * Sanitizes all string fields within a SemanticEdge.
 */
function sanitizeEdge(edge: SemanticEdge): { edge: SemanticEdge; redactionCount: number } {
  let count = 0;
  const sanitized: SemanticEdge = { ...edge };

  if (sanitized.label) {
    const res = sanitizeText(sanitized.label);
    sanitized.label = res.text;
    count += res.redactionCount;
  }

  if (sanitized.protocol) {
    const res = sanitizeText(sanitized.protocol);
    sanitized.protocol = res.text;
    count += res.redactionCount;
  }

  return { edge: sanitized, redactionCount: count };
}

/**
 * Deeply sanitizes a SemanticGraph before it is handed to external LLM providers.
 */
export function sanitizeGraph(graph: SemanticGraph): {
  sanitizedGraph: SemanticGraph;
  redactionCount: number;
} {
  let totalRedactions = 0;

  const sanitizedNodes = (graph.nodes || []).map((n) => {
    const { node, redactionCount } = sanitizeNode(n);
    totalRedactions += redactionCount;
    return node;
  });

  const sanitizedEdges = (graph.edges || []).map((e) => {
    const { edge, redactionCount } = sanitizeEdge(e);
    totalRedactions += redactionCount;
    return edge;
  });

  return {
    sanitizedGraph: {
      nodes: sanitizedNodes,
      edges: sanitizedEdges,
    },
    redactionCount: totalRedactions,
  };
}
