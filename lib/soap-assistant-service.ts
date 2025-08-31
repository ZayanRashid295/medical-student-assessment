import { generateText } from "ai"
import type { MedicalCase, Conversation } from "./data-models"

import { createOpenAI } from "@ai-sdk/openai"

const openai = createOpenAI({ apiKey: "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" })
//import { openai } from "@ai-sdk/openai"

export interface SOAPSuggestion {
  section: "subjective" | "objective" | "assessment" | "plan"
  suggestion: string
  confidence: number
  reasoning: string
}

export interface MedicalTermSuggestion {
  term: string
  definition: string
  category: string
  relevance: number
}

export interface RealTimeFeedback {
  section: "subjective" | "objective" | "assessment" | "plan"
  feedback: string
  severity: "info" | "warning" | "error"
  suggestion?: string
}

class SOAPAssistantService {
  private checkAPIKey(): void {
    
  }

  // Generate SOAP section suggestions based on conversation and current content
  async generateSOAPSuggestions(
    section: "subjective" | "objective" | "assessment" | "plan",
    currentContent: string,
    conversation: Conversation,
    medicalCase: MedicalCase,
  ): Promise<SOAPSuggestion[]> {
    this.checkAPIKey()

    const conversationContext = conversation.messages.map((msg) => `${msg.role}: ${msg.content}`).join("\n")

    try {
      const { text } = await generateText({
        model: openai("gpt-4o-mini"),
        system: `You are an expert medical educator helping a student write a SOAP note for a patient with ${medicalCase.disease}.

Patient Profile:
- Name: ${medicalCase.patientProfile.name}
- Age: ${medicalCase.patientProfile.age}
- Gender: ${medicalCase.patientProfile.gender}
- Occupation: ${medicalCase.patientProfile.occupation}
- Condition: ${medicalCase.disease}

Conversation with patient:
${conversationContext}

Current ${section} content: "${currentContent}"

Provide 2-3 specific suggestions to improve or complete the ${section} section. Focus on what's missing or could be enhanced based on the conversation.

Return a JSON array with this structure:
[
  {
    "suggestion": "specific suggestion text",
    "confidence": 0.9,
    "reasoning": "why this suggestion is important"
  }
]`,
        prompt: `Based on the conversation and current ${section} content, what specific suggestions would help improve this SOAP note section?`,
      })

      let cleanedText = text.trim()
      if (cleanedText.startsWith("```json")) {
        cleanedText = cleanedText.replace(/^```json\s*/, "").replace(/\s*```$/, "")
      } else if (cleanedText.startsWith("```")) {
        cleanedText = cleanedText.replace(/^```\s*/, "").replace(/\s*```$/, "")
      }

      const suggestions = JSON.parse(cleanedText)
      return suggestions.map((s: any) => ({
        section,
        suggestion: s.suggestion,
        confidence: s.confidence || 0.8,
        reasoning: s.reasoning,
      }))
    } catch (error) {
      console.error("Error generating SOAP suggestions:", error)
      return []
    }
  }

  // Get medical term auto-completion suggestions
  async getMedicalTermSuggestions(
    partialTerm: string,
    context: string,
    medicalCase: MedicalCase,
  ): Promise<MedicalTermSuggestion[]> {
    this.checkAPIKey()

    if (partialTerm.length < 2) return []

    try {
      const { text } = await generateText({
        model: openai("gpt-4o-mini"),
        system: `You are a medical terminology assistant. Given a partial medical term and context, suggest relevant medical terms that could complete it.

Patient condition: ${medicalCase.disease}
Context: "${context}"
Partial term: "${partialTerm}"

Return a JSON array of relevant medical terms:
[
  {
    "term": "complete medical term",
    "definition": "brief definition",
    "category": "category (symptom, diagnosis, treatment, etc.)",
    "relevance": 0.9
  }
]

Limit to 5 most relevant suggestions.`,
        prompt: `What medical terms starting with or containing "${partialTerm}" would be relevant in this context for a patient with ${medicalCase.disease}?`,
      })

      let cleanedText = text.trim()
      if (cleanedText.startsWith("```json")) {
        cleanedText = cleanedText.replace(/^```json\s*/, "").replace(/\s*```$/, "")
      } else if (cleanedText.startsWith("```")) {
        cleanedText = cleanedText.replace(/^```\s*/, "").replace(/\s*```$/, "")
      }

      return JSON.parse(cleanedText)
    } catch (error) {
      console.error("Error getting medical term suggestions:", error)
      return []
    }
  }

