import { type NextRequest, NextResponse } from "next/server"
import { learningService } from "@/lib/learning-service"

export async function POST(request: NextRequest) {
  try {
    const { conversation, disease } = await request.json()

    const result = await learningService.shouldEndConversation(conversation, disease)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error checking if conversation should end:", error)
    return NextResponse.json({ error: "Failed to check conversation status" }, { status: 500 })
  }
}
