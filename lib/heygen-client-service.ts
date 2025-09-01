// lib/heygen-client-service.ts - Secure client-side service that calls server APIs

export interface HeyGenConfig {
  apiKey: string
  patientAvatarId: string
  doctorAvatarId: string
}

export interface AvatarResponse {
  success: boolean
  sessionId?: string
  token?: string // Added token field for new API flow
  error?: string
  details?: any
}

export interface StreamingAvatarResponse {
  sessionId: string
  sdpAnswer: string
}

class HeyGenClientService {
  private config: HeyGenConfig | null = null
  private patientSessionId: string | null = null
  private doctorSessionId: string | null = null
  private patientToken: string | null = null
  private doctorToken: string | null = null

  initialize(config: HeyGenConfig) {
    this.config = config
    console.log("HeyGen client service initialized")
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

    try {
      const response = await fetch("/api/heygen/create-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          apiKey: this.config!.apiKey,
          avatarId,
          role,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: data.error || "Failed to create avatar session",
        }
      }

      if (data.success && data.sessionId) {
        if (role === "patient") {
          this.patientSessionId = data.sessionId
          this.patientToken = data.token
        } else {
          this.doctorSessionId = data.sessionId
          this.doctorToken = data.token
        }
      }

      return data
    } catch (error) {
      console.error(`Error creating ${role} avatar session:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  async startAvatarSession(
    sessionId: string,
    sdpOffer: string,
    role: "patient" | "doctor",
  ): Promise<StreamingAvatarResponse> {
    this.checkConfig()

    try {
      const response = await fetch("/api/heygen/start-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          apiKey: this.config!.apiKey, // Use API key for authentication
          sessionId,
          sdpOffer,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to start avatar session")
      }

      return await response.json()
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

    try {
      const response = await fetch("/api/heygen/speak", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          apiKey: this.config!.apiKey, // Use API key for authentication
          sessionId,
          text,
          role,
        }),
      })

      const data = await response.json()
      return data.success || false
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

    try {
      await fetch("/api/heygen/close-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          apiKey: this.config!.apiKey, // Use API key for authentication
          sessionId,
          role,
        }),
      })

      if (role === "patient") {
        this.patientSessionId = null
        this.patientToken = null
      } else {
        this.doctorSessionId = null
        this.doctorToken = null
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
      const response = await fetch("/api/heygen/test-connection", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          apiKey: this.config!.apiKey,
        }),
      })

      return await response.json()
    } catch (error) {
      console.error("Test connection error:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }
}

export const heygenClientService = new HeyGenClientService()
