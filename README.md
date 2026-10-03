# DocuChat - AI-Powered Question Answering System for Academic Documents

A full-stack RAG (Retrieval Augmented Generation) application that allows users to upload academic documents (PDF, DOCX, PPTX) and ask questions based on their content using advanced NLP and LLM technologies.

## 🏗️ Architecture

```
├── /frontend          # React/TypeScript Frontend
│   ├── /src
│   │   ├── /components # ShadCN UI components
│   │   ├── /lib        # API clients, utilities
│   │   └── App.tsx
│   └── package.json
├── /backend           # FastAPI Backend
│   ├── /app
│   │   ├── /nlp        # NLP Pipeline (extract, chunk, embed)
│   │   ├── /api        # API Routes
│   │   ├── main.py     # FastAPI app
│   │   ├── storage.py  # Supabase integration
│   │   └── llm.py      # LLM generation with fallback
│   ├── requirements.txt
│   └── vercel.json
└── README.md
```

## ✨ Features

### Frontend
- 🎨 Modern UI with ShadCN components
- 🌓 Dark/Light mode support
- 📱 Fully responsive design
- 💬 Real-time chat interface
- 📄 Document management
- 🔄 API key fallback system (6 keys)
- 📝 Markdown rendering with syntax highlighting

### Backend
- 📚 Multi-format document support (PDF, DOCX, PPTX)
- 🔍 Advanced NLP pipeline with semantic chunking
- 🧠 Vector embeddings using all-MiniLM-L6-v2
- 💾 Supabase pgvector for efficient similarity search
- 🤖 Cascading LLM fallback (Groq → Cerebras → Local)
- 🚀 Vercel serverless deployment ready

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Python 3.10+
- Supabase account with pgvector extension enabled
- At least one LLM API key (Groq or Cerebras)

### 1. Clone and Install

```bash
# Clone the repository
git clone <your-repo-url>
cd docuchat

# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
pip install -r requirements.txt
```

### 2. Configure Environment Variables

#### Frontend (.env)
```bash
cd frontend
cp .env.example .env
```

Edit `.env`:
```env
VITE_API_URL=http://localhost:8000

# Groq API Keys (3 keys for fallback)
VITE_GROQ_API_KEY_1=your-groq-key-1
VITE_GROQ_API_KEY_2=your-groq-key-2
VITE_GROQ_API_KEY_3=your-groq-key-3

# Cerebras API Keys (3 keys for fallback)
VITE_CEREBRAS_API_KEY_1=your-cerebras-key-1
VITE_CEREBRAS_API_KEY_2=your-cerebras-key-2
VITE_CEREBRAS_API_KEY_3=your-cerebras-key-3
```

#### Backend (.env)
```bash
cd backend
cp .env.example .env
```

Edit `.env`:
```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-anon-key

# LLM Providers (at least one required)
GROQ_API_KEY=your-groq-api-key
CEREBRAS_API_KEY=your-cerebras-api-key

# Local LLM (optional)
LOCAL_LLM_URL=http://localhost:1234/v1
```

### 3. Set Up Supabase Database

1. Create a new Supabase project at https://supabase.com
2. Enable the `pgvector` extension in SQL Editor:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```
3. Run the schema from `backend/supabase_schema.sql` in the SQL Editor

### 4. Run the Application

#### Start Backend
```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

#### Start Frontend
```bash
cd frontend
npm run dev
```

Open http://localhost:5173 in your browser.

## 📖 Usage

### 1. Upload Documents
- Click the upload button in the chat interface
- Select PDF, DOCX, or PPTX files
- Wait for processing (text extraction, chunking, embedding)

### 2. Ask Questions
- Type your question in the chat input
- The system will:
  1. Embed your question
  2. Search for relevant chunks using cosine similarity
  3. Generate an answer using the LLM with retrieved context
  4. Display the answer with source citations

### 3. Manage Documents
- View all uploaded documents in the sidebar
- Delete documents when no longer needed
- Documents persist across sessions

## 🔧 API Endpoints

### POST /api/upload
Upload and process a document.

