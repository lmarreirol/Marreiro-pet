import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const user = session.user as Record<string, unknown>
  const tenantId = user.tenantId as string | undefined

  try {
    const body = await req.json()
    const { clientId, name, species, breed, gender, birthDate, weight, microchip, notes, color } = body

    if (!clientId || !name?.trim() || !species) {
      return NextResponse.json({ error: 'clientId, name e species são obrigatórios.' }, { status: 400 })
    }

    const pet = await prisma.pet.create({
      data: {
        clientId,
        name: name.trim(),
        species,
        breed: breed?.trim() || null,
        gender: gender || null,
        birthDate: birthDate ? new Date(birthDate) : null,
        weight: weight != null && weight !== '' ? Number(weight) : null,
        microchip: microchip?.trim() || null,
        notes: notes?.trim() || null,
        color: color?.trim() || null,
        tenantId: tenantId ?? null,
      },
    })
    return NextResponse.json(pet, { status: 201 })
  } catch (err) {
    console.error('[POST /api/pets]', err)
    return NextResponse.json({ error: 'Erro ao criar pet. Tente novamente.' }, { status: 500 })
  }
}
