'use client'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense, useRef } from 'react'
import Link from 'next/link'

type Appointment = {
  id: string
  petName: string
  tutorName: string
  phone: string
  package: string | null
  addons: string[]
  petSize: string | null
  unitId: string
  professional: string | null
  appointmentDate: string
  appointmentTime: string
  totalPrice: string
  notes: string | null
  isVip: boolean
}

const UNITS: Record<string, string> = {
  caucaia: 'Marreiro Caucaia',
  pecem: 'Marreiro Pecém',
  saogoncalo: 'Marreiro São Gonçalo',
  taiba: 'Marreiro Taíba',
}

const PACKAGES: Record<string, string> = {
  'banho': 'Banho Tradicional',
  'banho-tosa': 'Banho + Tosa Higiênica',
  'spa': 'Tosa Completa + Banho',
}

const ADDONS: Record<string, string> = {
  'hidra': 'Hidratação de pelos',
  'ozonio': 'Banho Luxo',
  'dentes': 'Escovação de dentes',
  'unhas': 'Remoção de Subpelo',
  'perfume': 'Tonalização de Pelo',
  'coloracao': 'Retirada de Nós',
}

const PRO_NAMES: Record<string, string> = {
  victor: 'Victor Lopes', daniele: 'Daniele Santos', eduarda: 'Eduarda', israel: 'Israel',
  vitoria: 'Vitória Duraes', christian: 'Christian Fernandes',
  andresa: 'Andresa Martins', erica: 'Erica Melo',
  anderson: 'Anderson Correia', carla: 'Carla Janaina',
}

const UNIT_PHONES: Record<string, string> = {
  caucaia: '5585994257643',
  pecem: '5585981173322',
  saogoncalo: '5585991976216',
  taiba: '5585992231172',
}

