'use client'
import { useState } from 'react'
import { Shield } from 'lucide-react'

const initialForm = {
  from_city: '', from_airport: '', from_state: '',
  to_city: '', to_airport: '', to_state: '',
  depart_start: '', depart_end: '',
  price: '', seats: '',
  aircraft_type: '', aircraft_tail: '',
  jet_size: 'light',
  has_wifi: false, pets_allowed: false, standup_cabin: false,
  operator_name: '', operator_email: '', operator_phone: '',
}

export default function OperatorPage() {
  const [form, setForm] = useState(initialForm)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  function set(k: string, v: string | boolean) {
    setForm(f => ({ ...f, [k]: v }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await fetch('/api/operator-submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSubmitted(true)
    setLoading(false)
  }

  if (submitted) {
    return (
      <div className="pt-14 min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
            <Shield className="text-green-600" size={24} />
          </div>
          <h1 className="text-2xl font-extrabold text-ink mb-2">Submission received.</h1>
          <p className="text-muted text-sm">We review all listings within 24 hours. We&apos;ll reach out if we need anything.</p>
        </div>
      </div>
    )
  }

  const Section = ({ title }: { title: string }) => (
    <h2 className="font-semibold text-ink text-sm border-b border-border pb-2 mb-4">{title}</h2>
  )

  return (
    <div className="pt-14 min-h-screen">
      {/* Header */}
      <div className="bg-ink text-white py-10 px-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-extrabold mb-2">List an Empty Leg</h1>
          <p className="text-white/60 text-sm">Listings are reviewed within 24 hours before going live. All fields required.</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Route */}
          <div>
            <Section title="Route" />
            <div className="grid grid-cols-3 gap-3 mb-3">
              {[['from_city','From city','Dallas'],['from_airport','Airport code','DAL'],['from_state','State','TX']].map(([k, label, ph]) => (
                <div key={k}>
                  <label className="block text-xs text-muted mb-1">{label}</label>
                  <input className="input" placeholder={ph} required value={form[k as keyof typeof form] as string} onChange={e => set(k, e.target.value)} />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[['to_city','To city','Houston'],['to_airport','Airport code','IAH'],['to_state','State','TX']].map(([k, label, ph]) => (
                <div key={k}>
                  <label className="block text-xs text-muted mb-1">{label}</label>
                  <input className="input" placeholder={ph} required value={form[k as keyof typeof form] as string} onChange={e => set(k, e.target.value)} />
                </div>
              ))}
            </div>
          </div>

          {/* Departure window */}
          <div>
            <Section title="Departure window" />
            <div className="grid grid-cols-2 gap-3">
              {[['depart_start','Earliest departure'],['depart_end','Latest departure']].map(([k, label]) => (
                <div key={k}>
                  <label className="block text-xs text-muted mb-1">{label}</label>
                  <input type="datetime-local" className="input" required value={form[k as keyof typeof form] as string} onChange={e => set(k, e.target.value)} />
                </div>
              ))}
            </div>
          </div>

          {/* Aircraft */}
          <div>
            <Section title="Aircraft" />
            <div className="grid grid-cols-2 gap-3 mb-3">
              {[['aircraft_type','Aircraft type','Citation CJ3'],['aircraft_tail','Tail number','N760JP']].map(([k, label, ph]) => (
                <div key={k}>
                  <label className="block text-xs text-muted mb-1">{label}</label>
                  <input className="input" placeholder={ph} required value={form[k as keyof typeof form] as string} onChange={e => set(k, e.target.value)} />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs text-muted mb-1">Jet size</label>
                <select className="input" value={form.jet_size} onChange={e => set('jet_size', e.target.value)}>
                  <option value="light">Light Jet</option>
                  <option value="midsize">Midsize</option>
                  <option value="super_midsize">Super Midsize</option>
                  <option value="heavy">Heavy Jet</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">Max passengers</label>
                <input type="number" min="1" max="19" className="input" placeholder="6" required value={form.seats} onChange={e => set('seats', e.target.value)} />
              </div>
            </div>
            <div className="flex gap-6">
              {[['has_wifi','Wi-Fi'],['pets_allowed','Pets welcome'],['standup_cabin','Stand-up cabin']].map(([k, label]) => (
                <label key={k} className="flex items-center gap-2 text-sm text-muted cursor-pointer">
                  <input type="checkbox" checked={form[k as keyof typeof form] as boolean} onChange={e => set(k, e.target.checked)} className="rounded border-border accent-primary" />
                  {label}
                </label>
              ))}
            </div>
          </div>

          {/* Pricing */}
          <div>
            <Section title="Price" />
            <div>
              <label className="block text-xs text-muted mb-1">Price (USD)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted text-sm">$</span>
                <input type="number" min="500" className="input pl-7" placeholder="4,500" required value={form.price} onChange={e => set('price', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Operator info */}
          <div>
            <Section title="Your information" />
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-muted mb-1">Company name</label>
                <input className="input" required value={form.operator_name} onChange={e => set('operator_name', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">Email</label>
                <input type="email" className="input" required value={form.operator_email} onChange={e => set('operator_email', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">Phone</label>
                <input className="input" required value={form.operator_phone} onChange={e => set('operator_phone', e.target.value)} />
              </div>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-4 text-base">
            {loading ? 'Submitting...' : 'Submit for review'}
          </button>

          <p className="text-center text-xs text-muted">
            We verify all listings before publishing. Part 135 certification required.
          </p>
        </form>
      </div>
    </div>
  )
}
