"use client"

import { useState } from "react"
import { Users, FileText, BarChart3, MessageSquare, Menu, X, GraduationCap, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StudentOverview } from "./instructor/student-overview"
import { CaseManagement } from "./instructor/case-management"
import { InstructorAnalytics } from "./instructor/instructor-analytics"
import { FeedbackManagement } from "./instructor/feedback-management"


// Mock Button component
const Button = ({ children, variant = "default", size = "default", className = "", onClick, ...props }) => {
  const baseClasses = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background"
  
  const variants = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    ghost: "hover:bg-accent hover:text-accent-foreground",
  }
  
  const sizes = {
    default: "h-10 py-2 px-4",
    sm: "h-9 px-3 rounded-md",
  }
  
  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  )
}

// Mock data
const mockStudents = [
  { id: 1, name: "Alice Johnson", email: "alice.j@university.edu", score: 85, status: "active", lastActive: "2 hours ago" },
  { id: 2, name: "Bob Smith", email: "bob.smith@university.edu", score: 72, status: "struggling", lastActive: "1 day ago" },
  { id: 3, name: "Carol Davis", email: "carol.d@university.edu", score: 91, status: "active", lastActive: "30 minutes ago" },
  { id: 4, name: "David Wilson", email: "david.w@university.edu", score: 78, status: "active", lastActive: "4 hours ago" },
]

const mockCases = [
  { id: 1, title: "Cardiovascular Emergency", difficulty: "Hard", created: "2024-08-28", attempts: 23 },
  { id: 2, title: "Respiratory Assessment", difficulty: "Medium", created: "2024-08-25", attempts: 45 },
  { id: 3, title: "Neurological Exam", difficulty: "Hard", created: "2024-08-22", attempts: 12 },
]

const navigation = [
  { name: "Student Overview", icon: Users, id: "students" },
  { name: "Case Management", icon: FileText, id: "cases" },
  { name: "Analytics", icon: BarChart3, id: "analytics" },
  { name: "Feedback", icon: MessageSquare, id: "feedback" },
]

