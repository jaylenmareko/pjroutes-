import { NextRequest, NextResponse } from 'next/server'
import { getResend } from '@/lib/clients/resend'
import { sanitize } from '@/lib/sanitize'
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
  if (!rateLimit(ip, { max: 5, windowMs: 60_000 })) return rateLimitResponse()
  const raw = await req.json()
  const { name, email, message } = sanitize(raw) as { name: string; email: string; message: string }
  if (!name || !email || !message) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  await getResend().emails.send({
    from: 'support@pjroutes.com',
    to: process.env.ADMIN_EMAIL!,
    replyTo: email,
    subject: `Contact form — ${name}`,
    html: `<p><strong>From:</strong> ${name} (${email})</p><p>${message.replace(/\n/g, '<br>')}</p>`,
  })

  return NextResponse.json({ ok: true })
}