function SucessoContent() {
  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  const [apt, setApt] = useState<Appointment | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const [downloading, setDownloading] = useState(false)

  const downloadImage = async () => {
    if (!cardRef.current) return
    setDownloading(true)
    const html2canvas = (await import('html2canvas')).default
    const canvas = await html2canvas(cardRef.current, { scale: 2, backgroundColor: '#f0f4f8', useCORS: true })
    const link = document.createElement('a')
    link.download = `comprovante-marreiro-${apt?.petName ?? 'pet'}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
    setDownloading(false)
  }

  useEffect(() => {
    if (!id) return

    // MP redireciona com ?status=approved&payment_id=... — confirma o agendamento direto
    const mpStatus = searchParams.get('status') ?? searchParams.get('collection_status')
    const paymentId = searchParams.get('payment_id') ?? searchParams.get('collection_id')
    if (mpStatus === 'approved' && paymentId) {
      fetch(`/api/admin/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CONFIRMED', paymentStatus: 'APPROVED' }),
      }).catch(() => {})
    }

    fetch(`/api/appointments/${id}`).then(r => r.json()).then(setApt).catch(() => {})
  }, [id])

  const date = apt ? new Date(apt.appointmentDate) : null
  const dateStr = date ? `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}` : ''
  const unitName = apt ? (UNITS[apt.unitId] ?? apt.unitId) : ''
  const pkgName = apt ? (PACKAGES[apt.package ?? ''] ?? apt.package ?? 'Serviço') : ''
  const proName = apt?.professional ? (PRO_NAMES[apt.professional] ?? apt.professional) : null

  const addonsNames = apt?.addons?.map(id => ADDONS[id]).filter(Boolean).join(', ')

  const waText = apt ? encodeURIComponent(
    `Olá! Acabei de realizar meu agendamento pelo site 🐾\n\n` +
    `*Pet:* ${apt.petName}\n` +
    `*Serviço:* ${pkgName}\n` +
    (addonsNames ? `*Extras:* ${addonsNames}\n` : '') +
    `*Data:* ${dateStr} às ${apt.appointmentTime}\n` +
    `*Unidade:* ${unitName}\n` +
    (proName ? `*Profissional:* ${proName}\n` : '') +
    `*Tutor:* ${apt.tutorName}\n` +
    `*Fone:* ${apt.phone}` +
    (apt.notes ? `\n*Obs:* ${apt.notes}` : '')
  ) : ''

  const waPhone = apt ? (UNIT_PHONES[apt.unitId] ?? '5585991575287') : '5585991575287'
  const waUrl = `https://wa.me/${waPhone}?text=${waText}`

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4f8', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div ref={cardRef} style={{ background: '#fff', borderRadius: 24, padding: 40, maxWidth: 480, width: '100%', textAlign: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.10)' }}>

        {/* Logo */}
        <div style={{ marginBottom: 24 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/marreiro-logo-full.png" alt="Marreiro Pet" style={{ height: 48, objectFit: 'contain', display: 'block', margin: '0 auto' }} />
        </div>

        <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#22C55E', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 32 }}>✓</div>

        <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 8, color: '#0F1B2D' }}>Agendamento recebido!</h1>
        <p style={{ color: '#4A5468', fontSize: 15, lineHeight: 1.6, marginBottom: apt?.isVip ? 16 : 28 }}>
          Olá, <strong>{apt?.tutorName ?? ''}</strong>! Seu agendamento foi registrado com sucesso. Salve o comprovante abaixo para seus registros.
        </p>

        {apt?.isVip && (
          <div style={{ background: '#FEF1E4', border: '1.5px solid #EF7720', borderRadius: 12, padding: '12px 16px', marginBottom: 24, textAlign: 'left', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 20 }}>⭐</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: 14, color: '#EF7720', marginBottom: 2 }}>Encaixe VIP solicitado</div>
              <div style={{ fontSize: 13, color: '#92400e', lineHeight: 1.5 }}>Entraremos em contato para confirmar o horário e o profissional disponível para o seu atendimento com prioridade.</div>
            </div>
          </div>
        )}

        {apt && (
          <div style={{ background: '#f8fafc', borderRadius: 14, padding: '18px 20px', marginBottom: 24, textAlign: 'left' }}>
            {[
              { k: 'Pet', v: apt.petName },
              { k: 'Serviço', v: pkgName },
              ...(addonsNames ? [{ k: 'Extras', v: addonsNames }] : []),
              { k: 'Data & hora', v: `${dateStr} às ${apt.appointmentTime}` },
              { k: 'Unidade', v: unitName },
              ...(apt.isVip ? [{ k: 'Profissional', v: 'A definir' }] : proName ? [{ k: 'Profissional', v: proName }] : []),
              { k: 'Total', v: `R$ ${Number(apt.totalPrice).toFixed(2).replace('.', ',')}` },
            ].map(({ k, v }) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #e5e7eb', fontSize: 14 }}>
                <span style={{ color: '#888', fontWeight: 600 }}>{k}</span>
                <span style={{ fontWeight: 700, color: '#0F1B2D' }}>{v}</span>
              </div>
            ))}
          </div>
        )}

        <p style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.6, margin: '16px 0 16px' }}>
          🐾 Obrigado por confiar no <strong>Marreiro Pet</strong>! Seu pet estará em boas mãos. Qualquer dúvida, fale com a nossa equipe.
        </p>

        {apt && (
          <button data-html2canvas-ignore onClick={downloadImage} disabled={downloading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, width: '100%', padding: '14px', borderRadius: 12, background: '#004A99', color: '#fff', fontWeight: 800, fontSize: 16, cursor: 'pointer', border: 'none', marginBottom: 12, boxSizing: 'border-box', opacity: downloading ? 0.7 : 1 }}>
            {downloading ? 'Gerando imagem...' : '📸 Baixar comprovante'}
          </button>
        )}

        <Link data-html2canvas-ignore href="/" style={{ display: 'block', color: '#888', fontSize: 13, textDecoration: 'none' }}>
          Voltar para o site
        </Link>
      </div>
    </div>
  )
}

export default function Sucesso() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Carregando...</div>}>
      <SucessoContent />
    </Suspense>
  )
}
