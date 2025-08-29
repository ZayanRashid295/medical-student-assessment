"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { LearningSession, LearningConversationMessage } from "@/lib/learning-service"
import { sampleCases } from "@/lib/data-models"
import { ArrowLeft, Play, Pause, MessageCircle, FileText, User, Stethoscope, HelpCircle } from "lucide-react"
import ReactMarkdown from "react-markdown"

interface LearningInterfaceProps {
  session: LearningSession
  onSessionUpdate: (session: LearningSession) => void
}

export function LearningInterface({ session, onSessionUpdate }: LearningInterfaceProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [studentQuestion, setStudentQuestion] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [showSOAPNote, setShowSOAPNote] = useState(false)
  const [studentQuestionResponse, setStudentQuestionResponse] = useState("")
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  const medicalCase = sampleCases.find((c) => c.id === session.caseId)

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [session.conversation])

  const startConversation = async () => {
    if (session.conversation.length > 0) return

    setIsPlaying(true)
    setIsProcessing(true)

    try {
      const context = {
        caseId: session.caseId,
        disease: session.disease,
        symptoms: medicalCase?.symptoms || [],
        patientProfile: session.patientProfile,
        conversationHistory: [],
      }

      const response = await fetch("/api/learning/doctor-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context, conversation: [] }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate doctor question")
      }

      const { question, explanation } = await response.json()

      const doctorMessage: LearningConversationMessage = {
        role: "doctor",
        content: question,
        explanation,
        timestamp: new Date().toISOString(),
      }

      const updatedSession = {
        ...session,
        conversation: [doctorMessage],
      }

      onSessionUpdate(updatedSession)
    } catch (error) {
      console.error("Error starting conversation:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  const continueConversation = async () => {
    if (session.conversation.length === 0 || session.isComplete) return

    setIsProcessing(true)

    try {
      const lastMessage = session.conversation[session.conversation.length - 1]

      if (lastMessage.role === "doctor") {
        // Generate patient response
        const context = {
          caseId: session.caseId,
          disease: session.disease,
          symptoms: medicalCase?.symptoms || [],
          patientProfile: session.patientProfile,
          conversationHistory: session.conversation.map((msg) => ({
            role: msg.role as "student" | "patient" | "doctor",
            content: msg.content,
            timestamp: msg.timestamp,
          })),
        }

        const patientResponse = await fetch("/api/learning/patient-response", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: lastMessage.content, context }),
        })

        if (!patientResponse.ok) {
          throw new Error("Failed to generate patient response")
        }

        const { response: patientResponseText } = await patientResponse.json()

        const patientMessage: LearningConversationMessage = {
          role: "patient",
          content: patientResponseText,
          timestamp: new Date().toISOString(),
        }

        const updatedConversation = [...session.conversation, patientMessage]

        // Check if conversation should end
        const shouldEndResponse = await fetch("/api/learning/should-end", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversation: updatedConversation, disease: session.disease }),
        })

        if (!shouldEndResponse.ok) {
          throw new Error("Failed to check conversation status")
        }

        const { shouldEnd, reason } = await shouldEndResponse.json()

        if (shouldEnd) {
          // Generate SOAP note
          const soapResponse = await fetch("/api/learning/soap-note", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ conversation: updatedConversation, context }),
          })

          if (!soapResponse.ok) {
            throw new Error("Failed to generate SOAP note")
          }

          const soapNote = await soapResponse.json()

          const finalSession = {
            ...session,
            conversation: updatedConversation,
            soapNote,
            isComplete: true,
          }

          onSessionUpdate(finalSession)
          setIsPlaying(false)
          setShowSOAPNote(true)
        } else {
          // Generate next doctor question
          const doctorResponse = await fetch("/api/learning/doctor-question", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ context, conversation: updatedConversation }),
          })

          if (!doctorResponse.ok) {
            throw new Error("Failed to generate doctor question")
          }

          const { question, explanation } = await doctorResponse.json()

          const nextDoctorMessage: LearningConversationMessage = {
            role: "doctor",
            content: question,
            explanation,
            timestamp: new Date().toISOString(),
          }

          const updatedSession = {
            ...session,
            conversation: [...updatedConversation, nextDoctorMessage],
          }

          onSessionUpdate(updatedSession)
        }
      }
    } catch (error) {
      console.error("Error continuing conversation:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleStudentQuestion = async () => {
    if (!studentQuestion.trim() || isProcessing) return

    setIsProcessing(true)

    try {
      const context = {
        caseId: session.caseId,
        disease: session.disease,
        symptoms: medicalCase?.symptoms || [],
        patientProfile: session.patientProfile,
        conversationHistory: session.conversation.map((msg) => ({
          role: msg.role as "student" | "patient" | "doctor",
          content: msg.content,
          timestamp: msg.timestamp,
        })),
      }

      const response = await fetch("/api/learning/answer-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: studentQuestion, context, conversation: session.conversation }),
      })

      if (!response.ok) {
        throw new Error("Failed to answer question")
      }

      const { answer } = await response.json()
      setStudentQuestionResponse(answer)
      setStudentQuestion("")
    } catch (error) {
      console.error("Error answering student question:", error)
      setStudentQuestionResponse(
        "I apologize, but I'm having trouble processing your question right now. Please try again.",
      )
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Button variant="ghost" size="sm" onClick={() => (window.location.href = "/")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <div className="ml-4">
                <h1 className="text-xl font-semibold text-gray-900">Learning Mode: {medicalCase?.title}</h1>
                <p className="text-sm text-gray-600">Observe AI Doctor-Patient Consultation</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant={session.isComplete ? "default" : "secondary"}>
                {session.isComplete ? "Complete" : "In Progress"}
              </Badge>
              {!session.isComplete && (
                <Button
                  onClick={session.conversation.length === 0 ? startConversation : continueConversation}
                  disabled={isProcessing}
                  size="sm"
                >
                  {isProcessing ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : isPlaying ? (
                    <Pause className="h-4 w-4 mr-2" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  {session.conversation.length === 0 ? "Start Learning" : "Continue"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Patient Info */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Patient Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="font-medium">{session.patientProfile.name}</p>
                  <p className="text-sm text-gray-600">
                    {session.patientProfile.age} years old, {session.patientProfile.gender}
                  </p>
                  <p className="text-sm text-gray-600">{session.patientProfile.occupation}</p>
                </div>
                <div>
                  <p className="font-medium text-sm mb-2">Presenting Condition:</p>
                  <Badge variant="outline">{session.disease}</Badge>
                </div>
                {medicalCase && (
                  <div>
                    <p className="font-medium text-sm mb-2">Known Symptoms:</p>
                    <div className="flex flex-wrap gap-1">
                      {medicalCase.symptoms.map((symptom, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {symptom}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Student Question Panel */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <HelpCircle className="h-5 w-5 mr-2" />
                  Ask the Doctor
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Ask a question about the case..."
                    value={studentQuestion}
                    onChange={(e) => setStudentQuestion(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleStudentQuestion()}
                  />
                  <Button onClick={handleStudentQuestion} disabled={isProcessing || !studentQuestion.trim()}>
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                </div>
                {studentQuestionResponse && (
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm font-medium text-blue-900 mb-1">Doctor's Response:</p>
                    <p className="prose prose-sm text-blue-800">{studentQuestionResponse}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Conversation and SOAP Note */}
          <div className="lg:col-span-2">
            <Tabs value={showSOAPNote && session.soapNote ? "soap" : "conversation"} className="space-y-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="conversation">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Conversation
                </TabsTrigger>
                <TabsTrigger value="soap" disabled={!session.soapNote}>
                  <FileText className="h-4 w-4 mr-2" />
                  SOAP Note
                </TabsTrigger>
              </TabsList>

              <TabsContent value="conversation">
                <Card>
                  <CardHeader>
                    <CardTitle>Doctor-Patient Consultation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-96" ref={scrollAreaRef}>
                      <div className="space-y-4">
                        {session.conversation.map((message, index) => (
                          <div key={index} className="space-y-2">
                            <div className={`flex ${message.role === "doctor" ? "justify-start" : "justify-end"}`}>
                              <div
                                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                  message.role === "doctor"
                                    ? "bg-blue-100 text-blue-900"
                                    : "bg-green-100 text-green-900"
                                }`}
                              >
                                <div className="flex items-center mb-1">
                                  {message.role === "doctor" ? (
                                    <Stethoscope className="h-4 w-4 mr-2" />
                                  ) : (
                                    <User className="h-4 w-4 mr-2" />
                                  )}
                                  <span className="font-medium capitalize">{message.role}</span>
                                </div>
                                <p className="text-sm">{message.content}</p>
                              </div>
                            </div>
                            {message.explanation && (
                              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 ml-4">
                                <p className="text-sm font-medium text-yellow-900 mb-1">Educational Note:</p>
                                <p className="text-sm text-yellow-800">{message.explanation}</p>
                              </div>
                            )}
                          </div>
                        ))}
                        {isProcessing && (
                          <div className="flex justify-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="soap">
                {session.soapNote && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Educational SOAP Note</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {/* Subjective */}
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">Subjective</h3>
                          <p className="text-gray-700 mb-3">{session.soapNote.subjective}</p>
                          <div className="bg-blue-50 border-l-4 border-blue-400 p-3">
                            <p className="text-sm font-medium text-blue-900 mb-1">Learning Point:</p>
                            <p className="text-sm text-blue-800">{session.soapNote.subjectiveExplanation}</p>
                          </div>
                        </div>

                        {/* Objective */}
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">Objective</h3>
                          <p className="text-gray-700 mb-3">{session.soapNote.objective}</p>
                          <div className="bg-green-50 border-l-4 border-green-400 p-3">
                            <p className="text-sm font-medium text-green-900 mb-1">Learning Point:</p>
                            <p className="text-sm text-green-800">{session.soapNote.objectiveExplanation}</p>
                          </div>
                        </div>

                        {/* Assessment */}
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">Assessment</h3>
                          <p className="text-gray-700 mb-3">{session.soapNote.assessment}</p>
                          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3">
                            <p className="text-sm font-medium text-yellow-900 mb-1">Learning Point:</p>
                            <p className="text-sm text-yellow-800">{session.soapNote.assessmentExplanation}</p>
                          </div>
                        </div>

                        {/* Plan */}
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">Plan</h3>
                          <p className="text-gray-700 mb-3">{session.soapNote.plan}</p>
                          <div className="bg-purple-50 border-l-4 border-purple-400 p-3">
                            <p className="text-sm font-medium text-purple-900 mb-1">Learning Point:</p>
                            <p className="text-sm text-purple-800">{session.soapNote.planExplanation}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  )
}
