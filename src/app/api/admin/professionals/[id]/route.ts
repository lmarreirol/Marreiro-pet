import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function requireAdmin() {
  const session = await auth()
  const user = session?.user as { role?: string } | undefined
  if (!session || user?.role !== 'ADMIN') return null
  return session
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await params
  const body = await req.json()
  const data: Record<string, unknown> = {}
  if (body.name !== undefined) data.name = body.name
  if (body.unitId !== undefined) data.unitId = body.unitId
  if (body.active !== undefined) data.active = body.active
  if (body.services !== undefined) data.services = body.services
  const pro = await prisma.professional.update({ where: { id }, data })
  return NextResponse.json(pro)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await params
  await prisma.professional.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
