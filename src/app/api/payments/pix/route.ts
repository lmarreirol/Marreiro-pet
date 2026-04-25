import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { asaasGetPixQrCode } from '@/lib/asaas'

export async function GET(req: NextRequest) {
  const apptId = req.nextUrl.searchParams.get('id')
  if (!apptId) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })

  const appt = await prisma.appointment.findUnique({ where: { id: apptId }, select: { paymentId: true, paymentStatus: true } })
  if (!appt?.paymentId) return NextResponse.json({ error: 'Pagamento não encontrado' }, { status: 404 })

  if (appt.paymentStatus === 'APPROVED') return NextResponse.json({ status: 'APPROVED' })

  const qr = await asaasGetPixQrCode(appt.paymentId)
  return NextResponse.json({ status: 'PENDING', ...qr })
}
