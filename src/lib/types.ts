export interface Question {
  id: string;
  topic: string;
  sourceFile: string;
  title: string;
  options: string[];
  correctIndices: number[];
  explanation: string;
  consecutiveCorrect: number;
  totalAttempts: number;
  totalCorrect: number;
  lastAttemptAt?: string;
  isMastered: boolean; // consecutiveCorrect >= 3
}

export interface AnswerResult {
  questionId: string;
  selectedIndices: number[];
  isCorrect: boolean;
  consecutiveCorrect: number;
  isMastered: boolean;
  correctIndices: number[];
  explanation: string;
}

export interface QuizSessionSummary {
  id: string;
  mode: 'topic' | 'all' | 'mastery';
  topic?: string;
  totalQuestions: number;
  correctCount: number;
  accuracy: number;
  createdAt: string;
  topicBreakdown: Record<string, { total: number; correct: number }>;
  results: {
    questionId: string;
    title: string;
    topic: string;
    selectedIndices: number[];
    correctIndices: number[];
    isCorrect: boolean;
    explanation: string;
    consecutiveCorrect: number;
  }[];
}

export interface TopicStat {
  topic: string;
  totalQuestions: number;
  masteredQuestions: number;
  attemptedQuestions: number;
  totalAttempts: number;
  totalCorrect: number;
  accuracy: number;
  masteryPercentage: number;
}

export interface OverallStats {
  totalQuestions: number;
  masteredQuestions: number;
  masteryPercentage: number;
  unseenQuestions: number;
  inProgressQuestions: number;
  totalSessions: number;
  totalAnswers: number;
  overallAccuracy: number;
  topics: TopicStat[];
  recentSessions: QuizSessionSummary[];
  weakestQuestions: {
    id: string;
    title: string;
    topic: string;
    totalAttempts: number;
    totalCorrect: number;
    accuracy: number;
    consecutiveCorrect: number;
  }[];
}
