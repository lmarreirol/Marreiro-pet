import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function POST(req: NextRequest) {
  try {
    const { clinicName, ownerName, username, password, email, phone, plan } = await req.json()

    if (!clinicName || !ownerName || !username || !password) {
      return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 })
    }

    // Generate unique slug
    let slug = slugify(clinicName)
    const existing = await prisma.tenant.findUnique({ where: { slug } })
    if (existing) slug = `${slug}-${Date.now().toString(36)}`

    const existingUser = await prisma.user.findUnique({ where: { username } })
    if (existingUser) {
      return NextResponse.json({ error: 'Nome de usuário já em uso' }, { status: 409 })
    }

    const hash = await bcrypt.hash(password, 10)

    const tenant = await prisma.$transaction(async tx => {
      const t = await tx.tenant.create({
        data: {
          slug,
          name: clinicName,
          plan: (plan as 'FREE' | 'PRO' | 'ENTERPRISE') ?? 'FREE',
          active: true,
        },
      })

      await tx.tenantUnit.create({
        data: {
          tenantId: t.id,
          unitKey: 'principal',
          name: clinicName,
          phone: phone ?? null,
        },
      })

      await tx.tenantService.createMany({
        data: [
          { tenantId: t.id, serviceType: 'vet', enabled: true },
        ],
      })

      await tx.user.create({
        data: {
          name: ownerName,
          username,
          password: hash,
          role: 'ADMIN',
          tenantId: t.id,
          email: email ?? null,
        },
      })

      return t
    })

    return NextResponse.json({ tenantId: tenant.id, slug: tenant.slug }, { status: 201 })
  } catch (err) {
    console.error('[tenants/create]', err)
    return NextResponse.json({ error: 'Erro ao criar conta' }, { status: 500 })
  }
}
