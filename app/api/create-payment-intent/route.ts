import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/clients/stripe'
import { supabase } from '@/lib/clients/supabase'
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit'

const PLATFORM_FEE = 0.25

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
  if (!rateLimit(ip, { max: 10, windowMs: 60_000 })) return rateLimitResponse()

  const { flightId } = await req.json()

  const { data: flight } = await supabase
    .from('flights')
    .select('price')
    .eq('id', flightId)
    .single()

  if (!flight) return NextResponse.json({ error: 'Flight not found' }, { status: 404 })

  const buyerPrice = Math.round(flight.price * (1 + PLATFORM_FEE))

  const intent = await stripe.paymentIntents.create({
    amount: buyerPrice,
    currency: 'usd',
    payment_method_types: ['card', 'us_bank_account'],
    payment_method_options: {
      us_bank_account: {
        financial_connections: { permissions: ['payment_method'] },
      },
    },
    metadata: {
      flightId,
      operator_payout: flight.price,
      platform_fee: Math.round(flight.price * PLATFORM_FEE),
    },
  })

  return NextResponse.json({ clientSecret: intent.client_secret, total: buyerPrice })
}
