"use client";

import React, { useState } from "react";
import { BookmarkCheck, ChevronRight, Eye } from "lucide-react";
import { Citation } from "@/types";

interface CitationBadgeProps {
  citation: Citation;
  isActive: boolean;
  onClick: () => void;
}

export const CitationBadge: React.FC<CitationBadgeProps> = ({
  citation,
  isActive,
  onClick,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  // Clean document name for badge display
  const shortDoc = citation.source_document.length > 22
    ? citation.source_document.substring(0, 20) + "..."
    : citation.source_document;

  return (
    <div className="relative inline-block my-1 mr-2">
      <button
        onClick={onClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`group inline-flex items-center space-x-1.5 text-xs font-semibold px-2.5 py-1 rounded-md transition-all duration-200 border ${
          isActive
            ? "bg-amber-500/20 text-amber-200 border-amber-400 shadow-md shadow-amber-500/30 scale-105"
            : "bg-slate-800/90 hover:bg-slate-750 text-amber-300/90 hover:text-amber-200 border-amber-500/30 hover:border-amber-400/70"
        }`}
      >
        <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px] font-bold group-hover:bg-amber-500 group-hover:text-slate-950 transition">
          {citation.citation_id.replace("[", "").replace("]", "")}
        </span>
        <span>
          Page {citation.page_number}
        </span>
        <span className="text-slate-400 text-[10px] font-normal border-l border-slate-700 pl-1.5 max-w-[130px] truncate">
          {shortDoc}
        </span>
        <Eye className="w-3 h-3 text-amber-400 opacity-60 group-hover:opacity-100 transition" />
      </button>

      {/* Hover Preview Card / Tooltip */}
      {showTooltip && (
        <div className="absolute left-0 bottom-full mb-2 z-50 w-72 p-3 bg-slate-900/95 backdrop-blur-md rounded-xl border border-amber-500/40 shadow-2xl text-left pointer-events-none animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-1.5">
            <span className="text-[11px] font-bold text-amber-400 flex items-center space-x-1">
              <BookmarkCheck className="w-3.5 h-3.5 mr-1" />
              Page {citation.page_number} Citation
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              BBox: [{citation.bbox.map((v) => Math.round(v)).join(", ")}]
            </span>
          </div>
          <p className="text-xs text-slate-300 italic mb-1.5 line-clamp-3">
            "{citation.highlight_text}"
          </p>
          <div className="text-[10px] text-slate-400 bg-slate-950/60 p-1.5 rounded-lg border border-slate-800">
            <span className="text-amber-300/90 font-medium">Relevance: </span>
            {citation.relevance_summary}
          </div>
        </div>
      )}
    </div>
  );
};
