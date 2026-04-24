'use client'
import { useEffect, useMemo, useState, useCallback } from 'react'
import Icon from '@/components/ui/Icon'
import { PRO_NAMES } from '@/data/professionals'

const SERVICES = [
  { id: 'vet', name: 'Consulta Veterinária', sub: 'Check-up, diagnóstico', icon: 'stethoscope' as const },
  { id: 'banho', name: 'Banho & Tosa', sub: 'Higiene e estética', icon: 'bath' as const },
  { id: 'vacina', name: 'Vacinação', sub: 'V8, V10, antirrábica', icon: 'syringe' as const },
  { id: 'exames', name: 'Exames', sub: 'Laboratório e imagem', icon: 'pill' as const },
]

const VACCINES: Record<string, { id: string; name: string; price: number; priceLabel: string; diseases?: string[] }[]> = {
  dog: [
    { id: 'v8v10-importada', name: 'Polivalente V8/V10 Importada',  price: 90, priceLabel: 'R$ 90,00',
      diseases: ['Cinomose', 'Parvovirose', 'Hepatite', 'Adenovirose', 'Parainfluenza', 'Coronavirose', 'Leptospirose'] },
    { id: 'vanguard-v10',    name: 'Polivalente V10 Vanguard Plus', price: 95, priceLabel: 'R$ 95,00',
      diseases: ['Cinomose', 'Parvovirose', 'Hepatite', 'Adenovirose', 'Parainfluenza', 'Coronavirose', 'Leptospirose (10 sorovares)'] },
    { id: 'antirabica-cao',  name: 'Antirábica (raiva)',            price: 60, priceLabel: 'R$ 60,00',
      diseases: ['Raiva'] },
    { id: 'tosse-canis',     name: 'Vacina Tosse dos Canis',        price: 90, priceLabel: 'R$ 90,00',
      diseases: ['Bordetella', 'Parainfluenza'] },
    { id: 'anti-giardia',    name: 'Anti-Giárdia',                  price: 90, priceLabel: 'R$ 90,00',
      diseases: ['Giardíase'] },
  ],
  cat: [
    { id: 'antirabica-gato', name: 'Antirábica (raiva)', price: 60,  priceLabel: 'R$ 60,00',
      diseases: ['Raiva'] },
    { id: 'felina-v3',       name: 'Múltipla Felina V3', price: 70,  priceLabel: 'R$ 70,00',
      diseases: ['Panleucopenia', 'Rinotraqueíte', 'Calicivirose'] },
    { id: 'felina-v4',       name: 'Múltipla Felina V4', price: 80,  priceLabel: 'R$ 80,00',
      diseases: ['Panleucopenia', 'Rinotraqueíte', 'Calicivirose', 'Clamidofilose'] },
    { id: 'felina-v5',       name: 'Múltipla Felina V5', price: 120, priceLabel: 'R$ 120,00',
      diseases: ['Panleucopenia', 'Rinotraqueíte', 'Calicivirose', 'Clamidofilose', 'Leucemia Felina (FeLV)'] },
  ],
}

const VET_SUB_SERVICES = [
  { id: 'clinico-geral', name: 'Consulta Clínico Geral', price: 80, priceLabel: 'R$ 80,00', info: '' },
  { id: 'retorno', name: 'Retorno Veterinário', price: 0, priceLabel: 'Gratuito', info: '30 dias do atendimento anterior' },
  { id: 'plantao', name: 'Consulta Plantão', price: 120, priceLabel: 'R$ 120,00', info: '19h–07h · Domingos e feriados' },
]

const UNITS = [
  { id: 'caucaia', name: 'Caucaia', sub: 'Jurema', whatsapp: '5585991575287' },
  { id: 'pecem', name: 'Pecém', sub: 'São Gonçalo do Amarante', whatsapp: '5585981173322' },
  { id: 'saogoncalo', name: 'São Gonçalo', sub: 'Centro', whatsapp: '5585991976216' },
  { id: 'taiba', name: 'Taíba', sub: 'São Gonçalo do Amarante', whatsapp: '5585992231172' },
]

