'use client'
import { useEffect, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const UNITS = [
  { id: 'caucaia', name: 'Caucaia' },
  { id: 'pecem', name: 'Pecém' },
  { id: 'saogoncalo', name: 'São Gonçalo' },
  { id: 'taiba', name: 'Taíba' },
]

const STATUS_LABELS: Record<string, string> = {
  AWAITING_PAYMENT: 'Aguard. pagamento',
  CONFIRMED: 'Confirmado',
  CANCELLED: 'Cancelado',
  COMPLETED: 'Concluído',
}

const STATUS_COLORS: Record<string, string> = {
  AWAITING_PAYMENT: '#f59e0b',
  CONFIRMED: '#16a34a',
  CANCELLED: '#dc2626',
  COMPLETED: '#6366f1',
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

type Appointment = {
  id: string
  serviceType: string | null
  petName: string
  petBreed: string | null
  tutorName: string
  tutorCpf: string | null
  phone: string
  package: string | null
  addons: string[]
  petSize: string | null
  unitId: string
  professional: string | null
  appointmentDate: string
  appointmentTime: string
  status: string
  totalPrice: string
  notes: string | null
  isVip: boolean
}

function todayISO() { return new Date().toISOString().split('T')[0] }

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [date, setDate] = useState(todayISO())
  const [calMonth, setCalMonth] = useState(() => todayISO().substring(0, 7))
  const [unitFilter, setUnitFilter] = useState<string>('all')
  const [proFilter, setProFilter] = useState<string>('all')
  const [tab, setTab] = useState<'appointments' | 'availability' | 'report'>('appointments')
  const [refreshKey, setRefreshKey] = useState(0)
  const [search, setSearch] = useState('')
  const [monthCounts, setMonthCounts] = useState<Record<string, number>>({})
  const [bookingSlot, setBookingSlot] = useState<{ slot: string; pro: string | null; unitId: string } | null>(null)
  const [bookingForm, setBookingForm] = useState({ petName: '', petBreed: '', petSize: 'small', tutorName: '', phone: '', cpf: '', pkg: 'banho', addons: [] as string[], notes: '', isVip: false })
  const [dbProfessionals, setDbProfessionals] = useState<{ slug: string; name: string; unitId: string }[]>([])
  const [smartSuggestions, setSmartSuggestions] = useState<{ time: string; professional: string; professionalName: string; score: number; reason: string }[]>([])
  const [smartLoading, setSmartLoading] = useState(false)
  const [smartMode, setSmartMode] = useState(false)
  const [smartTrigger, setSmartTrigger] = useState(0)

  const PKG_PRICES: Record<string, Record<string, number>> = {
    'banho':      { small: 49,  medium: 60,  large: 90  },
    'banho-tosa': { small: 72,  medium: 90,  large: 120 },
    'spa':        { small: 109, medium: 120, large: 150 },
  }
  const ADDON_PRICES: Record<string, number> = { hidra: 28, ozonio: 35, dentes: 10, unhas: 36, perfume: 18, coloracao: 60 }
  const VIP_PRICE = 30
  const calcBookingTotal = (f: { pkg: string; petSize: string; addons: string[]; isVip: boolean }) => {
    const base = PKG_PRICES[f.pkg]?.[f.petSize] ?? 0
    const addonsTotal = f.addons.reduce((s, id) => s + (ADDON_PRICES[id] ?? 0), 0)
    return base + addonsTotal + (f.isVip ? VIP_PRICE : 0)
  }
  const [bookingSaving, setBookingSaving] = useState(false)
  const [draggingAppt, setDraggingAppt] = useState<Appointment | null>(null)
  const [dragOverKey, setDragOverKey] = useState<string | null>(null)
  const [pendingDrop, setPendingDrop] = useState<{ appt: Appointment; slot: string; pro: string | null } | null>(null)
  const [editingAppt, setEditingAppt] = useState<Appointment | null>(null)
  const [editForm, setEditForm] = useState({ petName: '', petBreed: '', petSize: 'small', tutorName: '', phone: '', pkg: 'banho', addons: [] as string[], notes: '', isVip: false, status: 'CONFIRMED' })
  const [editSaving, setEditSaving] = useState(false)
  const [editLocked, setEditLocked] = useState(true)
  const [cpfCopied, setCpfCopied] = useState(false)
  const [reschedulingAppt, setReschedulingAppt] = useState<Appointment | null>(null)
  const [rescheduleForm, setRescheduleForm] = useState({ date: '', time: '' })
  const [rescheduleSaving, setRescheduleSaving] = useState(false)
  const [rescheduleSlots, setRescheduleSlots] = useState<{ time: string; availableCount: number }[]>([])
  const [rescheduleSlotsLoading, setRescheduleSlotsLoading] = useState(false)

  const dropReschedule = async (appt: Appointment, newSlot: string, newPro: string | null) => {
    if (appt.appointmentTime === newSlot && (appt.professional ?? null) === newPro) return
    setAppointments(prev => prev.map(a => a.id === appt.id ? { ...a, appointmentTime: newSlot, professional: newPro } : a))
    await fetch(`/api/admin/appointments/${appt.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appointmentTime: newSlot, professional: newPro }),
    })
  }

  const saveReschedule = async () => {
    if (!reschedulingAppt || !rescheduleForm.date || !rescheduleForm.time) return
    setRescheduleSaving(true)
    await fetch(`/api/admin/appointments/${reschedulingAppt.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appointmentDate: new Date(`${rescheduleForm.date}T${rescheduleForm.time}:00`).toISOString(), appointmentTime: rescheduleForm.time }),
    })
    setRescheduleSaving(false)
    setReschedulingAppt(null)
    setRefreshKey(k => k + 1)
  }

  const user = session?.user as any
  const isAdmin = user?.role === 'ADMIN'

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/admin/login')
  }, [status])

  useEffect(() => {
    if (status !== 'authenticated') return
    fetch('/api/admin/professionals')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setDbProfessionals(d.map((p: { slug: string; name: string; unitId: string }) => ({ slug: p.slug, name: p.name, unitId: p.unitId }))) })
      .catch(() => {})
  }, [status])

  const runSmartSchedule = async (overrides?: { unitId?: string; pkg?: string; petSize?: string; addons?: string[] }) => {
    const unitId = overrides?.unitId ?? bookingSlot?.unitId ?? (unitFilter !== 'all' ? unitFilter : (String(user?.unitId ?? '') || 'caucaia'))
    const pkg = overrides?.pkg ?? bookingForm.pkg
    const petSize = overrides?.petSize ?? bookingForm.petSize
    const addons = overrides?.addons ?? bookingForm.addons
    setSmartLoading(true)
    setSmartSuggestions([])
    try {
      const res = await fetch('/api/smart-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unitId, pkg, addons, petSize, date }),
      })
      const text = await res.text()
      let json: { suggestions?: unknown[] } = {}
      try { json = JSON.parse(text) } catch {
        console.error('[SmartSchedule] resposta não-JSON:', res.status, text.slice(0, 300))
      }
      setSmartSuggestions((json.suggestions ?? []) as { time: string; professional: string; professionalName: string; score: number; reason: string }[])
    } catch (err) {
      console.error('[SmartSchedule] erro de rede:', err)
    }
    finally { setSmartLoading(false) }
  }

  // Dispara após o estado ser commitado (garante bookingSlot.unitId correto)
  useEffect(() => {
    if (smartTrigger === 0 || !bookingSlot || bookingSlot.slot !== '') return
    runSmartSchedule({ unitId: bookingSlot.unitId, pkg: bookingForm.pkg, petSize: bookingForm.petSize, addons: bookingForm.addons })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [smartTrigger])

  useEffect(() => {
    if (status !== 'authenticated') return
    setLoading(true)
    const params = new URLSearchParams({ date, role: user?.role ?? '', userUnitId: user?.unitId ?? '', serviceTypes: 'grooming' })
    if (isAdmin && unitFilter !== 'all') params.set('unitId', unitFilter)
    if (proFilter !== 'all') params.set('professional', proFilter)
    fetch(`/api/admin/appointments?${params}`)
      .then(r => r.json())
      .then(d => { setAppointments(d.appointments ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [date, unitFilter, proFilter, status, refreshKey])

  useEffect(() => {
    if (status !== 'authenticated') return
    const params = new URLSearchParams({ role: user?.role ?? '', userUnitId: user?.unitId ?? '', serviceTypes: 'grooming' })
    if (isAdmin && unitFilter !== 'all') params.set('unitId', unitFilter)
    fetch(`/api/admin/appointments?${params}`)
      .then(r => r.json())
      .then(d => {
        const counts: Record<string, number> = {}
        for (const a of (d.appointments ?? [])) {
          const day = (a.appointmentDate as string)?.split('T')[0]
          if (day) counts[day] = (counts[day] ?? 0) + 1
        }
        setMonthCounts(counts)
      })
      .catch(() => {})
  }, [calMonth, unitFilter, status])

  const updateStatus = async (id: string, newStatus: string) => {
    if (newStatus === 'CANCELLED') {
      if (!window.confirm('Tem certeza que deseja cancelar este agendamento?')) return
      await fetch(`/api/admin/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a))
      // Abre formulário de novo agendamento no mesmo horário/profissional
      const appt = appointments.find(a => a.id === id)
      if (appt) {
        setBookingForm({ petName: '', petBreed: '', petSize: appt.petSize ?? 'small', tutorName: '', phone: '', cpf: '', pkg: appt.package ?? 'banho', addons: appt.addons ?? [], notes: '', isVip: false })
        setBookingSlot({ slot: appt.appointmentTime, pro: appt.professional, unitId: appt.unitId })
      }
      return
    }
    await fetch(`/api/admin/appointments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a))
  }

  const deleteAppt = async (id: string) => {
    if (!window.confirm('Excluir este agendamento? Esta ação não pode ser desfeita.')) return
    await fetch(`/api/appointments/${id}`, { method: 'DELETE' })
    setAppointments(prev => prev.filter(a => a.id !== id))
  }

  const createManualBooking = async () => {
    if (!bookingSlot || !bookingForm.petName || !bookingForm.tutorName || bookingForm.cpf.replace(/\D/g,'').length !== 11) return
    setBookingSaving(true)
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceType: 'grooming',
          package: bookingForm.pkg,
          addons: bookingForm.addons,
          unitId: bookingSlot.unitId,
          professional: bookingSlot.pro,
          petName: bookingForm.petName,
          petBreed: bookingForm.petBreed || null,
          petSize: bookingForm.petSize,
          tutorName: bookingForm.tutorName,
          tutorCpf: bookingForm.cpf.replace(/\D/g, ''),
          phone: bookingForm.phone || 'Admin',
          date,
          time: bookingSlot.slot,
          totalPrice: calcBookingTotal(bookingForm),
          notes: bookingForm.notes,
          isVip: bookingForm.isVip,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.appointmentId) {
          await fetch(`/api/admin/appointments/${data.appointmentId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'CONFIRMED' }),
          }).catch(() => {})
        }
      }
    } catch (e) {
      console.error('Erro ao criar agendamento:', e)
    }
    setBookingSaving(false)
    setBookingSlot(null)
    setBookingForm({ petName: '', petBreed: '', petSize: 'small', tutorName: '', phone: '', cpf: '', pkg: 'banho', addons: [], notes: '', isVip: false })
    setSmartSuggestions([])
    setRefreshKey(k => k + 1)
  }

  const openEditAppt = (a: Appointment) => {
    setEditingAppt(a)
    setEditLocked(true)
    setCpfCopied(false)
    setEditForm({ petName: a.petName, petBreed: a.petBreed ?? '', petSize: a.petSize ?? 'small', tutorName: a.tutorName, phone: a.phone, pkg: a.package ?? 'banho', addons: a.addons ?? [], notes: a.notes ?? '', isVip: a.isVip, status: a.status })
  }

  const saveEditAppt = async () => {
    if (!editingAppt) return
    setEditSaving(true)
    await fetch(`/api/admin/appointments/${editingAppt.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        petName: editForm.petName,
        petBreed: editForm.petBreed || null,
        petSize: editForm.petSize,
        tutorName: editForm.tutorName,
        phone: editForm.phone,
        package: editForm.pkg,
        addons: editForm.addons,
        notes: editForm.notes,
        isVip: editForm.isVip,
        status: editForm.status,
        totalPrice: calcBookingTotal({ ...editForm, pkg: editForm.pkg }),
      }),
    })
    setEditSaving(false)
    setEditingAppt(null)
    setRefreshKey(k => k + 1)
  }

  const filteredAppointments = search
    ? appointments.filter(a =>
        a.petName.toLowerCase().includes(search.toLowerCase()) ||
        a.tutorName.toLowerCase().includes(search.toLowerCase()) ||
        a.phone.includes(search)
      )
    : appointments

  if (status === 'loading') return <div style={{ padding: 40, textAlign: 'center' }}>Carregando...</div>

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4f8' }}>
      {/* Modal agendamento manual */}
      {bookingSlot && (
        <div onClick={() => { setBookingSlot(null); setSmartMode(false); setSmartSuggestions([]) }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 820, maxHeight: '92vh', display: 'flex', flexDirection: 'column', boxShadow: '0 16px 48px rgba(0,0,0,0.18)', overflow: 'hidden' }}>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #f3f4f6', flexShrink: 0 }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 15, color: '#0F1B2D' }}>
                  {smartMode ? '✦ Smart Scheduling' : bookingForm.isVip && bookingSlot.slot === '' ? '⭐ Encaixe VIP' : 'Novo Agendamento'}
                </div>
                {bookingSlot.slot ? (
                  <div style={{ fontSize: 12, color: '#888', marginTop: 1 }}>
                    {bookingSlot.slot} · {new Date(date+'T12:00:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'short'})}
                  </div>
                ) : smartMode ? (
                  <div style={{ fontSize: 11, color: '#EF7720', marginTop: 1 }}>Selecione o melhor horário à esquerda</div>
                ) : null}
              </div>
              <button onClick={() => { setBookingSlot(null); setSmartMode(false); setSmartSuggestions([]) }} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#bbb', lineHeight: 1 }}>×</button>
            </div>

            {/* Body: dois painéis lado a lado */}
            <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>

              {/* Painel esquerdo — horário / sugestões */}
              <div style={{ width: 280, flexShrink: 0, borderRight: '1px solid #f3f4f6', padding: '16px 16px', overflowY: 'auto', background: '#fafafa' }}>

                {/* Seleção manual de unidade/horário/profissional */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {bookingSlot.slot === '' && (
                    <>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: '#777', display: 'block', marginBottom: 3 }}>Unidade *</label>
                        <select style={{ ...inputStyle, padding: '7px 10px', fontSize: 13 }} value={bookingSlot.unitId} onChange={e => setBookingSlot(s => ({ ...s!, unitId: e.target.value, pro: null }))}>
                          {UNITS.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: '#777', display: 'block', marginBottom: 3 }}>Horário *</label>
                        <select style={{ ...inputStyle, padding: '7px 10px', fontSize: 13 }} value={bookingSlot.slot} onChange={e => setBookingSlot(s => ({ ...s!, slot: e.target.value }))}>
                          <option value="">Selecione</option>
                          {(() => { const s: string[] = []; for (let h = 7; h <= 19; h++) { s.push(`${String(h).padStart(2,'0')}:00`); if (h < 19) s.push(`${String(h).padStart(2,'0')}:30`) } return s })().map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: '#777', display: 'block', marginBottom: 3 }}>Profissional</label>
                        <select style={{ ...inputStyle, padding: '7px 10px', fontSize: 13 }} value={bookingSlot.pro ?? ''} onChange={e => setBookingSlot(s => ({ ...s!, pro: e.target.value || null }))}>
                          <option value="">Sem preferência</option>
                          {dbProfessionals.filter(p => p.unitId === bookingSlot.unitId).map(p => <option key={p.slug} value={p.slug}>{p.name}</option>)}
                        </select>
                      </div>
                    </>
                  )}
                </div>

                {/* Smart suggestions */}
                {smartMode && bookingSlot.slot === '' && (
                  <div style={{ marginTop: bookingSlot.slot === '' ? 14 : 0 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#92400e', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      ✦ Melhores horários
                    </div>
                    {smartLoading ? (
                      <div style={{ textAlign: 'center', padding: '16px 0', color: '#EF7720', fontSize: 12, fontWeight: 700 }}>⏳ Calculando...</div>
                    ) : smartSuggestions.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                        {smartSuggestions.map((s, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => {
                              setBookingSlot(b => ({ ...b!, slot: s.time, pro: s.professional }))
                              setSmartSuggestions([])
                            }}
                            style={{
                              width: '100%', textAlign: 'left', padding: '9px 11px', borderRadius: 9,
                              background: i === 0 ? '#fff7ed' : '#fff',
                              border: `1.5px solid ${i === 0 ? '#fed7aa' : '#e5e7eb'}`,
                              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                              boxShadow: i === 0 ? '0 1px 4px rgba(239,119,32,0.12)' : 'none',
                            }}
                          >
                            <span style={{ fontWeight: 900, fontSize: 15, color: '#004A99', minWidth: 42, flexShrink: 0 }}>{s.time}</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 700, fontSize: 11, color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.professionalName}</div>
                              <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.reason}</div>
                            </div>
                            {i === 0 && <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 20, background: '#EF7720', color: '#fff', flexShrink: 0 }}>★</span>}
                          </button>
                        ))}
                        <button type="button" onClick={() => runSmartSchedule()} style={{ background: 'none', border: 'none', fontSize: 10, color: '#EF7720', cursor: 'pointer', fontWeight: 700, padding: '4px 0', textAlign: 'left' }}>
                          ↺ Recalcular
                        </button>
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '10px 0', color: '#9ca3af', fontSize: 11 }}>
                        Nenhuma sugestão.
                        <button type="button" onClick={() => runSmartSchedule()} style={{ display: 'block', margin: '4px auto 0', background: 'none', border: 'none', fontSize: 10, color: '#EF7720', cursor: 'pointer', fontWeight: 700 }}>↺ Tentar novamente</button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Painel direito — dados do agendamento */}
              <div style={{ flex: 1, padding: '16px 20px', overflowY: 'auto' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>

                  <div style={{ gridColumn: '1/-1' }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#777', display: 'block', marginBottom: 3 }}>Pet *</label>
                    <input style={{ ...inputStyle, padding: '7px 10px', fontSize: 13 }} placeholder="Nome do pet" value={bookingForm.petName} onChange={e => setBookingForm(f => ({...f, petName: e.target.value}))} autoFocus />
                  </div>

                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#777', display: 'block', marginBottom: 3 }}>Raça</label>
                    <input style={{ ...inputStyle, padding: '7px 10px', fontSize: 13 }} placeholder="SRD, Border…" value={bookingForm.petBreed} onChange={e => setBookingForm(f => ({...f, petBreed: e.target.value}))} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#777', display: 'block', marginBottom: 3 }}>Porte</label>
                    <select style={{ ...inputStyle, padding: '7px 10px', fontSize: 13 }} value={bookingForm.petSize} onChange={e => setBookingForm(f => ({...f, petSize: e.target.value}))}>
                      <option value="small">Pequeno</option>
                      <option value="medium">Médio</option>
                      <option value="large">Grande</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#777', display: 'block', marginBottom: 3 }}>Tutor *</label>
                    <input style={{ ...inputStyle, padding: '7px 10px', fontSize: 13 }} placeholder="Nome do tutor" value={bookingForm.tutorName} onChange={e => setBookingForm(f => ({...f, tutorName: e.target.value}))} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#777', display: 'block', marginBottom: 3 }}>CPF *</label>
                    <input
                      style={{ ...inputStyle, padding: '7px 10px', fontSize: 13, borderColor: bookingForm.cpf && bookingForm.cpf.replace(/\D/g,'').length < 11 ? '#fca5a5' : bookingForm.cpf.replace(/\D/g,'').length === 11 ? '#86efac' : '#e5e7eb' }}
                      placeholder="000.000.000-00" value={bookingForm.cpf} maxLength={14}
                      onChange={e => {
                        const raw = e.target.value.replace(/\D/g, '').slice(0, 11)
                        const fmt = raw.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, (_,a,b,c,d) => d ? `${a}.${b}.${c}-${d}` : c ? `${a}.${b}.${c}` : b ? `${a}.${b}` : a)
                        setBookingForm(f => ({...f, cpf: fmt}))
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#777', display: 'block', marginBottom: 3 }}>Telefone</label>
                    <input style={{ ...inputStyle, padding: '7px 10px', fontSize: 13 }} placeholder="(85) 9 9999-9999" value={bookingForm.phone} onChange={e => setBookingForm(f => ({...f, phone: e.target.value}))} />
                  </div>

                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#777', display: 'block', marginBottom: 3 }}>Pacote</label>
                    <select style={{ ...inputStyle, padding: '7px 10px', fontSize: 13 }} value={bookingForm.pkg} onChange={e => setBookingForm(f => ({...f, pkg: e.target.value}))}>
                      <option value="banho">Banho</option>
                      <option value="banho-tosa">Banho + Tosa</option>
                      <option value="spa">Tosa Completa</option>
                    </select>
                  </div>

                  <div style={{ gridColumn: '1/-1' }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#777', display: 'block', marginBottom: 4 }}>Extras</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {Object.entries(ADDONS).map(([id, label]) => {
                        const checked = bookingForm.addons.includes(id)
                        return (
                          <label key={id} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 20, border: `1.5px solid ${checked ? '#EF7720' : '#e5e7eb'}`, background: checked ? '#fff4ed' : '#fafafa', cursor: 'pointer', fontSize: 12, fontWeight: checked ? 700 : 400, color: checked ? '#EF7720' : '#666', userSelect: 'none' }}>
                            <input type="checkbox" checked={checked} onChange={() => setBookingForm(f => ({ ...f, addons: checked ? f.addons.filter(a => a !== id) : [...f.addons, id] }))} style={{ display: 'none' }} />
                            {label}
                          </label>
                        )
                      })}
                    </div>
                  </div>

                  <div style={{ gridColumn: '1/-1', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f0f7ff', borderRadius: 10, padding: '10px 14px', border: '1px solid #dbeafe' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#555' }}>
                      <input type="checkbox" checked={bookingForm.isVip} onChange={e => setBookingForm(f => ({...f, isVip: e.target.checked}))} style={{ width: 15, height: 15, accentColor: '#EF7720', cursor: 'pointer' }} />
                      ⭐ VIP
                    </label>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                      <span style={{ fontSize: 11, color: '#888', fontWeight: 600 }}>Total</span>
                      <span style={{ fontSize: 20, fontWeight: 900, color: '#004A99' }}>R$ {calcBookingTotal(bookingForm).toFixed(2).replace('.', ',')}</span>
                    </div>
                  </div>

                  <div style={{ gridColumn: '1/-1' }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#777', display: 'block', marginBottom: 3 }}>Obs.</label>
                    <textarea style={{ ...inputStyle, padding: '7px 10px', fontSize: 13, height: 52, resize: 'vertical' }} placeholder="Observações..." value={bookingForm.notes} onChange={e => setBookingForm(f => ({...f, notes: e.target.value}))} />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', gap: 8, padding: '12px 20px', borderTop: '1px solid #f3f4f6', flexShrink: 0 }}>
              <button onClick={createManualBooking}
                disabled={!bookingForm.petName || !bookingForm.tutorName || bookingForm.cpf.replace(/\D/g,'').length !== 11 || !bookingSlot.slot || bookingSaving}
                style={{ flex: 1, padding: '10px', borderRadius: 10, background: '#004A99', color: '#fff', fontWeight: 800, fontSize: 14, cursor: 'pointer', border: 'none', opacity: (!bookingForm.petName || !bookingForm.tutorName || bookingForm.cpf.replace(/\D/g,'').length !== 11 || !bookingSlot.slot) ? 0.5 : 1 }}>
                {bookingSaving ? 'Salvando...' : 'Confirmar agendamento'}
              </button>
              <button onClick={() => { setBookingSlot(null); setSmartMode(false); setSmartSuggestions([]) }} style={{ padding: '10px 20px', borderRadius: 10, background: '#f0f4f8', color: '#666', fontWeight: 600, fontSize: 13, cursor: 'pointer', border: 'none' }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
      {/* Modal confirmação de remarcação por drag */}
      {pendingDrop && (
        <div onClick={() => setPendingDrop(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, padding: 28, width: '100%', maxWidth: 380, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ fontSize: 22, marginBottom: 12, textAlign: 'center' }}>🗓️</div>
            <div style={{ fontWeight: 900, fontSize: 17, color: '#0F1B2D', textAlign: 'center', marginBottom: 6 }}>Confirmar remarcação?</div>
            <div style={{ fontSize: 13, color: '#555', textAlign: 'center', marginBottom: 20, lineHeight: 1.6 }}>
              <strong>{pendingDrop.appt.petName}</strong> ({pendingDrop.appt.tutorName})<br />
              <span style={{ color: '#999', textDecoration: 'line-through' }}>{pendingDrop.appt.appointmentTime}</span>
              {' → '}
              <span style={{ color: '#3B82F6', fontWeight: 800 }}>{pendingDrop.slot}</span>
              {pendingDrop.pro && pendingDrop.pro !== pendingDrop.appt.professional && (
                <><br /><span style={{ fontSize: 12, color: '#A855F7' }}>Profissional: {PRO_NAME_MAP_GLOBAL[pendingDrop.pro] ?? pendingDrop.pro}</span></>
              )}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setPendingDrop(null)} style={{ flex: 1, padding: '11px', borderRadius: 10, background: '#f3f4f6', border: 'none', fontWeight: 700, fontSize: 14, color: '#555', cursor: 'pointer' }}>
                Cancelar
              </button>
              <button onClick={() => { dropReschedule(pendingDrop.appt, pendingDrop.slot, pendingDrop.pro); setPendingDrop(null) }} style={{ flex: 1, padding: '11px', borderRadius: 10, background: '#3B82F6', border: 'none', fontWeight: 800, fontSize: 14, color: '#fff', cursor: 'pointer' }}>
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal edição de agendamento */}
      {editingAppt && (
        <div onClick={() => setEditingAppt(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 20, padding: 28, width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <div style={{ fontWeight: 900, fontSize: 18, color: '#0F1B2D' }}>Editar Agendamento</div>
                <div style={{ fontSize: 13, color: '#888', marginTop: 2 }}>{editingAppt.appointmentTime} · {new Date(editingAppt.appointmentDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {/* Cadeado */}
                <button onClick={() => setEditLocked(l => !l)} title={editLocked ? 'Clique para editar' : 'Bloquear edição'}
                  style={{ background: editLocked ? '#f0f4f8' : '#fff4ed', border: `1.5px solid ${editLocked ? '#e5e7eb' : '#EF7720'}`, borderRadius: 10, padding: '8px 10px', cursor: 'pointer', fontSize: 18, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {editLocked ? '🔒' : '🔓'}
                </button>
                <button onClick={() => setEditingAppt(null)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#aaa' }}>×</button>
              </div>
            </div>

            {editLocked && (
              <div style={{ background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#888', display: 'flex', alignItems: 'center', gap: 8 }}>
                🔒 <span>Clique no cadeado para habilitar a edição dos campos.</span>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ gridColumn: '1/-1', display: 'flex', gap: 12, alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Nome do pet *</label>
                  <input style={{ ...inputStyle, background: editLocked ? '#f8fafc' : '#fff', color: editLocked ? '#999' : '#0F1B2D' }} value={editForm.petName} onChange={e => setEditForm(f => ({ ...f, petName: e.target.value }))} disabled={editLocked} />
                </div>
                <div style={{ flexShrink: 0 }}>
                  <label style={labelStyle}>CPF do tutor</label>
                  {editingAppt?.tutorCpf ? (
                    <div onClick={() => {
                      navigator.clipboard.writeText((editingAppt.tutorCpf ?? '').replace(/\D/g, ''))
                      setCpfCopied(true)
                      setTimeout(() => setCpfCopied(false), 2000)
                    }} title="Clique para copiar o CPF"
                      style={{ ...inputStyle, width: 'auto', background: '#f8fafc', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, userSelect: 'none', color: cpfCopied ? '#16a34a' : '#0F1B2D', borderColor: cpfCopied ? '#16a34a' : '#e5e7eb', transition: 'all 0.2s', whiteSpace: 'nowrap' }}>
                      <span style={{ fontWeight: 700, letterSpacing: 0.5 }}>{(editingAppt.tutorCpf ?? '').replace(/\D/g, '')}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: cpfCopied ? '#16a34a' : '#bbb' }}>{cpfCopied ? '✓' : '📋'}</span>
                    </div>
                  ) : (
                    <div style={{ ...inputStyle, background: '#f8fafc', color: '#bbb', fontStyle: 'italic', whiteSpace: 'nowrap' }}>Não informado</div>
                  )}
                </div>
              </div>
              <div>
                <label style={labelStyle}>Raça</label>
                <input style={{ ...inputStyle, background: editLocked ? '#f8fafc' : '#fff', color: editLocked ? '#999' : '#0F1B2D' }} value={editForm.petBreed} onChange={e => setEditForm(f => ({ ...f, petBreed: e.target.value }))} disabled={editLocked} />
              </div>
              <div>
                <label style={labelStyle}>Porte</label>
                <select style={{ ...inputStyle, background: editLocked ? '#f8fafc' : '#fff', color: editLocked ? '#999' : '#0F1B2D' }} value={editForm.petSize} onChange={e => setEditForm(f => ({ ...f, petSize: e.target.value }))} disabled={editLocked}>
                  <option value="small">Pequeno</option>
                  <option value="medium">Médio</option>
                  <option value="large">Grande</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Tutor *</label>
                <input style={{ ...inputStyle, background: editLocked ? '#f8fafc' : '#fff', color: editLocked ? '#999' : '#0F1B2D' }} value={editForm.tutorName} onChange={e => setEditForm(f => ({ ...f, tutorName: e.target.value }))} disabled={editLocked} />
              </div>
              <div>
                <label style={labelStyle}>Telefone</label>
                <input style={{ ...inputStyle, background: editLocked ? '#f8fafc' : '#fff', color: editLocked ? '#999' : '#0F1B2D' }} value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} disabled={editLocked} />
              </div>
              {editingAppt?.serviceType === 'vet' ? (
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={labelStyle}>Tipo de atendimento</label>
                  <select style={{ ...inputStyle, background: editLocked ? '#f8fafc' : '#fff', color: editLocked ? '#999' : '#0F1B2D' }} value={editForm.pkg} onChange={e => setEditForm(f => ({ ...f, pkg: e.target.value }))} disabled={editLocked}>
                    <option value="clinico-geral">Consulta Clínico Geral</option>
                    <option value="retorno">Retorno Veterinário</option>
                    <option value="plantao">Consulta Plantão</option>
                  </select>
                </div>
              ) : (
                <div>
                  <label style={labelStyle}>Pacote</label>
                  <select style={{ ...inputStyle, background: editLocked ? '#f8fafc' : '#fff', color: editLocked ? '#999' : '#0F1B2D' }} value={editForm.pkg} onChange={e => setEditForm(f => ({ ...f, pkg: e.target.value }))} disabled={editLocked}>
                    <option value="banho">Banho Tradicional</option>
                    <option value="banho-tosa">Banho + Tosa Higiênica</option>
                    <option value="spa">Tosa Completa + Banho</option>
                  </select>
                </div>
              )}
              <div>
                <label style={labelStyle}>Status</label>
                <select style={{ ...inputStyle, background: editLocked ? '#f8fafc' : '#fff', color: editLocked ? '#999' : '#0F1B2D' }} value={editForm.status} onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))} disabled={editLocked}>
                  <option value="AWAITING_PAYMENT">Aguard. pagamento</option>
                  <option value="CONFIRMED">Confirmado</option>
                  <option value="COMPLETED">Concluído</option>
                  <option value="CANCELLED">Cancelado</option>
                </select>
              </div>
              <div style={{ gridColumn: '1/-1', background: 'linear-gradient(135deg, #004A99, #0066cc)', borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: 600 }}>Total calculado</div>
                <div style={{ color: '#fff', fontSize: 24, fontWeight: 900 }}>R$ {calcBookingTotal({ ...editForm, pkg: editForm.pkg }).toFixed(2).replace('.', ',')}</div>
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={labelStyle}>Observações</label>
                <textarea style={{ ...inputStyle, height: 64, resize: editLocked ? 'none' : 'vertical', background: editLocked ? '#f8fafc' : '#fff', color: editLocked ? '#999' : '#0F1B2D' }} value={editForm.notes} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} disabled={editLocked} />
              </div>
              <div style={{ gridColumn: '1/-1', display: 'flex', alignItems: 'center', gap: 8, opacity: editLocked ? 0.5 : 1 }}>
                <input type="checkbox" id="edit-vip-check" checked={editForm.isVip} onChange={e => !editLocked && setEditForm(f => ({ ...f, isVip: e.target.checked }))} style={{ width: 16, height: 16, accentColor: '#EF7720', cursor: editLocked ? 'default' : 'pointer' }} disabled={editLocked} />
                <label htmlFor="edit-vip-check" style={{ fontSize: 13, fontWeight: 600, color: '#555', cursor: editLocked ? 'default' : 'pointer' }}>⭐ Encaixe VIP</label>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={saveEditAppt} disabled={editLocked || !editForm.petName || !editForm.tutorName || editSaving}
                style={{ flex: 1, padding: '13px', borderRadius: 12, background: '#004A99', color: '#fff', fontWeight: 800, fontSize: 15, cursor: editLocked ? 'not-allowed' : 'pointer', border: 'none', opacity: (editLocked || !editForm.petName || !editForm.tutorName) ? 0.4 : 1 }}>
                {editSaving ? 'Salvando...' : 'Salvar Alterações'}
              </button>
              <button onClick={() => setEditingAppt(null)} style={{ padding: '13px 18px', borderRadius: 12, background: '#f0f4f8', color: '#555', fontWeight: 700, fontSize: 14, cursor: 'pointer', border: 'none' }}>Fechar</button>
            </div>
          </div>
        </div>
      )}
      {/* Modal remarcar */}
      {reschedulingAppt && (
        <div onClick={() => setReschedulingAppt(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 20, padding: 28, width: '100%', maxWidth: 400, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <div style={{ fontWeight: 900, fontSize: 18, color: '#0F1B2D' }}>Remarcar agendamento</div>
                <div style={{ fontSize: 13, color: '#888', marginTop: 2 }}>{reschedulingAppt.petName} · {reschedulingAppt.tutorName}</div>
              </div>
              <button onClick={() => setReschedulingAppt(null)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#aaa' }}>×</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={labelStyle}>Nova data</label>
                <input type="date" value={rescheduleForm.date} min={new Date().toISOString().split('T')[0]}
                  onChange={e => {
                    const d = e.target.value
                    setRescheduleForm(f => ({ ...f, date: d, time: '' }))
                    if (d && reschedulingAppt) {
                      setRescheduleSlotsLoading(true)
                      fetch(`/api/available-slots?unitId=${reschedulingAppt.unitId}&date=${d}`)
                        .then(r => r.json())
                        .then(data => { setRescheduleSlots(data.slots ?? []); setRescheduleSlotsLoading(false) })
                        .catch(() => setRescheduleSlotsLoading(false))
                    }
                  }}
                  style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Novo horário</label>
                {rescheduleSlotsLoading ? (
                  <div style={{ ...inputStyle, color: '#aaa', fontSize: 13 }}>Carregando horários...</div>
                ) : (
                  <select value={rescheduleForm.time} onChange={e => setRescheduleForm(f => ({ ...f, time: e.target.value }))} style={inputStyle} disabled={!rescheduleForm.date}>
                    <option value="">{rescheduleForm.date ? 'Selecione o horário' : 'Selecione a data primeiro'}</option>
                    {rescheduleSlots.filter(s => s.availableCount > 0).map(s => (
                      <option key={s.time} value={s.time}>{s.time}</option>
                    ))}
                  </select>
                )}
              </div>
              {rescheduleForm.date && rescheduleForm.time && (
                <div style={{ background: '#f0f6ff', borderRadius: 10, padding: '12px 14px', fontSize: 13, color: '#004A99', fontWeight: 700 }}>
                  📅 {new Date(`${rescheduleForm.date}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })} às {rescheduleForm.time}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={saveReschedule} disabled={!rescheduleForm.date || !rescheduleForm.time || rescheduleSaving}
                style={{ flex: 1, padding: '13px', borderRadius: 12, background: '#004A99', color: '#fff', fontWeight: 800, fontSize: 15, cursor: 'pointer', border: 'none', opacity: (!rescheduleForm.date || !rescheduleForm.time) ? 0.5 : 1 }}>
                {rescheduleSaving ? 'Salvando...' : 'Confirmar remarcação'}
              </button>
              <button onClick={() => setReschedulingAppt(null)} style={{ padding: '13px 18px', borderRadius: 12, background: '#f0f4f8', color: '#555', fontWeight: 700, fontSize: 14, cursor: 'pointer', border: 'none' }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ background: '#004A99', color: '#fff', padding: '16px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Image src="/marreiro-logo-10.png" alt="Marreiro Pet" width={52} height={20} style={{ objectFit: 'contain' }} />
          <div>
            <div style={{ fontWeight: 900, fontSize: 18 }}>Marreiro Pet</div>
            <div style={{ fontSize: 12, opacity: 0.8 }}>{user?.name} · {isAdmin ? 'Administrador' : UNITS.find(u => u.id === user?.unitId)?.name}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => signOut({ callbackUrl: '/admin/login' })} style={{ padding: '8px 16px', borderRadius: 8, background: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', border: 'none' }}>
            Sair
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '0 28px', display: 'flex', gap: 4, alignItems: 'center' }}>
        {(['appointments', 'availability', 'report'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '14px 18px', fontSize: 14, fontWeight: tab === t ? 800 : 500, color: tab === t ? '#004A99' : '#666', background: 'none', border: 'none', borderBottom: tab === t ? '2px solid #004A99' : '2px solid transparent', cursor: 'pointer' }}>
            {t === 'appointments' ? 'Agendamentos' : t === 'availability' ? 'Disponibilidade' : 'Relatório de Agenda'}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '28px 16px' }}>
        {tab === 'appointments' && (
          <>
            <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
              {/* ── Mini Calendário ── */}
              {(() => {
                const [y, m] = calMonth.split('-').map(Number)
                const MONTH_NAMES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
                const DOW = ['D','S','T','Q','Q','S','S']
                const firstDow = new Date(y, m - 1, 1).getDay()
                const daysInMonth = new Date(y, m, 0).getDate()
                const today = todayISO()
                const prevMonth = () => { const d = new Date(y, m - 2, 1); setCalMonth(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`) }
                const nextMonth = () => { const d = new Date(y, m, 1); setCalMonth(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`) }
                const days: (number|null)[] = [...Array(firstDow).fill(null), ...Array.from({length: daysInMonth}, (_, i) => i + 1)]
                while (days.length % 7 !== 0) days.push(null)
                return (
                  <div style={{ width: 200, flexShrink: 0, background: '#fff', borderRadius: 14, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', padding: '12px', border: '1px solid #e5e7eb' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <button onClick={prevMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#555', padding: '2px 4px' }}>‹</button>
                      <span style={{ fontWeight: 800, fontSize: 12, color: '#0F1B2D' }}>{MONTH_NAMES[m-1]} {y}</span>
                      <button onClick={nextMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#555', padding: '2px 4px' }}>›</button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, marginBottom: 2 }}>
                      {DOW.map((d, i) => <div key={i} style={{ textAlign: 'center', fontSize: 9, fontWeight: 700, color: '#bbb', padding: '1px 0' }}>{d}</div>)}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}>
                      {days.map((day, i) => {
                        if (!day) return <div key={i} />
                        const iso = `${y}-${String(m).padStart(2,'0')}-${String(day).padStart(2,'0')}`
                        const isSelected = iso === date
                        const isToday = iso === today
                        return (
                          <button key={i} onClick={() => { setDate(iso); setCalMonth(iso.substring(0,7)) }}
                            style={{ aspectRatio: '1', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: isSelected || isToday ? 800 : 400,
                              background: isSelected ? '#3B82F6' : isToday ? '#eff6ff' : 'transparent',
                              color: isSelected ? '#fff' : isToday ? '#3B82F6' : '#333',
                              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1,
                            }}>
                            {day}
                            {monthCounts[iso] > 0 && (
                              <span style={{ width: 3, height: 3, borderRadius: '50%', background: isSelected ? 'rgba(255,255,255,0.7)' : '#A855F7', display: 'block', flexShrink: 0 }} />
                            )}
                          </button>
                        )
                      })}
                    </div>
                    <button onClick={() => { setDate(today); setCalMonth(today.substring(0,7)) }}
                      style={{ width: '100%', marginTop: 8, padding: '5px', borderRadius: 6, background: '#f0f4f8', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700, color: '#3B82F6' }}>
                      Hoje
                    </button>
                    <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {isAdmin && (
                        <select value={unitFilter} onChange={e => { setUnitFilter(e.target.value); setProFilter('all') }} style={{ ...inputStyle, fontSize: 11 }}>
                          <option value="all">Todas as unidades</option>
                          {UNITS.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </select>
                      )}
                      <select value={proFilter} onChange={e => setProFilter(e.target.value)} style={{ ...inputStyle, fontSize: 11 }}>
                        <option value="all">Todos os profissionais</option>
                        {(PROFESSIONALS[isAdmin ? (unitFilter !== 'all' ? unitFilter : '') : user?.unitId] ?? Object.values(PROFESSIONALS).flat())
                          .filter((p, i, arr) => arr.findIndex(x => x.id === p.id) === i && p.id !== 'any')
                          .map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                    <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                      {Object.entries(STATUS_LABELS).map(([s, label]) => (
                        <div key={s} style={{ background: STATUS_COLORS[s] + '12', borderRadius: 6, padding: '6px 8px' }}>
                          <div style={{ fontSize: 16, fontWeight: 900, color: STATUS_COLORS[s] }}>{appointments.filter(a => a.status === s).length}</div>
                          <div style={{ fontSize: 9, color: '#888', lineHeight: 1.2, marginTop: 1 }}>{label}</div>
                        </div>
                      ))}
                    </div>
                    {/* Busca */}
                    <div style={{ position: 'relative', marginTop: 10 }}>
                      <span style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: '#bbb', pointerEvents: 'none' }}>🔍</span>
                      <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Pet, tutor ou telefone..."
                        style={{ width: '100%', padding: '8px 28px 8px 28px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 11, background: '#fff', boxSizing: 'border-box' }}
                      />
                      {search && (
                        <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', fontSize: 15, color: '#bbb', cursor: 'pointer', lineHeight: 1 }}>×</button>
                      )}
                    </div>

                    {/* Smart Scheduling */}
                    <button
                      onClick={() => {
                        const u = unitFilter !== 'all' ? unitFilter : (String(user?.unitId ?? '') || 'caucaia')
                        setBookingForm({ petName: '', petBreed: '', petSize: 'medium', tutorName: '', phone: '', cpf: '', pkg: 'banho', addons: [], notes: '', isVip: false })
                        setBookingSlot({ slot: '', pro: null, unitId: u })
                        setSmartMode(true)
                        setSmartTrigger(t => t + 1)
                      }}
                      style={{
                        width: '100%', marginTop: 12, padding: '9px 10px', borderRadius: 9,
                        background: 'linear-gradient(135deg, #EF7720, #f59e0b)',
                        color: '#fff', border: 'none', cursor: 'pointer',
                        fontWeight: 800, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                        boxShadow: '0 2px 8px rgba(239,119,32,0.35)',
                      }}
                    >
                      ✦ Smart Scheduling
                    </button>
                  </div>
                )
              })()}

              {/* ── Coluna direita: data selecionada + agenda ── */}
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: '#0F1B2D' }}>
                      {new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                    </div>
                    <div style={{ fontSize: 13, color: '#888', marginTop: 2 }}>{appointments.length} agendamento{appointments.length !== 1 ? 's' : ''}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => { const dt = new Date(date+'T12:00:00'); dt.setDate(dt.getDate()-1); const iso = dt.toISOString().split('T')[0]; setDate(iso); setCalMonth(iso.substring(0,7)) }} style={{ padding: '8px 14px', borderRadius: 8, border: '1.5px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: 16 }}>‹</button>
                    <button onClick={() => { const dt = new Date(date+'T12:00:00'); dt.setDate(dt.getDate()+1); const iso = dt.toISOString().split('T')[0]; setDate(iso); setCalMonth(iso.substring(0,7)) }} style={{ padding: '8px 14px', borderRadius: 8, border: '1.5px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: 16 }}>›</button>
                    <button onClick={() => { const u = unitFilter !== 'all' ? unitFilter : (user?.unitId ?? 'caucaia'); setBookingForm({ petName: '', petBreed: '', petSize: 'small', tutorName: '', phone: '', cpf: '', pkg: 'banho', addons: [], notes: '', isVip: true }); setBookingSlot({ slot: '', pro: null, unitId: u }) }} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 800 }}>
                      ⭐ Encaixe VIP
                    </button>
                  </div>
                </div>

              {/* ── Agenda ── */}
              <div>

            {/* Agenda Calendar */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>Carregando agendamentos...</div>
            ) : (() => {
              const SLOT_H = 76
              const TIME_W = 60
              const PRO_NAME_MAP: Record<string, string> = {}
              Object.values(PROFESSIONALS).flat().forEach(p => { PRO_NAME_MAP[p.id] = p.name })
              const slots: string[] = []
              for (let h = 7; h <= 19; h++) { slots.push(`${String(h).padStart(2,'0')}:00`); if (h < 19) slots.push(`${String(h).padStart(2,'0')}:30`) }
              const unitKey = isAdmin ? (unitFilter !== 'all' ? unitFilter : null) : (user?.unitId ?? null)
              const basePros: string[] = unitKey
                ? (PROFESSIONALS[unitKey] ?? []).map(p => p.id)
                : Object.values(PROFESSIONALS).flat().map(p => p.id).filter((id, i, arr) => arr.indexOf(id) === i)
              filteredAppointments.forEach(a => { if (a.professional && !basePros.includes(a.professional)) basePros.push(a.professional) })
              const visiblePros = proFilter !== 'all' ? basePros.filter(p => p === proFilter) : basePros
              if (search && filteredAppointments.length === 0) return (
                <div style={{ textAlign: 'center', padding: 60, color: '#aaa', background: '#fff', borderRadius: 16 }}>
                  <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>Nenhum resultado para esta busca</div>
                </div>
              )
              const getAppts = (slot: string, pro: string | null) => filteredAppointments.filter(a => a.appointmentTime === slot && (a.professional ?? null) === pro)
              const activeSlots = slots.filter(slot => visiblePros.some(pro => getAppts(slot, pro).length > 0))
              const minSlot = activeSlots[0] ?? '08:00'
              const maxSlot = activeSlots[activeSlots.length - 1] ?? '18:00'
              const minIdx = slots.indexOf(minSlot)
              const maxIdx = slots.indexOf(maxSlot)
              const visibleSlots = slots.slice(Math.max(0, minIdx - 1), maxIdx + 3)
              const COL_MIN_W = 200
              const gridMinW = TIME_W + visiblePros.length * COL_MIN_W
              return (
                <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', border: '1px solid #e5e7eb' }}>
                  {/* Único container com scroll horizontal + vertical */}
                  <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 580 }}>
                  <div style={{ minWidth: gridMinW }}>
                  {/* Header — sticky no topo, rola horizontalmente com o conteúdo */}
                  <div style={{ display: 'flex', borderBottom: '2px solid #e5e7eb', background: '#f8fafc', position: 'sticky', top: 0, zIndex: 10 }}>
                    <div style={{ width: TIME_W, flexShrink: 0, borderRight: '1px solid #e5e7eb', position: 'sticky', left: 0, background: '#f8fafc', zIndex: 11 }} />
                    {visiblePros.map((pro, pi) => (
                      <div key={pi} style={{ flex: 1, minWidth: COL_MIN_W, padding: '8px 12px', borderRight: pi < visiblePros.length - 1 ? '1px solid #e5e7eb' : 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #3B82F6, #A855F7)', color: '#fff', fontWeight: 900, fontSize: pro ? 13 : 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {pro ? (PRO_NAME_MAP[pro] ?? pro)[0].toUpperCase() : '💈'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 13, color: '#0F1B2D' }}>{PRO_NAME_MAP[pro ?? ''] ?? pro ?? 'Sem Preferência'}</div>
                            <div style={{ fontSize: 10, color: '#aaa' }}>{filteredAppointments.filter(a => (a.professional ?? null) === pro).length} agend.</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Grid */}
                    {visibleSlots.map((slot) => {
                      const isHour = slot.endsWith(':00')
                      const hasAny = visiblePros.some(pro => getAppts(slot, pro).length > 0)
                      return (
                        <div key={slot} style={{ display: 'flex', borderBottom: `1px solid ${isHour ? '#e5e7eb' : '#f3f4f6'}`, minHeight: SLOT_H, background: !hasAny ? (isHour ? '#fafafa' : '#fdfdfd') : '#fff' }}>
                          {/* Coluna de horário — sticky à esquerda */}
                          <div style={{ width: TIME_W, flexShrink: 0, borderRight: '1px solid #e5e7eb', position: 'sticky', left: 0, background: !hasAny ? (isHour ? '#fafafa' : '#fdfdfd') : '#fff', zIndex: 5, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 10, fontSize: isHour ? 13 : 11, fontWeight: isHour ? 700 : 400, color: isHour ? '#444' : '#ccc' }}>
                            {slot}
                          </div>
                          {visiblePros.map((pro, pi) => {
                            const appts = getAppts(slot, pro)
                            const isEmpty = appts.length === 0
                            return (
                              <div key={pi}
                                onClick={() => isEmpty && !draggingAppt && setBookingSlot({ slot, pro, unitId: unitKey ?? (user?.unitId ?? 'caucaia') })}
                                onDragOver={e => { e.preventDefault(); setDragOverKey(`${slot}-${pi}`) }}
                                onDragLeave={() => setDragOverKey(null)}
                                onDrop={e => { e.preventDefault(); setDragOverKey(null); if (draggingAppt && (draggingAppt.appointmentTime !== slot || (draggingAppt.professional ?? null) !== pro)) { setPendingDrop({ appt: draggingAppt, slot, pro }); setDraggingAppt(null) } }}
                                style={{ flex: 1, minWidth: COL_MIN_W, borderRight: pi < visiblePros.length - 1 ? '1px solid #f0f4f8' : 'none', padding: 6, cursor: isEmpty ? 'pointer' : 'default', position: 'relative', display: 'flex', flexDirection: 'column', gap: 4, transition: 'background 0.1s', background: dragOverKey === `${slot}-${pi}` ? 'rgba(59,130,246,0.08)' : '' }}
                                onMouseEnter={e => { if (isEmpty && !draggingAppt) (e.currentTarget as HTMLElement).style.background = '#f0f6ff' }}
                                onMouseLeave={e => { if (!dragOverKey) (e.currentTarget as HTMLElement).style.background = '' }}
                              >
                                {isEmpty && (
                                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c7d8f0', fontSize: 20, fontWeight: 300, userSelect: 'none' }}>+</div>
                                )}
                                {appts.map(a => (
                                  <div key={a.id}
                                    draggable
                                    onDragStart={e => { e.stopPropagation(); setDraggingAppt(a); e.dataTransfer.effectAllowed = 'move' }}
                                    onDragEnd={() => setDraggingAppt(null)}
                                    onClick={e => { e.stopPropagation(); if (!draggingAppt) openEditAppt(a) }}
                                    style={{ background: STATUS_COLORS[a.status] + '10', border: `1.5px solid ${STATUS_COLORS[a.status]}50`, borderLeft: `4px solid ${STATUS_COLORS[a.status]}`, borderRadius: 10, padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 4, cursor: 'grab', opacity: draggingAppt?.id === a.id ? 0.45 : 1, transition: 'opacity 0.15s' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                      <span style={{ fontSize: 10, fontWeight: 800, color: STATUS_COLORS[a.status], textTransform: 'uppercase', letterSpacing: 0.4 }}>
                                        {a.status === 'AWAITING_PAYMENT' ? 'Pendente' : STATUS_LABELS[a.status]}
                                      </span>
                                      {a.isVip && <span style={{ fontSize: 9, background: '#fef9c3', color: '#854d0e', fontWeight: 800, padding: '1px 5px', borderRadius: 4 }}>VIP</span>}
                                    </div>
                                    <div style={{ fontWeight: 900, fontSize: 14, color: '#0F1B2D', lineHeight: 1.2 }}>
                                      {a.petName}
                                      {a.petBreed && <span style={{ fontWeight: 400, fontSize: 11, color: '#bbb' }}> · {a.petBreed}</span>}
                                    </div>
                                    <div style={{ fontSize: 11, fontWeight: 600, color: '#555' }}>
                                      {PACKAGES[a.package ?? ''] ?? a.package ?? 'Serviço'}
                                      {a.petSize && <span style={{ fontWeight: 400, color: '#aaa' }}> · {a.petSize === 'small' ? 'P' : a.petSize === 'medium' ? 'M' : 'G'}</span>}
                                    </div>
                                    {a.addons?.length > 0 && (
                                      <div style={{ fontSize: 10, color: '#EF7720', fontWeight: 600 }}>+ {a.addons.map(id => ADDONS[id] ?? id).join(', ')}</div>
                                    )}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <a href={`https://wa.me/55${a.phone.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#25D366', fontWeight: 700, textDecoration: 'none' }}>
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
                                        {a.tutorName}
                                      </a>
                                      <span style={{ fontSize: 12, fontWeight: 900, color: '#004A99' }}>R$ {Number(a.totalPrice).toFixed(0)}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 10, color: '#999' }}>
                                      <span>{a.phone}</span>
                                      {a.tutorCpf && <span style={{ fontWeight: 700 }}>CPF: {a.tutorCpf}</span>}
                                    </div>
                                    <div style={{ display: 'flex', gap: 4 }}>
                                      {[
                                        { s: 'CONFIRMED', icon: '✓', title: 'Confirmar' },
                                        { s: 'COMPLETED', icon: '★', title: 'Concluir' },
                                        { s: 'CANCELLED', icon: '✕', title: 'Cancelar' },
                                      ].map(({ s, icon, title }) => (
                                        <button key={s} onClick={e => { e.stopPropagation(); updateStatus(a.id, s) }} title={title} style={{ flex: 1, padding: '5px 2px', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: `1px solid ${STATUS_COLORS[s]}`, background: a.status === s ? STATUS_COLORS[s] : 'transparent', color: a.status === s ? '#fff' : STATUS_COLORS[s] }}>
                                          {icon}
                                        </button>
                                      ))}
                                      <button onClick={e => {
                                        e.stopPropagation()
                                        const d = a.appointmentDate.split('T')[0]
                                        setReschedulingAppt(a)
                                        setRescheduleForm({ date: d, time: a.appointmentTime })
                                        setRescheduleSlots([])
                                        setRescheduleSlotsLoading(true)
                                        fetch(`/api/available-slots?unitId=${a.unitId}&date=${d}`)
                                          .then(r => r.json())
                                          .then(data => { setRescheduleSlots(data.slots ?? []); setRescheduleSlotsLoading(false) })
                                          .catch(() => setRescheduleSlotsLoading(false))
                                      }} title="Remarcar" style={{ flex: 1, padding: '5px 2px', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: '1px solid #6366f1', background: 'transparent', color: '#6366f1' }}>
                                        🔄
                                      </button>
                                      <button onClick={e => { e.stopPropagation(); deleteAppt(a.id) }} title="Excluir agendamento"
                                        style={{ flex: 1, padding: '5px 2px', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: '1px solid #fecaca', background: 'transparent', color: '#dc2626' }}>
                                        🗑
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )
                          })}
                        </div>
                      )
                    })}
                  </div>{/* fim minWidth wrapper */}
                  </div>{/* fim overflowX+Y wrapper */}
                </div>
              )
            })()}
              </div>{/* fim agenda wrapper */}
              </div>{/* fim coluna direita */}
            </div>{/* fim flex row */}
          </>
        )}

        {tab === 'availability' && (
          <AvailabilityTab unitId={isAdmin ? undefined : user?.unitId} isAdmin={isAdmin} />
        )}

        {tab === 'report' && (
          <ReportTab isAdmin={isAdmin} userUnitId={user?.unitId} />
        )}

      </div>
    </div>
  )
}

