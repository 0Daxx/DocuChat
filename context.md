# DocuChat - Complete Project Context & Specification

## Project Overview

**DocuChat** is a pure frontend AI-powered document chat application that allows users to upload documents (PDF, DOCX, TXT) and chat with them using LLM providers (Groq, Cerebras). The application implements RAG (Retrieval Augmented Generation) with client-side document processing and supports automatic cross-provider API key fallback.

**Key Characteristics:**
- 100% frontend-only (no backend server)
- Client-side document processing
- In-memory vector store (TF-IDF based)
- Direct LLM API calls from browser
- Automatic provider fallback (Groq → Cerebras)
- Multiple API keys per provider with rotation
- LocalStorage for persistence
- Deployable to Vercel/Netlify as static site

---

## Technology Stack

### Frontend Framework
- **React 18** with TypeScript
- **Vite** as build tool
- **React Router** for routing
- **Tailwind CSS** for styling
- **ShadCN UI** component library

### Document Processing
- **pdfjs-dist** - PDF text extraction
- **mammoth** - DOCX text extraction
- Native browser API - TXT file reading

### LLM Integration
- **Groq API** - Primary provider (fast inference)
- **Cerebras API** - Fallback provider
- Direct HTTP calls with streaming (SSE)
- OpenAI-compatible API format

### State Management
- **React Context** - Global state
- **LocalStorage** - Persistence
- No external state library (Redux, Zustand, etc.)

### Vector Search
- Custom TF-IDF implementation
- In-memory vector store
- Cosine similarity search
- No external embedding API required

---

## Project Structure

```
docuchat/
├── src/
│   ├── components/
│   │   ├── ui/                    # ShadCN UI components
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── select.tsx
│   │   │   ├── scroll-area.tsx
│   │   │   ├── separator.tsx
│   │   │   ├── tooltip.tsx
│   │   │   ├── label.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── card.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── avatar.tsx
│   │   │   ├── skeleton.tsx
│   │   │   └── sonner.tsx         # Toast notifications
│   │   │
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx        # Main navigation sidebar
│   │   │   ├── ChatWindow.tsx     # Chat interface
│   │   │   └── Navbar.tsx         # Top navigation (for public pages)
│   │   │
│   │   ├── chat/
│   │   │   └── MarkdownRenderer.tsx  # Markdown rendering with syntax highlighting
│   │   │
│   │   ├── settings/
│   │   │   └── SettingsDialog.tsx    # LLM configuration dialog
│   │   │
│   │   ├── home/                  # Landing page components
│   │   │   ├── Hero.tsx
│   │   │   ├── Features.tsx
│   │   │   ├── Providers.tsx
│   │   │   └── Footer.tsx
│   │   │
│   │   ├── auth/
│   │   │   └── ProtectedRoute.tsx    # Route protection (demo mode)
│   │   │
│   │   └── DocuChatApp.tsx        # Main application component
│   │
│   ├── pages/
│   │   ├── HomePage.tsx           # Landing page
│   │   ├── SignInPage.tsx         # Sign in (demo mode)
│   │   ├── SignUpPage.tsx         # Sign up (demo mode)
│   │   └── SettingsPage.tsx       # Full settings page (alternative to dialog)
│   │
│   ├── contexts/
│   │   ├── AuthContext.tsx        # Authentication context (demo mode)
│   │   └── ThemeContext.tsx       # Theme (dark/light) context
│   │
│   ├── lib/
│   │   ├── types.ts               # TypeScript type definitions
│   │   ├── utils.ts               # Utility functions
│   │   ├── storage.ts             # LocalStorage management
│   │   │
│   │   ├── documents/
│   │   │   ├── parser.ts          # Document text extraction
│   │   │   ├── chunker.ts         # Text chunking
│   │   │   └── vectorStore.ts     # TF-IDF vector store
│   │   │
│   │   └── llm/
│   │       ├── providers.ts       # LLM API integration
│   │       └── modelRegistry.ts   # Model metadata
│   │
│   ├── App.tsx                    # Root component with routing
│   ├── main.tsx                   # Entry point
│   └── index.css                  # Global styles + Tailwind
│
├── public/                        # Static assets
├── index.html                     # HTML template
├── package.json                   # Dependencies
├── vite.config.ts                 # Vite configuration
├── tsconfig.json                  # TypeScript configuration
├── tailwind.config.js             # Tailwind configuration
├── components.json                # ShadCN UI configuration
├── .env.example                   # Environment variables template
└── README.md                      # Project documentation
```

