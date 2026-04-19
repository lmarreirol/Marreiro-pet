import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { AppointmentPayload } from '@/types'

export async function POST(req: NextRequest) {
  try {
    const body: AppointmentPayload = await req.json()

    const {
      serviceType, package: pkg, addons, unitId, professional,
      petName, petBreed, petSize, tutorName, phone, email,
      date, time, notes, totalPrice,
    } = body

    if (!tutorName || !phone || !petName || !unitId || !date || !time || !serviceType) {
      return NextResponse.json({ error: 'Campos obrigatórios ausentes' }, { status: 400 })
    }

    const [hour, minute] = time.split(':').map(Number)
    const appointmentDate = new Date(date)
    appointmentDate.setHours(hour, minute, 0, 0)

    // Cria o agendamento com status AWAITING_PAYMENT
    const appointment = await prisma.appointment.create({
      data: {
        serviceType,
        package: pkg ?? null,
        addons: addons ?? [],
        unitId,
        professional: professional ?? null,
        petName,
        petBreed: petBreed ?? null,
        petSize: petSize ?? null,
        tutorName,
        phone,
        email: email ?? null,
        appointmentDate,
        appointmentTime: time,
        notes: notes ?? null,
        totalPrice,
        status: 'AWAITING_PAYMENT',
        paymentStatus: 'PENDING',
      },
    })

    // Cria a preferência no Mercado Pago
    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        items: [
          {
            title: `Agendamento ${serviceType} — ${petName}`,
            quantity: 1,
            unit_price: Number(totalPrice),
            currency_id: 'BRL',
          },
        ],
        payer: { name: tutorName, phone: { number: phone }, email: email ?? '' },
        back_urls: {
          success: `${process.env.NEXT_PUBLIC_URL}/agendamento/sucesso?id=${appointment.id}`,
          failure: `${process.env.NEXT_PUBLIC_URL}/agendamento/falha?id=${appointment.id}`,
          pending: `${process.env.NEXT_PUBLIC_URL}/agendamento/pendente?id=${appointment.id}`,
        },
        auto_return: 'approved',
        notification_url: `${process.env.NEXT_PUBLIC_URL}/api/webhooks/mercadopago`,
        external_reference: appointment.id,
        statement_descriptor: 'MARREIRO PET',
      }),
    })

    const mpData = await mpResponse.json()

    if (!mpResponse.ok) {
      throw new Error(mpData.message ?? 'Erro ao criar preferência no Mercado Pago')
    }

    // Salva o ID da preferência MP no agendamento
    await prisma.appointment.update({
      where: { id: appointment.id },
      data: { paymentId: mpData.id },
    })

    return NextResponse.json({
      appointmentId: appointment.id,
      checkoutUrl: mpData.init_point,
    }, { status: 201 })

  } catch (err) {
    console.error('[POST /api/appointments]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function GET() {
  const appointments = await prisma.appointment.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
  })
  return NextResponse.json(appointments)
}
