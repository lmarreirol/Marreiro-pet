import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // MP envia type="payment" com o id do pagamento
    if (body.type !== 'payment') {
      return NextResponse.json({ ok: true })
    }

    const paymentRes = await fetch(`https://api.mercadopago.com/v1/payments/${body.data.id}`, {
      headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
    })
    const payment = await paymentRes.json()

    const appointmentId = payment.external_reference
    if (!appointmentId) return NextResponse.json({ ok: true })

    const statusMap: Record<string, { paymentStatus: string; status: string }> = {
      approved:    { paymentStatus: 'APPROVED',  status: 'CONFIRMED' },
      rejected:    { paymentStatus: 'REJECTED',  status: 'AWAITING_PAYMENT' },
      refunded:    { paymentStatus: 'REFUNDED',  status: 'CANCELLED' },
      cancelled:   { paymentStatus: 'REJECTED',  status: 'CANCELLED' },
    }

    const mapped = statusMap[payment.status]
    if (!mapped) return NextResponse.json({ ok: true })

    await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        paymentStatus: mapped.paymentStatus as never,
        status: mapped.status as never,
      },
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[webhook/mercadopago]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
