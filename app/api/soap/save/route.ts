import { type NextRequest, NextResponse } from "next/server"
import { soapService } from "@/lib/soap-service"

export async function POST(request: NextRequest) {
  try {
    const soapNote = await request.json()

    soapService.saveSOAPNote(soapNote)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error saving SOAP note:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to save SOAP note",
      },
      { status: 500 },
    )
  }
}
