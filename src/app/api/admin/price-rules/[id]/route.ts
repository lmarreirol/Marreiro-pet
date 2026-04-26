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
  try {
    const { id } = await params
    const body = await req.json()
    const data: Record<string, unknown> = {}
    if (body.unitId     !== undefined) data.unitId     = body.unitId || null
    if (body.type       !== undefined) data.type       = body.type
    if (body.value      !== undefined) data.value      = body.value
    if (body.multiplier !== undefined) data.multiplier = parseFloat(body.multiplier)
    if (body.label      !== undefined) data.label      = body.label || null
    if (body.active     !== undefined) data.active     = body.active
    const rule = await prisma.priceRule.update({ where: { id }, data })
    return NextResponse.json(rule)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  try {
    const { id } = await params
    await prisma.priceRule.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
