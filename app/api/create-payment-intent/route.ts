import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/clients/stripe'
import { supabase } from '@/lib/clients/supabase'

const PLATFORM_FEE = 0.25

export async function POST(req: NextRequest) {
  const { flightId, paymentMethod } = await req.json()

  const { data: flight } = await supabase
    .from('flights')
    .select('price')
    .eq('id', flightId)
    .single()

  if (!flight) return NextResponse.json({ error: 'Flight not found' }, { status: 404 })

  // Buyer pays operator price + 25% platform fee
  const buyerPrice = Math.round(flight.price * (1 + PLATFORM_FEE))

  // Stripe processing fee (passed to buyer transparently)
  const stripeFee = paymentMethod === 'ach'
    ? Math.min(500, Math.round(buyerPrice * 0.008))
    : Math.round(buyerPrice * 0.029 + 30)

  const total = buyerPrice + stripeFee

  const intent = await stripe.paymentIntents.create({
    amount: total,
    currency: 'usd',
    payment_method_types: paymentMethod === 'ach' ? ['us_bank_account'] : ['card'],
    metadata: {
      flightId,
      operator_payout: flight.price,
      platform_fee: Math.round(flight.price * PLATFORM_FEE),
    },
  })

  return NextResponse.json({ clientSecret: intent.client_secret, buyerPrice, stripeFee, total })
}
