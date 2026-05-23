import { NextRequest, NextResponse } from 'next/server'
import { getResend } from '@/lib/clients/resend'
import { supabaseAdmin } from '@/lib/clients/supabase'
import { sanitize } from '@/lib/sanitize'
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
  if (!rateLimit(ip, { max: 5, windowMs: 60_000 })) return rateLimitResponse()

  const raw = await req.json()
  const { from, to, date, time, passengers, name, email, phone } = sanitize(raw) as {
    from: string; to: string; date: string; time: string; passengers: number
    name: string; email: string; phone: string
  }
  if (!from || !to || !date || !name || !email) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  await supabaseAdmin.from('flight_requests').insert({
    from_location: from,
    to_location: to,
    depart_date: date,
    preferred_time: time || null,
    passengers: Number(passengers) || 1,
    full_name: name,
    email,
    phone: phone || null,
  })

  await getResend().emails.send({
    from: 'support@pjroutes.com',
    to: process.env.ADMIN_EMAIL!,
    replyTo: email,
    subject: `Flight Request — ${from} → ${to} (${name})`,
    html: `
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone:</strong> ${phone || '—'}</p>
      <hr/>
      <p><strong>Route:</strong> ${from} → ${to}</p>
      <p><strong>Date:</strong> ${date}</p>
      <p><strong>Time:</strong> ${time || 'Flexible'}</p>
      <p><strong>Passengers:</strong> ${passengers}</p>
    `,
  })

  return NextResponse.json({ ok: true })
}
