import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { apiKey } = await request.json()

    if (!apiKey) {
      return NextResponse.json({ success: false, error: "API key is required" }, { status: 400 })
    }

    console.log("Testing HeyGen API connection...")

    const response = await fetch("https://api.heygen.com/v1/streaming.list", {
      method: "GET",
      headers: {
        "X-Api-Key": apiKey,
      },
    })

    console.log("Test connection response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Test connection failed:", errorText)

      if (response.status === 401) {
        return NextResponse.json({
          success: false,
          error: "Authentication failed. Please check your HeyGen API key.",
        })
      }

      return NextResponse.json({
        success: false,
        error: `API connection failed: ${response.status} - ${errorText}`,
      })
    }

    const data = await response.json()
    console.log("HeyGen API test successful:", data)

    return NextResponse.json({
      success: true,
      details: data,
    })
  } catch (error) {
    console.error("Test connection error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
