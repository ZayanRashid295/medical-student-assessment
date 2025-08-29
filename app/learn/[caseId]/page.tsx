"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { learningService, type LearningSession } from "@/lib/learning-service"
import { sampleCases } from "@/lib/data-models"
import { LearningInterface } from "@/components/learning-interface"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function LearningPage() {
  const params = useParams()
  const caseId = params.caseId as string
  const [session, setSession] = useState<LearningSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const medicalCase = sampleCases.find((c) => c.id === caseId)
    if (!medicalCase) {
      setIsLoading(false)
      return
    }

    // Check if there's an existing session
    const existingSession = learningService.getLearningSession(`learn_${caseId}`)

    if (existingSession) {
      setSession(existingSession)
    } else {
      // Create new learning session
      const newSession: LearningSession = {
        id: `learn_${caseId}`,
        caseId,
        disease: medicalCase.disease,
        patientProfile: medicalCase.patientProfile,
        conversation: [],
        isComplete: false,
        createdAt: new Date().toISOString(),
      }
      setSession(newSession)
      learningService.saveLearningSession(newSession)
    }

    setIsLoading(false)
  }, [caseId])

  const handleSessionUpdate = (updatedSession: LearningSession) => {
    setSession(updatedSession)
    learningService.saveLearningSession(updatedSession)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading learning session...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Case Not Found</h1>
          <p className="text-gray-600 mb-6">The requested learning case could not be found.</p>
          <Button onClick={() => (window.location.href = "/")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <LearningInterface session={session} onSessionUpdate={handleSessionUpdate} />
    </div>
  )
}
