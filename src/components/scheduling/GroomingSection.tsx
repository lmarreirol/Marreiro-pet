'use client'
import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Icon from '@/components/ui/Icon'

const GROOMING_SIZES = [
  { id: 'small', name: 'Pequeno', kg: 'até 10kg', glyph: '🐕' },
  { id: 'medium', name: 'Médio', kg: '10 a 20kg', glyph: '🐕‍🦺' },
  { id: 'large', name: 'Grande', kg: 'acima de 20kg', glyph: '🦮' },
]

const GROOMING_PACKAGES = [
  {
    id: 'banho', name: 'Banho Tradicional', icon: 'bath' as const, durationMin: 30,
    desc: 'Banho com produtos específicos, secagem, escovação e perfume.',
    includes: ['Banho', 'Secagem', 'Escovação', 'Perfume', 'Laço/gravata', 'Corte de Unhas', 'Limpeza de ouvidos'],
    prices: { small: 49, medium: 60, large: 90 },
  },
  {
    id: 'banho-tosa', name: 'Banho + Tosa Higiênica', icon: 'scissors' as const, badge: 'Popular', durationMin: 45,
    desc: 'Banho completo com tosa higiênica nas patas, barriga e região íntima.',
    includes: ['Banho completo', 'Tosa higiênica'],
    prices: { small: 72, medium: 90, large: 120 },
  },
  {
    id: 'spa', name: 'Tosa Completa + Banho', icon: 'scissors' as const, durationMin: 60,
    desc: 'Experiência completa: tosa na tesoura ou máquina + tratamento spa com hidratação profunda.',
    includes: ['Tosa na tesoura', 'Escovação', 'Corte de unhas', 'Perfume premium'],
    prices: { small: 109, medium: 120, large: 150 },
  },
]

const GROOMING_ADDONS = [
  { id: 'hidra', name: 'Hidratação de pelos', sub: 'Máscara profissional', price: 28, badge: 'Popular', durationMin: 5 },
  { id: 'ozonio', name: 'Banho Luxo', sub: 'Shampoo super premium + máscara de hidratação profunda para pelos sedosos e perfumados', price: 35, badge: 'Popular', durationMin: 5 },
  { id: 'dentes', name: 'Escovação de dentes', sub: 'Hálito fresco', price: 10, badge: 'Popular', durationMin: 0 },
  { id: 'unhas', name: 'Remoção de Subpelo', sub: 'Tratamento Premium Anti Queda de Pelos', price: 36, durationMin: 15 },
  { id: 'perfume', name: 'Tonalização de Pelo', sub: 'Realça o brilho e uniformiza a coloração dos pelos', price: 18, durationMin: 5 },
  { id: 'coloracao', name: 'Retirada de Nós', sub: 'Sessão de 1h para desamarrar nós e embaraços com cuidado', price: 60, durationMin: 30 },
]

const GROOMING_TIMES = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30']

const UNITS = [
  { id: 'caucaia', name: 'Caucaia', sub: 'Jurema' },
  { id: 'pecem', name: 'Pecém', sub: 'São Gonçalo do Amarante' },
  { id: 'saogoncalo', name: 'São Gonçalo', sub: 'Centro' },
  { id: 'taiba', name: 'Taíba', sub: 'São Gonçalo do Amarante' },
]

const ANY_PRO = { id: 'any', name: 'Sem preferência', sub: 'Próximo profissional disponível' }

const PROFESSIONALS: Record<string, { id: string; name: string; sub: string }[]> = {
  caucaia: [
    ANY_PRO,
    { id: 'victor', name: 'Victor Lopes', sub: 'Grooming' },
    { id: 'daniele', name: 'Daniele Santos', sub: 'Banhista' },
    { id: 'eduarda', name: 'Eduarda', sub: 'Banhista' },
    { id: 'israel', name: 'Israel', sub: 'Banhista' },
  ],
  pecem: [
    ANY_PRO,
    { id: 'vitoria', name: 'Vitória Duraes', sub: 'Grooming' },
    { id: 'christian', name: 'Christian Fernandes', sub: 'Banhista' },
  ],
  taiba: [
    ANY_PRO,
    { id: 'andresa', name: 'Andresa Martins', sub: 'Grooming' },
    { id: 'erica', name: 'Erica Melo', sub: 'Banhista' },
  ],
  saogoncalo: [
    ANY_PRO,
    { id: 'anderson', name: 'Anderson Correia', sub: 'Grooming' },
    { id: 'carla', name: 'Carla Janaina', sub: 'Banhista' },
  ],
}

