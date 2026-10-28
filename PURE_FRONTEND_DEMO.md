# DocuChat - Pure Frontend Demo Implementation

## Overview

DocuChat is now a **pure frontend demo application** that allows users to upload documents and chat with them using online inference models from Groq and Cerebras. The application implements a robust fallback mechanism to handle API rate limits.

## Key Features

### 1. Document Upload & Processing
- **Supported Formats**: PDF, DOCX, TXT
- **Client-side Processing**: All document parsing happens in the browser
- **Text Extraction**: 
  - PDF: Using `pdfjs-dist`
  - DOCX: Using `mammoth`
  - TXT: Native browser API
- **Chunking**: Recursive character splitting with configurable size and overlap
- **Vector Storage**: TF-IDF based in-memory vector store for semantic search

### 2. LLM Provider Integration
- **Supported Providers**: 
  - ✅ Groq (Fast cloud inference)
  - ✅ Cerebras (Ultra-fast wafer-scale inference)
  - ❌ LM Studio (Removed - local provider)
  - ❌ llama.cpp (Removed - local provider)

### 3. Dynamic Model Fetching
Instead of hardcoding model names, the application now **dynamically fetches available models** from each provider's API:

```typescript
// When you select a provider, the app:
1. Calls the provider's /models endpoint
2. Retrieves all available models
3. Populates the model dropdown dynamically
4. Auto-selects the first available model
```

**Benefits**:
- Always up-to-date with provider's model offerings
- No need to manually update model lists
- Automatic detection of new models

### 4. API Key Fallback Mechanism

The application implements a **robust fallback system** to handle API rate limits:

#### Environment Variables
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

#### Fallback Logic
```typescript
When a request fails:
1. Try API Key 1 → If rate limited (429) or server error (5xx)
2. Try API Key 2 → If rate limited (429) or server error (5xx)
3. Try API Key 3 → If rate limited (429) or server error (5xx)
4. Show error to user if all keys fail
```

**Retryable Errors**:
- `429 Too Many Requests` (Rate limit)
- `500-599` (Server errors)

**Non-Retryable Errors**:
- `401 Unauthorized` (Invalid API key)
- `403 Forbidden` (Permission denied)
- `400 Bad Request` (Invalid request)
- Network errors (connection issues)

### 5. Removed Local Provider Support

**Why Removed?**
- Demo application focuses on cloud-based inference
- Simplifies the codebase
- Reduces maintenance burden
- Better suited for Vercel deployment

**What Was Removed**:
- LM Studio provider configuration
- llama.cpp provider configuration
- Local provider URL settings in UI
- Local model entries from model registry

## Architecture

### Frontend Stack
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **UI Components**: ShadCN UI
- **Styling**: Tailwind CSS
- **State Management**: React Context + LocalStorage
- **Routing**: React Router

### Document Processing Pipeline
```
Upload → Parse → Chunk → Index → Search → Generate
  ↓        ↓       ↓       ↓       ↓        ↓
 File   Extract  Split   TF-IDF  Retrieve  LLM
```

### LLM Integration Flow
```
User Message
    ↓
Retrieve Relevant Chunks (TF-IDF)
    ↓
Build Context Prompt
    ↓
Try API Key 1 → Success? → Stream Response
    ↓ (429/5xx)
Try API Key 2 → Success? → Stream Response
    ↓ (429/5xx)
Try API Key 3 → Success? → Stream Response
    ↓ (All failed)
Show Error Message
```

## Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Groq API Keys
VITE_GROQ_API_KEY_1=gsk_xxxxxxxxxxxxx
VITE_GROQ_API_KEY_2=gsk_yyyyyyyyyyyyy
VITE_GROQ_API_KEY_3=gsk_zzzzzzzzzzzzz

