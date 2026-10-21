"""
Comprehensive logging system for DocuChat.
Logs all operations: chat sessions, messages, documents, chunks, embeddings, extracts.
"""

import json
import os
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Log directory
LOG_DIR = Path("logs")
LOG_DIR.mkdir(exist_ok=True)

# Subdirectories for different log types
SESSIONS_LOG_DIR = LOG_DIR / "sessions"
DOCUMENTS_LOG_DIR = LOG_DIR / "documents"
MESSAGES_LOG_DIR = LOG_DIR / "messages"
NLP_LOG_DIR = LOG_DIR / "nlp"

for dir_path in [SESSIONS_LOG_DIR, DOCUMENTS_LOG_DIR, MESSAGES_LOG_DIR, NLP_LOG_DIR]:
    dir_path.mkdir(exist_ok=True)


def get_timestamp() -> str:
    """Get current timestamp in ISO format."""
    return datetime.now().isoformat()


def log_session(session_id: str, action: str, data: Dict[str, Any]) -> None:
    """
    Log chat session operations.
    
    Args:
        session_id: Unique session identifier
        action: Action type (created, updated, deleted, message_added)
        data: Additional data about the action
    """
    log_entry = {
        "timestamp": get_timestamp(),
        "session_id": session_id,
        "action": action,
        **data
    }
    
    log_file = SESSIONS_LOG_DIR / f"session_{session_id}.jsonl"
    with open(log_file, "a", encoding="utf-8") as f:
        f.write(json.dumps(log_entry) + "\n")
    
    logger.info(f"Session logged: {session_id} - {action}")


def log_message(session_id: str, message_id: str, role: str, content: str, 
                metadata: Optional[Dict[str, Any]] = None) -> None:
    """
    Log chat messages.
    
    Args:
        session_id: Session identifier
        message_id: Message identifier
        role: Message role (user, assistant, system)
        content: Message content
        metadata: Additional metadata (sources, provider, etc.)
    """
    log_entry = {
        "timestamp": get_timestamp(),
        "session_id": session_id,
        "message_id": message_id,
        "role": role,
        "content": content,
        "metadata": metadata or {}
    }
    
    log_file = MESSAGES_LOG_DIR / f"session_{session_id}_messages.jsonl"
    with open(log_file, "a", encoding="utf-8") as f:
        f.write(json.dumps(log_entry) + "\n")
    
    logger.info(f"Message logged: {message_id} in session {session_id}")


def log_document_upload(document_id: str, filename: str, file_type: str, 
                       file_size: int, chunk_count: int) -> None:
    """
    Log document upload operations.
    
    Args:
        document_id: Document identifier
        filename: Original filename
        file_type: File type (pdf, docx, pptx, txt)
        file_size: File size in bytes
        chunk_count: Number of chunks created
    """
    log_entry = {
        "timestamp": get_timestamp(),
        "document_id": document_id,
        "filename": filename,
        "file_type": file_type,
        "file_size": file_size,
        "chunk_count": chunk_count,
        "action": "uploaded"
    }
    
    log_file = DOCUMENTS_LOG_DIR / f"document_{document_id}.jsonl"
    with open(log_file, "a", encoding="utf-8") as f:
        f.write(json.dumps(log_entry) + "\n")
    
    logger.info(f"Document upload logged: {document_id} - {filename}")


def log_document_delete(document_id: str, filename: str) -> None:
    """
    Log document deletion.
    
    Args:
        document_id: Document identifier
        filename: Document filename
    """
    log_entry = {
        "timestamp": get_timestamp(),
        "document_id": document_id,
        "filename": filename,
        "action": "deleted"
    }
    
    log_file = DOCUMENTS_LOG_DIR / f"document_{document_id}.jsonl"
    with open(log_file, "a", encoding="utf-8") as f:
        f.write(json.dumps(log_entry) + "\n")
    
    logger.info(f"Document deletion logged: {document_id} - {filename}")


def log_extraction(document_id: str, page_count: int, total_chars: int, 
                  pages: List[Dict[str, Any]]) -> None:
    """
    Log text extraction from documents.
    
    Args:
        document_id: Document identifier
        page_count: Number of pages extracted
        total_chars: Total characters extracted
        pages: List of page data with text and page numbers
    """
    log_entry = {
        "timestamp": get_timestamp(),
        "document_id": document_id,
        "action": "extraction",
        "page_count": page_count,
        "total_chars": total_chars,
        "pages": [
            {
                "page_number": p.get("page_number"),
                "text_length": len(p.get("text", "")),
                "text_preview": p.get("text", "")[:200] + "..." if len(p.get("text", "")) > 200 else p.get("text", "")
            }
            for p in pages
        ]
    }
    
    log_file = NLP_LOG_DIR / f"extraction_{document_id}.jsonl"
    with open(log_file, "a", encoding="utf-8") as f:
        f.write(json.dumps(log_entry) + "\n")
    
    logger.info(f"Extraction logged: {document_id} - {page_count} pages, {total_chars} chars")


