import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import type { ConversationContext } from "@/lib/data-models"

interface SuggestedQuestion {
  id: string
  question: string
  category: string
  importance: "high" | "medium" | "low"
  rationale: string
}

export async function POST(request: NextRequest) {
  let context: ConversationContext
  
  try {
    const body = await request.json()
    context = body.context
  } catch (error) {
    console.error("Error parsing request:", error)
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  try {
    if (!process.env.OPENAI_API_KEY) {
      // Return fallback questions if no API key
      const fallbackQuestions = generateFallbackQuestions(context.disease)
      return NextResponse.json({ questions: fallbackQuestions })
    }

    const conversationHistory = context.conversationHistory
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join("\n")

    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      system: `You are an experienced medical educator helping a medical student conduct a patient interview for a case of ${context.disease}. 

Based on the patient profile and conversation history, suggest 5 relevant questions that the student should ask to gather important diagnostic information.

Patient Information:
- Name: ${context.patientProfile.name}
- Age: ${context.patientProfile.age}
- Gender: ${context.patientProfile.gender}
- Occupation: ${context.patientProfile.occupation}
- Condition: ${context.disease}
- Known symptoms: ${context.symptoms.join(", ")}

Conversation so far:
${conversationHistory}

For each question, provide:
1. The exact question to ask
2. Category (History, Physical Examination, Assessment, Symptoms, Social History, Family History, Medications, etc.)
3. Importance level (high, medium, low)
4. Brief rationale for why this question is important

Format your response as a JSON array with this structure:
[
  {
    "id": "1",
    "question": "Question text here",
    "category": "Category name",
    "importance": "high|medium|low",
    "rationale": "Brief explanation of why this question is important"
  }
]

Focus on questions that:
- Haven't been asked yet in the conversation
- Are medically relevant to ${context.disease}
- Follow logical interview flow (history before examination)
- Help narrow down differential diagnosis
- Are appropriate for the patient's age and gender`,
      prompt: `Generate 5 suggested questions for this medical case. Ensure they are clinically relevant, haven't been covered in the conversation, and follow proper medical interview structure.`,
    })

    try {
      // Clean the AI response by removing markdown code block syntax if present
      let cleanText = text.trim()
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '')
      } else if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```$/, '')
      }
      
      // Try to parse the AI response as JSON
      const questions = JSON.parse(cleanText) as SuggestedQuestion[]
      
      // Validate the structure
      const validatedQuestions = questions.map((q, index) => ({
        id: q.id || (index + 1).toString(),
        question: q.question || "Could you tell me more about your symptoms?",
        category: q.category || "General",
        importance: (q.importance && ["high", "medium", "low"].includes(q.importance)) 
          ? q.importance as "high" | "medium" | "low"
          : "medium",
        rationale: q.rationale || "This question helps gather important clinical information"
      }))

      return NextResponse.json({ questions: validatedQuestions.slice(0, 5) })
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError)
      // Fallback to generated questions if AI response isn't properly formatted
      const fallbackQuestions = generateFallbackQuestions(context.disease)
      return NextResponse.json({ questions: fallbackQuestions })
    }

  } catch (error) {
    console.error("Error generating suggested questions:", error)
    
    // Return fallback questions on error
    const fallbackQuestions = generateFallbackQuestions(context.disease)
    return NextResponse.json({ questions: fallbackQuestions })
  }
}

function generateFallbackQuestions(disease: string): SuggestedQuestion[] {
  const baseQuestions: SuggestedQuestion[] = [
    {
      id: "1",
      question: "When did you first notice these symptoms?",
      category: "History",
      importance: "high",
      rationale: "Understanding symptom onset helps determine disease progression and potential triggers"
    },
    {
      id: "2", 
      question: "Can you describe the nature and intensity of your symptoms?",
      category: "Symptoms",
      importance: "high",
      rationale: "Detailed symptom characterization is essential for accurate diagnosis"
    },
    {
      id: "3",
      question: "Have you noticed anything that makes your symptoms better or worse?",
      category: "History",
      importance: "medium",
      rationale: "Identifying relieving and aggravating factors helps narrow differential diagnosis"
    },
    {
      id: "4",
      question: "Are you currently taking any medications or supplements?",
      category: "Medications",
      importance: "high",
      rationale: "Current medications can affect symptoms and influence treatment options"
    },
    {
      id: "5",
      question: "Do you have any family history of similar conditions?",
      category: "Family History", 
      importance: "medium",
      rationale: "Family history provides important genetic and hereditary risk factor information"
    }
  ]

  // Customize questions based on disease type
  if (disease.toLowerCase().includes("heart") || disease.toLowerCase().includes("cardiac")) {
    baseQuestions[1] = {
      id: "2",
      question: "Do you experience chest pain or shortness of breath?",
      category: "Symptoms",
      importance: "high",
      rationale: "Chest pain and dyspnea are cardinal symptoms of cardiac conditions"
    }
    baseQuestions[2] = {
      id: "3", 
      question: "Does the pain worsen with physical activity?",
      category: "History",
      importance: "high",
      rationale: "Exertional symptoms suggest cardiac etiology and help assess severity"
    }
  } else if (disease.toLowerCase().includes("lung") || disease.toLowerCase().includes("respiratory")) {
    baseQuestions[1] = {
      id: "2",
      question: "Are you experiencing any difficulty breathing or coughing?",
      category: "Symptoms", 
      importance: "high",
      rationale: "Respiratory symptoms are key indicators of pulmonary pathology"
    }
    baseQuestions[2] = {
      id: "3",
      question: "Do you have a history of smoking or exposure to environmental irritants?",
      category: "Social History",
      importance: "high", 
      rationale: "Smoking history and environmental exposures are major risk factors for lung disease"
    }
  } else if (disease.toLowerCase().includes("pain") || disease.toLowerCase().includes("abdominal")) {
    baseQuestions[1] = {
      id: "2",
      question: "Can you show me exactly where the pain is located?",
      category: "Physical Examination",
      importance: "high",
      rationale: "Pain location helps localize the source and narrow differential diagnosis"
    }
    baseQuestions[2] = {
      id: "3",
      question: "How would you rate your pain on a scale from 1 to 10?",
      category: "Assessment",
      importance: "high",
      rationale: "Pain severity assessment is crucial for treatment planning and monitoring"
    }
  }

  return baseQuestions
}
