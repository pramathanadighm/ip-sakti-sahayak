import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "@/context/LanguageContext";

export const metadata: Metadata = {
  title: "IP-SAKTI Sahayak | Enterprise Legal & Patent RAG",
  description: "AI-Powered Indian Patent Law, CRI Guidelines, and Legal Document Intelligence Platform with Synchronized BBox Citations",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#090D16] text-slate-100 antialiased selection:bg-amber-500/30 selection:text-amber-200">
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}