function fmtBRL(v: number) { return 'R$ ' + v.toFixed(2).replace('.', ',') }

const MONTHS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

function getNextDates(n: number) {
  const days = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB']
  const today = new Date()
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    return { date: d, day: d.getDate(), month: MONTHS[d.getMonth()], label: days[d.getDay()], disabled: d.getDay() === 0 }
  })
}

type DateEntry = ReturnType<typeof getNextDates>[0]
type PetSize = 'small' | 'medium' | 'large'

const VIP_PRICE = 30

interface GroomingState {
  size: PetSize | null
  package: string | null
  addons: string[]
  professional: string | null
  unit: string | null
  date: DateEntry | null
  time: string | null
  vip: boolean
  petName: string
  petBreed: string
  tutorName: string
  phone: string
  cpf: string
  notes: string
}

const initialState: GroomingState = {
  size: null, package: null, addons: [], professional: null, unit: null,
  date: null, time: null, vip: false, petName: '', petBreed: '', tutorName: '', phone: '', cpf: '', notes: '',
}

function Recap({ data, total, totalDurationMin, previewPro, previewProStatus }: { data: GroomingState; total: number; totalDurationMin: number; previewPro: string | null; previewProStatus: 'idle' | 'loading' | 'found' | 'none' }) {
  const size = GROOMING_SIZES.find(s => s.id === data.size)
  const pkg = GROOMING_PACKAGES.find(p => p.id === data.package)
  const unit = UNITS.find(u => u.id === data.unit)
  const pro = data.unit ? (PROFESSIONALS[data.unit] ?? []).find(p => p.id === data.professional) : null
  const addons = GROOMING_ADDONS.filter(a => data.addons.includes(a.id))

  const proDisplay = () => {
    if (data.vip) return 'A definir'
    if (data.professional !== 'any') return pro?.name || '—'
    if (previewProStatus === 'idle') return '—'
    if (previewProStatus === 'loading') return 'Verificando...'
    if (previewProStatus === 'found' && previewPro) return PRO_NAMES[previewPro] ?? previewPro
    return 'Sem disponibilidade neste horário'
  }

  return (
    <div className="grooming-recap" id="resumo-agendamento">
      <h4>Resumo do agendamento</h4>
      <div className="recap-row"><span className="k">Pet</span><span className={`v ${!data.petName ? 'muted' : ''}`}>{data.petName || '—'}</span></div>
      <div className={`recap-row ${!size ? 'muted' : ''}`}><span className="k">Porte</span><span className="v">{size ? `${size.name} (${size.kg})` : '—'}</span></div>
      <div className={`recap-row ${!pkg ? 'muted' : ''}`}><span className="k">Pacote</span><span className="v">{pkg?.name || '—'}</span></div>
      <div className={`recap-row ${addons.length === 0 ? 'muted' : ''}`}><span className="k">Extras</span><span className="v">{addons.length > 0 ? addons.map(a => a.name).join(', ') : 'Nenhum'}</span></div>
      <div className={`recap-row ${previewProStatus === 'none' ? 'muted' : (!pro && previewProStatus === 'idle' ? 'muted' : '')}`}>
        <span className="k">Profissional</span>
        <span className="v" style={{ display: 'flex', alignItems: 'center', gap: 6, color: previewProStatus === 'none' ? '#dc2626' : undefined }}>
          {proDisplay()}
          {data.professional === 'any' && previewProStatus === 'found' && (
            <span style={{ fontSize: 10, background: '#dcfce7', color: '#16a34a', fontWeight: 700, padding: '2px 6px', borderRadius: 4 }}>auto</span>
          )}
        </span>
      </div>
      <div className={`recap-row ${!unit ? 'muted' : ''}`}><span className="k">Unidade</span><span className="v">{unit?.name || '—'}</span></div>
      <div className={`recap-row ${!data.date ? 'muted' : ''}`}><span className="k">Data & hora</span><span className="v">{data.date ? `${data.date.day}/${((data.date.date.getMonth()) + 1).toString().padStart(2, '0')} às ${data.time || '—'}` : '—'}</span></div>
      {totalDurationMin > 0 && <div className="recap-row"><span className="k">Duração</span><span className="v">~{totalDurationMin} min</span></div>}
      {data.vip && <div className="recap-row"><span className="k">⭐ Encaixe VIP</span><span className="v" style={{ color: '#EF7720', fontWeight: 800 }}>+ R$ {VIP_PRICE},00</span></div>}
      <div className="recap-total">
        <div className="recap-total-label">Total estimado</div>
        <div className="recap-total-value">{fmtBRL(total)}</div>
        <div className="recap-total-sub">Pague agora com cartão ou PIX via Mercado Pago.</div>
      </div>
    </div>
  )
}

