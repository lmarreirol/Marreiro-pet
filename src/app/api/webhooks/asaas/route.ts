import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('asaas-access-token')
    if (process.env.ASAAS_WEBHOOK_TOKEN && token !== process.env.ASAAS_WEBHOOK_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { event, payment } = body

    if (!payment?.externalReference) return NextResponse.json({ ok: true })

    const apptId = payment.externalReference

    if (event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED') {
      await prisma.appointment.update({
        where: { id: apptId },
        data: { status: 'CONFIRMED', paymentStatus: 'APPROVED', paymentId: payment.id },
      })
    }

    if (event === 'PAYMENT_OVERDUE' || event === 'PAYMENT_DELETED') {
      await prisma.appointment.update({
        where: { id: apptId },
        data: { paymentStatus: 'REJECTED' },
      })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[Asaas webhook]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
