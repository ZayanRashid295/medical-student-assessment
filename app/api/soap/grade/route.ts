import { type NextRequest, NextResponse } from "next/server"
import { soapService } from "@/lib/soap-service"

export async function POST(request: NextRequest) {
  try {
    const { studentSOAP, aiSOAP } = await request.json()

    const grading = await soapService.gradeSOAPNote(studentSOAP, aiSOAP)

    return NextResponse.json({ success: true, grading })
  } catch (error) {
    console.error("Error grading SOAP note:", error)
    return NextResponse.json({ success: false, error: "Failed to grade SOAP note" }, { status: 500 })
  }
}
