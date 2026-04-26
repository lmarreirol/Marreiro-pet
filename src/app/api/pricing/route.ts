import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// ─── Configurações de ocupação ────────────���───────────────────────────────────
const OCC_LOW       = 0.30   // abaixo → desconto
const OCC_HIGH      = 0.70   // acima  → premium
const OCC_MAX_BONUS = 0.20   // máximo +20% por ocupação
const OCC_MAX_DISC  = 0.10   // máximo -10% por ocupação
const PRO_CAPACITY  = 8      // agendamentos esperados por profissional/dia

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * Math.max(0, Math.min(1, t))
}

function occupancyFactor(occ: number): number {
  if (occ < OCC_LOW)  return lerp(1 - OCC_MAX_DISC, 1.0, occ / OCC_LOW)
  if (occ > OCC_HIGH) return lerp(1.0, 1 + OCC_MAX_BONUS, (occ - OCC_HIGH) / (1 - OCC_HIGH))
  return 1.0
}

function tier(m: number): string {
  if (m < 0.95)  return 'cheap'
  if (m <= 1.05) return 'normal'
  if (m <= 1.20) return 'busy'
  return 'premium'
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const unitId    = searchParams.get('unitId')
  const startDate = searchParams.get('startDate')
  const endDate   = searchParams.get('endDate')

  if (!unitId || !startDate || !endDate) return NextResponse.json({})

  // Regras ativas para esta unidade + globais
  const rules = await prisma.priceRule.findMany({
    where: { active: true, OR: [{ unitId }, { unitId: null }] },
  })

  // Capacidade diária
  const proCount = await prisma.professional.count({ where: { unitId, active: true } })
  const capacity = Math.max(1, proCount * PRO_CAPACITY)

  // Agendamentos no período para cálculo de ocupação
  const start = new Date(`${startDate}T00:00:00.000Z`)
  const end   = new Date(`${endDate}T23:59:59.999Z`)
  const appts = await prisma.appointment.findMany({
    where: { unitId, appointmentDate: { gte: start, lte: end }, status: { not: 'CANCELLED' } },
    select: { appointmentDate: true },
  })

  const countByDate: Record<string, number> = {}
  for (const a of appts) {
    const d = a.appointmentDate.toISOString().split('T')[0]
    countByDate[d] = (countByDate[d] ?? 0) + 1
  }

  const result: Record<string, { multiplier: number; pctChange: number; tier: string; label: string }> = {}

  const cur = new Date(`${startDate}T12:00:00Z`)
  const last = new Date(`${endDate}T12:00:00Z`)

  while (cur <= last) {
    const dateStr = cur.toISOString().split('T')[0]
    const dow = new Date(`${dateStr}T12:00:00`).getDay()

    // Aplica regras manuais multiplicando todas as aplicáveis
    let manual = 1.0
    const labels: string[] = []

    for (const rule of rules) {
      let applies = false
      if (rule.type === 'dow') {
        applies = rule.value.split(',').map(Number).includes(dow)
      } else if (rule.type === 'date') {
        applies = rule.value === dateStr
      } else if (rule.type === 'range') {
        const [s, e] = rule.value.split(',')
        applies = dateStr >= s && dateStr <= e
      }
      if (applies) {
        manual *= rule.multiplier
        if (rule.label) labels.push(rule.label)
      }
    }

    // Fator de ocupação
    const occ = Math.min(1, (countByDate[dateStr] ?? 0) / capacity)
    const occF = occupancyFactor(occ)

    // Multiplicador final (arredondado a 2 casas)
    const multiplier = Math.round(manual * occF * 100) / 100
    const pctChange  = Math.round((multiplier - 1) * 100)
    const t = tier(multiplier)

    const autoLabel = t === 'cheap' ? 'Baixa demanda' : t === 'busy' ? 'Alta demanda' : t === 'premium' ? 'Muito procurado' : ''
    const label = labels.length ? labels.join(' · ') : autoLabel

    // Inclui somente datas que diferem do normal ou têm regra manual
    if (t !== 'normal' || manual !== 1.0) {
      result[dateStr] = { multiplier, pctChange, tier: t, label }
    }

    cur.setUTCDate(cur.getUTCDate() + 1)
  }

  return NextResponse.json(result)
}