def log_chunking(document_id: str, chunk_count: int, chunks: List[Dict[str, Any]]) -> None:
    """
    Log document chunking operations.
    
    Args:
        document_id: Document identifier
        chunk_count: Number of chunks created
        chunks: List of chunk data
    """
    log_entry = {
        "timestamp": get_timestamp(),
        "document_id": document_id,
        "action": "chunking",
        "chunk_count": chunk_count,
        "chunks": [
            {
                "chunk_index": c.get("chunk_index"),
                "page_number": c.get("page_number"),
                "text_length": len(c.get("text", "")),
                "text_preview": c.get("text", "")[:200] + "..." if len(c.get("text", "")) > 200 else c.get("text", "")
            }
            for c in chunks
        ]
    }
    
    log_file = NLP_LOG_DIR / f"chunking_{document_id}.jsonl"
    with open(log_file, "a", encoding="utf-8") as f:
        f.write(json.dumps(log_entry) + "\n")
    
    logger.info(f"Chunking logged: {document_id} - {chunk_count} chunks")


def log_embedding(document_id: str, chunk_count: int, embedding_dim: int, 
                 model_name: str) -> None:
    """
    Log embedding generation.
    
    Args:
        document_id: Document identifier
        chunk_count: Number of chunks embedded
        embedding_dim: Embedding dimension
        model_name: Embedding model name
    """
    log_entry = {
        "timestamp": get_timestamp(),
        "document_id": document_id,
        "action": "embedding",
        "chunk_count": chunk_count,
        "embedding_dim": embedding_dim,
        "model_name": model_name
    }
    
    log_file = NLP_LOG_DIR / f"embedding_{document_id}.jsonl"
    with open(log_file, "a", encoding="utf-8") as f:
        f.write(json.dumps(log_entry) + "\n")
    
    logger.info(f"Embedding logged: {document_id} - {chunk_count} chunks, dim={embedding_dim}")


def log_query(query: str, document_id: Optional[str], results_count: int, 
             results: List[Dict[str, Any]], provider: str) -> None:
    """
    Log query operations.
    
    Args:
        query: User query
        document_id: Optional document filter
        results_count: Number of results returned
        results: List of retrieved chunks
        provider: LLM provider used
    """
    log_entry = {
        "timestamp": get_timestamp(),
        "action": "query",
        "query": query,
        "document_id": document_id,
        "results_count": results_count,
        "provider": provider,
        "results": [
            {
                "page_number": r.get("page_number"),
                "chunk_index": r.get("chunk_index"),
                "similarity": r.get("similarity"),
                "text_preview": r.get("text", "")[:200] + "..." if len(r.get("text", "")) > 200 else r.get("text", "")
            }
            for r in results
        ]
    }
    
    # Use timestamp-based filename for queries
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
    log_file = NLP_LOG_DIR / f"query_{timestamp}.jsonl"
    with open(log_file, "a", encoding="utf-8") as f:
        f.write(json.dumps(log_entry) + "\n")
    
    logger.info(f"Query logged: {query[:50]}... - {results_count} results")


def log_error(error_type: str, error_message: str, context: Optional[Dict[str, Any]] = None) -> None:
    """
    Log errors with context.
    
    Args:
        error_type: Type of error
        error_message: Error message
        context: Additional context about the error
    """
    log_entry = {
        "timestamp": get_timestamp(),
        "error_type": error_type,
        "error_message": error_message,
        "context": context or {}
    }
    
    log_file = LOG_DIR / "errors.jsonl"
    with open(log_file, "a", encoding="utf-8") as f:
        f.write(json.dumps(log_entry) + "\n")
    
    logger.error(f"Error logged: {error_type} - {error_message}")


def get_log_summary() -> Dict[str, Any]:
    """
    Get a summary of all logs.
    
    Returns:
        Dictionary with log counts and statistics
    """
    summary = {
        "sessions": 0,
        "documents": 0,
        "messages": 0,
        "queries": 0,
        "errors": 0
    }
    
    # Count session logs
    for log_file in SESSIONS_LOG_DIR.glob("*.jsonl"):
        with open(log_file, "r", encoding="utf-8") as f:
            summary["sessions"] += sum(1 for _ in f)
    
    # Count document logs
    for log_file in DOCUMENTS_LOG_DIR.glob("*.jsonl"):
        with open(log_file, "r", encoding="utf-8") as f:
            summary["documents"] += sum(1 for _ in f)
    
    # Count message logs
    for log_file in MESSAGES_LOG_DIR.glob("*.jsonl"):
        with open(log_file, "r", encoding="utf-8") as f:
            summary["messages"] += sum(1 for _ in f)
    
    # Count query logs
    for log_file in NLP_LOG_DIR.glob("query_*.jsonl"):
        with open(log_file, "r", encoding="utf-8") as f:
            summary["queries"] += sum(1 for _ in f)
    
    # Count error logs
    error_file = LOG_DIR / "errors.jsonl"
    if error_file.exists():
        with open(error_file, "r", encoding="utf-8") as f:
            summary["errors"] = sum(1 for _ in f)
    
    return summary
