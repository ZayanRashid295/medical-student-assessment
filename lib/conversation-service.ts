import type { Conversation, ChatMessage, MedicalCase } from "./data-models"

class ConversationService {
  private storageKey = "medical-app-conversations"

  // Create a new conversation
  createConversation(studentId: string, medicalCase: MedicalCase): Conversation {
    const conversation: Conversation = {
      id: crypto.randomUUID(),
      studentId,
      caseId: medicalCase.id,
      messages: [
        {
          id: crypto.randomUUID(),
          role: "patient",
          content: `Hello doctor, I'm ${medicalCase.patientProfile.name}. ${this.getInitialPatientMessage(medicalCase)}`,
          timestamp: new Date().toISOString(),
        },
      ],
      status: "active",
      startedAt: new Date().toISOString(),
      interventionCount: 0,
    }

    this.saveConversation(conversation)
    return conversation
  }

  // Add a message to the conversation
  addMessage(conversationId: string, message: Omit<ChatMessage, "id" | "timestamp">): ChatMessage {
    const conversations = this.getStoredConversations()
    const conversationIndex = conversations.findIndex((c) => c.id === conversationId)

    if (conversationIndex === -1) {
      throw new Error("Conversation not found")
    }

    const newMessage: ChatMessage = {
      ...message,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    }

    conversations[conversationIndex].messages.push(newMessage)

    // Update intervention count if this is a doctor intervention
    if (message.role === "doctor" && message.isIntervention) {
      conversations[conversationIndex].interventionCount++
    }

    this.setStoredConversations(conversations)
    return newMessage
  }

  // Get conversation by ID
  getConversation(conversationId: string): Conversation | null {
    const conversations = this.getStoredConversations()
    return conversations.find((c) => c.id === conversationId) || null
  }

  // Complete a conversation
  completeConversation(conversationId: string): void {
    const conversations = this.getStoredConversations()
    const conversationIndex = conversations.findIndex((c) => c.id === conversationId)

    if (conversationIndex !== -1) {
      conversations[conversationIndex].status = "completed"
      conversations[conversationIndex].completedAt = new Date().toISOString()
      this.setStoredConversations(conversations)
    }
  }

  // Get all conversations for a student
  getStudentConversations(studentId: string): Conversation[] {
    const conversations = this.getStoredConversations()
    return conversations.filter((c) => c.studentId === studentId)
  }

  private getInitialPatientMessage(medicalCase: MedicalCase): string {
    if (medicalCase.disease === "Myocardial Infarction") {
      return "I'm having terrible chest pain. It started a couple hours ago and it's really scaring me."
    } else if (medicalCase.disease === "Appendicitis") {
      return "I've been having really bad stomach pain since yesterday. It's getting worse and I threw up this morning."
    }
    return "I'm not feeling well and I'm worried about my symptoms."
  }

  private saveConversation(conversation: Conversation): void {
    const conversations = this.getStoredConversations()
    const existingIndex = conversations.findIndex((c) => c.id === conversation.id)

    if (existingIndex !== -1) {
      conversations[existingIndex] = conversation
    } else {
      conversations.push(conversation)
    }

    this.setStoredConversations(conversations)
  }

  private getStoredConversations(): Conversation[] {
    if (typeof window === "undefined") return []

    const stored = localStorage.getItem(this.storageKey)
    if (!stored) return []

    try {
      return JSON.parse(stored)
    } catch {
      return []
    }
  }

  private setStoredConversations(conversations: Conversation[]): void {
    if (typeof window === "undefined") return
    localStorage.setItem(this.storageKey, JSON.stringify(conversations))
  }
}

export const conversationService = new ConversationService()
