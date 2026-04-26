import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const unitId = searchParams.get('unitId')
  const service = searchParams.get('service')

  if (!unitId) return NextResponse.json({ professionals: [] })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { unitId, active: true }

  // If service specified, include pros with that service OR with empty services (eligible for all)
  if (service) {
    where.OR = [
      { services: { has: service } },
      { services: { isEmpty: true } },
    ]
  }

  const pros = await prisma.professional.findMany({
    where,
    select: { slug: true, name: true, services: true },
    orderBy: { name: 'asc' },
  })

  return NextResponse.json({ professionals: pros })
}
