import { FeedbackManagement } from "@/components/instructor/feedback-management"

export default function FeedbackPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Feedback Management</h1>
          <p className="text-gray-600 mt-2">Review student submissions and provide detailed feedback</p>
        </div>
        <FeedbackManagement />
      </div>
    </div>
  )
}
