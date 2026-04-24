'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

type Appointment = {
  id: string; serviceType: string | null; petName: string; petBreed: string | null
  tutorName: string; tutorCpf: string | null; phone: string; package: string | null
  addons: string[]; petSize: string | null; unitId: string; professional: string | null
  appointmentDate: string; appointmentTime: string; status: string
  totalPrice: string; notes: string | null; isVip: boolean
}

const UNITS = [
  { id: 'caucaia', name: 'Caucaia' }, { id: 'pecem', name: 'Pecém' },
  { id: 'saogoncalo', name: 'São Gonçalo' }, { id: 'taiba', name: 'Taíba' },
]

const STATUS_LABELS: Record<string, string> = {
  AWAITING_PAYMENT: 'Aguard. pagamento', CONFIRMED: 'Confirmado',
  CANCELLED: 'Cancelado', COMPLETED: 'Concluído',
}
const STATUS_COLORS: Record<string, string> = {
  AWAITING_PAYMENT: '#f59e0b', CONFIRMED: '#16a34a',
  CANCELLED: '#dc2626', COMPLETED: '#6366f1',
}
const CLINIC_SERVICE_LABELS: Record<string, string> = {
  vet: 'Consulta Veterinária', vacina: 'Vacinação', exames: 'Exames',
}
const VET_SUB_LABELS: Record<string, string> = {
  'clinico-geral': 'Consulta Clínico Geral', 'retorno': 'Retorno Veterinário', 'plantao': 'Consulta Plantão',
}
const VACCINE_LABELS: Record<string, string> = {
  'v8v10-importada': 'V8/V10 Importada', 'vanguard-v10': 'Vanguard V10',
  'felina-v3': 'Felina V3', 'felina-v4': 'Felina V4', 'felina-v5': 'Felina V5',
  'antirrábica': 'Antirrábica', 'gripe': 'Gripe (Bordetella)', 'leishmania': 'Leishmania',
}
const SVCCOLORS: Record<string, string> = { vet: '#7C3AED', vacina: '#0891B2', exames: '#D97706' }
const SVCICONS: Record<string, string> = { vet: '🩺', vacina: '💉', exames: '🔬' }

const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 14, background: '#fff', boxSizing: 'border-box' }
const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: '#666', display: 'block', marginBottom: 6 }

function todayISO() { return new Date().toISOString().split('T')[0] }

