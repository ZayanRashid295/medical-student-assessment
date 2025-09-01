import { AvatarIntegrationTest } from "@/components/avatar-integration-test"

export default function TestAvatarsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Avatar Integration Test</h1>
          <p className="text-gray-600">
            Test the secure HeyGen avatar integration to ensure everything is working properly after the security
            updates.
          </p>
        </div>
        <AvatarIntegrationTest />
      </div>
    </div>
  )
}
