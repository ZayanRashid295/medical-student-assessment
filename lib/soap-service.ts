import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import type { SOAPNote, Conversation, MedicalCase } from "./data-models"

export interface SOAPGrading {
  overallGrade: number
  subjectiveGrade: number
  objectiveGrade: number
  assessmentGrade: number
  planGrade: number
  feedback: {
    subjective: string[]
    objective: string[]
    assessment: string[]
    plan: string[]
    overall: string[]
  }
  strengths: string[]
  improvements: string[]
}

class SOAPService {
  private storageKey = "medical-app-soap-notes"

  // Generate AI SOAP note based on conversation and case
  async generateAISOAPNote(conversation: Conversation, medicalCase: MedicalCase): Promise<SOAPNote["aiGeneratedSOAP"]> {
    try {
      // Check for API key
      if (!process.env.OPENAI_API_KEY) {
        throw new Error("OpenAI API key is missing. Please add OPENAI_API_KEY to your environment variables.")
      }

      const { disease, patientProfile } = medicalCase

      // Build conversation context
      const conversationContext = conversation.messages.map((msg) => `${msg.role}: ${msg.content}`).join("\n")

      const { text } = await generateText({
        model: openai("gpt-4o-mini"),
        prompt: `You are an expert physician writing a comprehensive SOAP note based on a medical student's conversation with a patient.

PATIENT INFORMATION:
- Name: ${patientProfile.name}
- Age: ${patientProfile.age}
- Gender: ${patientProfile.gender}
- Occupation: ${patientProfile.occupation}
- Diagnosed Condition: ${disease}

CONVERSATION TRANSCRIPT:
${conversationContext}

Based on this conversation and the patient's condition (${disease}), write a detailed, professional SOAP note. 

IMPORTANT: Return ONLY valid JSON with this exact structure. Do not include any markdown formatting, explanations, or additional text:

{
  "subjective": "Detailed subjective section with chief complaint, history of present illness, past medical history, medications, allergies, social history, and family history based on the conversation",
  "objective": "Comprehensive objective section with vital signs, physical examination findings, and relevant diagnostic studies that would be expected for this condition",
  "assessment": "Clinical assessment with primary diagnosis, differential diagnoses, and clinical reasoning based on the conversation and condition",
  "plan": "Detailed treatment plan including immediate interventions, medications, monitoring, patient education, and follow-up care"
}

Make sure all string values are properly escaped and the JSON is valid. Base the subjective section on what was actually discussed in the conversation, and include realistic objective findings and appropriate medical management for this condition.`,
      })

      let cleanedText = text.trim()

      // Remove markdown code blocks if present
      if (cleanedText.startsWith("```json")) {
        cleanedText = cleanedText.replace(/^```json\s*/, "").replace(/\s*```$/, "")
      } else if (cleanedText.startsWith("```")) {
        cleanedText = cleanedText.replace(/^```\s*/, "").replace(/\s*```$/, "")
      }

      // Additional cleaning for common JSON issues
      cleanedText = cleanedText
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, "") // Remove control characters
        .replace(/\n/g, "\\n") // Escape newlines in strings
        .replace(/\r/g, "\\r") // Escape carriage returns
        .replace(/\t/g, "\\t") // Escape tabs
        .trim()

      // Try to parse JSON with better error handling
      let aiSOAP
      try {
        aiSOAP = JSON.parse(cleanedText)
      } catch (parseError) {
        console.error("JSON parsing failed, attempting to fix common issues:", parseError)
        console.error("Problematic JSON:", cleanedText.substring(0, 500) + "...")

        // Try to fix common JSON issues
        const fixedText = cleanedText
          .replace(/,(\s*[}\]])/g, "$1") // Remove trailing commas
          .replace(/([{,]\s*)(\w+):/g, '$1"$2":') // Add quotes to unquoted keys
          .replace(/:\s*([^",{[\]}\s][^",{[\]}\n]*?)(\s*[,}\]])/g, ': "$1"$2') // Quote unquoted string values

        try {
          aiSOAP = JSON.parse(fixedText)
        } catch (secondParseError) {
          console.error("Second JSON parsing attempt failed:", secondParseError)
          throw new Error(`Failed to parse AI response as JSON: ${secondParseError.message}`)
        }
      }

      // Validate the structure
      if (!aiSOAP || typeof aiSOAP !== "object") {
        throw new Error("AI response is not a valid object")
      }

      return {
        subjective: aiSOAP.subjective || "Subjective information not provided",
        objective: aiSOAP.objective || "Objective findings not provided",
        assessment: aiSOAP.assessment || "Assessment not provided",
        plan: aiSOAP.plan || "Plan not provided",
      }
    } catch (error) {
      console.error("Error generating AI SOAP note:", error)

      // Fallback to basic SOAP note structure
      return {
        subjective: `${medicalCase.patientProfile.name} presents with symptoms consistent with ${medicalCase.disease}. Detailed history should be obtained based on the conversation.`,
        objective:
          "Physical examination findings and vital signs should be documented. Relevant diagnostic studies should be ordered based on clinical presentation.",
        assessment: `Clinical impression: ${medicalCase.disease}. Differential diagnoses should be considered based on presentation.`,
        plan: "Appropriate treatment plan should be developed including medications, monitoring, and follow-up care.",
      }
    }
  }

  // Grade student SOAP note against AI-generated version
  async gradeSOAPNote(
    studentSOAP: Omit<SOAPNote, "id" | "submittedAt" | "grade" | "feedback">,
    aiSOAP: SOAPNote["aiGeneratedSOAP"],
  ): Promise<SOAPGrading> {
    try {
      const { text } = await generateText({
        model: openai("gpt-4o-mini"),
        prompt: `You are an expert medical educator evaluating a student's SOAP note. Compare the student's SOAP note with the reference AI-generated SOAP note and provide detailed grading and feedback.

REFERENCE AI SOAP NOTE:
Subjective: ${aiSOAP.subjective}
Objective: ${aiSOAP.objective}
Assessment: ${aiSOAP.assessment}
Plan: ${aiSOAP.plan}

STUDENT SOAP NOTE:
Subjective: ${studentSOAP.subjective}
Objective: ${studentSOAP.objective}
Assessment: ${studentSOAP.assessment}
Plan: ${studentSOAP.plan}

IMPORTANT: Return ONLY valid JSON with this exact structure. Do not include any markdown formatting or additional text:

{
  "subjectiveGrade": 85,
  "objectiveGrade": 90,
  "assessmentGrade": 80,
  "planGrade": 88,
  "feedback": {
    "subjective": ["specific feedback point 1", "specific feedback point 2"],
    "objective": ["specific feedback point 1", "specific feedback point 2"],
    "assessment": ["specific feedback point 1", "specific feedback point 2"],
    "plan": ["specific feedback point 1", "specific feedback point 2"],
    "overall": ["overall feedback point 1", "overall feedback point 2"]
  },
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "improvements": ["improvement area 1", "improvement area 2", "improvement area 3"]
}

Provide constructive, specific feedback that helps the student improve their clinical documentation skills.`,
      })

      let cleanedText = text.trim()

      // Remove markdown code blocks if present
      if (cleanedText.startsWith("```json")) {
        cleanedText = cleanedText.replace(/^```json\s*/, "").replace(/\s*```$/, "")
      } else if (cleanedText.startsWith("```")) {
        cleanedText = cleanedText.replace(/^```\s*/, "").replace(/\s*```$/, "")
      }

      // Additional cleaning for common JSON issues
      cleanedText = cleanedText
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, "") // Remove control characters
        .replace(/\n/g, "\\n") // Escape newlines in strings
        .replace(/\r/g, "\\r") // Escape carriage returns
        .replace(/\t/g, "\\t") // Escape tabs
        .trim()

      let gradingResult
      try {
        gradingResult = JSON.parse(cleanedText)
      } catch (parseError) {
        console.error("Grading JSON parsing failed:", parseError)
        console.error("Problematic JSON:", cleanedText.substring(0, 500) + "...")
        throw new Error(`Failed to parse grading response as JSON: ${parseError.message}`)
      }

      // Calculate overall grade
      const overallGrade = Math.round(
        (gradingResult.subjectiveGrade +
          gradingResult.objectiveGrade +
          gradingResult.assessmentGrade +
          gradingResult.planGrade) /
          4,
      )

      return {
        overallGrade,
        subjectiveGrade: gradingResult.subjectiveGrade,
        objectiveGrade: gradingResult.objectiveGrade,
        assessmentGrade: gradingResult.assessmentGrade,
        planGrade: gradingResult.planGrade,
        feedback: gradingResult.feedback,
        strengths: gradingResult.strengths,
        improvements: gradingResult.improvements,
      }
    } catch (error) {
      console.error("Error grading SOAP note with LLM:", error)

      // Fallback to basic grading if LLM fails
      return this.fallbackGrading(studentSOAP, aiSOAP)
    }
  }

  // Save SOAP note
  saveSOAPNote(soapNote: SOAPNote): void {
    const soapNotes = this.getStoredSOAPNotes()
    const existingIndex = soapNotes.findIndex((s) => s.id === soapNote.id)

    if (existingIndex !== -1) {
      soapNotes[existingIndex] = soapNote
    } else {
      soapNotes.push(soapNote)
    }

    this.setStoredSOAPNotes(soapNotes)
  }

  // Get SOAP note by conversation ID
  getSOAPNoteByConversation(conversationId: string): SOAPNote | null {
    const soapNotes = this.getStoredSOAPNotes()
    return soapNotes.find((s) => s.conversationId === conversationId) || null
  }

  // Get all SOAP notes for a student
  getStudentSOAPNotes(studentId: string): SOAPNote[] {
    const soapNotes = this.getStoredSOAPNotes()
    return soapNotes.filter((s) => s.studentId === studentId)
  }

  private gradeSection(content: string, section: string): number {
    if (!content || content.trim().length < 10) return 0

    // Basic grading based on content length and key terms
    let score = Math.min(content.length / 10, 50) // Base score from length

    // Add points for medical terminology and structure
    const medicalTerms = ["patient", "history", "symptoms", "examination", "diagnosis", "treatment", "plan"]
    const termCount = medicalTerms.filter((term) => content.toLowerCase().includes(term)).length
    score += termCount * 5

    // Section-specific scoring
    if (section === "subjective" && content.toLowerCase().includes("chief complaint")) score += 10
    if (section === "objective" && content.toLowerCase().includes("vital signs")) score += 10
    if (section === "assessment" && content.toLowerCase().includes("diagnosis")) score += 10
    if (section === "plan" && content.toLowerCase().includes("treatment")) score += 10

    return Math.min(Math.round(score), 100)
  }

  private generateSectionFeedback(content: string, section: string): string[] {
    const feedback: string[] = []

    if (!content || content.trim().length < 10) {
      feedback.push(`${section.charAt(0).toUpperCase() + section.slice(1)} section needs more detail.`)
      return feedback
    }

    switch (section) {
      case "subjective":
        if (!content.toLowerCase().includes("chief complaint")) {
          feedback.push("Consider including the chief complaint more clearly.")
        }
        if (!content.toLowerCase().includes("history")) {
          feedback.push("Include relevant medical and social history.")
        }
        break
      case "objective":
        if (!content.toLowerCase().includes("vital signs")) {
          feedback.push("Include vital signs and physical examination findings.")
        }
        if (!content.toLowerCase().includes("examination")) {
          feedback.push("Describe physical examination findings in more detail.")
        }
        break
      case "assessment":
        if (!content.toLowerCase().includes("diagnosis")) {
          feedback.push("Provide a clear clinical impression or diagnosis.")
        }
        if (!content.toLowerCase().includes("differential")) {
          feedback.push("Consider including differential diagnoses.")
        }
        break
      case "plan":
        if (!content.toLowerCase().includes("treatment")) {
          feedback.push("Include specific treatment interventions.")
        }
        if (!content.toLowerCase().includes("follow")) {
          feedback.push("Consider adding follow-up plans.")
        }
        break
    }

    if (feedback.length === 0) {
      feedback.push(`Good work on the ${section} section.`)
    }

    return feedback
  }

  private generateOverallFeedback(grade: number): string[] {
    if (grade >= 90) {
      return ["Excellent SOAP note with comprehensive documentation.", "Shows strong clinical reasoning skills."]
    } else if (grade >= 80) {
      return ["Good SOAP note with solid clinical documentation.", "Minor areas for improvement identified."]
    } else if (grade >= 70) {
      return ["Adequate SOAP note but needs improvement in several areas.", "Focus on more detailed documentation."]
    } else {
      return [
        "SOAP note needs significant improvement.",
        "Review SOAP note format and clinical documentation standards.",
      ]
    }
  }

  private identifyStrengths(grading: SOAPGrading): string[] {
    const strengths: string[] = []

    if (grading.subjectiveGrade >= 80) strengths.push("Strong subjective documentation")
    if (grading.objectiveGrade >= 80) strengths.push("Good objective findings documentation")
    if (grading.assessmentGrade >= 80) strengths.push("Clear clinical assessment")
    if (grading.planGrade >= 80) strengths.push("Comprehensive treatment plan")

    if (strengths.length === 0) {
      strengths.push("Shows effort in clinical documentation")
    }

    return strengths
  }

  private identifyImprovements(grading: SOAPGrading): string[] {
    const improvements: string[] = []

    if (grading.subjectiveGrade < 70) improvements.push("Improve subjective history taking and documentation")
    if (grading.objectiveGrade < 70) improvements.push("Include more detailed physical examination findings")
    if (grading.assessmentGrade < 70) improvements.push("Strengthen clinical reasoning and diagnostic skills")
    if (grading.planGrade < 70) improvements.push("Develop more comprehensive treatment plans")

    return improvements
  }

  private getStoredSOAPNotes(): SOAPNote[] {
    if (typeof window === "undefined") return []

    const stored = localStorage.getItem(this.storageKey)
    if (!stored) return []

    try {
      return JSON.parse(stored)
    } catch {
      return []
    }
  }

  private setStoredSOAPNotes(soapNotes: SOAPNote[]): void {
    if (typeof window === "undefined") return
    localStorage.setItem(this.storageKey, JSON.stringify(soapNotes))
  }

  // Fallback grading method for error cases
  private fallbackGrading(
    studentSOAP: Omit<SOAPNote, "id" | "submittedAt" | "grade" | "feedback">,
    aiSOAP: SOAPNote["aiGeneratedSOAP"],
  ): SOAPGrading {
    const grading: SOAPGrading = {
      overallGrade: 0,
      subjectiveGrade: this.gradeSection(studentSOAP.subjective, "subjective"),
      objectiveGrade: this.gradeSection(studentSOAP.objective, "objective"),
      assessmentGrade: this.gradeSection(studentSOAP.assessment, "assessment"),
      planGrade: this.gradeSection(studentSOAP.plan, "plan"),
      feedback: {
        subjective: this.generateSectionFeedback(studentSOAP.subjective, "subjective"),
        objective: this.generateSectionFeedback(studentSOAP.objective, "objective"),
        assessment: this.generateSectionFeedback(studentSOAP.assessment, "assessment"),
        plan: this.generateSectionFeedback(studentSOAP.plan, "plan"),
        overall: [],
      },
      strengths: [],
      improvements: [],
    }

    grading.overallGrade = Math.round(
      (grading.subjectiveGrade + grading.objectiveGrade + grading.assessmentGrade + grading.planGrade) / 4,
    )

    grading.feedback.overall = this.generateOverallFeedback(grading.overallGrade)
    grading.strengths = this.identifyStrengths(grading)
    grading.improvements = this.identifyImprovements(grading)

    return grading
  }
}

export const soapService = new SOAPService()
