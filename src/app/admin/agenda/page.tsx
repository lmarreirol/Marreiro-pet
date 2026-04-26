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

const HOURS = Array.from({ length: 20 }, (_, i) => {
  const totalMin = 480 + i * 30
  const h = Math.floor(totalMin / 60).toString().padStart(2, '0')
  const m = (totalMin % 60).toString().padStart(2, '0')
  return `${h}:${m}`
})

type ViewMode = 'day' | 'week' | 'month'

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

function toDateLocal(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getWeekDays(dateStr: string): string[] {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const dow = date.getDay()
  const monday = new Date(date)
  monday.setDate(date.getDate() - (dow === 0 ? 6 : dow - 1))
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(monday)
    day.setDate(monday.getDate() + i)
    return toDateLocal(day)
  })
}

function getMonthGrid(dateStr: string): string[] {
  const [y, m] = dateStr.split('-').map(Number)
  const firstDay = new Date(y, m - 1, 1)
  const lastDay = new Date(y, m, 0)
  const startDow = firstDay.getDay()
  const padStart = startDow === 0 ? 6 : startDow - 1
  const endDow = lastDay.getDay()
  const padEnd = endDow === 0 ? 0 : 7 - endDow
  const total = padStart + lastDay.getDate() + padEnd
  return Array.from({ length: total }, (_, i) => {
    const day = new Date(y, m - 1, 1 - padStart + i)
    return toDateLocal(day)
  })
}

