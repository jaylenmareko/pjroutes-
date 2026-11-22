'use client'
import { useState } from 'react'

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('sending')
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setStatus(res.ok ? 'done' : 'error')
  }

  if (status === 'done') return (
    <main className="pt-20 min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-ink mb-2">Message sent.</h1>
        <p className="text-muted">We'll get back to you within 24 hours.</p>
      </div>
    </main>
  )

  return (
    <main className="pt-20 min-h-screen">
      <div className="max-w-lg mx-auto px-4 py-16">
        <h1 className="text-3xl font-extrabold text-ink mb-2">Contact</h1>
        <p className="text-muted mb-8">Questions, partnerships, or operator inquiries — send us a message.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">Name</label>
            <input className="input w-full" required placeholder="Your name"
              value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">Email</label>
            <input type="email" className="input w-full" required placeholder="you@example.com"
              value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">Message</label>
            <textarea className="input w-full h-32 resize-none" required placeholder="How can we help?"
              value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} />
          </div>
          {status === 'error' && <p className="text-red-500 text-sm">Something went wrong. Try again.</p>}
          <button type="submit" disabled={status === 'sending'} className="btn-primary w-full justify-center py-3">
            {status === 'sending' ? 'Sending...' : 'Send Message'}
          </button>
        </form>
      </div>
    </main>
  )
}
