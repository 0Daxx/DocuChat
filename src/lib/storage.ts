import type { AppState, ChatSession, Document, DocumentChunk, LLMConfig } from "./types";

const STORAGE_KEY = "docuchat_state";

const DEFAULT_LLM_CONFIG: LLMConfig = {
  provider: "groq",
  model: "llama-3.3-70b-versatile",
  baseUrl: "https://api.groq.com/openai/v1",
  temperature: 0.7,
  maxTokens: 4096,
};

const DEFAULT_STATE: AppState = {
  sessions: [],
  activeSessionId: null,
  documents: [],
  chunks: [],
  llmConfig: DEFAULT_LLM_CONFIG,
  sidebarCollapsed: false,
};

export function loadState(): AppState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_STATE, ...parsed };
    }
  } catch (e) {
    console.error("Failed to load state from localStorage:", e);
  }
  return { ...DEFAULT_STATE };
}

export function saveState(state: AppState): void {
  try {
    // Save without embeddings to reduce storage size
    const toSave = {
      ...state,
      chunks: state.chunks.map(c => ({ ...c, embedding: undefined })),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch (e) {
    console.error("Failed to save state to localStorage:", e);
  }
}

export function saveSession(session: ChatSession): void {
  const state = loadState();
  const idx = state.sessions.findIndex(s => s.id === session.id);
  if (idx >= 0) {
    state.sessions[idx] = session;
  } else {
    state.sessions.push(session);
  }
  saveState(state);
}

export function deleteSession(sessionId: string): void {
  const state = loadState();
  state.sessions = state.sessions.filter(s => s.id !== sessionId);
  if (state.activeSessionId === sessionId) {
    state.activeSessionId = state.sessions.length > 0 ? state.sessions[0].id : null;
  }
  saveState(state);
}

export function saveDocuments(documents: Document[]): void {
  const state = loadState();
  state.documents = documents;
  saveState(state);
}

export function saveChunks(chunks: DocumentChunk[]): void {
  const state = loadState();
  state.chunks = chunks;
  saveState(state);
}

export function saveLLMConfig(config: LLMConfig): void {
  const state = loadState();
  state.llmConfig = config;
  saveState(state);
}

export function saveSidebarState(collapsed: boolean): void {
  const state = loadState();
  state.sidebarCollapsed = collapsed;
  saveState(state);
}
