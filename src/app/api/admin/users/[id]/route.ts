import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

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
  if (body.role !== undefined) data.role = body.role
  if (body.unitId !== undefined) data.unitId = body.unitId || null
  if (body.password) data.password = await bcrypt.hash(body.password, 10)
  const user = await prisma.user.update({
    where: { id },
    data,
    select: { id: true, username: true, name: true, role: true, unitId: true },
  })
  return NextResponse.json(user)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await params
  await prisma.user.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
