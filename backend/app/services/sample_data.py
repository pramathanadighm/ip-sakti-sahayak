import os
from pathlib import Path
import fitz  # PyMuPDF
from sqlalchemy.orm import Session
from backend.app.core.config import settings
from backend.app.models.document import Document
from backend.app.services.pdf_parser import PDFParserService
from backend.app.services.vector_store import vector_store

SAMPLE_DOC_ID = "doc_patents_act_1970_cri"
SAMPLE_DOC_FILENAME = "The_Patents_Act_1970_Section_3k_Guidelines.pdf"
SAMPLE_DOC_TITLE = "The Patents Act, 1970 - Guidelines for Computer Related Inventions (CRI)"

def create_sample_pdf_if_missing(file_path: Path) -> Path:
    """Generates a clean, multi-page Indian Patent Law reference PDF using PyMuPDF."""
    if file_path.exists():
        return file_path

    doc = fitz.open()

    # --- Page 1: Chapter II - Inventions Not Patentable (§ 3) ---
    p1 = doc.new_page(width=595, height=842)  # A4 size
    # Title
    p1.insert_text((50, 60), "THE PATENTS ACT, 1970 (ACT NO. 39 OF 1970)", fontsize=14, fontname="helv", color=(0.1, 0.1, 0.3))
    p1.insert_text((50, 85), "CHAPTER II: INVENTIONS NOT PATENTABLE", fontsize=12, fontname="helv", color=(0.2, 0.2, 0.2))
    p1.draw_line((50, 95), (545, 95), color=(0.7, 0.5, 0.1), width=1.5)

    # Section 3 text
    sec3_intro = (
        "Section 3. What are not inventions:\n"
        "The following are not inventions within the meaning of this Act:\n"
        "(a) an invention which is frivolous or which claims anything obvious contrary to well established natural laws;\n"
        "(b) an invention the primary or intended use or commercial exploitation of which would be contrary to public order or morality or which causes serious prejudice to human, animal or plant life or health or to the environment;\n"
        "(c) the mere discovery of a scientific principle or the formulation of an abstract theory or discovery of any living thing or non-living substance occurring in nature;"
    )
    p1.insert_textbox(fitz.Rect(50, 115, 545, 260), sec3_intro, fontsize=10, fontname="helv", color=(0.1, 0.1, 0.1))

    # Section 3(k) Highlight Box
    p1.draw_rect(fitz.Rect(48, 280, 545, 410), color=(0.8, 0.6, 0.1), fill=(0.98, 0.96, 0.90), width=1.0)
    p1.insert_text((55, 300), "STATUTORY FOCUS: SECTION 3(k)", fontsize=11, fontname="helv", color=(0.6, 0.3, 0.0))
    sec3k_text = (
        "Section 3(k): 'a mathematical or business method or a computer programme per se or algorithms.'\n\n"
        "Legislative Intent:\n"
        "The Parliamentary Joint Committee highlighted that computer programmes per se are excluded from patentability. "
        "However, when a computer programme is accompanied by novel hardware, or produces a further technical effect "
        "solving an engineering problem, it transcends the statutory bar of Section 3(k)."
    )
    p1.insert_textbox(fitz.Rect(55, 315, 535, 400), sec3k_text, fontsize=10, fontname="helv", color=(0.05, 0.05, 0.05))

    # Section 3(d)
    sec3d_text = (
        "Section 3(d): The mere discovery of a new form of a known substance which does not result in the enhancement of the known efficacy of that substance or the mere discovery of any new property or new use for a known substance or of the mere use of a known process, machine or apparatus unless such known process results in a new product or employs at least one new reactant."
    )
    p1.insert_textbox(fitz.Rect(50, 430, 545, 530), sec3d_text, fontsize=10, fontname="helv", color=(0.1, 0.1, 0.1))

    p1.insert_text((270, 810), "Page 1 of 3", fontsize=9, fontname="helv", color=(0.5, 0.5, 0.5))

    # --- Page 2: CRI Guidelines & Technical Effect Doctrine ---
    p2 = doc.new_page(width=595, height=842)
    p2.insert_text((50, 60), "OFFICE OF THE CONTROLLER GENERAL OF PATENTS, DESIGNS AND TRADE MARKS", fontsize=11, fontname="helv", color=(0.1, 0.1, 0.3))
    p2.insert_text((50, 80), "GUIDELINES FOR EXAMINATION OF COMPUTER-RELATED INVENTIONS (CRI)", fontsize=12, fontname="helv", color=(0.2, 0.2, 0.2))
    p2.draw_line((50, 90), (545, 90), color=(0.7, 0.5, 0.1), width=1.5)

    cri_para1 = (
        "Chapter 4: Determination of Technical Effect and Technical Contribution:\n"
        "4.1 In the examination of CRI applications, examiners must ascertain whether the claimed invention is merely software or an algorithm implemented on generic hardware, or whether it demonstrates a tangible technical contribution.\n\n"
        "4.2 Indicators of Technical Effect include:\n"
        "• Higher speed of processing, reduced memory consumption, or enhanced transmission rate.\n"
        "• Improved control of an external robotic or industrial manufacturing process.\n"
        "• Internal functioning of the computer system itself, such as enhanced security encryption or device driver latency reduction.\n"
        "• The technical problem solved must be rooted in computing architecture or industrial machinery."
    )
    p2.insert_textbox(fitz.Rect(50, 110, 545, 290), cri_para1, fontsize=10, fontname="helv", color=(0.1, 0.1, 0.1))

    # Ferid Allani Case Doctrine
    p2.draw_rect(fitz.Rect(48, 310, 545, 450), color=(0.2, 0.4, 0.7), fill=(0.93, 0.96, 1.0), width=1.0)
    p2.insert_text((55, 330), "JUDICIAL PRECEDENT: DELHI HIGH COURT IN FERID ALLANI v. UNION OF INDIA (2019)", fontsize=10, fontname="helv", color=(0.0, 0.2, 0.5))
    case_text = (
        "The High Court of Delhi unequivocally held that the words 'per se' in Section 3(k) were incorporated "
        "to ensure that genuine inventions based on computer programmes are not denied patents. "
        "If the invention demonstrates a 'technical effect' or a 'technical contribution', "
        "the patent application cannot be rejected solely on the ground that it utilizes software components or algorithms."
    )
    p2.insert_textbox(fitz.Rect(55, 345, 535, 440), case_text, fontsize=10, fontname="helv", color=(0.05, 0.05, 0.05))

    p2.insert_text((270, 810), "Page 2 of 3", fontsize=9, fontname="helv", color=(0.5, 0.5, 0.5))

    # --- Page 3: Inventive Step (§ 2(1)(ja)) & Compulsory Licenses (§ 84) ---
    p3 = doc.new_page(width=595, height=842)
    p3.insert_text((50, 60), "THE PATENTS ACT, 1970 - PATENTABILITY CRITERIA & LICENSING", fontsize=13, fontname="helv", color=(0.1, 0.1, 0.3))
    p3.draw_line((50, 75), (545, 75), color=(0.7, 0.5, 0.1), width=1.5)

    sec2ja_text = (
        "Section 2(1)(ja): 'Inventive Step' defined:\n"
        "'Inventive step' means a feature of an invention that involves technical advance as compared to the existing knowledge "
        "or having economic significance or both and that makes the invention not obvious to a person skilled in the art.\n\n"
        "To establish inventive step under Indian law, the applicant must satisfy the two-pronged test:\n"
        "1. Identify the prior art disclosure closest to the claimed invention;\n"
        "2. Demonstrate an objective technical problem and unexpected technical advance beyond ordinary routine experimentation."
    )
    p3.insert_textbox(fitz.Rect(50, 95, 545, 250), sec2ja_text, fontsize=10, fontname="helv", color=(0.1, 0.1, 0.1))

    # Section 84: Compulsory Licenses
    p3.draw_rect(fitz.Rect(48, 275, 545, 435), color=(0.6, 0.2, 0.2), fill=(1.0, 0.96, 0.96), width=1.0)
    p3.insert_text((55, 295), "SECTION 84: COMPULSORY LICENSES", fontsize=11, fontname="helv", color=(0.5, 0.1, 0.1))
    sec84_text = (
        "Section 84(1): At any time after the expiration of three years from the date of the grant of a patent, "
        "any person interested may make an application to the Controller for grant of compulsory licence on any of the following grounds:\n"
        "(a) that the reasonable requirements of the public with respect to the patented invention have not been satisfied;\n"
        "(b) that the patented invention is not available to the public at a reasonably affordable price;\n"
        "(c) that the patented invention is not worked in the territory of India."
    )
    p3.insert_textbox(fitz.Rect(55, 310, 535, 425), sec84_text, fontsize=10, fontname="helv", color=(0.05, 0.05, 0.05))

    p3.insert_text((270, 810), "Page 3 of 3", fontsize=9, fontname="helv", color=(0.5, 0.5, 0.5))

    doc.save(str(file_path))
    doc.close()
    print(f"Generated sample legal reference PDF at: {file_path}")
    return file_path

