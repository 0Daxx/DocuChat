# backend/app/config.py
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # Database
    SUPABASE_URL: Optional[str] = None
    SUPABASE_KEY: Optional[str] = None
    
    # NLP Models
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"
    MODEL_CACHE_DIR: str = "./models/sentence_transformers"
    
    # Chunking Strategy (Academic papers usually benefit from slightly larger chunks)
    CHUNK_SIZE: int = 500
    CHUNK_OVERLAP: int = 50
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()