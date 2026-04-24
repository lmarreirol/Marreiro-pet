import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const user = session.user as Record<string, unknown>
  const tenantId = user.tenantId as string | undefined

  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q') ?? ''
  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = 20

  const where = {
    ...(tenantId ? { tenantId } : {}),
    ...(q ? {
      OR: [
        { name: { contains: q, mode: 'insensitive' as const } },
        { phone: { contains: q } },
        { cpf: { contains: q } },
      ],
    } : {}),
  }

  const [clients, total] = await Promise.all([
    prisma.client.findMany({
      where,
      include: { pets: { select: { id: true, name: true, species: true } } },
      orderBy: { name: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.client.count({ where }),
  ])

  return NextResponse.json({ clients, total, page, pages: Math.ceil(total / limit) })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) {
    console.error('[POST /api/clients] sem sessão — usuário não autenticado')
    return NextResponse.json({ error: 'Não autorizado. Faça login novamente.' }, { status: 401 })
  }
  const user = session.user as Record<string, unknown>
  const tenantId = user.tenantId as string | undefined

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Corpo da requisição inválido.' }, { status: 400 })
  }

  const { name, phone, cpf, email, address, notes } = body as Record<string, string | null | undefined>

  if (!name?.trim() || !phone?.trim()) {
    return NextResponse.json({ error: 'Nome e telefone são obrigatórios.' }, { status: 400 })
  }

  try {
    const client = await prisma.client.create({
      data: {
        name: name.trim(),
        phone: phone.trim(),
        cpf: cpf?.trim() || null,
        email: email?.trim() || null,
        address: address?.trim() || null,
        notes: notes?.trim() || null,
        tenantId: tenantId ?? null,
      },
      include: { pets: true },
    })
    return NextResponse.json(client, { status: 201 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[POST /api/clients] Prisma error:', msg)
    return NextResponse.json({ error: `Erro ao criar cliente: ${msg.split('\n')[0]}` }, { status: 500 })
  }
}
