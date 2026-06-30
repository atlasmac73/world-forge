'use client'

import { useState } from 'react'
import { MessageSquare, X, Send } from 'lucide-react'

export function BetaFeedbackButton() {
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<'bug' | 'feature' | 'ux' | 'general'>('general')
  const [message, setMessage] = useState('')
  const [rating, setRating] = useState<number | null>(null)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!message.trim()) return
    setSending(true)

    const res = await fetch('/api/beta/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, message, rating: rating ?? undefined }),
    })

    if (res.ok) {
      setSent(true)
      setTimeout(() => {
        setOpen(false)
        setSent(false)
        setMessage('')
        setRating(null)
      }, 2000)
    }
    setSending(false)
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      {open && (
        <div className="bg-[#0d1829] border border-[#1e3a5f] rounded-xl shadow-2xl w-72 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-white text-sm font-semibold">Beta Feedback</span>
            <button onClick={() => setOpen(false)} className="text-[#4a6fa5] hover:text-white">
              <X size={16} />
            </button>
          </div>

          {sent ? (
            <div className="text-center py-4 text-[#52b788] text-sm">
              ✓ Feedback received. Thanks!
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-3">
              <div className="flex gap-1.5 flex-wrap">
                {(['bug', 'feature', 'ux', 'general'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`text-xs px-2 py-1 rounded-md border transition-colors ${
                      type === t
                        ? 'bg-[#1e3a5f] border-[#63b3ed] text-[#63b3ed]'
                        : 'border-[#1e3a5f] text-[#4a6fa5] hover:border-[#2d5a8f]'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="What's on your mind?"
                rows={3}
                required
                className="w-full bg-[#080e1a] border border-[#1e3a5f] rounded-lg px-3 py-2 text-white placeholder-[#2d4a6e] focus:outline-none focus:border-[#63b3ed] text-xs resize-none"
              />

              <div>
                <div className="text-[#4a6fa5] text-xs mb-1.5">Rating (optional)</div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setRating(n === rating ? null : n)}
                      className={`text-lg transition-opacity ${
                        rating != null && n <= rating ? 'opacity-100' : 'opacity-30 hover:opacity-60'
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={sending || !message.trim()}
                className="w-full flex items-center justify-center gap-2 bg-[#1a3a5f] hover:bg-[#1e4a7a] disabled:opacity-50 text-white text-xs font-medium py-2 rounded-lg transition-colors"
              >
                <Send size={12} />
                {sending ? 'Sending...' : 'Send feedback'}
              </button>
            </form>
          )}
        </div>
      )}

      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 bg-[#0d1829] border border-[#1e3a5f] hover:border-[#63b3ed] text-[#63b3ed] text-xs font-medium px-3 py-2 rounded-full shadow-lg transition-colors"
      >
        <MessageSquare size={14} />
        Beta Feedback
      </button>
    </div>
  )
}
