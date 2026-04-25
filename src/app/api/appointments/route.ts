import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { AppointmentPayload } from '@/types'
import { PROFESSIONALS_BY_UNIT } from '@/data/professionals'
import { asaasCreateOrFindCustomer, asaasCreatePixPayment } from '@/lib/asaas'

async function autoAssignProfessional(unitId: string, date: string, time: string): Promise<string | null> {
  const professionals = PROFESSIONALS_BY_UNIT[unitId]
  if (!professionals?.length) return null

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
      date, time, notes, totalPrice, isVip,
    } = body

    if (!tutorName || !phone || !petName || !unitId || !date || !time || !serviceType) {
      return NextResponse.json({ error: 'Campos obrigatórios ausentes' }, { status: 400 })
    }

    const dateOnly = date.split('T')[0]
    const appointmentDate = new Date(`${dateOnly}T${time}:00`)

    // Auto-atribui profissional se "Sem preferência"
    const resolvedProfessional = (professional === 'any' || !professional)
      ? await autoAssignProfessional(unitId, dateOnly, time)
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

    // Cria pagamento PIX via Asaas
    try {
      if (tutorCpf && process.env.ASAAS_API_KEY) {
        const customer = await asaasCreateOrFindCustomer(tutorName, tutorCpf, phone, email ?? undefined)
        if (customer?.id) {
          const dateOnly = appointment.appointmentDate.toISOString().split('T')[0]
          const payment = await asaasCreatePixPayment({
            customerId: customer.id,
            value: Number(totalPrice),
            dueDate: dateOnly,
            description: `Agendamento ${serviceType === 'grooming' ? 'Banho & Tosa' : 'Clínica'} — ${petName}`,
            externalReference: appointment.id,
          })
          if (payment?.id) {
            await prisma.appointment.update({ where: { id: appointment.id }, data: { paymentId: payment.id } })
          }
        }
      }
    } catch (asaasErr) {
      console.warn('[Asaas] Erro ao criar pagamento PIX:', asaasErr)
    }

    const checkoutUrl = `${process.env.NEXT_PUBLIC_URL}/agendamento/sucesso?id=${appointment.id}`
    return NextResponse.json({ appointmentId: appointment.id, checkoutUrl, professional: resolvedProfessional }, { status: 201 })

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
