import os
import uuid
import shutil
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
from app.core.config import settings
from app.db.session import get_db
from app.models.document import Document
from app.schemas.document import UploadResponse
from app.services.pdf_parser import PDFParserService
from app.services.vector_store import vector_store

router = APIRouter(prefix="/upload", tags=["Upload"])

@router.post("", response_model=UploadResponse)
async def upload_pdf(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Accepts PDF files.
    Uses PyMuPDF to extract text along with bounding box (bbox) coordinates and page numbers.
    Chunks the text and pushes chunks + dense/sparse embeddings into Qdrant.
    """
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    doc_id = f"doc_{uuid.uuid4().hex[:12]}"
    clean_filename = file.filename.replace(" ", "_")
    saved_path = settings.UPLOAD_DIR / f"{doc_id}_{clean_filename}"

    try:
        # Save file to disk
        with open(saved_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        file_size = os.path.getsize(saved_path)

        # PyMuPDF extraction preserving bbox and page numbers
        parsed = PDFParserService.extract_blocks_and_chunks(str(saved_path))
        if parsed["total_chunks"] == 0:
            raise HTTPException(status_code=400, detail="Could not extract text from PDF. It may be scanned or empty.")

        # Document title from filename or first chunk
        title = file.filename.rsplit(".", 1)[0].replace("_", " ")

        # Database record
        doc_record = Document(
            id=doc_id,
            filename=file.filename,
            file_path=str(saved_path),
            file_size_bytes=file_size,
            total_pages=parsed["total_pages"],
            total_chunks=parsed["total_chunks"],
            title=title,
            status="indexed"
        )
        db.add(doc_record)
        db.commit()

        # Push chunks + dense & sparse embeddings into Qdrant
        vector_store.upsert_chunks(
            document_id=doc_id,
            source_document=file.filename,
            chunks=parsed["chunks"]
        )

        pdf_url = f"{settings.API_V1_STR}/documents/{doc_id}/pdf"

        return UploadResponse(
            document_id=doc_id,
            filename=file.filename,
            title=title,
            total_pages=parsed["total_pages"],
            total_chunks=parsed["total_chunks"],
            status="indexed",
            pdf_url=pdf_url,
            message="Document parsed with PyMuPDF bboxes and indexed into Qdrant hybrid vector store successfully."
        )

    except Exception as e:
        if saved_path.exists():
            saved_path.unlink(missing_ok=True)
        raise HTTPException(status_code=500, detail=f"Failed to process and index PDF: {str(e)}")
