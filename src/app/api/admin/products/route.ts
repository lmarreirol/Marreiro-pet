import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q') ?? ''
  const category = searchParams.get('category')
  const activeOnly = searchParams.get('active') !== 'false'

  const user = session.user as Record<string, unknown>
  const tenantId = user.tenantId as string | undefined

  const products = await prisma.product.findMany({
    where: {
      ...(tenantId ? { tenantId } : {}),
      ...(activeOnly ? { active: true } : {}),
      ...(category && category !== 'all' ? { category } : {}),
      ...(q ? { name: { contains: q, mode: 'insensitive' } } : {}),
    },
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
  })

  return NextResponse.json({ products })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const user = session.user as Record<string, unknown>
  const tenantId = user.tenantId as string | undefined

  const body = await req.json()
  const { name, description, price, costPrice, category, barcode, stock, trackStock, unitId } = body

  if (!name || price === undefined) {
    return NextResponse.json({ error: 'name e price são obrigatórios' }, { status: 400 })
  }

  const product = await prisma.product.create({
    data: {
      name,
      description: description ?? null,
      price,
      costPrice: costPrice ?? null,
      category: category ?? 'produto',
      barcode: barcode ?? null,
      stock: stock ?? 0,
      trackStock: trackStock ?? true,
      unitId: unitId ?? null,
      tenantId: tenantId ?? null,
    },
  })

  return NextResponse.json(product, { status: 201 })
}
