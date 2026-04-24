import { NextRequest, NextResponse } from 'next/server'
import { getStripe, PLANS, type PlanKey } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const { tenantId, plan, email } = await req.json()
    if (!tenantId || !plan || !email) {
      return NextResponse.json({ error: 'tenantId, plan e email são obrigatórios' }, { status: 400 })
    }

    const planKey = plan as PlanKey
    const planConfig = PLANS[planKey]
    if (!planConfig || !planConfig.priceId) {
      return NextResponse.json({ error: 'Plano inválido ou sem preço configurado' }, { status: 400 })
    }

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } })
    if (!tenant) return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 404 })

    const stripe = getStripe()

    // Create or reuse Stripe customer
    let customerId = tenant.stripeCustomerId
    if (!customerId) {
      const customer = await stripe.customers.create({ email, name: tenant.name, metadata: { tenantId } })
      customerId = customer.id
      await prisma.tenant.update({ where: { id: tenantId }, data: { stripeCustomerId: customerId } })
    }

    const baseUrl = process.env.NEXT_PUBLIC_URL ?? 'http://localhost:3000'
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: planConfig.priceId, quantity: 1 }],
      success_url: `${baseUrl}/admin/dashboard?upgrade=success`,
      cancel_url: `${baseUrl}/planos?canceled=1`,
      metadata: { tenantId, plan: planKey },
      subscription_data: { metadata: { tenantId, plan: planKey } },
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('[stripe/checkout]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
