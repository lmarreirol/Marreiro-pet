'use client'
import { useMemo, useState } from 'react'
import Icon from '@/components/ui/Icon'

const GROOMING_SIZES = [
  { id: 'small', name: 'Pequeno', kg: 'até 10kg', glyph: '🐕' },
  { id: 'medium', name: 'Médio', kg: '10 a 20kg', glyph: '🐕‍🦺' },
  { id: 'large', name: 'Grande', kg: 'acima de 20kg', glyph: '🦮' },
]

const GROOMING_PACKAGES = [
  {
    id: 'banho', name: 'Banho Tradicional',
    desc: 'Banho com produtos específicos, secagem, escovação e perfume.',
    includes: ['Banho', 'Secagem', 'Escovação', 'Perfume', 'Laço/gravata'],
    prices: { small: 55, medium: 75, large: 95 },
  },
  {
    id: 'banho-tosa', name: 'Banho + Tosa Higiênica', badge: 'Popular',
    desc: 'Banho completo com tosa higiênica nas patas, barriga e região íntima.',
    includes: ['Banho completo', 'Tosa higiênica', 'Corte de unhas', 'Limpeza de ouvidos'],
    prices: { small: 75, medium: 95, large: 125 },
  },
  {
    id: 'spa', name: 'Tosa Completa + Spa',
    desc: 'Experiência completa: tosa na tesoura ou máquina + tratamento spa com hidratação profunda.',
    includes: ['Tosa na tesoura', 'Hidratação spa', 'Escovação', 'Corte de unhas', 'Perfume premium'],
    prices: { small: 120, medium: 150, large: 180 },
  },
]

const GROOMING_ADDONS = [
  { id: 'hidra', name: 'Hidratação de pelos', sub: 'Máscara profissional', price: 25 },
  { id: 'ozonio', name: 'Banho de ozônio', sub: 'Terapêutico, alivia coceira', price: 35 },
  { id: 'dentes', name: 'Escovação de dentes', sub: 'Hálito fresco', price: 15 },
  { id: 'unhas', name: 'Corte de unhas extra', sub: 'Quando não inclui', price: 12 },
  { id: 'perfume', name: 'Perfume premium', sub: 'Perfumaria pet importada', price: 18 },
  { id: 'coloracao', name: 'Coloração criativa', sub: 'Tinta pet-safe', price: 45 },
]

const GROOMING_TIMES = ['08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00']

const UNITS = [
  { id: 'caucaia', name: 'Caucaia', sub: 'Parque Guadalajara' },
  { id: 'pecem', name: 'Pecém', sub: 'São Gonçalo do Amarante' },
  { id: 'saogoncalo', name: 'São Gonçalo', sub: 'Centro' },
  { id: 'taiba', name: 'Taíba', sub: 'São Gonçalo do Amarante' },
]

const PROFESSIONALS = [
  { id: 'vitor', name: 'Vitor Fernandes', sub: 'Tosador especialista' },
  { id: 'daniele', name: 'Daniele Mendes', sub: 'Banhista & tosadora' },
  { id: 'any', name: 'Sem preferência', sub: 'Próximo profissional disponível' },
]

function fmtBRL(v: number) { return 'R$ ' + v.toFixed(2).replace('.', ',') }

function getNextDates(n: number) {
  const days = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB']
  const today = new Date()
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() + i + 1)
    return { date: d, day: d.getDate(), label: days[d.getDay()], disabled: d.getDay() === 0 }
  })
}

type DateEntry = ReturnType<typeof getNextDates>[0]
type PetSize = 'small' | 'medium' | 'large'

interface GroomingState {
  size: PetSize | null
  package: string | null
  addons: string[]
  professional: string | null
  unit: string | null
  date: DateEntry | null
  time: string | null
  petName: string
  petBreed: string
  tutorName: string
  phone: string
  notes: string
}

const initialState: GroomingState = {
  size: null, package: null, addons: [], professional: null, unit: null,
  date: null, time: null, petName: '', petBreed: '', tutorName: '', phone: '', notes: '',
}