const PRO_NAMES: Record<string, string> = {
  victor: 'Victor Lopes', daniele: 'Daniele Santos', eduarda: 'Eduarda', israel: 'Israel',
  vitoria: 'Vitória Duraes', christian: 'Christian Fernandes',
  andresa: 'Andresa Martins', erica: 'Erica Melo',
  anderson: 'Anderson Correia', carla: 'Carla Janaina',
}

export default function GroomingSection() {
  const [step, setStep] = useState(0)
  const [data, setData] = useState<GroomingState>(initialState)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [availableSlots, setAvailableSlots] = useState<string[] | null>(null)
  const [dateOffset, setDateOffset] = useState(0)
  const [previewPro, setPreviewPro] = useState<string | null>(null)
  const [previewProStatus, setPreviewProStatus] = useState<'idle' | 'loading' | 'found' | 'none'>('idle')
  const [slotAvailability, setSlotAvailability] = useState<Record<string, number>>({})
  const allDates = useMemo(() => getNextDates(60), [])
  const dates = allDates.slice(dateOffset, dateOffset + 14)
  const TOTAL = 5

  const update = (patch: Partial<GroomingState>) => setData(d => ({ ...d, ...patch }))
  const toggleAddon = (id: string) => setData(d => ({ ...d, addons: d.addons.includes(id) ? d.addons.filter(x => x !== id) : [...d.addons, id] }))

  useEffect(() => {
    const pkg = sessionStorage.getItem('preselect-package')
    if (pkg) { update({ package: pkg }); sessionStorage.removeItem('preselect-package') }
    const today = allDates[0]
    if (today && !today.disabled) update({ date: today })
  }, [])

  useEffect(() => {
    if (!data.professional || data.professional === 'any' || !data.date) { setAvailableSlots(null); return }
    setAvailableSlots(null)
    const dateStr = data.date.date.toISOString().split('T')[0]
    fetch(`/api/availability?professional=${data.professional}&date=${dateStr}`)
      .then(r => r.json())
      .then(d => setAvailableSlots(Array.isArray(d.slots) ? d.slots : []))
      .catch(() => setAvailableSlots(null))
  }, [data.professional, data.date])

  useEffect(() => {
    if (data.professional !== 'any' || !data.date || !data.unit) {
      setSlotAvailability({})
      return
    }
    const dateStr = data.date.date.toISOString().split('T')[0]
    fetch(`/api/available-slots?unitId=${data.unit}&date=${dateStr}`)
      .then(r => r.json())
      .then(d => {
        const map: Record<string, number> = {}
        for (const s of d.slots ?? []) map[s.time] = s.availableCount
        setSlotAvailability(map)
      })
      .catch(() => setSlotAvailability({}))
  }, [data.professional, data.date, data.unit])

  useEffect(() => {
    if (data.professional !== 'any' || !data.date || !data.time || !data.unit) {
      setPreviewPro(null)
      setPreviewProStatus('idle')
      return
    }
    setPreviewProStatus('loading')
    const dateStr = data.date.date.toISOString().split('T')[0]
    fetch(`/api/auto-assign?unitId=${data.unit}&date=${dateStr}&time=${data.time}`)
      .then(r => r.json())
      .then(d => {
        setPreviewPro(d.professional ?? null)
        setPreviewProStatus(d.professional ? 'found' : 'none')
      })
      .catch(() => { setPreviewPro(null); setPreviewProStatus('none') })
  }, [data.professional, data.date, data.time, data.unit])

  const pkg = GROOMING_PACKAGES.find(p => p.id === data.package)
  const base = pkg && data.size ? pkg.prices[data.size] : 0
  const selectedAddons = GROOMING_ADDONS.filter(a => data.addons.includes(a.id))
  const addonsTotal = selectedAddons.reduce((s, a) => s + a.price, 0)
  const total = base + addonsTotal + (data.vip ? VIP_PRICE : 0)
  const totalDurationMin = (pkg?.durationMin ?? 0) + selectedAddons.reduce((s, a) => s + a.durationMin, 0)
  const slotsNeeded = Math.ceil(totalDurationMin / 30) || 1

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
    if (step === 0) return !!data.package
    if (step === 1) return true
    if (step === 2) return data.professional && data.unit
    if (step === 3) return data.date && data.time
    if (step === 4) return data.petName && data.tutorName && data.phone && data.cpf && data.size && validateCpf(data.cpf)
    return false
  }

  const next = () => {
    if (step < TOTAL) {
      setStep(s => s + 1)
      setTimeout(() => {
        const form = document.querySelector('.grooming-form')
        const el = form || document.getElementById('resumo-agendamento')
        if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 100, behavior: 'smooth' })
      }, 50)
    }
  }
  const back = () => setStep(s => Math.max(0, s - 1))

  const handleConfirm = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceType: 'grooming',
          package: data.package,
          addons: data.addons,
          unitId: data.unit,
          professional: data.professional,
          petName: data.petName,
          petBreed: data.petBreed,
          petSize: data.size,
          tutorName: data.tutorName,
          tutorCpf: data.cpf || null,
          phone: data.phone,
          notes: data.notes,
          date: data.date?.date.toISOString(),
          time: data.time,
          totalPrice: total,
          isVip: data.vip,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Erro ao agendar')
      // Redireciona para o checkout do Mercado Pago
      window.location.href = json.checkoutUrl
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar pagamento')
      setLoading(false)
    }
  }

  return (
    <section className="grooming-section" id="banho-tosa">
      <div className="container">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
          <div>
            <div className="section-eyebrow">Banho & Tosa · agendamento completo</div>
            <h2 style={{ fontSize: 24, fontWeight: 900, margin: '4px 0 0' }}>Seu pet saindo <span className="accent">impecável</span>, do jeito que ele merece.</h2>
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {['Preço transparente', 'Profissional à sua escolha', 'Pague online agora'].map(t => (
              <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: 'var(--ink-soft)' }}>
                <Icon name="check" size={14} /> {t}
              </div>
            ))}
          </div>
        </div>

        <div className="grooming-wrap">
          <div className="grooming-form">
            {step < TOTAL && (
              <>
                <div className="gr-stepper">
                  {[0, 1, 2, 3, 4].map(i => <div key={i} className={`dot ${i === step ? 'active' : i < step ? 'done' : ''}`} />)}
                </div>

                {step === 0 && (
                  <>
                    <div className="gr-title">1. Porte do pet & pacote</div>
                    <div className="gr-sub">O preço varia conforme o porte. Comece selecionando o tamanho do seu pet.</div>
                    <span className="gr-label">Porte</span>
                    <div className="size-grid" style={{ marginBottom: 28 }}>
                      {GROOMING_SIZES.map(s => (
                        <button key={s.id} type="button" className={`size-card ${data.size === s.id ? 'selected' : ''}`} onClick={() => update({ size: s.id as PetSize })} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 10, padding: '8px 12px' }}>
                          <span style={{ fontSize: 22 }}>{s.glyph}</span>
                          <div style={{ textAlign: 'left' }}>
                            <div className="size-name">{s.name}</div>
                            <div className="size-kg">{s.kg}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                    <span className="gr-label">Pacote</span>
                    <div className="pkg-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                      {GROOMING_PACKAGES.map(p => (
                        <button key={p.id} type="button" className={`pkg-card ${data.package === p.id ? 'selected' : ''}`} onClick={() => update({ package: p.id })} disabled={!data.size} style={{ padding: '10px 12px', borderRadius: 10, fontSize: 13 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div className="pkg-radio" />
                            <div className="pkg-name" style={{ fontSize: 14, fontWeight: 800, lineHeight: 1.3, color: 'var(--ink)' }}>
                              <span style={{ color: 'var(--brand)', display: 'inline-flex', alignItems: 'center', verticalAlign: 'middle', marginRight: 5 }}><Icon name={p.icon} size={14} /></span>
                              <span style={{ verticalAlign: 'middle' }}>{p.name}</span>
                              {'badge' in p && p.badge && <span className="pkg-badge" style={{ marginLeft: 5 }}>{p.badge}</span>}
                            </div>
                          </div>
                          <div className="pkg-desc">{p.desc}</div>
                          <div className="pkg-incl">{p.includes.map((inc, i) => <span key={i} className="pkg-incl-item">{inc}</span>)}</div>
                          <div className="pkg-price">
                            <div className="pkg-price-value">{data.size ? fmtBRL(p.prices[data.size as PetSize]) : 'a partir de ' + fmtBRL(p.prices.small)}</div>
                            <div className="pkg-price-label">{data.size ? GROOMING_SIZES.find(s => s.id === data.size)?.name : 'escolha o porte'}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {step === 1 && (
                  <>
                    <div className="gr-title" id="extras-opcionais">2. Extras opcionais</div>
                    <div className="gr-sub">Turbine o atendimento. Você pode adicionar nenhum ou quantos quiser.</div>
                    <div className="addon-grid">
                      {GROOMING_ADDONS.map(a => (
                        <button key={a.id} type="button" className={`addon-card ${data.addons.includes(a.id) ? 'selected' : ''}`} onClick={() => toggleAddon(a.id)}>
                          <div className="addon-check"><Icon name="check" size={14} /></div>
                          <div><div className="addon-name">{a.name}{'badge' in a && a.badge && <span className="pkg-badge" style={{ marginLeft: 6 }}>{a.badge}</span>}</div><div className="addon-sub">{a.sub}</div></div>
                          <div className="addon-price">+ {fmtBRL(a.price)}</div>
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {step === 2 && (
                  <>
                    <div className="gr-title">3. Unidade & profissional</div>
                    <div className="gr-sub">Escolha a unidade e o profissional que vai cuidar do seu pet.</div>
                    <span className="gr-label">Unidade</span>
                    <div className="tile-grid" style={{ marginBottom: 24 }}>
                      {UNITS.map(u => (
                        <button key={u.id} type="button" className={`tile ${data.unit === u.id ? 'selected' : ''}`} onClick={() => update({ unit: u.id, professional: null })}>
                          <div className="tile-icon"><Icon name="pin" size={18} /></div>
                          <div><div className="tile-title">{u.name}</div><div className="tile-sub">{u.sub}</div></div>
                        </button>
                      ))}
                    </div>
                    <span className="gr-label">Profissional</span>
                    {data.unit ? (
                      <div className="pro-grid">
                        {(PROFESSIONALS[data.unit] ?? []).map(p => (
                          <button key={p.id} type="button" className={`pro-card ${data.professional === p.id ? 'selected' : ''}`} onClick={() => update({ professional: p.id })}>
                            <div className="pro-avatar">{p.id === 'any' ? <Icon name="users" size={20} /> : p.name.split(' ').map(w => w[0]).slice(0, 2).join('')}</div>
                            <div className="pro-meta"><div className="pro-name">{p.name}</div><div className="pro-sub">{p.sub}</div></div>
                            <div className="pro-check"><Icon name="check" size={14} /></div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 8 }}>Selecione uma unidade para ver os profissionais disponíveis.</p>
                    )}
                  </>
                )}

                {step === 3 && (
                  <>
                    <div className="gr-title">4. Data & horário</div>
                    <div className="gr-sub">Escolha o melhor dia e horário para o seu pet.</div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span className="gr-label" style={{ margin: 0 }}>
                        Data
                        {dates.length > 0 && <span style={{ fontWeight: 500, color: 'var(--muted)', marginLeft: 8, textTransform: 'none', letterSpacing: 0, fontSize: 12 }}>
                          {dates[0].month}{dates[dates.length - 1].month !== dates[0].month ? ` — ${dates[dates.length - 1].month}` : ''}
                        </span>}
                      </span>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button type="button" onClick={() => setDateOffset(o => Math.max(0, o - 14))} disabled={dateOffset === 0} style={{ padding: '4px 10px', borderRadius: 8, border: '1.5px solid #e5e7eb', background: '#fff', cursor: dateOffset === 0 ? 'not-allowed' : 'pointer', opacity: dateOffset === 0 ? 0.4 : 1, fontSize: 15 }}>‹</button>
                        <button type="button" onClick={() => setDateOffset(o => Math.min(46, o + 14))} disabled={dateOffset >= 46} style={{ padding: '4px 10px', borderRadius: 8, border: '1.5px solid #e5e7eb', background: '#fff', cursor: dateOffset >= 46 ? 'not-allowed' : 'pointer', opacity: dateOffset >= 46 ? 0.4 : 1, fontSize: 15 }}>›</button>
                      </div>
                    </div>
                    <div className="date-grid" style={{ marginBottom: 24 }}>
                      {dates.map((d, i) => (
                        <button key={i} type="button" className={`date-cell ${data.date?.day === d.day && data.date?.month === d.month ? 'selected' : ''}`} disabled={d.disabled} onClick={() => update({ date: d, time: null })}>
                          <div className="date-cell-day">{d.label}</div>
                          {d.day}
                          <div style={{ fontSize: 9, opacity: 0.7, marginTop: 1 }}>{d.month}</div>
                        </button>
                      ))}
                    </div>
                    <span className="gr-label">
                      Horário disponível
                      {totalDurationMin > 0 && <span style={{ fontWeight: 500, color: 'var(--muted)', marginLeft: 8, textTransform: 'none', letterSpacing: 0 }}>· duração estimada: {totalDurationMin} min</span>}
                    </span>
                    {data.date && availableSlots === null && (
                      <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 10 }}>Nenhum horário cadastrado para este dia. Todos os horários estão disponíveis.</p>
                    )}
                    {!data.vip && (
                      <div className="time-grid">
                        {GROOMING_TIMES.map((t, idx) => {
                          const isToday = data.date ? data.date.date.toDateString() === new Date().toDateString() : false
                          const isPast = isToday && (() => {
                            const now = new Date()
                            const [h, m] = t.split(':').map(Number)
                            return h * 60 + m <= now.getHours() * 60 + now.getMinutes()
                          })()
                          const hasConsecutive = (() => {
                            const slots = data.professional === 'any' ? GROOMING_TIMES : (availableSlots ?? GROOMING_TIMES)
                            for (let i = 0; i < slotsNeeded; i++) {
                              if (!slots.includes(GROOMING_TIMES[idx + i] ?? '')) return false
                            }
                            return true
                          })()
                          const noProAvailable = data.professional === 'any' && Object.keys(slotAvailability).length > 0 && (() => {
                            for (let i = 0; i < slotsNeeded; i++) {
                              const s = GROOMING_TIMES[idx + i]
                              if (!s || (slotAvailability[s] ?? 0) === 0) return true
                            }
                            return false
                          })()
                          const disabled = !data.date || isPast || !hasConsecutive || noProAvailable
                          return <button key={t} type="button" className={`time-slot ${data.time === t ? 'selected' : ''}`} disabled={disabled} onClick={() => update({ time: t })} title={noProAvailable ? 'Sem profissional disponível' : isPast ? 'Horário já passou' : ''}>{t}</button>
                        })}
                      </div>
                    )}

                    {data.vip && (
                      <div className="time-grid">
                        {GROOMING_TIMES.map(t => (
                          <button key={t} type="button" className={`time-slot ${data.time === t ? 'selected' : ''}`} disabled={!data.date} onClick={() => update({ time: t })}>{t}</button>
                        ))}
                      </div>
                    )}

                    {/* Encaixe VIP */}
                    {data.date && (
                      <button
                        type="button"
                        onClick={() => update({ vip: !data.vip, time: null })}
                        style={{
                          marginTop: 16, width: '100%', padding: '14px 16px', borderRadius: 12,
                          border: `2px solid ${data.vip ? '#EF7720' : '#e5e7eb'}`,
                          background: data.vip ? '#FEF1E4' : '#fff',
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          cursor: 'pointer', transition: 'all .15s',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left' }}>
                          <span style={{ fontSize: 22 }}>⭐</span>
                          <div>
                            <div style={{ fontWeight: 800, fontSize: 14, color: '#EF7720' }}>Encaixe VIP</div>
                            <div style={{ fontSize: 12, color: '#888' }}>Sem horário disponível? Garantimos seu atendimento com prioridade.</div>
                          </div>
                        </div>
                        <div style={{ fontWeight: 900, fontSize: 14, color: '#EF7720', whiteSpace: 'nowrap', marginLeft: 10 }}>+ R$ {VIP_PRICE},00</div>
                      </button>
                    )}
                  </>
                )}

                {step === 4 && (
                  <>
                    <div className="gr-title">5. Dados para confirmação</div>
                    <div className="gr-sub">Após confirmar, você será redirecionado para o pagamento.</div>
                    <div className="form-row two">
                      <div>
                        <div className="label" style={{ marginBottom: 6 }}>Nome do pet *</div>
                        <input className="input" placeholder="Ex: Mel" value={data.petName} onChange={e => update({ petName: e.target.value })} />
                      </div>
                      <div>
                        <div className="label" style={{ marginBottom: 6 }}>Raça</div>
                        <input className="input" placeholder="Ex: Shih Tzu" value={data.petBreed} onChange={e => update({ petBreed: e.target.value })} />
                      </div>
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
                    <div className="form-row">
                      <div className="label" style={{ marginBottom: 6 }}>CPF *</div>
                      <input className="input" placeholder="000.000.000-00" value={data.cpf} inputMode="numeric" onChange={e => update({ cpf: e.target.value.replace(/\D/g, '') })} style={{ borderColor: data.cpf && !validateCpf(data.cpf) ? '#dc2626' : undefined }} />
                      {data.cpf && !validateCpf(data.cpf) && <div style={{ fontSize: 12, color: '#dc2626', marginTop: 4 }}>CPF inválido</div>}
                    </div>
                    <div className="form-row">
                      <div className="label" style={{ marginBottom: 6 }}>Observações (alergias, comportamento, preferências)</div>
                      <textarea className="textarea" value={data.notes} onChange={e => update({ notes: e.target.value })} />
                    </div>
                    {error && <p style={{ color: 'red', fontSize: 14, marginTop: 8 }}>{error}</p>}
                  </>
                )}

                <div className="gr-actions">
                  {step > 0 ? (
                    <button className="btn-gr-back" onClick={back}><Icon name="arrow-left" size={14} /> Voltar</button>
                  ) : <span />}
                  {step < TOTAL - 1 ? (
                    <button className="btn-gr-next" onClick={next} disabled={!canNext()}>Continuar <Icon name="arrow-right" size={14} /></button>
                  ) : (
                    <button className="btn-gr-next" onClick={handleConfirm} disabled={!canNext() || loading}>
                      {loading ? 'Aguarde...' : <><Icon name="check" size={14} /> Pagar {fmtBRL(total)}</>}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>

          <Recap data={data} total={total} totalDurationMin={totalDurationMin} previewPro={previewPro} previewProStatus={previewProStatus} />
        </div>
      </div>
    </section>
  )
}
