import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const ALL_SLOTS = ['08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30','12:00','12:30','13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30']
const WORK_START = 8 * 60 // 08:00

const PKG_DURATION: Record<string, number> = { 'banho': 30, 'banho-tosa': 45, 'spa': 60 }
const SIZE_FACTOR: Record<string, number> = { small: 1, medium: 1.3, large: 1.7 }
const ADDON_DURATION: Record<string, number> = { 'hidra': 5, 'ozonio': 5, 'dentes': 0, 'unhas': 15, 'perfume': 5, 'coloracao': 30 }

function toMin(slot: string) {
  const [h, m] = slot.split(':').map(Number)
  return h * 60 + m
}

function calcDuration(pkg: string, addons: string[], petSize: string): number {
  const base = PKG_DURATION[pkg] ?? 30
  const sized = Math.ceil(base * (SIZE_FACTOR[petSize] ?? 1))
  return sized + addons.reduce((s, a) => s + (ADDON_DURATION[a] ?? 0), 0)
}

export type SmartSuggestion = {
  time: string
  professional: string
  professionalName: string
  score: number
  reason: string
  gapBefore: number
  gapAfter: number
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { unitId, pkg, addons = [], petSize = 'medium', date } = body as {
    unitId: string; pkg: string; addons: string[]; petSize: string; date: string
  }

  if (!unitId || !pkg || !date) {
    return NextResponse.json({ error: 'unitId, pkg e date são obrigatórios' }, { status: 400 })
  }

  const duration = calcDuration(pkg, addons, petSize)
  const slotsNeeded = Math.ceil(duration / 30)

  // Professionals eligible for this service
  const rows = await prisma.professional.findMany({
    where: { unitId, active: true },
    select: { slug: true, name: true, services: true },
  })
  // If services not configured, treat all as eligible
  const eligible = rows.filter(p => p.services.length === 0 || p.services.includes(pkg))
  const pros = eligible.length > 0 ? eligible : rows
  if (!pros.length) return NextResponse.json({ suggestions: [] })

  // Appointments for the day
  const dateOnly = date.split('T')[0]
  const dayStart = new Date(`${dateOnly}T00:00:00.000Z`)
  const dayEnd   = new Date(`${dateOnly}T23:59:59.999Z`)
  const appts = await prisma.appointment.findMany({
    where: { unitId, appointmentDate: { gte: dayStart, lte: dayEnd }, status: { not: 'CANCELLED' } },
    select: { appointmentTime: true, professional: true, package: true, addons: true },
  })

  // Build per-professional data structures
  type Block = { startMin: number; endMin: number }
  const occupiedSlots = new Map<string, Set<string>>()   // slug → occupied slot strings
  const blocks = new Map<string, Block[]>()               // slug → sorted appointment blocks

  for (const a of appts) {
    if (!a.professional || !a.appointmentTime) continue
    const apptDuration = Math.ceil((PKG_DURATION[a.package ?? ''] ?? 30) * 1)
    const apptSlots = Math.ceil(apptDuration / 30)
    const startIdx = ALL_SLOTS.indexOf(a.appointmentTime)
    if (startIdx === -1) continue

    if (!occupiedSlots.has(a.professional)) occupiedSlots.set(a.professional, new Set())
    for (let i = 0; i < apptSlots; i++) {
      if (ALL_SLOTS[startIdx + i]) occupiedSlots.get(a.professional)!.add(ALL_SLOTS[startIdx + i])
    }

    if (!blocks.has(a.professional)) blocks.set(a.professional, [])
    const startMin = toMin(a.appointmentTime)
    blocks.get(a.professional)!.push({ startMin, endMin: startMin + apptDuration })
  }

  // Sort blocks per pro
  for (const [, b] of blocks) b.sort((a, b) => a.startMin - b.startMin)

  // Generate and score candidates
  const candidates: SmartSuggestion[] = []

  for (const pro of pros) {
    const occupied = occupiedSlots.get(pro.slug) ?? new Set<string>()
    const proBlocks = blocks.get(pro.slug) ?? []

    for (let i = 0; i <= ALL_SLOTS.length - slotsNeeded; i++) {
      const startSlot = ALL_SLOTS[i]
      const needed = ALL_SLOTS.slice(i, i + slotsNeeded)
      if (needed.some(s => occupied.has(s))) continue

      const startMin = toMin(startSlot)
      const endMin = startMin + duration

      // Nearest appointment ending before this slot
      const prev = proBlocks.filter(b => b.endMin <= startMin).at(-1)
      // Nearest appointment starting after this slot ends
      const next = proBlocks.find(b => b.startMin >= endMin)

      const gapBefore = prev ? startMin - prev.endMin : startMin - WORK_START
      const gapAfter  = next ? next.startMin - endMin : 0

      // Score = total dead time created (lower = better)
      // Adjacent slots (gapBefore=0 or gapAfter=0) get a bonus
      const adjacencyBonus = (gapBefore === 0 ? 15 : 0) + (gapAfter === 0 ? 10 : 0)
      const score = gapBefore + gapAfter - adjacencyBonus

      // Human-readable reason
      let reason: string
      if (gapBefore === 0 && gapAfter === 0) {
        reason = 'Preenche lacuna exata entre agendamentos'
      } else if (gapBefore === 0) {
        reason = 'Logo após agendamento existente'
      } else if (gapAfter === 0) {
        reason = 'Imediatamente antes do próximo agendamento'
      } else if (prev) {
        reason = `${gapBefore} min livre antes do próximo`
      } else {
        reason = 'Início disponível da agenda'
      }

      candidates.push({ time: startSlot, professional: pro.slug, professionalName: pro.name, score, reason, gapBefore, gapAfter })
    }
  }

  // Sort by score, then deduplicate by (time, professional)
  candidates.sort((a, b) => a.score - b.score)
  const seen = new Set<string>()
  const suggestions = candidates.filter(c => {
    const key = `${c.time}|${c.professional}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  }).slice(0, 5)

  return NextResponse.json({ suggestions, duration, slotsNeeded })
}
