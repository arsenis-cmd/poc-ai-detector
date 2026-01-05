'use client'

import { useState, useRef, useEffect } from 'react'
import { Eye, Check, AlertTriangle } from 'lucide-react'
import { api, type AttentionResult } from '@/lib/api'

export default function DemoPage() {
  const [isTracking, setIsTracking] = useState(false)
  const [gazePoints, setGazePoints] = useState(0)
  const [duration, setDuration] = useState(0)
  const [verified, setVerified] = useState(false)
  const [result, setResult] = useState<AttentionResult | null>(null)

  const adRef = useRef<HTMLDivElement>(null)
  const startTimeRef = useRef<number>(0)
  const intervalRef = useRef<NodeJS.Timeout>()

  // Simulated eye tracking (in production, use MediaPipe)
  useEffect(() => {
    if (!isTracking) return

    startTimeRef.current = Date.now()

    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current
      setDuration(Math.floor(elapsed / 1000))
      setGazePoints(prev => prev + 1)

      // Auto-verify after 5 seconds
      if (elapsed >= 5000 && !verified) {
        verifyAttention()
      }
    }, 100)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isTracking, verified])

  async function startTracking() {
    setIsTracking(true)
    setGazePoints(0)
    setDuration(0)
    setVerified(false)
    setResult(null)
  }

  async function verifyAttention() {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setIsTracking(false)

    try {
      const res = await api.submitAttentionVerification({
        session_id: `demo_${Date.now()}`,
        page_url: window.location.href,
        ad_element_id: 'demo-ad',
        attention_duration_ms: duration * 1000,
        gaze_points_count: gazePoints,
        eye_tracking_data: {
          average_confidence: 0.85,
          gaze_points: gazePoints
        }
      })

      setResult(res)
      setVerified(res.human_verified)

    } catch (e) {
      console.error('Verification error:', e)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900">Attention Verification Demo</h1>
          <p className="text-sm text-gray-500">See how PoC verifies human attention on ads</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          {/* Instructions */}
          <div className="bg-indigo-50 rounded-xl p-6 mb-8">
            <h2 className="font-semibold text-indigo-900 mb-2">How This Works</h2>
            <p className="text-indigo-700 text-sm">
              Click "Start Tracking" and look at the ad below for 5 seconds.
              PoC will verify that a real human viewed the ad, not a bot.
            </p>
          </div>

          {/* Demo Ad */}
          <div
            ref={adRef}
            className={`bg-white rounded-xl shadow-lg p-8 mb-8 border-4 transition-all ${
              verified ? 'border-green-500' :
              isTracking ? 'border-indigo-500' :
              'border-gray-200'
            }`}
          >
            <div className="text-center">
              <div className="text-6xl mb-4">🎯</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Sample Advertisement</h3>
              <p className="text-gray-600 mb-4">
                This is a demo ad. In production, this would be a real advertisement
                from a publisher's website.
              </p>
              <div className="inline-block bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full text-sm">
                Ad Placement: Leaderboard
              </div>
            </div>
          </div>

          {/* Tracking Status */}
          <div className="bg-white rounded-xl shadow p-6 mb-8">
            <div className="grid grid-cols-3 gap-4 text-center mb-6">
              <div>
                <div className="text-3xl font-bold text-gray-900">{duration}s</div>
                <div className="text-sm text-gray-500">Duration</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-900">{gazePoints}</div>
                <div className="text-sm text-gray-500">Gaze Points</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-900">
                  {isTracking ? '👁️' : verified ? '✅' : '⏸️'}
                </div>
                <div className="text-sm text-gray-500">Status</div>
              </div>
            </div>

            {!isTracking && !verified && (
              <button
                onClick={startTracking}
                className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition flex items-center justify-center gap-2"
              >
                <Eye className="w-5 h-5" />
                Start Tracking
              </button>
            )}

            {isTracking && (
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-gray-600">Tracking attention... Look at the ad above</p>
                <p className="text-sm text-gray-400 mt-1">Auto-verifies after 5 seconds</p>
              </div>
            )}

            {verified && result && (
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-green-600 mb-2">Human Verified!</h3>
                <p className="text-gray-600 mb-4">
                  This impression has been cryptographically verified as human attention.
                </p>
                <div className="bg-gray-50 rounded-lg p-4 text-left text-sm">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-500">Verification ID:</span>
                    <span className="font-mono text-xs">{result.verification_id?.slice(0, 16)}...</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-500">Duration:</span>
                    <span>{result.attention_duration_ms / 1000}s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Confidence:</span>
                    <span>{Math.round(result.confidence * 100)}%</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setVerified(false)
                    setResult(null)
                  }}
                  className="mt-4 px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>

          {/* Explanation */}
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Why This Matters</h3>
            <div className="space-y-4 text-sm text-gray-600">
              <div className="flex gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p>
                  <strong>The Problem:</strong> 30-50% of digital ad impressions are from bots.
                  Advertisers waste $172 billion annually.
                </p>
              </div>
              <div className="flex gap-3">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                <p>
                  <strong>The Solution:</strong> PoC uses eye tracking and behavioral analysis
                  to prove a real human viewed the ad. This proof is recorded on blockchain.
                </p>
              </div>
              <div className="flex gap-3">
                <Eye className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                <p>
                  <strong>For Advertisers:</strong> Pay only for verified human impressions.
                  Get proof that real people saw your ads.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
