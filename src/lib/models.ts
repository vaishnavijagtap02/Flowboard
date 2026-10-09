// src/lib/models.ts
// Multi-model routing, tier resolution, and LLM configuration.

import { openai } from "@ai-sdk/openai";

export type ModelTier = "fast" | "standard" | "reasoning";

export interface ModelConfig {
  name: string;
  temperature: number;
  maxTokens?: number;
}

export const MODEL_PROFILES: Record<ModelTier, ModelConfig> = {
  fast: {
    name: "gpt-4o-mini",
    temperature: 0.1,
    maxTokens: 1500,
  },
  standard: {
    name: "gpt-4o",
    temperature: 0.2,
    maxTokens: 3000,
  },
  reasoning: {
    name: "o3-mini",
    temperature: 1, // Reasoning models manage internal temperature or use 1
    maxTokens: 5000,
  },
};

/**
 * Automatically infers the most cost-effective and appropriate model tier
 * based on query keywords and architectural complexity.
 */
export function inferModelTier(userPrompt: string, nodeCount: number): ModelTier {
  const lower = userPrompt.toLowerCase();

  // High complexity keywords requiring deep architectural reasoning
  if (
    lower.includes("security audit") ||
    lower.includes("failover") ||
    lower.includes("distributed") ||
    lower.includes("rearchitect") ||
    lower.includes("high availability") ||
    lower.includes("disaster recovery") ||
    lower.includes("spof")
  ) {
    return "reasoning";
  }

  // Simple edits / quick actions can use lightweight fast model
  if (
    (lower.startsWith("add ") || lower.startsWith("rename ") || lower.startsWith("delete ")) &&
    nodeCount < 15
  ) {
    return "fast";
  }

  // Default to standard model
  return "standard";
}

/**
 * Returns the Vercel AI SDK language model instance for the given tier.
 */
export function getModelForTier(tier: ModelTier = "standard") {
  const profile = MODEL_PROFILES[tier] || MODEL_PROFILES.standard;
  return openai(profile.name);
}