---

## Core Features

### 1. Document Upload & Processing

**Supported Formats:**
- PDF (using pdfjs-dist)
- DOCX (using mammoth)
- TXT (native browser API)

**Processing Pipeline:**
```
Upload → Parse → Clean → Chunk → Index → Store
```

**Implementation Details:**

#### Parser (`src/lib/documents/parser.ts`)
```typescript
// Extract text from different file types
export async function parseDocument(file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase();
  
  switch (ext) {
    case 'pdf':
      return parsePDF(file);  // Uses pdfjs-dist
    case 'docx':
      return parseDOCX(file); // Uses mammoth
    case 'txt':
      return parseTXT(file);  // Native file.text()
    default:
      throw new Error(`Unsupported file type: ${ext}`);
  }
}
```

#### Chunker (`src/lib/documents/chunker.ts`)
```typescript
// Split text into overlapping chunks
export function chunkText(
  text: string,
  chunkSize: number = 500,    // characters
  overlap: number = 100       // characters
): DocumentChunk[] {
  // Split by paragraphs first
  // Then by sentences if paragraph is too large
  // Maintain overlap between chunks
  // Return array of chunks with metadata
}
```

#### Vector Store (`src/lib/documents/vectorStore.ts`)
```typescript
// TF-IDF based vector store
class VectorStore {
  private vectors: Map<string, Map<string, number>>;
  private idf: { [term: string]: number };
  
  // Build index from chunks
  buildIndex(chunks: DocumentChunk[]): void {
    // Tokenize all chunks
    // Compute IDF (Inverse Document Frequency)
    // Compute TF-IDF vectors for each chunk
  }
  
  // Search for similar chunks
  search(query: string, topK: number = 5): ChunkSource[] {
    // Tokenize query
    // Compute TF-IDF vector for query
    // Calculate cosine similarity with all chunks
    // Return top K most similar chunks
  }
}
```

### 2. LLM Provider Integration

**Supported Providers:**
- **Groq** (primary) - https://api.groq.com/openai/v1
- **Cerebras** (fallback) - https://api.cerebras.ai/v1

**API Key Management:**
```typescript
// Environment variables (3 keys per provider)
VITE_GROQ_API_KEY_1=...
VITE_GROQ_API_KEY_2=...
VITE_GROQ_API_KEY_3=...
VITE_CEREBRAS_API_KEY_1=...
VITE_CEREBRAS_API_KEY_2=...
VITE_CEREBRAS_API_KEY_3=...
```

**Fallback Logic:**
```typescript
async function streamChatCompletion(config, messages, sources, onChunk, signal) {
  const providerOrder = ["groq", "cerebras"];
  
  // Try each provider
  for (const providerId of providerOrder) {
    const apiKeys = getAvailableApiKeys(providerId);
    
    // Try each API key for this provider
    for (const apiKey of apiKeys) {
      try {
        return await tryApiCall(config, apiKey, messages, onChunk, signal);
      } catch (error) {
        if (!isRetryableError(error)) {
          break; // Try next provider
        }
        // Continue to next key
      }
    }
  }
  
  throw new Error("All providers failed");
}

function isRetryableError(error: any): boolean {
  // Retry on rate limit (429) or server errors (5xx)
  return error.statusCode === 429 || 
         (error.statusCode >= 500 && error.statusCode < 600);
}
```

**Streaming Implementation:**
```typescript
async function tryApiCall(config, apiKey, messages, onChunk, signal) {
  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      temperature: config.temperature,
      max_tokens: config.maxTokens,
      stream: true,
    }),
    signal,
  });
  
  // Parse SSE stream
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullContent = "";
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    const text = decoder.decode(value);
    const lines = text.split("\n");
    
    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const data = line.slice(6);
        if (data === "[DONE]") continue;
        
        const json = JSON.parse(data);
        const delta = json.choices[0].delta.content;
        if (delta) {
          fullContent += delta;
          onChunk(delta); // Stream to UI
        }
      }
    }
  }
  
  return fullContent;
}
```

