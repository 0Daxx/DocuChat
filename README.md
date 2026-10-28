# DocuChat - AI Document Chat Demo

A pure frontend demo application for chatting with your documents using AI. Upload PDFs, DOCX, or TXT files and get instant answers powered by Groq and Cerebras.

## 🚀 Features

- **Document Upload**: Upload PDF, DOCX, or TXT files
- **AI-Powered Chat**: Ask questions about your documents
- **Multiple LLM Providers**: Support for Groq and Cerebras
- **Automatic Fallback**: If one API key is exhausted, automatically switches to another
- **Project Organization**: Group related chats into projects
- **Shared Documents**: Projects can share documents across multiple chats
- **Markdown Support**: Full markdown rendering with syntax highlighting
- **Dark/Light Mode**: Theme toggle with system preference detection
- **Responsive Design**: Works on mobile, tablet, and desktop
- **100% Client-Side**: All processing happens in your browser

## 🎯 How It Works

1. **Upload Documents**: Click the paperclip icon in the chat input to upload documents
2. **Ask Questions**: Type your question in the chat input
3. **Get Answers**: The AI retrieves relevant chunks from your documents and generates answers
4. **View Sources**: See which parts of your documents were used to answer your question

## 🔑 API Keys

The application uses 6 API keys (3 for Groq, 3 for Cerebras) with automatic fallback:

- When one API key hits its rate limit, the app automatically switches to the next available key
- All API keys are stored in environment variables (never exposed in code)
- Keys are used in rotation to maximize availability

### Environment Variables

Create a `.env` file in the root directory:

```env
# Groq API Keys (3 keys for automatic fallback)
VITE_GROQ_API_KEY_1=your_groq_key_1
VITE_GROQ_API_KEY_2=your_groq_key_2
VITE_GROQ_API_KEY_3=your_groq_key_3

# Cerebras API Keys (3 keys for automatic fallback)
VITE_CEREBRAS_API_KEY_1=your_cerebras_key_1
VITE_CEREBRAS_API_KEY_2=your_cerebras_key_2
VITE_CEREBRAS_API_KEY_3=your_cerebras_key_3

# Local Provider URLs (optional)
VITE_LMSTUDIO_DEFAULT_URL=http://localhost:1234/v1
VITE_LLAMACPP_DEFAULT_URL=http://localhost:8080/v1
```

### Getting API Keys

**Groq:**
1. Go to https://console.groq.com/keys
2. Sign up / Sign in
3. Create API keys (create 3 for fallback)

**Cerebras:**
1. Go to https://cloud.cerebras.ai/
2. Sign up / Sign in
3. Create API keys (create 3 for fallback)

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + ShadCN UI
- **Document Processing**: 
  - PDF: pdf.js
  - DOCX: mammoth.js
  - TXT: Native browser API
- **Text Chunking**: Custom recursive chunking algorithm
- **Vector Search**: TF-IDF based retrieval (client-side)
- **LLM Providers**: Groq, Cerebras (direct API calls)
- **State Management**: React Context + localStorage

## 📦 Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🎨 Usage

### Basic Chat
1. Click "New chat" in the sidebar
2. Type your question and press Enter
3. Get AI-powered answers

### Document Chat
1. Click the paperclip icon (📎) in the chat input
2. Upload PDF, DOCX, or TXT files
3. Ask questions about your documents
4. View source citations in responses

### Projects
1. Create a project in the sidebar
2. Add chats to the project
3. Upload documents to the project (shared across all project chats)
4. Organize related conversations

### Settings
- **General**: Theme, chat behavior preferences
- **Usage & Billing**: View usage statistics
- **API**: Manage API keys, configure fallback behavior

## 🔒 Privacy & Security

- **100% Client-Side**: All document processing happens in your browser
- **No Server Storage**: Documents are never uploaded to any server
- **Local Storage**: All data is stored in your browser's localStorage
- **API Keys**: Stored in environment variables, never exposed in code
- **No Tracking**: No analytics or tracking code

