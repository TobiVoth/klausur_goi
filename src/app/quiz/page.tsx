"use client";

import { Suspense, useEffect, useState, useId } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import confetti from "canvas-confetti";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  X,
  Info,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RotateCcw,
  Award,
  Sparkles,
  Flame,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Home,
} from "lucide-react";
import { Question, AnswerResult } from "@/lib/types";

function QuizContainer() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const mode = (searchParams.get("mode") || "all") as "topic" | "all" | "mastery";
  const topic = searchParams.get("topic") || undefined;
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? parseInt(limitParam, 10) : undefined;

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [isAnswered, setIsAnswered] = useState(false);
  const [currentResult, setCurrentResult] = useState<AnswerResult | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);

  // Store history of answers in this session
  const [sessionResults, setSessionResults] = useState<{
    question: Question;
    selectedIndices: number[];
    isCorrect: boolean;
    consecutiveCorrect: number;
    explanation: string;
  }[]>([]);

  // Load questions
  useEffect(() => {
    setLoading(true);
    let url = `/api/questions?mode=${mode}`;
    if (topic) url += `&topic=${encodeURIComponent(topic)}`;
    if (limit) url += `&limit=${limit}`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.questions && data.questions.length > 0) {
          setQuestions(data.questions);
        } else {
          setQuestions([]);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load questions:", err);
        setLoading(false);
      });
  }, [mode, topic, limit]);

  const currentQ = questions[currentIndex];

  // Option selection toggle
  const toggleOption = (idx: number) => {
    if (isAnswered) return;
    setSelectedIndices((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  // Submit Answer
  const handleSubmit = async () => {
    if (selectedIndices.length === 0 || isAnswered || !currentQ) return;

    try {
      const res = await fetch("/api/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: currentQ.id,
          selectedIndices,
        }),
      });
      const data: AnswerResult = await res.json();
      setCurrentResult(data);
      setIsAnswered(true);

      setSessionResults((prev) => [
        ...prev,
        {
          question: currentQ,
          selectedIndices,
          isCorrect: data.isCorrect,
          consecutiveCorrect: data.consecutiveCorrect,
          explanation: data.explanation || currentQ.explanation,
        },
      ]);
    } catch (err) {
      console.error("Failed to submit answer:", err);
    }
  };

  // Next Question or Finish
  const handleNext = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedIndices([]);
      setIsAnswered(false);
      setCurrentResult(null);
      setShowExplanation(false);
    } else {
      finishQuiz();
    }
  };

  // Finish Quiz and Save Session
  const finishQuiz = async () => {
    setSessionCompleted(true);
    const correctCount = sessionResults.filter((r) => r.isCorrect).length;
    const totalQ = questions.length;
    const accuracy = totalQ > 0 ? Math.round((correctCount / totalQ) * 100) : 0;

    if (accuracy >= 80) {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
    }

    try {
      const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: sessionId,
          mode,
          topic: topic || null,
          totalQuestions: totalQ,
          correctCount,
          details: sessionResults.map((r) => ({
            questionId: r.question.id,
            title: r.question.title,
            topic: r.question.topic,
            selectedIndices: r.selectedIndices,
            correctIndices: r.question.correctIndices,
            isCorrect: r.isCorrect,
            explanation: r.explanation,
            consecutiveCorrect: r.consecutiveCorrect,
          })),
        }),
      });
    } catch (err) {
      console.error("Failed to save session:", err);
    }
  };

  // Loading State
  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-muted-foreground">Fragen werden vorbereitet...</p>
      </div>
    );
  }

  // No Questions Found
  if (!loading && questions.length === 0) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-5 p-8 rounded-2xl border border-border/70 bg-card">
        <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
          <Award className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-foreground">
            {mode === "mastery"
              ? "Alles gemeistert!"
              : "Keine Fragen gefunden"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {mode === "mastery"
              ? "Du hast bereits alle Fragen mindestens 3-mal in Folge richtig beantwortet. Fantastische Vorbereitung!"
              : "Für diesen Filter konnten keine Fragen gefunden werden."}
          </p>
        </div>
        <div className="pt-2 flex justify-center gap-3">
          <Link
            href="/"
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90"
          >
            Zurück zur Übersicht
          </Link>
          <Link
            href="/stats"
            className="px-4 py-2 rounded-lg border border-border bg-secondary/50 text-foreground text-xs font-medium hover:bg-secondary"
          >
            Statistiken ansehen
          </Link>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // SUMMARY VIEW (End of Quiz)
  // -------------------------------------------------------------
  if (sessionCompleted) {
    const totalQ = questions.length;
    const correctCount = sessionResults.filter((r) => r.isCorrect).length;
    const accuracy = totalQ > 0 ? Math.round((correctCount / totalQ) * 100) : 0;
    const newlyMastered = sessionResults.filter((r) => r.consecutiveCorrect >= 3).length;

    // Group results by topic
    const topicBreakdown: Record<string, { total: number; correct: number }> = {};
    for (const res of sessionResults) {
      const top = res.question.topic;
      if (!topicBreakdown[top]) topicBreakdown[top] = { total: 0, correct: 0 };
      topicBreakdown[top].total += 1;
      if (res.isCorrect) topicBreakdown[top].correct += 1;
    }

    return (
      <div className="max-w-3xl mx-auto space-y-8 py-4">
        {/* Top Header Card */}
        <div className="p-6 sm:p-8 rounded-2xl border border-border/80 bg-card text-card-foreground shadow-sm text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-secondary text-muted-foreground">
            <span>Session Abgeschlossen</span>
            <span>&bull;</span>
            <span className="capitalize">{mode === "topic" ? topic : mode}</span>
          </div>

          <div className="space-y-1">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              {accuracy >= 80 ? "Exzellente Leistung! 🎉" : accuracy >= 50 ? "Gute Wiederholung! 👍" : "Weiter dranbleiben! 💪"}
            </h1>
            <p className="text-sm text-muted-foreground">
              Hier ist die Zusammenfassung deiner Ergebnisse dieser Session.
            </p>
          </div>

          {/* Big Score Circles */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 max-w-lg mx-auto">
            <div className="p-4 rounded-xl border border-border/70 bg-secondary/30">
              <span className="text-xs text-muted-foreground block">Ergebnis</span>
              <strong className="text-2xl font-bold text-foreground">
                {correctCount} / {totalQ}
              </strong>
            </div>

            <div className="p-4 rounded-xl border border-border/70 bg-secondary/30">
              <span className="text-xs text-muted-foreground block">Genauigkeit</span>
              <strong
                className={`text-2xl font-bold ${
                  accuracy >= 80
                    ? "text-emerald-500"
                    : accuracy >= 50
                    ? "text-amber-500"
                    : "text-red-500"
                }`}
              >
                {accuracy}%
              </strong>
            </div>

            <div className="col-span-2 sm:col-span-1 p-4 rounded-xl border border-border/70 bg-secondary/30">
              <span className="text-xs text-muted-foreground block">Aktuell Gemeistert</span>
              <strong className="text-2xl font-bold text-amber-500 flex items-center justify-center gap-1">
                <Award className="w-5 h-5 inline" />
                <span>{newlyMastered}</span>
              </strong>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => {
                setSessionCompleted(false);
                setCurrentIndex(0);
                setSelectedIndices([]);
                setIsAnswered(false);
                setCurrentResult(null);
                setShowExplanation(false);
                setSessionResults([]);
                // Reload questions
                window.location.reload();
              }}
              className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs sm:text-sm font-medium hover:bg-primary/90 flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Nochmal lernen</span>
            </button>

            <Link
              href="/"
              className="px-4 py-2 rounded-xl border border-border/80 bg-secondary/50 text-foreground text-xs sm:text-sm font-medium hover:bg-secondary flex items-center gap-2"
            >
              <Home className="w-4 h-4" />
              <span>Zurück zur Übersicht</span>
            </Link>

            <Link
              href="/stats"
              className="px-4 py-2 rounded-xl border border-border/80 bg-secondary/50 text-foreground text-xs sm:text-sm font-medium hover:bg-secondary flex items-center gap-2"
            >
              <BarChart3 className="w-4 h-4" />
              <span>Statistiken</span>
            </Link>
          </div>
        </div>

        {/* Breakdown by Topic */}
        <div className="p-6 rounded-2xl border border-border/80 bg-card space-y-4">
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            <span>Ergebnisse nach Thema</span>
          </h2>

          <div className="space-y-3">
            {Object.entries(topicBreakdown).map(([topName, data]) => {
              const topAcc = Math.round((data.correct / data.total) * 100);
              return (
                <div key={topName} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground">{topName}</span>
                    <span className="text-muted-foreground font-mono">
                      {data.correct} von {data.total} ({topAcc}%)
                    </span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-1.5 rounded-full ${
                        topAcc >= 80 ? "bg-emerald-500" : topAcc >= 50 ? "bg-amber-500" : "bg-red-500"
                      }`}
                      style={{ width: `${topAcc}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detailed Question Review */}
        <div className="p-6 rounded-2xl border border-border/80 bg-card space-y-4">
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-primary" />
            <span>Fragen im Detail überprüfen ({sessionResults.length})</span>
          </h2>

          <div className="space-y-3">
            {sessionResults.map((r, i) => (
              <details
                key={r.question.id}
                className="group border border-border/60 rounded-xl p-4 bg-secondary/20 hover:bg-secondary/30 transition-colors"
              >
                <summary className="flex items-start justify-between gap-3 cursor-pointer list-none">
                  <div className="flex items-start gap-2.5">
                    {r.isCorrect ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <span className="text-xs font-mono text-muted-foreground block mb-0.5">
                        Frage {i + 1} &bull; {r.question.topic}
                      </span>
                      <p className="text-xs sm:text-sm font-medium text-foreground">
                        {r.question.title}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    <span
                      className={`text-[11px] font-mono px-2 py-0.5 rounded ${
                        r.isCorrect
                          ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                          : "bg-red-500/10 text-red-600 border border-red-500/20"
                      }`}
                    >
                      {r.isCorrect ? "Richtig" : "Falsch"}
                    </span>
                    <ChevronDown className="w-4 h-4 text-muted-foreground group-open:rotate-180 transition-transform" />
                  </div>
                </summary>

                <div className="mt-4 pt-3 border-t border-border/50 space-y-3 text-xs">
                  <div className="space-y-1.5">
                    <span className="text-muted-foreground font-semibold">Antwortmöglichkeiten:</span>
                    {r.question.options.map((opt, optIdx) => {
                      const isCorrectOpt = r.question.correctIndices.includes(optIdx);
                      const wasSelected = r.selectedIndices.includes(optIdx);
                      return (
                        <div
                          key={optIdx}
                          className={`p-2 rounded-lg flex items-center justify-between gap-2 ${
                            isCorrectOpt
                              ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-900 dark:text-emerald-200"
                              : wasSelected
                              ? "bg-red-500/10 border border-red-500/20 text-red-900 dark:text-red-200"
                              : "text-muted-foreground"
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <span className="font-mono font-bold">
                              {String.fromCharCode(65 + optIdx)})
                            </span>
                            <span>{opt}</span>
                          </span>
                          <span className="text-[10px] font-mono shrink-0">
                            {isCorrectOpt && wasSelected && "✓ Deine richtige Wahl"}
                            {isCorrectOpt && !wasSelected && "✓ Richtige Lösung (übersehen)"}
                            {!isCorrectOpt && wasSelected && "✕ Fälschlich gewählt"}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {r.explanation && (
                    <div className="p-3 rounded-lg bg-secondary/60 border border-border/60 text-muted-foreground">
                      <strong className="text-foreground block mb-1">
                        Begründung:
                      </strong>
                      <p className="leading-relaxed">{r.explanation}</p>
                    </div>
                  )}
                </div>
              </details>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // ACTIVE QUESTION VIEW
  // -------------------------------------------------------------
  const isMultiSelect = currentQ.correctIndices.length > 1;
  const streak = currentResult ? currentResult.consecutiveCorrect : currentQ.consecutiveCorrect;
  const isMasteredNow = streak >= 3;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Quiz Top Navigation Bar */}
      <div className="flex items-center justify-between gap-3 text-xs">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Abbrechen</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full border border-border/70 bg-secondary/50 font-medium text-muted-foreground truncate max-w-[200px] sm:max-w-none">
            {currentQ.topic}
          </span>
          <span className="font-mono text-muted-foreground">
            {currentIndex + 1} / {questions.length}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-secondary rounded-full h-1.5 overflow-hidden">
        <div
          className="bg-primary h-1.5 rounded-full transition-all duration-300"
          style={{
            width: `${((currentIndex + (isAnswered ? 1 : 0)) / questions.length) * 100}%`,
          }}
        />
      </div>

      {/* Main Question Card */}
      <div className="p-6 sm:p-8 rounded-2xl border border-border/80 bg-card text-card-foreground shadow-sm space-y-6">
        {/* Question Metadata Row */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            {isMasteredNow ? (
              <span className="inline-flex items-center gap-1 text-amber-500 font-medium px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                <Award className="w-3 h-3" />
                <span>Gemeistert ({streak}x in Folge)</span>
              </span>
            ) : streak > 0 ? (
              <span className="inline-flex items-center gap-1 text-orange-500 font-medium px-2 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/20">
                <Flame className="w-3 h-3" />
                <span>{streak}x in Folge richtig</span>
              </span>
            ) : (
              <span className="text-muted-foreground">Neu oder zu wiederholen</span>
            )}
          </div>

          <span
            className={`font-medium ${
              isMultiSelect
                ? "text-blue-600 dark:text-blue-400 font-medium"
                : "text-muted-foreground"
            }`}
          >
            {isMultiSelect ? "Mehrfachauswahl möglich" : "Einfachauswahl"}
          </span>
        </div>

        {/* Question Text */}
        <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-foreground leading-snug">
          {currentQ.title}
        </h2>

        {/* Options List */}
        <div className="space-y-2.5 pt-2">
          {currentQ.options.map((optionText, optIdx) => {
            const letter = String.fromCharCode(65 + optIdx);
            const isSelected = selectedIndices.includes(optIdx);

            // Styling states after answer is submitted
            let optionStateClasses = "border-border/80 bg-card hover:border-primary/50 hover:bg-secondary/40 text-foreground";
            let indicator = null;

            if (isAnswered && currentResult) {
              const isCorrectOption = currentResult.correctIndices.includes(optIdx);

              if (isCorrectOption && isSelected) {
                // Correctly selected
                optionStateClasses =
                  "border-emerald-500/80 bg-emerald-500/10 text-emerald-950 dark:text-emerald-100 ring-1 ring-emerald-500/50";
                indicator = <Check className="w-4 h-4 text-emerald-500" />;
              } else if (isCorrectOption && !isSelected) {
                // Was correct but user missed it
                optionStateClasses =
                  "border-emerald-500/60 border-dashed bg-emerald-500/[0.06] text-emerald-900 dark:text-emerald-200";
                indicator = (
                  <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                    (Richtig)
                  </span>
                );
              } else if (!isCorrectOption && isSelected) {
                // User picked wrong
                optionStateClasses =
                  "border-red-500/80 bg-red-500/10 text-red-950 dark:text-red-100 ring-1 ring-red-500/50";
                indicator = <X className="w-4 h-4 text-red-500" />;
              } else {
                // Unselected incorrect option
                optionStateClasses = "border-border/40 opacity-50 text-muted-foreground";
              }
            } else if (isSelected) {
              // Selected before check
              optionStateClasses =
                "border-primary bg-primary/5 text-foreground ring-1 ring-primary";
            }

            return (
              <button
                key={optIdx}
                type="button"
                onClick={() => toggleOption(optIdx)}
                disabled={isAnswered}
                className={`w-full text-left p-3.5 sm:p-4 rounded-xl border transition-all flex items-start gap-3 select-none ${optionStateClasses}`}
              >
                {/* Letter Badge */}
                <span
                  className={`w-6 h-6 rounded-md flex items-center justify-center font-mono text-xs font-bold shrink-0 transition-colors ${
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {letter}
                </span>

                {/* Option Text */}
                <span className="text-xs sm:text-sm font-normal flex-1 pt-0.5 leading-relaxed">
                  {optionText}
                </span>

                {/* Status Indicator */}
                {indicator && <div className="shrink-0 pt-0.5">{indicator}</div>}
              </button>
            );
          })}
        </div>

        {/* Action Controls & Result Banner */}
        <div className="pt-4 space-y-4">
          {!isAnswered ? (
            <button
              onClick={handleSubmit}
              disabled={selectedIndices.length === 0}
              className={`w-full py-3 px-4 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 shadow-sm ${
                selectedIndices.length > 0
                  ? "bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
                  : "bg-secondary text-muted-foreground cursor-not-allowed opacity-60"
              }`}
            >
              <span>Antwort prüfen</span>
              <Check className="w-4 h-4" />
            </button>
          ) : (
            <div className="space-y-4">
              {/* Feedback Banner */}
              <div
                className={`p-4 rounded-xl border flex items-start justify-between gap-3 ${
                  currentResult?.isCorrect
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-950 dark:text-emerald-100"
                    : "border-red-500/40 bg-red-500/10 text-red-950 dark:text-red-100"
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {currentResult?.isCorrect ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <strong className="block text-sm font-semibold">
                      {currentResult?.isCorrect
                        ? "Richtig gelöst!"
                        : "Leider nicht ganz richtig."}
                    </strong>
                    <span className="text-xs opacity-90 block mt-0.5">
                      {currentResult?.isCorrect ? (
                        currentResult.consecutiveCorrect >= 3 ? (
                          <span className="font-semibold text-emerald-600 dark:text-emerald-300">
                            🎉 3x in Folge richtig! Diese Frage ist jetzt gemeistert.
                          </span>
                        ) : (
                          `Serie erhöht auf ${currentResult.consecutiveCorrect}x in Folge.`
                        )
                      ) : (
                        "Serie wurde auf 0 zurückgesetzt. Die richtigen Antworten sind oben grün hervorgehoben."
                      )}
                    </span>
                  </div>
                </div>

                {/* Info Button for Explanation */}
                <button
                  onClick={() => setShowExplanation((prev) => !prev)}
                  className="px-3 py-1.5 rounded-lg border border-border/80 bg-background/80 hover:bg-background text-foreground text-xs font-medium flex items-center gap-1.5 shrink-0 transition-colors shadow-sm"
                  title="Begründung der Lösung einsehen"
                >
                  <Info className="w-3.5 h-3.5 text-primary" />
                  <span>{showExplanation ? "Verbergen" : "Begründung"}</span>
                </button>
              </div>

              {/* Collapsible / Expandable Explanation ("Begründung") */}
              {showExplanation && (
                <div className="p-4 rounded-xl border border-border/70 bg-secondary/40 text-xs sm:text-sm text-foreground space-y-1.5 animate-in fade-in duration-200">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Offizielle Begründung der Klausurfrage:</span>
                  </div>
                  <p className="leading-relaxed text-muted-foreground whitespace-pre-line text-xs sm:text-sm">
                    {currentResult?.explanation || currentQ.explanation || "Keine Begründung vorhanden."}
                  </p>
                </div>
              )}

              {/* Next Question Button */}
              <button
                onClick={handleNext}
                className="w-full py-3 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <span>
                  {currentIndex + 1 < questions.length
                    ? "Nächste Frage"
                    : "Ergebnisse anzeigen"}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function QuizPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-2xl mx-auto py-16 text-center text-xs text-muted-foreground">
          Lade Quiz...
        </div>
      }
    >
      <QuizContainer />
    </Suspense>
  );
}
