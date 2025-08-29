"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { HelpCircle, Lightbulb, MessageCircleQuestion } from "lucide-react"
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
        return "bg-red-100 text-red-800 border-red-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "low":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
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
          <Card className="h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 border-2 border-dashed border-blue-300 hover:border-blue-400 transition-colors">
            <CardContent className="text-center p-6">
              <HelpCircle className="h-16 w-16 text-blue-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Need Help?</h3>
              <p className="text-blue-700 text-sm">
                Click anywhere on this box to get AI-powered question suggestions
              </p>
              <p className="text-blue-600 text-xs mt-2 font-medium">
                💡 Get Hints
              </p>
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
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <MessageCircleQuestion className="h-5 w-5 mr-2 text-blue-600" />
                Suggested Questions
              </CardTitle>
              <p className="text-sm text-gray-600">
                Click any question to use it
              </p>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden">
              <div className="space-y-3 h-full overflow-y-auto">
                {isLoadingQuestions ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, index) => (
                      <div key={index} className="animate-pulse">
                        <div className="h-4 bg-gray-200 rounded mb-2"></div>
                        <div className="h-3 bg-gray-100 rounded w-3/4 mb-2"></div>
                        <div className="h-2 bg-gray-100 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : error ? (
                  <div className="text-center py-8">
                    <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm text-gray-600 mb-3">{error}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {suggestedQuestions.map((question) => (
                      <div
                        key={question.id}
                        className="border rounded-lg p-3 hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation()
                          onQuestionSelect(question.question)
                          setIsFlipped(false)
                        }}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="text-xs">
                              {question.category}
                            </Badge>
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${getImportanceColor(question.importance)}`}
                            >
                              {question.importance}
                            </Badge>
                          </div>
                        </div>
                        
                        <p className="text-sm font-medium text-gray-900 mb-1 leading-relaxed">
                          {question.question}
                        </p>
                        
                        {question.rationale && (
                          <div className="flex items-start mt-2 p-2 bg-blue-50 rounded text-xs">
                            <Lightbulb className="h-3 w-3 text-blue-600 mr-1 mt-0.5 flex-shrink-0" />
                            <p className="text-blue-700">{question.rationale}</p>
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {suggestedQuestions.length === 0 && !isLoadingQuestions && (
                      <div className="text-center py-8">
                        <MessageCircleQuestion className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-sm text-gray-600">
                          Start a conversation to get suggested questions
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
