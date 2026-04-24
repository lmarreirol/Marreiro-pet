import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const { id } = await params
  const record = await prisma.medicalRecord.findUnique({
    where: { id },
    include: {
      prescriptions: true,
      examOrders: true,
      pet: { include: { client: true } },
    },
  })
  if (!record) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
  return NextResponse.json(record)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const { id } = await params
  const body = await req.json()
  const record = await prisma.medicalRecord.update({
    where: { id },
    data: body,
    include: { prescriptions: true, examOrders: true },
  })
  return NextResponse.json(record)
}
