import os
from typing import List
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.core.config import settings
from app.db.session import get_db
from app.models.document import Document
from app.schemas.document import DocumentSchema

router = APIRouter(prefix="/documents", tags=["Documents"])

@router.get("", response_model=List[DocumentSchema])
def list_documents(db: Session = Depends(get_db)):
    """Lists all indexed legal documents and patent files."""
    docs = db.query(Document).order_by(Document.created_at.desc()).all()
    results = []
    for d in docs:
        pdf_url = f"{settings.API_V1_STR}/documents/{d.id}/pdf"
        results.append(
            DocumentSchema(
                id=d.id,
                filename=d.filename,
                title=d.title or d.filename,
                total_pages=d.total_pages,
                total_chunks=d.total_chunks,
                file_size_bytes=d.file_size_bytes,
                created_at=d.created_at,
                status=d.status,
                pdf_url=pdf_url
            )
        )
    return results

@router.get("/{doc_id}/pdf")
def get_document_pdf(doc_id: str, db: Session = Depends(get_db)):
    """Streams the raw PDF file to display in the frontend PDF viewer."""
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc or not os.path.exists(doc.file_path):
        raise HTTPException(status_code=404, detail="Document PDF file not found.")

    return FileResponse(
        path=doc.file_path,
        media_type="application/pdf",
        filename=doc.filename,
        headers={"Content-Disposition": f'inline; filename="{doc.filename}"'}
    )
