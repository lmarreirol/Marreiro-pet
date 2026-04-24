'use client'
import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

const UNITS: { id: string; name: string }[] = [
  { id: 'caucaia', name: 'Caucaia' },
  { id: 'pecem', name: 'Pecém' },
  { id: 'saogoncalo', name: 'São Gonçalo' },
  { id: 'taiba', name: 'Taíba' },
]

const STATUS_LABEL: Record<string, string> = {
  AWAITING_PAYMENT: 'Aguardando',
  CONFIRMED: 'Confirmado',
  COMPLETED: 'Concluído',
  CANCELLED: 'Cancelado',
}
const STATUS_COLOR: Record<string, string> = {
  AWAITING_PAYMENT: '#f59e0b',
  CONFIRMED: '#10b981',
  COMPLETED: '#6366f1',
  CANCELLED: '#ef4444',
}
const PACKAGE_LABEL: Record<string, string> = {
  banho: 'Banho',
  'banho-tosa': 'Banho + Tosa',
  spa: 'Spa Completo',
}

type Appt = {
  id: string
  petName: string
  petBreed: string | null
  petSize: string | null
  tutorName: string
  phone: string
  unitId: string
  professional: string | null
  appointmentDate: string
  appointmentTime: string
  serviceType: string
  package: string | null
  addons: string[]
  status: string
  totalPrice: string
  paymentStatus: string
  notes: string | null
}

const HOURS = Array.from({ length: 22 }, (_, i) => {
  const totalMin = 480 + i * 30 // 08:00 to 18:30
  const h = Math.floor(totalMin / 60).toString().padStart(2, '0')
  const m = (totalMin % 60).toString().padStart(2, '0')
  return `${h}:${m}`
})

