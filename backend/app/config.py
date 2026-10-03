from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Supabase
    SUPABASE_URL: str
    SUPABASE_KEY: str
    
    # LLM Providers
    GROQ_API_KEY: Optional[str] = None
    CEREBRAS_API_KEY: Optional[str] = None
    
    # Local LLM (optional)
    LOCAL_LLM_URL: Optional[str] = None
    
    # Embedding model
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"
    
    # Chunking parameters
    CHUNK_SIZE: int = 512
    CHUNK_OVERLAP: int = 64
    
    # Retrieval
    TOP_K: int = 3
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
