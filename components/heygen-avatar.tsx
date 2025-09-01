"use client"

import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { UserIcon, Stethoscope, Loader2 } from "lucide-react"

interface HeyGenAvatarProps {
  role: "patient" | "doctor"
  avatarId: string
  apiKey: string
  isActive?: boolean
  onReady?: () => void
  onError?: (error: string) => void
}

export interface HeyGenAvatarRef {
  speak: (text: string) => Promise<void>
}

const HeyGenAvatar = forwardRef<HeyGenAvatarRef, HeyGenAvatarProps>(
  ({ role, avatarId, apiKey, isActive = false, onReady, onError }, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null)
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
    const [isConnected, setIsConnected] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [connectionError, setConnectionError] = useState<string | null>(null)
    const [sessionId, setSessionId] = useState<string | null>(null)

    useEffect(() => {
      if (isActive && !isConnected && !isLoading) {
        initializeAvatar()
      }
      return () => cleanup()
    }, [isActive, avatarId, apiKey])

    const initializeAvatar = async () => {
      if (!avatarId || !apiKey) {
        const errorMsg = "Avatar ID or API key missing"
        setConnectionError(errorMsg)
        onError?.(errorMsg)
        return
      }

      setIsLoading(true)
      setConnectionError(null)

      try {
        const sessionResponse = await fetch("/api/heygen/create-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ apiKey, avatarId, role }),
        })

        const sessionData = await sessionResponse.json()
        if (!sessionData.success) {
          throw new Error(sessionData.error || "Failed to create session")
        }

        setSessionId(sessionData.sessionId)

        const peerConnection = new RTCPeerConnection({
          iceServers: sessionData.iceServers || [{ urls: "stun:stun.l.google.com:19302" }],
        })
        peerConnectionRef.current = peerConnection

        peerConnection.ontrack = (event) => {
          if (videoRef.current && event.streams[0]) {
            videoRef.current.srcObject = event.streams[0]
          }
        }

        peerConnection.onconnectionstatechange = () => {
          console.log(`[v0] ${role} connection state:`, peerConnection.connectionState)
          if (peerConnection.connectionState === "connected") {
            console.log(`[v0] ${role} peer connection CONNECTED ✅`)
            setIsConnected(true)
            setIsLoading(false)
            onReady?.()
          } else if (peerConnection.connectionState === "failed") {
            console.log(`[v0] ${role} peer connection FAILED ❌`)
            setConnectionError("Connection failed")
            onError?.("Connection failed")
          } else if (peerConnection.connectionState === "disconnected") {
            console.log(`[v0] ${role} peer connection DISCONNECTED`)
            setIsConnected(false)
          }
        }

        peerConnection.onicecandidate = ({ candidate }) => {
          if (candidate) {
            fetch("/api/heygen/ice", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                token: sessionData.token,
                sessionId: sessionData.sessionId,
                candidate: candidate,
              }),
            }).catch((error) => {
              console.error(`[v0] ${role} ICE candidate submission failed:`, error)
            })
          }
        }

        console.log(`[v0] ${role} setting HeyGen's SDP offer as remote description`)
        await peerConnection.setRemoteDescription({
          type: "offer",
          sdp: sessionData.sdpOffer,
        })

        console.log(`[v0] ${role} creating SDP answer`)
        const answer = await peerConnection.createAnswer()
        await peerConnection.setLocalDescription(answer)

        await new Promise<void>((resolve) => {
          if (peerConnection.iceGatheringState === "complete") {
            resolve()
          } else {
            const checkState = () => {
              if (peerConnection.iceGatheringState === "complete") {
                peerConnection.removeEventListener("icegatheringstatechange", checkState)
                resolve()
              }
            }
            peerConnection.addEventListener("icegatheringstatechange", checkState)
            setTimeout(resolve, 5000)
          }
        })

        const finalAnswer = peerConnection.localDescription?.sdp
        if (!finalAnswer) {
          throw new Error("Failed to create SDP answer")
        }

        console.log(`[v0] ${role} sending SDP answer to start session`)
        const startResponse = await fetch("/api/heygen/start-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: sessionData.token,
            sessionId: sessionData.sessionId,
            sdpAnswer: finalAnswer,
          }),
        })

        const startData = await startResponse.json()
        if (!startData.success) {
          throw new Error(startData.error || "Failed to start session")
        }

        console.log(`[v0] ${role} session started successfully`)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Connection failed"
        console.error(`[v0] ${role} avatar error:`, errorMessage)
        setConnectionError(errorMessage)
        setIsLoading(false)
        onError?.(errorMessage)
        cleanup()
      }
    }

    const cleanup = () => {
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close()
        peerConnectionRef.current = null
      }
      setIsConnected(false)
      setIsLoading(false)
      setSessionId(null)
    }

    const speak = async (text: string) => {
      if (!isConnected || !sessionId) return

      try {
        await fetch("/api/heygen/speak", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ apiKey, sessionId, text, role }),
        })
      } catch (error) {
        console.error(`Error making ${role} avatar speak:`, error)
      }
    }

    useImperativeHandle(ref, () => ({ speak }), [isConnected])

    return (
      <Card className="w-full max-w-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              {role === "patient" ? (
                <UserIcon className="h-4 w-4 text-blue-600" />
              ) : (
                <Stethoscope className="h-4 w-4 text-green-600" />
              )}
              <span className="font-medium capitalize">{role}</span>
            </div>
            <Badge variant={isConnected ? "default" : isLoading ? "secondary" : "destructive"}>
              {isConnected ? "Connected" : isLoading ? "Connecting..." : "Disconnected"}
            </Badge>
          </div>

          <div className="relative bg-gray-100 rounded-lg overflow-hidden aspect-video">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
                <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
                <span className="ml-2 text-sm text-gray-600">Connecting...</span>
              </div>
            )}

            {connectionError && (
              <div className="absolute inset-0 flex items-center justify-center bg-red-50 text-red-600 p-4 text-center">
                <div>
                  <p className="text-sm font-medium">Connection Error</p>
                  <p className="text-xs mt-1">{connectionError}</p>
                </div>
              </div>
            )}

            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted={false}
              className="w-full h-full object-cover"
              style={{ display: isConnected ? "block" : "none" }}
            />

            {!isLoading && !isConnected && !connectionError && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-200 text-gray-600">
                <div className="text-center">
                  {role === "patient" ? (
                    <UserIcon className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  ) : (
                    <Stethoscope className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  )}
                  <p className="text-sm">Avatar Ready</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  },
)

HeyGenAvatar.displayName = "HeyGenAvatar"

export default HeyGenAvatar
