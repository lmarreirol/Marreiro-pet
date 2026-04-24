import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const user = session.user as Record<string, unknown>
  const tenantId = user.tenantId as string | undefined
  const unitId = user.unitId as string | undefined
  const isAdmin = user.role === 'ADMIN'

  const { searchParams } = new URL(req.url)
  const period = searchParams.get('period') ?? '30' // days
  const unitFilter = searchParams.get('unitId')
  const serviceFilter = searchParams.get('serviceType')
  const statusFilter = searchParams.get('status')
  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = 20

  const start = new Date()
  start.setDate(start.getDate() - parseInt(period))
  start.setHours(0, 0, 0, 0)
  const end = new Date()
  end.setHours(23, 59, 59, 999)

  const baseWhere: Record<string, unknown> = {
    appointmentDate: { gte: start, lte: end },
    ...(tenantId ? { tenantId } : {}),
    ...(!isAdmin && unitId ? { unitId } : {}),
  }
  if (unitFilter && unitFilter !== 'all') baseWhere.unitId = unitFilter
  if (serviceFilter && serviceFilter !== 'all') baseWhere.serviceType = serviceFilter
  if (statusFilter && statusFilter !== 'all') baseWhere.status = statusFilter

  const [allAppts, total] = await Promise.all([
    prisma.appointment.findMany({
      where: baseWhere,
      orderBy: { appointmentDate: 'desc' },
    }),
    prisma.appointment.count({ where: baseWhere }),
  ])

  // Totals by status
  const byStatus: Record<string, { count: number; revenue: number }> = {}
  for (const a of allAppts) {
    if (!byStatus[a.status]) byStatus[a.status] = { count: 0, revenue: 0 }
    byStatus[a.status].count++
    if (a.status === 'COMPLETED') byStatus[a.status].revenue += Number(a.totalPrice)
  }

  // Revenue by unit
  const byUnit: Record<string, number> = {}
  for (const a of allAppts) {
    if (a.status === 'COMPLETED') {
      byUnit[a.unitId] = (byUnit[a.unitId] ?? 0) + Number(a.totalPrice)
    }
  }

  // Revenue by service
  const byService: Record<string, number> = {}
  for (const a of allAppts) {
    if (a.status === 'COMPLETED') {
      byService[a.serviceType] = (byService[a.serviceType] ?? 0) + Number(a.totalPrice)
    }
  }

  // Daily chart (last period)
  const dayMap: Record<string, { revenue: number; count: number }> = {}
  for (let i = parseInt(period) - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    dayMap[d.toISOString().split('T')[0]] = { revenue: 0, count: 0 }
  }
  for (const a of allAppts) {
    const key = (a.appointmentDate as Date).toISOString().split('T')[0]
    if (dayMap[key]) {
      dayMap[key].count++
      if (a.status === 'COMPLETED') dayMap[key].revenue += Number(a.totalPrice)
    }
  }
  const chartData = Object.entries(dayMap).map(([date, v]) => ({
    date,
    label: new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }),
    revenue: v.revenue,
    count: v.count,
  }))

  // Paginated rows
  const rows = allAppts.slice((page - 1) * limit, page * limit)

  const totalRevenue = allAppts.filter(a => a.status === 'COMPLETED').reduce((s, a) => s + Number(a.totalPrice), 0)

  return NextResponse.json({
    totalRevenue,
    total,
    byStatus,
    byUnit,
    byService,
    chartData,
    rows,
    pages: Math.ceil(total / limit),
  })
}
