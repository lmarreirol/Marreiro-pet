'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

const UNITS = [
  { id: 'caucaia', name: 'Caucaia' },
  { id: 'pecem', name: 'Pecém' },
  { id: 'saogoncalo', name: 'São Gonçalo' },
  { id: 'taiba', name: 'Taíba' },
]

const SERVICES = [
  { id: 'banho', label: 'Banho Tradicional' },
  { id: 'banho-tosa', label: 'Banho + Tosa Higiênica' },
  { id: 'spa', label: 'Tosa Completa + Banho' },
]

type Professional = {
  id: string
  name: string
  slug: string
  unitId: string
  active: boolean
  services: string[]
  createdAt: string
}

const EMPTY_FORM = { name: '', slug: '', unitId: 'caucaia', services: [] as string[] }

function slugify(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

export default function StaffPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [pros, setPros] = useState<Professional[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<'add' | 'edit' | null>(null)
  const [editing, setEditing] = useState<Professional | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const user = session?.user as Record<string, unknown> | undefined

  useEffect(() => { if (status === 'unauthenticated') router.push('/admin/login') }, [status, router])
  useEffect(() => { if (status === 'authenticated' && user?.role !== 'ADMIN') router.push('/admin/overview') }, [status, user, router])

  const load = () => {
    setLoading(true)
    fetch('/api/admin/professionals')
      .then(r => r.json())
      .then(d => setPros(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false))
  }
  useEffect(() => { if (status === 'authenticated') load() }, [status])

  const openAdd = () => { setForm(EMPTY_FORM); setEditing(null); setError(''); setModal('add') }
  const openEdit = (p: Professional) => { setForm({ name: p.name, slug: p.slug, unitId: p.unitId, services: p.services ?? [] }); setEditing(p); setError(''); setModal('edit') }

  const toggleService = (id: string) => setForm(f => ({
    ...f,
    services: f.services.includes(id) ? f.services.filter(s => s !== id) : [...f.services, id],
  }))

  const save = async () => {
    if (!form.name.trim()) { setError('Nome é obrigatório.'); return }
    setSaving(true)
    setError('')
    try {
      const res = await fetch(
        editing ? `/api/admin/professionals/${editing.id}` : '/api/admin/professionals',
        {
          method: editing ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form, slug: form.slug || slugify(form.name), services: form.services }),
        }
      )
      if (!res.ok) { const d = await res.json(); setError(d.error ?? 'Erro ao salvar.'); setSaving(false); return }
      setModal(null)
      load()
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (p: Professional) => {
    await fetch(`/api/admin/professionals/${p.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !p.active }),
    })
    load()
  }

  const del = async (p: Professional) => {
    if (!confirm(`Excluir ${p.name}? Esta ação não pode ser desfeita.`)) return
    await fetch(`/api/admin/professionals/${p.id}`, { method: 'DELETE' })
    load()
  }

  // Group by unit
  const byUnit: Record<string, Professional[]> = {}
  for (const p of pros) {
    if (!byUnit[p.unitId]) byUnit[p.unitId] = []
    byUnit[p.unitId].push(p)
  }

  const inp: React.CSSProperties = { width: '100%', border: '1px solid #e5e7eb', borderRadius: 8, padding: '9px 12px', fontSize: '0.875rem', color: '#111827', outline: 'none', boxSizing: 'border-box' }

  return (
    <div style={{ padding: '2rem', maxWidth: 860, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111827' }}>Equipe</h1>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: 2 }}>{pros.length} profissionais cadastrados</p>
        </div>
        <button onClick={openAdd} style={{ background: '#f97316', color: 'white', border: 'none', borderRadius: 10, padding: '10px 20px', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}>
          + Novo profissional
        </button>
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', color: '#9ca3af', padding: '4rem' }}>Carregando...</p>
      ) : pros.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#9ca3af' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>👥</div>
          <p>Nenhum profissional cadastrado ainda.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {UNITS.filter(u => byUnit[u.id]?.length).map(unit => (
            <div key={unit.id}>
              <h2 style={{ fontSize: '0.78rem', fontWeight: 700, color: '#9ca3af', marginBottom: 8, letterSpacing: '0.05em' }}>
                {unit.name.toUpperCase()}
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {byUnit[unit.id].map(p => (
                  <div key={p.id} style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    background: 'white', borderRadius: 12, padding: '14px 18px',
                    border: '1px solid #f3f4f6', boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    opacity: p.active ? 1 : 0.55,
                  }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: p.active ? '#fff7ed' : '#f3f4f6', display: 'grid', placeItems: 'center', fontSize: '1.2rem', flexShrink: 0, border: '1px solid #e5e7eb' }}>
                      👤
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, color: '#111827', fontSize: '0.95rem' }}>{p.name}</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                        {(p.services?.length ? p.services : []).map(s => {
                          const svc = SERVICES.find(x => x.id === s)
                          return svc ? (
                            <span key={s} style={{ fontSize: '0.68rem', fontWeight: 600, padding: '2px 7px', borderRadius: 20, background: '#f0f9ff', color: '#0369a1', border: '1px solid #bae6fd' }}>
                              {svc.label}
                            </span>
                          ) : null
                        })}
                        {!p.services?.length && (
                          <span style={{ fontSize: '0.72rem', color: '#d1d5db' }}>Nenhum serviço definido</span>
                        )}
                      </div>
                    </div>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: p.active ? '#dcfce7' : '#f3f4f6', color: p.active ? '#16a34a' : '#6b7280', flexShrink: 0 }}>
                      {p.active ? 'Ativo' : 'Inativo'}
                    </span>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button onClick={() => openEdit(p)} style={actionBtn('#6366f1')}>Editar</button>
                      <button onClick={() => toggleActive(p)} style={actionBtn(p.active ? '#f59e0b' : '#10b981')}>
                        {p.active ? 'Desativar' : 'Ativar'}
                      </button>
                      <button onClick={() => del(p)} style={actionBtn('#ef4444')}>Excluir</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Profissionais sem unidade conhecida */}
          {pros.filter(p => !UNITS.find(u => u.id === p.unitId)).length > 0 && (
            <div>
              <h2 style={{ fontSize: '0.78rem', fontWeight: 700, color: '#9ca3af', marginBottom: 8 }}>OUTRAS UNIDADES</h2>
              {pros.filter(p => !UNITS.find(u => u.id === p.unitId)).map(p => (
                <div key={p.id} style={{ fontWeight: 600, color: '#374151', padding: '10px 18px', background: 'white', borderRadius: 12, marginBottom: 6, border: '1px solid #f3f4f6' }}>
                  {p.name} <span style={{ fontWeight: 400, color: '#9ca3af' }}>· {p.unitId}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', borderRadius: 16, padding: '2rem', width: '100%', maxWidth: 440, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#111827', marginBottom: '1.25rem' }}>
              {modal === 'add' ? 'Novo profissional' : 'Editar profissional'}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Nome *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value, slug: slugify(e.target.value) }))} style={inp} placeholder="Ex: Ana Paula" />
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>ID (slug)</label>
                <input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: slugify(e.target.value) }))} style={inp} placeholder="Ex: ana-paula" />
                <p style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: 3 }}>Gerado automaticamente. Usado internamente.</p>
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Unidade *</label>
                <select value={form.unitId} onChange={e => setForm(f => ({ ...f, unitId: e.target.value }))} style={{ ...inp, cursor: 'pointer' }}>
                  {UNITS.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 8 }}>Serviços que realiza</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {SERVICES.map(s => (
                    <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '8px 12px', borderRadius: 8, border: `1.5px solid ${form.services.includes(s.id) ? '#3b82f6' : '#e5e7eb'}`, background: form.services.includes(s.id) ? '#eff6ff' : '#fff', transition: 'all .15s' }}>
                      <input type="checkbox" checked={form.services.includes(s.id)} onChange={() => toggleService(s.id)} style={{ width: 16, height: 16, accentColor: '#3b82f6', cursor: 'pointer' }} />
                      <span style={{ fontSize: '0.875rem', fontWeight: 600, color: form.services.includes(s.id) ? '#1d4ed8' : '#374151' }}>{s.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              {error && <p style={{ color: '#ef4444', fontSize: '0.82rem' }}>{error}</p>}
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button onClick={() => setModal(null)} style={{ background: '#f3f4f6', border: 'none', borderRadius: 8, padding: '10px 18px', cursor: 'pointer', fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>
                Cancelar
              </button>
              <button onClick={save} disabled={saving} style={{ background: '#f97316', color: 'white', border: 'none', borderRadius: 8, padding: '10px 20px', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '0.875rem', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function actionBtn(color: string): React.CSSProperties {
  return {
    background: `${color}12`, color, border: `1px solid ${color}25`,
    borderRadius: 6, padding: '4px 10px', cursor: 'pointer',
    fontWeight: 600, fontSize: '0.75rem',
  }
}
