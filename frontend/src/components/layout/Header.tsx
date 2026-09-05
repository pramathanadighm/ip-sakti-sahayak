"use client";

import React from "react";
import { Scale, FileText, UploadCloud } from "lucide-react";
import { DocumentMetadata } from "@/types";
import { useLanguage } from "@/context/LanguageContext";

interface HeaderProps {
  backendConnected: boolean;
  qdrantMode: string;
  documents: DocumentMetadata[];
  selectedDocId?: string;
  onSelectDocument: (docId: string) => void;
  onOpenUpload: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  documents,
  selectedDocId,
  onSelectDocument,
  onOpenUpload,
}) => {
  const { t } = useLanguage();

  const activeDoc = documents.find((doc) => doc.id === selectedDocId) || documents[0];
  const activeDocName = activeDoc?.title || activeDoc?.filename || t.noDocument || "No Document Selected";

  return (
    <header className="h-16 border-b border-slate-800 bg-[#0C111D]/90 backdrop-blur-md px-4 sm:px-6 flex justify-between items-center sticky top-0 z-30">
      {/* Left Side (Branding): Group the Logo and Text together */}
      <div className="flex items-center space-x-3">
        {/* Logo sits on the far left */}
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-500/20 ring-1 ring-amber-400/30 shrink-0">
          <Scale className="w-5 h-5 text-slate-950 font-bold" />
        </div>

        {/* Text next to logo: Main title with LEGAL RAG badge/subtitle */}
        <div className="flex flex-col">
          <div className="flex items-center space-x-2">
            <h1 className="text-base font-bold tracking-tight text-white flex items-center">
              IP-SAKTI <span className="text-amber-400 ml-1 font-normal">Sahayak</span>
            </h1>
            <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 tracking-wider">
              {t.legalRag || "LEGAL RAG"}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 hidden sm:block">
            {t.brandSubtitle}
          </p>
        </div>
      </div>

      {/* Right Side (Document): Display the name of the currently active PDF document, pushed to the far right */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700/80 text-xs text-slate-200 max-w-[170px] sm:max-w-[280px] md:max-w-[360px]">
          <FileText className="w-4 h-4 text-amber-400 shrink-0" />
          {documents.length > 1 ? (
            <select
              value={selectedDocId || ""}
              onChange={(e) => onSelectDocument(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-200 focus:outline-none cursor-pointer truncate w-full"
              title={activeDocName}
            >
              {documents.map((doc) => (
                <option key={doc.id} value={doc.id} className="bg-slate-900 text-slate-100">
                  {doc.title || doc.filename}
                </option>
              ))}
            </select>
          ) : (
            <span className="font-semibold text-slate-200 truncate" title={activeDocName}>
              {activeDocName}
            </span>
          )}
        </div>

        <button
          onClick={onOpenUpload}
          className="flex items-center space-x-1.5 text-xs font-medium bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 px-3 py-1.5 rounded-lg shadow-sm shadow-amber-500/20 transition active:scale-95 shrink-0"
          title={t.uploadPdf}
        >
          <UploadCloud className="w-4 h-4" />
          <span className="hidden sm:inline">{t.uploadPdf}</span>
        </button>
      </div>
    </header>
  );
};
