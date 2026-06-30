'use client'

import { useState, useEffect, useCallback } from 'react'
import { UserPlus, Copy, Trash2, RefreshCw, Check, Clock, X } from 'lucide-react'
import toast from 'react-hot-toast'

interface Invite {
  id: string
  email: string
  role: string
  status: string
  expires_at: string | null
  accepted_at: string | null
  created_at: string
}

const STATUS_COLORS: Record<string, string> = {
  pending:  'text-[#f6c90e] bg-[#1a1500]',
  accepted: 'text-[#52b788] bg-[#0a1a10]',
  revoked:  'text-[#fc8181] bg-[#1a0808]',
  expired:  'text-[#4a6fa5] bg-[#080e1a]',
}

export function AdminInviteManager() {
  const [invites, setInvites] = useState<Invite[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'beta_tester' | 'contractor' | 'viewer' | 'admin'>('beta_tester')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const loadInvites = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/invite')
    const data = await res.json()
    if (data.ok) setInvites(data.data)
    setLoading(false)
  }, [])

  useEffect(() => { loadInvites() }, [loadInvites])

  async function createInvite(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    const res = await fetch('/api/admin/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, role, expires_in_days: 7 }),
    })
    const data = await res.json()
    if (data.ok) {
      toast.success(`Invite created for ${email}`)
      await copyToClipboard(data.data.invite_url, 'invite_url_new')
      toast.success('Invite link copied to clipboard!')
      setEmail('')
      await loadInvites()
    } else {
      toast.error(data.error?.email?.[0] ?? data.error ?? 'Failed to create invite')
    }
    setCreating(false)
  }

  async function revokeInvite(id: string) {
    if (!confirm('Revoke this invite?')) return
    const res = await fetch(`/api/admin/invite?id=${id}`, { method: 'DELETE' })
    const data = await res.json()
    if (data.ok) {
      toast.success('Invite revoked')
      await loadInvites()
    } else {
      toast.error(data.error ?? 'Failed to revoke')
    }
  }

  async function copyToClipboard(text: string, id: string) {
    await navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const inviteUrl = (token: string) =>
    `${process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin}/invite?token=${token}`

  return (
    <div className="space-y-6">
      {/* Create invite form */}
      <div className="bg-[#0d1829] border border-[#1e3a5f] rounded-xl p-5">
        <h3 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
          <UserPlus size={16} className="text-[#63b3ed]" />
          Invite a Beta Tester
        </h3>
        <form onSubmit={createInvite} className="flex gap-3 flex-wrap">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@example.com"
            required
            className="flex-1 min-w-[220px] bg-[#080e1a] border border-[#1e3a5f] rounded-lg px-3 py-2 text-white placeholder-[#2d4a6e] focus:outline-none focus:border-[#63b3ed] text-sm"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as typeof role)}
            className="bg-[#080e1a] border border-[#1e3a5f] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#63b3ed]"
          >
            <option value="beta_tester">Beta Tester</option>
            <option value="contractor">Contractor</option>
            <option value="viewer">Viewer</option>
            <option value="admin">Admin</option>
          </select>
          <button
            type="submit"
            disabled={creating || !email}
            className="bg-[#1a3a5f] hover:bg-[#1e4a7a] disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            <UserPlus size={14} />
            {creating ? 'Creating...' : 'Create Invite'}
          </button>
        </form>
        <p className="text-[#2d4a6e] text-xs mt-2">Invite expires in 7 days. Link is copied to clipboard on creation.</p>
      </div>

      {/* Invite list */}
      <div className="bg-[#0d1829] border border-[#1e3a5f] rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#1e3a5f]">
          <h3 className="text-white font-semibold text-sm">
            Invites ({invites.length})
          </h3>
          <button onClick={loadInvites} className="text-[#4a6fa5] hover:text-white">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {loading ? (
          <div className="px-5 py-8 text-center text-[#4a6fa5] text-sm">Loading...</div>
        ) : invites.length === 0 ? (
          <div className="px-5 py-8 text-center text-[#4a6fa5] text-sm">No invites yet</div>
        ) : (
          <div className="divide-y divide-[#1e3a5f]">
            {invites.map((inv) => (
              <div key={inv.id} className="px-5 py-3 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white text-sm font-medium truncate">{inv.email}</span>
                    <span className="text-[#4a6fa5] text-xs">{inv.role}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${STATUS_COLORS[inv.status] ?? ''}`}>
                      {inv.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-[#2d4a6e] text-xs flex items-center gap-1">
                      <Clock size={10} />
                      {new Date(inv.created_at).toLocaleDateString()}
                    </span>
                    {inv.accepted_at && (
                      <span className="text-[#52b788] text-xs flex items-center gap-1">
                        <Check size={10} />
                        Accepted {new Date(inv.accepted_at).toLocaleDateString()}
                      </span>
                    )}
                    {inv.expires_at && inv.status === 'pending' && (
                      <span className="text-[#4a6fa5] text-xs">
                        Expires {new Date(inv.expires_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {inv.status === 'pending' && (
                    <>
                      <button
                        onClick={() => copyToClipboard(inviteUrl(inv.id), inv.id)}
                        title="Copy invite link"
                        className="text-[#4a6fa5] hover:text-[#63b3ed] p-1"
                      >
                        {copiedId === inv.id ? <Check size={14} className="text-[#52b788]" /> : <Copy size={14} />}
                      </button>
                      <button
                        onClick={() => revokeInvite(inv.id)}
                        title="Revoke invite"
                        className="text-[#4a6fa5] hover:text-[#fc8181] p-1"
                      >
                        <X size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
