import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { apiKey, avatarId, role } = await request.json()

    if (!apiKey || !avatarId || !role) {
      return NextResponse.json({ success: false, error: "API key, avatar ID, and role are required" }, { status: 400 })
    }

    console.log("[v0] Creating token for avatar:", { avatarId: avatarId.trim(), role })

    const tokenResponse = await fetch("https://api.heygen.com/v1/streaming.create_token", {
      method: "POST",
      headers: {
        "X-Api-Key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        avatar_id: avatarId.trim(),
      }),
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.log("[v0] Token creation failed:", { status: tokenResponse.status, error: errorText })

      if (tokenResponse.status === 401) {
        return NextResponse.json({ success: false, error: "Invalid API key" }, { status: 401 })
      }
      if (tokenResponse.status === 404) {
        return NextResponse.json({ success: false, error: "Avatar not found" }, { status: 404 })
      }
      return NextResponse.json(
        { success: false, error: `Failed to create token: ${errorText}` },
        { status: tokenResponse.status },
      )
    }

    const tokenData = await tokenResponse.json()
    if (!tokenData.data?.token) {
      console.log("[v0] No token in response:", tokenData)
      return NextResponse.json({ success: false, error: "No token received" }, { status: 500 })
    }

    console.log("[v0] Creating new session with token")

    const sessionResponse = await fetch("https://api.heygen.com/v1/streaming.new", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tokenData.data.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        activity_idle_timeout: 300, // 5 minutes
      }),
    })

    if (!sessionResponse.ok) {
      const errorText = await sessionResponse.text()
      console.log("[v0] Session creation failed:", { status: sessionResponse.status, error: errorText })
      return NextResponse.json(
        { success: false, error: `Failed to create session: ${errorText}` },
        { status: sessionResponse.status },
      )
    }

    const sessionData = await sessionResponse.json()
    if (!sessionData.data?.session_id || !sessionData.data?.sdp || !sessionData.data?.ice_servers) {
      console.log("[v0] Missing required session data:", sessionData)
      return NextResponse.json({ success: false, error: "Missing session data from HeyGen" }, { status: 500 })
    }

    console.log("[v0] Successfully created session:", {
      sessionId: sessionData.data.session_id.substring(0, 20) + "...",
      hasOffer: !!sessionData.data.sdp,
      iceServersCount: sessionData.data.ice_servers?.length || 0,
    })

    return NextResponse.json({
      success: true,
      sessionId: sessionData.data.session_id,
      token: tokenData.data.token,
      sdpOffer: sessionData.data.sdp,
      iceServers: sessionData.data.ice_servers,
      debug: {
        avatarId,
        role,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("[v0] Create session error:", error)
    return NextResponse.json(
      { success: false, error: `Internal server error: ${error instanceof Error ? error.message : "Unknown error"}` },
      { status: 500 },
    )
  }
}
