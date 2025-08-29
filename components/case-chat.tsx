"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import type { MedicalCase, ChatMessage, ConversationContext } from "@/lib/data-models"
import type { User } from "@/lib/auth"
import { conversationService } from "@/lib/conversation-service"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Send, AlertTriangle, UserIcon, Stethoscope, GraduationCap, Mic, MicOff } from "lucide-react"
import { AskQuestions } from "@/components/ask-questions"
import Link from "next/link"

interface CaseChatProps {
  medicalCase: MedicalCase
  student: User
}

export function CaseChat({ medicalCase, student }: CaseChatProps) {
  const [conversation, setConversation] = useState<any>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [currentMessage, setCurrentMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showIntervention, setShowIntervention] = useState(false)
  const [interventionMessage, setInterventionMessage] = useState("")
  const [questionRefreshTrigger, setQuestionRefreshTrigger] = useState(0)
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Create new conversation when component mounts
    const newConversation = conversationService.createConversation(student.id, medicalCase)
    setConversation(newConversation)
    setMessages(newConversation.messages)
  }, [medicalCase, student.id])

  useEffect(() => {
    // Scroll to bottom when new messages are added
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = false
      recognitionRef.current.lang = 'en-US'

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setCurrentMessage(transcript)
        setIsListening(false)
      }

      recognitionRef.current.onend = () => {
        setIsListening(false)
      }

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error)
        setIsListening(false)
      }
    }
  }, [])

  const handleSendMessage = async () => {
    if (!currentMessage.trim() || !conversation || isLoading) return

    setIsLoading(true)

    try {
      // Add student message
      const studentMessage = conversationService.addMessage(conversation.id, {
        role: "student",
        content: currentMessage,
      })

      setMessages((prev) => [...prev, studentMessage])
      const messageToSend = currentMessage
      setCurrentMessage("")

      // Create conversation context for AI
      const context: ConversationContext = {
        caseId: medicalCase.id,
        disease: medicalCase.disease,
        symptoms: medicalCase.symptoms,
        patientProfile: medicalCase.patientProfile,
        conversationHistory: [...messages, studentMessage].map((m) => ({
          role: m.role,
          content: m.content,
          timestamp: m.timestamp,
        })),
      }

      // First, check if doctor should intervene
      const evaluationResponse = await fetch("/api/ai/evaluate-question", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentQuestion: messageToSend,
          context,
        }),
      })

      const doctorEvaluation = await evaluationResponse.json()

      if (doctorEvaluation.shouldIntervene) {
        // Show intervention alert
        setInterventionMessage(doctorEvaluation.content)
        setShowIntervention(true)

        // Add doctor intervention message
        const doctorMessage = conversationService.addMessage(conversation.id, {
          role: "doctor",
          content: doctorEvaluation.content,
          isIntervention: true,
        })

        setMessages((prev) => [...prev, doctorMessage])

        // Hide intervention after 5 seconds
        setTimeout(() => {
          setShowIntervention(false)
        }, 5000)
      } else {
        const patientResponse = await fetch("/api/ai/patient-response", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            studentQuestion: messageToSend,
            context,
          }),
        })

        const patientData = await patientResponse.json()

        const patientMessage = conversationService.addMessage(conversation.id, {
          role: "patient",
          content: patientData.content,
        })

        setMessages((prev) => [...prev, patientMessage])
      }

      // Always trigger question refresh after any response
      setQuestionRefreshTrigger(prev => prev + 1)
      
    } catch (error) {
      console.error("Error sending message:", error)
      const errorMessage = conversationService.addMessage(conversation.id, {
        role: "doctor",
        content: "⚠️ Unable to connect to AI service. Please check your internet connection and API key configuration.",
      })
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleCompleteCase = () => {
    if (conversation) {
      conversationService.completeConversation(conversation.id)
      window.location.href = `/soap/${conversation.id}`
    }
  }

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setIsListening(true)
      recognitionRef.current.start()
    }
  }

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    }
  }

  const handleQuestionSelect = (question: string) => {
    setCurrentMessage(question)
  }

  // Create context for AskQuestions component
  const askQuestionsContext: ConversationContext = conversation ? {
    caseId: medicalCase.id,
    disease: medicalCase.disease,
    symptoms: medicalCase.symptoms,
    patientProfile: medicalCase.patientProfile,
    conversationHistory: messages.map((m) => ({
      role: m.role,
      content: m.content,
      timestamp: m.timestamp,
    })),
  } : {
    caseId: medicalCase.id,
    disease: medicalCase.disease,
    symptoms: medicalCase.symptoms,
    patientProfile: medicalCase.patientProfile,
    conversationHistory: [],
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Intervention Alert Overlay */}
      {showIntervention && (
        <div className="fixed inset-0 bg-red-500 bg-opacity-20 z-50 flex items-center justify-center">
          <div className="bg-red-600 text-white p-6 rounded-lg shadow-lg max-w-md mx-4 animate-pulse">
            <div className="flex items-center mb-2">
              <AlertTriangle className="h-6 w-6 mr-2" />
              <h3 className="font-bold text-lg">Doctor Intervention</h3>
            </div>
            <p>{interventionMessage}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">{medicalCase.title}</h1>
                <p className="text-sm text-gray-600">Patient: {medicalCase.patientProfile.name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline">{medicalCase.difficulty}</Badge>
              <Button onClick={handleCompleteCase} variant="default">
                Complete Case & Write SOAP Note
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Chat Interface with Suggested Questions */}
      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" style={{ height: 'calc(100vh - 8rem)' }}>
          
          {/* Chat Section - Left Side (2/3 width on large screens) */}
          <div className="lg:col-span-2 flex flex-col">
            <Card className="flex-1 flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Patient Consultation</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col min-h-0">
                {/* Chat Messages Container with Fixed Height and Custom Scrollbar */}
                <div className="h-96 overflow-y-auto space-y-4 mb-4 pr-2 custom-scrollbar">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === "student" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          message.role === "student"
                            ? "bg-blue-600 text-white"
                            : message.role === "patient"
                              ? "bg-gray-100 text-gray-900"
                              : "bg-red-100 text-red-900 border border-red-200"
                        }`}
                      >
                        <div className="flex items-center mb-1">
                          {message.role === "student" && <GraduationCap className="h-4 w-4 mr-2" />}
                          {message.role === "patient" && <UserIcon className="h-4 w-4 mr-2" />}
                          {message.role === "doctor" && <Stethoscope className="h-4 w-4 mr-2" />}
                          <span className="text-xs font-medium capitalize">
                            {message.role === "student" ? "You" : message.role}
                          </span>
                          {message.isIntervention && <AlertTriangle className="h-3 w-3 ml-2 text-red-600" />}
                        </div>
                        <p className="text-sm">{message.content}</p>
                        <p className="text-xs opacity-70 mt-1">{new Date(message.timestamp).toLocaleTimeString()}</p>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 rounded-lg p-3 max-w-[80%]">
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                          <span className="text-sm text-gray-600">Patient is responding...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>                {/* Message Input */}
                <div className="flex space-x-2 mt-4 pt-4 border-t">
                  <Input
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask the patient a question..."
                    disabled={isLoading}
                    className="flex-1"
                  />
                  <Button
                    onClick={isListening ? stopListening : startListening}
                    disabled={isLoading}
                    variant={isListening ? "destructive" : "outline"}
                    size="sm"
                    title={isListening ? "Stop listening" : "Start voice input"}
                  >
                    {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </Button>
                  <Button onClick={handleSendMessage} disabled={isLoading || !currentMessage.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Case Info */}
            <Card className="mt-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Case Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-gray-700">Patient</p>
                    <p className="text-gray-600">{medicalCase.patientProfile.name}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Age</p>
                    <p className="text-gray-600">{medicalCase.patientProfile.age} years</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Gender</p>
                    <p className="text-gray-600">{medicalCase.patientProfile.gender}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Occupation</p>
                    <p className="text-gray-600">{medicalCase.patientProfile.occupation}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Suggested Questions - Right Side (1/3 width on large screens) */}
          <div className="lg:col-span-1">
            <AskQuestions
              context={askQuestionsContext}
              onQuestionSelect={handleQuestionSelect}
              isLoading={isLoading}
              triggerRefresh={questionRefreshTrigger}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
