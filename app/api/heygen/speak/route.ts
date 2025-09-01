import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { token, sessionId, text, role } = await request.json()

    if (!token || !sessionId || !text || !role) {
      return NextResponse.json({ error: "Token, session ID, text, and role are required" }, { status: 400 })
    }

    const response = await fetch("https://api.heygen.com/v1/streaming.task", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        session_id: sessionId,
        text: text,
        task_type: "talk",
      }),
    })

    if (!response.ok) {
      return NextResponse.json({ success: false, error: "Failed to send text to avatar" }, { status: 400 })
    }

    const data = await response.json()
    const success = data.code === 100
    if (!success) {
      return NextResponse.json({ success: false, error: "Failed to make avatar speak" })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
