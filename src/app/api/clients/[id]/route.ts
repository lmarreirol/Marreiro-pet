import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const { id } = await params
  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      pets: {
        include: {
          records: {
            orderBy: { date: 'desc' },
            take: 5,
            select: { id: true, date: true, avaliacao: true, vetName: true, status: true },
          },
        },
      },
    },
  })
  if (!client) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
  return NextResponse.json(client)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const { id } = await params
  const body = await req.json()
  const client = await prisma.client.update({ where: { id }, data: body })
  return NextResponse.json(client)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const { id } = await params
  await prisma.client.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