export default function ClinicaVetPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  useEffect(() => { if (status === 'unauthenticated') router.push('/admin/login') }, [status, router])

  const user = session?.user as Record<string, unknown> | undefined
  const isAdmin = user?.role === 'ADMIN'
  const userUnitId = user?.unitId as string | undefined

  const [date, setDate] = useState(todayISO())
  const [unitFilter, setUnitFilter] = useState(isAdmin ? 'all' : (userUnitId ?? 'all'))
  const [serviceFilter, setServiceFilter] = useState('all')
  const [rows, setRows] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(false)

  const [editingAppt, setEditingAppt] = useState<Appointment | null>(null)
  const [editForm, setEditForm] = useState({ petName: '', petBreed: '', petSize: 'small', tutorName: '', phone: '', pkg: 'clinico-geral', notes: '', isVip: false, status: 'CONFIRMED' })
  const [editSaving, setEditSaving] = useState(false)
  const [editLocked, setEditLocked] = useState(true)
  const [cpfCopied, setCpfCopied] = useState(false)

  const fetchRows = () => {
    setLoading(true)
    const params = new URLSearchParams({ date, role: isAdmin ? 'ADMIN' : 'RECEPTIONIST', userUnitId: userUnitId ?? '', serviceTypes: 'vet,vacina,exames' })
    if (isAdmin && unitFilter !== 'all') params.set('unitId', unitFilter)
    if (!isAdmin && userUnitId) params.set('unitId', userUnitId)
    if (serviceFilter !== 'all') params.set('serviceTypes', serviceFilter)
    fetch(`/api/admin/appointments?${params}`)
      .then(r => r.json())
      .then(d => { setRows(d.appointments ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    if (status !== 'authenticated') return
    fetchRows()
  }, [date, unitFilter, serviceFilter, status])

  const openEdit = (a: Appointment) => {
    setEditingAppt(a)
    setEditLocked(true)
    setCpfCopied(false)
    setEditForm({ petName: a.petName, petBreed: a.petBreed ?? '', petSize: a.petSize ?? 'small', tutorName: a.tutorName, phone: a.phone, pkg: a.package ?? 'clinico-geral', notes: a.notes ?? '', isVip: a.isVip, status: a.status })
  }

  const saveEdit = async () => {
    if (!editingAppt) return
    setEditSaving(true)
    await fetch(`/api/admin/appointments/${editingAppt.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        petName: editForm.petName, petBreed: editForm.petBreed || null,
        petSize: editForm.petSize, tutorName: editForm.tutorName,
        phone: editForm.phone, package: editForm.pkg,
        notes: editForm.notes, isVip: editForm.isVip, status: editForm.status,
      }),
    })
    setEditSaving(false)
    setEditingAppt(null)
    fetchRows()
  }

  const updateStatus = async (id: string, newStatus: string) => {
    await fetch(`/api/admin/appointments/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }) })
    setRows(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a))
  }

  const deleteAppt = async (id: string) => {
    if (!window.confirm('Excluir este agendamento?')) return
    await fetch(`/api/appointments/${id}`, { method: 'DELETE' })
    setRows(prev => prev.filter(a => a.id !== id))
  }

  const dateLabel = (() => {
    const [y, mo, d] = date.split('-').map(Number)
    const dt = new Date(y, mo - 1, d)
    const today = todayISO()
    const tom = new Date(); tom.setDate(tom.getDate() + 1)
    if (date === today) return 'Hoje'
    if (date === tom.toISOString().split('T')[0]) return 'Amanhã'
    return dt.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })
  })()

  if (status === 'loading') return <div style={{ padding: 40, textAlign: 'center' }}>Carregando...</div>

  return (
    <div style={{ padding: '1.5rem 2rem', maxWidth: 1300, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111827' }}>Agenda Clínica</h1>
        <p style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: 2 }}>Consultas, vacinação e exames</p>
      </div>

      {/* Barra de topo: data + filtros + resumo */}
      <div style={{ background: '#fff', borderRadius: 16, padding: '14px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        {/* Navegação de data */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => setDate(d => { const dt = new Date(d + 'T12:00:00'); dt.setDate(dt.getDate() - 1); return dt.toISOString().split('T')[0] })} style={{ width: 30, height: 30, borderRadius: 8, border: '1.5px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
          <span style={{ fontWeight: 800, fontSize: 15, color: '#111827', minWidth: 70, textAlign: 'center' }}>{dateLabel}</span>
          <button onClick={() => setDate(d => { const dt = new Date(d + 'T12:00:00'); dt.setDate(dt.getDate() + 1); return dt.toISOString().split('T')[0] })} style={{ width: 30, height: 30, borderRadius: 8, border: '1.5px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</button>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ padding: '6px 10px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 13 }} />
          <button onClick={() => setDate(todayISO())} style={{ padding: '6px 12px', borderRadius: 8, background: '#f0f9ff', color: '#7C3AED', fontWeight: 700, fontSize: 12, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}>Hoje</button>
        </div>

        <div style={{ width: 1, height: 32, background: '#e5e7eb', flexShrink: 0 }} />

        {/* Filtros */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {isAdmin && (
            <select value={unitFilter} onChange={e => setUnitFilter(e.target.value)} style={{ padding: '7px 10px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 13 }}>
              <option value="all">Todas as unidades</option>
              {UNITS.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          )}
          <select value={serviceFilter} onChange={e => setServiceFilter(e.target.value)} style={{ padding: '7px 10px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 13 }}>
            <option value="all">Todos os serviços</option>
            {Object.entries(CLINIC_SERVICE_LABELS).map(([id, label]) => (
              <option key={id} value={id}>{label}</option>
            ))}
          </select>
        </div>

        <div style={{ width: 1, height: 32, background: '#e5e7eb', flexShrink: 0 }} />

        {/* Resumo compacto */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {Object.entries(STATUS_LABELS).map(([s, label]) => {
            const count = rows.filter(a => a.status === s).length
            return (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: STATUS_COLORS[s] }} />
                <span style={{ fontSize: 12, color: '#777' }}>{label}</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: count > 0 ? STATUS_COLORS[s] : '#ccc' }}>{count}</span>
              </div>
            )
          })}
          <div style={{ borderLeft: '1px solid #e5e7eb', paddingLeft: 10, display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#111827' }}>Total</span>
            <span style={{ fontSize: 14, fontWeight: 900, color: '#7C3AED' }}>{rows.length}</span>
          </div>
          {Object.entries(CLINIC_SERVICE_LABELS).map(([s, label]) => {
            const count = rows.filter(a => a.serviceType === s).length
            if (!count) return null
            return (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 4, background: SVCCOLORS[s] + '12', borderRadius: 6, padding: '3px 8px' }}>
                <span style={{ fontSize: 12 }}>{SVCICONS[s]}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: SVCCOLORS[s] }}>{count}</span>
              </div>
            )
          })}
        </div>
      </div>

        {/* Colunas por serviço */}
        <div style={{ minWidth: 0, overflowX: 'auto' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#888' }}>Carregando...</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(260px, 1fr))', gap: 16, minWidth: 780 }}>
              {Object.entries(CLINIC_SERVICE_LABELS).map(([svcKey, svcLabel]) => {
                const svcColor = SVCCOLORS[svcKey] ?? '#7C3AED'
                const svcIcon = SVCICONS[svcKey] ?? '📋'
                const svcRows = rows.filter(a => a.serviceType === svcKey).sort((a, b) => a.appointmentTime.localeCompare(b.appointmentTime))
                return (
                  <div key={svcKey}>
                    <div style={{ background: svcColor, borderRadius: '14px 14px 0 0', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 18 }}>{svcIcon}</span>
                        <span style={{ fontWeight: 800, fontSize: 14, color: '#fff' }}>{svcLabel}</span>
                      </div>
                      <span style={{ background: 'rgba(255,255,255,0.25)', color: '#fff', fontWeight: 900, fontSize: 13, padding: '2px 10px', borderRadius: 20 }}>{svcRows.length}</span>
                    </div>
                    <div style={{ background: svcColor + '10', borderRadius: '0 0 14px 14px', border: `1.5px solid ${svcColor}30`, borderTop: 'none', minHeight: 80, padding: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {svcRows.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '16px 8px', color: '#aaa', fontSize: 12 }}>Nenhum agendamento</div>
                      ) : svcRows.map(a => (
                        <div key={a.id} onClick={() => openEdit(a)} style={{ background: '#fff', borderRadius: 10, padding: '10px 12px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', borderLeft: `3px solid ${a.status === 'AWAITING_PAYMENT' ? '#e5e7eb' : STATUS_COLORS[a.status]}`, cursor: 'pointer' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                            <span style={{ fontSize: 14, fontWeight: 900, color: svcColor }}>{a.appointmentTime}</span>
                            <div style={{ display: 'flex', gap: 4 }}>
                              {a.isVip && <span style={{ fontSize: 9, background: '#fef9c3', color: '#854d0e', fontWeight: 800, padding: '1px 6px', borderRadius: 4 }}>VIP</span>}
                              <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 20, background: STATUS_COLORS[a.status] + '20', color: STATUS_COLORS[a.status] }}>{STATUS_LABELS[a.status]}</span>
                            </div>
                          </div>
                          <div style={{ fontWeight: 800, fontSize: 13, color: '#111827', marginBottom: 1 }}>
                            🐾 {a.petName}
                            {a.petBreed && <span style={{ fontWeight: 400, fontSize: 11, color: '#999' }}> · {a.petBreed}</span>}
                          </div>
                          <div style={{ fontSize: 12, color: '#555', marginBottom: 1 }}>👤 {a.tutorName}</div>
                          {a.package && (
                            <div style={{ fontSize: 11, color: svcColor, fontWeight: 700, marginBottom: 1 }}>
                              {svcKey === 'vet'
                                ? (VET_SUB_LABELS[a.package] ?? a.package)
                                : svcKey === 'vacina'
                                ? a.package.split(',').map(v => VACCINE_LABELS[v.trim()] ?? v.trim()).join(', ')
                                : a.package}
                            </div>
                          )}
                          {isAdmin && a.unitId && (
                            <div style={{ fontSize: 10, color: '#bbb', marginBottom: 1 }}>📍 {UNITS.find(u => u.id === a.unitId)?.name ?? a.unitId}</div>
                          )}
                          {a.notes && (
                            <div style={{ fontSize: 11, color: '#777', fontStyle: 'italic', margin: '4px 0', padding: '4px 8px', background: '#f8fafc', borderRadius: 6 }}>"{a.notes}"</div>
                          )}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, paddingTop: 6, borderTop: '1px solid #f1f5f9', flexWrap: 'wrap' }}>
                            <a href={`https://wa.me/55${a.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                              style={{ fontSize: 11, color: '#25D366', fontWeight: 700, textDecoration: 'none' }}>
                              📱 {a.phone}
                            </a>
                            <span style={{ fontSize: 12, fontWeight: 900, color: '#7C3AED', marginLeft: 'auto' }}>
                              R$ {Number(a.totalPrice).toFixed(2).replace('.', ',')}
                            </span>
                            <div style={{ display: 'flex', gap: 3 }}>
                              <button onClick={e => { e.stopPropagation(); deleteAppt(a.id) }} title="Excluir"
                                style={{ width: 22, height: 22, borderRadius: 6, border: '1.5px solid #fecaca', background: '#fff5f5', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#dc2626' }}>🗑</button>
                              {(['CONFIRMED', 'COMPLETED', 'CANCELLED'] as const).map(s => (
                                <button key={s} onClick={e => { e.stopPropagation(); updateStatus(a.id, s) }} title={STATUS_LABELS[s]}
                                  style={{ width: 22, height: 22, borderRadius: 6, border: `1.5px solid ${a.status === s ? STATUS_COLORS[s] : '#e5e7eb'}`, background: a.status === s ? STATUS_COLORS[s] : '#f8fafc', cursor: a.status === s ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: a.status === s ? '#fff' : '#888' }}>
                                  {s === 'CONFIRMED' ? '✓' : s === 'COMPLETED' ? '★' : '✕'}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      {/* Modal editar */}
      {editingAppt && (
        <div onClick={() => setEditingAppt(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 20, padding: 28, width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <div style={{ fontWeight: 900, fontSize: 18, color: '#111827' }}>Editar Agendamento</div>
                <div style={{ fontSize: 13, color: '#888', marginTop: 2 }}>{editingAppt.appointmentTime} · {new Date(editingAppt.appointmentDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button onClick={() => setEditLocked(l => !l)} title={editLocked ? 'Clique para editar' : 'Bloquear edição'}
                  style={{ background: editLocked ? '#f0f4f8' : '#fdf4ff', border: `1.5px solid ${editLocked ? '#e5e7eb' : '#7C3AED'}`, borderRadius: 10, padding: '8px 10px', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>
                  {editLocked ? '🔒' : '🔓'}
                </button>
                <button onClick={() => setEditingAppt(null)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#aaa' }}>×</button>
              </div>
            </div>

            {editLocked && (
              <div style={{ background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#888' }}>
                🔒 Clique no cadeado para habilitar a edição.
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ gridColumn: '1/-1', display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Nome do pet *</label>
                  <input style={{ ...inputStyle, background: editLocked ? '#f8fafc' : '#fff', color: editLocked ? '#999' : '#111827' }} value={editForm.petName} onChange={e => setEditForm(f => ({ ...f, petName: e.target.value }))} disabled={editLocked} />
                </div>
                {editingAppt.tutorCpf && (
                  <div style={{ flexShrink: 0 }}>
                    <label style={labelStyle}>CPF do tutor</label>
                    <div onClick={() => { navigator.clipboard.writeText((editingAppt.tutorCpf ?? '').replace(/\D/g, '')); setCpfCopied(true); setTimeout(() => setCpfCopied(false), 2000) }}
                      style={{ ...inputStyle, width: 'auto', background: '#f8fafc', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, color: cpfCopied ? '#16a34a' : '#111827', whiteSpace: 'nowrap' }}>
                      <span style={{ fontWeight: 700 }}>{(editingAppt.tutorCpf ?? '').replace(/\D/g, '')}</span>
                      <span style={{ fontSize: 11, color: cpfCopied ? '#16a34a' : '#bbb' }}>{cpfCopied ? '✓' : '📋'}</span>
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label style={labelStyle}>Tutor *</label>
                <input style={{ ...inputStyle, background: editLocked ? '#f8fafc' : '#fff', color: editLocked ? '#999' : '#111827' }} value={editForm.tutorName} onChange={e => setEditForm(f => ({ ...f, tutorName: e.target.value }))} disabled={editLocked} />
              </div>
              <div>
                <label style={labelStyle}>Telefone</label>
                <input style={{ ...inputStyle, background: editLocked ? '#f8fafc' : '#fff', color: editLocked ? '#999' : '#111827' }} value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} disabled={editLocked} />
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={labelStyle}>Tipo de atendimento</label>
                {editingAppt.serviceType === 'vet' ? (
                  <select style={{ ...inputStyle, background: editLocked ? '#f8fafc' : '#fff', color: editLocked ? '#999' : '#111827' }} value={editForm.pkg} onChange={e => setEditForm(f => ({ ...f, pkg: e.target.value }))} disabled={editLocked}>
                    <option value="clinico-geral">Consulta Clínico Geral</option>
                    <option value="retorno">Retorno Veterinário</option>
                    <option value="plantao">Consulta Plantão</option>
                  </select>
                ) : editingAppt.serviceType === 'vacina' ? (
                  <input style={{ ...inputStyle, background: '#f8fafc', color: '#555' }} value={editingAppt.package?.split(',').map(v => VACCINE_LABELS[v.trim()] ?? v.trim()).join(', ') ?? ''} readOnly />
                ) : (
                  <input style={{ ...inputStyle, background: '#f8fafc', color: '#555' }} value={editingAppt.package ?? ''} readOnly />
                )}
              </div>
              <div>
                <label style={labelStyle}>Status</label>
                <select style={{ ...inputStyle, background: editLocked ? '#f8fafc' : '#fff', color: editLocked ? '#999' : '#111827' }} value={editForm.status} onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))} disabled={editLocked}>
                  <option value="AWAITING_PAYMENT">Aguard. pagamento</option>
                  <option value="CONFIRMED">Confirmado</option>
                  <option value="COMPLETED">Concluído</option>
                  <option value="CANCELLED">Cancelado</option>
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: editLocked ? 0.5 : 1 }}>
                <input type="checkbox" checked={editForm.isVip} onChange={e => !editLocked && setEditForm(f => ({ ...f, isVip: e.target.checked }))} style={{ width: 16, height: 16, accentColor: '#7C3AED', cursor: editLocked ? 'default' : 'pointer' }} disabled={editLocked} />
                <label style={{ fontSize: 13, fontWeight: 600, color: '#555' }}>⭐ Encaixe VIP</label>
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={labelStyle}>Observações</label>
                <textarea style={{ ...inputStyle, height: 64, resize: editLocked ? 'none' : 'vertical', background: editLocked ? '#f8fafc' : '#fff', color: editLocked ? '#999' : '#111827' }} value={editForm.notes} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} disabled={editLocked} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={saveEdit} disabled={editLocked || !editForm.petName || !editForm.tutorName || editSaving}
                style={{ flex: 1, padding: '13px', borderRadius: 12, background: '#7C3AED', color: '#fff', fontWeight: 800, fontSize: 15, cursor: editLocked ? 'not-allowed' : 'pointer', border: 'none', opacity: (editLocked || !editForm.petName || !editForm.tutorName) ? 0.4 : 1 }}>
                {editSaving ? 'Salvando...' : 'Salvar Alterações'}
              </button>
              <button onClick={() => setEditingAppt(null)} style={{ padding: '13px 18px', borderRadius: 12, background: '#f3f4f6', color: '#555', fontWeight: 700, fontSize: 14, cursor: 'pointer', border: 'none' }}>Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
