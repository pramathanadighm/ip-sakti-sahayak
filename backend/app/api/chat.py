import time
from fastapi import APIRouter, HTTPException
from backend.app.schemas.chat import ChatRequest, ChatResponse
from backend.app.services.vector_store import vector_store
from backend.app.services.llm_service import llm_service
from backend.app.core.config import settings

router = APIRouter(prefix="/chat", tags=["Chat"])

@router.post("", response_model=ChatResponse)
async def chat_rag(request: ChatRequest):
    """
    Accepts a user legal/patent query string.
    Implements Hybrid Search (Dense Vector + BM25 Lexical) via Qdrant to retrieve top 5 legal chunks.
    Sends the chunks and query to the LLM.
    Returns structured JSON containing answer text and citations with exact page numbers and bboxes.
    """
    start_time = time.time()

    # 1. Retrieve top 5 chunks via Qdrant Hybrid Search (Dense + BM25 Lexical)
    try:
        retrieved_chunks = vector_store.hybrid_search(
            query=request.query,
            top_k=request.top_k,
            document_id=request.document_id
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Hybrid vector search failed: {str(e)}")

    # 2. Synthesize structured legal answer with verified citations and bboxes
    target_lang = request.language or "English"
    try:
        llm_output = llm_service.generate_legal_response(
            query=request.query,
            retrieved_chunks=retrieved_chunks,
            language=target_lang
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Legal synthesis failed: {str(e)}")

    latency = round((time.time() - start_time) * 1000, 2)
    active_model = settings.DEFAULT_LLM_MODEL if settings.GROQ_API_KEY else f"Enterprise Legal Synthesizer ({target_lang})"

    return ChatResponse(
        answer=llm_output.answer,
        citations=llm_output.citations,
        model=active_model,
        query=request.query,
        language=target_lang,
        retrieved_chunks_count=len(retrieved_chunks),
        latency_ms=latency
    )