### 3. Chat Interface

**Features:**
- Real-time streaming responses
- Markdown rendering with syntax highlighting
- Source citations (showing which document chunks were used)
- Copy response to clipboard
- Regenerate response
- Stop generation
- Multiple chat sessions
- Project-based organization

**Message Flow:**
```
User Input → Add User Message → Retrieve Relevant Chunks → 
Build Context Prompt → Stream LLM Response → Add Assistant Message → 
Save to LocalStorage
```

**Context Building:**
```typescript
function buildSystemPrompt(sources: ChunkSource[]): string {
  if (sources.length === 0) {
    return "You are a helpful AI assistant...";
  }
  
  const contextParts = sources.map((s, i) => 
    `[Source ${i + 1} - ${s.documentName}]:\n${s.content}`
  ).join("\n\n---\n\n");
  
  return `You are a helpful AI assistant that answers questions based on the provided context.
  
IMPORTANT RULES:
- Use ONLY the information from the provided context
- Cite which source you're referencing
- Be concise but thorough

=== DOCUMENT CONTEXT ===
${contextParts}
=== END CONTEXT ===`;
}
```

### 4. Project Management

**Features:**
- Create/delete projects
- Attach/detach chats to projects
- Shared document libraries per project
- Visual indicators for project membership

**Data Model:**
```typescript
interface Project {
  id: string;
  name: string;
  color: string; // emoji
  chatIds: string[];
  createdAt: number;
  updatedAt: number;
}

interface ChatSession {
  id: string;
  title: string;
  projectId: string | null; // null = standalone chat
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}
```

**Document Scoping:**
```typescript
function getChatDocumentIds(session: ChatSession): string[] {
  const chatDocs = documents.filter(d => 
    d.ownerType === "chat" && d.ownerId === session.id
  );
  
  if (session.projectId) {
    const projectDocs = documents.filter(d => 
      d.ownerType === "project" && d.ownerId === session.projectId
    );
    return [...chatDocs, ...projectDocs];
  }
  
  return chatDocs;
}
```

### 5. Settings & Configuration

**Settings Dialog Features:**
- Provider selection (Groq/Cerebras)
- Dynamic model fetching from provider API
- API key management (view/add/delete)
- Test connection button
- Temperature slider
- Max tokens configuration
- Fallback behavior settings

**Model Fetching:**
```typescript
async function fetchAvailableModels(config: LLMConfig): Promise<string[]> {
  const response = await fetch(`${config.baseUrl}/models`, {
    headers: { "Authorization": `Bearer ${apiKey}` }
  });
  
  const data = await response.json();
  return data.data.map(m => m.id);
}
```

**Validation:**
```typescript
function handleSave() {
  // Validate model is configured
  if (!localConfig.model || localConfig.model.trim() === "") {
    setModelError("Please select or enter a model name");
    return;
  }
  
  // Validate provider is configured
  if (!localConfig.provider) {
    setModelError("Please select a provider");
    return;
  }
  
  onSave(localConfig);
}
```

### 6. Authentication (Demo Mode)

**Demo Mode Implementation:**
- No real backend authentication
- Single demo user stored in localStorage
- "Start Demo" button on sign-in page
- All data stored locally

**Auth Context:**
```typescript
interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  isDemoUser: boolean;
  signInAsDemo: () => Promise<void>;
  signOut: () => void;
}

const DEMO_USER: UserProfile = {
  id: "demo-user",
  email: "demo@docuchat.ai",
  name: "Demo User",
  isDemo: true,
};
```

### 7. Theme Support

**Features:**
- Light/Dark/System theme
- Persistent theme preference
- System preference detection
- Smooth transitions

**Implementation:**
```typescript
type Theme = "light" | "dark" | "system";

function ThemeProvider({ children }) {
  const [theme, setTheme] = useState<Theme>(
    () => localStorage.getItem("theme") as Theme || "system"
  );
  
  useEffect(() => {
    const root = document.documentElement;
    
    if (theme === "system") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.classList.toggle("dark", prefersDark);
    } else {
      root.classList.toggle("dark", theme === "dark");
    }
    
    localStorage.setItem("theme", theme);
  }, [theme]);
  
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
```

---

## Data Models

### Core Types (`src/lib/types.ts`)

