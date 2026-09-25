# QWEN.md - DocuChat Technical Architecture

## Overview

DocuChat is an AI-powered document chat service built with React, TypeScript, and modern web technologies. It supports multiple LLM providers and implements RAG (Retrieval Augmented Generation) for document-based conversations.

## Tech Stack

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite 6
- **Styling**: Tailwind CSS 4 + ShadCN UI
- **Routing**: React Router DOM 6
- **State Management**: React Context + LocalStorage persistence
- **Document Processing**: pdf.js (PDF), mammoth (DOCX), native (TXT)
- **Markdown Rendering**: react-markdown + remark-gfm + react-syntax-highlighter

### Backend (Future)
- **Database & Auth**: Supabase (PostgreSQL + Auth)
- **Storage**: Supabase Storage for documents
- **Vector Search**: Supabase pgvector extension (planned)

## Architecture

### Core Modules

#### 1. Document Processing Pipeline
```
Upload → Parse → Chunk → Index → Search
```
- **Parser** (`src/lib/documents/parser.ts`): Extracts text from PDF/DOCX/TXT
- **Chunker** (`src/lib/documents/chunker.ts`): Splits text into overlapping chunks
- **Vector Store** (`src/lib/documents/vectorStore.ts`): TF-IDF based retrieval

#### 2. LLM Provider Abstraction
```typescript
interface LLMProvider {
  id: string;
  name: string;
  baseUrl: string;
  requiresApiKey: boolean;
  models: string[];
}
```

Supported providers:
- **Groq**: Cloud inference (llama, mixtral, gemma)
- **Cerebras**: Wafer-scale inference (llama)
- **LM Studio**: Local inference (port 1234)
- **llama.cpp**: Local inference (port 8080)

#### 3. State Management
- **AppState**: Global application state
- **LocalStorage**: Persistence layer
- **API Keys**: Stored separately for security

### Data Model

```typescript
// Projects group chats and share documents
interface Project {
  id: string;
  name: string;
  color: string; // emoji
  chatIds: string[];
}

// Chats belong to projects or are standalone
interface ChatSession {
  id: string;
  title: string;
  projectId: string | null;
  messages: ChatMessage[];
}

// Documents owned by chats or projects
interface Document {
  id: string;
  ownerId: string;
  ownerType: "chat" | "project";
  chunks: DocumentChunk[];
}
```

## Key Features

### 1. Project-Based Organization
- Projects group related chats
- Shared document libraries per project
- Automatic document inheritance

### 2. Document Scoping
- Chat-specific documents: private to that chat
- Project documents: shared across all project chats
- Automatic retrieval based on chat context

### 3. Streaming Responses
- Real-time token streaming via SSE
- Abort controller for cancellation
- Progressive rendering

### 4. Markdown Rendering
- Full GFM support (tables, task lists, strikethrough)
- Syntax-highlighted code blocks
- Copy-to-clipboard for code
- Responsive tables and images

## File Structure

```
src/
├── components/
│   ├── chat/
│   │   └── MarkdownRenderer.tsx    # Markdown rendering
│   ├── layout/
│   │   ├── ChatWindow.tsx          # Main chat interface
│   │   └── Sidebar.tsx             # Navigation sidebar
│   ├── settings/
│   │   └── SettingsDialog.tsx      # LLM configuration
│   └── ui/                         # ShadCN components
├── lib/
│   ├── documents/
│   │   ├── parser.ts              # Document parsing
│   │   ├── chunker.ts             # Text chunking
│   │   └── vectorStore.ts         # TF-IDF retrieval
│   ├── llm/
│   │   └── providers.ts           # LLM abstraction
│   ├── storage.ts                  # LocalStorage persistence
│   ├── types.ts                    # TypeScript types
│   └── utils.ts                    # Utilities
└── App.tsx                         # Main application
```

## Authentication Flow (Planned)

### Demo Mode
- Uses environment variable for demo API key
- Mock authentication for testing
- Clear indication of demo mode

### Production Mode (Future)
- Supabase Auth integration
- Email/password authentication
- OAuth providers (Google, GitHub)
- Protected routes

## Environment Variables

```bash
# Demo mode
VITE_DEMO_API_KEY=your_demo_key

# Provider-specific (future)
VITE_GROQ_API_KEY=
VITE_CEREBRAS_API_KEY=

# Supabase (future)
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

## Performance Considerations

### Document Processing
- Chunk size: 500 characters
- Overlap: 100 characters
- TF-IDF indexing for fast retrieval
- Embeddings stored without vectors to save space

### State Management
- Lazy loading of large state objects
- Selective re-renders with React.memo
- Debounced input handling

### Bundle Size
- Code splitting by route
- Dynamic imports for heavy libraries
- Tree shaking enabled

## Security

### API Keys
- Stored in separate localStorage key
- Never included in state snapshots
- Cleared on logout (future)

### Document Processing
- Client-side only (no server upload)
- No external API calls for parsing
- Local vector store

## Future Enhancements

### Backend Integration
- Supabase for auth and database
- Server-side document processing
- Vector embeddings with OpenAI/Cohere
- Real-time collaboration

### Features
- Document versioning
- Chat export (PDF, Markdown)
- Advanced search filters
- Multi-modal support (images, audio)
- Chat templates and presets

## Deployment

### Vercel Configuration
```json
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "env": {
    "VITE_DEMO_API_KEY": "@demo-api-key"
  }
}
```

### Build Optimization
- Minification enabled
- Source maps for production
- Asset hashing for caching
- Gzip compression

## Testing Strategy (Planned)

### Unit Tests
- Document parsing functions
- Chunking algorithms
- Vector store operations
- LLM provider mocking

### Integration Tests
- Authentication flows
- Document upload pipeline
- Chat message handling
- Project management

### E2E Tests
- Complete user workflows
- Cross-browser compatibility
- Mobile responsiveness
- Accessibility compliance

## Accessibility

### WCAG 2.1 AA Compliance
- Semantic HTML structure
- ARIA labels for interactive elements
- Keyboard navigation support
- Focus management
- Color contrast ratios

### Screen Reader Support
- Proper heading hierarchy
- Descriptive link text
- Form field labels
- Error announcements

## Browser Support

### Modern Browsers
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Mobile Browsers
- iOS Safari 14+
- Chrome Android 90+
- Samsung Internet 14+

## Monitoring & Analytics (Planned)

### Error Tracking
- Sentry integration
- Error boundaries
- User-friendly error messages

### Performance Monitoring
- Web Vitals tracking
- Bundle size monitoring
- Load time metrics

## Contributing

### Code Style
- TypeScript strict mode
- ESLint + Prettier
- Component-based architecture
- Functional components with hooks

### Git Workflow
- Feature branches
- Pull request reviews
- Conventional commits
- Automated CI/CD

## License

MIT License - See LICENSE file for details

## Support

For issues and feature requests, please use the GitHub issue tracker.

---

**Last Updated**: 2026
**Version**: 1.0.0
