import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/clients/supabase'
import { getResend } from '@/lib/clients/resend'
import { sanitize } from '@/lib/sanitize'
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
  if (!rateLimit(ip, { max: 5, windowMs: 60_000 })) return rateLimitResponse()

  const body = sanitize(await req.json()) as Record<string, unknown>

  // Build photos array — operator URLs first, fallback by jet category
  const FALLBACK_PHOTOS: Record<string, string[]> = {
    light: [
      'https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=800&q=80',
      'https://images.unsplash.com/photo-1474302770737-173ee21bab63?w=800&q=80',
    ],
    midsize: [
      'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&q=80',
      'https://images.unsplash.com/photo-1474302770737-173ee21bab63?w=800&q=80',
    ],
    super_midsize: [
      'https://images.unsplash.com/photo-1545987796-200677ee1011?w=800&q=80',
      'https://images.unsplash.com/photo-1474302770737-173ee21bab63?w=800&q=80',
    ],
    heavy: [
      'https://images.unsplash.com/photo-1583206814776-0a7c26fbd4f5?w=800&q=80',
      'https://images.unsplash.com/photo-1474302770737-173ee21bab63?w=800&q=80',
    ],
  }

  const operatorPhotos = Array.isArray(body.photos)
    ? (body.photos as string[]).filter(url => typeof url === 'string' && url.trim().length > 0)
    : []

  const photos = operatorPhotos.length > 0
    ? operatorPhotos
    : FALLBACK_PHOTOS[body.jet_size as string] ?? FALLBACK_PHOTOS.light

  const { data, error } = await supabaseAdmin.from('flights').insert({
    ...body,
    price: Math.round(parseFloat(body.price as string) * 100),
    photos,
    status: 'pending',
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  await getResend().emails.send({
    from: 'support@pjroutes.com',
    to: process.env.ADMIN_EMAIL || 'support@pjroutes.com',
    subject: `New listing — ${body.from_city} → ${body.to_city}`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:500px;margin:0 auto;padding:24px">
        <h2>New operator submission.</h2>
        <p><strong>${body.from_city} → ${body.to_city}</strong></p>
        <p>${body.aircraft_type} · ${body.aircraft_tail} · $${Number(body.price).toLocaleString()}</p>
        <p>${body.operator_name} · ${body.operator_email}</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin" style="color:#8C1C1C;font-weight:600">Review in admin →</a>
      </div>
    `,
  })

  return NextResponse.json({ id: data.id })
}
