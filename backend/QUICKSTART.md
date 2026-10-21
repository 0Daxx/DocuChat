# Backend Quick Start Guide

## Prerequisites

1. **Python 3.10+**
   ```bash
   python --version  # Should be 3.10 or higher
   ```

2. **Supabase Account**
   - Sign up at https://supabase.com
   - Create a new project
   - Enable pgvector extension in SQL Editor

3. **LLM API Keys** (at least one)
   - Groq: https://console.groq.com/keys
   - Cerebras: https://cloud.cerebras.ai/

## Setup Steps

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

**Note**: First install may take a few minutes as it downloads the embedding model (~80MB).

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and add your credentials:

```env
# Supabase (required)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-anon-key

# LLM Providers (at least one required)
GROQ_API_KEY=your-groq-key
CEREBRAS_API_KEY=your-cerebras-key

# Optional
LOCAL_LLM_URL=http://localhost:1234/v1
```

### 3. Set Up Database

1. Go to your Supabase project → SQL Editor
2. Run the schema:
   ```sql
   -- Copy contents from backend/supabase_schema.sql
   ```
3. Verify tables created:
   - `documents`
   - `document_chunks`

### 4. Start Backend Server

```bash
uvicorn app.main:app --reload --port 8000
```

You should see:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.
```

### 5. Test the API

#### Health Check
```bash
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "DocuChat API",
  "version": "1.0.0"
}
```

#### Upload a Document
```bash
curl -X POST http://localhost:8000/api/upload \
  -F "file=@/path/to/your/document.pdf"
```

Expected response:
```json
{
  "document_id": "abc-123-def",
  "message": "Document processed successfully",
  "chunk_count": 42
}
```

#### Ask a Question
```bash
curl -X POST http://localhost:8000/api/ask \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What is the main topic of this document?",
    "document_id": "abc-123-def"
  }'
```

Expected response:
```json
{
  "answer": "The main topic is...",
  "sources": [
    {
      "page_number": 1,
      "chunk_index": 0,
      "text": "..."
    }
  ],
  "provider": "groq"
}
```

#### List Documents
```bash
curl http://localhost:8000/api/documents
```

## Common Issues

### Issue: "ModuleNotFoundError: No module named 'sentence_transformers'"
**Solution**: 
```bash
pip install -r requirements.txt
```

### Issue: "Could not connect to Supabase"
**Solution**: 
- Check `SUPABASE_URL` and `SUPABASE_KEY` in `.env`
- Verify Supabase project is active
- Check network connection

### Issue: "pgvector extension not found"
**Solution**:
```sql
-- Run in Supabase SQL Editor
CREATE EXTENSION IF NOT EXISTS vector;
```

### Issue: "LLM generation failed"
**Solution**:
- Check API keys in `.env`
- Verify API keys are valid
- Try a different provider (Groq → Cerebras → Local)

### Issue: "Embedding model download failed"
**Solution**:
- Check internet connection
- Model downloads on first use (~80MB)
- Try manual download: https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2

## API Documentation

Once the server is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Development Tips

### Enable Debug Logging
Add to `app/main.py`:
```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

### Test with Different Models
Edit `.env`:
```env
EMBEDDING_MODEL=all-MiniLM-L6-v2  # or try other models
CHUNK_SIZE=512                     # adjust chunk size
TOP_K=5                            # retrieve more chunks
```

### Monitor Performance
Check Supabase dashboard for:
- Query performance
- Storage usage
- API calls

## Next Steps

1. **Integrate with Frontend**
   ```bash
   cd frontend
   npm run dev
   ```
   Update `VITE_API_URL=http://localhost:8000` in frontend `.env`

2. **Deploy to Vercel**
   ```bash
   vercel --prod
   ```
   Set environment variables in Vercel dashboard

3. **Add Authentication**
   - Integrate Supabase Auth
   - Add user-specific document storage
   - Implement RLS policies

## Support

For issues:
1. Check logs in terminal
2. Verify all environment variables
3. Test with curl commands above
4. Check Supabase dashboard for errors

---

**Status**: ✅ Ready for Development
**Last Updated**: 2026
