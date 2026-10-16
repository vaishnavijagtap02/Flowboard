// src/lib/models.ts
// Multi-model routing, tier resolution, and LLM configuration (supporting Gemini and OpenAI).

import { openai } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

export type ModelTier = "fast" | "standard" | "reasoning";

export interface ModelConfig {
  name: string;
  temperature: number;
  maxTokens?: number;
}

export const OPENAI_PROFILES: Record<ModelTier, ModelConfig> = {
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

export const GEMINI_PROFILES: Record<ModelTier, ModelConfig> = {
  fast: {
    name: "gemini-3.8-flash",
    temperature: 0.1,
    maxTokens: 2000,
  },
  standard: {
    name: "gemini-3.8-flash",
    temperature: 0.2,
    maxTokens: 4000,
  },
  reasoning: {
    name: "gemini-3.8-flash",
    temperature: 0.1,
    maxTokens: 6000,
  },
};

/**
 * Returns the model configuration profile (temperature, token limits) for the given tier,
 * resolving to the active provider (Gemini or OpenAI).
 */
export function getModelProfile(tier: ModelTier = "standard"): ModelConfig {
  const provider = getAIProvider();
  if (provider === "gemini") {
    return GEMINI_PROFILES[tier] || GEMINI_PROFILES.standard;
  }
  return OPENAI_PROFILES[tier] || OPENAI_PROFILES.standard;
}

/**
 * Dynamic proxy ensuring MODEL_PROFILES always accesses the configuration for the active provider.
 */
export const MODEL_PROFILES: Record<ModelTier, ModelConfig> = new Proxy({} as Record<ModelTier, ModelConfig>, {
  get(_, prop: string) {
    const tier = (prop as ModelTier) || "standard";
    return getModelProfile(tier);
  },
});

/**
 * Returns true if an AI provider API key is configured (Gemini or OpenAI).
 */
export function isAIConfigured(): boolean {
  return Boolean(
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    process.env.OPENAI_API_KEY
  );
}

/**
 * Identifies the active AI provider based on environment variables.
 */
export function getAIProvider(): "gemini" | "openai" | null {
  if (process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return "gemini";
  }
  if (process.env.OPENAI_API_KEY) {
    return "openai";
  }
  return null;
}

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

let googleInstance: ReturnType<typeof createGoogleGenerativeAI> | null = null;
function getGoogleProvider() {
  if (!googleInstance) {
    const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || "";
    googleInstance = createGoogleGenerativeAI({
      apiKey: key,
    });
  }
  return googleInstance;
}

/**
 * Returns the Vercel AI SDK language model instance for the given tier.
 */
export function getModelForTier(tier: ModelTier = "standard") {
  const provider = getAIProvider();
  if (provider === "gemini") {
    const profile = GEMINI_PROFILES[tier] || GEMINI_PROFILES.standard;
    const google = getGoogleProvider();
    return google(profile.name);
  }

  const profile = OPENAI_PROFILES[tier] || OPENAI_PROFILES.standard;
  return openai(profile.name);
}

/**
 * Returns the vision-capable model instance.
 */
export function getVisionModel() {
  const provider = getAIProvider();
  if (provider === "gemini") {
    const google = getGoogleProvider();
    return google("gemini-3.8-flash");
  }
  return openai("gpt-4o");
}

/**
 * Returns the artifact code-generation model instance.
 */
export function getArtifactModel() {
  const provider = getAIProvider();
  if (provider === "gemini") {
    const google = getGoogleProvider();
    return google("gemini-3.8-flash");
  }
  return openai("gpt-4o");
}
