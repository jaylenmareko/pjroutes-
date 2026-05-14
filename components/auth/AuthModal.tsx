'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { X, Mail } from 'lucide-react'
import { createClient } from '@/lib/clients/supabase-browser'

interface Props {
  open: boolean
  onClose: () => void
  redirectTo: string
}

export default function AuthModal({ open, onClose, redirectTo }: Props) {
  const router = useRouter()
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [cooldown, setCooldown] = useState(0)

  // Reset on open
  useEffect(() => {
    if (open) {
      setStep('email')
      setEmail('')
      setCode('')
      setError('')
    }
  }, [open])

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  // Lock scroll
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  const supabase = createClient()

  async function sendCode(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    })
    if (error) { setError(error.message); setLoading(false); return }
    setStep('code')
    setCooldown(60)
    setLoading(false)
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.verifyOtp({ email, token: code, type: 'email' })
    if (error) { setError('Invalid or expired code. Try again.'); setLoading(false); return }
    onClose()
    router.push(redirectTo)
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8"
        onClick={e => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted hover:text-ink transition-colors"
        >
          <X size={18} />
        </button>

        {/* Logo */}
        <div className="mb-6">
          <span className="font-bold text-ink tracking-tight text-lg">PJRoutes</span>
        </div>

        {step === 'email' ? (
          <>
            <h2 className="text-xl font-extrabold text-ink mb-1">Welcome to PJRoutes</h2>
            <p className="text-sm text-muted mb-6">Enter your email address to continue.</p>

            <form onSubmit={sendCode} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
                  Email address
                </label>
                <input
                  type="email"
                  className="input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoFocus
                />
                <p className="text-xs text-muted mt-1.5">We&apos;ll send a code to log you in.</p>
              </div>

              {error && <p className="text-xs text-red-500">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full justify-center py-3 rounded-xl"
              >
                {loading ? 'Sending...' : 'Continue'}
              </button>
            </form>

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-xs text-muted">Or</span>
              </div>
            </div>

            <button
              onClick={() => {}}
              className="w-full flex items-center justify-center gap-2.5 border border-border rounded-xl py-3 text-sm font-medium text-ink hover:bg-surface transition-colors"
            >
              <Mail size={15} className="text-muted" />
              Continue with Email
            </button>
          </>
        ) : (
          <>
            <h2 className="text-xl font-extrabold text-ink mb-1">Check your email</h2>
            <p className="text-sm text-muted mb-1">We sent a 6-digit code to</p>
            <p className="text-sm font-semibold text-ink mb-6">{email}</p>

            <form onSubmit={verifyCode} className="space-y-3">
              <input
                type="text"
                inputMode="numeric"
                maxLength={8}
                className="input text-center text-2xl font-bold tracking-[0.35em] py-4"
                placeholder="000000"
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
                required
                autoFocus
              />

              {error && <p className="text-xs text-red-500 text-center">{error}</p>}

              <button
                type="submit"
                disabled={loading || code.length < 6}
                className="btn-primary w-full justify-center py-3 rounded-xl"
              >
                {loading ? 'Verifying...' : 'Verify & Continue'}
              </button>
            </form>

            <div className="flex justify-between mt-4 text-xs text-muted">
              <button onClick={() => { setStep('email'); setCode(''); setError('') }} className="hover:text-ink transition-colors">
                ← Change email
              </button>
              <button
                onClick={async () => {
                  if (cooldown > 0) return
                  await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } })
                  setCooldown(60)
                }}
                disabled={cooldown > 0}
                className="hover:text-ink transition-colors disabled:opacity-40"
              >
                {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
