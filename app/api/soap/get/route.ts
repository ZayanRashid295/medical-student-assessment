import { type NextRequest, NextResponse } from "next/server"
import { soapService } from "@/lib/soap-service"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get("conversationId")

    if (!conversationId) {
      return NextResponse.json({ success: false, error: "Conversation ID is required" }, { status: 400 })
    }

    const soapNote = soapService.getSOAPNoteByConversation(conversationId)

    return NextResponse.json({ success: true, soapNote })
  } catch (error) {
    console.error("Error getting SOAP note:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get SOAP note",
      },
      { status: 500 },
    )
  }
}
