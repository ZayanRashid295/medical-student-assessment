import { type NextRequest, NextResponse } from "next/server"
import { learningService } from "@/lib/learning-service"

export async function POST(request: NextRequest) {
  try {
    const { conversation, context } = await request.json()

    const soapNote = await learningService.generateEducationalSOAPNote(conversation, context)

    return NextResponse.json(soapNote)
  } catch (error) {
    console.error("Error generating educational SOAP note:", error)
    return NextResponse.json({ error: "Failed to generate SOAP note" }, { status: 500 })
  }
}
