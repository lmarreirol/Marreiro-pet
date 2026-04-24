'use client'
import { use, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { generatePrescriptionPdf } from '@/lib/generatePrescriptionPdf'

type Prescription = { id: string; medication: string; dose: string | null; frequency: string | null; duration: string | null; instructions: string | null }
type ExamOrder = { id: string; examName: string; notes: string | null; status: string; result: string | null }
type MedRecord = {
  id: string; date: string; status: string; vetName: string | null; unitId: string | null
  subjetivo: string | null; objetivo: string | null; avaliacao: string | null; plano: string | null
  transcript: string | null; aiSummary: string | null; aiDiagnoses: string[]; aiRetorno: string | null
  sinaisVitais: { temperatura?: string; frequenciaCardiaca?: string; frequenciaRespiratoria?: string; peso?: string; tpc?: string } | null
  prescriptions: Prescription[]; examOrders: ExamOrder[]
  pet: { id: string; name: string; species: string; breed: string | null; client: { id: string; name: string; phone: string } }
}

const UNIT_NAME: Record<string, string> = { caucaia: 'Caucaia', pecem: 'Pecém', saogoncalo: 'São Gonçalo', taiba: 'Taíba' }

export default function RecordPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { status } = useSession()
  const router = useRouter()
  const [record, setRecord] = useState<MedRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [signing, setSigning] = useState(false)

  useEffect(() => { if (status === 'unauthenticated') router.push('/admin/login') }, [status, router])
  useEffect(() => {
    if (status !== 'authenticated') return
    fetch(`/api/vet/records/${id}`).then(r => r.json()).then(setRecord).finally(() => setLoading(false))
  }, [status, id])

  const sign = async () => {
    setSigning(true)
    await fetch(`/api/vet/records/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'signed' }) })
    setRecord(r => r ? { ...r, status: 'signed' } : r)
    setSigning(false)
  }

  const sendWhatsApp = () => {
    if (!record) return
    const pet = record.pet
    const dateStr = new Date(record.date).toLocaleDateString('pt-BR')
    const rxList = record.prescriptions.map(p => `• ${p.medication}${p.dose ? ` ${p.dose}` : ''}${p.frequency ? ` — ${p.frequency}` : ''}${p.duration ? ` por ${p.duration}` : ''}`).join('\n')
    const msg = [
      `Olá, ${pet.client.name}! 👋`,
      ``,
      `Segue o resumo da consulta de *${pet.name}* realizada em ${dateStr}:`,
      ``,
      record.avaliacao ? `🩺 *Diagnóstico:* ${record.avaliacao}` : '',
      record.aiSummary ? `📋 *Resumo:* ${record.aiSummary}` : '',
      rxList ? `\n💊 *Prescrição:*\n${rxList}` : '',
      record.aiRetorno ? `\n📅 *Retorno:* ${record.aiRetorno}` : '',
      ``,
      `Qualquer dúvida, estamos à disposição! 🐾`,
    ].filter(Boolean).join('\n')
    window.open(`https://wa.me/55${pet.client.phone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  if (loading) return <div style={{ padding: '4rem', textAlign: 'center', color: '#9ca3af' }}>Carregando...</div>
  if (!record) return <div style={{ padding: '4rem', textAlign: 'center', color: '#dc2626' }}>Prontuário não encontrado.</div>

  const sv = record.sinaisVitais as { temperatura?: string; frequenciaCardiaca?: string; frequenciaRespiratoria?: string; peso?: string; tpc?: string } | null
  const vTemp = sv?.temperatura; const vFC = sv?.frequenciaCardiaca; const vFR = sv?.frequenciaRespiratoria; const vPeso = sv?.peso; const vTPC = sv?.tpc
  const soapFields: { key: keyof MedRecord; label: string; color: string }[] = [
    { key: 'subjetivo', label: 'S — SUBJETIVO', color: '#6366f1' },
    { key: 'objetivo', label: 'O — OBJETIVO', color: '#0ea5e9' },
    { key: 'avaliacao', label: 'A — AVALIAÇÃO', color: '#f97316' },
    { key: 'plano', label: 'P — PLANO', color: '#10b981' },
  ]

  return (
    <div style={{ padding: '2rem', maxWidth: 900, margin: '0 auto' }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: '1.5rem', fontSize: '0.85rem', flexWrap: 'wrap' }}>
        <Link href="/admin/clientes" style={{ color: '#9ca3af', textDecoration: 'none' }}>Clientes</Link>
        <span style={{ color: '#d1d5db' }}>›</span>
        <Link href={`/admin/clientes/${record.pet.client.id}`} style={{ color: '#9ca3af', textDecoration: 'none' }}>{record.pet.client.name}</Link>
        <span style={{ color: '#d1d5db' }}>›</span>
        <span style={{ color: '#374151', fontWeight: 600 }}>Prontuário — {record.pet.name}</span>
      </div>

      {/* Header */}
      <div style={{ background: 'white', borderRadius: 14, padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f3f4f6' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <h1 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#111827' }}>Prontuário — {record.pet.name}</h1>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: record.status === 'signed' ? '#dcfce7' : '#fef3c7', color: record.status === 'signed' ? '#16a34a' : '#d97706' }}>
                {record.status === 'signed' ? '✅ Assinado' : '📝 Rascunho'}
              </span>
            </div>
            <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
              {new Date(record.date).toLocaleString('pt-BR')}{record.vetName ? ` · Dr(a). ${record.vetName}` : ''}{record.unitId ? ` · ${UNIT_NAME[record.unitId] ?? record.unitId}` : ''}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {record.prescriptions.length > 0 && (
              <button onClick={() => generatePrescriptionPdf({
                date: record.date,
                vetName: record.vetName,
                petName: record.pet.name,
                petSpecies: record.pet.species,
                petBreed: record.pet.breed,
                tutorName: record.pet.client.name,
                tutorPhone: record.pet.client.phone,
                avaliacao: record.avaliacao,
                aiRetorno: record.aiRetorno,
                prescriptions: record.prescriptions,
                examOrders: record.examOrders,
              })} style={{ background: '#eff6ff', color: '#2563eb', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>
                📄 Baixar PDF
              </button>
            )}
            <button onClick={sendWhatsApp} style={{ background: '#dcfce7', color: '#16a34a', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>
              💬 Enviar WhatsApp
            </button>
            {record.status !== 'signed' && (
              <button onClick={sign} disabled={signing} style={{ background: '#10b981', color: 'white', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>
                {signing ? '...' : '✅ Assinar prontuário'}
              </button>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '1.5rem', alignItems: 'start' }}>
        {/* SOAP */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Sinais vitais */}
          <div style={{ background: 'white', borderRadius: 14, padding: '1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f3f4f6' }}>
            <h3 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#6b7280', marginBottom: 12 }}>SINAIS VITAIS</h3>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              {([
                ['Temperatura', vTemp, '°C'], ['FC', vFC, 'bpm'],
                ['FR', vFR, 'rpm'], ['Peso', vPeso, 'kg'], ['TPC', vTPC, 's'],
              ] as [string, string | undefined, string][]).map(([lbl, val, unit]) => (
                <div key={lbl} style={{ textAlign: 'center', background: '#f9fafb', borderRadius: 10, padding: '10px 16px', minWidth: 70 }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: val ? '#111827' : '#d1d5db' }}>{val || '—'}</div>
                  <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: 2 }}>{lbl} {unit}</div>
                </div>
              ))}
            </div>
          </div>

          {/* SOAP fields */}
          {soapFields.map(f => {
            const val = record[f.key] as string | null
            return val ? (
              <div key={f.key} style={{ background: 'white', borderRadius: 14, padding: '1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f3f4f6' }}>
                <h3 style={{ fontSize: '0.78rem', fontWeight: 700, color: f.color, marginBottom: 10 }}>{f.label}</h3>
                <p style={{ fontSize: '0.9rem', color: '#374151', lineHeight: 1.7, whiteSpace: 'pre-wrap', margin: 0 }}>{val}</p>
              </div>
            ) : null
          })}

          {/* Prescrições */}
          {record.prescriptions.length > 0 && (
            <div style={{ background: 'white', borderRadius: 14, padding: '1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f3f4f6' }}>
              <h3 style={{ fontSize: '0.78rem', fontWeight: 700, color: '#6b7280', marginBottom: 12 }}>💊 PRESCRIÇÕES</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {record.prescriptions.map(p => (
                  <div key={p.id} style={{ background: '#f9fafb', borderRadius: 8, padding: '10px 14px' }}>
                    <div style={{ fontWeight: 700, color: '#111827', fontSize: '0.9rem' }}>{p.medication}</div>
                    <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: 3 }}>
                      {[p.dose, p.frequency, p.duration ? `por ${p.duration}` : ''].filter(Boolean).join(' · ')}
                    </div>
                    {p.instructions && <div style={{ fontSize: '0.78rem', color: '#9ca3af', marginTop: 2 }}>{p.instructions}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Exames */}
          {record.examOrders.length > 0 && (
            <div style={{ background: 'white', borderRadius: 14, padding: '1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f3f4f6' }}>
              <h3 style={{ fontSize: '0.78rem', fontWeight: 700, color: '#6b7280', marginBottom: 12 }}>🔬 EXAMES SOLICITADOS</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {record.examOrders.map(e => (
                  <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f9fafb', borderRadius: 8, padding: '8px 14px' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#111827' }}>{e.examName}</div>
                      {e.notes && <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{e.notes}</div>}
                    </div>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: e.status === 'done' ? '#dcfce7' : '#f3f4f6', color: e.status === 'done' ? '#16a34a' : '#6b7280' }}>
                      {e.status === 'done' ? 'Concluído' : 'Pendente'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar direita */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* IA Resumo */}
          {record.aiSummary && (
            <div style={{ background: '#f0fdf4', borderRadius: 14, padding: '1.25rem', border: '1px solid #bbf7d0' }}>
              <h3 style={{ fontSize: '0.78rem', fontWeight: 700, color: '#16a34a', marginBottom: 8 }}>✨ RESUMO DA IA</h3>
              <p style={{ fontSize: '0.875rem', color: '#15803d', lineHeight: 1.6, margin: 0 }}>{record.aiSummary}</p>
            </div>
          )}

          {/* Diagnósticos IA */}
          {record.aiDiagnoses.length > 0 && (
            <div style={{ background: 'white', borderRadius: 14, padding: '1.25rem', border: '1px solid #f3f4f6', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <h3 style={{ fontSize: '0.78rem', fontWeight: 700, color: '#6b7280', marginBottom: 10 }}>🩺 DIAGNÓSTICOS SUGERIDOS</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {record.aiDiagnoses.map((d, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, width: 20, height: 20, borderRadius: '50%', background: i === 0 ? '#dbeafe' : '#f3f4f6', color: i === 0 ? '#1d4ed8' : '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</span>
                    <span style={{ fontSize: '0.85rem', color: '#374151', fontWeight: i === 0 ? 700 : 400 }}>{d}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Paciente */}
          <div style={{ background: 'white', borderRadius: 14, padding: '1.25rem', border: '1px solid #f3f4f6', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <h3 style={{ fontSize: '0.78rem', fontWeight: 700, color: '#6b7280', marginBottom: 10 }}>PACIENTE</h3>
            <div style={{ fontWeight: 700, color: '#111827', fontSize: '0.95rem' }}>{record.pet.name}</div>
            <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: 2 }}>{record.pet.species}{record.pet.breed ? ` · ${record.pet.breed}` : ''}</div>
            <hr style={{ border: 'none', borderTop: '1px solid #f3f4f6', margin: '10px 0' }} />
            <div style={{ fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>{record.pet.client.name}</div>
            <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: 2 }}>📞 {record.pet.client.phone}</div>
            <Link href={`/admin/clientes/${record.pet.client.id}`}
              style={{ display: 'block', textAlign: 'center', marginTop: 10, fontSize: '0.8rem', color: '#f97316', textDecoration: 'none', fontWeight: 600 }}>
              Ver perfil completo →
            </Link>
          </div>

          {/* Retorno */}
          {record.aiRetorno && (
            <div style={{ background: '#fffbeb', borderRadius: 14, padding: '1.25rem', border: '1px solid #fde68a' }}>
              <h3 style={{ fontSize: '0.78rem', fontWeight: 700, color: '#d97706', marginBottom: 6 }}>📅 RETORNO SUGERIDO</h3>
              <p style={{ fontSize: '0.875rem', color: '#92400e', margin: 0 }}>{record.aiRetorno}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
