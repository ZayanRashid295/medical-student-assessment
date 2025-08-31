import { conversationService } from "./conversation-service"
import { soapService } from "./soap-service"
import type { Conversation, SOAPNote } from "./data-models"
import { generateText } from "ai"
import { createOpenAI } from "@ai-sdk/openai"

const openai = createOpenAI({ apiKey: "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" })
export interface PerformanceMetrics {
  totalCases: number
  completedCases: number
  averageGrade: number
  totalInterventions: number
  averageInterventionsPerCase: number
  timeSpent: number // in minutes
  improvementTrend: number // percentage change from last period
  gradeDistribution: {
    excellent: number // 90-100
    good: number // 80-89
    satisfactory: number // 70-79
    needsImprovement: number // <70
  }
  skillAreas: {
    subjective: number
    objective: number
    assessment: number
    plan: number
  }
  recentActivity: Array<{
    date: string
    caseTitle: string
    grade: number
    interventions: number
  }>
}

export interface LearningInsights {
  strengths: string[]
  weaknesses: string[]
  recommendations: string[]
  nextSteps: string[]
  comparisonToPeers: {
    percentile: number
    averageGrade: number
    peerAverageGrade: number
  }
}

class AnalyticsService {
  private storageKey = "medical-app-analytics"

  // Calculate comprehensive performance metrics for a student
  calculatePerformanceMetrics(studentId: string): PerformanceMetrics {
    const conversations = conversationService.getStudentConversations(studentId)
    const soapNotes = soapService.getStudentSOAPNotes(studentId)

    const completedCases = conversations.filter((c) => c.status === "completed").length
    const totalInterventions = conversations.reduce((sum, c) => sum + c.interventionCount, 0)

    // Calculate grades from SOAP notes
    const grades = soapNotes.filter((s) => s.grade !== undefined).map((s) => s.grade!)
    const averageGrade = grades.length > 0 ? Math.round(grades.reduce((sum, g) => sum + g, 0) / grades.length) : 0

    // Calculate time spent (estimated based on conversation length)
    const timeSpent = conversations.reduce((total, conv) => {
      const duration = conv.completedAt
        ? (new Date(conv.completedAt).getTime() - new Date(conv.startedAt).getTime()) / (1000 * 60)
        : 0
      return total + duration
    }, 0)

    // Grade distribution
    const gradeDistribution = {
      excellent: grades.filter((g) => g >= 90).length,
      good: grades.filter((g) => g >= 80 && g < 90).length,
      satisfactory: grades.filter((g) => g >= 70 && g < 80).length,
      needsImprovement: grades.filter((g) => g < 70).length,
    }

    // Skill areas from SOAP notes (would need more sophisticated analysis in real app)
    const skillAreas = this.calculateSkillAreas(soapNotes)

    // Recent activity
    const recentActivity = this.getRecentActivity(conversations, soapNotes)

    // Improvement trend (simplified calculation)
    const improvementTrend = this.calculateImprovementTrend(soapNotes)

    return {
      totalCases: conversations.length,
      completedCases,
      averageGrade,
      totalInterventions,
      averageInterventionsPerCase: completedCases > 0 ? Math.round((totalInterventions / completedCases) * 10) / 10 : 0,
      timeSpent: Math.round(timeSpent),
      improvementTrend,
      gradeDistribution,
      skillAreas,
      recentActivity,
    }
  }