const PROFESSIONALS = [
  { id: 'any', name: 'Sem preferência', sub: 'Próximo profissional disponível' },
  { id: 'vitor', name: 'Vitor Fernandes', sub: 'Tosador especialista' },
  { id: 'daniele', name: 'Daniele Mendes', sub: 'Banhista & tosadora' },
]

const TIMES = ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00']

const CLINICO_TIMES = (() => {
  const slots: string[] = []
  const blocked = new Set(['12:00', '12:30'])
  for (let h = 7; h <= 18; h++) {
    const hh = String(h).padStart(2, '0')
    if (!blocked.has(`${hh}:00`)) slots.push(`${hh}:00`)
    if (!blocked.has(`${hh}:30`)) slots.push(`${hh}:30`)
  }
  return slots
})()

const PLANTAO_TIMES = (() => {
  const slots: string[] = []
  for (let h = 19; h < 24; h++) slots.push(`${String(h).padStart(2,'0')}:00`, `${String(h).padStart(2,'0')}:30`)
  for (let h = 0; h <= 6; h++) slots.push(`${String(h).padStart(2,'0')}:00`, `${String(h).padStart(2,'0')}:30`)
  return slots
})()

function getNextDates(n: number) {
  const days = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB']
  const out = []
  const today = new Date()
  for (let i = 0; i < n; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    out.push({ date: d, day: d.getDate(), label: i === 0 ? 'HOJE' : days[d.getDay()] })
  }
  return out
}

type DateEntry = ReturnType<typeof getNextDates>[0]

const POLYVALENT_IDS = new Set(['v8v10-importada', 'vanguard-v10', 'felina-v3', 'felina-v4', 'felina-v5'])

interface BookingState {
  service: string | null
  vetSubService: string | null
  vaccines: string[]
  unit: string | null
  petType: string | null
  size: string | null
  professional: string | null
  date: DateEntry | null
  time: string | null
  tutorName: string
  phone: string
  cpf: string
  petName: string
  vetName: string
  notes: string
}

const initialState: BookingState = {
  service: null, vetSubService: null, vaccines: [], unit: null, petType: null, size: null, professional: null,
  date: null, time: null, tutorName: '', phone: '', cpf: '', petName: '', vetName: '', notes: '',
}

