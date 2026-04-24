import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const user = session.user as Record<string, unknown>
  const tenantId = user.tenantId as string | undefined

  const body = await req.json()
  const { petId, prescriptions, examOrders, ...data } = body

  const record = await prisma.medicalRecord.create({
    data: {
      ...data,
      petId,
      tenantId: tenantId ?? null,
      prescriptions: prescriptions?.length
        ? { create: prescriptions }
        : undefined,
      examOrders: examOrders?.length
        ? { create: examOrders }
        : undefined,
    },
    include: { prescriptions: true, examOrders: true, pet: { include: { client: true } } },
  })
  return NextResponse.json(record, { status: 201 })
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const user = session.user as Record<string, unknown>
  const tenantId = user.tenantId as string | undefined

  const { searchParams } = new URL(req.url)
  const petId = searchParams.get('petId')

  const records = await prisma.medicalRecord.findMany({
    where: {
      ...(tenantId ? { tenantId } : {}),
      ...(petId ? { petId } : {}),
    },
    orderBy: { date: 'desc' },
    include: { prescriptions: true, examOrders: true, pet: { select: { name: true, species: true, client: { select: { id: true, name: true, phone: true } } } } },
  })
  return NextResponse.json({ records })
}
