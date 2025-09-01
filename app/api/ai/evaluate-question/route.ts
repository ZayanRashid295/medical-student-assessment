import { type NextRequest, NextResponse } from "next/server"
import { aiService } from "@/lib/ai-service"
import type { ConversationContext } from "@/lib/data-models"

export async function POST(request: NextRequest) {
  try {
    const { studentQuestion, context }: { studentQuestion: string; context: ConversationContext } = await request.json()

    const evaluation = await aiService.evaluateStudentQuestion(studentQuestion, context)

    return NextResponse.json({
      shouldIntervene: evaluation.shouldIntervene,
      content: evaluation.content,
      confidence: evaluation.confidence,
    })
  } catch (error) {
    console.error("Error evaluating student question:", error)
    return NextResponse.json({ error: "Failed to evaluate question" }, { status: 500 })
  }
}