const CLINIC_SERVICE_LABELS: Record<string, string> = {
  vet: 'Consulta Veterinária',
  vacina: 'Vacinação',
  exames: 'Exames',
}

const VET_SUB_LABELS: Record<string, string> = {
  'clinico-geral': 'Consulta Clínico Geral',
  'retorno': 'Retorno Veterinário',
  'plantao': 'Consulta Plantão',
}

const VACCINE_LABELS: Record<string, string> = {
  'v8v10-importada': 'V8/V10 Importada',
  'vanguard-v10': 'Vanguard V10',
  'felina-v3': 'Felina V3',
  'felina-v4': 'Felina V4',
  'felina-v5': 'Felina V5',
  'antirrábica': 'Antirrábica',
  'gripe': 'Gripe (Bordetella)',
  'leishmania': 'Leishmania',
}

function ClinicTab({ isAdmin, userUnitId, onEditAppt }: { isAdmin: boolean; userUnitId?: string; onEditAppt: (a: Appointment) => void }) {
  const [date, setDate] = useState(todayISO())
  const [unitFilter, setUnitFilter] = useState(isAdmin ? 'all' : (userUnitId ?? 'all'))
  const [serviceFilter, setServiceFilter] = useState('all')
  const [rows, setRows] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(false)

  const updateStatus = async (id: string, newStatus: string) => {
    await fetch(`/api/admin/appointments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    setRows(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a))
  }

  const deleteClinicAppt = async (id: string) => {
    if (!window.confirm('Excluir este agendamento? Esta ação não pode ser desfeita.')) return
    await fetch(`/api/appointments/${id}`, { method: 'DELETE' })
    setRows(prev => prev.filter(a => a.id !== id))
  }

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({ date, role: isAdmin ? 'ADMIN' : 'RECEPTIONIST', userUnitId: userUnitId ?? '', serviceTypes: 'vet,vacina,exames' })
    if (isAdmin && unitFilter !== 'all') params.set('unitId', unitFilter)
    if (!isAdmin && userUnitId) params.set('unitId', userUnitId)
    if (serviceFilter !== 'all') params.set('serviceTypes', serviceFilter)
    fetch(`/api/admin/appointments?${params}`)
      .then(r => r.json())
      .then(d => { setRows(d.appointments ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [date, unitFilter, serviceFilter])

  const SVCCOLORS: Record<string, string> = { vet: '#7C3AED', vacina: '#0891B2', exames: '#D97706' }
  const SVCICONS: Record<string, string> = { vet: '🩺', vacina: '💉', exames: '🔬' }

  const dateLabel = (() => {
    const [y, mo, d] = date.split('-').map(Number)
    const dt = new Date(y, mo - 1, d)
    const today = todayISO()
    const tom = new Date(); tom.setDate(tom.getDate() + 1)
    if (date === today) return 'Hoje'
    if (date === tom.toISOString().split('T')[0]) return 'Amanhã'
    return dt.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })
  })()

  return (
    <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
      {/* Coluna esquerda: filtros + stats */}
      <div style={{ width: 220, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Navegação de data */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <button onClick={() => setDate(d => { const dt = new Date(d + 'T12:00:00'); dt.setDate(dt.getDate() - 1); return dt.toISOString().split('T')[0] })} style={{ width: 32, height: 32, borderRadius: 8, border: '1.5px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
            <span style={{ fontWeight: 800, fontSize: 15, color: '#0F1B2D' }}>{dateLabel}</span>
            <button onClick={() => setDate(d => { const dt = new Date(d + 'T12:00:00'); dt.setDate(dt.getDate() + 1); return dt.toISOString().split('T')[0] })} style={{ width: 32, height: 32, borderRadius: 8, border: '1.5px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</button>
          </div>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 13, boxSizing: 'border-box' }} />
          <button onClick={() => setDate(todayISO())} style={{ width: '100%', marginTop: 8, padding: '8px', borderRadius: 8, background: '#EFF6FF', color: '#004A99', fontWeight: 700, fontSize: 12, border: 'none', cursor: 'pointer' }}>Hoje</button>
        </div>

        {/* Filtros */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#888', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Filtros</div>
          {isAdmin && (
            <select value={unitFilter} onChange={e => setUnitFilter(e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 13, marginBottom: 8, boxSizing: 'border-box' }}>
              <option value="all">Todas as unidades</option>
              {UNITS.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          )}
          <select value={serviceFilter} onChange={e => setServiceFilter(e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 13, boxSizing: 'border-box' }}>
            <option value="all">Todos os serviços</option>
            {Object.entries(CLINIC_SERVICE_LABELS).map(([id, label]) => (
              <option key={id} value={id}>{label}</option>
            ))}
          </select>
        </div>

        {/* Stats por status */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#888', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Resumo do dia</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Object.entries(STATUS_LABELS).map(([s, label]) => {
              const count = rows.filter(a => a.status === s).length
              return (
                <div key={s} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_COLORS[s] }} />
                    <span style={{ fontSize: 12, color: '#555' }}>{label}</span>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 800, color: count > 0 ? STATUS_COLORS[s] : '#ccc' }}>{count}</span>
                </div>
              )
            })}
            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 8, display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#0F1B2D' }}>Total</span>
              <span style={{ fontSize: 14, fontWeight: 900, color: '#004A99' }}>{rows.length}</span>
            </div>
          </div>
        </div>

        {/* Stats por serviço */}
        {rows.length > 0 && (
          <div style={{ background: '#fff', borderRadius: 16, padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#888', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Por serviço</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {Object.entries(CLINIC_SERVICE_LABELS).map(([s, label]) => {
                const count = rows.filter(a => a.serviceType === s).length
                if (!count) return null
                return (
                  <div key={s} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 14 }}>{SVCICONS[s]}</span>
                      <span style={{ fontSize: 12, color: '#555' }}>{label}</span>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 800, color: SVCCOLORS[s] ?? '#888' }}>{count}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Colunas por serviço */}
      <div style={{ flex: 1, minWidth: 0, overflowX: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#888' }}>Carregando...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(260px, 1fr))', gap: 16, minWidth: 780 }}>
            {Object.entries(CLINIC_SERVICE_LABELS).map(([svcKey, svcLabel]) => {
              const svcColor = SVCCOLORS[svcKey] ?? '#004A99'
              const svcIcon = SVCICONS[svcKey] ?? '📋'
              const svcRows = rows.filter(a => a.serviceType === svcKey).sort((a, b) => a.appointmentTime.localeCompare(b.appointmentTime))
              return (
                <div key={svcKey}>
                  {/* Cabeçalho da coluna */}
                  <div style={{ background: svcColor, borderRadius: '14px 14px 0 0', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 18 }}>{svcIcon}</span>
                      <span style={{ fontWeight: 800, fontSize: 14, color: '#fff' }}>{svcLabel}</span>
                    </div>
                    <span style={{ background: 'rgba(255,255,255,0.25)', color: '#fff', fontWeight: 900, fontSize: 13, padding: '2px 10px', borderRadius: 20 }}>{svcRows.length}</span>
                  </div>

                  {/* Cards */}
                  <div style={{ background: svcColor + '10', borderRadius: '0 0 14px 14px', border: `1.5px solid ${svcColor}30`, borderTop: 'none', minHeight: 80, padding: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {svcRows.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '16px 8px', color: '#aaa', fontSize: 12 }}>Nenhum agendamento</div>
                    ) : (() => {
                      const PRO_NAME_MAP: Record<string, string> = {}
                      Object.values(PROFESSIONALS).flat().forEach(p => { PRO_NAME_MAP[p.id] = p.name })
                      const SIZE_LABEL: Record<string, string> = { small: 'Pequeno', medium: 'Médio', large: 'Grande' }
                      return svcRows.map(a => (
                      <div key={a.id} onClick={() => onEditAppt(a)} style={{ background: '#fff', borderRadius: 10, padding: '10px 12px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', borderLeft: `3px solid ${a.status === 'AWAITING_PAYMENT' ? '#e5e7eb' : STATUS_COLORS[a.status]}`, cursor: 'pointer' }}>
                        {/* Header: horário + badges */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <span style={{ fontSize: 14, fontWeight: 900, color: svcColor }}>{a.appointmentTime}</span>
                          <div style={{ display: 'flex', gap: 4 }}>
                            {a.isVip && <span style={{ fontSize: 9, background: '#fef9c3', color: '#854d0e', fontWeight: 800, padding: '1px 6px', borderRadius: 4 }}>VIP</span>}
                            <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 20, background: STATUS_COLORS[a.status] + '20', color: STATUS_COLORS[a.status] }}>{STATUS_LABELS[a.status]}</span>
                          </div>
                        </div>
                        {/* Pet */}
                        <div style={{ fontWeight: 800, fontSize: 13, color: '#0F1B2D', marginBottom: 1 }}>
                          🐾 {a.petName}
                          {(a.petBreed || a.petSize) && (
                            <span style={{ fontWeight: 400, fontSize: 11, color: '#999' }}>
                              {a.petBreed ? ` · ${a.petBreed}` : ''}{a.petSize ? ` · ${SIZE_LABEL[a.petSize] ?? a.petSize}` : ''}
                            </span>
                          )}
                        </div>
                        {/* Tutor */}
                        <div style={{ fontSize: 12, color: '#555', marginBottom: 1 }}>
                          👤 {a.tutorName}
                          {a.tutorCpf && <span style={{ fontSize: 11, color: '#aaa' }}> · CPF: {a.tutorCpf}</span>}
                        </div>
                        {/* Serviço escolhido */}
                        {a.package && (
                          <div style={{ fontSize: 11, color: svcColor, fontWeight: 700, marginBottom: 1 }}>
                            {svcKey === 'vet'
                              ? (VET_SUB_LABELS[a.package] ?? a.package)
                              : svcKey === 'vacina'
                              ? a.package.split(',').map(v => VACCINE_LABELS[v.trim()] ?? v.trim()).join(', ')
                              : a.package}
                          </div>
                        )}
                        {/* Unidade (admin) */}
                        {isAdmin && a.unitId && (
                          <div style={{ fontSize: 10, color: '#bbb', marginBottom: 1 }}>📍 {UNITS.find(u => u.id === a.unitId)?.name ?? a.unitId}</div>
                        )}
                        {/* Observações */}
                        {a.notes && (
                          <div style={{ fontSize: 11, color: '#777', fontStyle: 'italic', margin: '4px 0', padding: '4px 8px', background: '#f8fafc', borderRadius: 6 }}>"{a.notes}"</div>
                        )}
                        {/* Footer: contato + preço + ações */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, paddingTop: 6, borderTop: '1px solid #f1f5f9', flexWrap: 'wrap' }}>
                          <a href={`https://wa.me/55${a.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                            style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: '#25D366', fontWeight: 700, textDecoration: 'none' }}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
                            {a.phone}
                          </a>
                          <span style={{ fontSize: 12, fontWeight: 900, color: '#004A99', marginLeft: 'auto' }}>
                            R$ {Number(a.totalPrice).toFixed(2).replace('.', ',')}
                          </span>
                          <div style={{ display: 'flex', gap: 3 }}>
                            <button onClick={e => { e.stopPropagation(); deleteClinicAppt(a.id) }} title="Excluir agendamento"
                              style={{ width: 22, height: 22, borderRadius: 6, border: '1.5px solid #fecaca', background: '#fff5f5', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#dc2626' }}>
                              🗑
                            </button>
                            {(['CONFIRMED', 'COMPLETED', 'CANCELLED'] as const).map(s => {
                              if (s === 'CONFIRMED') {
                                const unitName = UNITS.find(u => u.id === a.unitId)?.name ?? a.unitId
                                const svcLabel = CLINIC_SERVICE_LABELS[a.serviceType ?? ''] ?? a.serviceType ?? 'Serviço'
                                const subLabel = a.package
                                  ? a.serviceType === 'vet'
                                    ? ` — ${VET_SUB_LABELS[a.package] ?? a.package}`
                                    : a.serviceType === 'vacina'
                                    ? ` — ${a.package.split(',').map((v: string) => VACCINE_LABELS[v.trim()] ?? v.trim()).join(', ')}`
                                    : ''
                                  : ''
                                const dateStr = a.appointmentDate
                                  ? new Date(a.appointmentDate).toLocaleDateString('pt-BR', { timeZone: 'America/Fortaleza', day: '2-digit', month: '2-digit', year: 'numeric' })
                                  : ''
                                const waMsg = [
                                  `Olá, ${a.tutorName}! 👋`,
                                  ``,
                                  `Seu agendamento na *Marreiro Pet* foi *confirmado*! ✅`,
                                  ``,
                                  `📋 *Serviço:* ${svcLabel}${subLabel}`,
                                  `🐾 *Pet:* ${a.petName}`,
                                  `📍 *Unidade:* Marreiro Pet ${unitName}`,
                                  `📅 *Data:* ${dateStr}`,
                                  `🕐 *Horário:* ${a.appointmentTime}`,
                                  ``,
                                  `Qualquer dúvida estamos à disposição. Até lá! 😊`,
                                  ``,
                                  `*Marreiro Pet* 🐾`,
                                ].filter(Boolean).join('\n')
                                const waUrl = `https://wa.me/55${a.phone.replace(/\D/g, '')}?text=${encodeURIComponent(waMsg)}`
                                return (
                                  <button key={s} onClick={e => {
                                    e.stopPropagation()
                                    if (a.status !== 'CONFIRMED') updateStatus(a.id, 'CONFIRMED')
                                    window.open(waUrl, '_blank')
                                  }} title="Confirmar e enviar WhatsApp ao cliente"
                                    style={{ width: 22, height: 22, borderRadius: 6, border: `1.5px solid ${a.status === s ? STATUS_COLORS[s] : '#e5e7eb'}`, background: a.status === s ? STATUS_COLORS[s] : '#f8fafc', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: a.status === s ? '#fff' : '#888' }}>
                                    ✓
                                  </button>
                                )
                              }
                              return (
                                <button key={s} onClick={e => { e.stopPropagation(); updateStatus(a.id, s) }} title={STATUS_LABELS[s]}
                                  style={{ width: 22, height: 22, borderRadius: 6, border: `1.5px solid ${a.status === s ? STATUS_COLORS[s] : '#e5e7eb'}`, background: a.status === s ? STATUS_COLORS[s] : '#f8fafc', cursor: a.status === s ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: a.status === s ? '#fff' : '#888' }}>
                                  {s === 'COMPLETED' ? '★' : '✕'}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    ))})()}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

const PROFESSIONALS_RAW: Record<string, { id: string; name: string }[]> = {
  caucaia: [{ id: 'victor', name: 'Victor Lopes' }, { id: 'daniele', name: 'Daniele Santos' }, { id: 'eduarda', name: 'Eduarda' }, { id: 'israel', name: 'Israel' }],
  pecem: [{ id: 'vitoria', name: 'Vitória Duraes' }, { id: 'christian', name: 'Christian Fernandes' }],
  taiba: [{ id: 'andresa', name: 'Andresa Martins' }, { id: 'erica', name: 'Erica Melo' }],
  saogoncalo: [{ id: 'anderson', name: 'Anderson Correia' }, { id: 'carla', name: 'Carla Janaina' }],
}
const PROFESSIONALS = PROFESSIONALS_RAW
const PRO_NAME_MAP_GLOBAL: Record<string, string> = {}
Object.values(PROFESSIONALS_RAW).flat().forEach(p => { PRO_NAME_MAP_GLOBAL[p.id] = p.name })
const ALL_SLOTS = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30']

function AvailabilityTab({ unitId, isAdmin }: { unitId?: string; isAdmin: boolean }) {
  const [selectedUnit, setSelectedUnit] = useState(unitId ?? 'caucaia')
  const [allPros, setAllPros] = useState<ProRow[]>([])
  const [professional, setProfessional] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [slots, setSlots] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/admin/professionals').then(r => r.json()).then((d: ProRow[]) => {
      const active = d.filter(p => p.active)
      setAllPros(active)
      const defaultPro = active.find(p => p.unitId === (unitId ?? 'caucaia')) ?? active[0]
      if (defaultPro) setProfessional(defaultPro.slug)
    })
  }, [])

  useEffect(() => {
    if (!professional || !date) return
    setSlots([])
    fetch(`/api/availability?professional=${professional}&date=${date}`).then(r => r.json()).then(d => setSlots(d.slots ?? []))
  }, [professional, date])

  const save = async () => {
    setSaving(true)
    await fetch('/api/availability', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-key': 'marreiro@admin2024' }, body: JSON.stringify({ professional, unitId: selectedUnit, date, slots }) })
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  const grouped = UNITS.map(u => ({ ...u, pros: allPros.filter(p => p.unitId === u.id) }))

  return (
    <div style={{ maxWidth: 560 }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: isAdmin ? '1fr 1fr 1fr' : '1fr 1fr', gap: 12, marginBottom: 8 }}>
          <div>
            <label style={labelStyle}>Profissional</label>
            <select value={professional} onChange={e => setProfessional(e.target.value)} style={inputStyle}>
              {grouped.map(g => g.pros.length > 0 && (
                <optgroup key={g.id} label={g.name}>
                  {g.pros.map(p => <option key={p.slug} value={p.slug}>{p.name}</option>)}
                </optgroup>
              ))}
            </select>
          </div>
          {isAdmin && (
            <div>
              <label style={labelStyle}>Atende nesta unidade</label>
              <select value={selectedUnit} onChange={e => setSelectedUnit(e.target.value)} style={inputStyle}>
                {UNITS.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
          )}
          <div>
            <label style={labelStyle}>Data</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <button onClick={() => setDate(d => { const dt = new Date(d + 'T12:00:00'); dt.setDate(dt.getDate() - 1); return dt.toISOString().split('T')[0] })} style={{ padding: '8px 12px', borderRadius: 8, border: '1.5px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>‹</button>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
              <button onClick={() => setDate(d => { const dt = new Date(d + 'T12:00:00'); dt.setDate(dt.getDate() + 1); return dt.toISOString().split('T')[0] })} style={{ padding: '8px 12px', borderRadius: 8, border: '1.5px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>›</button>
            </div>
          </div>
        </div>
        {isAdmin && professional && (
          <p style={{ fontSize: 12, color: '#888', margin: '0 0 12px', padding: '6px 10px', background: '#f8fafc', borderRadius: 8 }}>
            💡 A unidade selecionada é onde <strong>{allPros.find(p => p.slug === professional)?.name ?? professional}</strong> irá atender neste dia. A unidade principal pode ser diferente.
          </p>
        )}
        <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 16, height: 16, borderRadius: 4, background: '#e8f0fa', border: '2px solid #004A99' }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: '#555' }}>Disponível</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 16, height: 16, borderRadius: 4, background: '#fff', border: '2px solid #e5e7eb' }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: '#555' }}>Não disponível</span>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {ALL_SLOTS.map(s => (
            <button key={s} onClick={() => setSlots(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])}
              style={{ padding: '11px', borderRadius: 10, border: `2px solid ${slots.includes(s) ? '#004A99' : '#e5e7eb'}`, background: slots.includes(s) ? '#e8f0fa' : '#fff', color: slots.includes(s) ? '#004A99' : '#333', fontWeight: slots.includes(s) ? 800 : 500, fontSize: 14, cursor: 'pointer' }}>
              {s}
            </button>
          ))}
        </div>
      </div>
      <button onClick={save} disabled={saving || !professional} style={{ width: '100%', padding: '13px', borderRadius: 12, background: saved ? '#16a34a' : '#EF7720', color: '#fff', fontWeight: 800, fontSize: 15, cursor: 'pointer', border: 'none', opacity: !professional ? 0.6 : 1 }}>
        {saving ? 'Salvando...' : saved ? '✓ Salvo!' : 'Salvar disponibilidade'}
      </button>
    </div>
  )
}

