import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await auth()
  const user = session?.user as Record<string, unknown> | undefined
  // Only super-admins (tenantId === marreiro-pet tenant or no tenantId restriction via ADMIN_KEY header)
  const adminKey = req.headers.get('x-admin-key')
  const isSuperAdmin = adminKey === process.env.ADMIN_KEY || user?.role === 'ADMIN'

  if (!isSuperAdmin) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      units: { select: { id: true, name: true, active: true } },
      services: { select: { serviceType: true, enabled: true } },
      _count: { select: { units: true } },
    },
  })

  return NextResponse.json({ tenants })
}

export async function PATCH(req: NextRequest) {
  const session = await auth()
  const user = session?.user as Record<string, unknown> | undefined
  const adminKey = req.headers.get('x-admin-key')
  const isSuperAdmin = adminKey === process.env.ADMIN_KEY || user?.role === 'ADMIN'

  if (!isSuperAdmin) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

  const { id, ...data } = await req.json()
  const tenant = await prisma.tenant.update({ where: { id }, data })
  return NextResponse.json(tenant)
}
