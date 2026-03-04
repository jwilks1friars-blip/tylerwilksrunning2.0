import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'

async function postToSlack(webhookUrl: string, text: string) {
  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  })
}

export async function POST(request: NextRequest) {
  const stripe = getStripe()
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')!

  let event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as any
    const userId = session.metadata.supabase_user_id
    const tier = session.metadata.tier

    await supabase
      .from('profiles')
      .update({ plan_tier: tier })
      .eq('id', userId)

    if (process.env.SLACK_WEBHOOK_PAYMENTS) {
      const amount = session.amount_total ? `$${(session.amount_total / 100).toFixed(2)}` : 'unknown'
      await postToSlack(
        process.env.SLACK_WEBHOOK_PAYMENTS,
        [
          `*Payment received* :money_with_wings:`,
          `*Tier:* ${tier}  |  *Amount:* ${amount}`,
          `*Customer:* ${session.customer_email}`,
        ].join('\n')
      )
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as any
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('stripe_customer_id', subscription.customer)
      .single()

    if (profile) {
      await supabase
        .from('profiles')
        .update({ plan_tier: 'none' })
        .eq('id', profile.id)
    }
  }

  return NextResponse.json({ received: true })
}