# Cerebras API Keys
VITE_CEREBRAS_API_KEY_1=csk_xxxxxxxxxxxxx
VITE_CEREBRAS_API_KEY_2=csk_yyyyyyyyyyyyy
VITE_CEREBRAS_API_KEY_3=csk_zzzzzzzzzzzzz
```

**Note**: All variables must be prefixed with `VITE_` to be accessible in the frontend.

### Getting API Keys

#### Groq
1. Visit [Groq Console](https://console.groq.com/)
2. Sign up / Log in
3. Navigate to API Keys section
4. Create 3 API keys for fallback
5. Copy keys to `.env` file

#### Cerebras
1. Visit [Cerebras Cloud](https://cloud.cerebras.ai/)
2. Sign up / Log in
3. Navigate to API Keys section
4. Create 3 API keys for fallback
5. Copy keys to `.env` file

## Usage

### 1. Start Development Server
```bash
npm install
npm run dev
```

### 2. Configure LLM Provider
1. Click on Settings (gear icon)
2. Select provider (Groq or Cerebras)
3. Click "Connect & Fetch Models"
4. Select a model from the dropdown
5. Click "Save"

### 3. Upload Documents
1. Click the paperclip icon in the chat input
2. Select PDF, DOCX, or TXT files
3. Wait for processing (parsing, chunking, indexing)
4. Documents are now available for querying

### 4. Chat with Documents
1. Type your question in the chat input
2. The system retrieves relevant chunks
3. Sends context + question to LLM
4. Streams response back to UI
5. View source citations below response

### 5. Manage API Keys
1. Go to Settings → API Keys
2. View system keys (from environment)
3. Add custom keys if needed
4. Test keys with "Test" button
5. Set preferred key for each provider

## Features Breakdown

### Document Management
- ✅ Upload multiple documents
- ✅ Delete documents
- ✅ View document metadata (size, chunks, upload date)
- ✅ Project-based document sharing
- ✅ Chat-specific documents

### Chat Features
- ✅ Multiple chat sessions
- ✅ Project-based chat organization
- ✅ Streaming responses
- ✅ Source citations
- ✅ Copy response to clipboard
- ✅ Regenerate responses
- ✅ Markdown rendering with syntax highlighting

### Settings
- ✅ Provider selection (Groq, Cerebras)
- ✅ Dynamic model fetching
- ✅ API key management
- ✅ Fallback configuration
- ✅ Theme toggle (Light/Dark/System)
- ✅ Chat behavior preferences

### Projects
- ✅ Create projects
- ✅ Rename projects
- ✅ Delete projects
- ✅ Attach/detach chats
- ✅ Shared document libraries

## Technical Details

### Vector Store Implementation

The application uses a **TF-IDF based vector store** for document retrieval:

```typescript
// Indexing
1. Tokenize document chunks
2. Calculate Term Frequency (TF)
3. Calculate Inverse Document Frequency (IDF)
4. Compute TF-IDF vectors
5. Store in memory

