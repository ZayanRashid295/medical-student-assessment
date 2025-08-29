export interface MedicalCase {
  id: string
  title: string
  description: string
  difficulty: "beginner" | "intermediate" | "advanced"
  disease: string
  symptoms: string[]
  expectedQuestions: string[]
  patientProfile: {
    name: string
    age: number
    gender: string
    occupation: string
  }
  createdAt: string
}

export interface ChatMessage {
  id: string
  role: "student" | "patient" | "doctor"
  content: string
  timestamp: string
  isIntervention?: boolean
  relevanceScore?: number
}

export interface Conversation {
  id: string
  studentId: string
  caseId: string
  messages: ChatMessage[]
  status: "active" | "completed" | "abandoned"
  startedAt: string
  completedAt?: string
  interventionCount: number
}

export interface ConversationContext {
  caseId: string
  disease: string
  symptoms: string[]
  patientProfile: {
    name: string
    age: number
    gender: string
    occupation: string
  }
  conversationHistory: Array<{
    role: "student" | "patient" | "doctor"
    content: string
    timestamp: string
  }>
}

export interface SOAPNote {
  id: string
  conversationId: string
  studentId: string
  subjective: string
  objective: string
  assessment: string
  plan: string
  submittedAt: string
  grade?: number
  feedback?: string
  aiGeneratedSOAP?: {
    subjective: string
    objective: string
    assessment: string
    plan: string
  }
}

export interface StudentProgress {
  studentId: string
  casesCompleted: number
  averageGrade: number
  totalInterventions: number
  strengths: string[]
  areasForImprovement: string[]
  lastActivity: string
}

// Sample medical cases
export const sampleCases: MedicalCase[] = [
  {
    id: "1",
    title: "Chest Pain Case",
    description: "A 45-year-old patient presents with acute chest pain",
    difficulty: "intermediate",
    disease: "Myocardial Infarction",
    symptoms: ["chest pain", "shortness of breath", "sweating", "nausea"],
    expectedQuestions: [
      "When did the pain start?",
      "Can you describe the pain?",
      "Do you have any medical history?",
      "Are you taking any medications?",
      "Do you smoke or drink alcohol?",
    ],
    patientProfile: {
      name: "John Smith",
      age: 45,
      gender: "Male",
      occupation: "Office worker",
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: "2",
    title: "Abdominal Pain Case",
    description: "A 28-year-old patient with severe abdominal pain",
    difficulty: "beginner",
    disease: "Appendicitis",
    symptoms: ["abdominal pain", "fever", "nausea", "vomiting"],
    expectedQuestions: [
      "Where exactly is the pain?",
      "When did it start?",
      "Have you had fever?",
      "Any nausea or vomiting?",
      "Any previous surgeries?",
    ],
    patientProfile: {
      name: "Sarah Johnson",
      age: 28,
      gender: "Female",
      occupation: "Teacher",
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: "3",
    title: "Respiratory Symptoms",
    description: "A 65-year-old patient with breathing difficulties",
    difficulty: "advanced",
    disease: "Pneumonia",
    symptoms: ["cough", "fever", "shortness of breath", "chest pain"],
    expectedQuestions: [
      "How long have you had the cough?",
      "Any sputum production?",
      "Do you have fever?",
      "Any recent travel?",
      "Do you smoke?",
    ],
    patientProfile: {
      name: "Robert Wilson",
      age: 65,
      gender: "Male",
      occupation: "Retired",
    },
    createdAt: new Date().toISOString(),
  },
]