export default function Scheduler() {
  const [step, setStep] = useState(0)
  const [data, setData] = useState<BookingState>(initialState)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [assignedPro, setAssignedPro] = useState<string | null>(null)
  const [availableSlots, setAvailableSlots] = useState<Record<string, number>>({})
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [bookedTimes, setBookedTimes] = useState<string[]>([])
  const dates = useMemo(() => getNextDates(14), [])

  useEffect(() => {
    document.body.classList.toggle('scheduler-active', data.service !== null)
    return () => document.body.classList.remove('scheduler-active')
  }, [data.service])

  useEffect(() => {
    if (data.service === null) return
    const handler = (e: MouseEvent) => {
      const wrap = document.querySelector('.schedule-wrap')
      if (wrap && !wrap.contains(e.target as Node)) reset()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [data.service])

  const fetchAvailableSlots = useCallback(async (unitId: string, date: Date) => {
    setLoadingSlots(true)
    const iso = date.toISOString().split('T')[0]
    try {
      const res = await fetch(`/api/available-slots?unitId=${unitId}&date=${iso}`)
      const json = await res.json()
      const map: Record<string, number> = {}
      for (const s of json.slots ?? []) map[s.time] = s.availableCount
      setAvailableSlots(map)
    } catch { setAvailableSlots({}) }
    finally { setLoadingSlots(false) }
  }, [])

  useEffect(() => {
    const preselect = sessionStorage.getItem('preselect-service')
    if (preselect) {
      sessionStorage.removeItem('preselect-service')
      update({ service: preselect })
    }
  }, [])

  useEffect(() => {
    if (data.professional === 'any' && data.date && data.unit) {
      fetchAvailableSlots(data.unit, data.date.date)
    } else {
      setAvailableSlots({})
    }
  }, [data.professional, data.date, data.unit, fetchAvailableSlots])

  useEffect(() => {
    if (!data.date || !data.unit || !data.service || data.service === 'banho') {
      setBookedTimes([])
      return
    }
    const iso = data.date.date.toISOString().split('T')[0]
    fetch(`/api/booked-slots?unitId=${data.unit}&date=${iso}&serviceType=${data.service}`)
      .then(r => r.json())
      .then(json => setBookedTimes(json.bookedTimes ?? []))
      .catch(() => setBookedTimes([]))
  }, [data.date, data.unit, data.service])
  const TOTAL = 4

  const update = (patch: Partial<BookingState>) => setData(d => ({ ...d, ...patch }))

  const toggleVaccine = (id: string) => {
    setData(d => {
      const isPolyvalent = POLYVALENT_IDS.has(id)
      const selected = d.vaccines.includes(id)
      if (selected) return { ...d, vaccines: d.vaccines.filter(v => v !== id) }
      if (isPolyvalent) return { ...d, vaccines: [...d.vaccines.filter(v => !POLYVALENT_IDS.has(v)), id] }
      return { ...d, vaccines: [...d.vaccines, id] }
    })
  }

  const validateCpf = (cpf: string) => {
    const n = cpf.replace(/\D/g, '')
    if (n.length !== 11 || /^(\d)\1+$/.test(n)) return false
    let sum = 0
    for (let i = 0; i < 9; i++) sum += parseInt(n[i]) * (10 - i)
    let r = (sum * 10) % 11; if (r === 10 || r === 11) r = 0
    if (r !== parseInt(n[9])) return false
    sum = 0
    for (let i = 0; i < 10; i++) sum += parseInt(n[i]) * (11 - i)
    r = (sum * 10) % 11; if (r === 10 || r === 11) r = 0
    return r === parseInt(n[10])
  }

  const canNext = () => {
    if (step === 0) {
      if (data.service === 'banho') return !!data.service
      if (data.service === 'vet') return !!(data.service && data.vetSubService && data.unit)
      return !!(data.service && data.unit)
    }
    if (step === 1) {
      if (!data.petType) return false
      if (data.service === 'banho') return !!data.professional
      if (data.service === 'vacina') return data.vaccines.length > 0
      return true
    }
    if (step === 2) return data.date && data.time
    if (step === 3) return data.tutorName && data.phone && data.cpf && data.petName && validateCpf(data.cpf)
    return false
  }

  const isRetorno = data.service === 'vet' && data.vetSubService === 'retorno'
  const isPlantao = data.service === 'vet' && data.vetSubService === 'plantao'
  const isClinico = data.service === 'vet' && data.vetSubService === 'clinico-geral'
  const activeTimes = isPlantao ? PLANTAO_TIMES : isClinico ? CLINICO_TIMES : TIMES
  const next = () => { if (step < TOTAL) setStep(isRetorno && step === 0 ? 2 : step + 1) }
  const back = () => setStep(s => isRetorno && s === 2 ? 0 : Math.max(0, s - 1))
  const reset = () => { setStep(0); setData(initialState); setSubmitted(false); setError(null) }

  const handleConfirm = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceType: data.service,
          package: data.vetSubService ?? (data.vaccines.length > 0 ? data.vaccines.join(',') : null) ?? null,
          unitId: data.unit,
          professional: data.professional ?? null,
          petName: data.petName,
          petSize: data.size ?? null,
          tutorName: data.tutorName,
          tutorCpf: data.cpf || null,
          phone: data.phone,
          notes: data.notes || null,
          date: data.date?.date.toISOString(),
          time: data.time,
          totalPrice:
            VET_SUB_SERVICES.find(s => s.id === data.vetSubService)?.price ??
            data.vaccines.reduce((sum, id) => sum + ((VACCINES[data.petType ?? ''] ?? []).find(v => v.id === id)?.price ?? 0), 0),
          isVip: false,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Erro ao agendar')
      setAssignedPro(json.professional ?? null)
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar agendamento')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    const service = SERVICES.find(s => s.id === data.service)
    const unit = UNITS.find(u => u.id === data.unit)
    const dateStr = data.date
      ? `${data.date.day.toString().padStart(2, '0')}/${((data.date.date.getMonth()) + 1).toString().padStart(2, '0')}/${data.date.date.getFullYear()}`
      : ''
    const petSize = data.size === 'small' ? 'Pequeno (até 10kg)' : data.size === 'medium' ? 'Médio (10–20kg)' : data.size === 'large' ? 'Grande (acima de 20kg)' : ''

    const proName = assignedPro ? (PRO_NAMES[assignedPro] ?? assignedPro) : null
    const waMsg = [
      `Olá! Gostaria de confirmar meu agendamento na unidade Marreiro Pet ${unit?.name}.`,
      ``,
      `*Serviço:* ${service?.name}`,
      `*Pet:* ${data.petName}${petSize ? ` (${petSize})` : ''}`,
      `*Tutor:* ${data.tutorName}`,
      `*Data:* ${dateStr} às ${data.time}`,
      proName && data.service === 'banho' ? `*Profissional:* ${proName}` : '',
      data.vetName ? `*Veterinário do retorno:* ${data.vetName}` : '',
      data.notes ? `*Observações:* ${data.notes}` : '',
    ].filter(Boolean).join('\n')
    const waUrl = `https://wa.me/${unit?.whatsapp}?text=${encodeURIComponent(waMsg)}`

    return (
      <div className="schedule-form">
        <div className="success-box">
          <div className="success-check"><Icon name="check" size={36} /></div>
          <h3>Solicitação recebida!</h3>
          <p>Olá <strong>{data.tutorName}</strong>! Recebemos sua solicitação para <strong>{data.petName}</strong>.</p>
          <p style={{ fontSize: 14, color: '#555', marginTop: 8, lineHeight: 1.6 }}>Nossa equipe vai verificar a disponibilidade e entrar em contato via WhatsApp para confirmar o agendamento. A confirmação depende da agenda atual da unidade.</p>
          <div className="summary-box" style={{ marginTop: 22, textAlign: 'left' }}>
            <div className="summary-row"><span className="k">Serviço</span><span className="v">{service?.name}</span></div>
            <div className="summary-row"><span className="k">Unidade</span><span className="v">{unit?.name}</span></div>
            <div className="summary-row"><span className="k">Data</span><span className="v">{dateStr} às {data.time}</span></div>
            {assignedPro && data.service === 'banho' && <div className="summary-row"><span className="k">Profissional</span><span className="v">{PRO_NAMES[assignedPro] ?? assignedPro}</span></div>}
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 14, flexWrap: 'wrap' }}>
            <a href={waUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary"><Icon name="wa" size={16} /> Confirmar pelo WhatsApp</a>
            <button className="btn btn-ghost" onClick={reset}>Fazer novo agendamento</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
    <div className="schedule-form" id="agendar">
      <div className="stepper">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className={`step-dot ${i === step ? 'active' : i < step ? 'done' : ''}`} />
        ))}
      </div>

      {step === 0 && (
        <>
          <div className="form-title">Qual serviço você precisa?</div>
          <div className="form-sub">Escolha o que vamos fazer pelo seu pet.</div>
          <div className="tile-grid" style={{ marginBottom: data.service === 'vet' ? 0 : 22 }}>
            {SERVICES.map(s => (
              <button key={s.id} className={`tile ${data.service === s.id ? 'selected' : ''}`} onClick={() => update({ service: s.id, vetSubService: null })}>
                <div className="tile-icon"><Icon name={s.icon} size={20} /></div>
                <div><div className="tile-title">{s.name}</div><div className="tile-sub">{s.sub}</div></div>
              </button>
            ))}
          </div>

          {data.service === 'vet' && (
            <div style={{ marginTop: 22, marginBottom: 22 }}>
              <div className="form-title" style={{ fontSize: 16 }}>Tipo de consulta</div>
              <div className="tile-grid" style={{ marginTop: 10 }}>
                {VET_SUB_SERVICES.map(s => (
                  <button key={s.id} className={`tile ${data.vetSubService === s.id ? 'selected' : ''}`} onClick={() => update({ vetSubService: s.id })}>
                    <div className="tile-icon">🩺</div>
                    <div>
                      <div className="tile-title">{s.name}</div>
                      <div style={{ marginTop: 3 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: data.vetSubService === s.id ? '#004A99' : '#EF7720' }}>{s.priceLabel}</span>
                        {s.info && <span className="tile-sub" style={{ display: 'block', marginTop: 1 }}>{s.info}</span>}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="form-title" style={{ fontSize: 16 }}>Em qual unidade?</div>
          <div className="tile-grid" style={{ marginTop: 10 }}>
            {UNITS.map(u => (
              <button key={u.id} className={`tile ${data.unit === u.id ? 'selected' : ''}`} onClick={() => update({ unit: u.id })}>
                <div className="tile-icon"><Icon name="pin" size={18} /></div>
                <div><div className="tile-title">{u.name}</div><div className="tile-sub">{u.sub}</div></div>
              </button>
            ))}
          </div>
        </>
      )}

      {step === 1 && (
        <>
          <div className="form-title">{data.service === 'banho' ? 'Porte do pet & pacote' : 'Quem é o pet?'}</div>
          <div className="form-sub">{data.service === 'banho' ? 'O preço varia conforme o porte. Comece selecionando o tamanho do seu pet.' : 'Vamos adequar o atendimento ao seu bichinho.'}</div>
          <div className="pet-type-grid">
            <button className={`pet-pill ${data.petType === 'dog' ? 'selected' : ''}`} onClick={() => update({ petType: 'dog', vaccines: [] })}>
              <div className="pet-pill-glyph">🐕</div><div className="pet-pill-name">Cachorro</div>
            </button>
            <button className={`pet-pill ${data.petType === 'cat' ? 'selected' : ''}`} onClick={() => update({ petType: 'cat', vaccines: [] })}>
              <div className="pet-pill-glyph">🐈</div><div className="pet-pill-name">Gato</div>
            </button>
          </div>
          {data.service === 'banho' && (
            <div className="form-row" style={{ marginTop: 20 }}>
              <div>
                <div className="label" style={{ marginBottom: 6 }}>Porte</div>
                <select className="select" value={data.size || ''} onChange={e => update({ size: e.target.value })}>
                  <option value="">Selecione</option>
                  <option value="small">Pequeno (até 10kg)</option>
                  <option value="medium">Médio (10kg a 20kg)</option>
                  <option value="large">Grande (acima de 20kg)</option>
                </select>
              </div>
            </div>
          )}
          {data.service === 'vacina' && data.petType && (
            <div style={{ marginTop: 22 }}>
              <div className="label" style={{ marginBottom: 4 }}>💉 Escolha a(s) vacina(s)</div>
              <div style={{ fontSize: 12, color: '#888', marginBottom: 10 }}>Apenas uma polivalente por vez. As demais podem ser combinadas.</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(VACCINES[data.petType] ?? []).map(v => {
                  const selected = data.vaccines.includes(v.id)
                  const isPolyvalent = POLYVALENT_IDS.has(v.id)
                  const otherPolySelected = isPolyvalent && data.vaccines.some(id => POLYVALENT_IDS.has(id) && id !== v.id)
                  return (
                    <button key={v.id} type="button" onClick={() => toggleVaccine(v.id)}
                      style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '12px 16px', borderRadius: 12, border: `2px solid ${selected ? '#004A99' : otherPolySelected ? '#f1c0c0' : '#e5e7eb'}`, background: selected ? '#EFF6FF' : otherPolySelected ? '#fff8f8' : '#fff', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s', width: '100%', opacity: otherPolySelected ? 0.55 : 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 16, height: 16, borderRadius: 4, border: `2px solid ${selected ? '#004A99' : '#d1d5db'}`, background: selected ? '#004A99' : '#fff', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                            {selected && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                          </div>
                          <span style={{ fontSize: 14, fontWeight: selected ? 700 : 600, color: selected ? '#004A99' : '#1a1a1a' }}>{v.name}</span>
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 700, color: selected ? '#004A99' : '#EF7720', flexShrink: 0, marginLeft: 12 }}>{v.priceLabel}</span>
                      </div>
                      {v.diseases && v.diseases.length > 0 && (
                        <div className="vaccine-diseases">
                          {v.diseases.map(d => (
                            <span key={d} style={{ fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 20, background: selected ? '#dbeafe' : '#f1f5f9', color: selected ? '#1e40af' : '#555', border: `1px solid ${selected ? '#bfdbfe' : '#e5e7eb'}` }}>{d}</span>
                          ))}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
              {data.vaccines.length > 0 && (
                <div style={{ marginTop: 10, fontSize: 13, fontWeight: 700, color: '#004A99' }}>
                  Total: R$ {data.vaccines.reduce((sum, id) => sum + ((VACCINES[data.petType ?? ''] ?? []).find(v => v.id === id)?.price ?? 0), 0).toFixed(2).replace('.', ',')}
                </div>
              )}
            </div>
          )}

          {data.service === 'banho' && (
            <div style={{ marginTop: 22 }}>
              <div className="label" style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icon name="scissors" size={14} /> Profissional de banho & tosa
              </div>
              <div className="pro-grid">
                {PROFESSIONALS.map(p => (
                  <button key={p.id} type="button" className={`pro-card ${data.professional === p.id ? 'selected' : ''}`} onClick={() => update({ professional: p.id })}>
                    <div className="pro-avatar">{p.id === 'any' ? <Icon name="users" size={20} /> : p.name.split(' ').map(w => w[0]).slice(0, 2).join('')}</div>
                    <div className="pro-meta"><div className="pro-name">{p.name}</div><div className="pro-sub">{p.sub}</div></div>
                    <div className="pro-check"><Icon name="check" size={14} /></div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {step === 2 && (
        <>
          <div className="form-title">Quando fica bom?</div>
          <div className="form-sub">
            {data.professional === 'any'
              ? 'Selecione um dia — os horários disponíveis serão carregados automaticamente.'
              : 'Selecione um dia e horário disponíveis.'}
          </div>
          <div className="label" style={{ marginBottom: 10 }}>Data</div>
          <div className="date-grid" style={{ marginBottom: 20 }}>
            {dates.map((d, i) => (
              <button key={i} className={`date-cell ${data.date?.day === d.day ? 'selected' : ''}`} disabled={d.date.getDay() === 0 && data.unit !== 'caucaia'} onClick={() => update({ date: d, time: null })}>
                <div className="date-cell-day">{d.label}</div>{d.day}
              </button>
            ))}
          </div>
          <div className="label" style={{ marginBottom: 10 }}>
            Horário
            {data.professional === 'any' && data.date && loadingSlots && (
              <span style={{ fontSize: 12, color: '#888', fontWeight: 400, marginLeft: 8 }}>carregando disponibilidade...</span>
            )}
          </div>
          <div className="time-grid">
            {activeTimes.map(t => {
              const isAny = data.professional === 'any'
              const hasAvailability = !isAny || (availableSlots[t] ?? 0) > 0
              const isToday = data.date ? data.date.date.toDateString() === new Date().toDateString() : false
              const isPast = isToday && (() => {
                const now = new Date()
                const [h, m] = t.split(':').map(Number)
                return h * 60 + m <= now.getHours() * 60 + now.getMinutes()
              })()
              const isBooked = bookedTimes.includes(t)
              const disabled = !data.date || !hasAvailability || loadingSlots || isPast || isBooked
              return (
                <button key={t} className={`time-slot ${data.time === t ? 'selected' : ''}`} disabled={disabled} onClick={() => update({ time: t })}
                  title={isAny && data.date && !hasAvailability ? 'Sem profissional disponível neste horário' : ''}>
                  {t}
                  {isAny && data.date && !loadingSlots && hasAvailability && (availableSlots[t] ?? 0) > 0 && (
                    <span style={{ fontSize: 10, display: 'block', color: '#16a34a', fontWeight: 600 }}>
                      {availableSlots[t]} disponível{availableSlots[t] > 1 ? 'ais' : ''}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
          {data.professional === 'any' && !data.date && (
            <p style={{ fontSize: 13, color: '#888', marginTop: 12, textAlign: 'center' }}>
              Selecione uma data para ver os horários disponíveis
            </p>
          )}
        </>
      )}

      {step === 3 && (
        <>
          <div className="form-title">Seus dados</div>
          <div className="form-sub">Só precisamos disso para confirmar por WhatsApp.</div>
          <div className="summary-box">
            <div className="summary-row"><span className="k">Serviço</span><span className="v">{SERVICES.find(s => s.id === data.service)?.name}</span></div>
            {data.vetSubService && <div className="summary-row"><span className="k">Tipo</span><span className="v">{VET_SUB_SERVICES.find(s => s.id === data.vetSubService)?.name}</span></div>}
            {data.vaccines.length > 0 && <div className="summary-row"><span className="k">Vacina(s)</span><span className="v">{data.vaccines.map(id => (VACCINES[data.petType ?? ''] ?? []).find(v => v.id === id)?.name).filter(Boolean).join(', ')}</span></div>}
            <div className="summary-row"><span className="k">Unidade</span><span className="v">Marreiro {UNITS.find(u => u.id === data.unit)?.name}</span></div>
            <div className="summary-row"><span className="k">Data & horário</span><span className="v">{data.date?.day}/{((data.date?.date.getMonth() ?? 0) + 1).toString().padStart(2, '0')} às {data.time}</span></div>
          </div>
          <div className="form-row two">
            <div>
              <div className="label" style={{ marginBottom: 6 }}>Seu nome *</div>
              <input className="input" placeholder="Ex: Ana Silva" value={data.tutorName} onChange={e => update({ tutorName: e.target.value })} />
            </div>
            <div>
              <div className="label" style={{ marginBottom: 6 }}>WhatsApp *</div>
              <input className="input" placeholder="(85) 9 9999-9999" value={data.phone} inputMode="numeric" onChange={e => update({ phone: e.target.value.replace(/\D/g, '') })} />
            </div>
          </div>
          <div className="form-row two">
            <div>
              <div className="label" style={{ marginBottom: 6 }}>CPF *</div>
              <input className="input" placeholder="000.000.000-00" value={data.cpf} inputMode="numeric" onChange={e => update({ cpf: e.target.value.replace(/\D/g, '') })} style={{ borderColor: data.cpf && !validateCpf(data.cpf) ? '#dc2626' : undefined }} />
              {data.cpf && !validateCpf(data.cpf) && <div style={{ fontSize: 12, color: '#dc2626', marginTop: 4 }}>CPF inválido</div>}
            </div>
            <div>
              <div className="label" style={{ marginBottom: 6 }}>Nome do pet *</div>
              <input className="input" placeholder="Ex: Mel" value={data.petName} onChange={e => update({ petName: e.target.value })} />
            </div>
          </div>
          {isRetorno && (
            <div className="form-row">
              <div className="label" style={{ marginBottom: 6 }}>Veterinário do retorno (opcional)</div>
              <input className="input" placeholder="Ex: Dr. João Silva" value={data.vetName} onChange={e => update({ vetName: e.target.value })} />
            </div>
          )}
          <div className="form-row">
            <div className="label" style={{ marginBottom: 6 }}>Observações (opcional)</div>
            <textarea className="textarea" placeholder="Alergias, medicamentos, comportamento..." value={data.notes} onChange={e => update({ notes: e.target.value })} />
          </div>
          {error && <p style={{ color: 'red', fontSize: 14, marginTop: 8 }}>{error}</p>}
        </>
      )}

      <div className="step-actions">
        {step > 0 ? (
          <button className="btn-back" onClick={back}><Icon name="arrow-left" size={16} /> Voltar</button>
        ) : <span />}
        {step < TOTAL - 1 ? (
          <button className="btn-next" onClick={() => {
            if (step === 0 && data.service === 'banho') {
              const el = document.querySelector('.grooming-form') || document.getElementById('banho-tosa')
              if (el) {
                const top = el.getBoundingClientRect().top + window.scrollY - 100
                window.scrollTo({ top, behavior: 'smooth' })
              }
            } else {
              next()
            }
          }} disabled={!canNext()}>Continuar <Icon name="arrow-right" size={16} /></button>
        ) : (
          <button className="btn-submit" onClick={handleConfirm} disabled={!canNext() || loading}>
            {loading ? 'Aguarde...' : <><Icon name="check" size={16} /> Confirmar agendamento</>}
          </button>
        )}
      </div>
    </div>
    </>
  )
}

