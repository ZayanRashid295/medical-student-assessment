import { type NextRequest, NextResponse } from "next/server"
import { learningService } from "@/lib/learning-service"

export async function POST(request: NextRequest) {
  try {
    const { context, conversation } = await request.json()

    const result = await learningService.generateDoctorQuestion(context, conversation)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error generating doctor question:", error)
    return NextResponse.json({ error: "Failed to generate doctor question" }, { status: 500 })
  }
}