def seed_sample_document(db: Session):
    """Parses and indexes the official sample legal PDF if not already present."""
    sample_pdf_path = settings.SAMPLE_DIR / SAMPLE_DOC_FILENAME
    create_sample_pdf_if_missing(sample_pdf_path)

    existing = db.query(Document).filter(Document.id == SAMPLE_DOC_ID).first()
    if existing:
        return existing

    parsed = PDFParserService.extract_blocks_and_chunks(str(sample_pdf_path))
    file_size = os.path.getsize(str(sample_pdf_path))

    doc_record = Document(
        id=SAMPLE_DOC_ID,
        filename=SAMPLE_DOC_FILENAME,
        file_path=str(sample_pdf_path),
        file_size_bytes=file_size,
        total_pages=parsed["total_pages"],
        total_chunks=parsed["total_chunks"],
        title=SAMPLE_DOC_TITLE,
        status="indexed"
    )
    db.add(doc_record)
    db.commit()

    # Index into Qdrant
    vector_store.upsert_chunks(
        document_id=SAMPLE_DOC_ID,
        source_document=SAMPLE_DOC_TITLE,
        chunks=parsed["chunks"]
    )
    print(f"Seeded sample legal document: {SAMPLE_DOC_TITLE} ({parsed['total_chunks']} chunks)")
    return doc_record
