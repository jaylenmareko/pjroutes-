'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function AdminActions({ flightId, mode = 'pending' }: { flightId: string; mode?: 'pending' | 'live' }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function act(action: 'approve' | 'reject' | 'remove') {
    if (action === 'remove' && !confirm('Remove this live listing? This cannot be undone.')) return
    setLoading(true)
    await fetch('/api/admin/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: flightId, action }),
    })
    router.refresh()
    setLoading(false)
  }

  if (mode === 'live') {
    return (
      <button
        onClick={() => act('remove')}
        disabled={loading}
        className="px-4 py-2 rounded-full border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 transition-colors disabled:opacity-50"
      >
        {loading ? '...' : 'Remove'}
      </button>
    )
  }

  return (
    <div className="flex gap-2 flex-shrink-0">
      <button
        onClick={() => act('approve')}
        disabled={loading}
        className="px-4 py-2 rounded-full bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
      >
        {loading ? '...' : 'Approve'}
      </button>
      <button
        onClick={() => act('reject')}
        disabled={loading}
        className="px-4 py-2 rounded-full border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 transition-colors disabled:opacity-50"
      >
        {loading ? '...' : 'Reject'}
      </button>
    </div>
  )
}
