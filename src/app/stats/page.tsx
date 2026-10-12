"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  Award,
  Target,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ArrowRight,
  TrendingUp,
  BookOpen,
  Calendar,
  Layers,
  HelpCircle,
  Trash2,
} from "lucide-react";
import { OverallStats, TopicStat } from "@/lib/types";

export default function StatsPage() {
  const [stats, setStats] = useState<OverallStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [resetting, setResetting] = useState(false);

  const fetchStats = () => {
    setLoading(true);
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
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleReset = async () => {
    setResetting(true);
    try {
      await fetch("/api/reset", { method: "POST" });
      setResetConfirm(false);
      fetchStats();
    } catch (err) {
      console.error("Failed to reset:", err);
    } finally {
      setResetting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-muted-foreground">Statistiken werden geladen...</p>
      </div>
    );
  }

  const total = stats?.totalQuestions || 267;
  const mastered = stats?.masteredQuestions || 0;
  const inProgress = stats?.inProgressQuestions || 0;
  const unseen = stats?.unseenQuestions || 0;
  const masteryPct = stats?.masteryPercentage || 0;

  return (
    <div className="space-y-10">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-primary" />
            <span>Lernstatistiken & Fortschritt</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Verfolge deine Entwicklung über alle 15 Themengebiete und Klausursessions hinweg.
          </p>
        </div>

        <button
          onClick={() => setResetConfirm(true)}
          className="self-start sm:self-auto px-3 py-1.5 rounded-lg border border-border/80 bg-secondary/40 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 text-xs font-medium text-muted-foreground transition-colors flex items-center gap-1.5"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Fortschritt zurücksetzen</span>
        </button>
      </div>

      {/* Reset Confirmation Dialog Modal */}
      {resetConfirm && (
        <div className="p-4 rounded-xl border border-destructive/40 bg-destructive/10 text-destructive-foreground space-y-3">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <strong className="text-sm font-semibold text-foreground block">
                Möchtest du wirklich alle Lernstatistiken löschen?
              </strong>
              <p className="text-xs text-muted-foreground mt-0.5">
                Alle gespeicherten Sessions, Antwort-Serien und Meisterungs-Stände werden unwiderruflich auf Null gesetzt.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 pl-7.5">
            <button
              onClick={handleReset}
              disabled={resetting}
              className="px-3 py-1.5 rounded-lg bg-destructive text-destructive-foreground text-xs font-medium hover:bg-destructive/90"
            >
              {resetting ? "Wird zurückgesetzt..." : "Ja, alles zurücksetzen"}
            </button>
            <button
              onClick={() => setResetConfirm(false)}
              className="px-3 py-1.5 rounded-lg border border-border bg-card text-foreground text-xs font-medium hover:bg-secondary"
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl border border-border/80 bg-card shadow-sm space-y-1">
          <span className="text-xs text-muted-foreground flex items-center justify-between">
            <span>Gemeistert (3x in Folge)</span>
            <Award className="w-4 h-4 text-amber-500" />
          </span>
          <div className="flex items-baseline gap-2">
            <strong className="text-2xl font-bold text-foreground">{mastered}</strong>
            <span className="text-xs text-muted-foreground">/ {total} ({masteryPct}%)</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-1.5 overflow-hidden mt-2">
            <div
              className="bg-emerald-500 h-1.5 rounded-full"
              style={{ width: `${masteryPct}%` }}
            />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-border/80 bg-card shadow-sm space-y-1">
          <span className="text-xs text-muted-foreground flex items-center justify-between">
            <span>In Bearbeitung</span>
            <Target className="w-4 h-4 text-blue-500" />
          </span>
          <div className="flex items-baseline gap-2">
            <strong className="text-2xl font-bold text-foreground">{inProgress}</strong>
            <span className="text-xs text-muted-foreground">Fragen</span>
          </div>
          <p className="text-[11px] text-muted-foreground pt-1">
            Mindestens 1x beantwortet
          </p>
        </div>

        <div className="p-4 rounded-xl border border-border/80 bg-card shadow-sm space-y-1">
          <span className="text-xs text-muted-foreground flex items-center justify-between">
            <span>Noch ungesehen</span>
            <Layers className="w-4 h-4 text-zinc-400" />
          </span>
          <div className="flex items-baseline gap-2">
            <strong className="text-2xl font-bold text-foreground">{unseen}</strong>
            <span className="text-xs text-muted-foreground">Fragen</span>
          </div>
          <p className="text-[11px] text-muted-foreground pt-1">
            Bislang noch nicht trainiert
          </p>
        </div>

        <div className="p-4 rounded-xl border border-border/80 bg-card shadow-sm space-y-1">
          <span className="text-xs text-muted-foreground flex items-center justify-between">
            <span>Gesamtgenauigkeit</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </span>
          <div className="flex items-baseline gap-2">
            <strong className="text-2xl font-bold text-foreground">
              {stats?.overallAccuracy || 0}%
            </strong>
            <span className="text-xs text-muted-foreground">
              ({stats?.totalAnswers || 0} Antw.)
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground pt-1">
            {stats?.totalSessions || 0} Sessions absolviert
          </p>
        </div>
      </div>

      {/* Topic Breakdown Section */}
      <div className="p-6 rounded-2xl border border-border/80 bg-card space-y-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" />
              <span>Fortschritt nach Themengebiet</span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Übersicht über alle 15 Referatsthemen und wie viele Fragen 3-mal in Folge korrekt gelöst wurden.
            </p>
          </div>
        </div>

        <div className="divide-y divide-border/60">
          {(stats?.topics || []).map((t) => {
            const isFinished = t.masteryPercentage === 100;
            return (
              <div
                key={t.topic}
                className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1 max-w-md">
                  <span className="text-xs sm:text-sm font-medium text-foreground block">
                    {t.topic}
                  </span>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono">
                    <span>
                      {t.masteredQuestions} / {t.totalQuestions} gemeistert ({t.masteryPercentage}%)
                    </span>
                    <span>&bull;</span>
                    <span>Genauigkeit: {t.accuracy}%</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 w-full sm:w-60">
                  <div className="flex-1 bg-secondary rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        isFinished ? "bg-emerald-500" : "bg-primary"
                      }`}
                      style={{ width: `${t.masteryPercentage}%` }}
                    />
                  </div>

                  <Link
                    href={`/quiz?mode=topic&topic=${encodeURIComponent(t.topic)}`}
                    className="shrink-0 px-2.5 py-1 rounded-md border border-border/80 bg-secondary/50 hover:bg-secondary text-foreground text-xs font-medium transition-colors"
                  >
                    Üben
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Weakest Questions (if any) */}
      {stats?.weakestQuestions && stats.weakestQuestions.length > 0 && (
        <div className="p-6 rounded-2xl border border-border/80 bg-card space-y-4 shadow-sm">
          <div>
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Häufigste Fehlerquellen (Schwachstellen)</span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Fragen, die du bereits probiert hast, aber noch nicht 3x in Folge meistern konntest.
            </p>
          </div>

          <div className="space-y-2.5">
            {stats.weakestQuestions.map((q) => (
              <div
                key={q.id}
                className="p-3.5 rounded-xl border border-border/60 bg-secondary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-0.5">
                  <span className="text-[11px] font-mono text-muted-foreground block">
                    {q.topic} &bull; Serie: {q.consecutiveCorrect}/3
                  </span>
                  <span className="font-medium text-foreground">{q.title}</span>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  <span className="font-mono text-muted-foreground">
                    {q.totalCorrect}/{q.totalAttempts} Richtig ({q.accuracy}%)
                  </span>
                  <Link
                    href={`/quiz?mode=topic&topic=${encodeURIComponent(q.topic)}`}
                    className="px-2.5 py-1 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90"
                  >
                    Thema trainieren
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Sessions History */}
      <div className="p-6 rounded-2xl border border-border/80 bg-card space-y-4 shadow-sm">
        <div>
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            <span>Vergangene Lern-Durchläufe</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Historie deiner letzten Trainingseinheiten.
          </p>
        </div>

        {(!stats?.recentSessions || stats.recentSessions.length === 0) ? (
          <div className="p-8 text-center text-xs text-muted-foreground">
            Noch keine Sessions abgeschlossen. Starte jetzt deinen ersten Lerndurchlauf!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-muted-foreground border-b border-border/60 font-mono">
                <tr>
                  <th className="py-2.5 px-3">Datum</th>
                  <th className="py-2.5 px-3">Modus</th>
                  <th className="py-2.5 px-3">Fragen</th>
                  <th className="py-2.5 px-3">Ergebnis</th>
                  <th className="py-2.5 px-3">Genauigkeit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {stats.recentSessions.map((s) => (
                  <tr key={s.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="py-3 px-3 font-mono text-muted-foreground">
                      {new Date(s.createdAt).toLocaleDateString("de-DE", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-3 px-3">
                      <span className="capitalize font-medium text-foreground">
                        {s.mode === "topic" ? s.topic : s.mode === "all" ? "Zufalls-Mix" : "Meisterung"}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono">{s.totalQuestions}</td>
                    <td className="py-3 px-3 font-mono font-medium text-foreground">
                      {s.correctCount} / {s.totalQuestions}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`font-mono font-bold ${
                          s.accuracy >= 80
                            ? "text-emerald-500"
                            : s.accuracy >= 50
                            ? "text-amber-500"
                            : "text-red-500"
                        }`}
                      >
                        {s.accuracy}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