function Recap({ data, total }: { data: GroomingState; total: number }) {
  const size = GROOMING_SIZES.find(s => s.id === data.size)
  const pkg = GROOMING_PACKAGES.find(p => p.id === data.package)
  const unit = UNITS.find(u => u.id === data.unit)
  const pro = PROFESSIONALS.find(p => p.id === data.professional)
  const addons = GROOMING_ADDONS.filter(a => data.addons.includes(a.id))
  return (
    <div className="grooming-recap">
      <h4>Resumo do agendamento</h4>
      <div className="recap-row"><span className="k">Pet</span><span className={`v ${!data.petName ? 'muted' : ''}`}>{data.petName || '—'}</span></div>
      <div className={`recap-row ${!size ? 'muted' : ''}`}><span className="k">Porte</span><span className="v">{size ? `${size.name} (${size.kg})` : '—'}</span></div>
      <div className={`recap-row ${!pkg ? 'muted' : ''}`}><span className="k">Pacote</span><span className="v">{pkg?.name || '—'}</span></div>
      <div className={`recap-row ${addons.length === 0 ? 'muted' : ''}`}><span className="k">Extras</span><span className="v">{addons.length > 0 ? addons.map(a => a.name).join(', ') : 'Nenhum'}</span></div>
      <div className={`recap-row ${!pro ? 'muted' : ''}`}><span className="k">Profissional</span><span className="v">{pro?.name || '—'}</span></div>
      <div className={`recap-row ${!unit ? 'muted' : ''}`}><span className="k">Unidade</span><span className="v">{unit?.name || '—'}</span></div>
      <div className={`recap-row ${!data.date ? 'muted' : ''}`}><span className="k">Data & hora</span><span className="v">{data.date ? `${data.date.day}/${((data.date.date.getMonth()) + 1).toString().padStart(2, '0')} às ${data.time || '—'}` : '—'}</span></div>
      <div className="recap-total">
        <div className="recap-total-label">Total estimado</div>
        <div className="recap-total-value">{fmtBRL(total)}</div>
        <div className="recap-total-sub">Pague agora com cartão ou PIX via Mercado Pago.</div>
      </div>
    </div>
  )
}

