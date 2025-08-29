import { type NextRequest, NextResponse } from "next/server"
import { soapService } from "@/lib/soap-service"
import type { Conversation, MedicalCase } from "@/lib/data-models"

export async function POST(request: NextRequest) {
  try {
    const { conversation, medicalCase }: { conversation: Conversation; medicalCase: MedicalCase } = await request.json()

    const aiSOAP = await soapService.generateAISOAPNote(conversation, medicalCase)

    return NextResponse.json({ success: true, aiSOAP })
  } catch (error) {
    console.error("Error generating AI SOAP note:", error)
    return NextResponse.json({ success: false, error: "Failed to generate AI SOAP note" }, { status: 500 })
  }
}
