import type { LLMConfig, LLMProviderOption, LLMProviderType, ChunkSource } from "../types";
import { loadAPIKeyConfig } from "../storage";

export const LLM_PROVIDERS: LLMProviderOption[] = [
  {
    id: "groq",
    name: "Groq",
    description: "Fast cloud inference with Llama, Mixtral models",
    defaultBaseUrl: "https://api.groq.com/openai/v1",
    models: [],
    requiresApiKey: true,
  },
  {
    id: "cerebras",
    name: "Cerebras",
    description: "Ultra-fast inference on wafer-scale engines",
    defaultBaseUrl: "https://api.cerebras.ai/v1",
    models: [],
    requiresApiKey: true,
  },
  {
    id: "lmstudio",
    name: "LM Studio",
    description: "Local inference via LM Studio server",
    defaultBaseUrl: "http://localhost:1234/v1",
    models: [],
    requiresApiKey: false,
  },
  {
    id: "llamacpp",
    name: "llama.cpp",
    description: "Local inference via llama.cpp server",
    defaultBaseUrl: "http://localhost:8080/v1",
    models: [],
    requiresApiKey: false,
  },
];

export function getProviderConfig(providerId: LLMProviderType): LLMProviderOption {
  const provider = LLM_PROVIDERS.find(p => p.id === providerId);
  if (!provider) throw new Error(`Unknown provider: ${providerId}`);
  return provider;
}

/**
 * Fetch available models from the provider's /models endpoint.
 * Returns an array of model IDs.
 */
