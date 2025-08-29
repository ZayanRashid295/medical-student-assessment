import { type NextRequest, NextResponse } from "next/server"
import { learningService } from "@/lib/learning-service"

export async function POST(request: NextRequest) {
  try {
    const { question, context, conversation } = await request.json()

    const answer = await learningService.answerStudentQuestion(question, context, conversation)

    return NextResponse.json({ answer })
  } catch (error) {
    console.error("Error answering student question:", error)
    return NextResponse.json({ error: "Failed to answer question" }, { status: 500 })
  }
}
