import { ChatRequest, ChatResponse, DocumentMetadata, UploadResponse } from "@/types";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://tapioca-baton-stereo.ngrok-free.dev";
export async function checkBackendHealth(): Promise<{ status: string; qdrant_mode: string; db_mode: string } | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/health`, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchDocuments(): Promise<DocumentMetadata[]> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/documents`, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to load documents");
    return await res.json();
  } catch (error) {
    console.error("fetchDocuments error:", error);
    return [];
  }
}

export async function uploadDocument(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${BACKEND_URL}/api/v1/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Upload failed" }));
    throw new Error(err.detail || "Upload failed");
  }

  return await res.json();
}

export async function sendChatMessage(request: ChatRequest): Promise<ChatResponse> {
  const res = await fetch(`${BACKEND_URL}/api/v1/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Chat request failed" }));
    throw new Error(err.detail || "Chat request failed");
  }

  return await res.json();
}

export function getDocumentPdfUrl(documentId: string): string {
  return `${BACKEND_URL}/api/v1/documents/${documentId}/pdf`;
}
