import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import type { ConversationContext } from "./data-models"

export interface AIResponse {
  content: string
  confidence: number
  shouldIntervene?: boolean
  interventionReason?: string
}

class AIService {
  private checkAPIKey(): void {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error(
        "OpenAI API key is missing. Please add OPENAI_API_KEY to your environment variables in Project Settings.",
      )
    }
  }

  async generatePatientResponse(studentQuestion: string, context: ConversationContext): Promise<AIResponse> {
    this.checkAPIKey()

    const { disease, symptoms, patientProfile, conversationHistory } = context

    // Build conversation history for context
    const conversationContext = conversationHistory.map((msg) => `${msg.role}: ${msg.content}`).join("\n")

    try {
      const { text } = await generateText({
        model: openai("gpt-4o-mini"),
        system: `You are a patient with ${disease}. Your profile:
- Name: ${patientProfile.name}
- Age: ${patientProfile.age}
- Gender: ${patientProfile.gender}
- Occupation: ${patientProfile.occupation}
- Current symptoms: ${symptoms.join(", ")}

You are experiencing symptoms consistent with ${disease}. Respond to the medical student's questions as a real patient would - be descriptive about your symptoms, express appropriate concern, and provide relevant medical history when asked. Stay in character and only provide information that a patient with your condition would realistically know. If asked about something unrelated to your condition, gently redirect the conversation back to your symptoms.

Previous conversation:
${conversationContext}`,
        prompt: `The medical student asks: "${studentQuestion}"

Respond as the patient with ${disease}. Be realistic, descriptive, and stay in character.`,
      })

      return {
        content: text,
        confidence: 0.9,
      }
    } catch (error) {
      console.error("Error generating patient response:", error)
      if (error instanceof Error && error.message.includes("API key")) {
        return {
          content: "Please add your OpenAI API key in Project Settings to enable AI patient responses.",
          confidence: 0.1,
        }
      }
      // Fallback to a generic response if AI fails
      return {
        content: "I'm not feeling well, doctor. Could you ask me something specific about my symptoms?",
        confidence: 0.5,
      }
    }
  }

  async evaluateStudentQuestion(studentQuestion: string, context: ConversationContext): Promise<AIResponse> {
    this.checkAPIKey()

    const { disease, conversationHistory } = context

    const conversationContext = conversationHistory.map((msg) => `${msg.role}: ${msg.content}`).join("\n")

    try {
      const { text } = await generateText({
        model: openai("gpt-4o-mini"),
        system: `You are an experienced medical supervisor evaluating a medical student's question to a patient with ${disease}. 

Your job is to determine if the student's question is:
1. Relevant to the patient's condition and medical assessment. student can ask patients medical and famil history.
2. Appropriate for the clinical context
3. Helping to gather important diagnostic information

Respond with either:
- "APPROPRIATE: [brief positive feedback]" if the question is good
- "INTERVENE: [specific reason why the question is inappropriate or irrelevant]" if you need to intervene

Consider the conversation history and whether the question helps with diagnosis, symptom assessment, medical history, or treatment planning for ${disease}.

Previous conversation:
${conversationContext}`,
        prompt: `Evaluate this student question: "${studentQuestion}"

Is this question appropriate for a patient with ${disease}?`,
      })

      const shouldIntervene = text.startsWith("INTERVENE:")
      const content = text.replace(/^(APPROPRIATE:|INTERVENE:)\s*/, "")

      return {
        content,
        confidence: 0.9,
        shouldIntervene,
        interventionReason: shouldIntervene ? content : undefined,
      }
    } catch (error) {
      console.error("Error evaluating student question:", error)
      if (error instanceof Error && error.message.includes("API key")) {
        return {
          content: "Please add your OpenAI API key in Project Settings to enable AI supervision.",
          confidence: 0.1,
          shouldIntervene: true,
          interventionReason: "API key required for AI evaluation",
        }
      }
      // Fallback to basic evaluation
      const lowerQuestion = studentQuestion.toLowerCase()
      const irrelevantPatterns = ["weather", "sports", "politics", "favorite color", "hobbies"]
      const isIrrelevant = irrelevantPatterns.some((pattern) => lowerQuestion.includes(pattern))

      if (isIrrelevant) {
        return {
          content:
            "That question is not relevant to the medical consultation. Please focus on the patient's symptoms and medical history.",
          confidence: 0.8,
          shouldIntervene: true,
          interventionReason: "Question not relevant to medical assessment",
        }
      }

      return {
        content: "Continue with your assessment.",
        confidence: 0.7,
        shouldIntervene: false,
      }
    }
  }
}

export const aiService = new AIService()
