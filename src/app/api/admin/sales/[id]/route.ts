import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const { id } = await params
  const sale = await prisma.sale.findUnique({ where: { id }, include: { items: { include: { product: true } } } })
  if (!sale) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
  return NextResponse.json(sale)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const user = session?.user as { role?: string } | undefined
  if (!session || user?.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const { status } = await req.json()
  const sale = await prisma.sale.update({ where: { id }, data: { status } })
  return NextResponse.json(sale)
}
