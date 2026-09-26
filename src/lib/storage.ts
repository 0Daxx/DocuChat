import type { AppState, ChatSession, Document, DocumentChunk, LLMConfig, Project, APIKey, APIKeyConfig, UserPreferences } from "./types";

const STORAGE_KEY = "docuchat_state";
const API_KEY_STORAGE_KEY = "docuchat_api_keys_v2";

const DEFAULT_LLM_CONFIG: LLMConfig = {
  provider: "groq",
  model: "",
  baseUrl: "https://api.groq.com/openai/v1",
  temperature: 0.7,
  maxTokens: 4096,
};

const DEFAULT_API_KEY_CONFIG: APIKeyConfig = {
  keys: [],
  fallbackEnabled: true,
  maxRetries: 3,
};

const DEFAULT_PREFERENCES: UserPreferences = {
  systemPrompt: "",
  defaultTemperature: 0.7,
  defaultMaxTokens: 4096,
  showSources: true,
  streamResponses: true,
  autoSaveChats: true,
};

const DEFAULT_STATE: AppState = {
  projects: [],
  sessions: [],
  archivedSessions: [],
  activeSessionId: null,
  documents: [],
  chunks: [],
  llmConfig: DEFAULT_LLM_CONFIG,
  apiKeyConfig: DEFAULT_API_KEY_CONFIG,
  preferences: DEFAULT_PREFERENCES,
  sidebarCollapsed: false,
  activeProjectId: null,
};

// API Key Management - Multiple keys per provider with fallback support
export function loadAPIKeyConfig(): APIKeyConfig {
  try {
    const stored = localStorage.getItem(API_KEY_STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) {
    console.error("Failed to load API key config:", e);
  }
  return { ...DEFAULT_API_KEY_CONFIG };
}

export function saveAPIKeyConfig(config: APIKeyConfig): void {
  try {
    // Never log API keys
    localStorage.setItem(API_KEY_STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error("Failed to save API key config:", e);
  }
}

// Get the preferred key for a provider, or first available
export function getPreferredKey(provider: string): APIKey | null {
  const config = loadAPIKeyConfig();
  const providerKeys = config.keys.filter(k => k.provider === provider);
  if (providerKeys.length === 0) return null;
  return providerKeys.find(k => k.isPreferred) || providerKeys[0];
}

// Get all keys for a provider (for fallback)
export function getKeysForProvider(provider: string): APIKey[] {
  const config = loadAPIKeyConfig();
  return config.keys.filter(k => k.provider === provider);
}

// Mask API key for display (show only last 4 chars)
export function maskApiKey(key: string): string {
  if (key.length <= 8) return "••••••••";
  return `••••••••${key.slice(-4)}`;
}

export function loadState(): AppState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      const state = { ...DEFAULT_STATE, ...parsed };

      // Restore preferred API key for current provider
      const preferredKey = getPreferredKey(state.llmConfig.provider);
      if (preferredKey) {
        state.llmConfig = {
          ...state.llmConfig,
          apiKey: preferredKey.key,
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
  // Remove session from any project
  state.projects = state.projects.map(p => ({
    ...p,
    chatIds: p.chatIds.filter(id => id !== sessionId),
  }));
  state.sessions = state.sessions.filter(s => s.id !== sessionId);
  // Remove chat-owned documents
  state.documents = state.documents.filter(d => !(d.ownerType === "chat" && d.ownerId === sessionId));
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

export function saveProject(project: Project): void {
  const state = loadState();
  const idx = state.projects.findIndex(p => p.id === project.id);
  if (idx >= 0) {
    state.projects[idx] = project;
  } else {
    state.projects.push(project);
  }
  saveState(state);
}

export function deleteProject(projectId: string): void {
  const state = loadState();
  // Detach all chats from the project (they become standalone)
  state.sessions = state.sessions.map(s =>
    s.projectId === projectId ? { ...s, projectId: null } : s
  );
  state.projects = state.projects.filter(p => p.id !== projectId);
  // Remove project-owned documents
  state.documents = state.documents.filter(d => !(d.ownerType === "project" && d.ownerId === projectId));
  if (state.activeProjectId === projectId) {
    state.activeProjectId = null;
  }
  saveState(state);
}
