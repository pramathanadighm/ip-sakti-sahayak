"use client";

import React from "react";
import { Scale, Database, Cpu, UploadCloud } from "lucide-react";
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
  backendConnected,
  qdrantMode,
  documents,
  selectedDocId,
  onSelectDocument,
  onOpenUpload,
}) => {
  const { t, currentLanguage } = useLanguage();

  return (
    <header className="h-16 border-b border-slate-800 bg-[#0C111D]/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Brand Identity */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-500/20 ring-1 ring-amber-400/30">
          <Scale className="w-5 h-5 text-slate-950 font-bold" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-base font-bold tracking-tight text-white flex items-center">
              IP-SAKTI <span className="text-amber-400 ml-1.5 font-normal">Sahayak</span>
            </h1>
            <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 tracking-wider">
              {t.legalRag}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 hidden sm:block">
            {t.brandSubtitle}
          </p>
        </div>
      </div>

      {/* System Status Indicators */}
      <div className="hidden lg:flex items-center space-x-4 text-xs">
        {/* Backend Connectivity */}
        <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800">
          <span
            className={`w-2 h-2 rounded-full ${
              backendConnected ? "bg-emerald-400 animate-pulse" : "bg-rose-500"
            }`}
          />
          <span className="text-slate-300">
            {backendConnected ? t.backendOnline : t.backendOffline}
          </span>
        </div>

        {/* Qdrant Status */}
        <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800">
          <Database className="w-3.5 h-3.5 text-sky-400" />
          <span className="text-slate-300">
            {t.qdrantHybrid}
          </span>
        </div>

        {/* LLM Engine */}
        <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800">
          <Cpu className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-slate-300">
            {t.engineLabel}
          </span>
        </div>
      </div>

      {/* Document Selector & Upload Action */}
      <div className="flex items-center space-x-3">
        {documents.length > 0 && (
          <div className="relative">
            <select
              value={selectedDocId || ""}
              onChange={(e) => onSelectDocument(e.target.value)}
              className="bg-slate-900 text-xs text-slate-200 border border-slate-700/80 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-500 pr-8 max-w-[210px] truncate cursor-pointer hover:border-slate-600 transition"
              title={t.selectDocument}
            >
              {documents.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  📄 {doc.title || doc.filename}
                </option>
              ))}
            </select>
          </div>
        )}

        <button
          onClick={onOpenUpload}
          className="flex items-center space-x-1.5 text-xs font-medium bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 px-3.5 py-1.5 rounded-lg shadow-sm shadow-amber-500/20 transition active:scale-95"
        >
          <UploadCloud className="w-4 h-4" />
          <span>{t.uploadPdf}</span>
        </button>
      </div>
    </header>
  );
};
