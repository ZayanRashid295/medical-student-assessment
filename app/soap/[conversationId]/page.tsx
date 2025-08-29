"use client"

import { useParams } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { SOAPNoteEditor } from "@/components/soap-note-editor"
import { conversationService } from "@/lib/conversation-service"
import { sampleCases } from "@/lib/data-models"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

export default function SOAPNotePage() {
  const params = useParams()
  const { user, isAuthenticated } = useAuth()
  const conversationId = params.conversationId as string
  const [conversation, setConversation] = useState<any>(null)
  const [medicalCase, setMedicalCase] = useState<any>(null)

  useEffect(() => {
    if (conversationId) {
      const conv = conversationService.getConversation(conversationId)
      setConversation(conv)

      if (conv) {
        const case_ = sampleCases.find((c) => c.id === conv.caseId)
        setMedicalCase(case_)
      }
    }
  }, [conversationId])

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please log in to access this SOAP note editor.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/">
              <Button>Go to Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!conversation || !medicalCase) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Conversation Not Found</CardTitle>
            <CardDescription>The requested conversation could not be found.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <SOAPNoteEditor conversation={conversation} medicalCase={medicalCase} student={user!} />
}
