from typing import List, Optional
from pydantic import BaseModel, Field

class Citation(BaseModel):
    citation_id: str = Field(..., description="Unique identifier for the citation reference, e.g. '[1]', '[2]'")
    source_document: str = Field(..., description="Name or title of the cited document, e.g. 'The Patents Act, 1970'")
    page_number: int = Field(..., description="1-indexed page number where the supporting text is located")
    bbox: List[float] = Field(..., description="Bounding box coordinates [x0, y0, x1, y1] for the cited text snippet")
    highlight_text: str = Field(..., description="Verbatim text quote from the page supporting the claim")
    relevance_summary: str = Field(..., description="Concise rationale explaining how this section supports the legal analysis")

class LLMStructuredOutput(BaseModel):
    answer: str = Field(..., description="Comprehensive, legally accurate synthesis answering the user query with citation keys like [1], [2]")
    citations: List[Citation] = Field(default_factory=list, description="Array of exact citations supporting the answer")

class ChatRequest(BaseModel):
    query: str = Field(..., min_length=2, description="Legal query or patent search prompt")
    document_id: Optional[str] = Field(None, description="Optional document filter to constrain retrieval")
    top_k: int = Field(default=5, ge=1, le=20, description="Number of legal chunks to retrieve via hybrid search")
    language: Optional[str] = Field(default="English", description="Target response language (e.g. English, Hindi, Marathi, Tamil, Bengali)")

class ChatResponse(BaseModel):
    answer: str
    citations: List[Citation]
    model: str
    query: str
    language: str = "English"
    retrieved_chunks_count: int
    latency_ms: float

