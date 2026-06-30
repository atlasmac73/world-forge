'use client'


import { Suspense, useEffect, useState, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createBrowserClient(url, key)
}

function InviteContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [status, setStatus] = useState<'loading'|'valid'|'invalid'|'accepting'|'done'|'error'>('loading')
  const [invite, setInvite] = useState<{email:string;role:string}|null>(null)
  const [email, setEmail] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const supabase = useMemo(() => getSupabase(), [])

  useEffect(() => {
    if (!token) { setStatus('invalid'); return }
    fetch(`/api/invite/validate?token=${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.ok) { setInvite(data.invite); setEmail(data.invite.email); setStatus('valid') }
        else { setStatus('invalid'); setErrorMsg(data.error ?? 'Invalid or expired invite') }
      })
  }, [token])

  async function acceptInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!supabase || !invite) return
    setStatus('accepting')
    const { error } = await supabase.auth.signInWithOtp({
      email: invite.email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/` },
    })
    if (error) { setErrorMsg(error.message); setStatus('error') }
    else setStatus('done')
  }

  return (
    <div className="bg-[#0d1829] border border-[#1e3a5f] rounded-2xl p-8">
      {status === 'loading' && <div className="text-center text-[#4a6fa5]">Validating invite...</div>}
      {status === 'invalid' && (
        <div className="text-center">
          <div className="text-[#fc8181] text-4xl mb-4">⚠</div>
          <h2 className="text-white font-semibold text-lg mb-2">Invalid Invite</h2>
          <p className="text-[#4a6fa5] text-sm">{errorMsg || 'This invite link is invalid or has expired.'}</p>
          <a href="/login" className="mt-6 block text-[#63b3ed] text-sm hover:underline">Already have access? Sign in →</a>
        </div>
      )}
      {status === 'valid' && invite && (
        <>
          <div className="bg-[#0a1f10] border border-[#2d6a4f] rounded-lg px-4 py-3 mb-6">
            <p className="text-[#52b788] text-sm font-medium">✓ Valid invitation</p>
            <p className="text-[#4a6fa5] text-xs mt-1">Role: <span className="text-[#63b3ed]">{invite.role}</span></p>
          </div>
          <h2 className="text-white font-semibold text-lg mb-1">Accept your invite</h2>
          <p className="text-[#4a6fa5] text-sm mb-6">
            You&apos;ve been invited to THE ARK private beta. We&apos;ll send a magic link to{' '}
            <span className="text-[#63b3ed]">{invite.email}</span>.
          </p>
          <form onSubmit={acceptInvite}>
            <button type="submit" className="w-full bg-[#1a3a5f] hover:bg-[#1e4a7a] text-white font-semibold py-3 rounded-lg transition-colors text-sm">
              Accept invite &amp; sign in →
            </button>
          </form>
        </>
      )}
      {status === 'accepting' && <div className="text-center text-[#4a6fa5]">Sending magic link...</div>}
      {status === 'done' && (
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-[#0a2a1a] border border-[#2d6a4f] flex items-center justify-center mx-auto mb-4">
            <span className="text-[#52b788] text-xl">✓</span>
          </div>
          <h2 className="text-white font-semibold text-lg mb-2">Check your email</h2>
          <p className="text-[#4a6fa5] text-sm">Magic link sent to <span className="text-[#63b3ed]">{email}</span></p>
        </div>
      )}
      {status === 'error' && (
        <div className="text-center">
          <p className="text-[#fc8181] text-sm">{errorMsg}</p>
          <button onClick={() => setStatus('valid')} className="mt-4 text-[#63b3ed] text-sm hover:underline">Try again</button>
        </div>
      )}
    </div>
  )
}

export default function InvitePage() {
  return (
    <div className="min-h-screen bg-[#080e1a] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#0f1c35] border border-[#1e3a5f] mb-4">
            <span className="text-2xl font-black text-[#63b3ed]">▲</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-wide">THE ARK</h1>
          <p className="text-[#4a6fa5] text-sm mt-1">Private Beta Invitation</p>
        </div>
        <Suspense fallback={<div className="bg-[#0d1829] border border-[#1e3a5f] rounded-2xl p-8 text-center text-[#4a6fa5]">Loading...</div>}>
          <InviteContent />
        </Suspense>
        <p className="text-center text-[#2d4a6e] text-xs mt-6">
          © {new Date().getFullYear()} Isaac Brandon Burdette · Atlas Genesis Matrix LLC
        </p>
      </div>
    </div>
  )
}