// Search
1. Tokenize query
2. Calculate query TF-IDF vector
3. Compute cosine similarity with all chunks
4. Return top-K most similar chunks
```

**Advantages**:
- No external embedding API required
- Fast in-memory search
- Works offline
- No additional costs

### Streaming Implementation

```typescript
// SSE (Server-Sent Events) parsing
1. Send request with stream: true
2. Read response as stream
3. Parse SSE format: "data: {...}\n\n"
4. Extract delta content
5. Update UI in real-time
6. Handle [DONE] signal
```

### Error Handling

```typescript
// Comprehensive error handling
1. Network errors → Show connection error
2. API errors → Show provider error
3. Rate limits → Automatic fallback
4. Invalid config → Show configuration error
5. Document processing → Show processing error
```

## Deployment

### Vercel Deployment

1. **Set Environment Variables** in Vercel Dashboard:
   - `VITE_GROQ_API_KEY_1`
   - `VITE_GROQ_API_KEY_2`
   - `VITE_GROQ_API_KEY_3`
   - `VITE_CEREBRAS_API_KEY_1`
   - `VITE_CEREBRAS_API_KEY_2`
   - `VITE_CEREBRAS_API_KEY_3`

2. **Deploy**:
   ```bash
   vercel --prod
   ```

3. **Access**: Your app will be available at the Vercel URL

### Other Platforms

The app can be deployed to any static hosting platform:
- Netlify
- GitHub Pages
- Cloudflare Pages
- AWS S3 + CloudFront

**Important**: Ensure environment variables are set in the hosting platform's dashboard.

## Security Considerations

### API Key Security
- ✅ API keys stored in environment variables
- ✅ Keys never exposed in client-side code
- ✅ Keys masked in UI (only last 4 characters shown)
- ✅ Keys stored separately in localStorage
- ⚠️ Keys are still accessible in browser (client-side app)

### Recommendations for Production
1. Use a backend proxy for API calls
2. Implement rate limiting on your backend
3. Add authentication/authorization
4. Use server-side environment variables
5. Implement proper secret management

## Troubleshooting

### "No model configured" Error
**Cause**: No model selected in settings

**Solution**:
1. Go to Settings
2. Select a provider (Groq or Cerebras)
3. Click "Connect & Fetch Models"
4. Select a model from the dropdown
5. Click "Save"

### "NetworkError when attempting to fetch resource"
**Cause**: Cannot connect to LLM provider

**Solution**:
1. Check internet connection
2. Verify API keys are correct
3. Check provider status page
4. Try a different provider
5. Check firewall/proxy settings

### API Key Rate Limit
**Cause**: Exceeded rate limit for current API key

**Solution**:
1. Wait for rate limit to reset (usually 1 minute)
2. Application will automatically try next key
3. If all keys fail, wait before retrying
4. Consider adding more API keys

### Documents Not Processing
**Cause**: File format not supported or file too large

**Solution**:
1. Check file format (PDF, DOCX, TXT only)
2. Try a smaller file
3. Check browser console for errors
4. Clear browser cache and retry

## Performance Optimization

### Bundle Size
- Current bundle: ~1.7 MB (gzipped: ~527 KB)
- Main contributors:
  - pdfjs-dist: PDF parsing
  - mammoth: DOCX parsing
  - react-markdown: Markdown rendering

### Optimization Tips
1. **Code Splitting**: Lazy load heavy components
2. **Tree Shaking**: Remove unused code
3. **Compression**: Enable gzip/brotli
4. **CDN**: Use CDN for static assets
5. **Caching**: Implement proper cache headers

## Future Enhancements

### Planned Features
- [ ] Backend API for production use
- [ ] User authentication
- [ ] Database storage for chats
- [ ] Real-time collaboration
- [ ] Advanced RAG with embeddings
- [ ] Multi-modal support (images, audio)
- [ ] Export chats as PDF/Markdown
- [ ] Chat templates
- [ ] Advanced search filters

### Potential Improvements
- [ ] Use actual embeddings (OpenAI, Cohere)
- [ ] Implement hybrid search (BM25 + embeddings)
- [ ] Add conversation memory
- [ ] Support more document formats
- [ ] Implement chunk overlap optimization
- [ ] Add document versioning

## API Reference

### LLM Providers

#### Groq
- **Base URL**: `https://api.groq.com/openai/v1`
- **Models**: Dynamically fetched
- **Rate Limit**: Varies by plan
- **Documentation**: https://console.groq.com/docs

#### Cerebras
- **Base URL**: `https://api.cerebras.ai/v1`
- **Models**: Dynamically fetched
- **Rate Limit**: Varies by plan
- **Documentation**: https://docs.cerebras.ai/

### Endpoints Used

#### List Models
```
GET /models
Authorization: Bearer {api_key}

Response:
{
  "data": [
    { "id": "model-name", ... },
    ...
  ]
}
```

#### Chat Completion (Streaming)
```
POST /chat/completions
Authorization: Bearer {api_key}
Content-Type: application/json

{
  "model": "model-name",
  "messages": [...],
  "temperature": 0.7,
  "max_tokens": 4096,
  "stream": true
}

Response: SSE stream
"data: {"choices":[{"delta":{"content":"..."}}]}\n\n"
"data: [DONE]\n\n"
```

## Contributing

### Development Setup
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
```

### Code Style
- TypeScript strict mode
- ESLint + Prettier
- Component-based architecture
- Functional components with hooks

### Testing
```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Build
npm run build
```

## License

MIT License - See LICENSE file for details

## Support

For issues and questions:
- GitHub Issues: [Create an issue](https://github.com/yourusername/docuchat/issues)
- Documentation: Check this README and QWEN.md
- API Docs: Check provider documentation

## Acknowledgments

- [Groq](https://groq.com) - Fast LLM inference
- [Cerebras](https://cerebras.ai) - Wafer-scale inference
- [ShadCN UI](https://ui.shadcn.com) - Component library
- [Tailwind CSS](https://tailwindcss.com) - Utility-first CSS
- [pdf.js](https://mozilla.github.io/pdf.js/) - PDF rendering
- [mammoth](https://github.com/mwilliamson/mammoth.js) - DOCX parsing

---

**Built with ❤️ for demonstrating AI-powered document chat**

**Version**: 2.0.0 (Pure Frontend Demo)
**Last Updated**: 2026
