"""
Model Manager for NLP Pipeline.
Handles downloading, caching, and validating embedding models.
"""
import os
from pathlib import Path
from sentence_transformers import SentenceTransformer
import logging

logger = logging.getLogger(__name__)

def get_local_model_path(model_name: str, cache_dir: Path) -> Path:
    """Get the expected local path for a model."""
    # sentence-transformers uses a specific folder structure: cache/models--<org>--<model>
    # We simplify by checking if the main config file exists in the cache root
    return cache_dir / model_name.replace("/", "--")

def ensure_model_available(model_name: str, cache_dir: Path) -> SentenceTransformer:
    """
    Ensures the model is downloaded and valid.
    
    Args:
        model_name: HuggingFace model name (e.g., 'all-MiniLM-L6-v2')
        cache_dir: Local directory to store models
        
    Returns:
        Loaded SentenceTransformer model
    """
    cache_dir.mkdir(parents=True, exist_ok=True)
    
    try:
        logger.info(f"Loading model: {model_name} from cache: {cache_dir}")
        
        # Attempt to load. If files are missing/corrupt, it will trigger download.
        # local_files_only=False allows it to check HF hub if cache is invalid
        model = SentenceTransformer(
            model_name, 
            cache_folder=str(cache_dir),
            local_files_only=False 
        )
        
        # Basic validation: Check if we can get a dimension
        dim = model.get_sentence_embedding_dimension()
        if dim is None:
            raise ValueError("Model loaded but has no defined embedding dimension.")
            
        logger.info(f"✅ Model validated successfully (Dim: {dim})")
        return model
        
    except Exception as e:
        logger.error(f"❌ Failed to load/validate model: {e}")
        # Force a fresh download by clearing the specific model folder if it exists
        model_folder = cache_dir / model_name.replace("/", "--")
        if model_folder.exists():
            logger.warning(f"🗑️ Clearing corrupted cache at: {model_folder}")
            import shutil
            shutil.rmtree(model_folder)
        
        # Retry once after clearing
        logger.info("🔄 Retrying download...")
        return SentenceTransformer(model_name, cache_folder=str(cache_dir))

# Singleton instance to avoid reloading in serverless environments
_model_instance = None

def get_embedding_model(model_name: str = None, cache_dir: Path = None) -> SentenceTransformer:
    """Global accessor for the embedding model."""
    global _model_instance
    if _model_instance is None:
        from app.config import settings
        model_name = model_name or settings.EMBEDDING_MODEL
        cache_dir = cache_dir or Path(settings.MODEL_CACHE_DIR if hasattr(settings, 'MODEL_CACHE_DIR') else "./models")
        _model_instance = ensure_model_available(model_name, cache_dir)
    return _model_instance