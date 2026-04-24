import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const user = session.user as Record<string, unknown>
  const tenantId = user.tenantId as string | undefined
  const userUnitId = user.unitId as string | undefined
  const isAdmin = user.role === 'ADMIN'

  const { searchParams } = new URL(req.url)
  const period = searchParams.get('period') ?? '30'
  const unitFilter = searchParams.get('unitId')
  const sellerFilter = searchParams.get('sellerId')
  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = 30

  const start = new Date()
  start.setDate(start.getDate() - parseInt(period))
  start.setHours(0, 0, 0, 0)

  const where: Record<string, unknown> = {
    createdAt: { gte: start },
    status: 'completed',
    ...(tenantId ? { tenantId } : {}),
    ...(!isAdmin && userUnitId ? { unitId: userUnitId } : {}),
  }
  if (unitFilter && unitFilter !== 'all') where.unitId = unitFilter
  if (sellerFilter && sellerFilter !== 'all') where.sellerId = sellerFilter

  const [sales, total] = await Promise.all([
    prisma.sale.findMany({
      where,
      include: { items: true },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.sale.count({ where }),
  ])

  // KPIs
  const allSales = await prisma.sale.findMany({
    where,
    select: { total: true, paymentMethod: true, sellerId: true, sellerName: true },
  })
  const totalRevenue = allSales.reduce((s, sale) => s + Number(sale.total), 0)
  const byPayment: Record<string, number> = {}
  for (const s of allSales) {
    byPayment[s.paymentMethod] = (byPayment[s.paymentMethod] ?? 0) + Number(s.total)
  }

  return NextResponse.json({ sales, total, pages: Math.ceil(total / limit), totalRevenue, byPayment })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const user = session.user as Record<string, unknown>
  const tenantId = user.tenantId as string | undefined

  const body = await req.json()
  const { unitId, sellerId, sellerName, clientName, clientPhone, clientId, items, discount, paymentMethod, amountPaid, notes } = body

  if (!items?.length || !unitId || !paymentMethod) {
    return NextResponse.json({ error: 'Campos obrigatórios: items, unitId, paymentMethod' }, { status: 400 })
  }

  const subtotal = items.reduce((s: number, i: { price: number; quantity: number }) => s + i.price * i.quantity, 0)
  const discountAmt = discount ?? 0
  const total = Math.max(0, subtotal - discountAmt)
  const change = amountPaid != null ? Math.max(0, amountPaid - total) : null

  const sale = await prisma.$transaction(async (tx) => {
    // Decrement stock for tracked products
    for (const item of items) {
      if (item.productId) {
        const product = await tx.product.findUnique({ where: { id: item.productId }, select: { trackStock: true, stock: true } })
        if (product?.trackStock) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          })
        }
      }
    }

    return tx.sale.create({
      data: {
        tenantId: tenantId ?? null,
        unitId,
        sellerId: sellerId ?? null,
        sellerName: sellerName ?? null,
        clientName: clientName ?? null,
        clientPhone: clientPhone ?? null,
        clientId: clientId ?? null,
        subtotal,
        discount: discountAmt,
        total,
        paymentMethod,
        amountPaid: amountPaid ?? null,
        change,
        notes: notes ?? null,
        status: 'completed',
        items: {
          create: items.map((i: { productId?: string; name: string; price: number; quantity: number }) => ({
            productId: i.productId ?? null,
            name: i.name,
            price: i.price,
            quantity: i.quantity,
            subtotal: i.price * i.quantity,
          })),
        },
      },
      include: { items: true },
    })
  })

  return NextResponse.json(sale, { status: 201 })
}
