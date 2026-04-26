import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function requireAdmin() {
  const session = await auth()
  const user = session?.user as { role?: string } | undefined
  if (!session || user?.role !== 'ADMIN') return null
  return session
}

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const rules = await prisma.priceRule.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json(rules)
}

export async function POST(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  try {
    const { unitId, type, value, multiplier, label, active } = await req.json()
    if (!type || !value || multiplier == null) {
      return NextResponse.json({ error: 'type, value e multiplier são obrigatórios' }, { status: 400 })
    }
    const rule = await prisma.priceRule.create({
      data: {
        unitId: unitId || null,
        type,
        value,
        multiplier: parseFloat(multiplier),
        label: label || null,
        active: active ?? true,
      },
    })
    return NextResponse.json(rule, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
