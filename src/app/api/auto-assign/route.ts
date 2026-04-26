import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const unitId = searchParams.get('unitId')
  const date   = searchParams.get('date')
  const time   = searchParams.get('time')

  if (!unitId || !date || !time) {
    return NextResponse.json({ professional: null })
  }

  const rows = await prisma.professional.findMany({ where: { unitId, active: true }, select: { slug: true } })
  const professionals = rows.map(r => r.slug)
  if (!professionals.length) return NextResponse.json({ professional: null })

  const dateOnly = date.split('T')[0]
  const start = new Date(`${dateOnly}T00:00:00.000Z`)
  const end   = new Date(`${dateOnly}T23:59:59.999Z`)

  const appointments = await prisma.appointment.findMany({
    where: { unitId, appointmentDate: { gte: start, lte: end }, status: { not: 'CANCELLED' } },
    select: { appointmentTime: true, professional: true },
  })

  const busyAtSlot = new Set(
    appointments.filter(a => a.appointmentTime === time).map(a => a.professional).filter(Boolean)
  )
  const available = professionals.filter(p => !busyAtSlot.has(p))
  if (!available.length) return NextResponse.json({ professional: null })

  const countByPro = Object.fromEntries(professionals.map(p => [p, 0]))
  for (const a of appointments) {
    if (a.professional && countByPro[a.professional] !== undefined) countByPro[a.professional]++
  }
  available.sort((a, b) => countByPro[a] - countByPro[b])

  return NextResponse.json({ professional: available[0] })
}
