'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AuthModal from './AuthModal'
import { createClient } from '@/lib/supabase-browser'

interface Props {
  flightId: string
}

export default function BookNowButton({ flightId }: Props) {
  const router = useRouter()
  const [showAuth, setShowAuth] = useState(false)
  const [checking, setChecking] = useState(false)

  async function handleClick() {
    setChecking(true)
    try {
      const supabase = createClient()
      const { data } = await supabase.auth.getUser()
      if (data.user) {
        router.push(`/book/${flightId}`)
      } else {
        setShowAuth(true)
      }
    } catch {
      // Supabase not connected yet — go straight to booking
      router.push(`/book/${flightId}`)
    }
    setChecking(false)
  }

  return (
    <>
      <button
        onClick={handleClick}
        disabled={checking}
        className="btn-primary w-full justify-center text-base py-3.5 rounded-xl"
      >
        {checking ? 'Loading...' : 'Book Now →'}
      </button>

      <AuthModal
        open={showAuth}
        onClose={() => setShowAuth(false)}
        redirectTo={`/book/${flightId}`}
      />
    </>
  )
}