**Request:**
```
Content-Type: multipart/form-data
file: <binary file>
```

**Response:**
```json
{
  "document_id": "uuid",
  "message": "Document processed successfully",
  "chunk_count": 42
}
```

### POST /api/ask
Ask a question about uploaded documents.

**Request:**
```json
{
  "question": "What is the main contribution of this paper?",
  "document_id": "uuid"  // optional
}
```

**Response:**
```json
{
  "answer": "The main contribution is...",
  "sources": [
    {
      "page_number": 3,
      "chunk_index": 7,
      "text": "..."
    }
  ],
  "provider": "groq"
}
```

### GET /api/documents
List all uploaded documents.

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "paper.pdf",
    "file_type": "pdf",
    "chunk_count": 42,
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

### DELETE /api/documents/{document_id}
Delete a document and all its chunks.

## 🧠 NLP Pipeline

### 1. Extraction
- **PDF**: Uses `pdfplumber` for accurate text extraction with page numbers
- **DOCX**: Uses `python-docx` for paragraph extraction
- **PPTX**: Uses `python-pptx` for slide-by-slide extraction

### 2. Cleaning
- Removes headers, footers, and page numbers
- Normalizes whitespace
- Preserves semantic structure

### 3. Chunking
- Uses `RecursiveCharacterTextSplitter` from LangChain
- Chunk size: 512 tokens
- Overlap: 64 tokens
- Preserves page numbers and chunk indices

### 4. Embedding
- Model: `all-MiniLM-L6-v2` (384 dimensions)
- Runs locally on CPU
- Optimized for semantic similarity

### 5. Storage
- Vectors stored in Supabase pgvector
- IVFFlat index for fast similarity search
- Metadata: document_id, page_number, chunk_index

### 6. Retrieval
- Cosine similarity search
- Top-K = 3 chunks by default
- Optional document filtering

### 7. Generation
- Cascading fallback: Groq → Cerebras → Local LLM
- Strict prompting: "Answer only from context"
- Source attribution included

## 🚢 Deployment

### Frontend (Vercel)
```bash
cd frontend
vercel --prod
```

Set environment variables in Vercel dashboard:
- `VITE_API_URL`: Your backend URL
- All API keys

### Backend (Vercel Serverless)
```bash
cd backend
vercel --prod
```

Set environment variables in Vercel dashboard:
- `SUPABASE_URL`
- `SUPABASE_KEY`
- `GROQ_API_KEY`
- `CEREBRAS_API_KEY`
- `LOCAL_LLM_URL` (optional)

## 🔒 Security Notes

- API keys are stored in environment variables
- CORS is configured to allow all origins (restrict in production)
- Supabase RLS policies should be configured for multi-user scenarios
- Never commit `.env` files to version control

## 📊 Tech Stack

### Frontend
- React 18 + TypeScript
- Vite
- TailwindCSS + ShadCN UI
- React Router
- React Markdown

### Backend
- FastAPI
- Python 3.10+
- pdfplumber, python-docx, python-pptx
- sentence-transformers
- LangChain (chunking only)
- Supabase Python client
- httpx (async HTTP)
- Mangum (Vercel deployment)

### Database
- Supabase PostgreSQL
- pgvector extension
- IVFFlat indexing

## 🐛 Troubleshooting

### Backend won't start
- Check Python version: `python --version` (need 3.10+)
- Ensure all dependencies installed: `pip install -r requirements.txt`
- Verify `.env` file exists with all required variables

### Embedding model not loading
- First run downloads the model (~80MB)
- Ensure internet connection
- Check disk space

### Supabase connection failed
- Verify `SUPABASE_URL` and `SUPABASE_KEY` in `.env`
- Ensure pgvector extension is enabled
- Check schema was created successfully

### LLM generation failed
- Check API keys are valid
- Verify internet connection
- Check LLM provider status pages
- Try fallback providers

## 📝 License

MIT

## 🤝 Contributing

Contributions welcome! Please open an issue or PR.

## 📞 Support

For issues and questions, please open a GitHub issue.
