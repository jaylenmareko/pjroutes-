import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/clients/supabase'
import { stripe } from '@/lib/clients/stripe'
import { getResend } from '@/lib/clients/resend'
import { sanitize } from '@/lib/sanitize'
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
  if (!rateLimit(ip, { max: 5, windowMs: 60_000 })) return rateLimitResponse()

  const body = sanitize(await req.json()) as Record<string, unknown>
  const operatorEmail = body.operator_email as string

  const photos = Array.isArray(body.photos)
    ? (body.photos as string[]).filter(url => typeof url === 'string' && url.trim().length > 0)
    : []

  // Look up operator's Stripe Connect account ID
  const { data: operator } = await supabaseAdmin
    .from('operators')
    .select('stripe_account_id, onboarding_complete')
    .eq('email', operatorEmail)
    .single()

  const stripeAccountId = operator?.onboarding_complete ? operator.stripe_account_id : null

  const { data, error } = await supabaseAdmin.from('flights').insert({
    ...body,
    price: Math.round(parseFloat(body.price as string) * 100),
    photos,
    stripe_account_id: stripeAccountId,
    status: 'pending',
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // Create or retrieve Connect account + onboarding link
  let connectUrl: string | null = null
  let alreadyConnected = false

  if (operator?.onboarding_complete) {
    alreadyConnected = true
  } else {
    try {
      let accountId = operator?.stripe_account_id
      if (!accountId) {
        const account = await stripe.accounts.create({
          type: 'express',
          email: operatorEmail,
          business_profile: { name: body.operator_name as string || operatorEmail },
          capabilities: { transfers: { requested: true }, card_payments: { requested: true } },
        })
        accountId = account.id
        await supabaseAdmin.from('operators').upsert({
          email: operatorEmail,
          stripe_account_id: accountId,
          onboarding_complete: false,
        }, { onConflict: 'email' })
      }
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://pjroutes.com'
      const link = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: `${appUrl}/operator/connect/refresh`,
        return_url: `${appUrl}/operator/connect/return?account_id=${accountId}`,
        type: 'account_onboarding',
      })
      connectUrl = link.url
    } catch { /* non-fatal — flight still created */ }
  }

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
        <p>Payout connected: ${alreadyConnected ? '✅ Yes' : '⏳ Pending onboarding'}</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin" style="color:#8C1C1C;font-weight:600">Review in admin →</a>
      </div>
    `,
  })

  return NextResponse.json({ id: data.id, connectUrl, alreadyConnected })
}
