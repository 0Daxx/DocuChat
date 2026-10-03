"""
Embedding module using sentence-transformers.
"""

from sentence_transformers import SentenceTransformer
from typing import List
import numpy as np
from ..config import settings


# Load model once at module level (cached)
_model = None


def get_model() -> SentenceTransformer:
    """Get or initialize the embedding model."""
    global _model
    if _model is None:
        _model = SentenceTransformer(settings.EMBEDDING_MODEL)
    return _model


def embed_texts(texts: List[str]) -> List[List[float]]:
    """
    Embed a list of texts using the sentence-transformers model.
    
    Args:
        texts: List of text strings to embed
        
    Returns:
        List of embedding vectors (each is a list of floats)
    """
    model = get_model()
    embeddings = model.encode(texts, show_progress_bar=False)
    return embeddings.tolist()


def embed_query(query: str) -> List[float]:
    """
    Embed a single query text.
    
    Args:
        query: Query string to embed
        
    Returns:
        Embedding vector as list of floats
    """
    model = get_model()
    embedding = model.encode(query, show_progress_bar=False)
    return embedding.tolist()
