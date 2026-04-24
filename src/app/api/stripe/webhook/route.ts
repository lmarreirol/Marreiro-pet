import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import type Stripe from 'stripe'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!
  const secret = process.env.STRIPE_WEBHOOK_SECRET!

  const stripe = getStripe()
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret)
  } catch (err) {
    console.error('[webhook] signature mismatch', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const planFromSub = (sub: Stripe.Subscription) => {
    const meta = sub.metadata?.plan
    if (meta === 'PRO' || meta === 'ENTERPRISE') return meta
    return 'FREE'
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const tenantId = session.metadata?.tenantId
      const plan = session.metadata?.plan
      if (tenantId && plan) {
        await prisma.tenant.update({
          where: { id: tenantId },
          data: {
            plan: plan as 'FREE' | 'PRO' | 'ENTERPRISE',
            stripeSubId: typeof session.subscription === 'string' ? session.subscription : null,
          },
        })
      }
      break
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const tenantId = sub.metadata?.tenantId
      if (tenantId) {
        const newPlan = planFromSub(sub)
        const active = sub.status === 'active' || sub.status === 'trialing'
        await prisma.tenant.update({
          where: { id: tenantId },
          data: { plan: newPlan as 'FREE' | 'PRO' | 'ENTERPRISE', active },
        })
      }
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      const tenantId = sub.metadata?.tenantId
      if (tenantId) {
        await prisma.tenant.update({
          where: { id: tenantId },
          data: { plan: 'FREE', stripeSubId: null },
        })
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
