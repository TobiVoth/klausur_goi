import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { Question, QuizSessionSummary, OverallStats, TopicStat } from "./types";

let dbInstance: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (dbInstance) return dbInstance;

  const dbDir = process.env.DATA_DIR || path.join(process.cwd(), "data");
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const dbPath = path.join(dbDir, "klausur.db");
  const db = new DatabaseSync(dbPath);

  // Enable WAL mode for better concurrency and performance
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA synchronous = NORMAL;");

  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS questions (
      id TEXT PRIMARY KEY,
      topic TEXT NOT NULL,
      source_file TEXT NOT NULL,
      title TEXT NOT NULL,
      options_json TEXT NOT NULL,
      correct_indices_json TEXT NOT NULL,
      explanation TEXT NOT NULL,
      consecutive_correct INTEGER NOT NULL DEFAULT 0,
      total_attempts INTEGER NOT NULL DEFAULT 0,
      total_correct INTEGER NOT NULL DEFAULT 0,
      last_attempt_at TEXT
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      mode TEXT NOT NULL,
      topic TEXT,
      total_questions INTEGER NOT NULL,
      correct_count INTEGER NOT NULL,
      details_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_questions_topic ON questions(topic);
    CREATE INDEX IF NOT EXISTS idx_questions_streak ON questions(consecutive_correct);
    CREATE INDEX IF NOT EXISTS idx_sessions_created ON sessions(created_at);
  `);

  // Seed or update questions from questions.json
  seedQuestions(db);

  dbInstance = db;
  return db;
}

function seedQuestions(db: DatabaseSync) {
  let questionsData: any[] = [];
  const possiblePaths = [
    path.join(process.cwd(), "src", "data", "questions.json"),
    path.join(process.cwd(), "all_questions.json"),
    path.join(process.cwd(), "data", "questions.json"),
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      try {
        const raw = fs.readFileSync(p, "utf-8");
        questionsData = JSON.parse(raw);
        break;
      } catch (err) {
        console.error(`Failed to load questions from ${p}:`, err);
      }
    }
  }

  if (!questionsData || questionsData.length === 0) {
    console.warn("No questions data found to seed.");
    return;
  }

  const insertStmt = db.prepare(`
    INSERT INTO questions (id, topic, source_file, title, options_json, correct_indices_json, explanation, consecutive_correct, total_attempts, total_correct)
    VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, 0)
    ON CONFLICT(id) DO UPDATE SET
      topic = excluded.topic,
      source_file = excluded.source_file,
      title = excluded.title,
      options_json = excluded.options_json,
      correct_indices_json = excluded.correct_indices_json,
      explanation = excluded.explanation;
  `);

  for (const q of questionsData) {
    insertStmt.run(
      q.id,
      q.topic,
      q.sourceFile || "",
      q.title,
      JSON.stringify(q.options || []),
      JSON.stringify(q.correctIndices || []),
      q.explanation || ""
    );
  }
}

function mapRowToQuestion(row: any): Question {
  const consecutiveCorrect = Number(row.consecutive_correct || 0);
  return {
    id: row.id,
    topic: row.topic,
    sourceFile: row.source_file,
    title: row.title,
    options: JSON.parse(row.options_json || "[]"),
    correctIndices: JSON.parse(row.correct_indices_json || "[]"),
    explanation: row.explanation || "",
    consecutiveCorrect,
    totalAttempts: Number(row.total_attempts || 0),
    totalCorrect: Number(row.total_correct || 0),
    lastAttemptAt: row.last_attempt_at || undefined,
    isMastered: consecutiveCorrect >= 3,
  };
}

export function getAllTopics(): { topic: string; count: number; masteredCount: number }[] {
  const db = getDb();
  const rows = db.prepare(`
    SELECT 
      topic,
      COUNT(*) as count,
      SUM(CASE WHEN consecutive_correct >= 3 THEN 1 ELSE 0 END) as mastered_count
    FROM questions
    GROUP BY topic
    ORDER BY topic ASC
  `).all() as any[];

  return rows.map((r) => ({
    topic: r.topic,
    count: Number(r.count),
    masteredCount: Number(r.mastered_count || 0),
  }));
}

export function getQuestionsByFilter(filter: {
  mode: "topic" | "all" | "mastery";
  topic?: string;
  limit?: number;
}): Question[] {
  const db = getDb();
  let query = "SELECT * FROM questions";
  const params: any[] = [];

  if (filter.mode === "topic" && filter.topic) {
    query += " WHERE topic = ?";
    params.push(filter.topic);
  } else if (filter.mode === "mastery") {
    query += " WHERE consecutive_correct < 3";
  }

  // Randomize questions for quiz
  query += " ORDER BY RANDOM()";

  if (filter.limit && filter.limit > 0) {
    query += ` LIMIT ${Math.floor(filter.limit)}`;
  }

  const rows = db.prepare(query).all(...params);
  return rows.map(mapRowToQuestion);
}

export function recordAnswer(
  questionId: string,
  selectedIndices: number[]
): {
  questionId: string;
  selectedIndices: number[];
  isCorrect: boolean;
  consecutiveCorrect: number;
  isMastered: boolean;
  correctIndices: number[];
  explanation: string;
} {
  const db = getDb();
  const row = db.prepare("SELECT * FROM questions WHERE id = ?").get(questionId) as any;
  if (!row) {
    throw new Error(`Question with id ${questionId} not found`);
  }

  const correctIndices: number[] = JSON.parse(row.correct_indices_json || "[]");
  const explanation = row.explanation || "";

  // Check if selected matches correct indices exactly
  const sortedSelected = [...selectedIndices].sort((a, b) => a - b);
  const sortedCorrect = [...correctIndices].sort((a, b) => a - b);
  const isCorrect =
    sortedSelected.length === sortedCorrect.length &&
    sortedSelected.every((val, idx) => val === sortedCorrect[idx]);

  const currentConsecutive = Number(row.consecutive_correct || 0);
  const newConsecutive = isCorrect ? currentConsecutive + 1 : 0;
  const newTotalAttempts = Number(row.total_attempts || 0) + 1;
  const newTotalCorrect = Number(row.total_correct || 0) + (isCorrect ? 1 : 0);
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE questions 
    SET 
      consecutive_correct = ?,
      total_attempts = ?,
      total_correct = ?,
      last_attempt_at = ?
    WHERE id = ?
  `).run(newConsecutive, newTotalAttempts, newTotalCorrect, now, questionId);

  return {
    questionId,
    selectedIndices,
    isCorrect,
    consecutiveCorrect: newConsecutive,
    isMastered: newConsecutive >= 3,
    correctIndices,
    explanation,
  };
}

