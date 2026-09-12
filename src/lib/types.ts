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
export type DocumentOwnerType = "chat" | "project";

export interface Document {
  id: string;
  name: string;
  type: "pdf" | "docx" | "txt";
  size: number;
  uploadedAt: number;
  chunkCount: number;
  ownerId: string;        // ID of the chat or project that owns it
  ownerType: DocumentOwnerType;
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
  projectId: string | null;  // null = standalone chat
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

// Project types
export interface Project {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  chatIds: string[];
  color: string; // emoji or color indicator
}

// App state
export interface AppState {
  projects: Project[];
  sessions: ChatSession[];
  activeSessionId: string | null;
  documents: Document[];
  chunks: DocumentChunk[];
  llmConfig: LLMConfig;
  sidebarCollapsed: boolean;
  activeProjectId: string | null; // for sidebar navigation
}
