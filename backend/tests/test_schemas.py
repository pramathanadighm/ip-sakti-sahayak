from backend.app.schemas.chat import Citation, ChatRequest, ChatResponse, LLMStructuredOutput
from backend.app.services.llm_service import llm_service
from backend.app.services.vector_store import vector_store

def test_pydantic_chat_and_citation_schemas():
    # 1. Test Citation Schema
    cit = Citation(
        citation_id="[1]",
        source_document="The Patents Act, 1970",
        page_number=1,
        bbox=[48.0, 280.0, 545.0, 410.0],
        highlight_text="Section 3(k): a mathematical or business method or a computer programme per se or algorithms.",
        relevance_summary="Establishes statutory exclusion for computer programmes per se."
    )
    assert cit.page_number == 1
    assert len(cit.bbox) == 4
    assert cit.citation_id == "[1]"

    # 2. Test ChatResponse Schema
    resp = ChatResponse(
        answer="Under Section 3(k), computer programmes per se are not patentable [1].",
        citations=[cit],
        model="groq/llama-3.3-70b-versatile",
        query="Explain Section 3(k)",
        retrieved_chunks_count=1,
        latency_ms=145.2
    )
    assert len(resp.citations) == 1
    assert resp.citations[0].page_number == 1
    assert resp.citations[0].bbox == [48.0, 280.0, 545.0, 410.0]

    # 3. Test LLM Service synthesis with sample chunk
    sample_chunk = {
        "source_document": "The Patents Act, 1970",
        "page_number": 1,
        "bbox": [48.0, 280.0, 545.0, 410.0],
        "section_title": "Section 3(k)",
        "content": "Section 3(k): a mathematical or business method or a computer programme per se or algorithms."
    }

    result = llm_service.generate_legal_response(
        query="Is software patentable in India?",
        retrieved_chunks=[sample_chunk]
    )

    assert isinstance(result, LLMStructuredOutput)
    assert len(result.citations) > 0
    assert result.citations[0].page_number == 1
    assert len(result.citations[0].bbox) == 4

    print("Pydantic chat and citation validation test passed successfully!")

if __name__ == "__main__":
    test_pydantic_chat_and_citation_schemas()