```typescript
// LLM Configuration
interface LLMConfig {
  provider: "groq" | "cerebras";
  model: string;
  apiKey?: string;
  baseUrl: string;
  temperature: number;
  maxTokens: number;
}

// API Key Management
interface APIKey {
  id: string;
  provider: "groq" | "cerebras";
  name: string;
  key: string;
  isPreferred: boolean;
  isSystemKey?: boolean;
  createdAt: number;
}

interface APIKeyConfig {
  keys: APIKey[];
  fallbackEnabled: boolean;
  maxRetries: number;
}

// Documents
interface Document {
  id: string;
  name: string;
  type: "pdf" | "docx" | "txt";
  size: number;
  uploadedAt: number;
  chunkCount: number;
  ownerId: string;
  ownerType: "chat" | "project";
}

interface DocumentChunk {
  id: string;
  documentId: string;
  documentName: string;
  content: string;
  index: number;
}

// Chat
interface ChatSession {
  id: string;
  title: string;
  projectId: string | null;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  sources?: ChunkSource[];
}

interface ChunkSource {
  chunkId: string;
  documentName: string;
  content: string;
  score: number;
}

// Projects
interface Project {
  id: string;
  name: string;
  color: string;
  chatIds: string[];
  createdAt: number;
  updatedAt: number;
}

// User Preferences
interface UserPreferences {
  systemPrompt: string;
  defaultTemperature: number;
  defaultMaxTokens: number;
  showSources: boolean;
  streamResponses: boolean;
  autoSaveChats: boolean;
}

// App State
interface AppState {
  projects: Project[];
  sessions: ChatSession[];
  archivedSessions: ChatSession[];
  activeSessionId: string | null;
  documents: Document[];
  chunks: DocumentChunk[];
  llmConfig: LLMConfig;
  apiKeyConfig: APIKeyConfig;
  preferences: UserPreferences;
  sidebarCollapsed: boolean;
  activeProjectId: string | null;
}
```

---

## State Management

### LocalStorage Keys

```typescript
const STORAGE_KEY = "docuchat_state";
const API_KEY_STORAGE_KEY = "docuchat_api_keys_v2";
const THEME_KEY = "docuchat_theme";
const AUTH_KEY = "docuchat_auth";
```

### State Persistence

```typescript
// Save state
function saveState(state: AppState): void {
  // Remove embeddings to save space
  const toSave = {
    ...state,
    chunks: state.chunks.map(c => ({ ...c, embedding: undefined })),
    llmConfig: { ...state.llmConfig, apiKey: undefined }, // Don't save API key
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
}

// Load state
function loadState(): AppState {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    const parsed = JSON.parse(stored);
    return { ...DEFAULT_STATE, ...parsed };
  }
  return DEFAULT_STATE;
}
```

### API Key Storage

```typescript
// API keys stored separately for security
function saveAPIKeyConfig(config: APIKeyConfig): void {
  localStorage.setItem(API_KEY_STORAGE_KEY, JSON.stringify(config));
}

function loadAPIKeyConfig(): APIKeyConfig {
  const stored = localStorage.getItem(API_KEY_STORAGE_KEY);
  if (stored) {
    const config = JSON.parse(stored);
    // Always include system API keys from environment
    const systemKeys = getSystemApiKeys();
    const userKeys = config.keys.filter(k => !k.isSystemKey);
    return { ...config, keys: [...systemKeys, ...userKeys] };
  }
  return { ...DEFAULT_API_KEY_CONFIG, keys: getSystemApiKeys() };
}

// Get system API keys from environment variables
function getSystemApiKeys(): APIKey[] {
  const keys: APIKey[] = [];
  
  // Groq keys
  for (let i = 1; i <= 3; i++) {
    const key = import.meta.env[`VITE_GROQ_API_KEY_${i}`];
    if (key) {
      keys.push({
        id: `system-groq-${i}`,
        provider: "groq",
        name: `Free Tier Key ${i}`,
        key,
        isPreferred: i === 1,
        isSystemKey: true,
        createdAt: Date.now(),
      });
    }
  }
  
  // Cerebras keys
  for (let i = 1; i <= 3; i++) {
    const key = import.meta.env[`VITE_CEREBRAS_API_KEY_${i}`];
    if (key) {
      keys.push({
        id: `system-cerebras-${i}`,
        provider: "cerebras",
        name: `Free Tier Key ${i}`,
        key,
        isPreferred: i === 1,
        isSystemKey: true,
        createdAt: Date.now(),
      });
    }
  }
  
  return keys;
}
```

