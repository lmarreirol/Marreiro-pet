import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const PACKAGE_DURATION: Record<string, number> = {
  'banho': 30,
  'banho-tosa': 45,
  'spa': 60,
}

const ADDON_DURATION: Record<string, number> = {
  'hidra': 5,
  'ozonio': 5,
  'dentes': 0,
  'unhas': 15,
  'perfume': 5,
  'coloracao': 30,
}

const ALL_SLOTS = ['08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30','12:00','12:30','13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30']
const DEFAULT_SLOTS = ALL_SLOTS

function getSlotsBlockedByAppointment(time: string, pkg: string | null, addons: string[]): string[] {
  const durationMin = (PACKAGE_DURATION[pkg ?? ''] ?? 30) + addons.reduce((s, a) => s + (ADDON_DURATION[a] ?? 0), 0)
  const slotsNeeded = Math.ceil(durationMin / 30)
  const startIdx = ALL_SLOTS.indexOf(time)
  if (startIdx === -1) return []
  return ALL_SLOTS.slice(startIdx, startIdx + slotsNeeded)
}

// GET /api/availability?professional=victor&date=2024-04-21
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const professional = searchParams.get('professional')
  const date = searchParams.get('date')

  if (!professional || !date) {
    return NextResponse.json({ error: 'professional e date são obrigatórios' }, { status: 400 })
  }

  // Busca slots cadastrados pelo admin
  const record = await prisma.availability.findUnique({
    where: { professional_date: { professional, date: new Date(date) } },
  })

  let availableSlots: string[] = record?.slots ?? []

  // Busca agendamentos confirmados ou aguardando pagamento para esse profissional nessa data
  const start = new Date(`${date}T00:00:00.000Z`)
  const end = new Date(`${date}T23:59:59.999Z`)

  const bookedAppointments = await prisma.appointment.findMany({
    where: {
      professional,
      appointmentDate: { gte: start, lte: end },
      status: { in: ['AWAITING_PAYMENT', 'CONFIRMED'] },
    },
    select: { appointmentTime: true, package: true, addons: true },
  })

  // Remove os slots bloqueados pelos agendamentos existentes
  const blockedSlots = new Set<string>()
  for (const apt of bookedAppointments) {
    const blocked = getSlotsBlockedByAppointment(apt.appointmentTime, apt.package, apt.addons)
    blocked.forEach(s => blockedSlots.add(s))
  }

  if (availableSlots.length > 0) {
    availableSlots = availableSlots.filter(s => !blockedSlots.has(s))
  } else {
    // Se não há disponibilidade cadastrada, usa DEFAULT_SLOTS (sem 12:00 e 12:30)
    availableSlots = DEFAULT_SLOTS.filter(s => !blockedSlots.has(s))
  }

  return NextResponse.json({ slots: availableSlots })
}

// POST /api/availability — salva slots disponíveis para um profissional em uma data
export async function POST(req: NextRequest) {
  const adminKey = req.headers.get('x-admin-key')
  if (adminKey !== process.env.ADMIN_KEY) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { professional, unitId, date, slots } = await req.json()

  if (!professional || !unitId || !date || !Array.isArray(slots)) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  const record = await prisma.availability.upsert({
    where: { professional_date: { professional, date: new Date(date) } },
    update: { slots },
    create: { professional, unitId, date: new Date(date), slots },
  })

  return NextResponse.json(record)
}
