"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  FileText,
  Bookmark,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { Citation, DocumentMetadata } from "@/types";
import { useLanguage } from "@/context/LanguageContext";

interface PDFViewerPanelProps {
  documentUrl?: string | null;
  documentMeta?: DocumentMetadata | null;
  targetPage: number;
  activeCitation?: Citation | null;
  onPageChange?: (page: number) => void;
}

export const PDFViewerPanel: React.FC<PDFViewerPanelProps> = ({
  documentUrl,
  documentMeta,
  targetPage,
  activeCitation,
  onPageChange,
}) => {
  const { t } = useLanguage();
  const [numPages, setNumPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(targetPage || 1);
  const [scale, setScale] = useState<number>(1.2);
  const [loading, setLoading] = useState<boolean>(true);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [pageSize, setPageSize] = useState<{ width: number; height: number }>({ width: 595, height: 842 });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);

  // Synchronize when targetPage changes from citation clicks
  useEffect(() => {
    if (targetPage && targetPage !== currentPage && targetPage <= numPages) {
      setCurrentPage(targetPage);
    }
  }, [targetPage, numPages]);

  // Load PDF document using pdfjs-dist
  useEffect(() => {
    let isCancelled = false;

    async function loadPdf() {
      if (!documentUrl) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const pdfjs = await import("pdfjs-dist");
        // Set worker src
        pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

        const loadingTask = pdfjs.getDocument({
          url: documentUrl,
          cMapUrl: "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/",
          cMapPacked: true,
        });

        const doc = await loadingTask.promise;
        if (!isCancelled) {
          setPdfDoc(doc);
          setNumPages(doc.numPages);
          setLoading(false);
        }
      } catch (err) {
        console.error("PDF loading error:", err);
        if (!isCancelled) setLoading(false);
      }
    }

    loadPdf();

    return () => {
      isCancelled = true;
    };
  }, [documentUrl]);

  // Render current page onto canvas
  useEffect(() => {
    let renderTask: any = null;

    async function renderPage() {
      if (!pdfDoc || !canvasRef.current) return;

      try {
        const page = await pdfDoc.getPage(currentPage);
        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");

        canvas.width = viewport.width;
        canvas.height = viewport.height;
        setPageSize({
          width: viewport.viewBox[2],
          height: viewport.viewBox[3],
        });

        if (context) {
          context.clearRect(0, 0, canvas.width, canvas.height);
          renderTask = page.render({
            canvasContext: context,
            viewport,
          });
          await renderTask.promise;

          // Scroll highlight into view if on this page
          if (activeCitation && activeCitation.page_number === currentPage && highlightRef.current) {
            highlightRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }
      } catch (err: any) {
        if (err?.name !== "RenderingCancelledException") {
          console.error("Page render error:", err);
        }
      }
    }

    renderPage();

    return () => {
      if (renderTask) {
        renderTask.cancel();
      }
    };
  }, [pdfDoc, currentPage, scale, activeCitation]);

  // Calculate bbox overlay style
  const getBBoxStyle = (): React.CSSProperties | null => {
    if (!activeCitation || activeCitation.page_number !== currentPage || !canvasRef.current) {
      return null;
    }

    const [x0, y0, x1, y1] = activeCitation.bbox;
    // PDF points: origin is top-left in PyMuPDF
    // Scale factors between PDF points and rendered canvas dimensions
    const scaleX = canvasRef.current.width / (pageSize.width || 595);
    const scaleY = canvasRef.current.height / (pageSize.height || 842);

    const left = Math.max(0, x0 * scaleX);
    const top = Math.max(0, y0 * scaleY);
    const width = Math.max(20, (x1 - x0) * scaleX);
    const height = Math.max(16, (y1 - y0) * scaleY);

    return {
      left: `${left}px`,
      top: `${top}px`,
      width: `${width}px`,
      height: `${height}px`,
    };
  };

  const bboxStyle = getBBoxStyle();

  return (
    <div className="flex flex-col h-full bg-[#080C14] select-none">
      {/* Viewer Header / Toolbar */}
      <div className="h-12 border-b border-slate-800 bg-[#0F1422] px-4 flex items-center justify-between z-20">
        <div className="flex items-center space-x-2">
          <FileText className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-semibold text-slate-200 truncate max-w-[200px]">
            {documentMeta?.title || documentMeta?.filename || t.legalDocument}
          </span>
          {activeCitation && activeCitation.page_number === currentPage && (
            <span className="hidden sm:inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-400/40">
              <Sparkles className="w-2.5 h-2.5" />
              <span>{t.citationTag} {activeCitation.citation_id}</span>
            </span>
          )}
        </div>

        {/* Page & Zoom Navigation Controls */}
        <div className="flex items-center space-x-2">
          {/* Page Controls */}
          <div className="flex items-center space-x-1 bg-slate-900 border border-slate-700/80 rounded-lg p-0.5">
            <button
              onClick={() => {
                const prev = Math.max(1, currentPage - 1);
                setCurrentPage(prev);
                onPageChange?.(prev);
              }}
              disabled={currentPage <= 1}
              className="p-1 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition rounded"
              title={t.prevPage}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs text-slate-300 px-2 font-mono">
              {currentPage} / {numPages || 1}
            </span>
            <button
              onClick={() => {
                const next = Math.min(numPages, currentPage + 1);
                setCurrentPage(next);
                onPageChange?.(next);
              }}
              disabled={currentPage >= numPages}
              className="p-1 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition rounded"
              title={t.nextPage}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center space-x-1 bg-slate-900 border border-slate-700/80 rounded-lg p-0.5">
            <button
              onClick={() => setScale((s) => Math.max(0.7, s - 0.15))}
              className="p-1 text-slate-400 hover:text-white transition rounded"
              title={t.zoomOut}
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] text-slate-400 px-1 font-mono">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={() => setScale((s) => Math.min(2.5, s + 0.15))}
              className="p-1 text-slate-400 hover:text-white transition rounded"
              title={t.zoomIn}
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* PDF Canvas Viewport Area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto p-6 flex items-center justify-center relative bg-[#070A12]"
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-slate-400">{t.loadingPdf}</span>
          </div>
        ) : !documentUrl ? (
          <div className="text-center p-8 border border-dashed border-slate-800 rounded-2xl max-w-sm">
            <AlertCircle className="w-8 h-8 text-slate-500 mx-auto mb-2" />
            <p className="text-xs text-slate-400">{t.noDocument}</p>
          </div>
        ) : (
          <div className="relative shadow-2xl rounded-sm border border-slate-800 bg-white">
            <canvas ref={canvasRef} className="block rounded-sm" />

            {/* Bounding Box Highlight Overlay */}
            {bboxStyle && (
              <div
                ref={highlightRef}
                style={bboxStyle}
                className="absolute z-10 pointer-events-auto rounded-md border-2 border-amber-400 bg-amber-400/25 shadow-2xl shadow-amber-500/60 ring-2 ring-amber-400/40 animate-pulse transition-all duration-300"
              >
                {/* Floating Citation Callout */}
                <div className="absolute -top-7 left-0 bg-amber-500 text-slate-950 text-[10px] font-bold px-2 py-0.5 rounded shadow-lg flex items-center space-x-1 whitespace-nowrap">
                  <Bookmark className="w-3 h-3 fill-slate-950" />
                  <span>
                    {t.citationTag} {activeCitation?.citation_id} (Page {activeCitation?.page_number})
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