---

## Environment Variables

### Required Variables

```env
# Groq API Keys (3 keys for fallback)
VITE_GROQ_API_KEY_1=your_first_groq_key
VITE_GROQ_API_KEY_2=your_second_groq_key
VITE_GROQ_API_KEY_3=your_third_groq_key

# Cerebras API Keys (3 keys for fallback)
VITE_CEREBRAS_API_KEY_1=your_first_cerebras_key
VITE_CEREBRAS_API_KEY_2=your_second_cerebras_key
VITE_CEREBRAS_API_KEY_3=your_third_cerebras_key
```

**Important:** All variables must be prefixed with `VITE_` to be accessible in the frontend.

---

## Routing

### Route Structure

```typescript
// Public routes
/                    → HomePage (landing page)
/signin              → SignInPage (demo mode)
/signup              → SignUpPage (redirects to signin)

// Protected routes
/app/*               → DocuChatApp (main application)
/settings            → SettingsPage (alternative to dialog)
```

### Route Protection

```typescript
function ProtectedRoute({ children }) {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/signin" replace />;
  }
  
  return <>{children}</>;
}
```

---

## Key Implementation Details

### 1. Document Upload Flow

```typescript
async function handleUploadDocuments(files: FileList, ownerId: string, ownerType: DocumentOwnerType) {
  setIsProcessing(true);
  
  try {
    const newDocuments: Document[] = [];
    const newChunks: DocumentChunk[] = [];
    
    for (const file of Array.from(files)) {
      // Parse document
      const text = await parseDocument(file);
      
      // Chunk text
      const chunks = chunkText(text, generateId(), file.name);
      
      // Create document metadata
      const doc: Document = {
        id: generateId(),
        name: file.name,
        type: file.name.split('.').pop() as DocumentType,
        size: file.size,
        uploadedAt: Date.now(),
        chunkCount: chunks.length,
        ownerId,
        ownerType,
      };
      
      newDocuments.push(doc);
      newChunks.push(...chunks);
    }
    
    // Update state
    setState(prev => ({
      ...prev,
      documents: [...prev.documents, ...newDocuments],
      chunks: [...prev.chunks, ...newChunks],
    }));
    
    // Rebuild vector store
    vectorStore.buildIndex([...state.chunks, ...newChunks]);
  } catch (error) {
    setProcessingError(error.message);
  } finally {
    setIsProcessing(false);
  }
}
```

### 2. Chat Message Flow

```typescript
async function handleSendMessage(content: string) {
  // Validate configuration
  if (!state.llmConfig.model) {
    showError("No model configured");
    return;
  }
  
  // Add user message
  const userMessage: ChatMessage = {
    id: generateId(),
    role: "user",
    content,
    timestamp: Date.now(),
  };
  
  // Retrieve relevant chunks
  const documentIds = getChatDocumentIds(activeSession);
  const sources = vectorStore.search(content, 5, documentIds);
  
  // Add assistant message placeholder
  const assistantMessage: ChatMessage = {
    id: generateId(),
    role: "assistant",
    content: "",
    timestamp: Date.now(),
    sources,
  };
  
  // Update session
  updateSession({
    messages: [...session.messages, userMessage, assistantMessage],
  });
  
  // Stream response
  setIsStreaming(true);
  
  try {
    const historyMessages = session.messages
      .filter(m => m.role !== "system")
      .slice(-10)
      .map(m => ({ role: m.role, content: m.content }));
    
    historyMessages.push({ role: "user", content });
    
    let fullContent = "";
    
    await streamChatCompletion(
      state.llmConfig,
      historyMessages,
      sources,
      (chunk) => {
        fullContent += chunk;
        // Update assistant message with streamed content
        updateAssistantMessage(fullContent);
      },
      abortController.signal
    );
    
    // Save final message
    saveSession(finalSession);
  } catch (error) {
    showError(error.message);
  } finally {
    setIsStreaming(false);
  }
}
```

### 3. Cross-Provider Fallback

