"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";
import { BookOpen, BarChart3, Award, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

export function Navbar() {
  const pathname = usePathname();
  const [stats, setStats] = useState<{ mastered: number; total: number } | null>(null);

  useEffect(() => {
    fetch("/api/stats")
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data.totalQuestions === "number") {
          setStats({
            mastered: data.masteredQuestions || 0,
            total: data.totalQuestions || 267,
          });
        }
      })
      .catch(() => {});
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm tracking-tight shadow-sm group-hover:scale-105 transition-transform">
            MC
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm tracking-tight text-foreground flex items-center gap-1.5">
              KlausurTrainer
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded border border-border bg-muted/60 text-muted-foreground font-normal">
                Minimal
              </span>
            </span>
            <span className="text-[11px] text-muted-foreground">
              Multiple-Choice Exam Prep
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          {stats && (
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full border border-border/80 bg-secondary/50 text-xs text-muted-foreground mr-2">
              <Award className="w-3.5 h-3.5 text-amber-500" />
              <span>Gemeistert:</span>
              <strong className="text-foreground font-medium">
                {stats.mastered}/{stats.total}
              </strong>
            </div>
          )}

          <Link
            href="/"
            className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors flex items-center gap-1.5 ${
              pathname === "/"
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Lernmodi</span>
          </Link>

          <Link
            href="/stats"
            className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors flex items-center gap-1.5 ${
              pathname === "/stats"
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Statistiken</span>
          </Link>

          <div className="ml-1 pl-1 border-l border-border/60">
            <ThemeToggle />
          </div>
        </nav>
      </div>
    </header>
  );
}
