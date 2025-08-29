"use client"

import { useParams } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { CaseChat } from "@/components/case-chat"
import { sampleCases } from "@/lib/data-models"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function CasePage() {
  const params = useParams()
  const { user, isAuthenticated } = useAuth()
  const caseId = params.id as string

  const medicalCase = sampleCases.find((c) => c.id === caseId)

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please log in to access this case.</CardDescription>
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

  if (!medicalCase) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Case Not Found</CardTitle>
            <CardDescription>The requested case could not be found.</CardDescription>
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

  return <CaseChat medicalCase={medicalCase} student={user!} />
}
