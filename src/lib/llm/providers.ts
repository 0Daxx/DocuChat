import type { LLMConfig, LLMProviderType, ChunkSource } from "../types";

/**
 * Direct LLM API integration for frontend.
 * Supports Groq and Cerebras with automatic fallback.
 */

export interface LLMProviderOption {
  id: LLMProviderType;
  name: string;
  description: string;
  defaultBaseUrl: string;
  models: string[];
  requiresApiKey: boolean;
}

export const LLM_PROVIDERS: LLMProviderOption[] = [
  {
    id: "groq",
    name: "Groq",
    description: "Fast cloud inference with GPT-OSS and Qwen models",
    defaultBaseUrl: "https://api.groq.com/openai/v1",
    models: [], // Will be fetched dynamically
    requiresApiKey: true,
  },
  {
    id: "cerebras",
    name: "Cerebras",
    description: "Ultra-fast inference on wafer-scale engines",
    defaultBaseUrl: "https://api.cerebras.ai/v1",
    models: [], // Will be fetched dynamically
    requiresApiKey: true,
  },
];

/**
 * Get all available API keys from environment variables.
 * Returns an array of API keys for the specified provider.
 */
export function getAvailableApiKeys(provider: LLMProviderType): string[] {
  const keys: string[] = [];
  
  if (provider === "groq") {
    for (let i = 1; i <= 3; i++) {
      const key = import.meta.env[`VITE_GROQ_API_KEY_${i}`];
      if (key) keys.push(key);
    }
  } else if (provider === "cerebras") {
    for (let i = 1; i <= 3; i++) {
      const key = import.meta.env[`VITE_CEREBRAS_API_KEY_${i}`];
      if (key) keys.push(key);
    }
  }
  
  return keys;
}

/**
 * Build system prompt with context from retrieved chunks.
 */
function buildSystemPrompt(sources: ChunkSource[]): string {
  if (sources.length === 0) {
    return `You are a helpful AI assistant. Answer questions clearly and accurately. If you don't know something, say so honestly.`;
  }

  const contextParts = sources.map((s, i) =>
    `[Source ${i + 1} - ${s.documentName}]:\n${s.content}`
  ).join("\n\n---\n\n");

  return `You are a helpful AI assistant that answers questions based on the provided document context.

IMPORTANT RULES:
- Use ONLY the information from the provided context to answer questions.
- If the context doesn't contain enough information, say so honestly.
- Cite which source you're referencing when possible (e.g., "According to [document name]...").
- Be concise but thorough.

=== DOCUMENT CONTEXT ===
${contextParts}
=== END CONTEXT ===`;
}

/**
 * Make a direct API call to an LLM provider with streaming support.
 * Implements automatic fallback to next API key on rate limit or error.
 */
export async function streamChatCompletion(
  config: LLMConfig,
  messages: { role: string; content: string }[],
  sources: ChunkSource[],
  onChunk: (text: string) => void,
  signal?: AbortSignal
): Promise<string> {
  const systemPrompt = buildSystemPrompt(sources);
  const allMessages = [
    { role: "system", content: systemPrompt },
    ...messages,
  ];

  // Get all available API keys for this provider
  const apiKeys = getAvailableApiKeys(config.provider);
  
  // If no keys from env, use the one from config
  const keysToTry = apiKeys.length > 0 ? apiKeys : (config.apiKey ? [config.apiKey] : []);
  
  if (keysToTry.length === 0) {
    throw new Error(`No API keys available for ${config.provider}. Please configure API keys in environment variables.`);
  }

  let lastError: Error | null = null;

  // Try each API key with fallback
  for (let keyIndex = 0; keyIndex < keysToTry.length; keyIndex++) {
    const apiKey = keysToTry[keyIndex];
    
    try {
      const result = await tryApiCall(
        config,
        apiKey,
        allMessages,
        onChunk,
        signal
      );
      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Check if error is retryable (rate limit or server error)
      const isRetryable = isRetryableError(error);
      
      if (!isRetryable || keyIndex === keysToTry.length - 1) {
        // Not retryable or last key, throw error
        throw lastError;
      }
      
      // Log fallback attempt
      console.warn(`API key ${keyIndex + 1} failed, trying next key...`);
    }
  }

  throw lastError || new Error("All API keys failed");
}

/**
 * Try a single API call with the given key.
 */
async function tryApiCall(
  config: LLMConfig,
  apiKey: string,
  messages: { role: string; content: string }[],
  onChunk: (text: string) => void,
  signal?: AbortSignal
): Promise<string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (apiKey) {
    headers["Authorization"] = `Bearer ${apiKey}`;
  }

  const body: Record<string, unknown> = {
    model: config.model,
    messages,
    temperature: config.temperature,
    max_tokens: config.maxTokens,
    stream: true,
  };

  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    const errorText = await response.text();
    const error = new Error(`LLM API error (${response.status}): ${errorText}`);
    (error as any).statusCode = response.status;
    throw error;
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let fullContent = "";
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      if (trimmed.startsWith("")) {
        const dataStr = trimmed.slice(5).trim();
        if (dataStr === "[DONE]") continue;

        try {
          const json = JSON.parse(dataStr);
          const delta = json.choices?.[0]?.delta?.content;
          if (delta) {
            fullContent += delta;
            onChunk(delta);
          }
        } catch {
          // Skip malformed JSON
        }
      } else if (trimmed.startsWith("{")) {
        try {
          const json = JSON.parse(trimmed);
          const delta = json.choices?.[0]?.delta?.content;
          if (delta) {
            fullContent += delta;
            onChunk(delta);
          }
        } catch {
          // Skip malformed JSON
        }
      }
    }
  }

  return fullContent;
}

/**
 * Check if an error is retryable (rate limit or server error).
 */
export function isRetryableError(error: any): boolean {
  if (!error?.statusCode) return false;
  // 429 = rate limit, 5xx = server errors
  return error.statusCode === 429 || (error.statusCode >= 500 && error.statusCode < 600);
}

/**
 * Test connection to the LLM provider.
 * Returns { success, models } where models is the list of available model IDs.
 */
export async function testConnection(config: LLMConfig): Promise<{ success: boolean; models: string[] }> {
  try {
    const apiKeys = getAvailableApiKeys(config.provider);
    const apiKey = apiKeys.length > 0 ? apiKeys[0] : config.apiKey;
    
    if (!apiKey) {
      return { success: false, models: [] };
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }

    const response = await fetch(`${config.baseUrl}/models`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      return { success: false, models: [] };
    }

    const data = await response.json();
    let models: string[] = [];

    if (data.data && Array.isArray(data.data)) {
      models = data.data.map((m: any) => m.id).filter(Boolean);
    } else if (Array.isArray(data)) {
      models = data.map((m: any) => m.id || m.name).filter(Boolean);
    }

    return { success: true, models };
  } catch {
    return { success: false, models: [] };
  }
}

/**
 * Fetch available models from the provider's /models endpoint.
 */
export async function fetchAvailableModels(config: LLMConfig): Promise<string[]> {
  const result = await testConnection(config);
  if (!result.success) {
    throw new Error("Failed to fetch models");
  }
  return result.models;
}
