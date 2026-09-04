import os
from pathlib import Path
from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parent.parent.parent

class Settings(BaseSettings):
    PROJECT_NAME: str = "IP-SAKTI Sahayak Legal RAG"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Storage paths
    DATA_DIR: Path = BASE_DIR / "data"
    UPLOAD_DIR: Path = BASE_DIR / "uploads"
    SAMPLE_DIR: Path = BASE_DIR / "samples"
    
    # Qdrant configuration
    # Can connect to Docker (http://localhost:6333) or fallback to local disk storage
    USE_REMOTE_QDRANT: bool = False
    QDRANT_HOST: str = "localhost"
    QDRANT_PORT: int = 6333
    QDRANT_COLLECTION: str = "ip_sakti_legal_docs"
    QDRANT_LOCAL_PATH: Path = BASE_DIR / "data" / "qdrant_storage"
    
    # Database configuration (PostgreSQL with SQLite fallback)
    USE_POSTGRES: bool = False
    POSTGRES_URL: str = "postgresql://ipsakti_user:ipsakti_password@localhost:5432/ipsakti_db"
    SQLITE_URL: str = f"sqlite:///{BASE_DIR}/data/ipsathi.db"
    
    # LLM & Generation configuration
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    DEFAULT_LLM_MODEL: str = "groq/llama-3.3-70b-versatile"
    
    # Embedding configuration
    # BAAI/bge-large-en-v1.5 has 1024 dimensions
    DENSE_VECTOR_SIZE: int = 1024
    EMBEDDING_MODEL_NAME: str = "BAAI/bge-large-en-v1.5"

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()

# Ensure directories exist
settings.DATA_DIR.mkdir(parents=True, exist_ok=True)
settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
settings.SAMPLE_DIR.mkdir(parents=True, exist_ok=True)
settings.QDRANT_LOCAL_PATH.mkdir(parents=True, exist_ok=True)
