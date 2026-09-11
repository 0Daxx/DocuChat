import type { LLMConfig, LLMProviderOption, LLMProviderType, ChunkSource } from "../types";

export const LLM_PROVIDERS: LLMProviderOption[] = [
  {
    id: "groq",
    name: "Groq",
    description: "Fast cloud inference with Llama, Mixtral models",
    defaultBaseUrl: "https://api.groq.com/openai/v1",
    models: [
      "llama-3.3-70b-versatile",
      "llama-3.1-8b-instant",
      "mixtral-8x7b-32768",
      "gemma2-9b-it",
    ],
    requiresApiKey: true,
  },
  {
    id: "cerebras",
    name: "Cerebras",
    description: "Ultra-fast inference on wafer-scale engines",
    defaultBaseUrl: "https://api.cerebras.ai/v1",
    models: [
      "llama3.1-70b",
      "llama3.1-8b",
    ],
    requiresApiKey: true,
  },
  {
    id: "lmstudio",
    name: "LM Studio",
    description: "Local inference via LM Studio server",
    defaultBaseUrl: "http://localhost:1234/v1",
    models: ["local-model"],
    requiresApiKey: false,
  },
  {
    id: "llamacpp",
    name: "llama.cpp",
    description: "Local inference via llama.cpp server",
    defaultBaseUrl: "http://localhost:8080/v1",
    models: ["local-model"],
    requiresApiKey: false,
  },
];

export function getProviderConfig(providerId: LLMProviderType): LLMProviderOption {
  const provider = LLM_PROVIDERS.find(p => p.id === providerId);
  if (!provider) throw new Error(`Unknown provider: ${providerId}`);
  return provider;
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

  const body = JSON.stringify({
    model: config.model,
    messages: allMessages,
    temperature: config.temperature,
    max_tokens: config.maxTokens,
    stream: true,
  });

  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers,
    body,
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
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed === "data: [DONE]") continue;
      if (!trimmed.startsWith("data: ")) continue;

      try {
        const json = JSON.parse(trimmed.slice(6));
        const delta = json.choices?.[0]?.delta?.content;
        if (delta) {
          fullContent += delta;
          onChunk(delta);
        }
      } catch {
        // Skip malformed JSON lines
      }
    }
  }

  return fullContent;
}

export async function testConnection(config: LLMConfig): Promise<boolean> {
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
    return response.ok;
  } catch {
    return false;
  }
}
