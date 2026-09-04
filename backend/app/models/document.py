from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, Text, JSON
from backend.app.db.session import Base

class Document(Base):
    __tablename__ = "documents"

    id = Column(String, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_size_bytes = Column(Integer, default=0)
    total_pages = Column(Integer, default=0)
    total_chunks = Column(Integer, default=0)
    title = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="indexed")  # indexing, indexed, failed

class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id = Column(String, primary_key=True, index=True)
    document_id = Column(String, index=True, nullable=False)
    chunk_index = Column(Integer, nullable=False)
    page_number = Column(Integer, nullable=False)  # 1-indexed
    bbox = Column(JSON, nullable=False)  # [x0, y0, x1, y1] in PDF points
    bbox_normalized = Column(JSON, nullable=True)  # [x0, y0, x1, y1] normalized (0 to 1)
    content = Column(Text, nullable=False)
    section_title = Column(String, nullable=True)
    token_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
