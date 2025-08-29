"use client"
import type { MedicalCase } from "@/lib/data-models"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { User, Target, CheckCircle } from "lucide-react"

interface CaseDetailModalProps {
  medicalCase: MedicalCase | null
  isOpen: boolean
  onClose: () => void
  onStartCase: (caseId: string) => void
}

export function CaseDetailModal({ medicalCase, isOpen, onClose, onStartCase }: CaseDetailModalProps) {
  if (!medicalCase) return null

  const handleStartCase = () => {
    onStartCase(medicalCase.id)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-start">
            <DialogTitle className="text-xl">{medicalCase.title}</DialogTitle>
            <Badge
              variant={
                medicalCase.difficulty === "beginner"
                  ? "secondary"
                  : medicalCase.difficulty === "intermediate"
                    ? "default"
                    : "destructive"
              }
            >
              {medicalCase.difficulty}
            </Badge>
          </div>
          <DialogDescription className="text-base">{medicalCase.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Patient Profile */}
          <div>
            <h3 className="flex items-center text-lg font-semibold mb-3">
              <User className="h-5 w-5 mr-2 text-blue-600" />
              Patient Profile
            </h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-medium">Name:</span> {medicalCase.patientProfile.name}
                </div>
                <div>
                  <span className="font-medium">Age:</span> {medicalCase.patientProfile.age} years
                </div>
                <div>
                  <span className="font-medium">Gender:</span> {medicalCase.patientProfile.gender}
                </div>
                <div>
                  <span className="font-medium">Occupation:</span> {medicalCase.patientProfile.occupation}
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Presenting Symptoms */}
          <div>
            <h3 className="flex items-center text-lg font-semibold mb-3">
              <Target className="h-5 w-5 mr-2 text-red-600" />
              Presenting Symptoms
            </h3>
            <div className="flex flex-wrap gap-2">
              {medicalCase.symptoms.map((symptom, index) => (
                <Badge key={index} variant="outline" className="text-sm">
                  {symptom}
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          {/* Learning Objectives */}
          <div>
            <h3 className="flex items-center text-lg font-semibold mb-3">
              <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
              Key Areas to Explore
            </h3>
            <ul className="space-y-2">
              {medicalCase.expectedQuestions.map((question, index) => (
                <li key={index} className="flex items-start">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{question}</span>
                </li>
              ))}
            </ul>
          </div>

          <Separator />

          {/* Case Info */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">What to Expect:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• You'll interact with an AI patient who will respond based on their condition</li>
              <li>• An AI doctor will monitor your questions and provide guidance when needed</li>
              <li>• Ask relevant questions to gather information for your diagnosis</li>
              <li>• After the conversation, you'll write a SOAP note for evaluation</li>
            </ul>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleStartCase} className="bg-blue-600 hover:bg-blue-700">
            Start Case
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