export default function GroomingSection() {
  const [step, setStep] = useState(0)
  const [data, setData] = useState<GroomingState>(initialState)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const dates = useMemo(() => getNextDates(14), [])
  const TOTAL = 5

  const update = (patch: Partial<GroomingState>) => setData(d => ({ ...d, ...patch }))
  const toggleAddon = (id: string) => setData(d => ({ ...d, addons: d.addons.includes(id) ? d.addons.filter(x => x !== id) : [...d.addons, id] }))

  const pkg = GROOMING_PACKAGES.find(p => p.id === data.package)
  const base = pkg && data.size ? pkg.prices[data.size] : 0
  const addonsTotal = GROOMING_ADDONS.filter(a => data.addons.includes(a.id)).reduce((s, a) => s + a.price, 0)
  const total = base + addonsTotal

  const canNext = () => {
    if (step === 0) return data.size && data.package
    if (step === 1) return true
    if (step === 2) return data.professional && data.unit
    if (step === 3) return data.date && data.time
    if (step === 4) return data.petName && data.tutorName && data.phone
    return false
  }

  const next = () => { if (step < TOTAL) setStep(s => s + 1) }
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
          phone: data.phone,
          notes: data.notes,
          date: data.date?.date.toISOString(),
          time: data.time,
          totalPrice: total,
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
        <div className="grooming-hero">
          <div>
            <div className="section-eyebrow">Banho & Tosa · agendamento completo</div>
            <h2>Seu pet saindo <span className="accent">impecável</span>,<br />do jeito que ele merece.</h2>
            <p style={{ fontSize: 17, color: 'var(--ink-soft)', marginTop: 18, lineHeight: 1.6 }}>
              Monte o atendimento ideal: escolha o pacote, adicione os extras, selecione seu profissional favorito e pague na hora — sem surpresas.
            </p>
            <div style={{ display: 'flex', gap: 24, marginTop: 24, flexWrap: 'wrap' }}>
              {['Preço transparente', 'Profissional à sua escolha', 'Pague online agora'].map(t => (
                <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, fontWeight: 700 }}>
                  <Icon name="check" size={16} /> {t}
                </div>
              ))}
            </div>
          </div>
          <div className="grooming-hero-visual">
            <span className="grooming-hero-visual-label">[ foto banho & tosa Marreiro Pet ]</span>
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
                        <button key={s.id} type="button" className={`size-card ${data.size === s.id ? 'selected' : ''}`} onClick={() => update({ size: s.id as PetSize })}>
                          <div className="size-glyph">{s.glyph}</div>
                          <div className="size-name">{s.name}</div>
                          <div className="size-kg">{s.kg}</div>
                        </button>
                      ))}
                    </div>
                    <span className="gr-label">Pacote</span>
                    <div className="pkg-grid">
                      {GROOMING_PACKAGES.map(p => (
                        <button key={p.id} type="button" className={`pkg-card ${data.package === p.id ? 'selected' : ''}`} onClick={() => update({ package: p.id })} disabled={!data.size}>
                          <div className="pkg-radio" />
                          <div className="pkg-body">
                            <div className="pkg-name">{p.name}{'badge' in p && p.badge && <span className="pkg-badge">{p.badge}</span>}</div>
                            <div className="pkg-desc">{p.desc}</div>
                            <div className="pkg-incl">{p.includes.map((inc, i) => <span key={i} className="pkg-incl-item">{inc}</span>)}</div>
                          </div>
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
                    <div className="gr-title">2. Extras opcionais</div>
                    <div className="gr-sub">Turbine o atendimento. Você pode adicionar nenhum ou quantos quiser.</div>
                    <div className="addon-grid">
                      {GROOMING_ADDONS.map(a => (
                        <button key={a.id} type="button" className={`addon-card ${data.addons.includes(a.id) ? 'selected' : ''}`} onClick={() => toggleAddon(a.id)}>
                          <div className="addon-check"><Icon name="check" size={14} /></div>
                          <div><div className="addon-name">{a.name}</div><div className="addon-sub">{a.sub}</div></div>
                          <div className="addon-price">+ {fmtBRL(a.price)}</div>
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {step === 2 && (
                  <>
                    <div className="gr-title">3. Profissional & unidade</div>
                    <div className="gr-sub">Quem vai cuidar do seu pet e em qual unidade.</div>
                    <span className="gr-label">Profissional</span>
                    <div className="pro-grid" style={{ marginBottom: 24 }}>
                      {PROFESSIONALS.map(p => (
                        <button key={p.id} type="button" className={`pro-card ${data.professional === p.id ? 'selected' : ''}`} onClick={() => update({ professional: p.id })}>
                          <div className="pro-avatar">{p.id === 'any' ? <Icon name="users" size={20} /> : p.name.split(' ').map(w => w[0]).slice(0, 2).join('')}</div>
                          <div className="pro-meta"><div className="pro-name">{p.name}</div><div className="pro-sub">{p.sub}</div></div>
                          <div className="pro-check"><Icon name="check" size={14} /></div>
                        </button>
                      ))}
                    </div>
                    <span className="gr-label">Unidade</span>
                    <div className="tile-grid">
                      {UNITS.map(u => (
                        <button key={u.id} type="button" className={`tile ${data.unit === u.id ? 'selected' : ''}`} onClick={() => update({ unit: u.id })}>
                          <div className="tile-icon"><Icon name="pin" size={18} /></div>
                          <div><div className="tile-title">{u.name}</div><div className="tile-sub">{u.sub}</div></div>
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {step === 3 && (
                  <>
                    <div className="gr-title">4. Data & horário</div>
                    <div className="gr-sub">Escolha o melhor dia e horário para o seu pet.</div>
                    <span className="gr-label">Data</span>
                    <div className="date-grid" style={{ marginBottom: 24 }}>
                      {dates.map((d, i) => (
                        <button key={i} type="button" className={`date-cell ${data.date?.day === d.day ? 'selected' : ''}`} disabled={d.disabled} onClick={() => update({ date: d })}>
                          <div className="date-cell-day">{d.label}</div>{d.day}
                        </button>
                      ))}
                    </div>
                    <span className="gr-label">Horário disponível</span>
                    <div className="time-grid">
                      {GROOMING_TIMES.map(t => {
                        const disabled = !data.date || (t === '13:00' && (data.date?.day ?? 0) % 3 === 0)
                        return <button key={t} type="button" className={`time-slot ${data.time === t ? 'selected' : ''}`} disabled={disabled} onClick={() => update({ time: t })}>{t}</button>
                      })}
                    </div>
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
                        <input className="input" placeholder="(85) 9 9999-9999" value={data.phone} onChange={e => update({ phone: e.target.value })} />
                      </div>
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

          <Recap data={data} total={total} />
        </div>
      </div>
    </section>
  )
}