function toDateLocal(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatDateLabel(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
}

export default function AgendaPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [dateStr, setDateStr] = useState(toDateLocal(new Date()))
  const [unitFilter, setUnitFilter] = useState('all')
  const [serviceFilter, setServiceFilter] = useState('all')
  const [appts, setAppts] = useState<Appt[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Appt | null>(null)
  const [updating, setUpdating] = useState(false)

  const user = session?.user as Record<string, unknown> | undefined

  useEffect(() => { if (status === 'unauthenticated') router.push('/admin/login') }, [status, router])

  const load = useCallback(() => {
    if (status !== 'authenticated') return
    setLoading(true)
    const params = new URLSearchParams({ date: dateStr, role: String(user?.role ?? ''), userUnitId: String(user?.unitId ?? '') })
    if (unitFilter !== 'all') params.set('unitId', unitFilter)
    if (serviceFilter !== 'all') params.set('serviceTypes', serviceFilter)
    fetch(`/api/admin/appointments?${params}`)
      .then(r => r.json())
      .then(d => setAppts(d.appointments ?? []))
      .finally(() => setLoading(false))
  }, [status, dateStr, unitFilter, serviceFilter, user])

  useEffect(() => { load() }, [load])

  const changeDate = (delta: number) => {
    const [y, m, d] = dateStr.split('-').map(Number)
    const next = new Date(y, m - 1, d + delta)
    setDateStr(toDateLocal(next))
  }

  const updateStatus = async (id: string, newStatus: string) => {
    setUpdating(true)
    await fetch(`/api/admin/appointments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    setAppts(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a))
    setSelected(prev => prev?.id === id ? { ...prev, status: newStatus } : prev)
    setUpdating(false)
  }

  // group appointments by time slot
  const bySlot: Record<string, Appt[]> = {}
  for (const a of appts) {
    const slot = a.appointmentTime.substring(0, 5)
    if (!bySlot[slot]) bySlot[slot] = []
    bySlot[slot].push(a)
  }

  const isToday = dateStr === toDateLocal(new Date())

  return (
    <div style={{ display: 'flex', height: '100%', minHeight: '100vh', background: '#f9fafb' }}>
      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Toolbar */}
        <div style={{ background: 'white', borderBottom: '1px solid #e5e7eb', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {/* Date nav */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={() => changeDate(-1)} style={navBtn}>‹</button>
            <button onClick={() => setDateStr(toDateLocal(new Date()))} style={{ ...navBtn, background: isToday ? '#f97316' : '#f3f4f6', color: isToday ? 'white' : '#374151', padding: '6px 12px', fontSize: '0.75rem', fontWeight: 700 }}>Hoje</button>
            <button onClick={() => changeDate(1)} style={navBtn}>›</button>
            <span style={{ fontWeight: 700, color: '#111827', fontSize: '0.95rem', textTransform: 'capitalize', marginLeft: 4 }}>
              {formatDateLabel(dateStr)}
            </span>
          </div>

          <div style={{ flex: 1 }} />

          {/* Filters */}
          <select value={unitFilter} onChange={e => setUnitFilter(e.target.value)} style={selectStyle}>
            <option value="all">Todas as unidades</option>
            {UNITS.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
          <select value={serviceFilter} onChange={e => setServiceFilter(e.target.value)} style={selectStyle}>
            <option value="all">Todos os serviços</option>
            <option value="grooming">✂️ Banho & Tosa</option>
            <option value="vet">🩺 Clínica</option>
          </select>

          {/* Count */}
          <div style={{ background: '#f3f4f6', borderRadius: 8, padding: '4px 12px', fontSize: '0.8rem', fontWeight: 700, color: '#374151' }}>
            {appts.length} agendamentos
          </div>
        </div>

        {/* Calendar body */}
        <div style={{ flex: 1, overflow: 'auto', padding: '1rem 1.5rem' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: '#9ca3af' }}>Carregando...</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {HOURS.map(slot => {
                const slotAppts = bySlot[slot] ?? []
                const isHalfHour = slot.endsWith(':30')
                return (
                  <div key={slot} style={{ display: 'flex', gap: 0, minHeight: 52 }}>
                    {/* Time label */}
                    <div style={{ width: 56, flexShrink: 0, paddingTop: 6, textAlign: 'right', paddingRight: 12, fontSize: '0.72rem', color: isHalfHour ? '#d1d5db' : '#9ca3af', fontWeight: isHalfHour ? 400 : 600 }}>
                      {isHalfHour ? '' : slot}
                    </div>
                    {/* Slot row */}
                    <div style={{ flex: 1, borderTop: `1px solid ${isHalfHour ? '#f3f4f6' : '#e5e7eb'}`, paddingTop: 4, paddingLeft: 8, display: 'flex', gap: 6, flexWrap: 'wrap', alignContent: 'flex-start' }}>
                      {slotAppts.map(a => (
                        <button key={a.id} onClick={() => setSelected(a)} style={{
                          border: 'none', cursor: 'pointer', textAlign: 'left',
                          background: `${STATUS_COLOR[a.status]}18`,
                          borderLeft: `3px solid ${STATUS_COLOR[a.status]}`,
                          borderRadius: '0 8px 8px 0',
                          padding: '6px 10px',
                          minWidth: 180, maxWidth: 260,
                        }}>
                          <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#111827' }}>
                            {a.serviceType === 'grooming' ? '✂️' : '🩺'} {a.petName}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#6b7280', marginTop: 1 }}>
                            {a.tutorName} · {UNITS.find(u => u.id === a.unitId)?.name ?? a.unitId}
                          </div>
                          <div style={{ display: 'flex', gap: 4, marginTop: 4, alignItems: 'center' }}>
                            <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '1px 6px', borderRadius: 10, background: `${STATUS_COLOR[a.status]}22`, color: STATUS_COLOR[a.status] }}>
                              {STATUS_LABEL[a.status]}
                            </span>
                            {a.package && <span style={{ fontSize: '0.65rem', color: '#9ca3af' }}>{PACKAGE_LABEL[a.package] ?? a.package}</span>}
                          </div>
                        </button>
                      ))}
                      {slotAppts.length === 0 && <div style={{ height: 40 }} />}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Detail panel */}
      {selected && (
        <div style={{ width: 320, background: 'white', borderLeft: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
          <div style={{ padding: '1.25rem', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontWeight: 800, fontSize: '1rem', color: '#111827' }}>Detalhes</h2>
            <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#9ca3af' }}>×</button>
          </div>

          <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Pet / tutor */}
            <div style={{ background: '#f9fafb', borderRadius: 10, padding: '1rem' }}>
              <div style={{ fontWeight: 800, fontSize: '1rem', color: '#111827' }}>
                {selected.serviceType === 'grooming' ? '✂️' : '🩺'} {selected.petName}
              </div>
              {selected.petBreed && <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: 2 }}>{selected.petBreed}{selected.petSize ? ` · ${selected.petSize}` : ''}</div>}
              <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '10px 0' }} />
              <div style={{ fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>{selected.tutorName}</div>
              <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: 2 }}>
                📞 <a href={`tel:${selected.phone}`} style={{ color: '#6b7280', textDecoration: 'none' }}>{selected.phone}</a>
              </div>
              <a href={`https://wa.me/55${selected.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"
                style={{ display: 'inline-block', marginTop: 8, fontSize: '0.78rem', color: '#16a34a', fontWeight: 600, textDecoration: 'none' }}>
                💬 WhatsApp
              </a>
            </div>

            {/* Info */}
            <InfoRow label="Horário" value={`${selected.appointmentTime.substring(0, 5)} · ${formatDateLabel(dateStr)}`} />
            <InfoRow label="Unidade" value={UNITS.find(u => u.id === selected.unitId)?.name ?? selected.unitId} />
            {selected.professional && <InfoRow label="Profissional" value={selected.professional} />}
            {selected.package && <InfoRow label="Serviço" value={PACKAGE_LABEL[selected.package] ?? selected.package} />}
            {selected.addons?.length > 0 && <InfoRow label="Adicionais" value={selected.addons.join(', ')} />}
            <InfoRow label="Total" value={`R$ ${Number(selected.totalPrice).toFixed(2).replace('.', ',')}`} />
            {selected.notes && <InfoRow label="Observações" value={selected.notes} />}

            {/* Status badge */}
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#9ca3af', marginBottom: 6 }}>STATUS</div>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, padding: '4px 12px', borderRadius: 20, background: `${STATUS_COLOR[selected.status]}18`, color: STATUS_COLOR[selected.status] }}>
                {STATUS_LABEL[selected.status]}
              </span>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {selected.status === 'AWAITING_PAYMENT' && (
                <ActionBtn label="✅ Confirmar" color="#10b981" onClick={() => updateStatus(selected.id, 'CONFIRMED')} disabled={updating} />
              )}
              {selected.status === 'CONFIRMED' && (
                <ActionBtn label="🏁 Marcar concluído" color="#6366f1" onClick={() => updateStatus(selected.id, 'COMPLETED')} disabled={updating} />
              )}
              {selected.status !== 'CANCELLED' && selected.status !== 'COMPLETED' && (
                <ActionBtn label="❌ Cancelar" color="#ef4444" onClick={() => updateStatus(selected.id, 'CANCELLED')} disabled={updating} />
              )}
              {selected.status === 'CANCELLED' && (
                <ActionBtn label="↩️ Reativar" color="#f97316" onClick={() => updateStatus(selected.id, 'CONFIRMED')} disabled={updating} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#9ca3af', marginBottom: 2 }}>{label.toUpperCase()}</div>
      <div style={{ fontSize: '0.875rem', color: '#374151' }}>{value}</div>
    </div>
  )
}

function ActionBtn({ label, color, onClick, disabled }: { label: string; color: string; onClick: () => void; disabled: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      background: `${color}12`, color, border: `1px solid ${color}30`,
      borderRadius: 8, padding: '8px 14px', cursor: disabled ? 'not-allowed' : 'pointer',
      fontWeight: 700, fontSize: '0.85rem', opacity: disabled ? 0.6 : 1, textAlign: 'left',
    }}>
      {label}
    </button>
  )
}

const navBtn: React.CSSProperties = {
  background: '#f3f4f6', border: 'none', borderRadius: 8,
  width: 32, height: 32, cursor: 'pointer', fontWeight: 700,
  fontSize: '1rem', color: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center',
}

const selectStyle: React.CSSProperties = {
  border: '1px solid #e5e7eb', borderRadius: 8, padding: '6px 10px',
  fontSize: '0.82rem', color: '#374151', background: 'white', cursor: 'pointer',
}
