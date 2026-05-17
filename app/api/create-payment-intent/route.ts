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

  // Get operator's stripe account for auto-split
  const { data: flightFull } = await supabase
    .from('flights')
    .select('stripe_account_id')
    .eq('id', flightId)
    .single()

  const platformFeeAmount = Math.round(flight.price * PLATFORM_FEE)
  const operatorAmount = flight.price

  const intentParams: Record<string, unknown> = {
    amount: buyerPrice,
    currency: 'usd',
    payment_method_types: ['us_bank_account'],
    payment_method_options: {
      us_bank_account: {
        financial_connections: { permissions: ['payment_method'] },
      },
    },
    metadata: {
      flightId,
      operator_payout: operatorAmount,
      platform_fee: platformFeeAmount,
    },
  }

  // Auto-split if operator has a connected account
  if (flightFull?.stripe_account_id) {
    intentParams.application_fee_amount = platformFeeAmount
    intentParams.transfer_data = { destination: flightFull.stripe_account_id }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const intent = await stripe.paymentIntents.create(intentParams as any)

  return NextResponse.json({ clientSecret: intent.client_secret, total: buyerPrice })
}
