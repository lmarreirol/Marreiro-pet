import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()

  const data: Record<string, unknown> = {}
  if (body.status !== undefined) data.status = body.status
  if (body.appointmentDate !== undefined) data.appointmentDate = new Date(body.appointmentDate)
  if (body.appointmentTime !== undefined) data.appointmentTime = body.appointmentTime
  if (body.petName !== undefined) data.petName = body.petName
  if (body.petBreed !== undefined) data.petBreed = body.petBreed
  if (body.petSize !== undefined) data.petSize = body.petSize
  if (body.tutorName !== undefined) data.tutorName = body.tutorName
  if (body.phone !== undefined) data.phone = body.phone
  if (body.package !== undefined) data.package = body.package
  if (body.addons !== undefined) data.addons = body.addons
  if (body.notes !== undefined) data.notes = body.notes
  if (body.isVip !== undefined) data.isVip = body.isVip
  if (body.totalPrice !== undefined) data.totalPrice = body.totalPrice

  const updated = await prisma.appointment.update({ where: { id }, data })
  return NextResponse.json(updated)
}
