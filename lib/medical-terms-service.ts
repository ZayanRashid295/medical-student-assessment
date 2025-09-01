// Medical terminology database and search service
export interface MedicalTerm {
  term: string
  definition: string
  category: "symptom" | "diagnosis" | "treatment" | "anatomy" | "procedure" | "medication" | "test"
  synonyms: string[]
  relatedTerms: string[]
}

class MedicalTermsService {
  private terms: MedicalTerm[] = [
    // Cardiovascular terms
    {
      term: "myocardial infarction",
      definition: "Death of heart muscle due to insufficient blood supply, commonly known as a heart attack",
      category: "diagnosis",
      synonyms: ["heart attack", "MI", "acute MI"],
      relatedTerms: ["chest pain", "angina", "coronary artery disease", "ST elevation"],
    },
    {
      term: "chest pain",
      definition: "Discomfort or pain felt in the chest area, can be cardiac or non-cardiac in origin",
      category: "symptom",
      synonyms: ["chest discomfort", "thoracic pain"],
      relatedTerms: ["angina", "myocardial infarction", "pleuritic pain"],
    },
    {
      term: "dyspnea",
      definition: "Difficulty breathing or shortness of breath",
      category: "symptom",
      synonyms: ["shortness of breath", "SOB", "breathlessness"],
      relatedTerms: ["orthopnea", "paroxysmal nocturnal dyspnea", "tachypnea"],
    },
    {
      term: "diaphoresis",
      definition: "Excessive sweating, often associated with medical conditions",
      category: "symptom",
      synonyms: ["sweating", "perspiration"],
      relatedTerms: ["hyperhidrosis", "night sweats"],
    },

    // Gastrointestinal terms
    {
      term: "appendicitis",
      definition: "Inflammation of the appendix, typically requiring surgical removal",
      category: "diagnosis",
      synonyms: ["acute appendicitis"],
      relatedTerms: ["abdominal pain", "McBurney's point", "appendectomy"],
    },
    {
      term: "abdominal pain",
      definition: "Pain felt in the abdomen, can be acute or chronic with various causes",
      category: "symptom",
      synonyms: ["stomach pain", "belly pain"],
      relatedTerms: ["peritonitis", "appendicitis", "gastritis"],
    },
    {
      term: "nausea",
      definition: "Feeling of sickness with an inclination to vomit",
      category: "symptom",
      synonyms: ["queasiness", "sick feeling"],
      relatedTerms: ["vomiting", "emesis", "antiemetic"],
    },
    {
      term: "vomiting",
      definition: "Forceful expulsion of stomach contents through the mouth",
      category: "symptom",
      synonyms: ["emesis", "throwing up"],
      relatedTerms: ["nausea", "hematemesis", "projectile vomiting"],
    },

    // Respiratory terms
    {
      term: "pneumonia",
      definition: "Infection that inflames air sacs in one or both lungs",
      category: "diagnosis",
      synonyms: ["lung infection"],
      relatedTerms: ["cough", "fever", "dyspnea", "chest X-ray"],
    },
    {
      term: "cough",
      definition: "Sudden expulsion of air from the lungs to clear irritants",
      category: "symptom",
      synonyms: ["tussis"],
      relatedTerms: ["productive cough", "dry cough", "hemoptysis"],
    },
    {
      term: "fever",
      definition: "Elevated body temperature above normal range",
      category: "symptom",
      synonyms: ["pyrexia", "hyperthermia"],
      relatedTerms: ["chills", "rigors", "antipyretic"],
    },

    // Physical examination terms
    {
      term: "auscultation",
      definition: "Listening to internal body sounds using a stethoscope",
      category: "procedure",
      synonyms: ["listening"],
      relatedTerms: ["stethoscope", "heart sounds", "lung sounds"],
    },
    {
      term: "palpation",
      definition: "Physical examination technique using hands to feel body structures",
      category: "procedure",
      synonyms: ["feeling", "touching"],
      relatedTerms: ["tenderness", "mass", "pulse"],
    },
    {
      term: "percussion",
      definition: "Tapping on body surface to assess underlying structures",
      category: "procedure",
      synonyms: ["tapping"],
      relatedTerms: ["dullness", "resonance", "tympany"],
    },

    // Vital signs
    {
      term: "hypertension",
      definition: "High blood pressure, consistently elevated above normal limits",
      category: "diagnosis",
      synonyms: ["high blood pressure", "HTN"],
      relatedTerms: ["systolic", "diastolic", "antihypertensive"],
    },
    {
      term: "tachycardia",
      definition: "Rapid heart rate, typically over 100 beats per minute",
      category: "symptom",
      synonyms: ["fast heart rate"],
      relatedTerms: ["palpitations", "arrhythmia", "bradycardia"],
    },
    {
      term: "bradycardia",
      definition: "Slow heart rate, typically under 60 beats per minute",
      category: "symptom",
      synonyms: ["slow heart rate"],
      relatedTerms: ["tachycardia", "heart block", "pacemaker"],
    },
  ]

  // Search for medical terms based on partial input
  searchTerms(query: string, limit = 5): MedicalTerm[] {
    if (!query || query.length < 2) return []

    const lowerQuery = query.toLowerCase()

    // Find exact matches first
    const exactMatches = this.terms.filter(
      (term) =>
        term.term.toLowerCase().startsWith(lowerQuery) ||
        term.synonyms.some((synonym) => synonym.toLowerCase().startsWith(lowerQuery)),
    )

    // Find partial matches
    const partialMatches = this.terms.filter(
      (term) =>
        !exactMatches.includes(term) &&
        (term.term.toLowerCase().includes(lowerQuery) ||
          term.synonyms.some((synonym) => synonym.toLowerCase().includes(lowerQuery)) ||
          term.definition.toLowerCase().includes(lowerQuery)),
    )

    return [...exactMatches, ...partialMatches].slice(0, limit)
  }

  // Get terms by category
  getTermsByCategory(category: MedicalTerm["category"]): MedicalTerm[] {
    return this.terms.filter((term) => term.category === category)
  }

  // Get related terms
  getRelatedTerms(termName: string): MedicalTerm[] {
    const term = this.terms.find((t) => t.term.toLowerCase() === termName.toLowerCase())
    if (!term) return []

    return this.terms.filter((t) =>
      term.relatedTerms.some(
        (related) =>
          t.term.toLowerCase().includes(related.toLowerCase()) ||
          t.synonyms.some((synonym) => synonym.toLowerCase().includes(related.toLowerCase())),
      ),
    )
  }

  // Add new term (for extensibility)
  addTerm(term: MedicalTerm): void {
    this.terms.push(term)
  }
}

export const medicalTermsService = new MedicalTermsService()
