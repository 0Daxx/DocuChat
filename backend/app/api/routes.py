"""
API routes for document upload, question answering, and document listing.
"""

from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from typing import List, Optional
from pydantic import BaseModel
import os

from ..nlp import extract_document, chunk_pages, embed_texts, embed_query
from ..storage import store_document, search_similar_chunks, get_document, list_documents, delete_document
from ..llm import generate_answer
from ..logging_system import (
    log_document_upload,
    log_document_delete,
    log_extraction,
    log_chunking,
    log_embedding,
    log_query,
    log_error,
    log_session,
    log_message
)

router = APIRouter()


# Request/Response models
class AskRequest(BaseModel):
    question: str
    document_id: Optional[str] = None


class SourceResponse(BaseModel):
    page_number: int
    chunk_index: int
    text: str


class AskResponse(BaseModel):
    answer: str
    sources: List[SourceResponse]
    provider: str


class DocumentResponse(BaseModel):
    id: str
    name: str
    file_type: str
    chunk_count: int
    created_at: str


class UploadResponse(BaseModel):
    document_id: str
    message: str
    chunk_count: int


@router.post("/upload", response_model=UploadResponse)
async def upload_document(file: UploadFile = File(...)):
    """
    Upload and process a document (PDF, DOCX, or PPTX).
    
    1. Extract text from document
    2. Chunk the text
    3. Generate embeddings
    4. Store in Supabase with vectors
    
    Returns document_id for later querying.
    """
    # Validate file type
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in ['.pdf', '.docx', '.pptx']:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {file_ext}. Supported types: PDF, DOCX, PPTX"
        )
    
    try:
        # Read file content
        file_content = await file.read()
        
        # Extract text from document
        pages = extract_document(file_content, file_ext)
        if not pages:
            raise HTTPException(
                status_code=400,
                detail="Could not extract any text from the document"
            )
        
        # Log extraction
        total_chars = sum(len(page.get("text", "")) for page in pages)
        log_extraction(
            document_id="pending",  # Will be updated after storage
            page_count=len(pages),
            total_chars=total_chars,
            pages=pages
        )
        
        # Chunk the pages
        chunks = chunk_pages(pages)
        if not chunks:
            raise HTTPException(
                status_code=400,
                detail="Document is too short or contains no meaningful text"
            )
        
        # Log chunking
        log_chunking(
            document_id="pending",  # Will be updated after storage
            chunk_count=len(chunks),
            chunks=chunks
        )
        
        # Generate embeddings for all chunks
        chunk_texts = [chunk["text"] for chunk in chunks]
        embeddings = embed_texts(chunk_texts)
        
        # Log embedding
        from ..config import settings
        log_embedding(
            document_id="pending",  # Will be updated after storage
            chunk_count=len(chunks),
            embedding_dim=len(embeddings[0]) if embeddings else 0,
            model_name=settings.EMBEDDING_MODEL
        )
        
        # Store in Supabase
        document_id = store_document(
            document_name=file.filename,
            file_type=file_ext.strip('.'),
            chunks=chunks,
            embeddings=embeddings
        )
        
        # Log document upload
        log_document_upload(
            document_id=document_id,
            filename=file.filename,
            file_type=file_ext.strip('.'),
            file_size=len(file_content),
            chunk_count=len(chunks)
        )
        
        return UploadResponse(
            document_id=document_id,
            message="Document processed successfully",
            chunk_count=len(chunks)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        log_error(
            error_type="upload_error",
            error_message=str(e),
            context={"filename": file.filename, "file_type": file_ext}
        )
        raise HTTPException(
            status_code=500,
            detail=f"Error processing document: {str(e)}"
        )


@router.post("/ask", response_model=AskResponse)
async def ask_question(request: AskRequest):
    """
    Ask a question about uploaded document(s).
    
    1. Embed the question
    2. Search for similar chunks in Supabase
    3. Generate answer using LLM with retrieved context
    
    If document_id is provided, search only within that document.
    Otherwise, search across all documents.
    """
    try:
        # Validate document exists if specified
        if request.document_id:
            doc = get_document(request.document_id)
            if not doc:
                raise HTTPException(
                    status_code=404,
                    detail=f"Document not found: {request.document_id}"
                )
        
        # Embed the question
        query_embedding = embed_query(request.question)
        
        # Search for similar chunks
        similar_chunks = search_similar_chunks(
            query_embedding=query_embedding,
            document_id=request.document_id
        )
        
        if not similar_chunks:
            return AskResponse(
                answer="I couldn't find any relevant information in the uploaded documents to answer your question.",
                sources=[],
                provider="none"
            )
        
        # Generate answer using LLM
        result = await generate_answer(request.question, similar_chunks)
        
        # Log query
        log_query(
            query=request.question,
            document_id=request.document_id,
            results_count=len(similar_chunks),
            results=similar_chunks,
            provider=result["provider"]
        )
        
        # Convert sources to response model
        sources = [
            SourceResponse(
                page_number=src["page_number"],
                chunk_index=src["chunk_index"],
                text=src["text"]
            )
            for src in result["sources"]
        ]
        
        return AskResponse(
            answer=result["answer"],
            sources=sources,
            provider=result["provider"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        log_error(
            error_type="query_error",
            error_message=str(e),
            context={"question": request.question, "document_id": request.document_id}
        )
        raise HTTPException(
            status_code=500,
            detail=f"Error generating answer: {str(e)}"
        )


@router.get("/documents", response_model=List[DocumentResponse])
async def get_documents():
    """
    List all uploaded documents.
    """
    try:
        documents = list_documents()
        
        return [
            DocumentResponse(
                id=doc["id"],
                name=doc["name"],
                file_type=doc["file_type"],
                chunk_count=doc["chunk_count"],
                created_at=doc["created_at"]
            )
            for doc in documents
        ]
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error listing documents: {str(e)}"
        )


@router.delete("/documents/{document_id}")
async def remove_document(document_id: str):
    """
    Delete a document and all its chunks.
    """
    try:
        # Check if document exists
        doc = get_document(document_id)
        if not doc:
            raise HTTPException(
                status_code=404,
                detail=f"Document not found: {document_id}"
            )
        
        # Delete document and chunks
        delete_document(document_id)
        
        # Log document deletion
        log_document_delete(
            document_id=document_id,
            filename=doc["name"]
        )
        
        return {"message": "Document deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        log_error(
            error_type="delete_error",
            error_message=str(e),
            context={"document_id": document_id}
        )
        raise HTTPException(
            status_code=500,
            detail=f"Error deleting document: {str(e)}"
        )