  // Provide real-time feedback on SOAP sections
  async getRealTimeFeedback(
    section: "subjective" | "objective" | "assessment" | "plan",
    content: string,
    conversation: Conversation,
    medicalCase: MedicalCase,
  ): Promise<RealTimeFeedback[]> {
    this.checkAPIKey()

    if (!content.trim()) return []

    const conversationContext = conversation.messages.map((msg) => `${msg.role}: ${msg.content}`).join("\n")

    try {
      const { text } = await generateText({
        model: openai("gpt-4o-mini"),
        system: `You are an expert medical educator providing real-time feedback on a student's SOAP note section.

Patient condition: ${medicalCase.disease}
Section: ${section}
Content: "${content}"

Conversation context:
${conversationContext}

Analyze the ${section} section and provide specific feedback. Look for:
- Missing key information that should be included
- Incorrect or inappropriate content
- Areas that need more detail or clarification
- Good practices to acknowledge

Return a JSON array:
[
  {
    "feedback": "specific feedback message",
    "severity": "info|warning|error",
    "suggestion": "optional specific suggestion"
  }
]

Severity levels:
- "error": Critical missing information or major errors
- "warning": Important information missing or minor issues
- "info": Suggestions for improvement or positive feedback`,
        prompt: `Analyze this ${section} section and provide constructive real-time feedback for a student learning to write SOAP notes.`,
      })

      let cleanedText = text.trim()
      if (cleanedText.startsWith("```json")) {
        cleanedText = cleanedText.replace(/^```json\s*/, "").replace(/\s*```$/, "")
      } else if (cleanedText.startsWith("```")) {
        cleanedText = cleanedText.replace(/^```\s*/, "").replace(/\s*```$/, "")
      }

      const feedback = JSON.parse(cleanedText)
      return feedback.map((f: any) => ({
        section,
        feedback: f.feedback,
        severity: f.severity || "info",
        suggestion: f.suggestion,
      }))
    } catch (error) {
      console.error("Error getting real-time feedback:", error)
      return []
    }
  }

  // Generate a draft for a specific SOAP section
  async generateSectionDraft(
    section: "subjective" | "objective" | "assessment" | "plan",
    conversation: Conversation,
    medicalCase: MedicalCase,
  ): Promise<string> {
    this.checkAPIKey()

    const conversationContext = conversation.messages.map((msg) => `${msg.role}: ${msg.content}`).join("\n")

    try {
      const { text } = await generateText({
        model: openai("gpt-4o-mini"),
        system: `You are an expert physician helping a medical student write a SOAP note section.

Patient: ${medicalCase.patientProfile.name}, ${medicalCase.patientProfile.age}-year-old ${medicalCase.patientProfile.gender}
Condition: ${medicalCase.disease}

Conversation:
${conversationContext}

Write a draft ${section} section based on the conversation. Make it educational and comprehensive but appropriate for a student learning exercise.`,
        prompt: `Write a draft ${section} section for this SOAP note based on the conversation with the patient.`,
      })

      return text.trim()
    } catch (error) {
      console.error("Error generating section draft:", error)
      return `Draft ${section} section could not be generated. Please write based on your conversation with the patient.`
    }
  }
}

export const soapAssistantService = new SOAPAssistantService()
