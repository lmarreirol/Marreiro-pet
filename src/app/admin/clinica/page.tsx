'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type MedRecord = {
  id: string; date: string; status: string; vetName: string | null
  avaliacao: string | null; aiSummary: string | null
  pet: { id: string; name: string; species: string; breed: string | null; client: { id: string; name: string; phone: string } | null }
  prescriptions: { id: string }[]
  examOrders: { id: string }[]
}

const SPECIES_ICON: Record<string, string> = { cao: '🐕', gato: '🐈', outro: '🐾' }

export default function ClinicaPage() {
  const { status } = useSession()
  const router = useRouter()
  const [records, setRecords] = useState<MedRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (status === 'unauthenticated') router.push('/admin/login') }, [status, router])

  useEffect(() => {
    if (status !== 'authenticated') return
    fetch('/api/vet/records')
      .then(r => r.json())
      .then(d => setRecords(d.records ?? []))
      .finally(() => setLoading(false))
  }, [status])

  return (
    <div style={{ padding: '2rem', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111827' }}>Clínica</h1>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: 2 }}>{records.length} prontuários registrados</p>
        </div>
        <Link href="/admin/clientes" style={{ background: '#10b981', color: 'white', borderRadius: 10, padding: '10px 20px', fontWeight: 700, textDecoration: 'none', fontSize: '0.9rem' }}>
          + Nova consulta
        </Link>
      </div>

      <div style={{ background: '#f0fdf4', borderRadius: 12, padding: '1rem 1.25rem', marginBottom: '1.5rem', border: '1px solid #bbf7d0', fontSize: '0.875rem', color: '#15803d' }}>
        💡 Para iniciar uma consulta com <strong>IA Scribe</strong>, acesse o perfil do cliente, selecione o pet e clique em <strong>"Nova consulta"</strong>.
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', color: '#9ca3af', padding: '3rem' }}>Carregando...</p>
      ) : records.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#9ca3af' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🩺</div>
          <p>Nenhum prontuário registrado ainda.</p>
          <Link href="/admin/clientes" style={{ color: '#10b981', fontWeight: 600, textDecoration: 'none' }}>Ir para Clientes & Pets →</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {records.map(r => (
            <Link key={r.id} href={`/admin/clinica/${r.id}`} style={{
              display: 'flex', gap: 14, alignItems: 'center',
              background: 'white', borderRadius: 12, padding: '14px 18px',
              textDecoration: 'none', border: '1px solid #f3f4f6',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: '#f9fafb', display: 'grid', placeItems: 'center', fontSize: '1.4rem', border: '1px solid #e5e7eb', flexShrink: 0 }}>
                {SPECIES_ICON[r.pet.species] ?? '🐾'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, color: '#111827', fontSize: '0.95rem' }}>
                  {r.pet.name}
                  {r.pet.client && <span style={{ fontWeight: 400, color: '#6b7280', fontSize: '0.85rem' }}> · {r.pet.client.name}</span>}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {r.avaliacao || r.aiSummary || 'Sem diagnóstico registrado'}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: r.status === 'signed' ? '#dcfce7' : '#fef3c7', color: r.status === 'signed' ? '#16a34a' : '#d97706' }}>
                  {r.status === 'signed' ? '✅ Assinado' : '📝 Rascunho'}
                </span>
                <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                  {new Date(r.date).toLocaleDateString('pt-BR')}
                  {r.prescriptions.length > 0 && ` · 💊 ${r.prescriptions.length}`}
                  {r.examOrders.length > 0 && ` · 🔬 ${r.examOrders.length}`}
                </div>
              </div>
              <span style={{ color: '#9ca3af', fontSize: 18 }}>›</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
