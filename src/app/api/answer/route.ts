import { NextRequest, NextResponse } from "next/server";
import { recordAnswer } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { questionId, selectedIndices } = body;

    if (!questionId || !Array.isArray(selectedIndices)) {
      return NextResponse.json(
        { error: "Invalid payload: questionId and selectedIndices array are required" },
        { status: 400 }
      );
    }

    const result = recordAnswer(questionId, selectedIndices);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error in /api/answer:", error);
    return NextResponse.json(
      { error: error.message || "Failed to record answer" },
      { status: 500 }
    );
  }
}