  // Generate learning insights and recommendations
  async generateLearningInsights(studentId: string): Promise<LearningInsights> {
    const metrics = this.calculatePerformanceMetrics(studentId)
    const soapNotes = soapService.getStudentSOAPNotes(studentId)
    const conversations = conversationService.getStudentConversations(studentId)
    const progress = this.getLearningProgress(studentId)

    try {
      const { text } = await generateText({
        model: openai("gpt-4o-mini"),
        prompt: `You are an expert medical educator analyzing a medical student's performance. Based on the following data, provide detailed insights and recommendations.

STUDENT PERFORMANCE DATA:
- Total Cases: ${metrics.totalCases}
- Completed Cases: ${metrics.completedCases}
- Average Grade: ${metrics.averageGrade}%
- Total Interventions: ${metrics.totalInterventions}
- Average Interventions per Case: ${metrics.averageInterventionsPerCase}
- Time Spent: ${metrics.timeSpent} minutes
- Improvement Trend: ${metrics.improvementTrend}%

SKILL AREAS PERFORMANCE:
- Subjective (History Taking): ${metrics.skillAreas.subjective}%
- Objective (Physical Exam): ${metrics.skillAreas.objective}%
- Assessment (Diagnosis): ${metrics.skillAreas.assessment}%
- Plan (Treatment): ${metrics.skillAreas.plan}%

GRADE DISTRIBUTION:
- Excellent (90-100%): ${metrics.gradeDistribution.excellent} cases
- Good (80-89%): ${metrics.gradeDistribution.good} cases
- Satisfactory (70-79%): ${metrics.gradeDistribution.satisfactory} cases
- Needs Improvement (<70%): ${metrics.gradeDistribution.needsImprovement} cases

RECENT PERFORMANCE TREND:
${progress
  .slice(-5)
  .map((p) => `- ${p.caseTitle}: Grade ${p.grade}%, ${p.interventions} interventions`)
  .join("\n")}

Please provide a JSON response with the following structure:
{
  "strengths": ["strength1", "strength2", ...],
  "weaknesses": ["weakness1", "weakness2", ...],
  "recommendations": ["recommendation1", "recommendation2", ...],
  "nextSteps": ["step1", "step2", ...]
}

Focus on:
1. Specific clinical skills (history taking, physical exam, diagnosis, treatment planning)
2. Learning patterns and improvement trends
3. Intervention frequency and clinical reasoning
4. Actionable recommendations for improvement
5. Appropriate next steps based on current performance level

Be constructive, specific, and educational in your feedback.`,
      })

      let jsonText = text.trim()
      if (jsonText.startsWith("```json")) {
        jsonText = jsonText.replace(/^```json\s*/, "").replace(/\s*```$/, "")
      } else if (jsonText.startsWith("```")) {
        jsonText = jsonText.replace(/^```\s*/, "").replace(/\s*```$/, "")
      }

      const insights = JSON.parse(jsonText)

      return {
        ...insights,
        comparisonToPeers: {
          percentile: this.calculatePercentile(metrics.averageGrade),
          averageGrade: metrics.averageGrade,
          peerAverageGrade: 82, // Simulated peer average
        },
      }
    } catch (error) {
      console.error("Error generating LLM insights:", error)

      // Fallback to basic analysis if LLM fails
      return this.generateBasicInsights(metrics, soapNotes)
    }
  }

  // Generate learning insights and recommendations (fallback)
  private generateBasicInsights(metrics: PerformanceMetrics, soapNotes: SOAPNote[]): LearningInsights {
    const insights: LearningInsights = {
      strengths: [],
      weaknesses: [],
      recommendations: [],
      nextSteps: [],
      comparisonToPeers: {
        percentile: this.calculatePercentile(metrics.averageGrade),
        averageGrade: metrics.averageGrade,
        peerAverageGrade: 82,
      },
    }

    // Basic analysis logic (existing hardcoded logic as fallback)
    if (metrics.averageGrade >= 85) {
      insights.strengths.push("Consistently high performance across cases")
    }
    if (metrics.averageInterventionsPerCase < 2) {
      insights.strengths.push("Excellent clinical reasoning with minimal interventions needed")
    }

    if (metrics.averageGrade < 75) {
      insights.weaknesses.push("Overall performance needs improvement")
    }
    if (metrics.averageInterventionsPerCase > 3) {
      insights.weaknesses.push("Frequent interventions suggest need for better clinical reasoning")
    }

    insights.recommendations.push("Continue practicing with current cases")
    insights.nextSteps.push("Review feedback from previous cases")

    return insights
  }

