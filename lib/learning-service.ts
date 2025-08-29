import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import type { ConversationContext } from "./ai-service"

export interface LearningConversationMessage {
  role: "doctor" | "patient" | "student"
  content: string
  explanation?: string
  timestamp: string
}

export interface LearningSOAPNote {
  subjective: string
  subjectiveExplanation: string
  objective: string
  objectiveExplanation: string
  assessment: string
  assessmentExplanation: string
  plan: string
  planExplanation: string
}

export interface LearningSession {
  id: string
  caseId: string
  disease: string
  patientProfile: {
    name: string
    age: number
    gender: string
    occupation: string
  }
  conversation: LearningConversationMessage[]
  soapNote?: LearningSOAPNote
  isComplete: boolean
  createdAt: string
}

class LearningService {
  private checkAPIKey(): void {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OpenAI API key is missing. Please add OPENAI_API_KEY to your .env.local file.")
    }
  }

  async generateDoctorQuestion(
    context: ConversationContext,
    conversationHistory: LearningConversationMessage[],
  ): Promise<{ question: string; explanation: string }> {
    this.checkAPIKey()

    const { disease, symptoms, patientProfile } = context
    const conversationContext = conversationHistory.map((msg) => `${msg.role}: ${msg.content}`).join("\n")

    try {
      const { text } = await generateText({
        model: openai("gpt-4o-mini"),
        system: `You are an experienced doctor conducting a patient interview for educational purposes. The patient has ${disease}.

Patient Profile:
- Name: ${patientProfile.name}
- Age: ${patientProfile.age}
- Gender: ${patientProfile.gender}
- Occupation: ${patientProfile.occupation}
- Known symptoms: ${symptoms.join(", ")}

Your task is to ask the next logical question to gather information for diagnosis. After each question, provide an educational explanation for students about why you asked that specific question.

Format your response as:
QUESTION: [Your question to the patient]
EXPLANATION: [Educational explanation for students about why this question is important for diagnosing ${disease}]

Previous conversation:
${conversationContext}`,
        prompt: `Based on the conversation so far, what is the next most important question to ask this patient with suspected ${disease}? Include your educational explanation.`,
      })

      const lines = text.split("\n")
      const questionLine = lines.find((line) => line.startsWith("QUESTION:"))
      const explanationLine = lines.find((line) => line.startsWith("EXPLANATION:"))

      const question = questionLine?.replace("QUESTION:", "").trim() || text.split("EXPLANATION:")[0].trim()
      const explanation =
        explanationLine?.replace("EXPLANATION:", "").trim() ||
        `This question helps gather important diagnostic information for ${disease}.`

      return { question, explanation }
    } catch (error) {
      console.error("Error generating doctor question:", error)
      return {
        question: "Can you tell me more about when your symptoms started?",
        explanation: "Understanding the timeline of symptoms is crucial for differential diagnosis.",
      }
    }
  }

  async generatePatientResponse(doctorQuestion: string, context: ConversationContext): Promise<string> {
    this.checkAPIKey()

    const { disease, symptoms, patientProfile } = context

    try {
      const { text } = await generateText({
        model: openai("gpt-4o-mini"),
        system: `You are a patient with ${disease}. Your profile:
- Name: ${patientProfile.name}
- Age: ${patientProfile.age}
- Gender: ${patientProfile.gender}
- Occupation: ${patientProfile.occupation}
- Current symptoms: ${symptoms.join(", ")}

Respond to the doctor's questions naturally and realistically. Provide information that a patient with ${disease} would know. Be descriptive about symptoms, express appropriate concern, and share relevant details about your condition.`,
        prompt: `The doctor asks: "${doctorQuestion}"

Respond as the patient with ${disease}.`,
      })

      return text
    } catch (error) {
      console.error("Error generating patient response:", error)
      return "I'm not feeling well, doctor. Could you please be more specific about what you'd like to know?"
    }
  }

  async shouldEndConversation(
    conversationHistory: LearningConversationMessage[],
    disease: string,
  ): Promise<{ shouldEnd: boolean; reason: string }> {
    this.checkAPIKey()

    const conversationContext = conversationHistory.map((msg) => `${msg.role}: ${msg.content}`).join("\n")

    try {
      const { text } = await generateText({
        model: openai("gpt-4o-mini"),
        system: `You are an experienced doctor evaluating whether you have gathered enough information to diagnose ${disease}.

Review the conversation and determine if you have sufficient information for:
1. Patient's chief complaint and history of present illness
2. Relevant past medical history
3. Key symptoms and their characteristics
4. Any necessary review of systems

Respond with either:
- "CONTINUE: [reason to continue]" if more information is needed
- "END: [reason to end]" if sufficient information has been gathered`,
        prompt: `Review this conversation about a patient with ${disease}:

${conversationContext}

Do you have enough information to proceed with diagnosis and treatment planning?`,
      })

      const shouldEnd = text.startsWith("END:")
      const reason = text.replace(/^(CONTINUE:|END:)\s*/, "")

      return { shouldEnd, reason }
    } catch (error) {
      console.error("Error evaluating conversation completion:", error)
      // Default to continuing if there are fewer than 6 exchanges
      const doctorQuestions = conversationHistory.filter((msg) => msg.role === "doctor").length
      return {
        shouldEnd: doctorQuestions >= 6,
        reason: doctorQuestions >= 6 ? "Sufficient information gathered" : "Continue gathering information",
      }
    }
  }

  async generateEducationalSOAPNote(
    conversationHistory: LearningConversationMessage[],
    context: ConversationContext,
  ): Promise<LearningSOAPNote> {
    this.checkAPIKey()

    const { disease, patientProfile } = context
    const conversationContext = conversationHistory.map((msg) => `${msg.role}: ${msg.content}`).join("\n")

    try {
      const { text } = await generateText({
        model: openai("gpt-4o-mini"),
        system: `You are an experienced doctor writing an educational SOAP note for ${disease}. Based on the patient conversation, create a comprehensive SOAP note with detailed explanations for each section to help medical students learn.

Format your response as:
SUBJECTIVE: [subjective findings]
SUBJECTIVE_EXPLANATION: [educational explanation of what subjective data is and why these findings are important]

OBJECTIVE: [objective findings - note that this is a simulated case, so include typical objective findings for ${disease}]
OBJECTIVE_EXPLANATION: [educational explanation of objective data and why these findings support the diagnosis]

ASSESSMENT: [assessment and diagnosis]
ASSESSMENT_EXPLANATION: [educational explanation of the diagnostic reasoning and differential diagnosis process]

PLAN: [treatment plan]
PLAN_EXPLANATION: [educational explanation of the treatment rationale and considerations]

Patient: ${patientProfile.name}, ${patientProfile.age}-year-old ${patientProfile.gender}
Conversation:
${conversationContext}`,
        prompt: `Create an educational SOAP note with explanations for this ${disease} case.`,
      })

      // Parse the response
      const sections = text.split("\n\n")
      const getSection = (prefix: string) => {
        const section = sections.find((s) => s.startsWith(prefix))
        return section?.replace(prefix, "").trim() || ""
      }

      return {
        subjective: getSection("SUBJECTIVE:"),
        subjectiveExplanation: getSection("SUBJECTIVE_EXPLANATION:"),
        objective: getSection("OBJECTIVE:"),
        objectiveExplanation: getSection("OBJECTIVE_EXPLANATION:"),
        assessment: getSection("ASSESSMENT:"),
        assessmentExplanation: getSection("ASSESSMENT_EXPLANATION:"),
        plan: getSection("PLAN:"),
        planExplanation: getSection("PLAN_EXPLANATION:"),
      }
    } catch (error) {
      console.error("Error generating educational SOAP note:", error)
      return {
        subjective: `Patient presents with symptoms consistent with ${disease}.`,
        subjectiveExplanation: "Subjective data includes the patient's reported symptoms and history.",
        objective: "Physical examination and vital signs would be documented here.",
        objectiveExplanation: "Objective data includes measurable findings from examination and tests.",
        assessment: `Working diagnosis: ${disease}`,
        assessmentExplanation: "Assessment includes the diagnostic reasoning and differential diagnosis.",
        plan: "Treatment plan based on diagnosis and patient factors.",
        planExplanation: "Plan outlines the therapeutic approach and follow-up care.",
      }
    }
  }

  async answerStudentQuestion(
    studentQuestion: string,
    context: ConversationContext,
    conversationHistory: LearningConversationMessage[],
  ): Promise<string> {
    this.checkAPIKey()

    const { disease } = context
    const conversationContext = conversationHistory.map((msg) => `${msg.role}: ${msg.content}`).join("\n")

    try {
      const { text } = await generateText({
        model: openai("gpt-4o-mini"),
        system: `You are an experienced medical educator and doctor. A medical student is observing a patient consultation for ${disease} and has asked you a question.

Provide a clear, educational response that helps the student understand:
1. The medical concepts involved
2. The clinical reasoning
3. How this relates to the diagnosis and treatment of ${disease}

Be encouraging and educational in your response.

Current conversation context:
${conversationContext}`,
        prompt: `The student asks: "${studentQuestion}"

Provide an educational response about this ${disease} case.`,
      })

      return text
    } catch (error) {
      console.error("Error answering student question:", error)
      return "That's a great question! In clinical practice, we always consider multiple factors when making diagnostic and treatment decisions. Keep observing and asking questions - that's how you learn!"
    }
  }

  // Local storage methods for learning sessions
  saveLearningSession(session: LearningSession): void {
    const sessions = this.getLearningSessionsForUser()
    const existingIndex = sessions.findIndex((s) => s.id === session.id)

    if (existingIndex >= 0) {
      sessions[existingIndex] = session
    } else {
      sessions.push(session)
    }

    localStorage.setItem("learning_sessions", JSON.stringify(sessions))
  }

  getLearningSessionsForUser(): LearningSession[] {
    const sessions = localStorage.getItem("learning_sessions")
    return sessions ? JSON.parse(sessions) : []
  }

  getLearningSession(sessionId: string): LearningSession | null {
    const sessions = this.getLearningSessionsForUser()
    return sessions.find((s) => s.id === sessionId) || null
  }
}

export const learningService = new LearningService()
