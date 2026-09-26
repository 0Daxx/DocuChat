import type { ModelInfo, LLMProviderType } from "../types";

/**
 * Centralized model registry.
 * Provides metadata for all supported models across providers.
 * This data is used in the Models settings screen and for model selection.
 */
export const MODEL_REGISTRY: ModelInfo[] = [
  // Groq Models
  {
    id: "llama-3.3-70b-versatile",
    name: "Llama 3.3 70B Versatile",
    provider: "groq",
    family: "Llama",
    contextWindow: 128000,
    capabilities: ["chat", "reasoning", "code", "multilingual"],
    recommendedFor: ["General purpose", "Complex reasoning", "Code generation"],
    available: true,
  },
  {
    id: "llama-3.1-8b-instant",
    name: "Llama 3.1 8B Instant",
    provider: "groq",
    family: "Llama",
    contextWindow: 128000,
    capabilities: ["chat", "fast-inference"],
    recommendedFor: ["Quick responses", "Simple tasks", "Low latency"],
    available: true,
  },
  {
    id: "mixtral-8x7b-32768",
    name: "Mixtral 8x7B",
    provider: "groq",
    family: "Mixtral",
    contextWindow: 32768,
    capabilities: ["chat", "code", "multilingual"],
    recommendedFor: ["Code generation", "Technical writing"],
    available: true,
  },
  {
    id: "gemma2-9b-it",
    name: "Gemma 2 9B",
    provider: "groq",
    family: "Gemma",
    contextWindow: 8192,
    capabilities: ["chat", "instruction-following"],
    recommendedFor: ["Instruction following", "Concise responses"],
    available: true,
  },

  // Cerebras Models
  {
    id: "llama3.1-70b",
    name: "Llama 3.1 70B",
    provider: "cerebras",
    family: "Llama",
    contextWindow: 128000,
    capabilities: ["chat", "reasoning", "code", "multilingual"],
    recommendedFor: ["Complex reasoning", "Research", "Analysis"],
    available: true,
  },
  {
    id: "llama3.1-8b",
    name: "Llama 3.1 8B",
    provider: "cerebras",
    family: "Llama",
    contextWindow: 128000,
    capabilities: ["chat", "fast-inference"],
    recommendedFor: ["Quick responses", "Simple tasks"],
    available: true,
  },

  // Local Models (LM Studio / llama.cpp)
  {
    id: "local-model",
    name: "Local Model",
    provider: "lmstudio",
    family: "Any",
    capabilities: ["chat", "custom"],
    recommendedFor: ["Privacy-sensitive tasks", "Offline use", "Custom models"],
    available: true,
  },
  {
    id: "local-model",
    name: "Local Model",
    provider: "llamacpp",
    family: "Any",
    capabilities: ["chat", "custom"],
    recommendedFor: ["Self-hosted", "Resource-efficient", "Custom models"],
    available: true,
  },
];

export function getModelsByProvider(provider: LLMProviderType): ModelInfo[] {
  return MODEL_REGISTRY.filter(m => m.provider === provider);
}

export function getModelById(id: string, provider?: LLMProviderType): ModelInfo | undefined {
  return MODEL_REGISTRY.find(m => m.id === id && (!provider || m.provider === provider));
}

export function getModelFamilies(): string[] {
  return [...new Set(MODEL_REGISTRY.map(m => m.family))];
}

export function getModelsByFamily(family: string): ModelInfo[] {
  return MODEL_REGISTRY.filter(m => m.family === family);
}