  // Get learning progress over time
  getLearningProgress(studentId: string): Array<{
    date: string
    grade: number
    interventions: number
    caseTitle: string
  }> {
    const conversations = conversationService.getStudentConversations(studentId)
    const soapNotes = soapService.getStudentSOAPNotes(studentId)

    return conversations
      .filter((c) => c.status === "completed")
      .map((conv) => {
        const soap = soapNotes.find((s) => s.conversationId === conv.id)
        return {
          date: conv.completedAt || conv.startedAt,
          grade: soap?.grade || 0,
          interventions: conv.interventionCount,
          caseTitle: `Case ${conv.caseId}`,
        }
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }

  private calculateSkillAreas(soapNotes: SOAPNote[]): PerformanceMetrics["skillAreas"] {
    // In a real app, this would analyze detailed grading data
    // For now, we'll simulate based on overall grades
    const avgGrade = soapNotes.length > 0 ? soapNotes.reduce((sum, s) => sum + (s.grade || 0), 0) / soapNotes.length : 0

    return {
      subjective: Math.round(avgGrade + (Math.random() - 0.5) * 10),
      objective: Math.round(avgGrade + (Math.random() - 0.5) * 10),
      assessment: Math.round(avgGrade + (Math.random() - 0.5) * 10),
      plan: Math.round(avgGrade + (Math.random() - 0.5) * 10),
    }
  }

  private getRecentActivity(
    conversations: Conversation[],
    soapNotes: SOAPNote[],
  ): PerformanceMetrics["recentActivity"] {
    return conversations
      .filter((c) => c.status === "completed")
      .slice(-5) // Last 5 cases
      .map((conv) => {
        const soap = soapNotes.find((s) => s.conversationId === conv.id)
        return {
          date: conv.completedAt || conv.startedAt,
          caseTitle: `Case ${conv.caseId}`,
          grade: soap?.grade || 0,
          interventions: conv.interventionCount,
        }
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }

  private calculateImprovementTrend(soapNotes: SOAPNote[]): number {
    if (soapNotes.length < 2) return 0

    const sortedNotes = soapNotes
      .filter((s) => s.grade !== undefined)
      .sort((a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime())

    if (sortedNotes.length < 2) return 0

    const recentGrades = sortedNotes.slice(-3).map((s) => s.grade!)
    const earlierGrades = sortedNotes.slice(0, 3).map((s) => s.grade!)

    const recentAvg = recentGrades.reduce((sum, g) => sum + g, 0) / recentGrades.length
    const earlierAvg = earlierGrades.reduce((sum, g) => sum + g, 0) / earlierGrades.length

    return Math.round(((recentAvg - earlierAvg) / earlierAvg) * 100)
  }

  // Save analytics data (for caching)
  saveAnalytics(studentId: string, data: any): void {
    if (typeof window === "undefined") return

    const analytics = this.getStoredAnalytics()
    analytics[studentId] = {
      ...data,
      lastUpdated: new Date().toISOString(),
    }

    localStorage.setItem(this.storageKey, JSON.stringify(analytics))
  }

  private getStoredAnalytics(): Record<string, any> {
    if (typeof window === "undefined") return {}

    const stored = localStorage.getItem(this.storageKey)
    if (!stored) return {}

    try {
      return JSON.parse(stored)
    } catch {
      return {}
    }
  }

  // Calculate percentile ranking
  private calculatePercentile(grade: number): number {
    // Simulate percentile based on grade (in real app, this would use actual peer data)
    if (grade >= 90) return Math.floor(Math.random() * 10) + 90 // 90-99th percentile
    if (grade >= 80) return Math.floor(Math.random() * 20) + 70 // 70-89th percentile
    if (grade >= 70) return Math.floor(Math.random() * 30) + 40 // 40-69th percentile
    return Math.floor(Math.random() * 40) + 1 // 1-39th percentile
  }
}

export const analyticsService = new AnalyticsService()
