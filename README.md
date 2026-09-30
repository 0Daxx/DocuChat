# DocuChat - Demo Mode

A demo-only AI document chat application with Groq and Cerebras integration.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory with your API keys:

```env
# Groq API Keys (3 keys for automatic fallback)
VITE_GROQ_API_KEY_1=your_groq_api_key_1
VITE_GROQ_API_KEY_2=your_groq_api_key_2
VITE_GROQ_API_KEY_3=your_groq_api_key_3

# Cerebras API Keys (3 keys for automatic fallback)
VITE_CEREBRAS_API_KEY_1=your_cerebras_api_key_1
VITE_CEREBRAS_API_KEY_2=your_cerebras_api_key_2
VITE_CEREBRAS_API_KEY_3=your_cerebras_api_key_3
```

**Get your API keys:**
- Groq: https://console.groq.com/keys
- Cerebras: https://cloud.cerebras.ai/

### 3. Run Development Server
```bash
npm run dev
```

### 4. Start Demo
Open http://localhost:5173 and click "Start Demo"

## ✨ Features

- **AI Chat** - Chat with AI using Groq and Cerebras models
- **Document Upload** - Upload PDF, DOCX, or TXT files
- **RAG (Retrieval Augmented Generation)** - AI answers based on your documents
- **Project Organization** - Group chats into projects
- **API Key Fallback** - Automatic switching between 6 API keys on rate limits
- **Markdown Support** - Full markdown rendering with code highlighting
- **Local Storage** - All data persisted in your browser
- **Dark/Light Mode** - Theme toggle with system preference detection

## 🔑 API Key Management

The app uses 6 API keys (3 Groq + 3 Cerebras) with automatic fallback:

1. **Primary Key** - Used for all requests
2. **Fallback Keys** - Automatically used when primary key hits rate limit (429) or server error (5xx)
3. **Round Robin** - Cycles through all available keys

### System Keys vs User Keys
- **System Keys** - Loaded from environment variables (read-only in UI)
- **User Keys** - Can be added via Settings page (optional)

## 📁 Data Storage

All data is stored in browser localStorage:
- Chat sessions and messages
- Projects and organization
- Uploaded documents (metadata and chunks)
- User preferences
- Theme settings

**Note:** Data is stored locally and never sent to any server except the LLM providers.

## 🛠️ Tech Stack

- **Frontend:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS 4 + ShadCN UI
- **LLM Providers:** Groq, Cerebras, LM Studio, llama.cpp
- **Document Processing:** PDF.js, Mammoth.js
- **Vector Search:** TF-IDF based retrieval
- **State Management:** React Context + localStorage

## 📝 Notes

- This is a **demo-only** project - no authentication or database required
- All API keys must be provided via environment variables
- No server-side processing - everything runs in the browser
- Rate limit handling is automatic with 6-key fallback system

## 🔒 Security Notes

- API keys are exposed in the browser (client-side)
- For production use, consider a backend proxy to hide API keys
- Never commit `.env` file to version control
- Use `.env.example` as a template

## 📄 License

MIT
