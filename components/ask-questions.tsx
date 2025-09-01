"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { HelpCircle, Lightbulb, MessageCircleQuestion, Eye, EyeOff } from "lucide-react"
import type { ConversationContext } from "@/lib/data-models"

interface SuggestedQuestion {
  id: string
  question: string
  category: string
  importance: "high" | "medium" | "low"
  rationale?: string
}

interface AskQuestionsProps {
  context: ConversationContext
  onQuestionSelect: (question: string) => void
  isLoading?: boolean
  triggerRefresh?: number
}

export function AskQuestions({ context, onQuestionSelect, isLoading = false, triggerRefresh = 0 }: AskQuestionsProps) {
  const [suggestedQuestions, setSuggestedQuestions] = useState<SuggestedQuestion[]>([])
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isFlipped, setIsFlipped] = useState(false)
  const [showRationale, setShowRationale] = useState(true)

  const fetchSuggestedQuestions = async () => {
    if (context.conversationHistory.length === 0) return
    
    setIsLoadingQuestions(true)
    setError(null)

    try {
      const response = await fetch("/api/ai/suggested-questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ context }),
      })

      if (!response.ok) {
        throw new Error("Failed to fetch suggested questions")
      }

      const data = await response.json()
      setSuggestedQuestions(data.questions || [])
    } catch (error) {
      console.error("Error fetching suggested questions:", error)
      setError("Unable to load suggested questions")
      setSuggestedQuestions(generateFallbackQuestions(context.disease))
    } finally {
      setIsLoadingQuestions(false)
    }
  }

  const generateFallbackQuestions = (disease: string): SuggestedQuestion[] => {
    const commonQuestions = [
      {
        id: "1",
        question: "When did your symptoms first begin?",
        category: "History",
        importance: "high" as const,
        rationale: "Understanding symptom onset helps determine disease progression"
      },
      {
        id: "2",
        question: "How would you rate your pain on a scale of 1-10?",
        category: "Assessment",
        importance: "high" as const,
        rationale: "Pain assessment is crucial for diagnosis and treatment planning"
      },
      {
        id: "3",
        question: "Have you noticed any triggers that make your symptoms worse?",
        category: "History",
        importance: "medium" as const,
        rationale: "Identifying triggers helps understand the condition better"
      },
      {
        id: "4",
        question: "Are you currently taking any medications?",
        category: "History",
        importance: "high" as const,
        rationale: "Current medications can affect symptoms and treatment options"
      },
      {
        id: "5",
        question: "Do you have any family history of similar conditions?",
        category: "History",
        importance: "medium" as const,
        rationale: "Family history provides important genetic and risk factor information"
      }
    ]

    return commonQuestions
  }

  useEffect(() => {
    if (triggerRefresh > 0) {
      fetchSuggestedQuestions()
    }
  }, [triggerRefresh])

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case "high":
        return "bg-red-50 text-red-700 border-red-300 hover:bg-red-100"
      case "medium":
        return "bg-yellow-50 text-yellow-700 border-yellow-300 hover:bg-yellow-100"
      case "low":
        return "bg-green-50 text-green-700 border-green-300 hover:bg-green-100"
      default:
        return "bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100"
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case "history":
        return "📋"
      case "assessment":
        return "🔍"
      case "examination":
        return "🩺"
      case "symptoms":
        return "🤒"
      default:
        return "❓"
    }
  }

  return (
    <div className="h-full">
      <div 
        className={`relative w-full h-full transition-all duration-700 cursor-pointer ${
          isFlipped ? '' : ''
        }`}
        onClick={() => setIsFlipped(!isFlipped)}
        style={{
          transformStyle: 'preserve-3d',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
        }}
      >
        {/* Front Side - Click to get hints */}
        <div 
          className="absolute inset-0"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(0deg)',
            opacity: isFlipped ? 0 : 1,
            visibility: isFlipped ? 'hidden' : 'visible'
          }}
        >
          <Card className="h-full flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100 border-2 border-dashed border-emerald-300 hover:border-emerald-400 transition-all duration-300 hover:shadow-lg">
            <CardContent className="text-center p-6">
              <div className="relative">
                <div className="absolute inset-0 bg-emerald-200 rounded-full opacity-20 animate-pulse"></div>
                <HelpCircle className="h-20 w-20 text-emerald-600 mx-auto mb-4 relative z-10" />
              </div>
              <h3 className="text-xl font-bold text-emerald-900 mb-3">Get Question Hints</h3>
              <p className="text-emerald-700 text-sm leading-relaxed mb-3">
                Click to reveal AI-powered question suggestions tailored to this case
              </p>
              <div className="inline-flex items-center bg-emerald-100 px-3 py-1 rounded-full">
                <Lightbulb className="h-4 w-4 text-emerald-600 mr-1" />
                <span className="text-emerald-700 text-xs font-semibold">Smart Suggestions</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Back Side - Suggested Questions */}
        <div 
          className="absolute inset-0"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            opacity: isFlipped ? 1 : 0,
            visibility: isFlipped ? 'visible' : 'hidden'
          }}
        >
          <Card className="h-full bg-white shadow-lg">
            <CardHeader className="pb-3 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center text-lg">
                  <MessageCircleQuestion className="h-5 w-5 mr-2 text-indigo-600" />
                  <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent font-bold">
                    Question Suggestions
                  </span>
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowRationale(!showRationale)
                  }}
                  className="p-2 hover:bg-gray-100"
                  title={showRationale ? "Hide explanations" : "Show explanations"}
                >
                  {showRationale ? (
                    <EyeOff className="h-4 w-4 text-gray-600" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-600" />
                  )}
                </Button>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Click any question to use it in your conversation
              </p>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-4">
              <div className="space-y-3 h-full overflow-y-auto custom-scrollbar">
                {isLoadingQuestions ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, index) => (
                      <div key={index} className="animate-pulse bg-gray-50 rounded-xl p-4">
                        <div className="flex items-center space-x-2 mb-3">
                          <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                          <div className="h-6 bg-gray-200 rounded-full w-12"></div>
                        </div>
                        <div className="h-4 bg-gray-200 rounded mb-2"></div>
                        <div className="h-3 bg-gray-100 rounded w-3/4"></div>
                      </div>
                    ))}
                  </div>
                ) : error ? (
                  <div className="text-center py-12">
                    <HelpCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-sm text-gray-500 mb-3">{error}</p>
                    <p className="text-xs text-gray-400">Please try refreshing or check your connection</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {suggestedQuestions.map((question, index) => (
                      <div
                        key={question.id}
                        className="group bg-gradient-to-r from-white to-gray-50 border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-indigo-200 transition-all duration-200 cursor-pointer transform hover:-translate-y-1"
                        onClick={(e) => {
                          e.stopPropagation()
                          onQuestionSelect(question.question)
                          setIsFlipped(false)
                        }}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                              <span className="text-indigo-600 font-bold text-sm">{index + 1}</span>
                            </div>
                            <Badge 
                              variant="secondary" 
                              className="text-xs bg-indigo-50 text-indigo-700 border-indigo-200"
                            >
                              {question.category}
                            </Badge>
                            <Badge 
                              variant="outline" 
                              className={`text-xs border-2 ${getImportanceColor(question.importance)}`}
                            >
                              {question.importance.toUpperCase()}
                            </Badge>
                          </div>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-xs text-gray-400">Click to use</span>
                          </div>
                        </div>
                        
                        <p className="text-sm font-semibold text-gray-800 mb-2 leading-relaxed group-hover:text-indigo-700 transition-colors">
                          {question.question}
                        </p>
                        
                        {question.rationale && showRationale && (
                          <div className="mt-3 p-3 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-lg">
                            <div className="flex items-start">
                              <Lightbulb className="h-4 w-4 text-amber-600 mr-2 mt-0.5 flex-shrink-0" />
                              <p className="text-xs text-amber-800 leading-relaxed">{question.rationale}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {suggestedQuestions.length === 0 && !isLoadingQuestions && (
                      <div className="text-center py-12">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <MessageCircleQuestion className="h-10 w-10 text-gray-400" />
                        </div>
                        <h4 className="font-semibold text-gray-700 mb-2">No suggestions yet</h4>
                        <p className="text-sm text-gray-500">
                          Start a conversation to get personalized question suggestions
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
