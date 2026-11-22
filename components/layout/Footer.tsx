'use client'
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/clients/supabase-browser'
import AuthModal from '@/components/auth/AuthModal'

export default function Footer() {
  const router = useRouter()
  const [showAuth, setShowAuth] = useState(false)

  async function handleOperatorsClick(e: React.MouseEvent) {
    e.preventDefault()
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
      <footer className="bg-white border-t border-border mt-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
            <div className="col-span-2 sm:col-span-1">
              <span className="font-bold text-ink text-lg">PJRoutes</span>
            </div>

            <div>
              <p className="text-xs font-semibold text-ink uppercase tracking-wider mb-3">Explore</p>
              <div className="space-y-2">
                <Link href="/flights" className="block text-sm text-muted hover:text-ink transition-colors">Search Flights</Link>
                <button
                  onClick={handleOperatorsClick}
                  className="block text-sm text-muted hover:text-ink transition-colors text-left"
                >
                  For Operators
                </button>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-ink uppercase tracking-wider mb-3">Company</p>
              <div className="space-y-2">
                <Link href="/#how-it-works" className="block text-sm text-muted hover:text-ink transition-colors">How It Works</Link>
                <Link href="/faq" className="block text-sm text-muted hover:text-ink transition-colors">FAQ</Link>
                <Link href="/contact" className="block text-sm text-muted hover:text-ink transition-colors">Contact</Link>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-ink uppercase tracking-wider mb-3">Legal</p>
              <div className="space-y-2">
                <Link href="/terms" className="block text-sm text-muted hover:text-ink transition-colors">Terms</Link>
                <Link href="/privacy" className="block text-sm text-muted hover:text-ink transition-colors">Privacy</Link>
              </div>
            </div>
          </div>
        </div>
      </footer>

      <AuthModal
        open={showAuth}
        onClose={() => setShowAuth(false)}
        redirectTo="/operator"
      />
    </>
  )
}
