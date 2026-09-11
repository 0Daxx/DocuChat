import type { AppState, ChatSession, Document, DocumentChunk, LLMConfig } from "./types";

const STORAGE_KEY = "docuchat_state";
const API_KEY_STORAGE_KEY = "docuchat_api_keys";

const DEFAULT_LLM_CONFIG: LLMConfig = {
  provider: "groq",
  model: "",
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

// Separate API key storage for security/clarity
export function loadApiKeys(): Record<string, string> {
  try {
    const stored = localStorage.getItem(API_KEY_STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) {
    console.error("Failed to load API keys:", e);
  }
  return {};
}

function saveApiKeys(keys: Record<string, string>): void {
  try {
    localStorage.setItem(API_KEY_STORAGE_KEY, JSON.stringify(keys));
  } catch (e) {
    console.error("Failed to save API keys:", e);
  }
}

export function loadState(): AppState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      const state = { ...DEFAULT_STATE, ...parsed };

      // Restore API key from separate storage
      const apiKeys = loadApiKeys();
      if (apiKeys[state.llmConfig.provider]) {
        state.llmConfig = {
          ...state.llmConfig,
          apiKey: apiKeys[state.llmConfig.provider],
        };
      }

      return state;
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
      // Don't save API key in main state
      llmConfig: { ...state.llmConfig, apiKey: undefined },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));

    // Save API key separately
    if (state.llmConfig.apiKey) {
      const apiKeys = loadApiKeys();
      apiKeys[state.llmConfig.provider] = state.llmConfig.apiKey;
      saveApiKeys(apiKeys);
    }
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
