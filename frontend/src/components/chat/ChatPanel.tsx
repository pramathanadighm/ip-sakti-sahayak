"use client";

import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Send,
  Sparkles,
  Bot,
  User,
  Scale,
  Clock,
  BookOpen,
  Volume2,
  VolumeX,
  Languages,
  Mic,
  MicOff,
} from "lucide-react";
import { ChatMessage, Citation } from "@/types";
import { CitationBadge } from "./CitationBadge";
import { useLanguage } from "@/context/LanguageContext";
import { LanguageCode } from "@/lib/translations";

interface ChatPanelProps {
  messages: ChatMessage[];
  loading: boolean;
  activeCitation?: Citation | null;
  onSendMessage: (query: string) => void;
  onSelectCitation: (citation: Citation) => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  loading,
  activeCitation,
  onSendMessage,
  onSelectCitation,
}) => {
  const { currentLanguage, setCurrentLanguage, t, bcp47, supportedLanguages } = useLanguage();

  const [inputQuery, setInputQuery] = useState("");
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [browserVoices, setBrowserVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isListening, setIsListening] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const presetPrompts = [
    {
      title: t.prompt1Title,
      query: t.prompt1Query,
    },
    {
      title: t.prompt2Title,
      query: t.prompt2Query,
    },
    {
      title: t.prompt3Title,
      query: t.prompt3Query,
    },
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Load and cache browser voices, listening for dynamic voice loading
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    const populateVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        setBrowserVoices(voices);
      }
    };

    populateVoices();
    window.speechSynthesis.onvoiceschanged = populateVoices;

    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.onvoiceschanged = null;
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Native Speech-to-Text (STT) Voice Input Handler
  const toggleVoiceInput = () => {
    if (typeof window === "undefined") return;

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(t.micNotSupported);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = false;
      recognition.interimResults = true;
      // Bind recognition language directly to currently selected language BCP 47 code
      recognition.lang = bcp47;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let transcript = "";
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) {
          setInputQuery(transcript);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.error("Speech recognition start failed:", err);
      setIsListening(false);
    }
  };

  // Text-To-Speech (TTS) Handler using native browser window.speechSynthesis with voice search and fallback
  const handleToggleSpeak = (msgId: string, text: string, langName?: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      alert("Text-to-Speech is not supported in this browser environment.");
      return;
    }

    // Toggle stop if already reading this message
    if (speakingMessageId === msgId && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
      return;
    }

    window.speechSynthesis.cancel();

    // Strip Markdown symbols and citation numbers for clean, natural speech
    const cleanText = text
      .replace(/###\s+/g, "")
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\*(.*?)\*/g, "$1")
      .replace(/\[\d+\]/g, "")
      .replace(/•/g, "")
      .replace(/[\n\r]+/g, " ")
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    const targetLangMeta =
      supportedLanguages.find((l) => l.code === (langName || currentLanguage)) ||
      supportedLanguages[0];

    utterance.lang = targetLangMeta.bcp47;
    utterance.rate = 0.95; // deliberate pace for statutory delivery

    // Search speechSynthesis.getVoices() array for matching regional voice, falling back to default voice
    const availableVoices =
      browserVoices.length > 0 ? browserVoices : window.speechSynthesis.getVoices();

    const targetTag = targetLangMeta.bcp47.toLowerCase();
    const langPrefix = targetTag.split("-")[0]; // e.g. "kn", "ta", "ml", "te", "gu", "pa", "hi", "mr", "bn"

    // 1. Search for exact BCP-47 tag match (e.g. "kn-IN" or "kn_IN")
    let matchedVoice = availableVoices.find((v) => {
      const vLang = v.lang.toLowerCase().replace("_", "-");
      return vLang === targetTag;
    });

    // 2. Search for language prefix match (e.g. "kn")
    if (!matchedVoice) {
      matchedVoice = availableVoices.find((v) => {
        const vLang = v.lang.toLowerCase().replace("_", "-");
        return vLang.startsWith(langPrefix);
      });
    }

    // 3. Fallback to default voice or first available voice if regional voice is not installed
    const fallbackVoice =
      availableVoices.find((v) => v.default) || (availableVoices.length > 0 ? availableVoices[0] : null);

    if (matchedVoice) {
      utterance.voice = matchedVoice;
    } else if (fallbackVoice) {
      utterance.voice = fallbackVoice;
    }

    utterance.onend = () => setSpeakingMessageId(null);
    utterance.onerror = () => setSpeakingMessageId(null);

    window.speechSynthesis.speak(utterance);
    setSpeakingMessageId(msgId);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuery.trim() || loading) return;
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
    onSendMessage(inputQuery.trim());
    setInputQuery("");
  };

  return (
    <div className="flex flex-col h-full bg-[#0B101C] border-r border-slate-800">
      {/* Panel Subheader */}
      <div className="px-5 py-3 border-b border-slate-800/80 bg-slate-900/40 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Scale className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            {t.counselTitle}
          </span>
        </div>
        <div className="flex items-center space-x-2 text-[11px] text-slate-400">
          <span className="hidden sm:inline">{t.activeLanguage}:</span>
          <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-medium">
            {currentLanguage} ({bcp47})
          </span>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto my-auto py-10">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-4 text-amber-400 shadow-lg shadow-amber-500/10">
              <BookOpen className="w-7 h-7" />
            </div>
            <h2 className="text-base font-bold text-white mb-2">
              {t.welcomeTitle}
            </h2>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              {t.welcomeDesc}
            </p>

            <div className="w-full space-y-2 text-left">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center">
                <Sparkles className="w-3 h-3 mr-1 text-amber-400" /> {t.recommendedQueries}
              </div>
              {presetPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => onSendMessage(prompt.query)}
                  className="w-full text-left p-2.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 transition group"
                >
                  <div className="text-xs font-semibold text-amber-300/90 group-hover:text-amber-200">
                    {prompt.title}
                  </div>
                  <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                    {prompt.query}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start space-x-3 ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {msg.role === "assistant" && (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-slate-950 font-bold shrink-0 mt-0.5 shadow-md shadow-amber-500/20">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed ${
                  msg.role === "user"
                    ? "bg-amber-600/20 border border-amber-500/30 text-slate-100 rounded-tr-sm"
                    : "bg-slate-900/90 border border-slate-800 text-slate-200 shadow-xl rounded-tl-sm"
                }`}
              >
                {/* Header bar for Assistant bubbles with Text-to-Speech button */}
                {msg.role === "assistant" && (
                  <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-800/80">
                    <span className="text-[10px] font-semibold tracking-wider uppercase text-amber-400/90">
                      {t.opinionHeader} {msg.language ? `• ${msg.language}` : ""}
                    </span>
                    <button
                      onClick={() => handleToggleSpeak(msg.id, msg.content, msg.language)}
                      className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition border ${
                        speakingMessageId === msg.id
                          ? "bg-amber-500/20 text-amber-200 border-amber-400 shadow-md shadow-amber-500/30 ring-1 ring-amber-400/50"
                          : "bg-slate-800/90 hover:bg-slate-750 text-slate-300 hover:text-amber-300 border-slate-700/80 hover:border-amber-500/40"
                      }`}
                      title={speakingMessageId === msg.id ? t.stopTts : t.listenTts}
                    >
                      {speakingMessageId === msg.id ? (
                        <>
                          <VolumeX className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                          <span className="text-amber-300 font-semibold">{t.stopTts}</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                          <span>{t.listenTts}</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Message Content */}
                <div className="legal-prose prose-invert prose-xs max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.content}
                  </ReactMarkdown>
                </div>

                {/* Citations Badges Section */}
                {msg.citations && msg.citations.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-800">
                    <div className="flex items-center space-x-1.5 text-[11px] font-semibold text-amber-400 mb-2">
                      <Scale className="w-3.5 h-3.5" />
                      <span>{t.citationsLabel}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.citations.map((cit, idx) => (
                        <CitationBadge
                          key={idx}
                          citation={cit}
                          isActive={
                            activeCitation?.citation_id === cit.citation_id &&
                            activeCitation?.page_number === cit.page_number
                          }
                          onClick={() => onSelectCitation(cit)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Footer Metadata */}
                {msg.role === "assistant" && (
                  <div className="mt-2.5 flex items-center justify-between text-[10px] text-slate-500">
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{msg.latency_ms ? `${msg.latency_ms} ms` : t.instant}</span>
                    </span>
                    <span className="font-mono text-slate-500">
                      {msg.model || "IP-SAKTI Counsel"}
                    </span>
                  </div>
                )}
              </div>

              {msg.role === "user" && (
                <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))
        )}

        {/* Loading Indicator */}
        {loading && (
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-slate-950 font-bold shrink-0 animate-pulse">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-sm p-4 text-xs text-slate-300 max-w-sm flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span>{t.synthesizing} {currentLanguage}...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Query Input Bar with Language Dropdown & Voice Input (STT) */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/80">
        {/* Pulsing Voice Listening Indicator Bar */}
        {isListening && (
          <div className="mb-2 px-3.5 py-1.5 rounded-xl bg-rose-500/15 border border-rose-500/40 flex items-center justify-between text-xs text-rose-300 animate-pulse">
            <div className="flex items-center space-x-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
              </span>
              <span className="font-semibold text-rose-200 tracking-wide">
                {t.voiceListening} ({currentLanguage} • {bcp47})
              </span>
            </div>
            <button
              type="button"
              onClick={toggleVoiceInput}
              className="text-[11px] font-bold text-rose-300 hover:text-white px-2 py-0.5 rounded bg-rose-500/20 hover:bg-rose-500/40 transition"
            >
              {t.stopTts}
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col space-y-2.5">
          {/* Row 1: Full-width text input with embedded microphone on far right */}
          <div className="relative w-full flex items-center">
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder={isListening ? t.voiceListening : t.typePlaceholder}
              disabled={loading}
              className={`w-full bg-slate-900/90 text-xs text-white placeholder-slate-500 border rounded-xl pl-4 pr-11 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition disabled:opacity-50 ${
                isListening
                  ? "border-rose-500/80 ring-2 ring-rose-500/30"
                  : "border-slate-700"
              }`}
            />

            {/* In-Input Microphone Button */}
            <button
              type="button"
              onClick={toggleVoiceInput}
              disabled={loading}
              className={`absolute right-2 p-1.5 rounded-lg transition flex items-center justify-center ${
                isListening
                  ? "bg-rose-500/25 text-rose-300 border border-rose-500 shadow-md shadow-rose-500/30 animate-pulse"
                  : "text-slate-400 hover:text-amber-400 hover:bg-slate-800"
              }`}
              title={isListening ? t.micStop : t.micStart}
            >
              {isListening ? (
                <MicOff className="w-4 h-4 text-rose-400 animate-pulse" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Row 2: Language Options (Left) and Send/Submit Button (Right) */}
          <div className="flex items-center justify-between w-full">
            {/* Language Selector */}
            <div className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-900/90 border border-slate-700 text-xs text-slate-300 shrink-0 hover:border-amber-500/50 transition">
              <Languages className="w-4 h-4 text-amber-400" />
              <select
                value={currentLanguage}
                onChange={(e) => setCurrentLanguage(e.target.value as LanguageCode)}
                disabled={loading}
                className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer font-medium pr-1"
                title={t.activeLanguage}
              >
                {supportedLanguages.map((lang) => (
                  <option key={lang.code} value={lang.code} className="bg-slate-900 text-slate-100 py-1">
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Send / Submit Button */}
            <button
              type="submit"
              disabled={!inputQuery.trim() || loading}
              className="bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:hover:bg-amber-500 text-slate-950 font-bold px-4 py-2 rounded-xl transition shadow-lg shadow-amber-500/20 active:scale-95 shrink-0 flex items-center justify-center"
              title={t.send}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
