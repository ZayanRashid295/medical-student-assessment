"use client"

import { useState, useMemo } from "react"
import { useAuth } from "@/hooks/use-auth"
import { analyticsService } from "@/lib/analytics-service"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { sampleCases, type MedicalCase } from "@/lib/data-models"
import { CaseDetailModal } from "@/components/case-detail-modal"
import { CaseFilters } from "@/components/case-filters"
import { AnalyticsDashboard } from "@/components/analytics-dashboard"
import { LogOut, User, BookOpen, TrendingUp, Clock, Target } from "lucide-react"

export function StudentDashboard() {
  const { user, logout } = useAuth()
  const [selectedCase, setSelectedCase] = useState<MedicalCase | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [difficultyFilter, setDifficultyFilter] = useState("all")
  const [specialtyFilter, setSpecialtyFilter] = useState("all")

  // Get real-time analytics
  const metrics = user ? analyticsService.calculatePerformanceMetrics(user.id) : null

  // Filter cases based on search and filters
  const filteredCases = useMemo(() => {
    return sampleCases.filter((medicalCase) => {
      const matchesSearch =
        medicalCase.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        medicalCase.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        medicalCase.disease.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesDifficulty = difficultyFilter === "all" || medicalCase.difficulty === difficultyFilter

      // For now, we'll map diseases to specialties (in a real app, this would be in the data model)
      const specialty = getSpecialtyFromDisease(medicalCase.disease)
      const matchesSpecialty = specialtyFilter === "all" || specialty === specialtyFilter

      return matchesSearch && matchesDifficulty && matchesSpecialty
    })
  }, [searchTerm, difficultyFilter, specialtyFilter])

  const handleCaseClick = (medicalCase: MedicalCase) => {
    setSelectedCase(medicalCase)
    setIsModalOpen(true)
  }

  const handleStartCase = (caseId: string) => {
    window.location.href = `/case/${caseId}`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">Medical Assessment Platform</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-700">{user?.name}</span>
              </div>
              <Button variant="outline" size="sm" onClick={logout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome back, {user?.name}!</h2>
          <p className="text-gray-600">Practice your diagnostic skills with AI-powered patient simulations.</p>
        </div>

        <Tabs defaultValue="cases" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="cases">Cases & Practice</TabsTrigger>
            <TabsTrigger value="analytics">Analytics & Progress</TabsTrigger>
          </TabsList>

          <TabsContent value="cases" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Cases Completed</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics?.completedCases || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {metrics?.totalCases ? `of ${metrics.totalCases} started` : "Start your first case"}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Average Grade</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics?.averageGrade ? `${metrics.averageGrade}%` : "--"}</div>
                  <p className="text-xs text-muted-foreground">
                    {metrics?.improvementTrend
                      ? `${metrics.improvementTrend > 0 ? "+" : ""}${metrics.improvementTrend}% trend`
                      : "Complete cases to see grades"}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Interventions</CardTitle>
                  <User className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics?.totalInterventions || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {metrics?.averageInterventionsPerCase
                      ? `${metrics.averageInterventionsPerCase} avg per case`
                      : "Doctor interventions"}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Time Spent</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics?.timeSpent || 0}m</div>
                  <p className="text-xs text-muted-foreground">Learning time</p>
                </CardContent>
              </Card>
            </div>

            <CaseFilters
              onSearchChange={setSearchTerm}
              onDifficultyChange={setDifficultyFilter}
              onSpecialtyChange={setSpecialtyFilter}
            />

            {/* Available Cases */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Available Cases ({filteredCases.length})</h3>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Target className="h-4 w-4" />
                  <span>Click on a case to view details</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCases.map((medicalCase) => (
                  <Card
                    key={medicalCase.id}
                    className="hover:shadow-lg transition-all duration-200 cursor-pointer border-l-4 border-l-blue-600"
                    onClick={() => handleCaseClick(medicalCase)}
                  >
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg hover:text-blue-600 transition-colors">
                          {medicalCase.title}
                        </CardTitle>
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
                      <CardDescription className="line-clamp-2">{medicalCase.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-1">Patient Profile:</p>
                          <p className="text-sm text-gray-600">
                            {medicalCase.patientProfile.name}, {medicalCase.patientProfile.age} years old,{" "}
                            {medicalCase.patientProfile.gender}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">Key Symptoms:</p>
                          <div className="flex flex-wrap gap-1">
                            {medicalCase.symptoms.slice(0, 3).map((symptom, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {symptom}
                              </Badge>
                            ))}
                            {medicalCase.symptoms.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{medicalCase.symptoms.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="pt-2 space-y-2">
                          <Button className="w-full" size="sm">
                            View Details & Start Practice
                          </Button>
                          <Button
                            variant="outline"
                            className="w-full bg-transparent"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              window.location.href = `/learn/${medicalCase.id}`
                            }}
                          >
                            <BookOpen className="h-4 w-4 mr-2" />
                            Learning Mode
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {filteredCases.length === 0 && (
                <div className="text-center py-12">
                  <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No cases found</h3>
                  <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="analytics">
            <AnalyticsDashboard />
          </TabsContent>
        </Tabs>
      </main>

      <CaseDetailModal
        medicalCase={selectedCase}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onStartCase={handleStartCase}
      />
    </div>
  )
}

function getSpecialtyFromDisease(disease: string): string {
  const specialtyMap: Record<string, string> = {
    "Myocardial Infarction": "cardiology",
    Appendicitis: "gastroenterology",
    Pneumonia: "internal",
    Stroke: "emergency",
  }
  return specialtyMap[disease] || "internal"
}
