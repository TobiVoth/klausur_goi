import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "MC Klausurtrainer | Minimalistisches Prüfungstraining",
  description: "Interaktive Multiple-Choice Klausurvorbereitung mit Begründungen, Themenauswahl und 3-Phasen-Lernmodus.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
          {children}
        </main>
        <footer className="border-t border-border/60 py-6 text-center text-xs text-muted-foreground">
          <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p>
              MC Klausurtrainer &bull; Alle 15 Referat-Themengebiete &bull; 267 Klausurfragen
            </p>
            <div className="flex items-center gap-2 text-[11px] font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Lokale SQLite DB &bull; Docker-ready</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
