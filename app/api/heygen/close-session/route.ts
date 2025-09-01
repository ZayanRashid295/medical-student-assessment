import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { token, sessionId, role } = await request.json()

    if (!token || !sessionId || !role) {
      return NextResponse.json({ error: "Token, session ID, and role are required" }, { status: 400 })
    }

    const response = await fetch("https://api.heygen.com/v1/streaming.stop", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        session_id: sessionId,
      }),
    })

    if (!response.ok) {
      return NextResponse.json({ success: false, error: "Error stopping session" }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