export function saveQuizSession(session: {
  id: string;
  mode: "topic" | "all" | "mastery";
  topic?: string;
  totalQuestions: number;
  correctCount: number;
  details: any;
}): void {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO sessions (id, mode, topic, total_questions, correct_count, details_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    session.id,
    session.mode,
    session.topic || null,
    session.totalQuestions,
    session.correctCount,
    JSON.stringify(session.details || []),
    now
  );
}

export function getOverallStats(): OverallStats {
  const db = getDb();

  const totalQuestionsRow = db.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN consecutive_correct >= 3 THEN 1 ELSE 0 END) as mastered,
      SUM(CASE WHEN total_attempts = 0 THEN 1 ELSE 0 END) as unseen,
      SUM(CASE WHEN total_attempts > 0 AND consecutive_correct < 3 THEN 1 ELSE 0 END) as in_progress,
      SUM(total_attempts) as total_attempts,
      SUM(total_correct) as total_correct
    FROM questions
  `).get() as any;

  const total = Number(totalQuestionsRow.total || 0);
  const mastered = Number(totalQuestionsRow.mastered || 0);
  const unseen = Number(totalQuestionsRow.unseen || 0);
  const inProgress = Number(totalQuestionsRow.in_progress || 0);
  const totalAttempts = Number(totalQuestionsRow.total_attempts || 0);
  const totalCorrect = Number(totalQuestionsRow.total_correct || 0);

  const totalSessionsRow = db.prepare("SELECT COUNT(*) as count FROM sessions").get() as any;
  const totalSessions = Number(totalSessionsRow.count || 0);

  // Topics breakdown
  const topicRows = db.prepare(`
    SELECT 
      topic,
      COUNT(*) as total_questions,
      SUM(CASE WHEN consecutive_correct >= 3 THEN 1 ELSE 0 END) as mastered_questions,
      SUM(CASE WHEN total_attempts > 0 THEN 1 ELSE 0 END) as attempted_questions,
      SUM(total_attempts) as total_attempts,
      SUM(total_correct) as total_correct
    FROM questions
    GROUP BY topic
    ORDER BY topic ASC
  `).all() as any[];

  const topics: TopicStat[] = topicRows.map((r) => {
    const tTotal = Number(r.total_questions || 0);
    const tMastered = Number(r.mastered_questions || 0);
    const tAttempts = Number(r.total_attempts || 0);
    const tCorrect = Number(r.total_correct || 0);
    return {
      topic: r.topic,
      totalQuestions: tTotal,
      masteredQuestions: tMastered,
      attemptedQuestions: Number(r.attempted_questions || 0),
      totalAttempts: tAttempts,
      totalCorrect: tCorrect,
      accuracy: tAttempts > 0 ? Math.round((tCorrect / tAttempts) * 100) : 0,
      masteryPercentage: tTotal > 0 ? Math.round((tMastered / tTotal) * 100) : 0,
    };
  });

  // Recent sessions
  const sessionRows = db.prepare(`
    SELECT * FROM sessions ORDER BY created_at DESC LIMIT 10
  `).all() as any[];

  const recentSessions: QuizSessionSummary[] = sessionRows.map((s) => {
    const details = JSON.parse(s.details_json || "[]");
    const totalQ = Number(s.total_questions || 0);
    const correctQ = Number(s.correct_count || 0);
    const accuracy = totalQ > 0 ? Math.round((correctQ / totalQ) * 100) : 0;

    // Build topic breakdown for this session
    const topicBreakdown: Record<string, { total: number; correct: number }> = {};
    for (const d of details) {
      const top = d.topic || "Allgemein";
      if (!topicBreakdown[top]) {
        topicBreakdown[top] = { total: 0, correct: 0 };
      }
      topicBreakdown[top].total += 1;
      if (d.isCorrect) {
        topicBreakdown[top].correct += 1;
      }
    }

    return {
      id: s.id,
      mode: s.mode,
      topic: s.topic,
      totalQuestions: totalQ,
      correctCount: correctQ,
      accuracy,
      createdAt: s.created_at,
      topicBreakdown,
      results: details,
    };
  });

  // Weakest questions (attempted at least once, lowest accuracy, not mastered)
  const weakRows = db.prepare(`
    SELECT id, title, topic, total_attempts, total_correct, consecutive_correct
    FROM questions
    WHERE total_attempts > 0 AND consecutive_correct < 3
    ORDER BY (CAST(total_correct AS REAL) / total_attempts) ASC, total_attempts DESC
    LIMIT 10
  `).all() as any[];

  const weakestQuestions = weakRows.map((w) => {
    const attempts = Number(w.total_attempts || 0);
    const corr = Number(w.total_correct || 0);
    return {
      id: w.id,
      title: w.title,
      topic: w.topic,
      totalAttempts: attempts,
      totalCorrect: corr,
      accuracy: attempts > 0 ? Math.round((corr / attempts) * 100) : 0,
      consecutiveCorrect: Number(w.consecutive_correct || 0),
    };
  });

  return {
    totalQuestions: total,
    masteredQuestions: mastered,
    masteryPercentage: total > 0 ? Math.round((mastered / total) * 100) : 0,
    unseenQuestions: unseen,
    inProgressQuestions: inProgress,
    totalSessions,
    totalAnswers: totalAttempts,
    overallAccuracy: totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0,
    topics,
    recentSessions,
    weakestQuestions,
  };
}

export function resetProgress(): void {
  const db = getDb();
  db.exec(`
    UPDATE questions 
    SET consecutive_correct = 0, total_attempts = 0, total_correct = 0, last_attempt_at = NULL;
    DELETE FROM sessions;
  `);
}
