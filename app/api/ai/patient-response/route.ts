import { type NextRequest, NextResponse } from "next/server"
import { aiService } from "@/lib/ai-service"
import type { ConversationContext } from "@/lib/data-models"

export async function POST(request: NextRequest) {
  try {
    const { studentQuestion, context }: { studentQuestion: string; context: ConversationContext } = await request.json()

    const response = await aiService.generatePatientResponse(studentQuestion, context)

    return NextResponse.json(response)
  } catch (error) {
    console.error("Error generating patient response:", error)
    return NextResponse.json({ error: "Failed to generate patient response" }, { status: 500 })
  }
}
