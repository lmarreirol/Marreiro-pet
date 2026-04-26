import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date')
  const unitId = searchParams.get('unitId')
  const role = searchParams.get('role')
  const userUnitId = searchParams.get('userUnitId')
  const professional = searchParams.get('professional')
  const serviceTypes = searchParams.get('serviceTypes')

  const where: any = {}

  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')
  if (startDate && endDate) {
    where.appointmentDate = { gte: new Date(`${startDate}T00:00:00.000Z`), lte: new Date(`${endDate}T23:59:59.999Z`) }
  } else if (date) {
    where.appointmentDate = { gte: new Date(`${date}T00:00:00.000Z`), lte: new Date(`${date}T23:59:59.999Z`) }
  }

  if (role !== 'ADMIN' && userUnitId) {
    where.unitId = userUnitId
  } else if (unitId && unitId !== 'all') {
    where.unitId = unitId
  }

  if (professional && professional !== 'all') {
    where.professional = professional
  }

  if (serviceTypes) {
    where.serviceType = { in: serviceTypes.split(',') }
  }

  const appointments = await prisma.appointment.findMany({
    where,
    orderBy: { appointmentTime: 'asc' },
  })

  return NextResponse.json({ appointments })
}
