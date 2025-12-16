'use client'

import dynamic from 'next/dynamic'
import ProtectedRoute from '@/components/ProtectedRoute'

// Dynamically import tldraw to avoid SSR issues
const CanvasEditor = dynamic(() => import('@/components/canvas/CanvasEditor'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading canvas...</p>
      </div>
    </div>
  ),
})

export default function CanvasPage() {
  return (
    <ProtectedRoute>
      <CanvasEditor />
    </ProtectedRoute>
  )
}

