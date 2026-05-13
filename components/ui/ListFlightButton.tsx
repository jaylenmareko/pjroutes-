'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/clients/supabase-browser'
import AuthModal from './AuthModal'

export default function ListFlightButton() {
  const router = useRouter()
  const [showAuth, setShowAuth] = useState(false)

  async function handleClick() {
    try {
      const supabase = createClient()
      const { data } = await supabase.auth.getUser()
      if (data.user) {
        router.push('/operator')
      } else {
        setShowAuth(true)
      }
    } catch {
      router.push('/operator')
    }
  }

  return (
    <>
      <button onClick={handleClick} className="btn-primary px-10 py-4 text-base">
        List a Flight →
      </button>

      <AuthModal
        open={showAuth}
        onClose={() => setShowAuth(false)}
        redirectTo="/operator"
      />
    </>
  )
}
