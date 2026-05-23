import { NextRequest, NextResponse } from 'next/server'
import { getResend } from '@/lib/clients/resend'
import { sanitize } from '@/lib/sanitize'
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
  if (!rateLimit(ip, { max: 5, windowMs: 60_000 })) return rateLimitResponse()

  const raw = await req.json()
  const { from, to, date, time, passengers } = sanitize(raw) as {
    from: string; to: string; date: string; time: string; passengers: number
  }
  if (!from || !to || !date) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  await getResend().emails.send({
    from: 'support@pjroutes.com',
    to: process.env.ADMIN_EMAIL!,
    subject: `Flight Request — ${from} → ${to}`,
    html: `
      <p><strong>Route:</strong> ${from} → ${to}</p>
      <p><strong>Date:</strong> ${date}</p>
      <p><strong>Time:</strong> ${time || 'Flexible'}</p>
      <p><strong>Passengers:</strong> ${passengers}</p>
    `,
  })

  return NextResponse.json({ ok: true })
}
