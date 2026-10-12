import { NextRequest, NextResponse } from "next/server";
import { saveQuizSession } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, mode, topic, totalQuestions, correctCount, details } = body;

    if (!id || !mode || typeof totalQuestions !== "number" || typeof correctCount !== "number") {
      return NextResponse.json(
        { error: "Invalid session payload" },
        { status: 400 }
      );
    }

    saveQuizSession({
      id,
      mode,
      topic,
      totalQuestions,
      correctCount,
      details,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error in /api/sessions:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save session" },
      { status: 500 }
    );
  }
}