export function InstructorDashboard() {
  const [activeTab, setActiveTab] = useState("students")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [cases, setCases] = useState(mockCases)
  const [showAddCaseModal, setShowAddCaseModal] = useState(false)
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [feedbacks, setFeedbacks] = useState([
    { id: 1, student: "Alice Johnson", case: "Cardiovascular Emergency", message: "Excellent diagnosis! Consider exploring differential diagnoses more thoroughly.", date: "2 hours ago" },
    { id: 2, student: "Bob Smith", case: "Respiratory Assessment", message: "Good effort. Focus on systematic approach to breath sounds examination.", date: "1 day ago" },
    { id: 3, student: "Carol Davis", case: "Neurological Exam", message: "Outstanding performance! Your clinical reasoning was spot-on.", date: "2 days ago" }
  ])

  const handleAddCase = () => {
    setShowAddCaseModal(true)
  }

  const handleGiveFeedback = (student) => {
    setSelectedStudent(student)
    setShowFeedbackModal(true)
  }

  const handleSendFeedback = () => {
    setShowFeedbackModal(true)
  }

  // Components for the different views
  const StudentOverview = ({ onGiveFeedback }) => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total Students</p>
              <p className="text-2xl font-bold text-slate-900">{mockStudents.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Active Students</p>
              <p className="text-2xl font-bold text-slate-900">{mockStudents.filter(s => s.status === 'active').length}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Struggling</p>
              <p className="text-2xl font-bold text-slate-900">{mockStudents.filter(s => s.status === 'struggling').length}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Avg. Score</p>
              <p className="text-2xl font-bold text-slate-900">{Math.round(mockStudents.reduce((acc, s) => acc + s.score, 0) / mockStudents.length)}%</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Students</h2>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search students..."
                className="px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Button variant="ghost">Filter</Button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-medium text-slate-600">Student</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600">Score</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600">Last Active</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {mockStudents.map((student) => (
                  <tr key={student.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-medium text-slate-900">{student.name}</div>
                        <div className="text-sm text-slate-600">{student.email}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        student.score >= 85 ? 'bg-green-100 text-green-800' :
                        student.score >= 75 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {student.score}%
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        student.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {student.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{student.lastActive}</td>
                    <td className="py-3 px-4">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => onGiveFeedback(student)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        Give Feedback
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )

  const CaseManagement = ({ cases, onAddCase }) => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Case Management</h2>
          <p className="text-slate-600">Create and manage medical cases for student assessment</p>
        </div>
        <Button onClick={onAddCase} className="bg-blue-600 hover:bg-blue-700 text-white">
          <FileText className="w-4 h-4 mr-2" />
          Add New Case
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cases.map((case_) => (
          <div key={case_.id} className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <h3 className="font-semibold text-slate-900">{case_.title}</h3>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                case_.difficulty === 'Hard' ? 'bg-red-100 text-red-700' :
                case_.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                'bg-green-100 text-green-700'
              }`}>
                {case_.difficulty}
              </span>
            </div>
            <div className="space-y-2 text-sm text-slate-600">
              <p>Created: {case_.created}</p>
              <p>Student Attempts: {case_.attempts}</p>
            </div>
            <div className="mt-4 flex gap-2">
              <Button variant="ghost" size="sm" className="flex-1">Edit</Button>
              <Button variant="ghost" size="sm" className="flex-1">View Results</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const InstructorAnalytics = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Analytics Dashboard</h2>
        <p className="text-slate-600">Monitor student performance and case effectiveness</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <h3 className="font-semibold text-slate-900 mb-4">Institute Performance</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Overall Average</span>
              <span className="font-semibold text-green-600">81.5%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Pass Rate</span>
              <span className="font-semibold text-green-600">94%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Cases Completed</span>
              <span className="font-semibold text-slate-900">156</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <h3 className="font-semibold text-slate-900 mb-4">Student Engagement</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Daily Active</span>
              <div className="flex items-center gap-2">
                <div className="w-16 bg-slate-200 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{width: '75%'}}></div>
                </div>
                <span className="text-sm font-medium">75%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Weekly Active</span>
              <div className="flex items-center gap-2">
                <div className="w-16 bg-slate-200 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{width: '90%'}}></div>
                </div>
                <span className="text-sm font-medium">90%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Retention Rate</span>
              <div className="flex items-center gap-2">
                <div className="w-16 bg-slate-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{width: '95%'}}></div>
                </div>
                <span className="text-sm font-medium">95%</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <h3 className="font-semibold text-slate-900 mb-4">Top Performing Cases</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-600 text-sm">Respiratory Assessment</span>
              <span className="font-medium text-green-600">88%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600 text-sm">Basic Diagnosis</span>
              <span className="font-medium text-green-600">85%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600 text-sm">Emergency Protocol</span>
              <span className="font-medium text-yellow-600">72%</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
        <h3 className="font-semibold text-slate-900 mb-4">Performance Trends</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-slate-700 mb-3">Score Distribution</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">90-100%</span>
                <span className="font-medium">25%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">80-89%</span>
                <span className="font-medium">45%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">70-79%</span>
                <span className="font-medium">20%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Below 70%</span>
                <span className="font-medium">10%</span>
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-medium text-slate-700 mb-3">Weekly Progress</h4>
            <div className="text-center py-8 text-slate-500">
              📊 Chart visualization would go here
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const FeedbackManagement = ({ feedbacks, onSendFeedback }) => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Feedback Management</h2>
          <p className="text-slate-600">Provide personalized feedback to help students improve</p>
        </div>
        <Button onClick={onSendFeedback} className="bg-green-600 hover:bg-green-700 text-white">
          <MessageSquare className="w-4 h-4 mr-2" />
          Send Feedback
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <h3 className="font-semibold text-slate-900 mb-4">Recent Feedback</h3>
          <div className="space-y-4">
            {feedbacks.map((feedback) => (
              <div key={feedback.id} className="border-l-4 border-blue-500 pl-4 py-2">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-medium text-slate-900">{feedback.student}</span>
                  <span className="text-xs text-slate-500">{feedback.date}</span>
                </div>
                <p className="text-sm text-slate-600 mb-2">{feedback.case}</p>
                <p className="text-sm text-slate-700">{feedback.message}</p>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <h3 className="font-semibold text-slate-900 mb-4">Students Needing Attention</h3>
          <div className="space-y-3">
            <div className="p-3 bg-red-50 rounded-lg border border-red-200">
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium text-red-800">Bob Smith</span>
                <span className="text-xs text-red-600">Score: 65%</span>
              </div>
              <p className="text-sm text-red-700">Struggling with cardiovascular cases</p>
              <Button variant="ghost" size="sm" className="mt-2 text-red-600 hover:text-red-700">
                Send Feedback
              </Button>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium text-yellow-800">Emma Wilson</span>
                <span className="text-xs text-yellow-600">Score: 74%</span>
              </div>
              <p className="text-sm text-yellow-700">Inconsistent performance across cases</p>
              <Button variant="ghost" size="sm" className="mt-2 text-yellow-600 hover:text-yellow-700">
                Send Feedback
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const AddCaseModal = () => {
    const [caseTitle, setCaseTitle] = useState("")
    const [caseDifficulty, setCaseDifficulty] = useState("Medium")
    const [caseDescription, setCaseDescription] = useState("")

    const handleSubmit = (e) => {
      e.preventDefault()
      const newCase = {
        id: cases.length + 1,
        title: caseTitle,
        difficulty: caseDifficulty,
        created: new Date().toISOString().split('T')[0],
        attempts: 0
      }
      setCases([...cases, newCase])
      setShowAddCaseModal(false)
      setCaseTitle("")
      setCaseDescription("")
    }

    if (!showAddCaseModal) return null

    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Add New Case</h3>
            <Button variant="ghost" size="sm" onClick={() => setShowAddCaseModal(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Case Title</label>
              <input
                type="text"
                value={caseTitle}
                onChange={(e) => setCaseTitle(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter case title"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Difficulty</label>
              <select
                value={caseDifficulty}
                onChange={(e) => setCaseDifficulty(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <textarea
                value={caseDescription}
                onChange={(e) => setCaseDescription(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter case description"
                rows={3}
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                Create Case
              </Button>
              <Button type="button" variant="ghost" className="flex-1" onClick={() => setShowAddCaseModal(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  const FeedbackModal = () => {
    const [feedbackMessage, setFeedbackMessage] = useState("")
    const [feedbackType, setFeedbackType] = useState("general")

    const handleSubmit = (e) => {
      e.preventDefault()
      const newFeedback = {
        id: feedbacks.length + 1,
        student: selectedStudent?.name || "Selected Student",
        case: "General Feedback",
        message: feedbackMessage,
        date: "Just now"
      }
      setFeedbacks([newFeedback, ...feedbacks])
      setShowFeedbackModal(false)
      setFeedbackMessage("")
      setSelectedStudent(null)
    }

    if (!showFeedbackModal) return null

    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-slate-900">
              Send Feedback {selectedStudent && `to ${selectedStudent.name}`}
            </h3>
            <Button variant="ghost" size="sm" onClick={() => setShowFeedbackModal(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Feedback Type</label>
              <select
                value={feedbackType}
                onChange={(e) => setFeedbackType(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="general">General Performance</option>
                <option value="case-specific">Case-Specific</option>
                <option value="improvement">Improvement Areas</option>
                <option value="encouragement">Encouragement</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Message</label>
              <textarea
                value={feedbackMessage}
                onChange={(e) => setFeedbackMessage(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your feedback message"
                rows={4}
                required
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                Send Feedback
              </Button>
              <Button type="button" variant="ghost" className="flex-1" onClick={() => setShowFeedbackModal(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  const renderContent = () => {
    switch (activeTab) {
      case "students":
        return <StudentOverview onGiveFeedback={handleGiveFeedback} />
      case "cases":
        return <CaseManagement cases={cases} onAddCase={handleAddCase} />
      case "analytics":
        return <InstructorAnalytics />
      case "feedback":
        return <FeedbackManagement feedbacks={feedbacks} onSendFeedback={handleSendFeedback} />
      default:
        return <StudentOverview onGiveFeedback={handleGiveFeedback} />
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Header Navigation */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
        <div className="px-6 py-4">
          {/* Logo and Brand */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl text-slate-900">MedAssess</span>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="text-sm text-slate-600">Dr. Sarah Johnson</div>
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-blue-600">SJ</span>
              </div>
            </div>
          </div>
          
          {/* Navigation Tabs */}
          <nav className="flex items-center gap-8">
            {navigation.map((item) => (
              <button
                key={item.id}
                className={`flex items-center gap-2 font-semibold transition-colors duration-200 pb-2 ${
                  activeTab === item.id
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                onClick={() => setActiveTab(item.id)}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </button>
            ))}
            
            <div className="ml-auto">
              <Button variant="ghost" className="text-slate-600 hover:text-slate-900">
                <Settings className="w-5 h-5 mr-2" />
                Settings
              </Button>
            </div>
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="p-6">
        <div key={activeTab} className="animate-in fade-in-0 slide-in-from-bottom-4 duration-200">
          {renderContent()}
        </div>
        <AddCaseModal />
        <FeedbackModal />
      </main>
    </div>
  )
}