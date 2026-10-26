import type { ModelInfo, LLMProviderType } from "../types";

/**
 * Centralized model registry.
 * Provides metadata for all supported models across providers.
 * This data is used in the Models settings screen and for model selection.
 */
export const MODEL_REGISTRY: ModelInfo[] = [
  // Groq Models
  {
    id: "openai/gpt-oss-120b",
    name: "GPT-OSS 120B",
    provider: "groq",
    family: "GPT",
    contextWindow: 128000,
    capabilities: ["chat", "reasoning", "code", "multilingual"],
    recommendedFor: ["General purpose", "Complex reasoning", "Code generation"],
    available: true,
  },
  {
    id: "qwen/qwen3.8-27b",
    name: "Qwen 3.8 27B",
    provider: "groq",
    family: "Qwen",
    contextWindow: 32768,
    capabilities: ["chat", "reasoning", "multilingual"],
    recommendedFor: ["Multilingual tasks", "Reasoning", "General chat"],
    available: true,
  },

  // Cerebras Models
  {
    id: "qwen-3.8-27b",
    name: "Qwen 3.8 27B",
    provider: "cerebras",
    family: "Qwen",
    contextWindow: 32768,
    capabilities: ["chat", "reasoning", "multilingual"],
    recommendedFor: ["Multilingual tasks", "Reasoning", "General chat"],
    available: true,
  },
  {
    id: "gpt-oss-120b",
    name: "GPT-OSS 120B",
    provider: "cerebras",
    family: "GPT",
    contextWindow: 128000,
    capabilities: ["chat", "reasoning", "code", "multilingual"],
    recommendedFor: ["General purpose", "Complex reasoning", "Code generation"],
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