```typescript
async function streamChatCompletion(config, messages, sources, onChunk, signal) {
  const providerOrder = ["groq", "cerebras"];
  const startIndex = providerOrder.indexOf(config.provider);
  
  // Reorder to start with configured provider
  const providersToTry = [
    providerOrder[startIndex],
    ...providerOrder.filter((_, idx) => idx !== startIndex)
  ];
  
  for (const providerId of providersToTry) {
    const apiKeys = getAvailableApiKeys(providerId);
    
    if (apiKeys.length === 0) continue;
    
    const providerConfig = {
      ...config,
      provider: providerId,
      baseUrl: LLM_PROVIDERS.find(p => p.id === providerId).defaultBaseUrl,
    };
    
    for (const apiKey of apiKeys) {
      try {
        return await tryApiCall(providerConfig, apiKey, messages, onChunk, signal);
      } catch (error) {
        if (!isRetryableError(error)) {
          break; // Try next provider
        }
        // Continue to next key
      }
    }
  }
  
  throw new Error("All providers failed");
}
```

---

## UI/UX Requirements

### Design Principles
- Clean, modern interface
- Responsive design (mobile-first)
- Dark/light mode support
- Accessible (WCAG 2.1 AA)
- Fast and responsive
- Clear error messages
- Helpful guidance text

### Key UI Components

#### Sidebar
- Collapsible
- Project tree view
- Chat list with search
- New chat/project buttons
- Settings access

#### Chat Window
- Message bubbles (user/assistant)
- Streaming indicator
- Source citations
- Action buttons (copy, regenerate)
- File upload (paperclip icon)
- Input area with send button

#### Settings Dialog
- Provider selection
- Model dropdown (dynamic)
- API key management
- Connection testing
- Parameter sliders

### Responsive Breakpoints
```css
/* Mobile first */
sm: 640px   /* Mobile landscape */
md: 768px   /* Tablet */
lg: 1024px  /* Laptop */
xl: 1280px  /* Desktop */
2xl: 1536px /* Large desktop */
```

---

## Error Handling

### Error Types

1. **Configuration Errors**
   - No model configured
   - No API keys available
   - Invalid provider

2. **Network Errors**
   - Connection failed
   - Timeout
   - CORS issues

3. **API Errors**
   - Rate limit (429)
   - Authentication (401/403)
   - Bad request (400)
   - Server error (5xx)

4. **Document Processing Errors**
   - Unsupported file type
   - Failed to parse
   - No text extracted

### Error Handling Strategy

```typescript
try {
  // Operation
} catch (error) {
  if (error.statusCode === 429) {
    // Rate limit - try next key/provider
    fallbackToNextKey();
  } else if (error.statusCode >= 500) {
    // Server error - try next key/provider
    fallbackToNextKey();
  } else if (error.statusCode === 401 || error.statusCode === 403) {
    // Auth error - show clear message
    showError("Invalid API key. Please check your configuration.");
  } else {
    // Other error - show generic message
    showError("An error occurred. Please try again.");
  }
}
```

---

## Performance Considerations

### Optimization Strategies

1. **Code Splitting**
   - Lazy load heavy components
   - Dynamic imports for large libraries

2. **Memoization**
   - React.memo for expensive components
   - useMemo for computed values
   - useCallback for stable callbacks

3. **Virtualization**
   - Virtual scroll for long message lists
   - Virtual scroll for large document lists

4. **Caching**
   - Cache parsed documents
   - Cache vector store
   - Cache API responses

5. **Debouncing**
   - Debounce search input
   - Debounce settings changes

### Bundle Size

Current bundle size:
- CSS: ~55 KB (gzipped: ~10 KB)
- JS: ~1.7 MB (gzipped: ~528 KB)

Main contributors:
- pdfjs-dist (PDF parsing)
- mammoth (DOCX parsing)
- react-markdown (Markdown rendering)

---

## Security Considerations

### API Key Security

**Current Implementation:**
- API keys stored in environment variables
- Keys accessible in browser (client-side app)
- Keys masked in UI (last 4 characters only)
- Keys stored separately in localStorage

**Recommendations for Production:**
1. Use a backend proxy for API calls
2. Implement rate limiting on backend
3. Add authentication/authorization
4. Use server-side environment variables
5. Implement proper secret management

