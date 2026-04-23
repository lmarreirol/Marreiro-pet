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

export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const users = await prisma.user.findMany({
    select: { id: true, username: true, name: true, role: true, unitId: true },
    orderBy: { username: 'asc' },
  })
  return NextResponse.json(users)
}

export async function POST(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { username, name, password, role, unitId } = await req.json()
  if (!username || !password || !role) return NextResponse.json({ error: 'Campos obrigatórios: username, password, role' }, { status: 400 })
  const exists = await prisma.user.findUnique({ where: { username } })
  if (exists) return NextResponse.json({ error: 'Usuário já existe' }, { status: 409 })
  const hash = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({
    data: { username, name: name || username, password: hash, role, unitId: unitId || null },
    select: { id: true, username: true, name: true, role: true, unitId: true },
  })
  return NextResponse.json(user, { status: 201 })
}
