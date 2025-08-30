"use client"

import { useState, useEffect } from "react"
import type { User, MedicalCase, Conversation, SOAPNote } from "@/lib/data-models"
import type { SOAPGrading } from "@/lib/soap-service"
import { soapAssistantService } from "@/lib/soap-assistant-service" // Import your AI service
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Save, Send, CheckCircle, AlertCircle, TrendingUp, BookOpen, Lightbulb, FileText, Loader2, Info, AlertTriangle } from "lucide-react"
import Link from "next/link"

interface SOAPNoteEditorProps {
  conversation: Conversation
  medicalCase: MedicalCase
  student: User
}

// AI Assistant interfaces
interface SOAPSuggestion {
  section: "subjective" | "objective" | "assessment" | "plan"
  suggestion: string
  confidence: number
  reasoning: string
}

interface RealTimeFeedback {
  section: "subjective" | "objective" | "assessment" | "plan"
  feedback: string
  severity: "info" | "warning" | "error"
  suggestion?: string
}

// AI-Enhanced SOAP Section Component
const SOAPSectionWithAI = ({ 
  title, 
  section, 
  description, 
  value, 
  onChange,
  placeholder,
  disabled,
  conversation,
  medicalCase
}: {
  title: string
  section: "subjective" | "objective" | "assessment" | "plan"
  description: string
  value: string
  onChange: (value: string) => void
  placeholder: string
  disabled: boolean
  conversation: Conversation
  medicalCase: MedicalCase
}) => {
  const [suggestions, setSuggestions] = useState<SOAPSuggestion[]>([])
  const [feedback, setFeedback] = useState<RealTimeFeedback[]>([])
  const [loading, setLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)

  // Get AI suggestions
  const getSuggestions = async () => {
    setLoading(true)
    try {
      const newSuggestions = await soapAssistantService.generateSOAPSuggestions(
        section, value, conversation, medicalCase
      )
      setSuggestions(newSuggestions)
      setShowSuggestions(true)
    } catch (error) {
      console.error('Error getting suggestions:', error)
    }
    setLoading(false)
  }

  // Generate AI draft
  const generateDraft = async () => {
    setLoading(true)
    try {
      const draft = await soapAssistantService.generateSectionDraft(
        section, conversation, medicalCase
      )
      onChange(draft)
    } catch (error) {
      console.error('Error generating draft:', error)
    }
    setLoading(false)
  }

  // Real-time feedback
  useEffect(() => {
    const getFeedback = async () => {
      if (value.length > 10) {
        try {
          const newFeedback = await soapAssistantService.getRealTimeFeedback(
            section, value, conversation, medicalCase
          )
          setFeedback(newFeedback)
        } catch (error) {
          console.error('Error getting feedback:', error)
        }
      } else {
        setFeedback([])
      }
    }

    const debounceTimer = setTimeout(getFeedback, 1000)
    return () => clearTimeout(debounceTimer)
  }, [value, section, conversation, medicalCase])

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      case 'info': return <Info className="w-4 h-4 text-blue-500" />
      default: return <CheckCircle className="w-4 h-4 text-green-500" />
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{title}</CardTitle>
            <p className="text-sm text-gray-600 mt-1">{description}</p>
          </div>
          {!disabled && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={getSuggestions}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                ) : (
                  <Lightbulb className="w-4 h-4 mr-1" />
                )}
                Suggestions
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={generateDraft}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                ) : (
                  <FileText className="w-4 h-4 mr-1" />
                )}
                Generate
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* AI Suggestions Panel */}
        {showSuggestions && suggestions.length > 0 && !disabled && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="font-medium text-blue-900 flex items-center gap-2">
                <Lightbulb className="w-4 h-4" />
                AI Suggestions
              </h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSuggestions(false)}
                className="text-blue-600 hover:text-blue-800"
              >
                Hide
              </Button>
            </div>
            {suggestions.map((suggestion, index) => (
              <div key={index} className="bg-white border border-blue-100 rounded p-3 space-y-2">
                <div className="flex justify-between items-start">
                  <p className="text-sm text-gray-800">{suggestion.suggestion}</p>
                  <Badge variant="secondary" className="text-xs">
                    {Math.round(suggestion.confidence * 100)}%
                  </Badge>
                </div>
                <p className="text-xs text-gray-600">{suggestion.reasoning}</p>
              </div>
            ))}
          </div>
        )}

        {/* Textarea */}
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="min-h-[200px]"
          disabled={disabled}
        />

        {/* Real-time Feedback */}
        {feedback.length > 0 && !disabled && (
          <div className="space-y-2">
            {feedback.map((item, index) => (
              <div key={index} className={`flex gap-3 p-3 rounded-lg ${
                item.severity === 'error' ? 'bg-red-50 border border-red-200' :
                item.severity === 'warning' ? 'bg-yellow-50 border border-yellow-200' :
                'bg-blue-50 border border-blue-200'
              }`}>
                {getSeverityIcon(item.severity)}
                <div className="flex-1">
                  <p className="text-sm text-gray-800">{item.feedback}</p>
                  {item.suggestion && (
                    <p className="text-xs text-gray-600 mt-1">{item.suggestion}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

const renderSOAPContent = (content: any): string => {
  if (typeof content === "string") {
    return content
  }
  if (typeof content === "object" && content !== null) {
    // Convert object to formatted string
    return Object.entries(content)
      .map(([key, value]) => `${key.replace(/_/g, " ").toUpperCase()}: ${value}`)
      .join("\n\n")
  }
  return String(content || "")
}

export function SOAPNoteEditor({ conversation, medicalCase, student }: SOAPNoteEditorProps) {
  const [subjective, setSubjective] = useState("")
  const [objective, setObjective] = useState("")
  const [assessment, setAssessment] = useState("")
  const [plan, setPlan] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)
  const [grading, setGrading] = useState<SOAPGrading | null>(null)
  const [aiSOAP, setAiSOAP] = useState<SOAPNote["aiGeneratedSOAP"] | null>(null)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadExistingSOAP = async () => {
      try {
        const response = await fetch(`/api/soap/get?conversationId=${conversation.id}`)
        const result = await response.json()

        if (result.success && result.soapNote) {
          const existingSOAP = result.soapNote
          setSubjective(existingSOAP.subjective)
          setObjective(existingSOAP.objective)
          setAssessment(existingSOAP.assessment)
          setPlan(existingSOAP.plan)
          setIsSubmitted(true)
          if (existingSOAP.aiGeneratedSOAP) {
            setAiSOAP(existingSOAP.aiGeneratedSOAP)
          }
        }
      } catch (error) {
        console.error("[v0] Error loading existing SOAP note:", error)
      }
    }

    loadExistingSOAP()
  }, [conversation.id])

  const handleSave = async () => {
    const soapNote: SOAPNote = {
      id: crypto.randomUUID(),
      conversationId: conversation.id,
      studentId: student.id,
      subjective,
      objective,
      assessment,
      plan,
      submittedAt: new Date().toISOString(),
    }

    try {
      const response = await fetch("/api/soap/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(soapNote),
      })

      const result = await response.json()
      if (result.success) {
        console.log("[v0] SOAP note saved")
      } else {
        console.error("[v0] Error saving SOAP note:", result.error)
      }
    } catch (error) {
      console.error("[v0] Error saving SOAP note:", error)
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setIsGeneratingAI(true)
    setError(null)

    try {
      const aiResponse = await fetch("/api/soap/generate-ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversation,
          medicalCase,
        }),
      })

      const aiResult = await aiResponse.json()
      if (!aiResult.success) {
        throw new Error(aiResult.error || "Failed to generate AI SOAP note")
      }

      const aiGeneratedSOAP = aiResult.aiSOAP
      setAiSOAP(aiGeneratedSOAP)
      setIsGeneratingAI(false)

      const studentSOAP = {
        conversationId: conversation.id,
        studentId: student.id,
        subjective,
        objective,
        assessment,
        plan,
        aiGeneratedSOAP,
      }

      const gradeResponse = await fetch("/api/soap/grade", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentSOAP,
          aiSOAP: aiGeneratedSOAP,
        }),
      })

      const gradeResult = await gradeResponse.json()
      if (!gradeResult.success) {
        throw new Error(gradeResult.error || "Failed to grade SOAP note")
      }

      const gradingResult = gradeResult.grading
      setGrading(gradingResult)

      const finalSOAPNote: SOAPNote = {
        id: crypto.randomUUID(),
        conversationId: conversation.id,
        studentId: student.id,
        subjective,
        objective,
        assessment,
        plan,
        submittedAt: new Date().toISOString(),
        grade: gradingResult.overallGrade,
        feedback: gradingResult.feedback.overall.join(" "),
        aiGeneratedSOAP,
      }

      const saveResponse = await fetch("/api/soap/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(finalSOAPNote),
      })

      const saveResult = await saveResponse.json()
      if (!saveResult.success) {
        console.error("[v0] Error saving final SOAP note:", saveResult.error)
      }

      setIsSubmitted(true)
    } catch (error) {
      console.error("[v0] Error submitting SOAP note:", error)
      setError(error instanceof Error ? error.message : "An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  const getGradeColor = (grade: number) => {
    if (grade >= 90) return "text-green-600"
    if (grade >= 80) return "text-blue-600"
    if (grade >= 70) return "text-yellow-600"
    return "text-red-600"
  }

  const getGradeBadgeVariant = (grade: number) => {
    if (grade >= 90) return "default"
    if (grade >= 80) return "secondary"
    if (grade >= 70) return "outline"
    return "destructive"
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
                <h1 className="text-lg font-semibold text-gray-900">SOAP Note - {medicalCase.title}</h1>
                <p className="text-sm text-gray-600">Patient: {medicalCase.patientProfile.name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {grading && (
                <Badge variant={getGradeBadgeVariant(grading.overallGrade)} className="text-sm">
                  Grade: {grading.overallGrade}%
                </Badge>
              )}
              {!isSubmitted && (
                <>
                  <Button variant="outline" onClick={handleSave}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Draft
                  </Button>
                  <Button onClick={handleSubmit} disabled={isSubmitting}>
                    <Send className="h-4 w-4 mr-2" />
                    {isSubmitting ? "Submitting..." : "Submit for Grading"}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4">
        {error && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Error: {error}</AlertDescription>
          </Alert>
        )}

        {isSubmitted && grading ? (
          <Tabs defaultValue="grading" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="grading">Grading & Feedback</TabsTrigger>
              <TabsTrigger value="comparison">AI Comparison</TabsTrigger>
              <TabsTrigger value="your-note">Your SOAP Note</TabsTrigger>
            </TabsList>

            <TabsContent value="grading" className="space-y-6">
              {/* Overall Grade */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
                    Overall Grade:{" "}
                    <span className={`ml-2 ${getGradeColor(grading.overallGrade)}`}>{grading.overallGrade}%</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Progress value={grading.overallGrade} className="w-full" />
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-700">Subjective</p>
                        <p className={`text-lg font-bold ${getGradeColor(grading.subjectiveGrade)}`}>
                          {grading.subjectiveGrade}%
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-700">Objective</p>
                        <p className={`text-lg font-bold ${getGradeColor(grading.objectiveGrade)}`}>
                          {grading.objectiveGrade}%
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-700">Assessment</p>
                        <p className={`text-lg font-bold ${getGradeColor(grading.assessmentGrade)}`}>
                          {grading.assessmentGrade}%
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-700">Plan</p>
                        <p className={`text-lg font-bold ${getGradeColor(grading.planGrade)}`}>{grading.planGrade}%</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Feedback sections - keeping your existing feedback display */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-green-700">
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Strengths
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {grading.strengths.map((strength, index) => (
                        <li key={index} className="flex items-start">
                          <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                          <span className="text-sm text-gray-700">{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-orange-700">
                      <AlertCircle className="h-5 w-5 mr-2" />
                      Areas for Improvement
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {grading.improvements.map((improvement, index) => (
                        <li key={index} className="flex items-start">
                          <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                          <span className="text-sm text-gray-700">{improvement}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              {/* Detailed Feedback */}
              <Card>
                <CardHeader>
                  <CardTitle>Detailed Feedback by Section</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(grading.feedback).map(
                      ([section, feedback]) =>
                        section !== "overall" && (
                          <div key={section}>
                            <h4 className="font-medium text-gray-900 capitalize mb-2">{section}</h4>
                            <ul className="space-y-1">
                              {feedback.map((item, index) => (
                                <li key={index} className="text-sm text-gray-600 ml-4">
                                  • {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ),
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Keeping your existing comparison and your-note tabs */}
            <TabsContent value="comparison" className="space-y-6">
              {aiSOAP ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-blue-600">Your SOAP Note</h3>
                    <div className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Subjective</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{subjective}</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Objective</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{objective}</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Assessment</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{assessment}</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Plan</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{plan}</p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-green-600">AI-Generated Reference</h3>
                    <div className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Subjective</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">
                            {renderSOAPContent(aiSOAP.subjective)}
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Objective</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">
                            {renderSOAPContent(aiSOAP.objective)}
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Assessment</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">
                            {renderSOAPContent(aiSOAP.assessment)}
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Plan</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{renderSOAPContent(aiSOAP.plan)}</p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">AI-generated reference SOAP note is not available yet.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="your-note">
              <Card>
                <CardHeader>
                  <CardTitle>Your Submitted SOAP Note</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Subjective</h4>
                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded whitespace-pre-wrap">{subjective}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Objective</h4>
                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded whitespace-pre-wrap">{objective}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Assessment</h4>
                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded whitespace-pre-wrap">{assessment}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Plan</h4>
                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded whitespace-pre-wrap">{plan}</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="space-y-6">
            <Alert>
              <BookOpen className="h-4 w-4" />
              <AlertDescription>
                Based on your conversation with the patient, write a comprehensive SOAP note. Use the AI assistance features to get suggestions, auto-complete medical terms, and receive real-time feedback as you write.
              </AlertDescription>
            </Alert>

            {isGeneratingAI && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Generating AI reference SOAP note for comparison... This may take a moment.
                </AlertDescription>
              </Alert>
            )}

            {/* Enhanced SOAP sections with AI assistance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SOAPSectionWithAI
                title="Subjective"
                section="subjective"
                description="Patient's history, symptoms, and subjective information"
                value={subjective}
                onChange={setSubjective}
                placeholder="Document the patient's chief complaint, history of present illness, past medical history, medications, allergies, social history, and review of systems..."
                disabled={isSubmitted}
                conversation={conversation}
                medicalCase={medicalCase}
              />

              <SOAPSectionWithAI
                title="Objective"
                section="objective"
                description="Physical examination findings and diagnostic results"
                value={objective}
                onChange={setObjective}
                placeholder="Document vital signs, physical examination findings, laboratory results, imaging studies, and other objective data..."
                disabled={isSubmitted}
                conversation={conversation}
                medicalCase={medicalCase}
              />

              <SOAPSectionWithAI
                title="Assessment"
                section="assessment"
                description="Clinical impression and differential diagnosis"
                value={assessment}
                onChange={setAssessment}
                placeholder="Provide your clinical impression, primary diagnosis, and differential diagnoses with supporting rationale..."
                disabled={isSubmitted}
                conversation={conversation}
                medicalCase={medicalCase}
              />

              <SOAPSectionWithAI
                title="Plan"
                section="plan"
                description="Treatment plan and follow-up"
                value={plan}
                onChange={setPlan}
                placeholder="Outline your treatment plan including medications, procedures, monitoring, patient education, and follow-up care..."
                disabled={isSubmitted}
                conversation={conversation}
                medicalCase={medicalCase}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