export async function fetchAvailableModels(config: LLMConfig): Promise<string[]> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (config.apiKey) {
    headers["Authorization"] = `Bearer ${config.apiKey}`;
  }

  const response = await fetch(`${config.baseUrl}/models`, {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch models: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  // OpenAI-compatible format: { data: [{ id: "model-name" }, ...] }
  if (data.data && Array.isArray(data.data)) {
    return data.data.map((m: any) => m.id).filter(Boolean);
  }

  // Fallback: some servers return an array directly
  if (Array.isArray(data)) {
    return data.map((m: any) => m.id || m.name).filter(Boolean);
  }

  return [];
}

/**
 * Test connection to the LLM provider.
 * Returns { success, models } where models is the list of available model IDs.
 */
export async function testConnection(config: LLMConfig): Promise<{ success: boolean; models: string[] }> {
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (config.apiKey) {
      headers["Authorization"] = `Bearer ${config.apiKey}`;
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
 * Comprehensive diagnostic check for LLM configuration.
 * Returns detailed information about what's working and what's not.
 */
export async function diagnoseLLMConfig(config: LLMConfig): Promise<{
  success: boolean;
  checks: {
    apiKey: { valid: boolean; message: string };
    baseUrl: { valid: boolean; message: string };
    model: { valid: boolean; message: string };
    connection: { valid: boolean; message: string };
    models: { valid: boolean; message: string; available?: string[] };
  };
  recommendations: string[];
}> {
  const checks = {
    apiKey: { valid: true, message: "OK" },
    baseUrl: { valid: true, message: "OK" },
    model: { valid: true, message: "OK" },
    connection: { valid: true, message: "OK" },
    models: { valid: true, message: "OK", available: [] as string[] },
  };
  const recommendations: string[] = [];

  // Check API key
  const provider = LLM_PROVIDERS.find(p => p.id === config.provider);
  if (provider?.requiresApiKey) {
    if (!config.apiKey || config.apiKey.trim() === "") {
      checks.apiKey = { valid: false, message: "API key is required but not provided" };
      recommendations.push(`Add your ${provider.name} API key in Settings > API`);
    } else if (config.apiKey.length < 10) {
      checks.apiKey = { valid: false, message: "API key appears to be too short" };
      recommendations.push("Verify your API key is complete");
    }
  }

  // Check base URL
  if (!config.baseUrl || config.baseUrl.trim() === "") {
    checks.baseUrl = { valid: false, message: "Base URL is not configured" };
    recommendations.push("Set the base URL for your provider");
  } else {
    try {
      new URL(config.baseUrl);
    } catch {
      checks.baseUrl = { valid: false, message: "Base URL is not a valid URL" };
      recommendations.push("Fix the base URL format");
    }
  }

  // Check model
  if (!config.model || config.model.trim() === "") {
    checks.model = { valid: false, message: "No model selected" };
    recommendations.push("Select a model in Settings > API");
  }

  // Test connection
  if (checks.apiKey.valid && checks.baseUrl.valid) {
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (config.apiKey) {
        headers["Authorization"] = `Bearer ${config.apiKey}`;
      }

      const response = await fetch(`${config.baseUrl}/models`, {
        method: "GET",
        headers,
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      if (!response.ok) {
        checks.connection = { 
          valid: false, 
          message: `Connection failed: ${response.status} ${response.statusText}` 
        };
        
        if (response.status === 401 || response.status === 403) {
          recommendations.push("API key is invalid or expired. Get a new one from the provider.");
        } else if (response.status === 429) {
          recommendations.push("Rate limit exceeded. Wait a moment or use a different API key.");
        } else if (response.status >= 500) {
          recommendations.push("Provider server error. Try again later or switch to a different provider.");
        }
      } else {
        const data = await response.json();
        let models: string[] = [];

        if (data.data && Array.isArray(data.data)) {
          models = data.data.map((m: any) => m.id).filter(Boolean);
        } else if (Array.isArray(data)) {
          models = data.map((m: any) => m.id || m.name).filter(Boolean);
        }

        checks.models.available = models;
        
        if (models.length === 0) {
          checks.models = { valid: false, message: "No models available from provider", available: [] };
          recommendations.push("Provider returned no models. Check your API key permissions.");
        } else if (config.model && !models.includes(config.model)) {
          checks.model = { 
            valid: false, 
            message: `Selected model "${config.model}" not available. Available: ${models.slice(0, 3).join(", ")}${models.length > 3 ? "..." : ""}` 
          };
          checks.models.available = models;
          recommendations.push(`Select a valid model from the available list`);
        }
      }
    } catch (error) {
      checks.connection = { valid: false, message: "Network error" };
      
      if (error instanceof Error) {
        if (error.name === "AbortError") {
          checks.connection.message = "Connection timeout (10s)";
          recommendations.push("Check your internet connection or try a different provider");
        } else if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
          checks.connection.message = "Cannot reach provider";
          recommendations.push("Check if the base URL is correct and the provider is accessible");
          if (config.provider === "lmstudio" || config.provider === "llamacpp") {
            recommendations.push("Make sure your local server is running");
          }
        } else {
          checks.connection.message = error.message;
        }
      }
    }
  }

  const success = Object.values(checks).every(c => c.valid);

  return { success, checks, recommendations };
}

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

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (config.apiKey) {
    headers["Authorization"] = `Bearer ${config.apiKey}`;
  }

  const body: Record<string, unknown> = {
    model: config.model,
    messages: allMessages,
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
    // Keep the last incomplete line in the buffer
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();

      // Skip empty lines
      if (!trimmed) continue;

      // SSE format: "data: {...}" or "data: [DONE]"
      if (trimmed.startsWith("data:")) {
        const dataStr = trimmed.slice(5).trim();

        // Check for end of stream
        if (dataStr === "[DONE]") continue;

        try {
          const json = JSON.parse(dataStr);
          const delta = json.choices?.[0]?.delta?.content;
          if (delta) {
            fullContent += delta;
            onChunk(delta);
          }
        } catch {
          // Skip malformed JSON lines
        }
      }
      // Some servers (like llama.cpp) may send non-SSE JSON directly
      else if (trimmed.startsWith("{")) {
        try {
          const json = JSON.parse(trimmed);
          const delta = json.choices?.[0]?.delta?.content;
          if (delta) {
            fullContent += delta;
            onChunk(delta);
          }
          // Some servers return content directly
          const content = json.content;
          if (content && typeof content === "string") {
            fullContent += content;
            onChunk(content);
          }
        } catch {
          // Skip malformed lines
        }
      }
    }
  }

  return fullContent;
}

// Check if an error is retryable (rate limit, server error, etc.)
export function isRetryableError(error: any): boolean {
  if (!error?.statusCode) return false;
  // 429 = rate limit, 5xx = server errors
  return error.statusCode === 429 || (error.statusCode >= 500 && error.statusCode < 600);
}

// Get next available API key for fallback
export function getNextApiKey(provider: string, currentKey: string): string | null {
  const config = loadAPIKeyConfig();
  const providerKeys = config.keys.filter(k => k.provider === provider);
  
  if (providerKeys.length <= 1) return null;
  
  const currentIndex = providerKeys.findIndex(k => k.key === currentKey);
  if (currentIndex === -1) return providerKeys[0]?.key || null;
  
  // Return next key in rotation
  const nextIndex = (currentIndex + 1) % providerKeys.length;
  return providerKeys[nextIndex]?.key || null;
}
