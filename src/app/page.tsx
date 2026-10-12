"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Shuffle,
  Target,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  BarChart3,
  Flame,
  Award,
  Layers,
  HelpCircle,
} from "lucide-react";
import { OverallStats, TopicStat } from "@/lib/types";

export default function HomePage() {
  const [stats, setStats] = useState<OverallStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [randomLimit, setRandomLimit] = useState<number>(20);
  const [masteryLimit, setMasteryLimit] = useState<number>(20);
  const [selectedTopicFilter, setSelectedTopicFilter] = useState<string>("");

  useEffect(() => {
    fetch("/api/stats")
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load stats:", err);
        setLoading(false);
      });
  }, []);

  const totalQuestions = stats?.totalQuestions || 267;
  const masteredQuestions = stats?.masteredQuestions || 0;
  const masteryPercentage = stats?.masteryPercentage || 0;
  const unmasteredCount = totalQuestions - masteredQuestions;

  const filteredTopics = (stats?.topics || []).filter((t) =>
    t.topic.toLowerCase().includes(selectedTopicFilter.toLowerCase())
  );

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="space-y-4 max-w-3xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border border-border/70 bg-secondary/60 text-muted-foreground">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Klausurvorbereitung Wintersemester</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
          Multiple-Choice Klausurtrainer
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
          Lerne effektiv und minimalistisch. Alle 267 Multiple-Choice Fragen aus
          allen 15 Themengebieten – mit direkter Auflösung, Begründungen und
          intelligentem 3er-Wiederholungsmodus.
        </p>
      </div>

      {/* Quick KPI Overview Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl border border-border/70 bg-card text-card-foreground shadow-sm">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>Gemeistert (3x in Folge)</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight">
              {masteredQuestions}
            </span>
            <span className="text-xs text-muted-foreground">/ {totalQuestions}</span>
          </div>
          <div className="mt-2 w-full bg-secondary rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${masteryPercentage}%` }}
            />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-border/70 bg-card text-card-foreground shadow-sm">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>Noch zu meistern</span>
            <Target className="w-4 h-4 text-blue-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight">
              {unmasteredCount}
            </span>
            <span className="text-xs text-muted-foreground">Fragen</span>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground truncate">
            {masteryPercentage}% Gesamtfortschritt
          </p>
        </div>

        <div className="p-4 rounded-xl border border-border/70 bg-card text-card-foreground shadow-sm">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>Genauigkeit</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight">
              {stats?.overallAccuracy || 0}%
            </span>
            <span className="text-xs text-muted-foreground">
              ({stats?.totalAnswers || 0} Antworten)
            </span>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground truncate">
            aller Beantwortungen
          </p>
        </div>

        <div className="p-4 rounded-xl border border-border/70 bg-card text-card-foreground shadow-sm">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>Abgeschlossene Sessions</span>
            <BarChart3 className="w-4 h-4 text-purple-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight">
              {stats?.totalSessions || 0}
            </span>
            <span className="text-xs text-muted-foreground">Durchläufe</span>
          </div>
          <Link
            href="/stats"
            className="mt-2 text-[11px] text-primary hover:underline inline-flex items-center gap-1 font-medium"
          >
            Zur Statistik &rarr;
          </Link>
        </div>
      </div>

      {/* Mode 2 & Mode 3 Quick Start Cards */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight text-foreground flex items-center gap-2">
          <Flame className="w-4 h-4 text-amber-500" />
          <span>Direkt-Lernmodi</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Mode 2: Shuffle / Mixed */}
          <div className="p-6 rounded-2xl border border-border/70 bg-card hover:border-border transition-all shadow-sm flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-semibold">
                  <Shuffle className="w-5 h-5" />
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded border border-border/80 bg-secondary/50 text-muted-foreground">
                  Modus 2
                </span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  Zufalls-Mix (Alle Themen)
                </h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Fragen aus allen 15 Themengebieten bunt durcheinandergemischt.
                  Ideal zur realistischen Klausursimulation.
                </p>
              </div>

              <div className="pt-2 flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">Fragenanzahl:</span>
                {[10, 20, 50, 0].map((num) => (
                  <button
                    key={num}
                    onClick={() => setRandomLimit(num)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                      randomLimit === num
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-secondary/60 text-muted-foreground border-border/60 hover:text-foreground"
                    }`}
                  >
                    {num === 0 ? "Alle" : num}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-6">
              <Link
                href={`/quiz?mode=all${randomLimit > 0 ? `&limit=${randomLimit}` : ""}`}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
              >
                <span>Mix starten</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Mode 3: Mastery / Repetition */}
          <div className="p-6 rounded-2xl border border-amber-500/20 bg-gradient-to-b from-amber-500/[0.04] to-card hover:border-amber-500/30 transition-all shadow-sm flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-semibold">
                  <Target className="w-5 h-5" />
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 font-medium">
                  Modus 3 &bull; Spaced Repetition
                </span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <span>Meisterungs-Modus</span>
                  <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    {unmasteredCount} offen
                  </span>
                </h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Trainiert gezielt nur Fragen, die du noch <strong>nicht 3-mal in Folge</strong> richtig
                  beantwortet hast. Gemeisterte Fragen werden aussortiert!
                </p>
              </div>

              <div className="pt-2 flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">Batch-Größe:</span>
                {[10, 20, 30, 0].map((num) => (
                  <button
                    key={num}
                    onClick={() => setMasteryLimit(num)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                      masteryLimit === num
                        ? "bg-amber-600 text-white border-amber-600 dark:bg-amber-500 dark:text-zinc-950 dark:border-amber-500"
                        : "bg-secondary/60 text-muted-foreground border-border/60 hover:text-foreground"
                    }`}
                  >
                    {num === 0 ? "Alle" : num}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-6">
              {unmasteredCount === 0 ? (
                <div className="w-full text-center py-2.5 text-xs text-emerald-600 font-semibold bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                  🎉 Wahnsinn! Alle Fragen 3x in Folge gemeistert!
                </div>
              ) : (
                <Link
                  href={`/quiz?mode=mastery${masteryLimit > 0 ? `&limit=${masteryLimit}` : ""}`}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-zinc-950 text-sm font-medium transition-colors shadow-sm"
                >
                  <span>Ungelernte trainieren</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mode 1: Topic Specific Grid */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono px-2 py-0.5 rounded border border-border/80 bg-secondary/50 text-muted-foreground">
                Modus 1
              </span>
              <h2 className="text-lg font-semibold tracking-tight text-foreground">
                Themen-Modus: Thema gezielt lernen
              </h2>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Wähle eines der 15 Fachgebiete aus, um alle dazugehörigen Fragen zu wiederholen.
            </p>
          </div>

          <div className="w-full sm:w-64">
            <input
              type="text"
              placeholder="Thema filtern..."
              value={selectedTopicFilter}
              onChange={(e) => setSelectedTopicFilter(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-border/70 bg-secondary/40 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-muted-foreground">
            Lade Themenbereiche...
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredTopics.map((t) => {
              const mastered = t.masteredQuestions || 0;
              const total = t.totalQuestions || 0;
              const pct = total > 0 ? Math.round((mastered / total) * 100) : 0;
              const isAllMastered = pct === 100;

              return (
                <div
                  key={t.topic}
                  className="p-4 rounded-xl border border-border/70 bg-card hover:border-border hover:shadow-sm transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-xs font-mono text-muted-foreground">
                        {total} Fragen
                      </span>
                      {isAllMastered ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>100%</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-muted-foreground font-medium">
                          {mastered}/{total} gemeistert
                        </span>
                      )}
                    </div>
                    <h3 className="font-medium text-sm text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                      {t.topic}
                    </h3>
                  </div>

                  <div className="mt-4 pt-3 border-t border-border/40 space-y-2">
                    <div className="w-full bg-secondary rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          isAllMastered ? "bg-emerald-500" : "bg-primary"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    <Link
                      href={`/quiz?mode=topic&topic=${encodeURIComponent(t.topic)}`}
                      className="w-full py-1.5 px-3 rounded-lg border border-border/80 bg-secondary/40 hover:bg-secondary text-foreground text-xs font-medium flex items-center justify-between transition-colors"
                    >
                      <span>Thema lernen</span>
                      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
