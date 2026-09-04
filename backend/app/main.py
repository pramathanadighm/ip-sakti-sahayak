from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.core.config import settings
from backend.app.db.session import engine, Base, SessionLocal
from backend.app.api.upload import router as upload_router
from backend.app.api.chat import router as chat_router
from backend.app.api.documents import router as documents_router
from backend.app.services.sample_data import seed_sample_document

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables
    Base.metadata.create_all(bind=engine)
    
    # Pre-seed Indian Patent Law sample document for out-of-the-box readiness
    db = SessionLocal()
    try:
        seed_sample_document(db)
    except Exception as e:
        print(f"Startup sample document seeding warning: {e}")
    finally:
        db.close()

    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Enterprise Legal & Patent RAG Platform for Indian Patent Law, CRI Guidelines, and Prior Art Analysis",
    lifespan=lifespan
)

# Configure CORS for Next.js frontend (localhost:3000) and dev environments
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routes under /api/v1
app.include_router(upload_router, prefix=settings.API_V1_STR)
app.include_router(chat_router, prefix=settings.API_V1_STR)
app.include_router(documents_router, prefix=settings.API_V1_STR)

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "platform": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "qdrant_mode": "remote" if settings.USE_REMOTE_QDRANT else "embedded_local",
        "db_mode": "postgres" if settings.USE_POSTGRES else "sqlite"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
