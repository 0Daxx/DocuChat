"""
LLM generation module with cascading fallback.
Priority: Groq -> Cerebras -> Local LLM
"""

import httpx
from typing import List, Dict, Any, Optional
from ..config import settings


async def generate_with_groq(
    question: str,
    context: str,
    api_key: str
) -> Optional[str]:
    """
    Generate answer using Groq API.
    
    Args:
        question: User question
        context: Retrieved context from documents
        api_key: Groq API key
        
    Returns:
        Generated answer or None if failed
    """
    if not api_key:
        return None
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "mixtral-8x7b-32768",
                    "messages": [
                        {
                            "role": "system",
                            "content": "You are a helpful assistant that answers questions based ONLY on the provided context. If the answer is not in the context, say 'I don't have enough information to answer that question.' Do not make up information."
                        },
                        {
                            "role": "user",
                            "content": f"Context:\n{context}\n\nQuestion: {question}"
                        }
                    ],
                    "temperature": 0.7,
                    "max_tokens": 1000
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                return data["choices"][0]["message"]["content"]
            
        return None
    except Exception as e:
        print(f"Groq generation failed: {e}")
        return None


async def generate_with_cerebras(
    question: str,
    context: str,
    api_key: str
) -> Optional[str]:
    """
    Generate answer using Cerebras API.
    
    Args:
        question: User question
        context: Retrieved context from documents
        api_key: Cerebras API key
        
    Returns:
        Generated answer or None if failed
    """
    if not api_key:
        return None
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                "https://api.cerebras.ai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "cerebras-gpt-2.7b",
                    "messages": [
                        {
                            "role": "system",
                            "content": "You are a helpful assistant that answers questions based ONLY on the provided context. If the answer is not in the context, say 'I don't have enough information to answer that question.' Do not make up information."
                        },
                        {
                            "role": "user",
                            "content": f"Context:\n{context}\n\nQuestion: {question}"
                        }
                    ],
                    "temperature": 0.7,
                    "max_tokens": 1000
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                return data["choices"][0]["message"]["content"]
            
        return None
    except Exception as e:
        print(f"Cerebras generation failed: {e}")
        return None


async def generate_with_local(
    question: str,
    context: str,
    base_url: str
) -> Optional[str]:
    """
    Generate answer using local LLM (LM Studio or Ollama).
    
    Args:
        question: User question
        context: Retrieved context from documents
        base_url: Local LLM server URL
        
    Returns:
        Generated answer or None if failed
    """
    if not base_url:
        return None
    
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            # Try OpenAI-compatible endpoint (LM Studio)
            response = await client.post(
                f"{base_url}/v1/chat/completions",
                headers={"Content-Type": "application/json"},
                json={
                    "model": "local-model",
                    "messages": [
                        {
                            "role": "system",
                            "content": "You are a helpful assistant that answers questions based ONLY on the provided context. If the answer is not in the context, say 'I don't have enough information to answer that question.' Do not make up information."
                        },
                        {
                            "role": "user",
                            "content": f"Context:\n{context}\n\nQuestion: {question}"
                        }
                    ],
                    "temperature": 0.7,
                    "max_tokens": 1000
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                return data["choices"][0]["message"]["content"]
            
        return None
    except Exception as e:
        print(f"Local LLM generation failed: {e}")
        return None


async def generate_answer(
    question: str,
    context_chunks: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Generate answer with cascading fallback: Groq -> Cerebras -> Local.
    
    Args:
        question: User question
        context_chunks: List of retrieved chunks
        
    Returns:
        Dict with 'answer' and 'sources' keys
    """
    # Build context from chunks
    context_parts = []
    sources = []
    
    for i, chunk in enumerate(context_chunks, 1):
        context_parts.append(f"[Source {i} - Page {chunk['page_number']}]:\n{chunk['text']}")
        sources.append({
            "page_number": chunk["page_number"],
            "chunk_index": chunk["chunk_index"],
            "text": chunk["text"][:200] + "..." if len(chunk["text"]) > 200 else chunk["text"]
        })
    
    context = "\n\n".join(context_parts)
    
    # Try Groq first
    answer = await generate_with_groq(question, context, settings.GROQ_API_KEY)
    if answer:
        return {"answer": answer, "sources": sources, "provider": "groq"}
    
    # Fallback to Cerebras
    answer = await generate_with_cerebras(question, context, settings.CEREBRAS_API_KEY)
    if answer:
        return {"answer": answer, "sources": sources, "provider": "cerebras"}
    
    # Fallback to Local LLM
    answer = await generate_with_local(question, context, settings.LOCAL_LLM_URL)
    if answer:
        return {"answer": answer, "sources": sources, "provider": "local"}
    
    # All providers failed
    return {
        "answer": "I'm sorry, but I'm unable to generate an answer at this time. All LLM providers are unavailable.",
        "sources": sources,
        "provider": "none"
    }
