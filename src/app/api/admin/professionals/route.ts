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
  const pros = await prisma.professional.findMany({ orderBy: [{ unitId: 'asc' }, { name: 'asc' }] })
  return NextResponse.json(pros)
}

export async function POST(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { name, slug, unitId } = await req.json()
  if (!name || !slug || !unitId) return NextResponse.json({ error: 'name, slug e unitId são obrigatórios' }, { status: 400 })
  const cleanSlug = slug.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  const exists = await prisma.professional.findUnique({ where: { slug: cleanSlug } })
  if (exists) return NextResponse.json({ error: 'Já existe um profissional com esse ID' }, { status: 409 })
  const pro = await prisma.professional.create({ data: { name, slug: cleanSlug, unitId, active: true } })
  return NextResponse.json(pro, { status: 201 })
}
