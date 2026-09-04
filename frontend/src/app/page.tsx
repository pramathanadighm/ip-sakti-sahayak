"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/layout/Header";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { PDFViewerPanel } from "@/components/pdf/PDFViewerPanel";
import { UploadModal } from "@/components/upload/UploadModal";
import {
  checkBackendHealth,
  fetchDocuments,
  sendChatMessage,
  getDocumentPdfUrl,
} from "@/lib/api";
import { ChatMessage, Citation, DocumentMetadata, UploadResponse } from "@/types";
import { useLanguage } from "@/context/LanguageContext";

export default function Home() {
  const [backendConnected, setBackendConnected] = useState(false);
  const [qdrantMode, setQdrantMode] = useState("Hybrid (BGE + BM25)");
  const [documents, setDocuments] = useState<DocumentMetadata[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  // PDF Viewer Navigation & Highlight State
  const [targetPage, setTargetPage] = useState<number>(1);
  const [activeCitation, setActiveCitation] = useState<Citation | null>(null);

  // Resizable Split Pane Divider State
  const [splitPercent, setSplitPercent] = useState<number>(50);
  const [isDragging, setIsDragging] = useState(false);

  // Check health and load initial documents
  const loadInitialData = useCallback(async () => {
    const health = await checkBackendHealth();
    setBackendConnected(!!health);
    if (health) {
      setQdrantMode(health.qdrant_mode === "remote" ? "Remote Qdrant Docker" : "Embedded Local Qdrant");
    }

    const docs = await fetchDocuments();
    setDocuments(docs);
    if (docs.length > 0 && !selectedDocId) {
      setSelectedDocId(docs[0].id);
    }
  }, [selectedDocId]);

  useEffect(() => {
    loadInitialData();
    const interval = setInterval(loadInitialData, 8000);
    return () => clearInterval(interval);
  }, [loadInitialData]);

  // Handle citation badge click: triggers instant page jump & bbox glow
  const handleSelectCitation = (citation: Citation) => {
    setActiveCitation(citation);
    setTargetPage(citation.page_number);

    // If citation mentions a specific document, check if we should switch documents
    const matchingDoc = documents.find(
      (d) =>
        d.filename.toLowerCase() === citation.source_document.toLowerCase() ||
        d.title?.toLowerCase() === citation.source_document.toLowerCase()
    );
    if (matchingDoc && matchingDoc.id !== selectedDocId) {
      setSelectedDocId(matchingDoc.id);
    }
  };

  const { currentLanguage } = useLanguage();

  // Handle sending a chat query
  const handleSendMessage = async (query: string) => {
    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      role: "user",
      content: query,
      language: currentLanguage,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const response = await sendChatMessage({
        query,
        document_id: selectedDocId || undefined,
        language: currentLanguage,
        top_k: 5,
      });

      const assistantMsg: ChatMessage = {
        id: `ast_${Date.now()}`,
        role: "assistant",
        content: response.answer,
        citations: response.citations,
        latency_ms: response.latency_ms,
        model: response.model,
        language: response.language || currentLanguage,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // Automatically focus on the first citation if present
      if (response.citations && response.citations.length > 0) {
        handleSelectCitation(response.citations[0]);
      }
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        role: "assistant",
        content: `**Service Alert:** ${err.message || "Could not retrieve response from backend service."}`,
        language: currentLanguage,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  // Handle new document uploaded
  const handleUploadSuccess = (uploadRes: UploadResponse) => {
    loadInitialData();
    setSelectedDocId(uploadRes.document_id);
    setTargetPage(1);
    setActiveCitation(null);
  };

  // Divider drag logic
  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);
  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    const newPercent = (e.clientX / window.innerWidth) * 100;
    if (newPercent > 25 && newPercent < 75) {
      setSplitPercent(newPercent);
    }
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    } else {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  const currentDocument = documents.find((d) => d.id === selectedDocId);
  const documentPdfUrl = selectedDocId ? getDocumentPdfUrl(selectedDocId) : null;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#0B101C]">
      {/* Enterprise Header */}
      <Header
        backendConnected={backendConnected}
        qdrantMode={qdrantMode}
        documents={documents}
        selectedDocId={selectedDocId}
        onSelectDocument={(id) => {
          setSelectedDocId(id);
          setTargetPage(1);
          setActiveCitation(null);
        }}
        onOpenUpload={() => setUploadModalOpen(true)}
      />

      {/* Main Split-Screen Workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Pane: Chat Counsel Panel */}
        <div
          style={{ width: `${splitPercent}%` }}
          className="h-full overflow-hidden transition-[width] duration-75 ease-out"
        >
          <ChatPanel
            messages={messages}
            loading={loading}
            activeCitation={activeCitation}
            onSendMessage={handleSendMessage}
            onSelectCitation={handleSelectCitation}
          />
        </div>

        {/* Resizable Divider Handle */}
        <div
          onMouseDown={handleMouseDown}
          className={`w-1.5 hover:w-2 bg-slate-800 hover:bg-amber-500/80 cursor-col-resize z-20 flex items-center justify-center transition-all ${
            isDragging ? "bg-amber-500 w-2" : ""
          }`}
          title="Drag to resize workspace split"
        >
          <div className="h-8 w-0.5 bg-slate-600 rounded-full" />
        </div>

        {/* Right Pane: PDF Viewer with Bounding Box Highlights */}
        <div
          style={{ width: `${100 - splitPercent}%` }}
          className="h-full overflow-hidden transition-[width] duration-75 ease-out"
        >
          <PDFViewerPanel
            documentUrl={documentPdfUrl}
            documentMeta={currentDocument}
            targetPage={targetPage}
            activeCitation={activeCitation}
            onPageChange={(p) => setTargetPage(p)}
          />
        </div>
      </div>

      {/* Upload Modal */}
      <UploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onUploadSuccess={handleUploadSuccess}
      />
    </div>
  );
}
