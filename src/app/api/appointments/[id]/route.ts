import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const appointment = await prisma.appointment.findUnique({ where: { id } })
  if (!appointment) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
  return NextResponse.json(appointment)
}
