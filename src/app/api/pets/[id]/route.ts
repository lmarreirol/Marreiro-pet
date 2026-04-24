import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const { id } = await params
  const pet = await prisma.pet.findUnique({
    where: { id },
    include: {
      client: { select: { id: true, name: true, phone: true } },
      records: {
        orderBy: { date: 'desc' },
        include: { prescriptions: true, examOrders: true },
      },
    },
  })
  if (!pet) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
  return NextResponse.json(pet)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const { id } = await params
  const body = await req.json()
  const pet = await prisma.pet.update({ where: { id }, data: body })
  return NextResponse.json(pet)
}
