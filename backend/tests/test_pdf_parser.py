import os
from pathlib import Path
from backend.app.services.sample_data import create_sample_pdf_if_missing, SAMPLE_DOC_FILENAME
from backend.app.services.pdf_parser import PDFParserService
from backend.app.core.config import settings

def test_sample_pdf_creation_and_bbox_extraction():
    sample_pdf_path = settings.SAMPLE_DIR / SAMPLE_DOC_FILENAME
    create_sample_pdf_if_missing(sample_pdf_path)

    assert sample_pdf_path.exists(), "Sample PDF file should exist on disk"

    # Test extraction
    result = PDFParserService.extract_blocks_and_chunks(str(sample_pdf_path))

    assert result["total_pages"] >= 3, f"Expected at least 3 pages, got {result['total_pages']}"
    assert result["total_chunks"] > 0, "Expected at least 1 extracted chunk"

    # Inspect first chunk
    first_chunk = result["chunks"][0]
    assert "page_number" in first_chunk
    assert "bbox" in first_chunk
    assert "content" in first_chunk

    # Verify bbox structure
    bbox = first_chunk["bbox"]
    assert len(bbox) == 4, "bbox must be [x0, y0, x1, y1]"
    assert bbox[0] < bbox[2], "x0 should be less than x1"
    assert bbox[1] < bbox[3], "y0 should be less than y1"
    assert first_chunk["page_number"] >= 1, "page_number must be 1-indexed"

    print("PyMuPDF bounding box and chunk extraction test passed successfully!")

if __name__ == "__main__":
    test_sample_pdf_creation_and_bbox_extraction()
