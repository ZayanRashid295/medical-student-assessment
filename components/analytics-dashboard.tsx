"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { analyticsService, type PerformanceMetrics, type LearningInsights } from "@/lib/analytics-service"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  TrendingUp,
  TrendingDown,
  Target,
  Clock,
  Award,
  AlertTriangle,
  BookOpen,
  BarChart3,
  PieChart,
  Activity,
} from "lucide-react"

export function AnalyticsDashboard() {
  const { user } = useAuth()
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const [insights, setInsights] = useState<LearningInsights | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingInsights, setIsLoadingInsights] = useState(true)

  useEffect(() => {
    if (user) {
      const performanceMetrics = analyticsService.calculatePerformanceMetrics(user.id)
      setMetrics(performanceMetrics)
      setIsLoading(false)

      const loadInsights = async () => {
        try {
          setIsLoadingInsights(true)
          const learningInsights = await analyticsService.generateLearningInsights(user.id)
          setInsights(learningInsights)
        } catch (error) {
          console.error("Failed to load insights:", error)
          setInsights({
            strengths: [],
            weaknesses: [],
            recommendations: [],
            nextSteps: [],
            comparisonToPeers: {
              percentile: 50,
              averageGrade: performanceMetrics.averageGrade,
              peerAverageGrade: 82,
            },
          })
        } finally {
          setIsLoadingInsights(false)
        }
      }

      loadInsights()
    }
  }, [user])

  if (isLoading || !metrics) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const getGradeColor = (grade: number) => {
    if (grade >= 90) return "text-green-600"
    if (grade >= 80) return "text-blue-600"
    if (grade >= 70) return "text-yellow-600"
    return "text-red-600"
  }

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <TrendingUp className="h-4 w-4 text-green-600" />
    if (trend < 0) return <TrendingDown className="h-4 w-4 text-red-600" />
    return <Activity className="h-4 w-4 text-gray-600" />
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Learning Analytics</h2>
        <p className="text-gray-600">Track your progress and identify areas for improvement</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cases Completed</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.completedCases}</div>
                <p className="text-xs text-muted-foreground">of {metrics.totalCases} started</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Grade</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getGradeColor(metrics.averageGrade)}`}>
                  {metrics.averageGrade}%
                </div>
                <div className="flex items-center text-xs text-muted-foreground">
                  {getTrendIcon(metrics.improvementTrend)}
                  <span className="ml-1">
                    {metrics.improvementTrend > 0 ? "+" : ""}
                    {metrics.improvementTrend}% trend
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Interventions</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.totalInterventions}</div>
                <p className="text-xs text-muted-foreground">{metrics.averageInterventionsPerCase} avg per case</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Time Spent</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.timeSpent}m</div>
                <p className="text-xs text-muted-foreground">Learning time</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <PieChart className="h-5 w-5 mr-2" />
                Grade Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-sm">Excellent (90-100%)</span>
                  </div>
                  <span className="text-sm font-medium">{metrics.gradeDistribution.excellent}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                    <span className="text-sm">Good (80-89%)</span>
                  </div>
                  <span className="text-sm font-medium">{metrics.gradeDistribution.good}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                    <span className="text-sm">Satisfactory (70-79%)</span>
                  </div>
                  <span className="text-sm font-medium">{metrics.gradeDistribution.satisfactory}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                    <span className="text-sm">Needs Improvement (70%)</span>
                  </div>
                  <span className="text-sm font-medium">{metrics.gradeDistribution.needsImprovement}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {metrics.recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{activity.caseTitle}</p>
                      <p className="text-xs text-gray-600">{new Date(activity.date).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={activity.grade >= 80 ? "default" : "secondary"}>{activity.grade}%</Badge>
                      {activity.interventions > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {activity.interventions} interventions
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
                {metrics.recentActivity.length === 0 && (
                  <p className="text-center text-gray-500 py-4">No completed cases yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                SOAP Note Skills Analysis
              </CardTitle>
              <CardDescription>Performance breakdown by documentation area</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Subjective</span>
                  <span className={`text-sm font-bold ${getGradeColor(metrics.skillAreas.subjective)}`}>
                    {metrics.skillAreas.subjective}%
                  </span>
                </div>
                <Progress value={metrics.skillAreas.subjective} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Objective</span>
                  <span className={`text-sm font-bold ${getGradeColor(metrics.skillAreas.objective)}`}>
                    {metrics.skillAreas.objective}%
                  </span>
                </div>
                <Progress value={metrics.skillAreas.objective} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Assessment</span>
                  <span className={`text-sm font-bold ${getGradeColor(metrics.skillAreas.assessment)}`}>
                    {metrics.skillAreas.assessment}%
                  </span>
                </div>
                <Progress value={metrics.skillAreas.assessment} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Plan</span>
                  <span className={`text-sm font-bold ${getGradeColor(metrics.skillAreas.plan)}`}>
                    {metrics.skillAreas.plan}%
                  </span>
                </div>
                <Progress value={metrics.skillAreas.plan} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Peer Comparison</CardTitle>
              <CardDescription>How you compare to other students</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingInsights ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : insights ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Your Average Grade</span>
                    <span className={`font-bold ${getGradeColor(insights.comparisonToPeers.averageGrade)}`}>
                      {insights.comparisonToPeers.averageGrade}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Peer Average Grade</span>
                    <span className="font-bold text-gray-600">{insights.comparisonToPeers.peerAverageGrade}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Your Percentile</span>
                    <Badge variant="default">{insights.comparisonToPeers.percentile}th percentile</Badge>
                  </div>
                </div>
              ) : (
                <p className="text-center text-gray-500 py-4">Unable to load comparison data</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          {isLoadingInsights ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-3 text-gray-600">Generating personalized insights...</span>
            </div>
          ) : insights ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-green-700">
                    <Target className="h-5 w-5 mr-2" />
                    Your Strengths
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {insights.strengths.map((strength, index) => (
                      <li key={index} className="flex items-start">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{strength}</span>
                      </li>
                    ))}
                    {insights.strengths.length === 0 && (
                      <p className="text-sm text-gray-500">Complete more cases to identify strengths</p>
                    )}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-orange-700">
                    <AlertTriangle className="h-5 w-5 mr-2" />
                    Areas for Improvement
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {insights.weaknesses.map((weakness, index) => (
                      <li key={index} className="flex items-start">
                        <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{weakness}</span>
                      </li>
                    ))}
                    {insights.weaknesses.length === 0 && (
                      <p className="text-sm text-gray-500">Great work! No major areas for improvement identified.</p>
                    )}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-blue-700">
                    <BookOpen className="h-5 w-5 mr-2" />
                    Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {insights.recommendations.map((recommendation, index) => (
                      <li key={index} className="flex items-start">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{recommendation}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-purple-700">
                    <TrendingUp className="h-5 w-5 mr-2" />
                    Next Steps
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {insights.nextSteps.map((step, index) => (
                      <li key={index} className="flex items-start">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{step}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">Unable to generate insights. Please try again later.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="progress" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Learning Progress Over Time</CardTitle>
              <CardDescription>Track your improvement across completed cases</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsService.getLearningProgress(user!.id).map((progress, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{progress.caseTitle}</p>
                      <p className="text-xs text-gray-600">{new Date(progress.date).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={progress.grade >= 80 ? "default" : "secondary"}>{progress.grade}%</Badge>
                      <span className="text-xs text-gray-500">{progress.interventions} interventions</span>
                    </div>
                  </div>
                ))}
                {analyticsService.getLearningProgress(user!.id).length === 0 && (
                  <p className="text-center text-gray-500 py-8">Complete your first case to see progress tracking</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
