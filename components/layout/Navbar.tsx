'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/clients/supabase-browser'
import AuthModal from '@/components/auth/AuthModal'
import { ChevronDown } from 'lucide-react'

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [showAuth, setShowAuth] = useState(false)
  const [authRedirect, setAuthRedirect] = useState('/bookings')
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? null)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email ?? null)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function requireAuth(destination: string) {
    try {
      const supabase = createClient()
      const { data } = await supabase.auth.getUser()
      if (data.user) {
        router.push(destination)
      } else {
        setAuthRedirect(destination)
        setShowAuth(true)
      }
    } catch {
      router.push(destination)
    }
  }

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    setDropdownOpen(false)
    router.push('/')
  }

  const link = (href: string, label: string) => (
    <Link
      href={href}
      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
        pathname === href ? 'bg-surface text-ink' : 'text-muted hover:text-ink'
      }`}
    >
      {label}
    </Link>
  )

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0 font-bold text-ink tracking-tight text-lg">
            PJRoutes
          </Link>

          {/* Nav links — centered */}
          <div className="flex-1 flex items-center justify-center gap-1">
            {link('/flights', 'Browse Routes')}
            {userEmail && (
              <button
                onClick={() => router.push('/bookings')}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  pathname === '/bookings' ? 'bg-surface text-ink' : 'text-muted hover:text-ink'
                }`}
              >
                My Bookings
              </button>
            )}
          </div>

          {/* Right */}
          <div className="flex-shrink-0 flex items-center gap-2">
            {userEmail ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(o => !o)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium text-muted hover:text-ink transition-colors"
                >
                  <span className="max-w-[140px] truncate">{userEmail}</span>
                  <ChevronDown size={14} />
                </button>
                {dropdownOpen && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-border rounded-xl shadow-lg py-1 z-50">
                    <button
                      onClick={() => { router.push('/operator'); setDropdownOpen(false) }}
                      className="w-full text-left px-4 py-2 text-sm text-ink hover:bg-surface transition-colors"
                    >
                      List a Flight
                    </button>
                    <button
                      onClick={() => { router.push('/bookings'); setDropdownOpen(false) }}
                      className="w-full text-left px-4 py-2 text-sm text-ink hover:bg-surface transition-colors"
                    >
                      My Bookings
                    </button>
                    <div className="border-t border-border my-1" />
                    <button
                      onClick={signOut}
                      className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-surface transition-colors"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => requireAuth('/operator')}
                className="btn-primary py-1.5 px-4 text-xs"
              >
                List a Flight
              </button>
            )}
            {!userEmail && (
              <button
                onClick={() => requireAuth('/bookings')}
                className="px-3 py-1.5 rounded-full text-sm font-medium text-muted hover:text-ink transition-colors"
              >
                Sign in
              </button>
            )}
          </div>
        </div>
      </nav>

      <AuthModal
        open={showAuth}
        onClose={() => setShowAuth(false)}
        redirectTo={authRedirect}
      />
    </>
  )
}
