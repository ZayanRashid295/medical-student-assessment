import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { token, sessionId, sdpAnswer } = await request.json()

    if (!token || !sessionId || !sdpAnswer) {
      return NextResponse.json({ error: "Token, session ID, and SDP answer are required" }, { status: 400 })
    }

    console.log("[v0] Starting HeyGen session with:", {
      sessionId: sessionId.substring(0, 20) + "...",
      tokenLength: token.length,
      sdpAnswerLength: sdpAnswer.length,
      sdpPreview: sdpAnswer.substring(0, 100) + "...",
    })

    const response = await fetch("https://api.heygen.com/v1/streaming.start", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        session_id: sessionId,
        sdp: {
          type: "answer",
          sdp: sdpAnswer,
        },
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorData
      try {
        errorData = JSON.parse(errorText)
      } catch {
        errorData = { message: errorText }
      }

      console.log("[v0] HeyGen API error:", {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
      })

      return NextResponse.json(
        {
          error: errorData.message || errorText || "HeyGen API error",
          status: response.status,
        },
        { status: 400 },
      )
    }

    const data = await response.json()

    console.log("[v0] HeyGen session started successfully")

    return NextResponse.json({
      success: true,
      sessionId,
      data: data.data,
    })
  } catch (error) {
    console.error("[v0] Start session error:", error)
    return NextResponse.json(
      {
        error: `Internal server error: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 500 },
    )
  }
}