## 🌐 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import your repository in Vercel
3. Add environment variables in Vercel dashboard:
   - `VITE_GROQ_API_KEY_1`, `VITE_GROQ_API_KEY_2`, `VITE_GROQ_API_KEY_3`
   - `VITE_CEREBRAS_API_KEY_1`, `VITE_CEREBRAS_API_KEY_2`, `VITE_CEREBRAS_API_KEY_3`
4. Deploy

### Netlify

1. Push your code to GitHub
2. Import your repository in Netlify
3. Add environment variables in Netlify dashboard
4. Deploy

### Other Platforms

The app is a standard Vite + React application. Deploy to any static hosting platform:
- GitHub Pages
- Cloudflare Pages
- AWS S3 + CloudFront
- Any static file hosting

## 📊 Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                      │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Document   │  │    Vector    │  │     Chat     │  │
│  │   Parser     │  │    Store     │  │   Interface  │  │
│  │  (PDF/DOCX)  │  │  (TF-IDF)    │  │              │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │         LLM Provider (Direct API Calls)          │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐ │   │
│  │  │   Groq     │  │  Cerebras  │  │   Local    │ │   │
│  │  │  (3 keys)  │  │  (3 keys)  │  │  (LM/llama)│ │   │
│  │  └────────────┘  └────────────┘  └────────────┘ │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │              localStorage (Persistence)           │   │
│  │  - Chat sessions  - Documents  - Preferences     │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## 🧪 Testing

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Type check
npx tsc --noEmit
```

## 📝 Supported File Types

- **PDF**: Full text extraction with page numbers
- **DOCX**: Paragraph extraction
- **TXT**: Plain text files

## 🎯 Features in Detail

### Document Processing
- **Parsing**: Extract text from PDF, DOCX, TXT
- **Chunking**: Split documents into semantic chunks (500 chars, 100 char overlap)
- **Indexing**: Build TF-IDF vector index for fast retrieval
- **Search**: Cosine similarity search for relevant chunks

### Chat Features
- **Streaming Responses**: Real-time token streaming
- **Source Citations**: See which document chunks were used
- **Regenerate**: Regenerate responses with one click
- **Copy**: Copy responses to clipboard
- **Markdown**: Full markdown support with syntax highlighting

### Project Management
- **Create Projects**: Group related chats
- **Shared Documents**: Documents uploaded to projects are shared across all project chats
- **Chat Organization**: Attach/detach chats to projects
- **Visual Indicators**: See which project a chat belongs to

### API Key Management
- **Multiple Keys**: Support for multiple API keys per provider
- **Automatic Fallback**: Switch to next key on rate limit or error
- **Key Testing**: Test API keys before use
- **Preferred Key**: Mark one key as preferred per provider
- **Key Masking**: API keys are masked in the UI for security

## 🐛 Troubleshooting

### "No model configured" error
- Go to Settings > API
- Select a provider (Groq or Cerebras)
- Select a model from the dropdown
- Save settings

### "NetworkError" or API errors
- Check your internet connection
- Verify API keys are correct in `.env`
- Check if API keys have hit rate limits
- Try switching to a different provider

### Documents not uploading
- Check file type (PDF, DOCX, TXT only)
- Check file size (large files may take longer)
- Try a different browser
- Clear browser cache and localStorage

### Chat not responding
- Check browser console for errors
- Verify API keys are configured
- Try a different LLM provider
- Check if provider is experiencing issues

## 📚 Documentation

- [QWEN.md](./QWEN.md) - Project guidelines and specifications
- [notes.md](./notes.md) - Implementation notes
- [SETTINGS_REFACTORING.md](./SETTINGS_REFACTORING.md) - Settings page documentation

## 🤝 Contributing

This is a demo application. Contributions welcome!

## 📄 License

MIT

## 🙏 Acknowledgments

- [Groq](https://groq.com) - Fast LLM inference
- [Cerebras](https://cerebras.ai) - Wafer-scale inference
- [ShadCN UI](https://ui.shadcn.com) - Component library
- [Tailwind CSS](https://tailwindcss.com) - Utility-first CSS
- [pdf.js](https://mozilla.github.io/pdf.js/) - PDF rendering
- [mammoth.js](https://github.com/mwilliamson/mammoth.js) - DOCX parsing

---

**Built with ❤️ for demonstrating AI-powered document chat**
