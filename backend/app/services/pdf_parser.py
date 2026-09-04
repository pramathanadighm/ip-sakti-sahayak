from typing import List, Dict, Any
import fitz  # PyMuPDF

class ExtractedBlock:
    def __init__(
        self,
        page_number: int,
        bbox: List[float],
        bbox_normalized: List[float],
        text: str,
        page_width: float,
        page_height: float
    ):
        self.page_number = page_number
        self.bbox = [round(v, 2) for v in bbox]
        self.bbox_normalized = [round(v, 4) for v in bbox_normalized]
        self.text = text.strip()
        self.page_width = round(page_width, 2)
        self.page_height = round(page_height, 2)

class PDFParserService:
    @staticmethod
    def extract_blocks_and_chunks(file_path: str, max_chunk_chars: int = 800) -> Dict[str, Any]:
        """
        Parses a PDF file using PyMuPDF (fitz).
        Extracts textual content while meticulously preserving page numbers,
        page dimensions, and bounding boxes (x0, y0, x1, y1).
        Groups contiguous semantic blocks into chunks while maintaining bounding box spans.
        """
        doc = fitz.open(file_path)
        total_pages = len(doc)
        all_blocks: List[ExtractedBlock] = []

        for page_idx in range(total_pages):
            page = doc[page_idx]
            page_num = page_idx + 1  # 1-indexed for standard PDF viewer navigation
            page_rect = page.rect
            width = page_rect.width
            height = page_rect.height

            # get_text("blocks") returns tuples: (x0, y0, x1, y1, text, block_no, block_type)
            # block_type 0 is text; 1 is image
            blocks = page.get_text("blocks")
            for b in blocks:
                if b[6] == 0:  # text block
                    text = b[4].strip()
                    if not text:
                        continue
                    
                    x0, y0, x1, y1 = b[0], b[1], b[2], b[3]
                    # Compute normalized coordinates (0.0 to 1.0)
                    norm_bbox = [
                        max(0.0, min(1.0, x0 / width if width > 0 else 0)),
                        max(0.0, min(1.0, y0 / height if height > 0 else 0)),
                        max(0.0, min(1.0, x1 / width if width > 0 else 0)),
                        max(0.0, min(1.0, y1 / height if height > 0 else 0)),
                    ]

                    all_blocks.append(
                        ExtractedBlock(
                            page_number=page_num,
                            bbox=[x0, y0, x1, y1],
                            bbox_normalized=norm_bbox,
                            text=text,
                            page_width=width,
                            page_height=height,
                        )
                    )

        # Now perform semantic chunking across blocks per page
        chunks: List[Dict[str, Any]] = []
        current_chunk_blocks: List[ExtractedBlock] = []
        current_char_count = 0
        current_page = None
        chunk_idx = 0

        for block in all_blocks:
            # We preserve page boundaries so each chunk has an unambiguous page_number and bbox
            if current_page is not None and (block.page_number != current_page or (current_char_count + len(block.text) > max_chunk_chars)):
                # Flush current chunk
                if current_chunk_blocks:
                    chunk_data = PDFParserService._create_chunk_from_blocks(
                        chunk_idx=chunk_idx,
                        blocks=current_chunk_blocks
                    )
                    chunks.append(chunk_data)
                    chunk_idx += 1
                    current_chunk_blocks = []
                    current_char_count = 0

            current_chunk_blocks.append(block)
            current_char_count += len(block.text)
            current_page = block.page_number

        # Flush final chunk
        if current_chunk_blocks:
            chunk_data = PDFParserService._create_chunk_from_blocks(
                chunk_idx=chunk_idx,
                blocks=current_chunk_blocks
            )
            chunks.append(chunk_data)

        doc.close()
        return {
            "total_pages": total_pages,
            "total_blocks": len(all_blocks),
            "total_chunks": len(chunks),
            "chunks": chunks
        }

    @staticmethod
    def _create_chunk_from_blocks(chunk_idx: int, blocks: List[ExtractedBlock]) -> Dict[str, Any]:
        """
        Creates a coherent chunk from a group of contiguous blocks on the same page.
        Computes the outer bounding box that encapsulates all blocks in the chunk.
        """
        combined_text = "\n\n".join(b.text for b in blocks)
        page_num = blocks[0].page_number
        page_width = blocks[0].page_width
        page_height = blocks[0].page_height

        min_x0 = min(b.bbox[0] for b in blocks)
        min_y0 = min(b.bbox[1] for b in blocks)
        max_x1 = max(b.bbox[2] for b in blocks)
        max_y1 = max(b.bbox[3] for b in blocks)

        min_norm_x0 = min(b.bbox_normalized[0] for b in blocks)
        min_norm_y0 = min(b.bbox_normalized[1] for b in blocks)
        max_norm_x1 = max(b.bbox_normalized[2] for b in blocks)
        max_norm_y1 = max(b.bbox_normalized[3] for b in blocks)

        # Detect potential legal section title (e.g. "Section 3", "3(k)", "CHAPTER II", etc.)
        first_line = blocks[0].text.split("\n")[0]
        section_title = first_line[:100] if len(first_line) > 3 else f"Page {page_num} Section"

        return {
            "chunk_index": chunk_idx,
            "page_number": page_num,
            "bbox": [round(min_x0, 2), round(min_y0, 2), round(max_x1, 2), round(max_y1, 2)],
            "bbox_normalized": [round(min_norm_x0, 4), round(min_norm_y0, 4), round(max_norm_x1, 4), round(max_norm_y1, 4)],
            "content": combined_text,
            "section_title": section_title,
            "token_count": len(combined_text.split()),
            "page_width": page_width,
            "page_height": page_height,
            "sub_blocks": [
                {
                    "bbox": b.bbox,
                    "bbox_normalized": b.bbox_normalized,
                    "text": b.text
                }
                for b in blocks
            ]
        }