const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 14, background: '#fff', boxSizing: 'border-box' }
const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: '#666', display: 'block', marginBottom: 6 }

function printReport(profName: string, items: Appointment[], dateLabel: string) {
  const rows = items.map(a => `
    <tr>
      <td>${new Date(a.appointmentDate).toLocaleDateString('pt-BR')}</td>
      <td>${a.appointmentTime}</td>
      <td>${a.tutorName}<br/><small style="color:#888">${a.petName}</small></td>
      <td>${PACKAGES[a.package ?? ''] ?? a.package ?? '—'}${a.addons?.length > 0 ? `<br/><small style="color:#EF7720">${a.addons.map((id: string) => ADDONS[id] ?? id).join(', ')}</small>` : ''}</td>
    </tr>
  `).join('')

  const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"/>
  <title>Agenda — ${profName}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 32px; color: #111; }
    h1 { font-size: 20px; margin-bottom: 4px; color: #004A99; }
    .sub { font-size: 13px; color: #888; margin-bottom: 24px; }
    table { width: 100%; border-collapse: collapse; font-size: 14px; }
    th { background: #004A99; color: #fff; padding: 10px 14px; text-align: left; font-size: 13px; }
    td { padding: 10px 14px; border-bottom: 1px solid #e5e7eb; vertical-align: top; }
    tr:nth-child(even) td { background: #f8fafc; }
    small { font-size: 11px; }
    .footer { margin-top: 24px; font-size: 12px; color: #aaa; text-align: center; }
    @media print { body { padding: 16px; } }
  </style></head><body>
  <h1>Agenda — ${profName}</h1>
  <div class="sub">${dateLabel} · ${items.length} agendamento${items.length !== 1 ? 's' : ''} · Marreiro Pet</div>
  <table>
    <thead><tr><th>Data</th><th>Horário</th><th>Cliente</th><th>Serviço</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="footer">Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
  <script>window.onload = () => window.print()</script>
  </body></html>`

  const w = window.open('', '_blank')
  if (w) { w.document.write(html); w.document.close() }
}

function ReportTab({ isAdmin, userUnitId }: { isAdmin: boolean; userUnitId?: string }) {
  const [reportDate, setReportDate] = useState(todayISO())
  const [allDates, setAllDates] = useState(false)
  const [unitFilter, setUnitFilter] = useState(isAdmin ? 'all' : (userUnitId ?? 'all'))
  const [proFilter, setProFilter] = useState('all')
  const [rows, setRows] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({ role: isAdmin ? 'ADMIN' : 'RECEPTIONIST', userUnitId: userUnitId ?? '' })
    if (!allDates) params.set('date', reportDate)
    if (isAdmin && unitFilter !== 'all') params.set('unitId', unitFilter)
    if (!isAdmin && userUnitId) params.set('unitId', userUnitId)
    if (proFilter !== 'all') params.set('professional', proFilter)
    fetch(`/api/admin/appointments?${params}`)
      .then(r => r.json())
      .then(d => { setRows(d.appointments ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [reportDate, allDates, unitFilter, proFilter])

  const professionals = isAdmin
    ? (unitFilter !== 'all' ? PROFESSIONALS[unitFilter] ?? [] : Object.values(PROFESSIONALS).flat().filter((p, i, a) => a.findIndex(x => x.id === p.id) === i))
    : (PROFESSIONALS[userUnitId ?? ''] ?? [])

  const filteredProfessionals = proFilter !== 'all' ? professionals.filter(p => p.id === proFilter) : professionals

  const grouped = filteredProfessionals.reduce((acc, p) => {
    acc[p.id] = { name: p.name, items: rows.filter(r => r.professional === p.id) }
    return acc
  }, {} as Record<string, { name: string; items: Appointment[] }>)

  const semPro = rows.filter(r => !r.professional || !professionals.find(p => p.id === r.professional))

  const chartData = professionals
    .filter(p => p.id !== 'any')
    .map(p => ({ name: p.name.split(' ')[0], total: rows.filter(r => r.professional === p.id).length }))
    .sort((a, b) => b.total - a.total)

  const COLORS = ['#004A99', '#EF7720', '#16a34a', '#6366f1', '#dc2626', '#0891b2', '#854d0e', '#4f46e5']

  return (
    <div style={{ maxWidth: 900 }}>
      {/* Gráfico */}
      {chartData.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 14, padding: '20px 20px 10px', marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 16, color: '#0F1B2D' }}>Agendamentos por profissional</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fontWeight: 700 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => [`${v} agendamento${v !== 1 ? 's' : ''}`, '']} labelStyle={{ fontWeight: 700 }} />
              <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      {/* Filtros */}
      <div style={{ background: '#fff', borderRadius: 14, padding: '16px 20px', marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div>
          <label style={labelStyle}>Data</label>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <button onClick={() => { setAllDates(false); setReportDate(d => { const dt = new Date(d + 'T12:00:00'); dt.setDate(dt.getDate() - 1); return dt.toISOString().split('T')[0] }) }} style={{ padding: '8px 10px', borderRadius: 8, border: '1.5px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: 16 }}>‹</button>
            <input type="date" value={reportDate} onChange={e => { setReportDate(e.target.value); setAllDates(false) }} style={{ ...inputStyle, width: 160 }} disabled={allDates} />
            <button onClick={() => { setAllDates(false); setReportDate(d => { const dt = new Date(d + 'T12:00:00'); dt.setDate(dt.getDate() + 1); return dt.toISOString().split('T')[0] }) }} style={{ padding: '8px 10px', borderRadius: 8, border: '1.5px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: 16 }}>›</button>
            <button onClick={() => setAllDates(v => !v)} style={{ padding: '8px 14px', borderRadius: 8, border: `1.5px solid ${allDates ? '#004A99' : '#e5e7eb'}`, background: allDates ? '#e8f0fa' : '#fff', color: allDates ? '#004A99' : '#333', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Todos</button>
          </div>
        </div>
        {isAdmin && (
          <div>
            <label style={labelStyle}>Unidade</label>
            <select value={unitFilter} onChange={e => { setUnitFilter(e.target.value); setProFilter('all') }} style={{ ...inputStyle, width: 160 }}>
              <option value="all">Todas</option>
              {UNITS.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
        )}
        <div>
          <label style={labelStyle}>Profissional</label>
          <select value={proFilter} onChange={e => setProFilter(e.target.value)} style={{ ...inputStyle, width: 180 }}>
            <option value="all">Todos</option>
            {professionals.filter(p => p.id !== 'any').map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div style={{ marginLeft: 'auto', alignSelf: 'center' }}>
          <span style={{ fontSize: 13, color: '#888', fontWeight: 600 }}>{rows.length} agendamento{rows.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>Carregando...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {Object.entries(grouped).map(([id, { name, items }]) => (
            <div key={id} style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <div style={{ background: '#004A99', color: '#fff', padding: '10px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 800, fontSize: 15 }}>{name}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 12, opacity: 0.8 }}>{items.length} agendamento{items.length !== 1 ? 's' : ''}</span>
                  {items.length > 0 && (
                    <button onClick={() => printReport(name, items, allDates ? 'Todos os dias' : new Date(reportDate + 'T12:00:00').toLocaleDateString('pt-BR'))}
                      style={{ padding: '4px 12px', borderRadius: 6, background: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: 12, fontWeight: 700, border: '1px solid rgba(255,255,255,0.4)', cursor: 'pointer' }}>
                      🖨️ Imprimir / PDF
                    </button>
                  )}
                </div>
              </div>
              {items.length === 0 ? (
                <div style={{ padding: '14px 18px', color: '#aaa', fontSize: 13 }}>Nenhum agendamento</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e5e7eb' }}>
                      {['Data', 'Horário', 'Cliente', 'Serviço', 'Extras'].map(h => (
                        <th key={h} style={{ padding: '8px 14px', textAlign: 'left', fontWeight: 700, color: '#555', fontSize: 12 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((a, i) => (
                      <tr key={a.id} style={{ borderBottom: '1px solid #f0f0f0', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                        <td style={{ padding: '10px 14px', color: '#555', whiteSpace: 'nowrap', fontSize: 13 }}>
                          {new Date(a.appointmentDate).toLocaleDateString('pt-BR')}
                        </td>
                        <td style={{ padding: '10px 14px', fontWeight: 800, color: '#004A99', whiteSpace: 'nowrap' }}>
                          {a.appointmentTime}
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <div style={{ fontWeight: 700 }}>{a.tutorName}</div>
                          <div style={{ fontSize: 11, color: '#888' }}>{a.petName}</div>
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          {PACKAGES[a.package ?? ''] ?? a.package ?? '—'}
                        </td>
                        <td style={{ padding: '10px 14px', fontSize: 12, color: '#EF7720', fontWeight: 600 }}>
                          {a.addons?.length > 0 ? a.addons.map((id: string) => ADDONS[id] ?? id).join(', ') : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ))}
          {semPro.length > 0 && (
            <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <div style={{ background: '#6b7280', color: '#fff', padding: '10px 18px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 800, fontSize: 15 }}>Sem profissional</span>
                <span style={{ fontSize: 12, opacity: 0.8 }}>{semPro.length} agendamento{semPro.length !== 1 ? 's' : ''}</span>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <tbody>
                  {semPro.map((a, i) => (
                    <tr key={a.id} style={{ borderBottom: '1px solid #f0f0f0', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                      <td style={{ padding: '10px 14px', fontWeight: 800, color: '#004A99' }}>{a.appointmentTime}</td>
                      <td style={{ padding: '10px 14px', fontWeight: 700 }}>{a.petName}</td>
                      <td style={{ padding: '10px 14px', color: '#555' }}>{a.tutorName}</td>
                      <td style={{ padding: '10px 14px' }}>{PACKAGES[a.package ?? ''] ?? '—'}</td>
                      <td style={{ padding: '10px 14px', fontWeight: 700 }}>R$ {Number(a.totalPrice).toFixed(2).replace('.', ',')}</td>
                      <td style={{ padding: '10px 14px' }}><span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: STATUS_COLORS[a.status] + '20', color: STATUS_COLORS[a.status] }}>{STATUS_LABELS[a.status]}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {rows.length === 0 && !loading && (
            <div style={{ textAlign: 'center', padding: 40, color: '#888', background: '#fff', borderRadius: 16 }}>Nenhum agendamento encontrado.</div>
          )}
        </div>
      )}
    </div>
  )
}

type AdoptionPet = {
  id: string; name: string; species: string; breed: string | null; age: string | null
  gender: string; size: string | null; description: string | null; imageUrl: string | null; unitId: string | null; available: boolean; status: string
}

const ADOPTION_UNITS = [
  { id: 'caucaia', name: 'Caucaia' }, { id: 'pecem', name: 'Pecém' },
  { id: 'saogoncalo', name: 'São Gonçalo' }, { id: 'taiba', name: 'Taíba' },
]

const emptyPet = { name: '', species: 'cachorro', breed: '', age: '', gender: 'macho', size: 'pequeno', description: '', imageUrl: '', unitId: '', status: 'disponivel' }

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  disponivel: { label: 'Disponível', color: '#16a34a', bg: '#dcfce7' },
  adotado:    { label: 'Adotado',    color: '#6366f1', bg: '#ede9fe' },
  indisponivel: { label: 'Indisponível', color: '#dc2626', bg: '#fee2e2' },
}

function resizeImage(file: File, maxW = 800, maxH = 800, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    img.onload = () => {
      const ratio = Math.min(maxW / img.width, maxH / img.height, 1)
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * ratio)
      canvas.height = Math.round(img.height * ratio)
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

function AdoptionTab() {
  const [pets, setPets] = useState<AdoptionPet[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(emptyPet)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    fetch('/api/adoption?all=1').then(r => r.json()).then(d => { setPets(Array.isArray(d) ? d : []); setLoading(false) }).catch(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const openNew = () => { setForm(emptyPet); setEditingId(null); setSaveError(null); setShowForm(true) }
  const openEdit = (pet: AdoptionPet) => {
    setForm({ name: pet.name, species: pet.species, breed: pet.breed ?? '', age: pet.age ?? '', gender: pet.gender, size: pet.size ?? 'pequeno', description: pet.description ?? '', imageUrl: pet.imageUrl ?? '', unitId: pet.unitId ?? '', status: pet.status ?? 'disponivel' })
    setEditingId(pet.id); setSaveError(null); setShowForm(true)
  }
  const cancelForm = () => { setShowForm(false); setEditingId(null); setForm(emptyPet) }

  const save = async () => {
    setSaving(true); setSaveError(null)
    try {
      const payload = { ...form, unitId: form.unitId || null }
      const res = editingId
        ? await fetch(`/api/adoption/${editingId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'x-admin-key': 'marreiro@admin2024' }, body: JSON.stringify(payload) })
        : await fetch('/api/adoption', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-key': 'marreiro@admin2024' }, body: JSON.stringify(payload) })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? `Erro ${res.status}`) }
      cancelForm(); load()
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Erro ao salvar')
    } finally { setSaving(false) }
  }

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/adoption/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'x-admin-key': 'marreiro@admin2024' }, body: JSON.stringify({ status }) })
    load()
  }

  const remove = async (id: string) => {
    if (!confirm('Remover este pet permanentemente?')) return
    await fetch(`/api/adoption/${id}`, { method: 'DELETE', headers: { 'x-admin-key': 'marreiro@admin2024' } })
    load()
  }

  const upd = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try { const base64 = await resizeImage(file); setForm(f => ({ ...f, imageUrl: base64 })) }
    finally { setUploading(false) }
  }

  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div style={{ fontWeight: 900, fontSize: 18, color: '#0F1B2D' }}>Pets para adoção</div>
          <div style={{ fontSize: 13, color: '#888', marginTop: 2 }}>{pets.length} pet{pets.length !== 1 ? 's' : ''} cadastrado{pets.length !== 1 ? 's' : ''}</div>
        </div>
        {!showForm && (
          <button onClick={openNew} style={{ padding: '10px 20px', borderRadius: 10, background: '#004A99', color: '#fff', fontWeight: 800, fontSize: 14, cursor: 'pointer', border: 'none' }}>
            + Cadastrar pet
          </button>
        )}
      </div>

      {showForm && (
        <div style={{ background: '#fff', borderRadius: 16, padding: 24, marginBottom: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 16 }}>{editingId ? 'Editar pet' : 'Novo pet para adoção'}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div><label style={labelStyle}>Nome *</label><input style={inputStyle} value={form.name} onChange={e => upd('name', e.target.value)} placeholder="Ex: Bolinha" /></div>
            <div><label style={labelStyle}>Espécie *</label>
              <select style={inputStyle} value={form.species} onChange={e => upd('species', e.target.value)}>
                <option value="cachorro">Cachorro</option><option value="gato">Gato</option>
              </select>
            </div>
            <div><label style={labelStyle}>Raça</label><input style={inputStyle} value={form.breed} onChange={e => upd('breed', e.target.value)} placeholder="Ex: SRD, Labrador" /></div>
            <div><label style={labelStyle}>Idade</label><input style={inputStyle} value={form.age} onChange={e => upd('age', e.target.value)} placeholder="Ex: 2 anos, 6 meses" /></div>
            <div><label style={labelStyle}>Sexo *</label>
              <select style={inputStyle} value={form.gender} onChange={e => upd('gender', e.target.value)}>
                <option value="macho">Macho</option><option value="femea">Fêmea</option>
              </select>
            </div>
            <div><label style={labelStyle}>Porte</label>
              <select style={inputStyle} value={form.size} onChange={e => upd('size', e.target.value)}>
                <option value="pequeno">Pequeno</option><option value="medio">Médio</option><option value="grande">Grande</option>
              </select>
            </div>
            <div><label style={labelStyle}>Status</label>
              <select style={inputStyle} value={form.status} onChange={e => upd('status', e.target.value)}>
                <option value="disponivel">Disponível</option>
                <option value="adotado">Adotado</option>
                <option value="indisponivel">Indisponível</option>
              </select>
            </div>
            <div><label style={labelStyle}>Unidade</label>
              <select style={inputStyle} value={form.unitId} onChange={e => upd('unitId', e.target.value)}>
                <option value="">Sem unidade específica</option>
                {ADOPTION_UNITS.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Foto do pet</label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <div style={{ width: 80, height: 80, borderRadius: 10, border: '2px dashed #e5e7eb', background: '#f8fafc', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {form.imageUrl ? <img src={form.imageUrl} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 28 }}>📷</span>}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#004A99' }}>{uploading ? 'Processando...' : form.imageUrl ? 'Clique para trocar' : 'Clique para selecionar'}</div>
                  <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>JPG, PNG · redimensionada automaticamente</div>
                </div>
                <input type="file" accept="image/*" onChange={handlePhoto} style={{ display: 'none' }} />
              </label>
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Descrição</label>
            <textarea style={{ ...inputStyle, height: 80, resize: 'vertical' }} value={form.description} onChange={e => upd('description', e.target.value)} placeholder="Personalidade, comportamento, observações..." />
          </div>
          {saveError && <p style={{ color: '#dc2626', fontSize: 13, marginBottom: 10 }}>Erro: {saveError}</p>}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={save} disabled={!form.name || saving} style={{ padding: '12px 24px', borderRadius: 10, background: '#EF7720', color: '#fff', fontWeight: 800, fontSize: 14, cursor: 'pointer', border: 'none' }}>
              {saving ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Cadastrar pet'}
            </button>
            <button onClick={cancelForm} style={{ padding: '12px 20px', borderRadius: 10, background: '#f0f4f8', color: '#555', fontWeight: 700, fontSize: 14, cursor: 'pointer', border: 'none' }}>Cancelar</button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>Carregando...</div>
      ) : pets.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#888', background: '#fff', borderRadius: 16 }}>Nenhum pet cadastrado ainda.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          {pets.map(pet => {
            const st = STATUS_CONFIG[pet.status ?? 'disponivel'] ?? STATUS_CONFIG.disponivel
            return (
              <div key={pet.id} style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', opacity: pet.status === 'adotado' ? 0.7 : 1 }}>
                <div style={{ height: 160, background: '#f0f4f8', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {pet.imageUrl ? <img src={pet.imageUrl} alt={pet.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 48 }}>{pet.species === 'cachorro' ? '🐕' : '🐈'}</span>}
                  <div style={{ position: 'absolute', top: 10, left: 10, background: st.bg, color: st.color, fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 20 }}>{st.label}</div>
                </div>
                <div style={{ padding: '14px 16px' }}>
                  <div style={{ fontWeight: 900, fontSize: 16, marginBottom: 4 }}>{pet.name}</div>
                  <div style={{ fontSize: 12, color: '#888', marginBottom: 10 }}>
                    {pet.breed ?? pet.species} · {pet.gender === 'macho' ? '♂ Macho' : '♀ Fêmea'}{pet.age ? ` · ${pet.age}` : ''}{pet.unitId ? ` · ${ADOPTION_UNITS.find(u => u.id === pet.unitId)?.name}` : ''}
                  </div>
                  {pet.description && <p style={{ fontSize: 12, color: '#666', lineHeight: 1.5, marginBottom: 12 }}>{pet.description}</p>}

                  {/* Status rápido */}
                  <div style={{ marginBottom: 10 }}>
                    <label style={{ ...labelStyle, marginBottom: 4 }}>Status</label>
                    <select value={pet.status ?? 'disponivel'} onChange={e => updateStatus(pet.id, e.target.value)}
                      style={{ ...inputStyle, fontSize: 12, padding: '6px 10px', fontWeight: 700, color: st.color, background: st.bg, border: `1.5px solid ${st.color}` }}>
                      <option value="disponivel">Disponível</option>
                      <option value="adotado">Adotado</option>
                      <option value="indisponivel">Indisponível</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => openEdit(pet)} style={{ flex: 1, padding: '8px', borderRadius: 8, background: '#004A99', color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer', border: 'none' }}>✏️ Editar</button>
                    <button onClick={() => remove(pet.id)} style={{ padding: '8px 12px', borderRadius: 8, background: '#fff', color: '#dc2626', fontWeight: 700, fontSize: 12, cursor: 'pointer', border: '1.5px solid #dc2626' }}>Remover</button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const COVER_OPTIONS = [
  { id: 'orange', label: 'Laranja', gradient: 'linear-gradient(135deg, #EF7720, #F89C5F)' },
  { id: 'orangeDark', label: 'Laranja Escuro', gradient: 'linear-gradient(135deg, #D35F0D, #EF7720)' },
  { id: 'blue', label: 'Azul', gradient: 'linear-gradient(135deg, #004A99, #0066CC)' },
  { id: 'green', label: 'Verde', gradient: 'linear-gradient(135deg, #16a34a, #22c55e)' },
  { id: 'purple', label: 'Roxo', gradient: 'linear-gradient(135deg, #7c3aed, #a78bfa)' },
]

type BlogPost = {
  id: string
  slug: string
  title: string
  tag: string
  excerpt: string
  content: string
  coverColor: string
  imageUrl: string | null
  readTime: string
  published: boolean
  createdAt: string
}

const emptyPost = { title: '', slug: '', tag: 'Saúde', excerpt: '', content: '', coverColor: 'blue', imageUrl: '', readTime: '5 min', published: false }

function slugify(text: string) {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function BlogTab() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ ...emptyPost })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    fetch('/api/blog?all=1').then(r => r.json()).then(d => { setPosts(Array.isArray(d) ? d : []); setLoading(false) }).catch(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const openNew = () => { setForm({ ...emptyPost }); setEditingId(null); setSaveError(null); setShowForm(true) }
  const openEdit = (post: BlogPost) => {
    setForm({ title: post.title, slug: post.slug, tag: post.tag, excerpt: post.excerpt, content: post.content, coverColor: post.coverColor, imageUrl: post.imageUrl ?? '', readTime: post.readTime, published: post.published })
    setEditingId(post.id); setSaveError(null); setShowForm(true)
  }
  const cancelForm = () => { setShowForm(false); setEditingId(null); setForm({ ...emptyPost }) }

  const upd = (k: string, v: string | boolean) => setForm(f => ({ ...f, [k]: v }))

  const save = async () => {
    setSaving(true); setSaveError(null)
    try {
      const payload = { ...form }
      const res = editingId
        ? await fetch(`/api/blog/${editingId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'x-admin-key': 'marreiro@admin2024' }, body: JSON.stringify(payload) })
        : await fetch('/api/blog', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-key': 'marreiro@admin2024' }, body: JSON.stringify(payload) })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? `Erro ${res.status}`) }
      cancelForm(); load()
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Erro ao salvar')
    } finally { setSaving(false) }
  }

  const remove = async (id: string) => {
    if (!confirm('Remover este artigo permanentemente?')) return
    await fetch(`/api/blog/${id}`, { method: 'DELETE', headers: { 'x-admin-key': 'marreiro@admin2024' } })
    load()
  }

  const togglePublish = async (post: BlogPost) => {
    await fetch(`/api/blog/${post.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'x-admin-key': 'marreiro@admin2024' }, body: JSON.stringify({ published: !post.published }) })
    load()
  }

  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div style={{ fontWeight: 900, fontSize: 18, color: '#0F1B2D' }}>Artigos do Blog</div>
          <div style={{ fontSize: 13, color: '#888', marginTop: 2 }}>{posts.length} artigo{posts.length !== 1 ? 's' : ''} · <a href="/dicas" target="_blank" style={{ color: '#004A99', fontWeight: 700, textDecoration: 'none' }}>ver página pública →</a></div>
        </div>
        {!showForm && (
          <button onClick={openNew} style={{ padding: '10px 20px', borderRadius: 10, background: '#004A99', color: '#fff', fontWeight: 800, fontSize: 14, cursor: 'pointer', border: 'none' }}>
            + Novo artigo
          </button>
        )}
      </div>

      {showForm && (
        <div style={{ background: '#fff', borderRadius: 16, padding: 24, marginBottom: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 16 }}>{editingId ? 'Editar artigo' : 'Novo artigo'}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Título *</label>
              <input style={inputStyle} value={form.title} onChange={e => { upd('title', e.target.value); if (!editingId) upd('slug', slugify(e.target.value)) }} placeholder="Ex: Como escolher a ração ideal" />
            </div>
            <div>
              <label style={labelStyle}>Slug (URL) *</label>
              <input style={inputStyle} value={form.slug} onChange={e => upd('slug', e.target.value)} placeholder="como-escolher-a-racao" />
            </div>
            <div>
              <label style={labelStyle}>Categoria</label>
              <select style={inputStyle} value={form.tag} onChange={e => upd('tag', e.target.value)}>
                {['Nutrição', 'Saúde', 'Comportamento', 'Grooming', 'Bem-estar'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Tempo de leitura</label>
              <input style={inputStyle} value={form.readTime} onChange={e => upd('readTime', e.target.value)} placeholder="5 min" />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>URL da foto de capa (opcional)</label>
              <input style={inputStyle} value={form.imageUrl} onChange={e => upd('imageUrl', e.target.value)} placeholder="https://..." />
            </div>
            <div>
              <label style={labelStyle}>Cor de capa (quando sem foto)</label>
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                {COVER_OPTIONS.map(c => (
                  <div key={c.id} onClick={() => upd('coverColor', c.id)} title={c.label} style={{ width: 32, height: 32, borderRadius: 8, background: c.gradient, cursor: 'pointer', border: form.coverColor === c.id ? '3px solid #0F1B2D' : '3px solid transparent', flexShrink: 0 }} />
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <label style={{ ...labelStyle, margin: 0 }}>Publicado</label>
              <input type="checkbox" checked={form.published} onChange={e => upd('published', e.target.checked)} style={{ width: 18, height: 18, cursor: 'pointer', accentColor: '#004A99' }} />
              <span style={{ fontSize: 12, color: form.published ? '#16a34a' : '#888', fontWeight: 700 }}>{form.published ? 'Visível no site' : 'Rascunho'}</span>
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Resumo (excerpt) *</label>
            <textarea style={{ ...inputStyle, height: 70, resize: 'vertical' }} value={form.excerpt} onChange={e => upd('excerpt', e.target.value)} placeholder="Breve descrição que aparece nos cards..." />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Conteúdo * (separe parágrafos com linha em branco)</label>
            <textarea style={{ ...inputStyle, height: 260, resize: 'vertical', fontFamily: 'monospace', fontSize: 13 }} value={form.content} onChange={e => upd('content', e.target.value)} placeholder={'Parágrafo 1...\n\nParágrafo 2...\n\nParágrafo 3...'} />
          </div>
          {saveError && <p style={{ color: '#dc2626', fontSize: 13, marginBottom: 10 }}>Erro: {saveError}</p>}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={save} disabled={!form.title || !form.slug || saving} style={{ padding: '12px 24px', borderRadius: 10, background: '#EF7720', color: '#fff', fontWeight: 800, fontSize: 14, cursor: 'pointer', border: 'none' }}>
              {saving ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Publicar artigo'}
            </button>
            <button onClick={cancelForm} style={{ padding: '12px 20px', borderRadius: 10, background: '#f0f4f8', color: '#555', fontWeight: 700, fontSize: 14, cursor: 'pointer', border: 'none' }}>Cancelar</button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>Carregando...</div>
      ) : posts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#888', background: '#fff', borderRadius: 16 }}>Nenhum artigo ainda. Clique em "+ Novo artigo" para começar.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {posts.map(post => (
            <div key={post.id} style={{ background: '#fff', borderRadius: 14, padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <div style={{ width: 56, height: 56, borderRadius: 10, background: COVER_OPTIONS.find(c => c.id === post.coverColor)?.gradient ?? COVER_OPTIONS[0].gradient, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 10, background: '#f0f4f8', color: '#555' }}>{post.tag}</span>
                  <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 10, background: post.published ? '#dcfce7' : '#fef9c3', color: post.published ? '#16a34a' : '#854d0e' }}>
                    {post.published ? '● Publicado' : '○ Rascunho'}
                  </span>
                  <span style={{ fontSize: 11, color: '#999' }}>{post.readTime} de leitura</span>
                </div>
                <div style={{ fontWeight: 900, fontSize: 15, color: '#0F1B2D', marginBottom: 3 }}>{post.title}</div>
                <div style={{ fontSize: 12, color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{post.excerpt}</div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <button onClick={() => togglePublish(post)} style={{ padding: '6px 12px', borderRadius: 8, background: post.published ? '#fef9c3' : '#dcfce7', color: post.published ? '#854d0e' : '#16a34a', fontWeight: 700, fontSize: 12, cursor: 'pointer', border: 'none' }}>
                  {post.published ? 'Despublicar' : 'Publicar'}
                </button>
                <a href={`/dicas/${post.slug}`} target="_blank" style={{ padding: '6px 12px', borderRadius: 8, background: '#f0f4f8', color: '#004A99', fontWeight: 700, fontSize: 12, cursor: 'pointer', textDecoration: 'none' }}>Ver →</a>
                <button onClick={() => openEdit(post)} style={{ padding: '6px 12px', borderRadius: 8, background: '#004A99', color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer', border: 'none' }}>✏️ Editar</button>
                <button onClick={() => remove(post.id)} style={{ padding: '6px 12px', borderRadius: 8, background: '#fff', color: '#dc2626', fontWeight: 700, fontSize: 12, cursor: 'pointer', border: '1.5px solid #dc2626' }}>Remover</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

type ProRow = { id: string; slug: string; name: string; unitId: string; active: boolean }