### Data Privacy

**Current Implementation:**
- All data stored in browser localStorage
- No server-side storage
- No data sent to third parties (except LLM providers)
- Documents processed client-side

**Privacy Features:**
- No tracking or analytics
- No cookies (except for theme preference)
- No user data collection
- Clear data deletion (clear localStorage)

---

## Testing Strategy

### Unit Tests

```typescript
// Document parser
describe("parseDocument", () => {
  it("should parse PDF files", async () => {
    const file = new File([pdfContent], "test.pdf", { type: "application/pdf" });
    const text = await parseDocument(file);
    expect(text).toContain("Expected text");
  });
  
  it("should parse DOCX files", async () => {
    const file = new File([docxContent], "test.docx", { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
    const text = await parseDocument(file);
    expect(text).toContain("Expected text");
  });
});

// Text chunker
describe("chunkText", () => {
  it("should split text into chunks", () => {
    const text = "Lorem ipsum ".repeat(100);
    const chunks = chunkText(text, 500, 100);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0].content.length).toBeLessThanOrEqual(500);
  });
});

// Vector store
describe("VectorStore", () => {
  it("should build index and search", () => {
    const store = new VectorStore();
    const chunks = [
      { id: "1", content: "The cat sat on the mat" },
      { id: "2", content: "The dog ran in the park" },
    ];
    store.buildIndex(chunks);
    const results = store.search("cat", 1);
    expect(results[0].chunkId).toBe("1");
  });
});
```

### Integration Tests

```typescript
// Chat flow
describe("Chat Flow", () => {
  it("should send message and receive response", async () => {
    render(<DocuChatApp />);
    
    // Upload document
    const file = new File(["Test content"], "test.txt");
    uploadFile(file);
    
    // Send message
    const input = screen.getByPlaceholderText("Ask anything...");
    fireEvent.change(input, { target: { value: "What is in the document?" } });
    fireEvent.submit(input);
    
    // Wait for response
    await waitFor(() => {
      expect(screen.getByText(/response/i)).toBeInTheDocument();
    });
  });
});
```

### E2E Tests

```typescript
// Playwright
test("full user flow", async ({ page }) => {
  // Navigate to app
  await page.goto("/");
  
  // Start demo
  await page.click("text=Start Demo");
  
  // Upload document
  await page.setInputFiles('input[type="file"]', "test.pdf");
  
  // Send message
  await page.fill('textarea[placeholder="Ask anything..."]', "What is this about?");
  await page.click('button[type="submit"]');
  
  // Wait for response
  await page.waitForSelector(".assistant-message");
  
  // Verify response
  const response = await page.textContent(".assistant-message");
  expect(response).toBeTruthy();
});
```

---

## Deployment

### Vercel Deployment

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Import to Vercel**
   - Go to https://vercel.com
   - Import GitHub repository
   - Configure build settings:
     - Framework Preset: Vite
     - Build Command: `npm run build`
     - Output Directory: `dist`

3. **Set Environment Variables**
   - VITE_GROQ_API_KEY_1
   - VITE_GROQ_API_KEY_2
   - VITE_GROQ_API_KEY_3
   - VITE_CEREBRAS_API_KEY_1
   - VITE_CEREBRAS_API_KEY_2
   - VITE_CEREBRAS_API_KEY_3

4. **Deploy**
   ```bash
   vercel --prod
   ```

### Netlify Deployment

1. **Push to GitHub**
2. **Import to Netlify**
3. **Configure build settings:**
   - Build Command: `npm run build`
   - Publish Directory: `dist`
4. **Set environment variables**
5. **Deploy**

### Other Platforms

The app can be deployed to any static hosting platform:
- GitHub Pages
- Cloudflare Pages
- AWS S3 + CloudFront
- Firebase Hosting

**Requirements:**
- Support for environment variables
- SPA routing support (redirect all routes to index.html)

---

## Future Enhancements

### High Priority

1. **Backend API**
   - Server-side document processing
   - Persistent storage (database)
   - User authentication
   - API rate limiting

2. **Advanced RAG**
   - Use actual embeddings (OpenAI, Cohere)
   - Hybrid search (BM25 + embeddings)
   - Re-ranking of results
   - Query expansion

