import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(_req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const user = session.user as Record<string, unknown>
  const tenantId = user.tenantId as string | undefined
  const unitId = user.unitId as string | undefined
  const isAdmin = user.role === 'ADMIN'

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date()
  todayEnd.setHours(23, 59, 59, 999)

  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - 6)
  weekStart.setHours(0, 0, 0, 0)

  const baseWhere = {
    ...(tenantId ? { tenantId } : {}),
    ...(!isAdmin && unitId ? { unitId } : {}),
  }

  const [todayAppts, pendingAppts, completedToday, weekAppts, recentAppts] = await Promise.all([
    // Total de agendamentos hoje
    prisma.appointment.count({
      where: { ...baseWhere, appointmentDate: { gte: todayStart, lte: todayEnd }, status: { not: 'CANCELLED' } },
    }),
    // Pendentes de confirmação
    prisma.appointment.count({
      where: { ...baseWhere, status: 'AWAITING_PAYMENT', appointmentDate: { gte: todayStart } },
    }),
    // Concluídos hoje
    prisma.appointment.findMany({
      where: { ...baseWhere, appointmentDate: { gte: todayStart, lte: todayEnd }, status: 'COMPLETED' },
      select: { totalPrice: true, serviceType: true },
    }),
    // Últimos 7 dias (para gráfico)
    prisma.appointment.findMany({
      where: { ...baseWhere, appointmentDate: { gte: weekStart, lte: todayEnd }, status: { not: 'CANCELLED' } },
      select: { appointmentDate: true, totalPrice: true, serviceType: true, status: true },
    }),
    // Próximos agendamentos do dia
    prisma.appointment.findMany({
      where: { ...baseWhere, appointmentDate: { gte: todayStart, lte: todayEnd }, status: { not: 'CANCELLED' } },
      orderBy: { appointmentTime: 'asc' },
      take: 8,
      select: {
        id: true, petName: true, tutorName: true, phone: true,
        appointmentTime: true, serviceType: true, package: true,
        status: true, unitId: true, totalPrice: true, professional: true,
      },
    }),
  ])

  const revenueToday = completedToday.reduce((s, a) => s + Number(a.totalPrice), 0)

  // Gráfico: receita por dia nos últimos 7 dias
  const dayMap: Record<string, { revenue: number; count: number }> = {}
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().split('T')[0]
    dayMap[key] = { revenue: 0, count: 0 }
  }
  for (const a of weekAppts) {
    const key = (a.appointmentDate as Date).toISOString().split('T')[0]
    if (dayMap[key]) {
      dayMap[key].count++
      if (a.status === 'COMPLETED') dayMap[key].revenue += Number(a.totalPrice)
    }
  }
  const chartData = Object.entries(dayMap).map(([date, v]) => ({
    date,
    label: new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric' }),
    revenue: v.revenue,
    count: v.count,
  }))

  // Serviços do dia por tipo
  const groomingToday = weekAppts.filter(a => {
    const key = (a.appointmentDate as Date).toISOString().split('T')[0]
    return key === todayStart.toISOString().split('T')[0] && a.serviceType === 'grooming'
  }).length
  const vetToday = weekAppts.filter(a => {
    const key = (a.appointmentDate as Date).toISOString().split('T')[0]
    return key === todayStart.toISOString().split('T')[0] && a.serviceType === 'vet'
  }).length

  return NextResponse.json({
    kpis: {
      todayAppts,
      pendingAppts,
      revenueToday,
      completedToday: completedToday.length,
      groomingToday,
      vetToday,
    },
    chartData,
    recentAppts,
  })
}
