export interface Citation {
  citation_id: string;          // e.g. "[1]", "[2]"
  source_document: string;      // e.g. "The Patents Act, 1970"
  page_number: number;          // 1-indexed page number
  bbox: [number, number, number, number]; // [x0, y0, x1, y1]
  highlight_text: string;       // verbatim snippet from the document
  relevance_summary: string;    // legal justification / summary
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  timestamp: string;
  latency_ms?: number;
  model?: string;
  language?: string;
}

export interface ChatRequest {
  query: string;
  document_id?: string;
  top_k?: number;
  language?: string;
}

export interface ChatResponse {
  answer: string;
  citations: Citation[];
  model: string;
  query: string;
  language?: string;
  retrieved_chunks_count: number;
  latency_ms: number;
}

export interface DocumentMetadata {
  id: string;
  filename: string;
  title: string;
  total_pages: number;
  total_chunks: number;
  file_size_bytes: number;
  created_at: string;
  status: string;
  pdf_url: string;
}

export interface UploadResponse {
  document_id: string;
  filename: string;
  title: string;
  total_pages: number;
  total_chunks: number;
  status: string;
  pdf_url: string;
  message: string;
}
