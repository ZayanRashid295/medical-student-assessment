import { CaseManagement } from "@/components/instructor/case-management"

export default function CasesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Case Management</h1>
          <p className="text-gray-600 mt-2">Create and manage medical cases for student practice</p>
        </div>
        <CaseManagement />
      </div>
    </div>
  )
}
