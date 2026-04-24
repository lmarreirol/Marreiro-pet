import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const unitId      = searchParams.get('unitId')
  const date        = searchParams.get('date')
  const serviceType = searchParams.get('serviceType')

  if (!unitId || !date || !serviceType) {
    return NextResponse.json({ error: 'unitId, date e serviceType são obrigatórios' }, { status: 400 })
  }

  const start = new Date(`${date}T00:00:00.000Z`)
  const end   = new Date(`${date}T23:59:59.999Z`)

  const appointments = await prisma.appointment.findMany({
    where: {
      unitId,
      serviceType,
      appointmentDate: { gte: start, lte: end },
      status: { not: 'CANCELLED' },
    },
    select: { appointmentTime: true },
  })

  const bookedTimes = appointments
    .map(a => a.appointmentTime)
    .filter(Boolean) as string[]

  return NextResponse.json({ bookedTimes })
}
