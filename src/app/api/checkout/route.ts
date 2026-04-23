import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: NextRequest) {
  const { appointmentId } = await req.json()

  const apt = await prisma.appointment.findUnique({ where: { id: appointmentId } })
  if (!apt) return NextResponse.json({ error: 'Agendamento não encontrado' }, { status: 404 })

  const session = await stripe.checkout.sessions.create({
    ui_mode: 'embedded_page',
    mode: 'payment',
    currency: 'brl',
    payment_method_types: ['card'],
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'brl',
          unit_amount: Math.round(Number(apt.totalPrice) * 100),
          product_data: {
            name: `Marreiro Pet — ${apt.petName}`,
            description: apt.package ?? 'Serviço de grooming',
          },
        },
      },
    ],
    return_url: `${process.env.NEXT_PUBLIC_URL}/agendamento/sucesso?id=${appointmentId}&session_id={CHECKOUT_SESSION_ID}`,
    metadata: { appointmentId },
  })

  return NextResponse.json({ clientSecret: session.client_secret })
}
