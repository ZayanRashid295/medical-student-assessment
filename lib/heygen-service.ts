// lib/heygen-service.ts

export interface HeyGenConfig {
  apiKey: string
  patientAvatarId: string
  doctorAvatarId: string
}

export interface AvatarResponse {
  success: boolean
  sessionId?: string
  error?: string
  details?: any
}

export interface StreamingAvatarResponse {
  sessionId: string
  sdpAnswer: string
}

class HeyGenService {
  private config: HeyGenConfig | null = null
  private patientSessionId: string | null = null
  private doctorSessionId: string | null = null

  initialize(config: HeyGenConfig) {
    this.config = config
    console.log("HeyGen service initialized with config:", {
      apiKey: config.apiKey ? `${config.apiKey.substring(0, 8)}...` : "missing",
      patientAvatarId: config.patientAvatarId || "missing",
      doctorAvatarId: config.doctorAvatarId || "missing",
    })
  }

  private checkConfig(): void {
    if (!this.config) {
      throw new Error("HeyGen service not initialized. Please call initialize() first.")
    }
    if (!this.config.apiKey) {
      throw new Error("HeyGen API key is missing.")
    }
  }

  async createAvatarSession(avatarId: string, role: "patient" | "doctor"): Promise<AvatarResponse> {
    this.checkConfig()

    console.log(`Creating ${role} avatar session with ID:`, avatarId)

    try {
      if (!avatarId || avatarId.trim().length === 0) {
        throw new Error(`Invalid avatar ID for ${role}: ${avatarId}`)
      }

      if (!this.config!.apiKey || this.config!.apiKey.length < 10) {
        throw new Error(`Invalid API key format. Please check your HeyGen API key.`)
      }

      const requestBody = {
        avatar_id: avatarId.trim(),
      }

      console.log("HeyGen API request:", {
        url: "https://api.heygen.com/v1/streaming.create_token",
        method: "POST",
        headers: {
          "X-Api-Key": this.config!.apiKey ? `${this.config!.apiKey.substring(0, 8)}...` : "missing",
          "Content-Type": "application/json",
        },
        body: requestBody,
      })

      const response = await fetch("https://api.heygen.com/v1/streaming.create_token", {
        method: "POST",
        headers: {
          "X-Api-Key": this.config!.apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      console.log(`HeyGen API response status for ${role}:`, response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`HeyGen API error response:`, {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
        })

        if (response.status === 401) {
          throw new Error(`Authentication failed. Please check your HeyGen API key.`)
        } else if (response.status === 404) {
          throw new Error(`Avatar ID not found: ${avatarId}. Please check your avatar ID.`)
        } else if (response.status === 429) {
          throw new Error(`Rate limit exceeded. Please try again later.`)
        } else {
          throw new Error(`HeyGen API error: ${response.status} - ${response.statusText}. Response: ${errorText}`)
        }
      }

      const data = await response.json()
      console.log(`HeyGen API response data for ${role}:`, data)

      if (!data || typeof data !== "object") {
        console.error("Invalid response format:", data)
        throw new Error("Invalid response format from HeyGen API")
      }

      if (data.code !== undefined && data.code !== 100) {
        const errorMessage = data.message || data.error || "Unknown API error"
        const errorCode = data.code || "unknown"
        console.error(`HeyGen API returned error code ${errorCode}:`, errorMessage)
        throw new Error(`HeyGen API error (${errorCode}): ${errorMessage}`)
      }

      let sessionId: string | null = null

      if (data.data && data.data.session_id) {
        sessionId = data.data.session_id
      } else if (data.session_id) {
        sessionId = data.session_id
      } else if (data.data && data.data.token) {
        sessionId = data.data.token
      }

      if (!sessionId) {
        console.error("No session ID found in response:", data)
        throw new Error("No session ID returned from HeyGen API. Please check your avatar configuration.")
      }

      // Store session ID based on role
      if (role === "patient") {
        this.patientSessionId = sessionId
      } else {
        this.doctorSessionId = sessionId
      }

      console.log(`Successfully created ${role} avatar session:`, sessionId)

      return {
        success: true,
        sessionId,
      }
    } catch (error) {
      console.error(`Error creating ${role} avatar session:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        details: error,
      }
    }
  }

  async startAvatarSession(sessionId: string, sdpOffer: string): Promise<StreamingAvatarResponse> {
    this.checkConfig()

    console.log("Starting avatar session:", sessionId)

    try {
      const requestBody = {
        session_id: sessionId,
        sdp: {
          type: "offer",
          sdp: sdpOffer,
        },
      }

      const response = await fetch("https://api.heygen.com/v1/streaming.start", {
        method: "POST",
        headers: {
          "X-Api-Key": this.config!.apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      console.log("Start session response status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Start session error:", errorText)
        throw new Error(`Failed to start avatar session: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      console.log("Start session response data:", data)

      if (data.code !== 100) {
        throw new Error(data.message || "Failed to start avatar session")
      }

      return {
        sessionId,
        sdpAnswer: data.data.sdp.sdp,
      }
    } catch (error) {
      console.error("Error starting avatar session:", error)
      throw error
    }
  }

  async speakText(text: string, role: "patient" | "doctor"): Promise<boolean> {
    this.checkConfig()

    const sessionId = role === "patient" ? this.patientSessionId : this.doctorSessionId

    if (!sessionId) {
      console.error(`No active session for ${role}`)
      return false
    }

    console.log(`Making ${role} avatar speak:`, text.substring(0, 50) + "...")

    try {
      const response = await fetch("https://api.heygen.com/v1/streaming.task", {
        method: "POST",
        headers: {
          "X-Api-Key": this.config!.apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session_id: sessionId,
          text: text,
          task_type: "talk",
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`Failed to send text to ${role} avatar:`, errorText)
        throw new Error(`Failed to send text to avatar: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      console.log(`Speak response for ${role}:`, data)

      const success = data.code === 100
      if (!success) {
        console.error(`Speak failed for ${role}:`, data.message)
      }

      return success
    } catch (error) {
      console.error(`Error making ${role} avatar speak:`, error)
      return false
    }
  }

  async closeAvatarSession(role: "patient" | "doctor"): Promise<void> {
    this.checkConfig()

    const sessionId = role === "patient" ? this.patientSessionId : this.doctorSessionId

    if (!sessionId) {
      console.log(`No session to close for ${role}`)
      return
    }

    console.log(`Closing ${role} avatar session:`, sessionId)

    try {
      const response = await fetch("https://api.heygen.com/v1/streaming.stop", {
        method: "POST",
        headers: {
          "X-Api-Key": this.config!.apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session_id: sessionId,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.warn(`Error stopping ${role} avatar session:`, errorText)
      } else {
        console.log(`Successfully closed ${role} avatar session`)
      }

      // Clear session ID
      if (role === "patient") {
        this.patientSessionId = null
      } else {
        this.doctorSessionId = null
      }
    } catch (error) {
      console.error(`Error closing ${role} avatar session:`, error)
    }
  }

  getSessionId(role: "patient" | "doctor"): string | null {
    return role === "patient" ? this.patientSessionId : this.doctorSessionId
  }

  async testConnection(): Promise<{ success: boolean; error?: string; details?: any }> {
    this.checkConfig()

    try {
      console.log("Testing HeyGen API connection...")

      const response = await fetch("https://api.heygen.com/v1/streaming.list", {
        method: "GET",
        headers: {
          "X-Api-Key": this.config!.apiKey,
        },
      })

      console.log("Test connection response status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Test connection failed:", errorText)

        if (response.status === 401) {
          return {
            success: false,
            error: "Authentication failed. Please check your HeyGen API key.",
          }
        }

        return {
          success: false,
          error: `API connection failed: ${response.status} - ${errorText}`,
        }
      }

      const data = await response.json()
      console.log("HeyGen API test successful:", data)

      return {
        success: true,
        details: data,
      }
    } catch (error) {
      console.error("Test connection error:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        details: error,
      }
    }
  }
}

export const heygenService = new HeyGenService()
