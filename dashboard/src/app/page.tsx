import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800">
      <div className="container mx-auto px-4 py-16">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 rounded-2xl mb-6">
            <span className="text-4xl font-bold text-white">P</span>
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">
            Proof of Consideration
          </h1>
          <p className="text-xl text-indigo-200 max-w-2xl mx-auto mb-8">
            The internet is 47% AI-generated. We show you what's real.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/dashboard"
              className="px-8 py-3 bg-white text-indigo-900 font-semibold rounded-lg hover:bg-indigo-100 transition"
            >
              View Dashboard
            </Link>
            <Link
              href="/demo"
              className="px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition"
            >
              Try Demo
            </Link>
          </div>
        </div>

        {/* Stats preview */}
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="bg-white/10 backdrop-blur rounded-xl p-6 text-center">
            <div className="text-4xl font-bold text-white mb-2">47%</div>
            <div className="text-indigo-200">AI Content on Twitter</div>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-6 text-center">
            <div className="text-4xl font-bold text-white mb-2">$172B</div>
            <div className="text-indigo-200">Lost to Ad Fraud</div>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-6 text-center">
            <div className="text-4xl font-bold text-white mb-2">100K+</div>
            <div className="text-indigo-200">Content Scanned</div>
          </div>
        </div>

        {/* How it works */}
        <div className="mt-24 text-center">
          <h2 className="text-3xl font-bold text-white mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-left">
              <div className="w-12 h-12 bg-indigo-500 rounded-lg flex items-center justify-center text-white font-bold text-xl mb-4">1</div>
              <h3 className="text-xl font-semibold text-white mb-2">Install Extension</h3>
              <p className="text-indigo-200">Add our Chrome extension to your browser. It works on any website.</p>
            </div>
            <div className="text-left">
              <div className="w-12 h-12 bg-indigo-500 rounded-lg flex items-center justify-center text-white font-bold text-xl mb-4">2</div>
              <h3 className="text-xl font-semibold text-white mb-2">Browse Normally</h3>
              <p className="text-indigo-200">Visit any page. We scan the content and show you what's AI vs human.</p>
            </div>
            <div className="text-left">
              <div className="w-12 h-12 bg-indigo-500 rounded-lg flex items-center justify-center text-white font-bold text-xl mb-4">3</div>
              <h3 className="text-xl font-semibold text-white mb-2">See The Truth</h3>
              <p className="text-indigo-200">AI content is highlighted red, human content green. Simple.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
