"use client"

import { useState, useEffect, useMemo } from "react"
import { useAuth } from "@/hooks/use-auth"
import { analyticsService, type PerformanceMetrics, type LearningInsights } from "@/lib/analytics-service"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, RadialBarChart, RadialBar, AreaChart, Area } from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  Target,
  Clock,
  Award,
  AlertTriangle,
  BookOpen,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Users,
  Star,
  Brain
} from "lucide-react"

// Animated Counter Component
const AnimatedCounter = ({ value, duration = 2000, suffix = '', prefix = '' }) => {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let startTime
    let animationFrame

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      
      setCount(Math.floor(progress * value))
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      }
    }

    animationFrame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationFrame)
  }, [value, duration])

  return <span>{prefix}{count}{suffix}</span>
}

// Progress Ring Component
const ProgressRing = ({ progress, size = 120, strokeWidth = 8, color = "#3b82f6" }) => {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (progress / 100) * circumference

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xl font-bold text-gray-800">
          <AnimatedCounter value={progress} suffix="%" />
        </span>
      </div>
    </div>
  )
}

// Metric Card with Animation
const MetricCard = ({ title, value, suffix = '', trend, icon: Icon, color = "blue", isLoading = false }) => {
  const getTrendIcon = () => {
    if (trend > 0) return <TrendingUp className="h-4 w-4 text-green-600" />
    if (trend < 0) return <TrendingDown className="h-4 w-4 text-red-600" />
    return <Activity className="h-4 w-4 text-gray-600" />
  }

  const getColorClasses = () => {
    const colors = {
      blue: "text-blue-600 bg-blue-50 border-blue-200",
      green: "text-green-600 bg-green-50 border-green-200",
      yellow: "text-yellow-600 bg-yellow-50 border-yellow-200",
      red: "text-red-600 bg-red-50 border-red-200",
      purple: "text-purple-600 bg-purple-50 border-purple-200"
    }
    return colors[color] || colors.blue
  }

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="h-4 bg-gray-200 rounded w-24"></div>
          <div className="h-4 w-4 bg-gray-200 rounded"></div>
        </CardHeader>
        <CardContent>
          <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-20"></div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`transform transition-all duration-300 hover:scale-105 border-l-4 ${getColorClasses()}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
        <Icon className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-gray-900 mb-1">
          <AnimatedCounter value={value} suffix={suffix} duration={1500} />
        </div>
        {trend !== undefined && (
          <div className="flex items-center text-xs text-muted-foreground">
            {getTrendIcon()}
            <span className="ml-1">
              {trend > 0 ? "+" : ""}{trend}% from last period
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function AnalyticsDashboard() {
  const { user } = useAuth()
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const [insights, setInsights] = useState<LearningInsights | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingInsights, setIsLoadingInsights] = useState(true)

  useEffect(() => {
    if (user) {
      // Simulate loading animation
      setTimeout(() => {
        const performanceMetrics = analyticsService.calculatePerformanceMetrics(user.id)
        setMetrics(performanceMetrics)
        setIsLoading(false)
      }, 800)

      const loadInsights = async () => {
        try {
          setIsLoadingInsights(true)
          const learningInsights = await analyticsService.generateLearningInsights(user.id)
          setInsights(learningInsights)
        } catch (error) {
          console.error("Failed to load insights:", error)
          const performanceMetrics = analyticsService.calculatePerformanceMetrics(user.id)
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

  // Prepare chart data from real analytics service
  const progressData = useMemo(() => {
    if (!user) return []
    return analyticsService.getLearningProgress(user.id).map((item, index) => ({
      ...item,
      caseNumber: index + 1,
      formattedDate: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      efficiency: Math.max(1, 5 - item.interventions) * 20 // Convert interventions to efficiency score
    }))
  }, [user, metrics])

  const gradeDistributionData = useMemo(() => {
    if (!metrics) return []
    return [
      { name: 'Excellent (90-100%)', value: metrics.gradeDistribution.excellent, color: '#10b981', percentage: 0 },
      { name: 'Good (80-89%)', value: metrics.gradeDistribution.good, color: '#3b82f6', percentage: 0 },
      { name: 'Satisfactory (70-79%)', value: metrics.gradeDistribution.satisfactory, color: '#f59e0b', percentage: 0 },
      { name: 'Needs Improvement (<70%)', value: metrics.gradeDistribution.needsImprovement, color: '#ef4444', percentage: 0 }
    ].map(item => {
      const total = metrics.completedCases || 1
      return {
        ...item,
        percentage: Math.round((item.value / total) * 100)
      }
    }).filter(item => item.value > 0)
  }, [metrics])

  const skillAreasData = useMemo(() => {
    if (!metrics) return []
    return [
      { skill: 'Subjective', score: metrics.skillAreas.subjective, fullMark: 100 },
      { skill: 'Objective', score: metrics.skillAreas.objective, fullMark: 100 },
      { skill: 'Assessment', score: metrics.skillAreas.assessment, fullMark: 100 },
      { skill: 'Plan', score: metrics.skillAreas.plan, fullMark: 100 }
    ]
  }, [metrics])

  const getGradeColor = (grade: number) => {
    if (grade >= 90) return "#10b981"
    if (grade >= 80) return "#3b82f6"
    if (grade >= 70) return "#f59e0b"
    return "#ef4444"
  }

  if (isLoading || !metrics) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <MetricCard key={i} isLoading={true} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-48"></div>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const completionRate = metrics.totalCases > 0 ? Math.round((metrics.completedCases / metrics.totalCases) * 100) : 0

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Learning Analytics</h2>
        <p className="text-gray-600">Real-time insights into your clinical performance and learning progress</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-8">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-8">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="Cases Completed"
              value={metrics.completedCases}
              suffix={` / ${metrics.totalCases}`}
              icon={BookOpen}
              color="blue"
            />
            <MetricCard
              title="Average Grade"
              value={metrics.averageGrade}
              suffix="%"
              trend={metrics.improvementTrend}
              icon={Award}
              color="green"
            />
            <MetricCard
              title="Avg Interventions"
              value={metrics.averageInterventionsPerCase}
              icon={AlertTriangle}
              color="yellow"
            />
            <MetricCard
              title="Learning Time"
              value={metrics.timeSpent}
              suffix=" min"
              icon={Clock}
              color="purple"
            />
          </div>

          {/* Completion Rate Ring */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="h-5 w-5 mr-2" />
                Completion Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-center py-8">
              <div className="text-center">
                <ProgressRing 
                  progress={completionRate} 
                  size={160} 
                  strokeWidth={12}
                  color={getGradeColor(completionRate)}
                />
                <p className="mt-4 text-lg font-semibold text-gray-700">
                  {metrics.completedCases} of {metrics.totalCases} cases completed
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Grade Distribution Pie Chart */}
            {gradeDistributionData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <PieChartIcon className="h-5 w-5 mr-2" />
                    Grade Distribution
                  </CardTitle>
                  <CardDescription>Performance across completed cases</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          dataKey="value"
                          data={gradeDistributionData}
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          fill="#8884d8"
                          label={({ name, percentage }) => `${percentage}%`}
                          animationBegin={0}
                          animationDuration={1000}
                        >
                          {gradeDistributionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value, name) => [`${value} cases`, name]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    {gradeDistributionData.map((item, index) => (
                      <div key={index} className="flex items-center text-sm">
                        <div 
                          className="w-3 h-3 rounded-full mr-2" 
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="truncate">{item.name.split(' ')[0]}: {item.value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent Activity Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="h-5 w-5 mr-2" />
                  Recent Performance
                </CardTitle>
                <CardDescription>Your latest case results</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics.recentActivity.slice(0, 5).map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-100 transform transition-all duration-200 hover:scale-105">
                      <div className="flex-1">
                        <p className="font-medium text-sm text-gray-900">{activity.caseTitle}</p>
                        <p className="text-xs text-gray-500">{new Date(activity.date).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <div className={`text-lg font-bold`} style={{ color: getGradeColor(activity.grade) }}>
                            {activity.grade}%
                          </div>
                          {activity.interventions > 0 && (
                            <div className="text-xs text-gray-500">
                              {activity.interventions} interventions
                            </div>
                          )}
                        </div>
                        <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: `${getGradeColor(activity.grade)}20` }}>
                          <Star className="h-5 w-5" style={{ color: getGradeColor(activity.grade) }} />
                        </div>
                      </div>
                    </div>
                  ))}
                  {metrics.recentActivity.length === 0 && (
                    <div className="text-center py-8">
                      <Activity className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No completed cases yet</p>
                      <p className="text-sm text-gray-400 mt-1">Complete your first case to see activity</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-8">
          {/* Skill Areas Radar/Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Brain className="h-5 w-5 mr-2" />
                SOAP Skills Analysis
              </CardTitle>
              <CardDescription>Detailed performance breakdown by clinical documentation area</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Bar Chart */}
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={skillAreasData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="skill" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip formatter={(value) => [`${value}%`, 'Score']} />
                      <Bar 
                        dataKey="score" 
                        fill="#3b82f6"
                        radius={[4, 4, 0, 0]}
                        animationDuration={1000}
                        animationBegin={200}
                      >
                        {skillAreasData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={getGradeColor(entry.score)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Progress Bars */}
                <div className="space-y-6">
                  {skillAreasData.map((skill, index) => (
                    <div key={index}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">{skill.skill}</span>
                        <span className="text-lg font-bold" style={{ color: getGradeColor(skill.score) }}>
                          {skill.score}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div 
                          className="h-3 rounded-full transition-all duration-1000 ease-out"
                          style={{ 
                            width: `${skill.score}%`,
                            backgroundColor: getGradeColor(skill.score)
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Peer Comparison */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Peer Comparison
              </CardTitle>
              <CardDescription>How you compare to other students</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingInsights ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="ml-3 text-gray-600">Loading comparison data...</span>
                </div>
              ) : insights ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-6 bg-blue-50 rounded-lg">
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                      <AnimatedCounter value={insights.comparisonToPeers.averageGrade} suffix="%" />
                    </div>
                    <p className="text-sm text-blue-700 font-medium">Your Average</p>
                  </div>
                  <div className="text-center p-6 bg-gray-50 rounded-lg">
                    <div className="text-3xl font-bold text-gray-600 mb-2">
                      {insights.comparisonToPeers.peerAverageGrade}%
                    </div>
                    <p className="text-sm text-gray-700 font-medium">Peer Average</p>
                  </div>
                  <div className="text-center p-6 bg-green-50 rounded-lg">
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      <AnimatedCounter value={insights.comparisonToPeers.percentile} suffix="th" />
                    </div>
                    <p className="text-sm text-green-700 font-medium">Percentile</p>
                  </div>
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">Unable to load comparison data</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          {isLoadingInsights ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <span className="text-lg text-gray-600">Generating AI-powered insights...</span>
                <p className="text-sm text-gray-500 mt-2">Analyzing your performance patterns</p>
              </div>
            </div>
          ) : insights ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-l-4 border-l-green-500">
                <CardHeader>
                  <CardTitle className="flex items-center text-green-700">
                    <Target className="h-5 w-5 mr-2" />
                    Your Strengths
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {insights.strengths.length > 0 ? (
                    <ul className="space-y-3">
                      {insights.strengths.map((strength, index) => (
                        <li key={index} className="flex items-start animate-fadeIn" style={{ animationDelay: `${index * 100}ms` }}>
                          <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                          <span className="text-sm text-gray-700">{strength}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500 italic">Complete more cases to identify your strengths</p>
                  )}
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-orange-500">
                <CardHeader>
                  <CardTitle className="flex items-center text-orange-700">
                    <AlertTriangle className="h-5 w-5 mr-2" />
                    Areas for Improvement
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {insights.weaknesses.length > 0 ? (
                    <ul className="space-y-3">
                      {insights.weaknesses.map((weakness, index) => (
                        <li key={index} className="flex items-start animate-fadeIn" style={{ animationDelay: `${index * 100}ms` }}>
                          <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                          <span className="text-sm text-gray-700">{weakness}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500 italic">No major areas for improvement identified</p>
                  )}
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-blue-500">
                <CardHeader>
                  <CardTitle className="flex items-center text-blue-700">
                    <BookOpen className="h-5 w-5 mr-2" />
                    Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {insights.recommendations.map((recommendation, index) => (
                      <li key={index} className="flex items-start animate-fadeIn" style={{ animationDelay: `${index * 100}ms` }}>
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{recommendation}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-purple-500">
                <CardHeader>
                  <CardTitle className="flex items-center text-purple-700">
                    <TrendingUp className="h-5 w-5 mr-2" />
                    Next Steps
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {insights.nextSteps.map((step, index) => (
                      <li key={index} className="flex items-start animate-fadeIn" style={{ animationDelay: `${index * 100}ms` }}>
                        <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{step}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-12">
              <AlertTriangle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Unable to generate insights</p>
              <p className="text-sm text-gray-400 mt-1">Please try again later</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="progress" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Learning Progress Over Time
              </CardTitle>
              <CardDescription>Track your improvement and intervention patterns across completed cases</CardDescription>
            </CardHeader>
            <CardContent>
              {progressData.length > 0 ? (
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={progressData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <defs>
                        <linearGradient id="gradeGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                        </linearGradient>
                        <linearGradient id="interventionGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="formattedDate" 
                        tick={{ fontSize: 12 }}
                        interval={'preserveStartEnd'}
                      />
                      <YAxis yAxisId="grade" orientation="left" domain={[0, 100]} />
                      <YAxis yAxisId="interventions" orientation="right" domain={[0, 'dataMax + 1']} />
                      <Tooltip 
                        formatter={(value, name) => {
                          if (name === 'Grade') return [`${value}%`, 'Grade']
                          if (name === 'Interventions') return [`${value}`, 'Interventions']
                          return [value, name]
                        }}
                        labelFormatter={(label) => `Case: ${label}`}
                      />
                      <Area
                        yAxisId="grade"
                        type="monotone"
                        dataKey="grade"
                        stroke="#3b82f6"
                        strokeWidth={3}
                        fill="url(#gradeGradient)"
                        name="Grade"
                        animationDuration={2000}
                      />
                      <Line
                        yAxisId="interventions"
                        type="monotone"
                        dataKey="interventions"
                        stroke="#ef4444"
                        strokeWidth={2}
                        dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                        name="Interventions"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center py-16">
                  <BarChart3 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Progress Data Yet</h3>
                  <p className="text-gray-600 mb-4">Complete your first case to see your learning progress</p>
                  <p className="text-sm text-gray-500">Your grade trends and intervention patterns will appear here</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Detailed Progress List */}
          <Card>
            <CardHeader>
              <CardTitle>Case-by-Case Breakdown</CardTitle>
              <CardDescription>Detailed performance history with trends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {progressData.map((progress, index) => {
                  const isImprovement = index > 0 && progress.grade > progressData[index - 1].grade
                  const isDecline = index > 0 && progress.grade < progressData[index - 1].grade
                  
                  return (
                    <div 
                      key={index} 
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors duration-200"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div 
                            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                            style={{ backgroundColor: getGradeColor(progress.grade) }}
                          >
                            {index + 1}
                          </div>
                        </div>
                        <div>
                          <p className="font-medium text-sm text-gray-900">{progress.caseTitle}</p>
                          <p className="text-xs text-gray-600">{progress.formattedDate}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="flex items-center space-x-2">
                            <span 
                              className="text-lg font-bold"
                              style={{ color: getGradeColor(progress.grade) }}
                            >
                              {progress.grade}%
                            </span>
                            {index > 0 && (
                              <div className="flex items-center">
                                {isImprovement && <TrendingUp className="h-4 w-4 text-green-500" />}
                                {isDecline && <TrendingDown className="h-4 w-4 text-red-500" />}
                                {!isImprovement && !isDecline && <Activity className="h-4 w-4 text-gray-400" />}
                              </div>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">
                            {progress.interventions} intervention{progress.interventions !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
                
                {progressData.length === 0 && (
                  <div className="text-center py-12">
                    <Activity className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-2">No completed cases yet</p>
                    <p className="text-sm text-gray-400">Your learning journey will be tracked here</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Learning Velocity */}
          {progressData.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Learning Velocity
                </CardTitle>
                <CardDescription>Your improvement rate and learning efficiency</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 mb-1">
                      {metrics.improvementTrend > 0 ? '+' : ''}{metrics.improvementTrend}%
                    </div>
                    <p className="text-sm text-blue-700">Grade Trend</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 mb-1">
                      {Math.round(progressData.reduce((acc, curr) => acc + curr.efficiency, 0) / progressData.length)}%
                    </div>
                    <p className="text-sm text-green-700">Avg Efficiency</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600 mb-1">
                      {Math.round(metrics.timeSpent / metrics.completedCases) || 0}m
                    </div>
                    <p className="text-sm text-purple-700">Avg Time/Case</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        /* Custom scrollbar for better aesthetics */
        .overflow-auto::-webkit-scrollbar {
          width: 6px;
        }
        
        .overflow-auto::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 3px;
        }
        
        .overflow-auto::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }
        
        .overflow-auto::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  )
}
