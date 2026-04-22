import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { status } = await req.json()
  const updated = await prisma.appointment.update({
    where: { id },
    data: { status },
  })

  return NextResponse.json(updated)
}
