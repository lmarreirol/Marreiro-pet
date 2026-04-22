import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const all = searchParams.get('all') === '1'
  const pets = await prisma.adoptionPet.findMany({
    where: all ? undefined : { status: 'disponivel' },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(pets)
}

export async function POST(req: NextRequest) {
  const adminKey = req.headers.get('x-admin-key')
  if (adminKey !== process.env.ADMIN_KEY) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  const body = await req.json()
  const { name, species, breed, age, gender, size, description, imageUrl, unitId } = body
  if (!name || !species || !gender) {
    return NextResponse.json({ error: 'Campos obrigatórios: name, species, gender' }, { status: 400 })
  }
  const pet = await prisma.adoptionPet.create({
    data: { name, species, breed, age, gender, size, description, imageUrl, unitId },
  })
  return NextResponse.json(pet, { status: 201 })
}