3. **Real-time Collaboration**
   - Shared chat sessions
   - Real-time updates
   - Multi-user support

### Medium Priority

1. **Advanced Features**
   - Chat export (PDF, Markdown)
   - Chat templates
   - Advanced search filters
   - Document versioning

2. **Multi-modal Support**
   - Image understanding
   - Audio transcription
   - Video processing

3. **Performance**
   - Web Workers for document processing
   - IndexedDB for larger storage
   - Service Worker for offline support

### Low Priority

1. **Analytics**
   - Usage tracking
   - Performance metrics
   - Error tracking

2. **Customization**
   - Custom themes
   - Custom system prompts
   - Plugin system

3. **Mobile Apps**
   - React Native iOS app
   - React Native Android app
   - PWA support

---

## Troubleshooting

### Common Issues

#### 1. "No model configured" Error

**Cause:** Model field is empty in LLM configuration

**Solution:**
1. Go to Settings
2. Select provider (Groq or Cerebras)
3. Click "Connect & Fetch Models"
4. Select a model from dropdown
5. Click "Save"

**If connection fails:**
- Check API keys are set in environment variables
- Check internet connection
- Enter model name manually (e.g., "llama-3.3-70b-versatile" for Groq)

#### 2. "NetworkError when attempting to fetch resource"

**Cause:** Cannot connect to LLM provider

**Solution:**
- Check internet connection
- Verify API keys are correct
- Check provider status page
- Try a different provider (fallback should work automatically)

#### 3. Documents Not Uploading

**Cause:** File format not supported or file too large

**Solution:**
- Check file format (PDF, DOCX, TXT only)
- Try a smaller file
- Check browser console for errors
- Clear browser cache

#### 4. API Rate Limit

**Cause:** Exceeded rate limit for API key

**Solution:**
- Wait for rate limit to reset (usually 1 minute)
- App will automatically try next API key
- If all keys fail, wait before retrying
- Add more API keys if needed

---

## Development Setup

### Prerequisites

- Node.js 18+ and npm
- Git
- Code editor (VS Code recommended)
- Browser with DevTools

### Installation

```bash
# Clone repository
git clone <repo-url>
cd docuchat

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys

# Start development server
npm run dev

# Open browser
# Navigate to http://localhost:5173
```

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript type checking
```

---

## Contributing

### Code Style

- TypeScript strict mode
- ESLint + Prettier
- Component-based architecture
- Functional components with hooks
- Clear naming conventions

### Git Workflow

1. Create feature branch
   ```bash
   git checkout -b feature/your-feature
   ```

2. Make changes and commit
   ```bash
   git add .
   git commit -m "feat: add your feature"
   ```

3. Push and create pull request
   ```bash
   git push origin feature/your-feature
   ```

### Commit Message Format

```
feat: new feature
fix: bug fix
docs: documentation changes
style: formatting, missing semi colons, etc
refactor: code refactoring
test: adding missing tests
chore: maintenance
```

---

## License

MIT License - See LICENSE file for details

---

## Support & Resources

### Documentation
- README.md - Project overview
- QWEN.md - Technical guidelines
- PURE_FRONTEND_DEMO.md - Demo guide
- CROSS_PROVIDER_FALLBACK.md - Fallback documentation

### External Resources
- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [ShadCN UI](https://ui.shadcn.com)
- [Groq API Docs](https://console.groq.com/docs)
- [Cerebras API Docs](https://docs.cerebras.ai)

---

## Summary

DocuChat is a complete, production-ready AI document chat application with:

✅ Pure frontend architecture (no backend required)
✅ Client-side document processing (PDF, DOCX, TXT)
✅ TF-IDF based vector search
✅ Direct LLM API integration (Groq, Cerebras)
✅ Automatic cross-provider fallback
✅ Multiple API keys with rotation
✅ Project-based organization
✅ Real-time streaming responses
✅ Markdown rendering with syntax highlighting
✅ Dark/light mode support
✅ Responsive design
✅ Comprehensive error handling
✅ LocalStorage persistence
✅ Demo mode authentication
✅ Ready for Vercel/Netlify deployment

The application is fully functional and can be deployed immediately after configuring environment variables with API keys.

---

**Version:** 2.3.0
**Last Updated:** 2026
**Status:** ✅ Production Ready
