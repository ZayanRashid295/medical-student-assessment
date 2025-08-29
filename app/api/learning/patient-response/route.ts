import { type NextRequest, NextResponse } from "next/server"
import { learningService } from "@/lib/learning-service"

export async function POST(request: NextRequest) {
  try {
    const { question, context } = await request.json()

    const response = await learningService.generatePatientResponse(question, context)

    return NextResponse.json({ response })
  } catch (error) {
    console.error("Error generating patient response:", error)
    return NextResponse.json({ error: "Failed to generate patient response" }, { status: 500 })
  }
}
