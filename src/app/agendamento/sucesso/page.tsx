'use client'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
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

  useEffect(() => {
    if (!id) return
    fetch(`/api/appointments/${id}`).then(r => r.json()).then(setApt).catch(() => {})
  }, [id])

  const date = apt ? new Date(apt.appointmentDate) : null
  const dateStr = date ? `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}` : ''
  const unitName = apt ? (UNITS[apt.unitId] ?? apt.unitId) : ''
  const pkgName = apt ? (PACKAGES[apt.package ?? ''] ?? apt.package ?? 'Serviço') : ''

  const addonsNames = apt?.addons?.map(id => ADDONS[id]).filter(Boolean).join(', ')

  const waText = apt ? encodeURIComponent(
    `Olá! Acabei de realizar meu agendamento pelo site 🐾\n\n` +
    `*Pet:* ${apt.petName}\n` +
    `*Serviço:* ${pkgName}\n` +
    (addonsNames ? `*Extras:* ${addonsNames}\n` : '') +
    `*Data:* ${dateStr} às ${apt.appointmentTime}\n` +
    `*Unidade:* ${unitName}\n` +
    `*Tutor:* ${apt.tutorName}\n` +
    `*Fone:* ${apt.phone}` +
    (apt.notes ? `\n*Obs:* ${apt.notes}` : '')
  ) : ''

  const waPhone = apt ? (UNIT_PHONES[apt.unitId] ?? '5585991575287') : '5585991575287'
  const waUrl = `https://wa.me/${waPhone}?text=${waText}`

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4f8', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: '#fff', borderRadius: 24, padding: 40, maxWidth: 480, width: '100%', textAlign: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.10)' }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#22C55E', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 36 }}>✓</div>

        <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 8, color: '#0F1B2D' }}>Agendamento recebido!</h1>
        <p style={{ color: '#4A5468', fontSize: 15, lineHeight: 1.6, marginBottom: 28 }}>
          Olá, <strong>{apt?.tutorName ?? ''}</strong>! Seu agendamento foi registrado com sucesso. Salve o comprovante abaixo para seus registros.
        </p>

        {apt && (
          <div style={{ background: '#f8fafc', borderRadius: 14, padding: '18px 20px', marginBottom: 24, textAlign: 'left' }}>
            {[
              { k: 'Pet', v: apt.petName },
              { k: 'Serviço', v: pkgName },
              ...(addonsNames ? [{ k: 'Extras', v: addonsNames }] : []),
              { k: 'Data & hora', v: `${dateStr} às ${apt.appointmentTime}` },
              { k: 'Unidade', v: unitName },
              { k: 'Total', v: `R$ ${Number(apt.totalPrice).toFixed(2).replace('.', ',')}` },
            ].map(({ k, v }) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #e5e7eb', fontSize: 14 }}>
                <span style={{ color: '#888', fontWeight: 600 }}>{k}</span>
                <span style={{ fontWeight: 700, color: '#0F1B2D' }}>{v}</span>
              </div>
            ))}
          </div>
        )}

        {apt && (
          <button onClick={() => {
            const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"/>
            <title>Comprovante — Marreiro Pet</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 40px; color: #111; max-width: 520px; margin: 0 auto; }
              .logo { font-size: 22px; font-weight: 900; color: #004A99; margin-bottom: 4px; }
              .subtitle { font-size: 13px; color: #888; margin-bottom: 28px; }
              h2 { font-size: 18px; color: #004A99; margin-bottom: 18px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; }
              .row { display: flex; justify-content: space-between; padding: 9px 0; border-bottom: 1px solid #f0f0f0; font-size: 14px; }
              .row .k { color: #888; font-weight: 600; }
              .row .v { font-weight: 700; color: #111; text-align: right; }
              .footer { margin-top: 28px; font-size: 11px; color: #aaa; text-align: center; }
              @media print { body { padding: 20px; } }
            </style></head><body>
            <div class="logo">Marreiro Pet</div>
            <div class="subtitle">Clínica Veterinária e Pet Shop</div>
            <h2>Comprovante de Agendamento</h2>
            <div class="row"><span class="k">Pet</span><span class="v">${apt.petName}</span></div>
            <div class="row"><span class="k">Serviço</span><span class="v">${pkgName}</span></div>
            ${addonsNames ? `<div class="row"><span class="k">Extras</span><span class="v">${addonsNames}</span></div>` : ''}
            <div class="row"><span class="k">Data & hora</span><span class="v">${dateStr} às ${apt.appointmentTime}</span></div>
            <div class="row"><span class="k">Unidade</span><span class="v">${unitName}</span></div>
            <div class="row"><span class="k">Tutor</span><span class="v">${apt.tutorName}</span></div>
            <div class="row"><span class="k">WhatsApp</span><span class="v">${apt.phone}</span></div>
            <div class="row"><span class="k">Total</span><span class="v">R$ ${Number(apt.totalPrice).toFixed(2).replace('.', ',')}</span></div>
            ${apt.notes ? `<div class="row"><span class="k">Observações</span><span class="v">${apt.notes}</span></div>` : ''}
            <div class="footer">Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} · Marreiro Pet</div>
            <script>window.onload = () => window.print()</script>
            </body></html>`
            const w = window.open('', '_blank')
            if (w) { w.document.write(html); w.document.close() }
          }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, width: '100%', padding: '14px', borderRadius: 12, background: '#004A99', color: '#fff', fontWeight: 800, fontSize: 16, cursor: 'pointer', border: 'none', marginBottom: 12, boxSizing: 'border-box' }}>
            ⬇ Salvar comprovante (PDF)
          </button>
        )}

        <Link href="/" style={{ display: 'block', color: '#888', fontSize: 14, textDecoration: 'none' }}>
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
