'use client'


import { useState, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createBrowserClient(url, key)
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const supabase = useMemo(() => getSupabase(), [])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!supabase) return
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSent(true)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#080e1a] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#0f1c35] border border-[#1e3a5f] mb-4">
            <span className="text-2xl font-black text-[#63b3ed]">▲</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-wide">THE ARK</h1>
          <p className="text-[#4a6fa5] text-sm mt-1">ATLAS Genesis Matrix — Private Beta</p>
        </div>

        <div className="bg-[#0d1829] border border-[#1e3a5f] rounded-2xl p-8">
          {sent ? (
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-[#0a2a1a] border border-[#2d6a4f] flex items-center justify-center mx-auto mb-4">
                <span className="text-[#52b788] text-xl">✓</span>
              </div>
              <h2 className="text-white font-semibold text-lg mb-2">Check your email</h2>
              <p className="text-[#4a6fa5] text-sm">
                Magic link sent to <span className="text-[#63b3ed]">{email}</span>
              </p>
              <p className="text-[#4a6fa5] text-xs mt-3">
                Link expires in 1 hour. Check your spam folder if needed.
              </p>
              <button
                onClick={() => { setSent(false); setEmail('') }}
                className="mt-6 text-[#63b3ed] text-sm hover:underline"
              >
                Use a different email
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-white font-semibold text-lg mb-1">Sign in</h2>
              <p className="text-[#4a6fa5] text-sm mb-6">
                This is a private, invite-only beta. Enter your invited email address.
              </p>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-[#8aa4c8] text-xs font-medium mb-1.5 uppercase tracking-wider">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full bg-[#080e1a] border border-[#1e3a5f] rounded-lg px-4 py-3 text-white placeholder-[#2d4a6e] focus:outline-none focus:border-[#63b3ed] transition-colors text-sm"
                  />
                </div>

                {error && (
                  <div className="bg-[#2a0a0a] border border-[#6b1a1a] rounded-lg px-4 py-3 text-[#fc8181] text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !email || !supabase}
                  className="w-full bg-[#1a3a5f] hover:bg-[#1e4a7a] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors text-sm"
                >
                  {loading ? 'Sending link...' : 'Send magic link →'}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-[#2d4a6e] text-xs mt-6">
          © {new Date().getFullYear()} Isaac Brandon Burdette · Atlas Genesis Matrix LLC · All rights reserved
        </p>
      </div>
    </div>
  )
}
