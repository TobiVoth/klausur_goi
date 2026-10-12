import { NextRequest, NextResponse } from "next/server";
import { getQuestionsByFilter, getAllTopics } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = (searchParams.get("mode") || "all") as "topic" | "all" | "mastery";
    const topic = searchParams.get("topic") || undefined;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : undefined;
    const action = searchParams.get("action");

    if (action === "topics") {
      const topics = getAllTopics();
      return NextResponse.json({ topics });
    }

    const questions = getQuestionsByFilter({ mode, topic, limit });
    return NextResponse.json({
      mode,
      topic,
      total: questions.length,
      questions,
    });
  } catch (error: any) {
    console.error("Error in /api/questions:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch questions" }, { status: 500 });
  }
}
