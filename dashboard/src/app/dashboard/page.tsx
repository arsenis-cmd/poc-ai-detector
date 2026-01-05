'use client'

import { useEffect, useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts'
import { Activity, Bot, User, Globe, Twitter, AlertTriangle } from 'lucide-react'
import { api, type DashboardStats } from '@/lib/api'

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 10000) // Refresh every 10s
    return () => clearInterval(interval)
  }, [])

  async function fetchStats() {
    try {
      const data = await api.getStats()
      setStats(data)
      setError(null)
    } catch (e) {
      setError('Failed to load stats. Is the API running?')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">{error}</p>
          <button
            onClick={fetchStats}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!stats) return null

  const pieData = [
    { name: 'AI', value: stats.ai_percentage, color: '#ef4444' },
    { name: 'Human', value: stats.human_percentage, color: '#10b981' },
    { name: 'Mixed', value: stats.mixed_percentage, color: '#f59e0b' },
  ].filter(d => d.value > 0)

  const platformData = [
    { name: 'Twitter', ai: stats.twitter_stats.ai_percentage, total: stats.twitter_stats.total },
    { name: 'Reddit', ai: stats.reddit_stats.ai_percentage, total: stats.reddit_stats.total },
    { name: 'Web', ai: stats.web_stats.ai_percentage, total: stats.web_stats.total },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">P</span>
            </div>
            <div>
              <h1 className="font-bold text-gray-900">PoC Dashboard</h1>
              <p className="text-xs text-gray-500">Real-time AI content detection</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Activity className="w-4 h-4 text-green-500" />
            <span>Live</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <Globe className="w-5 h-5 text-indigo-600" />
              <span className="text-gray-500 text-sm">Total Scanned</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {stats.total_scans.toLocaleString()}
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <Bot className="w-5 h-5 text-red-500" />
              <span className="text-gray-500 text-sm">AI Content</span>
            </div>
            <div className="text-3xl font-bold text-red-500">
              {stats.ai_percentage}%
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <User className="w-5 h-5 text-green-500" />
              <span className="text-gray-500 text-sm">Human Content</span>
            </div>
            <div className="text-3xl font-bold text-green-500">
              {stats.human_percentage}%
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <Twitter className="w-5 h-5 text-blue-500" />
              <span className="text-gray-500 text-sm">Twitter AI</span>
            </div>
            <div className="text-3xl font-bold text-blue-500">
              {stats.twitter_stats.ai_percentage}%
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Pie Chart */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Content Breakdown</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}%`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Platform Chart */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">AI Content by Platform</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={platformData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="ai" fill="#ef4444" name="AI %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Recent Scans */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Recent Scans</h2>
          </div>
          <div className="divide-y">
            {stats.recent_scans.map((scan) => (
              <div key={scan.id} className="p-4 flex items-center gap-4">
                <div className={`w-3 h-3 rounded-full ${
                  scan.classification === 'ai' ? 'bg-red-500' :
                  scan.classification === 'human' ? 'bg-green-500' :
                  'bg-yellow-500'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 truncate">
                    {scan.preview || 'No preview'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {scan.platform} • {new Date(scan.created_at).toLocaleTimeString()}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`text-sm font-medium ${
                    scan.classification === 'ai' ? 'text-red-500' :
                    scan.classification === 'human' ? 'text-green-500' :
                    'text-yellow-500'
                  }`}>
                    {Math.round(scan.ai_probability * 100)}% AI
                  </span>
                </div>
              </div>
            ))}
            {stats.recent_scans.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                No scans yet. Install the extension and browse some pages!
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
