import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/clients/stripe'
import { supabaseAdmin } from '@/lib/clients/supabase'

export async function POST(req: NextRequest) {
  const { email, name } = await req.json()
  if (!email) return NextResponse.json({ error: 'Missing email' }, { status: 400 })

  // Check if operator already has a connected account
  const { data: existing } = await supabaseAdmin
    .from('operators')
    .select('stripe_account_id, onboarding_complete')
    .eq('email', email)
    .single()

  let accountId = existing?.stripe_account_id

  if (!accountId) {
    // Create a new Stripe Express account
    const account = await stripe.accounts.create({
      type: 'express',
      email,
      business_profile: { name: name || email },
      capabilities: {
        transfers: { requested: true },
        card_payments: { requested: true },
      },
    })
    accountId = account.id

    // Save to operators table
    await supabaseAdmin.from('operators').upsert({
      email,
      stripe_account_id: accountId,
      onboarding_complete: false,
    }, { onConflict: 'email' })
  }

  if (existing?.onboarding_complete) {
    return NextResponse.json({ alreadyConnected: true, accountId })
  }

  // Generate onboarding link
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://pjroutes.com'
  const link = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${appUrl}/operator/connect/refresh`,
    return_url: `${appUrl}/operator/connect/return?account_id=${accountId}`,
    type: 'account_onboarding',
  })

  return NextResponse.json({ url: link.url, accountId })
}
