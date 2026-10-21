"""
Supabase storage module for document and vector storage.
"""

from supabase import create_client, Client
from typing import List, Dict, Any, Optional
from ..config import settings
import uuid


# Initialize Supabase client
supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)


def store_document(
    document_name: str,
    file_type: str,
    chunks: List[Dict[str, Any]],
    embeddings: List[List[float]]
) -> str:
    """
    Store document and its chunks with embeddings in Supabase.
    
    Args:
        document_name: Name of the uploaded document
        file_type: File extension (pdf, docx, pptx)
        chunks: List of chunk dicts with text, page_number, chunk_index
        embeddings: List of embedding vectors for each chunk
        
    Returns:
        document_id (UUID string)
    """
    document_id = str(uuid.uuid4())
    
    # Insert document metadata
    supabase.table("documents").insert({
        "id": document_id,
        "name": document_name,
        "file_type": file_type,
        "chunk_count": len(chunks)
    }).execute()
    
    # Insert chunks with embeddings
    chunk_records = []
    for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
        chunk_records.append({
            "id": str(uuid.uuid4()),
            "document_id": document_id,
            "text": chunk["text"],
            "page_number": chunk["page_number"],
            "chunk_index": chunk["chunk_index"],
            "embedding": embedding
        })
    
    # Insert in batches to avoid payload size limits
    batch_size = 50
    for i in range(0, len(chunk_records), batch_size):
        batch = chunk_records[i:i + batch_size]
        supabase.table("document_chunks").insert(batch).execute()
    
    return document_id


def search_similar_chunks(
    query_embedding: List[float],
    document_id: Optional[str] = None,
    top_k: int = None
) -> List[Dict[str, Any]]:
    """
    Search for similar chunks using cosine similarity in pgvector.
    
    Args:
        query_embedding: Query embedding vector
        document_id: Optional document_id to filter by
        top_k: Number of results to return (defaults to settings.TOP_K)
        
    Returns:
        List of matching chunks with similarity scores
    """
    if top_k is None:
        top_k = settings.TOP_K
    
    # Build the query
    query = supabase.rpc(
        "match_document_chunks",
        {
            "query_embedding": query_embedding,
            "match_count": top_k,
            "filter_document_id": document_id
        }
    ).execute()
    
    return query.data


def get_document(document_id: str) -> Optional[Dict[str, Any]]:
    """
    Get document metadata by ID.
    
    Args:
        document_id: Document UUID
        
    Returns:
        Document dict or None if not found
    """
    result = supabase.table("documents").select("*").eq("id", document_id).execute()
    
    if result.data:
        return result.data[0]
    return None


def list_documents() -> List[Dict[str, Any]]:
    """
    List all uploaded documents.
    
    Returns:
        List of document dicts
    """
    result = supabase.table("documents").select("*").order("created_at", desc=True).execute()
    return result.data


def delete_document(document_id: str) -> None:
    """
    Delete a document and all its chunks.
    
    Args:
        document_id: Document UUID
    """
    # Delete chunks first (cascading should handle this, but be explicit)
    supabase.table("document_chunks").delete().eq("document_id", document_id).execute()
    
    # Delete document
    supabase.table("documents").delete().eq("id", document_id).execute()
