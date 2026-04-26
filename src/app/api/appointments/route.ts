import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { AppointmentPayload } from '@/types'
import { asaasCreateOrFindCustomer, asaasCreatePixPayment, asaasCreateCardPayment } from '@/lib/asaas'

async function autoAssignProfessional(unitId: string, date: string, time: string, service?: string | null): Promise<string | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const proWhere: any = { unitId, active: true }
  if (service) {
    proWhere.OR = [
      { services: { has: service } },
      { services: { isEmpty: true } },
    ]
  }
  const rows = await prisma.professional.findMany({ where: proWhere, select: { slug: true } })
  const professionals = rows.map(r => r.slug)
  if (!professionals.length) return null

  const dateOnly = date.split('T')[0] // normaliza ISO completo ou só data
  const start = new Date(`${dateOnly}T00:00:00.000Z`)
  const end   = new Date(`${dateOnly}T23:59:59.999Z`)

  const appointments = await prisma.appointment.findMany({
    where: { unitId, appointmentDate: { gte: start, lte: end }, status: { not: 'CANCELLED' } },
    select: { appointmentTime: true, professional: true },
  })

  // remove pros already booked at this slot
  const busyAtSlot = new Set(appointments.filter(a => a.appointmentTime === time).map(a => a.professional).filter(Boolean))
  const available = professionals.filter(p => !busyAtSlot.has(p))
  if (!available.length) return null

  // pick the one with fewest appointments today
  const countByPro = Object.fromEntries(professionals.map(p => [p, 0]))
  for (const a of appointments) { if (a.professional && countByPro[a.professional] !== undefined) countByPro[a.professional]++ }
  available.sort((a, b) => countByPro[a] - countByPro[b])
  return available[0]
}

export async function POST(req: NextRequest) {
  try {
    const body: AppointmentPayload = await req.json()

    const {
      serviceType, package: pkg, addons, unitId, professional,
      petName, petBreed, petSize, tutorName, tutorCpf, phone, email,
      date, time, notes, totalPrice, isVip, paymentMethod,
    } = body

    if (!tutorName || !phone || !petName || !unitId || !date || !time || !serviceType) {
      return NextResponse.json({ error: 'Campos obrigatórios ausentes' }, { status: 400 })
    }

    const dateOnly = date.split('T')[0]
    const appointmentDate = new Date(`${dateOnly}T${time}:00`)

    // Auto-atribui profissional se "Sem preferência"
    const resolvedProfessional = (professional === 'any' || !professional)
      ? await autoAssignProfessional(unitId, dateOnly, time, pkg ?? null)
      : professional

    // Cria o agendamento com status AWAITING_PAYMENT
    const appointment = await prisma.appointment.create({
      data: {
        serviceType,
        package: pkg ?? null,
        addons: addons ?? [],
        unitId,
        professional: resolvedProfessional ?? null,
        petName,
        petBreed: petBreed ?? null,
        petSize: petSize ?? null,
        tutorName,
        tutorCpf: tutorCpf ?? null,
        phone,
        email: email ?? null,
        appointmentDate,
        appointmentTime: time,
        notes: notes ?? null,
        isVip: isVip ?? false,
        totalPrice,
        status: 'AWAITING_PAYMENT',
        paymentStatus: 'PENDING',
      },
    })

    const successUrl = `${process.env.NEXT_PUBLIC_URL}/agendamento/sucesso?id=${appointment.id}`
    let invoiceUrl: string | null = null

    // Cria pagamento via Asaas (PIX ou Cartão)
    try {
      if (tutorCpf && process.env.ASAAS_API_KEY) {
        const apptDateOnly = appointment.appointmentDate.toISOString().split('T')[0]
        const description = `Agendamento ${serviceType === 'grooming' ? 'Banho & Tosa' : 'Clínica'} — ${petName}`
        const customer = await asaasCreateOrFindCustomer(tutorName, tutorCpf, phone, email ?? undefined)
        if (customer?.id) {
          const paymentArgs = { customerId: customer.id, value: Number(totalPrice), dueDate: apptDateOnly, description, externalReference: appointment.id }
          if (paymentMethod === 'card') {
            const payment = await asaasCreateCardPayment({ ...paymentArgs, successUrl })
            if (payment?.id) {
              invoiceUrl = payment.invoiceUrl ?? null
              await prisma.appointment.update({ where: { id: appointment.id }, data: { paymentId: payment.id } })
            }
          } else {
            const payment = await asaasCreatePixPayment(paymentArgs)
            if (payment?.id) {
              await prisma.appointment.update({ where: { id: appointment.id }, data: { paymentId: payment.id } })
            }
          }
        }
      }
    } catch (asaasErr) {
      console.error('[Asaas] Erro ao criar pagamento:', asaasErr)
    }

    const proRecord = resolvedProfessional
      ? await prisma.professional.findFirst({ where: { slug: resolvedProfessional }, select: { name: true } })
      : null

    return NextResponse.json({
      appointmentId: appointment.id,
      checkoutUrl: successUrl,
      invoiceUrl,
      professional: resolvedProfessional,
      professionalName: proRecord?.name ?? resolvedProfessional ?? null,
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
