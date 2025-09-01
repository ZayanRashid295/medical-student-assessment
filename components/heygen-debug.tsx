// components/heygen-debug.tsx

"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react"

export function HeyGenDebug() {
  const [apiKey, setApiKey] = useState("")
  const [avatarId, setAvatarId] = useState("")
  const [isTesting, setIsTestng] = useState(false)
  const [testResults, setTestResults] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const testHeyGenConnection = async () => {
    if (!apiKey.trim()) {
      setError("Please enter your HeyGen API key")
      return
    }

    setIsTestng(true)
    setError(null)
    setTestResults(null)

    try {
      // Test 1: Basic API connection
      console.log("Testing HeyGen API connection...")
      
      const listResponse = await fetch('https://api.heygen.com/v1/streaming.list', {
        method: 'GET',
        headers: {
          'X-Api-Key': apiKey.trim(),
          'Content-Type': 'application/json',
        },
      })

      console.log("List response status:", listResponse.status)

      if (!listResponse.ok) {
        const errorText = await listResponse.text()
        console.error("List error:", errorText)
        throw new Error(`API Connection Failed: ${listResponse.status} - ${errorText}`)
      }

      const listData = await listResponse.json()
      console.log("List response data:", listData)

      // Test 2: Create token (if avatar ID provided)
      let tokenResult = null
      if (avatarId.trim()) {
        console.log("Testing avatar session creation...")
        
        const tokenResponse = await fetch('https://api.heygen.com/v1/streaming.create_token', {
          method: 'POST',
          headers: {
            'X-Api-Key': apiKey.trim(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            avatar_id: avatarId.trim(),
          }),
        })

        console.log("Token response status:", tokenResponse.status)

        if (!tokenResponse.ok) {
          const errorText = await tokenResponse.text()
          console.error("Token error:", errorText)
          tokenResult = {
            success: false,
            error: `${tokenResponse.status} - ${errorText}`,
          }
        } else {
          const tokenData = await tokenResponse.json()
          console.log("Token response data:", tokenData)
          
          tokenResult = {
            success: tokenData.code === 100,
            data: tokenData,
            error: tokenData.code !== 100 ? tokenData.message : null,
          }
        }
      }

      setTestResults({
        apiConnection: {
          success: true,
          data: listData,
        },
        avatarTest: tokenResult,
      })

    } catch (error) {
      console.error("Test error:", error)
      setError(error instanceof Error ? error.message : "Unknown error")
    } finally {
      setIsTestng(false)
    }
  }

  const validateAvatarId = (id: string) => {
    // Basic validation - HeyGen avatar IDs are typically UUIDs or specific formats
    const trimmed = id.trim()
    if (trimmed.length === 0) return "Avatar ID cannot be empty"
    if (trimmed.length < 10) return "Avatar ID seems too short"
    if (!/^[a-zA-Z0-9\-_]+$/.test(trimmed)) return "Avatar ID contains invalid characters"
    return null
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>HeyGen API Debug Tool</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="apiKey">HeyGen API Key</Label>
            <Input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your HeyGen API key"
            />
          </div>

          <div>
            <Label htmlFor="avatarId">Avatar ID (Optional)</Label>
            <Input
              id="avatarId"
              value={avatarId}
              onChange={(e) => setAvatarId(e.target.value)}
              placeholder="Enter avatar ID to test"
            />
            {avatarId && validateAvatarId(avatarId) && (
              <p className="text-sm text-red-600 mt-1">{validateAvatarId(avatarId)}</p>
            )}
          </div>

          <Button 
            onClick={testHeyGenConnection} 
            disabled={isTestng || !apiKey.trim()}
            className="w-full"
          >
            {isTestng ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Testing Connection...
              </>
            ) : (
              "Test HeyGen Connection"
            )}
          </Button>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                <h3 className="font-medium text-red-800">Error</h3>
              </div>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
          )}

          {testResults && (
            <div className="space-y-4">
              {/* API Connection Test */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  {testResults.apiConnection.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                  )}
                  <h3 className="font-medium">API Connection Test</h3>
                  <Badge 
                    variant={testResults.apiConnection.success ? "default" : "destructive"}
                    className="ml-2"
                  >
                    {testResults.apiConnection.success ? "Success" : "Failed"}
                  </Badge>
                </div>
                {testResults.apiConnection.success && (
                  <div className="text-sm text-gray-600">
                    <p>✅ API key is valid and working</p>
                    <p>✅ Can access HeyGen streaming endpoints</p>
                  </div>
                )}
              </div>

              {/* Avatar Test */}
              {testResults.avatarTest && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    {testResults.avatarTest.success ? (
                      <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                    )}
                    <h3 className="font-medium">Avatar Session Test</h3>
                    <Badge 
                      variant={testResults.avatarTest.success ? "default" : "destructive"}
                      className="ml-2"
                    >
                      {testResults.avatarTest.success ? "Success" : "Failed"}
                    </Badge>
                  </div>
                  {testResults.avatarTest.success ? (
                    <div className="text-sm text-gray-600">
                      <p>✅ Avatar ID is valid</p>
                      <p>✅ Can create avatar sessions</p>
                      <p className="mt-2">Session ID: {testResults.avatarTest.data?.data?.session_id}</p>
                    </div>
                  ) : (
                    <div className="text-sm text-red-600">
                      <p>❌ {testResults.avatarTest.error}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Recommendations */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-medium text-blue-800 mb-2">Recommendations:</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  {!testResults.apiConnection.success && (
                    <li>• Check your HeyGen API key - it should start with your account identifier</li>
                  )}
                  {testResults.avatarTest && !testResults.avatarTest.success && (
                    <>
                      <li>• Verify your avatar ID in the HeyGen dashboard</li>
                      <li>• Make sure the avatar is published and available</li>
                      <li>• Check if your account has streaming permissions</li>
                    </>
                  )}
                  {testResults.apiConnection.success && !avatarId && (
                    <li>• Enter an avatar ID to test avatar session creation</li>
                  )}
                </ul>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}