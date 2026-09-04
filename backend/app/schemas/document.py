from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel

class DocumentChunkSchema(BaseModel):
    id: str
    chunk_index: int
    page_number: int
    bbox: List[float]
    bbox_normalized: Optional[List[float]] = None
    content: str
    section_title: Optional[str] = None

class DocumentSchema(BaseModel):
    id: str
    filename: str
    title: Optional[str] = None
    total_pages: int
    total_chunks: int
    file_size_bytes: int
    created_at: datetime
    status: str
    pdf_url: str

class UploadResponse(BaseModel):
    document_id: str
    filename: str
    title: str
    total_pages: int
    total_chunks: int
    status: str
    pdf_url: str
    message: str
