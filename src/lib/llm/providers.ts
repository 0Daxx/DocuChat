import type { LLMConfig, LLMProviderOption, LLMProviderType, ChunkSource } from "../types";

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
    throw new Error(`LLM API error (${response.status}): ${errorText}`);
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
