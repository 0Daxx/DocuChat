// LLM Provider types
export type LLMProviderType = "groq" | "cerebras" | "lmstudio" | "llamacpp";

export interface LLMConfig {
  provider: LLMProviderType;
  model: string;
  apiKey?: string;
  baseUrl: string;
  temperature: number;
  maxTokens: number;
}

export interface LLMProviderOption {
  id: LLMProviderType;
  name: string;
  description: string;
  defaultBaseUrl: string;
  models: string[];
  requiresApiKey: boolean;
}

// Document types
export interface Document {
  id: string;
  name: string;
  type: "pdf" | "docx" | "txt";
  size: number;
  uploadedAt: number;
  chunkCount: number;
}

export interface DocumentChunk {
  id: string;
  documentId: string;
  documentName: string;
  content: string;
  index: number;
  embedding?: number[];
}

// Chat types
export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
  documentIds: string[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  sources?: ChunkSource[];
}

export interface ChunkSource {
  chunkId: string;
  documentName: string;
  content: string;
  score: number;
}

// App state
export interface AppState {
  sessions: ChatSession[];
  activeSessionId: string | null;
  documents: Document[];
  chunks: DocumentChunk[];
  llmConfig: LLMConfig;
  sidebarCollapsed: boolean;
}
