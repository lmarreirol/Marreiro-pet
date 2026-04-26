import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const ALL_SLOTS = ['08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30','12:00','12:30','13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30']

const PACKAGE_DURATION: Record<string, number> = { 'banho': 30, 'banho-tosa': 45, 'spa': 60 }
const ADDON_DURATION: Record<string, number> = { 'hidra': 5, 'ozonio': 5, 'dentes': 0, 'unhas': 15, 'perfume': 5, 'coloracao': 30 }

function getSlotsBlocked(time: string, pkg: string | null, addons: string[]): string[] {
  const durationMin = (PACKAGE_DURATION[pkg ?? ''] ?? 30) + addons.reduce((s, a) => s + (ADDON_DURATION[a] ?? 0), 0)
  const slotsNeeded = Math.ceil(durationMin / 30)
  const startIdx = ALL_SLOTS.indexOf(time)
  if (startIdx === -1) return []
  return ALL_SLOTS.slice(startIdx, startIdx + slotsNeeded)
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const unitId = searchParams.get('unitId')
  const date   = searchParams.get('date')

  if (!unitId || !date) {
    return NextResponse.json({ error: 'unitId e date são obrigatórios' }, { status: 400 })
  }

  const rows = await prisma.professional.findMany({ where: { unitId, active: true }, select: { slug: true } })
  const professionals = rows.map(r => r.slug)
  if (professionals.length === 0) {
    return NextResponse.json({ slots: ALL_SLOTS.map(time => ({ time, availableCount: 1 })) })
  }

  const start = new Date(`${date}T00:00:00.000Z`)
  const end   = new Date(`${date}T23:59:59.999Z`)

  const appointments = await prisma.appointment.findMany({
    where: { unitId, appointmentDate: { gte: start, lte: end }, status: { not: 'CANCELLED' } },
    select: { appointmentTime: true, professional: true, package: true, addons: true },
  })

  // marca todos os slots que cada profissional ocupa (considerando duração do serviço)
  const busy = new Map<string, Set<string>>() // slot → Set<professional>
  for (const a of appointments) {
    if (!a.professional || !a.appointmentTime) continue
    const blocked = getSlotsBlocked(a.appointmentTime, a.package, a.addons as string[])
    for (const slot of blocked) {
      if (!busy.has(slot)) busy.set(slot, new Set())
      busy.get(slot)!.add(a.professional)
    }
  }

  const slots = ALL_SLOTS.map(time => {
    const occupiedPros = busy.get(time) ?? new Set()
    const availableCount = professionals.filter(p => !occupiedPros.has(p)).length
    return { time, availableCount }
  })

  return NextResponse.json({ slots })
}
