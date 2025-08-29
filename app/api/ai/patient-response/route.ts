import { type NextRequest, NextResponse } from "next/server"
import { aiService, type ConversationContext } from "@/lib/ai-service"

export async function POST(request: NextRequest) {
  try {
    const { studentQuestion, context }: { studentQuestion: string; context: ConversationContext } = await request.json()

    const response = await aiService.generatePatientResponse(studentQuestion, context)

    return NextResponse.json(response)
  } catch (error) {
    console.error("Error in patient response API:", error)
    return NextResponse.json(
      {
        content: "I'm having trouble responding right now. Please check your API key configuration.",
        confidence: 0.1,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