export default function AgendaPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const user = session?.user as Record<string, unknown> | undefined

  const [viewMode, setViewMode] = useState<ViewMode>('day')
  const [dateStr, setDateStr] = useState(toDateLocal(new Date()))
  const [unitFilter, setUnitFilter] = useState('all')
  const [serviceFilter, setServiceFilter] = useState('all')
  const [appts, setAppts] = useState<Appt[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Appt | null>(null)
  const [updating, setUpdating] = useState(false)

  useEffect(() => { if (status === 'unauthenticated') router.push('/admin/login') }, [status, router])

  const getDateRange = useCallback(() => {
    if (viewMode === 'day') return { startDate: dateStr, endDate: dateStr }
    if (viewMode === 'week') {
      const days = getWeekDays(dateStr)
      return { startDate: days[0], endDate: days[6] }
    }
    const [y, m] = dateStr.split('-').map(Number)
    const first = `${y}-${String(m).padStart(2, '0')}-01`
    return { startDate: first, endDate: toDateLocal(new Date(y, m, 0)) }
  }, [viewMode, dateStr])

  const load = useCallback(() => {
    if (status !== 'authenticated') return
    setLoading(true)
    const { startDate, endDate } = getDateRange()
    const params = new URLSearchParams({ startDate, endDate, role: String(user?.role ?? ''), userUnitId: String(user?.unitId ?? '') })
    if (unitFilter !== 'all') params.set('unitId', unitFilter)
    if (serviceFilter !== 'all') params.set('serviceTypes', serviceFilter)
    fetch(`/api/admin/appointments?${params}`)
      .then(r => r.json())
      .then(d => setAppts(d.appointments ?? []))
      .finally(() => setLoading(false))
  }, [status, getDateRange, unitFilter, serviceFilter, user])

  useEffect(() => { load() }, [load])

  const navigate = (delta: number) => {
    const [y, m, d] = dateStr.split('-').map(Number)
    if (viewMode === 'day') setDateStr(toDateLocal(new Date(y, m - 1, d + delta)))
    else if (viewMode === 'week') setDateStr(toDateLocal(new Date(y, m - 1, d + delta * 7)))
    else setDateStr(toDateLocal(new Date(y, m - 1 + delta, 1)))
  }

  const getNavLabel = () => {
    const [y, m, d] = dateStr.split('-').map(Number)
    if (viewMode === 'day') {
      return new Date(y, m - 1, d).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
    }
    if (viewMode === 'week') {
      const days = getWeekDays(dateStr)
      const [sy, sm, sd] = days[0].split('-').map(Number)
      const [ey, em, ed] = days[6].split('-').map(Number)
      const start = new Date(sy, sm - 1, sd)
      const end = new Date(ey, em - 1, ed)
      if (sm === em) return `${sd} – ${ed} ${start.toLocaleDateString('pt-BR', { month: 'long' })} ${sy}`
      return `${sd} ${start.toLocaleDateString('pt-BR', { month: 'short' })} – ${ed} ${end.toLocaleDateString('pt-BR', { month: 'short' })} ${sy}`
    }
    return new Date(y, m - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  }

  const updateStatus = async (id: string, newStatus: string) => {
    setUpdating(true)
    await fetch(`/api/admin/appointments/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    setAppts(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a))
    setSelected(prev => prev?.id === id ? { ...prev, status: newStatus } : prev)
    setUpdating(false)
  }

  const todayStr = toDateLocal(new Date())
  const isToday = dateStr === todayStr

  const byDate: Record<string, Appt[]> = {}
  for (const a of appts) {
    const key = a.appointmentDate.split('T')[0]
    if (!byDate[key]) byDate[key] = []
    byDate[key].push(a)
  }

  const bySlot: Record<string, Appt[]> = {}
  for (const a of (byDate[dateStr] ?? appts.filter(a => a.appointmentDate.split('T')[0] === dateStr))) {
    const slot = a.appointmentTime.substring(0, 5)
    if (!bySlot[slot]) bySlot[slot] = []
    bySlot[slot].push(a)
  }

  const weekDays = viewMode === 'week' ? getWeekDays(dateStr) : []
  const monthGrid = viewMode === 'month' ? getMonthGrid(dateStr) : []

  return (
    <div style={{ display: 'flex', height: '100%', minHeight: '100vh', background: '#f9fafb' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Toolbar */}
        <div style={{ background: 'white', borderBottom: '1px solid #e5e7eb', padding: '12px 1.5rem', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {/* View toggle */}
          <div style={{ display: 'flex', background: '#f3f4f6', borderRadius: 9, padding: 3, gap: 2, flexShrink: 0 }}>
            {(['day', 'week', 'month'] as ViewMode[]).map(v => (
              <button key={v} onClick={() => setViewMode(v)} style={{
                padding: '5px 14px', borderRadius: 7, border: 'none', cursor: 'pointer',
                fontWeight: 700, fontSize: 12,
                background: viewMode === v ? '#fff' : 'transparent',
                color: viewMode === v ? '#111827' : '#6b7280',
                boxShadow: viewMode === v ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s',
              }}>
                {v === 'day' ? 'Dia' : v === 'week' ? 'Semana' : 'Mês'}
              </button>
            ))}
          </div>

          <div style={{ width: 1, height: 28, background: '#e5e7eb', flexShrink: 0 }} />

          {/* Date nav */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button onClick={() => navigate(-1)} style={navBtn}>‹</button>
            <span style={{ fontWeight: 700, color: '#111827', fontSize: '0.85rem', textTransform: 'capitalize', minWidth: 140, textAlign: 'center' }}>
              {getNavLabel()}
            </span>
            <button onClick={() => navigate(1)} style={navBtn}>›</button>
            <button onClick={() => { setDateStr(todayStr) }} style={{ ...navBtn, background: isToday ? '#3B82F6' : '#f3f4f6', color: isToday ? '#fff' : '#374151', padding: '6px 12px', width: 'auto', fontSize: 12 }}>Hoje</button>
          </div>

          <div style={{ width: 1, height: 28, background: '#e5e7eb', flexShrink: 0 }} />

          <select value={unitFilter} onChange={e => setUnitFilter(e.target.value)} style={selectStyle}>
            <option value="all">Todas as unidades</option>
            {UNITS.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
          <select value={serviceFilter} onChange={e => setServiceFilter(e.target.value)} style={selectStyle}>
            <option value="all">Todos os serviços</option>
            <option value="grooming">✂️ Banho & Tosa</option>
            <option value="vet">🩺 Clínica</option>
          </select>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            {Object.entries(STATUS_LABEL).map(([s, label]) => {
              const count = appts.filter(a => a.status === s).length
              if (!count) return null
              return (
                <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: STATUS_COLOR[s] }} />
                  <span style={{ fontSize: 11, color: '#777' }}>{label} <strong>{count}</strong></span>
                </div>
              )
            })}
            <div style={{ borderLeft: '1px solid #e5e7eb', paddingLeft: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 900, color: '#3B82F6' }}>{appts.length} total</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: '#9ca3af' }}>Carregando...</div>
          ) : viewMode === 'day' ? (

            /* ── Dia ── */
            <div style={{ padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: 2 }}>
              {HOURS.map(slot => {
                const slotAppts = bySlot[slot] ?? []
                const isHalf = slot.endsWith(':30')
                return (
                  <div key={slot} style={{ display: 'flex', gap: 0, minHeight: 52 }}>
                    <div style={{ width: 56, flexShrink: 0, paddingTop: 6, textAlign: 'right', paddingRight: 12, fontSize: '0.72rem', color: isHalf ? '#d1d5db' : '#9ca3af', fontWeight: isHalf ? 400 : 600 }}>
                      {isHalf ? '' : slot}
                    </div>
                    <div style={{ flex: 1, borderTop: `1px solid ${isHalf ? '#f3f4f6' : '#e5e7eb'}`, paddingTop: 4, paddingLeft: 8, display: 'flex', gap: 6, flexWrap: 'wrap', alignContent: 'flex-start' }}>
                      {slotAppts.map(a => <ApptCard key={a.id} appt={a} onClick={() => setSelected(a)} />)}
                      {slotAppts.length === 0 && <div style={{ height: 40 }} />}
                    </div>
                  </div>
                )
              })}
            </div>

          ) : viewMode === 'week' ? (

            /* ── Semana ── */
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              {/* Day headers — sticky */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '52px repeat(7, 1fr)',
                background: '#fff',
                borderBottom: '2px solid #e5e7eb',
                position: 'sticky', top: 0, zIndex: 10,
              }}>
                <div />
                {weekDays.map(day => {
                  const [dy, dm, dd] = day.split('-').map(Number)
                  const d = new Date(dy, dm - 1, dd)
                  const isThisDay = day === todayStr
                  const count = (byDate[day] ?? []).length
                  return (
                    <div key={day} style={{ padding: '8px 4px 6px', textAlign: 'center', borderLeft: '1px solid #f3f4f6' }}>
                      <div style={{ fontSize: 10, color: isThisDay ? '#3B82F6' : '#9ca3af', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
                        {d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}
                      </div>
                      <div style={{
                        fontSize: 20, fontWeight: 900,
                        color: isThisDay ? '#fff' : '#111827',
                        background: isThisDay ? '#3B82F6' : 'transparent',
                        width: 34, height: 34, borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '2px auto',
                      }}>
                        {dd}
                      </div>
                      {count > 0 && (
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#3B82F6' }}>{count}</div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Time grid */}
              <div style={{ overflow: 'auto', flex: 1 }}>
                {HOURS.map(slot => {
                  const isHalf = slot.endsWith(':30')
                  return (
                    <div key={slot} style={{ display: 'grid', gridTemplateColumns: '52px repeat(7, 1fr)', minHeight: 52, borderBottom: `1px solid ${isHalf ? '#f9fafb' : '#f3f4f6'}` }}>
                      <div style={{ paddingTop: 5, textAlign: 'right', paddingRight: 8, fontSize: '0.68rem', color: isHalf ? '#e5e7eb' : '#9ca3af', fontWeight: 600, flexShrink: 0 }}>
                        {isHalf ? '' : slot}
                      </div>
                      {weekDays.map(day => {
                        const daySlotAppts = (byDate[day] ?? []).filter(a => a.appointmentTime.substring(0, 5) === slot)
                        return (
                          <div key={day} style={{ borderLeft: '1px solid #f3f4f6', padding: '3px 4px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {daySlotAppts.map(a => (
                              <button key={a.id} onClick={() => setSelected(a)} style={{
                                border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%',
                                background: `${STATUS_COLOR[a.status]}18`,
                                borderLeft: `3px solid ${STATUS_COLOR[a.status]}`,
                                borderRadius: '0 5px 5px 0',
                                padding: '3px 6px',
                              }}>
                                <div style={{ fontWeight: 700, fontSize: '0.7rem', color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {a.serviceType === 'grooming' ? '✂' : '🩺'} {a.petName}
                                </div>
                                <div style={{ fontSize: '0.62rem', color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {a.tutorName}
                                </div>
                              </button>
                            ))}
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            </div>

          ) : (

            /* ── Mês ── */
            <div style={{ padding: '1rem 1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3, marginBottom: 6 }}>
                {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(d => (
                  <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#9ca3af', padding: '4px 0' }}>{d}</div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
                {monthGrid.map(day => {
                  const [dy, dm, dd] = day.split('-').map(Number)
                  const isCurrentMonth = dm === Number(dateStr.split('-')[1])
                  const isThisDay = day === todayStr
                  const dayAppts = byDate[day] ?? []
                  return (
                    <div
                      key={day}
                      onClick={() => { setDateStr(day); setViewMode('day') }}
                      style={{
                        minHeight: 88, borderRadius: 10, padding: '8px 8px 6px',
                        background: isThisDay ? '#eff6ff' : '#fff',
                        border: `1.5px solid ${isThisDay ? '#3B82F6' : '#e5e7eb'}`,
                        opacity: isCurrentMonth ? 1 : 0.3,
                        cursor: 'pointer',
                        display: 'flex', flexDirection: 'column', gap: 3,
                        transition: 'box-shadow 0.1s',
                      }}
                    >
                      <div style={{
                        fontWeight: 900,
                        color: isThisDay ? '#fff' : '#111827',
                        background: isThisDay ? '#3B82F6' : 'transparent',
                        width: 24, height: 24, borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12,
                      }}>
                        {dd}
                      </div>
                      {dayAppts.slice(0, 3).map(a => (
                        <div
                          key={a.id}
                          onClick={e => { e.stopPropagation(); setSelected(a) }}
                          style={{
                            fontSize: 10, fontWeight: 600, padding: '2px 5px', borderRadius: 4,
                            background: `${STATUS_COLOR[a.status]}18`,
                            color: STATUS_COLOR[a.status],
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}
                        >
                          {a.appointmentTime.substring(0, 5)} {a.petName}
                        </div>
                      ))}
                      {dayAppts.length > 3 && (
                        <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600 }}>+{dayAppts.length - 3} mais</div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

          )}
        </div>
      </div>

      {/* Detail panel */}
      {selected && (
        <div style={{ width: 320, background: 'white', borderLeft: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', overflow: 'auto', flexShrink: 0 }}>
          <div style={{ padding: '1.25rem', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontWeight: 800, fontSize: '1rem', color: '#111827', margin: 0 }}>Detalhes</h2>
            <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#9ca3af', lineHeight: 1 }}>×</button>
          </div>

          <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto' }}>
            <div style={{ background: '#f9fafb', borderRadius: 10, padding: '1rem' }}>
              <div style={{ fontWeight: 800, fontSize: '1rem', color: '#111827' }}>
                {selected.serviceType === 'grooming' ? '✂️' : '🩺'} {selected.petName}
              </div>
              {selected.petBreed && (
                <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: 2 }}>
                  {selected.petBreed}{selected.petSize ? ` · ${selected.petSize}` : ''}
                </div>
              )}
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

            <InfoRow label="Data" value={new Date(selected.appointmentDate).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} />
            <InfoRow label="Horário" value={selected.appointmentTime.substring(0, 5)} />
            <InfoRow label="Unidade" value={UNITS.find(u => u.id === selected.unitId)?.name ?? selected.unitId} />
            {selected.professional && <InfoRow label="Profissional" value={selected.professional} />}
            {selected.package && <InfoRow label="Serviço" value={PACKAGE_LABEL[selected.package] ?? selected.package} />}
            {selected.addons?.length > 0 && <InfoRow label="Adicionais" value={selected.addons.join(', ')} />}
            <InfoRow label="Total" value={`R$ ${Number(selected.totalPrice).toFixed(2).replace('.', ',')}`} />
            {selected.notes && <InfoRow label="Observações" value={selected.notes} />}

            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#9ca3af', marginBottom: 6 }}>STATUS</div>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, padding: '4px 12px', borderRadius: 20, background: `${STATUS_COLOR[selected.status]}18`, color: STATUS_COLOR[selected.status] }}>
                {STATUS_LABEL[selected.status]}
              </span>
            </div>

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

function ApptCard({ appt, onClick }: { appt: Appt; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      border: 'none', cursor: 'pointer', textAlign: 'left',
      background: `${STATUS_COLOR[appt.status]}18`,
      borderLeft: `3px solid ${STATUS_COLOR[appt.status]}`,
      borderRadius: '0 8px 8px 0',
      padding: '6px 10px',
      minWidth: 180, maxWidth: 260,
    }}>
      <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#111827' }}>
        {appt.serviceType === 'grooming' ? '✂️' : '🩺'} {appt.petName}
      </div>
      <div style={{ fontSize: '0.72rem', color: '#6b7280', marginTop: 1 }}>
        {appt.tutorName} · {UNITS.find(u => u.id === appt.unitId)?.name ?? appt.unitId}
      </div>
      <div style={{ display: 'flex', gap: 4, marginTop: 4, alignItems: 'center' }}>
        <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '1px 6px', borderRadius: 10, background: `${STATUS_COLOR[appt.status]}22`, color: STATUS_COLOR[appt.status] }}>
          {STATUS_LABEL[appt.status]}
        </span>
        {appt.package && <span style={{ fontSize: '0.65rem', color: '#9ca3af' }}>{PACKAGE_LABEL[appt.package] ?? appt.package}</span>}
      </div>
    </button>
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
  width: 30, height: 30, cursor: 'pointer', fontWeight: 700,
  fontSize: '1rem', color: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center',
  flexShrink: 0,
}

const selectStyle: React.CSSProperties = {
  border: '1px solid #e5e7eb', borderRadius: 8, padding: '6px 10px',
  fontSize: '0.82rem', color: '#374151', background: 'white', cursor: 'pointer',
}
