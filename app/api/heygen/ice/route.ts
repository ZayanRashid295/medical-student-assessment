import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { token, sessionId, candidate } = await request.json()

    if (!token || !sessionId || !candidate) {
      return NextResponse.json(
        { success: false, error: "Token, session ID, and candidate are required" },
        { status: 400 },
      )
    }

    console.log("[v0] Submitting ICE candidate for session:", sessionId.substring(0, 20) + "...")

    const response = await fetch("https://api.heygen.com/v1/streaming.ice", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        session_id: sessionId,
        candidate: candidate,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.log("[v0] ICE submission failed:", { status: response.status, error: errorText })
      return NextResponse.json(
        { success: false, error: `Failed to submit ICE candidate: ${errorText}` },
        { status: response.status },
      )
    }

    const data = await response.json()
    console.log("[v0] ICE candidate submitted successfully")

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error("[v0] ICE submission error:", error)
    return NextResponse.json(
      { success: false, error: `Internal server error: ${error instanceof Error ? error.message : "Unknown error"}` },
      { status: 500 },
    )
  }
}
