"use client";

import React, { useState, useRef } from "react";
import { X, UploadCloud, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { uploadDocument } from "@/lib/api";
import { UploadResponse } from "@/types";
import { useLanguage } from "@/context/LanguageContext";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (response: UploadResponse) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onUploadSuccess,
}) => {
  const { t } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progressStatus, setProgressStatus] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selected = e.dataTransfer.files[0];
      if (selected.type === "application/pdf" || selected.name.endsWith(".pdf")) {
        setFile(selected);
        setError(null);
      } else {
        setError(t.onlyPdf);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (selected.type === "application/pdf" || selected.name.endsWith(".pdf")) {
        setFile(selected);
        setError(null);
      } else {
        setError(t.onlyPdf);
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);
    setProgressStatus(t.extractingStatus);

    try {
      const result = await uploadDocument(file);
      setProgressStatus(t.indexedSuccess);
      setTimeout(() => {
        onUploadSuccess(result);
        onClose();
      }, 500);
    } catch (err: any) {
      setError(err.message || "Failed to upload and index document.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 relative">
        <button
          onClick={onClose}
          disabled={uploading}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <UploadCloud className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">{t.modalTitle}</h3>
            <p className="text-xs text-slate-400">
              {t.modalSubtitle}
            </p>
          </div>
        </div>

        {/* Dropzone */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleFileDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition ${
            file
              ? "border-amber-500/60 bg-amber-500/5"
              : "border-slate-700 hover:border-slate-500 bg-slate-950/40"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="hidden"
          />

          {file ? (
            <div className="flex flex-col items-center">
              <FileText className="w-10 h-10 text-amber-400 mb-2" />
              <span className="text-xs font-semibold text-white max-w-xs truncate">
                {file.name}
              </span>
              <span className="text-[11px] text-slate-400 mt-1">
                {(file.size / (1024 * 1024)).toFixed(2)} MB
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <UploadCloud className="w-10 h-10 text-slate-500 mb-2 group-hover:text-amber-400 transition" />
              <span className="text-xs font-medium text-slate-300">
                {t.dragDrop} <span className="text-amber-400">{t.dragDropBrowse}</span>
              </span>
              <span className="text-[10px] text-slate-500 mt-1">
                {t.dragDropHint}
              </span>
            </div>
          )}
        </div>

        {/* Status / Error feedback */}
        {error && (
          <div className="mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {uploading && (
          <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-center space-x-2">
            <div className="w-3.5 h-3.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin shrink-0" />
            <span>{progressStatus}</span>
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={uploading}
            className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition"
          >
            {t.cancel}
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="px-5 py-2 text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 rounded-lg shadow-md shadow-amber-500/20 transition active:scale-95"
          >
            {uploading ? t.processing : t.startIngestion}
          </button>
        </div>
      </div>
    </div>
  );
};
