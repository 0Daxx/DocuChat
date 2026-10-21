"""
Document chunking module using langchain's RecursiveCharacterTextSplitter.
"""

from langchain_text_splitters import RecursiveCharacterTextSplitter
from typing import List, Dict, Any
from ..config import settings


def chunk_pages(pages: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Chunk extracted pages into smaller semantic chunks.
    
    Args:
        pages: List of page dicts with 'text' and 'page_number'
        
    Returns:
        List of chunk dicts with 'text', 'page_number', and 'chunk_index'
    """
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=settings.CHUNK_SIZE,
        chunk_overlap=settings.CHUNK_OVERLAP,
        length_function=len,
        separators=["\n\n", "\n", ". ", " ", ""]
    )
    
    chunks = []
    chunk_index = 0
    
    for page in pages:
        page_text = page["text"]
        page_number = page["page_number"]
        
        # Split page into chunks
        page_chunks = text_splitter.split_text(page_text)
        
        for chunk_text in page_chunks:
            if chunk_text.strip():
                chunks.append({
                    "text": chunk_text,
                    "page_number": page_number,
                    "chunk_index": chunk_index
                })
                chunk_index += 1
    
    return chunks
