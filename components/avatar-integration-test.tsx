"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react"

interface TestResult {
  step: string
  status: "pending" | "success" | "error"
  message: string
  details?: any
}

export function AvatarIntegrationTest() {
  const [apiKey, setApiKey] = useState("")
  const [patientAvatarId, setPatientAvatarId] = useState("")
  const [doctorAvatarId, setDoctorAvatarId] = useState("")
  const [isRunning, setIsRunning] = useState(false)
  const [testResults, setTestResults] = useState<TestResult[]>([])

  const addTestResult = (result: TestResult) => {
    setTestResults((prev) => {
      const existing = prev.find((r) => r.step === result.step)
      if (existing) {
        return prev.map((r) => (r.step === result.step ? result : r))
      }
      return [...prev, result]
    })
  }

  const runIntegrationTest = async () => {
    if (!apiKey || !patientAvatarId || !doctorAvatarId) {
      alert("Please fill in all fields before running the test")
      return
    }

    setIsRunning(true)
    setTestResults([])

    // Test 1: API Connection
    addTestResult({ step: "API Connection", status: "pending", message: "Testing HeyGen API connection..." })

    try {
      const connectionResponse = await fetch("/api/heygen/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey }),
      })

      const connectionData = await connectionResponse.json()

      if (connectionData.success) {
        addTestResult({
          step: "API Connection",
          status: "success",
          message: "API connection successful",
          details: connectionData.details,
        })
      } else {
        addTestResult({
          step: "API Connection",
          status: "error",
          message: connectionData.error || "API connection failed",
        })
        setIsRunning(false)
        return
      }
    } catch (error) {
      addTestResult({
        step: "API Connection",
        status: "error",
        message: error instanceof Error ? error.message : "Connection test failed",
      })
      setIsRunning(false)
      return
    }

    // Test 2: Patient Avatar Session Creation
    addTestResult({
      step: "Patient Avatar Session",
      status: "pending",
      message: "Creating patient avatar session...",
    })

    try {
      const patientSessionResponse = await fetch("/api/heygen/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey,
          avatarId: patientAvatarId,
          role: "patient",
        }),
      })

      const patientSessionData = await patientSessionResponse.json()

      if (patientSessionData.success) {
        addTestResult({
          step: "Patient Avatar Session",
          status: "success",
          message: `Patient session created: ${patientSessionData.sessionId}`,
          details: patientSessionData,
        })
      } else {
        addTestResult({
          step: "Patient Avatar Session",
          status: "error",
          message: patientSessionData.error || "Failed to create patient session",
        })
      }
    } catch (error) {
      addTestResult({
        step: "Patient Avatar Session",
        status: "error",
        message: error instanceof Error ? error.message : "Patient session creation failed",
      })
    }

    // Test 3: Doctor Avatar Session Creation
    addTestResult({
      step: "Doctor Avatar Session",
      status: "pending",
      message: "Creating doctor avatar session...",
    })

    try {
      const doctorSessionResponse = await fetch("/api/heygen/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey,
          avatarId: doctorAvatarId,
          role: "doctor",
        }),
      })

      const doctorSessionData = await doctorSessionResponse.json()

      if (doctorSessionData.success) {
        addTestResult({
          step: "Doctor Avatar Session",
          status: "success",
          message: `Doctor session created: ${doctorSessionData.sessionId}`,
          details: doctorSessionData,
        })
      } else {
        addTestResult({
          step: "Doctor Avatar Session",
          status: "error",
          message: doctorSessionData.error || "Failed to create doctor session",
        })
      }
    } catch (error) {
      addTestResult({
        step: "Doctor Avatar Session",
        status: "error",
        message: error instanceof Error ? error.message : "Doctor session creation failed",
      })
    }

    setIsRunning(false)
  }

  const getStatusIcon = (status: TestResult["status"]) => {
    switch (status) {
      case "pending":
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: TestResult["status"]) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">Running</Badge>
      case "success":
        return <Badge variant="default">Success</Badge>
      case "error":
        return <Badge variant="destructive">Failed</Badge>
      default:
        return <Badge variant="outline">Pending</Badge>
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>HeyGen Avatar Integration Test</CardTitle>
        <p className="text-sm text-gray-600">
          Test the secure server-side HeyGen integration to verify everything is working properly.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Configuration Form */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="testApiKey">HeyGen API Key</Label>
            <Input
              id="testApiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your HeyGen API key"
              disabled={isRunning}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="testPatientAvatar">Patient Avatar ID</Label>
            <Input
              id="testPatientAvatar"
              value={patientAvatarId}
              onChange={(e) => setPatientAvatarId(e.target.value)}
              placeholder="Enter patient avatar ID"
              disabled={isRunning}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="testDoctorAvatar">Doctor Avatar ID</Label>
            <Input
              id="testDoctorAvatar"
              value={doctorAvatarId}
              onChange={(e) => setDoctorAvatarId(e.target.value)}
              placeholder="Enter doctor avatar ID"
              disabled={isRunning}
            />
          </div>

          <Button onClick={runIntegrationTest} disabled={isRunning || !apiKey || !patientAvatarId || !doctorAvatarId}>
            {isRunning ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Running Tests...
              </>
            ) : (
              "Run Integration Test"
            )}
          </Button>
        </div>

        {/* Test Results */}
        {testResults.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Test Results</h3>
            <div className="space-y-3">
              {testResults.map((result, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 border rounded-lg">
                  <div className="flex-shrink-0 mt-0.5">{getStatusIcon(result.status)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium">{result.step}</h4>
                      {getStatusBadge(result.status)}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{result.message}</p>
                    {result.details && (
                      <details className="mt-2">
                        <summary className="text-xs text-gray-500 cursor-pointer">Show details</summary>
                        <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto">
                          {JSON.stringify(result.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Security Notice */}
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-start space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-green-800">Security Improvements</h4>
              <p className="text-sm text-green-700 mt-1">
                The HeyGen API key is now processed securely on the server-side and never exposed to the client. All
                avatar operations go through secure API endpoints.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
