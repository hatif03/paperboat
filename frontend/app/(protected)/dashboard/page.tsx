'use client'

import Navbar from '@/components/landing/Navbar'
import Footer from '@/components/landing/Footer'
import { ArrowRight, Palette, Video, Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'

export default function DashboardPage() {
  const router = useRouter()
  const { user } = useAuth()

  const getUserName = () => {
    if (!user) return 'there'
    return (
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split('@')[0] ||
      'there'
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen relative bg-white flex flex-col">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

        <div className="relative z-10 flex-1 flex flex-col">
          <Navbar />

          <main className="pt-32 pb-20 px-6 flex-1">
            <div className="max-w-4xl mx-auto">
              {/* Welcome Header */}
              <div className="text-center mb-16">
                <h1 className="text-5xl md:text-6xl font-normal text-gray-900 mb-4">
                  Welcome back, {getUserName()}!
                </h1>
                <p className="text-xl text-gray-600 font-light">
                  Ready to bring your storyboards to life?
                </p>
              </div>

              {/* Main Action Card */}
              <div className="bg-white/60 backdrop-blur-md border border-gray-200/50 rounded-2xl p-8 shadow-xl shadow-black/5 mb-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Palette className="w-8 h-8 text-purple-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Start Creating</h2>
                  <p className="text-gray-600 mb-8 max-w-md mx-auto">
                    Open the canvas to draw storyboards, add annotations, and generate AI-powered videos from your sketches.
                  </p>
                  <button
                    onClick={() => router.push('/app')}
                    className="px-8 py-4 bg-black text-white font-semibold rounded-xl hover:bg-gray-900 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-black/20 cursor-pointer mx-auto"
                  >
                    Enter Canvas
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Feature Cards */}
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-white/60 backdrop-blur-md border border-gray-200/50 rounded-xl p-6 shadow-lg shadow-black/5">
                  <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center mb-4">
                    <Palette className="w-5 h-5 text-blue-500" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Draw & Annotate</h3>
                  <p className="text-sm text-gray-600">
                    Sketch your ideas and add annotations to guide the AI generation.
                  </p>
                </div>

                <div className="bg-white/60 backdrop-blur-md border border-gray-200/50 rounded-xl p-6 shadow-lg shadow-black/5">
                  <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center mb-4">
                    <Video className="w-5 h-5 text-green-500" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Generate Videos</h3>
                  <p className="text-sm text-gray-600">
                    Transform your sketches into dynamic video clips with AI.
                  </p>
                </div>

                <div className="bg-white/60 backdrop-blur-md border border-gray-200/50 rounded-xl p-6 shadow-lg shadow-black/5">
                  <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center mb-4">
                    <Sparkles className="w-5 h-5 text-purple-500" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Enhance Images</h3>
                  <p className="text-sm text-gray-600">
                    Use AI to fill in details and improve your artwork.
                  </p>
                </div>
              </div>
            </div>
          </main>

          <Footer />
        </div>
      </div>
    </ProtectedRoute>
  )
}
