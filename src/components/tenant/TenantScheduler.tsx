'use client'
import { useState } from 'react'
import type { TenantWithDetails } from '@/lib/tenant'

const SERVICES_CONFIG = [
  { id: 'vet',   name: 'Consulta Veterinária', icon: '🩺', requires: 'vet' },
  { id: 'banho', name: 'Banho & Tosa',         icon: '🛁', requires: 'grooming' },
  { id: 'vacina',name: 'Vacinação',             icon: '💉', requires: 'vet' },
  { id: 'exames',name: 'Exames',               icon: '🔬', requires: 'vet' },
]

const VET_SUBS = [
  { id: 'clinico-geral', name: 'Clínico Geral',   price: 80,  label: 'R$ 80,00' },
  { id: 'retorno',       name: 'Retorno',          price: 0,   label: 'Gratuito' },
  { id: 'plantao',       name: 'Plantão (19h–07h)',price: 120, label: 'R$ 120,00' },
]

function getNextDates(n: number) {
  const days = ['DOM','SEG','TER','QUA','QUI','SEX','SAB']
  const today = new Date()
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    return { date: d, day: d.getDate(), label: i === 0 ? 'HOJE' : days[d.getDay()] }
  })
}

const CLINICO_TIMES = (() => {
  const blocked = new Set(['12:00','12:30'])
  const slots: string[] = []
  for (let h = 7; h <= 18; h++) {
    const hh = String(h).padStart(2,'0')
    if (!blocked.has(`${hh}:00`)) slots.push(`${hh}:00`)
    if (!blocked.has(`${hh}:30`)) slots.push(`${hh}:30`)
  }
  return slots
})()

const TIMES = ['08:00','09:00','10:00','11:00','14:00','15:00','16:00','17:00']

export default function TenantScheduler({ tenant }: { tenant: TenantWithDetails }) {
  const enabledServices = SERVICES_CONFIG.filter(s =>
    tenant.services.some(ts => ts.serviceType === s.requires && ts.enabled)
  )
  const units = tenant.units

  const [step, setStep] = useState(0)
  const [service, setService] = useState<string | null>(null)
  const [vetSub, setVetSub] = useState<string | null>(null)
  const [unitKey, setUnitKey] = useState<string | null>(null)
  const [date, setDate] = useState<ReturnType<typeof getNextDates>[0] | null>(null)
  const [time, setTime] = useState<string | null>(null)
  const [tutorName, setTutorName] = useState('')
  const [phone, setPhone] = useState('')
  const [petName, setPetName] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const dates = getNextDates(14)
  const activeTimes = vetSub === 'clinico-geral' ? CLINICO_TIMES : TIMES

  const isToday = (d: typeof date) => d?.date.toDateString() === new Date().toDateString()

  const canNext = () => {
    if (step === 0) return !!(service && unitKey)
    if (step === 1) return !!(date && time)
    if (step === 2) return !!(tutorName && phone && petName)
    return false
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: tenant.id,
          serviceType: service,
          package: vetSub ?? null,
          unitId: unitKey,
          petName,
          tutorName,
          phone,
          notes: notes || null,
          date: date?.date.toISOString(),
          time,
          totalPrice: VET_SUBS.find(s => s.id === vetSub)?.price ?? 0,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Erro ao agendar')
      setSubmitted(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    const unit = units.find(u => u.unitKey === unitKey)
    const svc = SERVICES_CONFIG.find(s => s.id === service)
    const dateStr = date
      ? `${String(date.day).padStart(2,'0')}/${String(date.date.getMonth()+1).padStart(2,'0')}/${date.date.getFullYear()}`
      : ''
    return (
      <div style={{ background: 'white', borderRadius: 16, padding: '2rem', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
        <h3 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 8 }}>Solicitação recebida!</h3>
        <p style={{ color: '#6b7280', marginBottom: 20 }}>
          Olá <strong>{tutorName}</strong>! Entraremos em contato via WhatsApp para confirmar o agendamento de <strong>{petName}</strong>.
        </p>
        <div style={{ background: '#f9fafb', borderRadius: 10, padding: '1rem', textAlign: 'left', fontSize: '0.9rem', marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #e5e7eb' }}>
            <span style={{ color: '#6b7280' }}>Serviço</span><span style={{ fontWeight: 600 }}>{svc?.name}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #e5e7eb' }}>
            <span style={{ color: '#6b7280' }}>Unidade</span><span style={{ fontWeight: 600 }}>{unit?.name}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
            <span style={{ color: '#6b7280' }}>Data & horário</span><span style={{ fontWeight: 600 }}>{dateStr} às {time}</span>
          </div>
        </div>
        <button onClick={() => { setSubmitted(false); setStep(0); setService(null); setVetSub(null); setUnitKey(null); setDate(null); setTime(null); setTutorName(''); setPhone(''); setPetName(''); setNotes('') }}
          style={{ background: tenant.primaryColor, color: 'white', border: 'none', borderRadius: 8, padding: '10px 24px', fontWeight: 600, cursor: 'pointer' }}>
          Fazer novo agendamento
        </button>
      </div>
    )
  }

  return (
    <div id="agendamento" style={{ background: 'white', borderRadius: 16, padding: '2rem', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
      {/* Stepper */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 28, justifyContent: 'center' }}>
        {['Serviço', 'Horário', 'Dados'].map((label, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.8rem', fontWeight: 700,
              background: i === step ? tenant.primaryColor : i < step ? '#d1fae5' : '#f3f4f6',
              color: i === step ? 'white' : i < step ? '#059669' : '#6b7280',
            }}>
              {i < step ? '✓' : i + 1}
            </div>
            <span style={{ fontSize: '0.8rem', color: i === step ? tenant.primaryColor : '#9ca3af', fontWeight: i === step ? 600 : 400 }}>{label}</span>
            {i < 2 && <div style={{ width: 24, height: 1, background: '#e5e7eb' }} />}
          </div>
        ))}
      </div>

      {step === 0 && (
        <>
          <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Qual serviço você precisa?</h3>
          <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', marginBottom: 24 }}>
            {enabledServices.map(s => (
              <button key={s.id} onClick={() => { setService(s.id); setVetSub(null) }}
                style={{
                  padding: '14px 16px', borderRadius: 10, border: `2px solid ${service === s.id ? tenant.primaryColor : '#e5e7eb'}`,
                  background: service === s.id ? `${tenant.primaryColor}10` : 'white',
                  cursor: 'pointer', textAlign: 'left', display: 'flex', gap: 12, alignItems: 'center',
                }}>
                <span style={{ fontSize: 24 }}>{s.icon}</span>
                <span style={{ fontWeight: 600, color: service === s.id ? tenant.primaryColor : '#111827' }}>{s.name}</span>
              </button>
            ))}
          </div>

          {service === 'vet' && (
            <>
              <h3 style={{ fontWeight: 700, marginBottom: 12, fontSize: '1rem' }}>Tipo de consulta</h3>
              <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', marginBottom: 24 }}>
                {VET_SUBS.map(s => (
                  <button key={s.id} onClick={() => setVetSub(s.id)}
                    style={{ padding: '12px 14px', borderRadius: 10, border: `2px solid ${vetSub === s.id ? tenant.primaryColor : '#e5e7eb'}`, background: vetSub === s.id ? `${tenant.primaryColor}10` : 'white', cursor: 'pointer', textAlign: 'left' }}>
                    <div style={{ fontWeight: 600, color: vetSub === s.id ? tenant.primaryColor : '#111827', marginBottom: 4 }}>{s.name}</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: vetSub === s.id ? tenant.primaryColor : '#f97316' }}>{s.label}</div>
                  </button>
                ))}
              </div>
            </>
          )}

          {units.length > 0 && (
            <>
              <h3 style={{ fontWeight: 700, marginBottom: 12, fontSize: '1rem' }}>Em qual unidade?</h3>
              <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
                {units.map(u => (
                  <button key={u.unitKey} onClick={() => setUnitKey(u.unitKey)}
                    style={{ padding: '12px 14px', borderRadius: 10, border: `2px solid ${unitKey === u.unitKey ? tenant.primaryColor : '#e5e7eb'}`, background: unitKey === u.unitKey ? `${tenant.primaryColor}10` : 'white', cursor: 'pointer', textAlign: 'left' }}>
                    <div style={{ fontWeight: 600, color: unitKey === u.unitKey ? tenant.primaryColor : '#111827' }}>📍 {u.name}</div>
                    {u.city && <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: 2 }}>{u.city}</div>}
                  </button>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {step === 1 && (
        <>
          <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Quando fica bom?</h3>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: 16 }}>Data</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
            {dates.map((d, i) => {
              const isSunday = d.date.getDay() === 0
              return (
                <button key={i} onClick={() => { setDate(d); setTime(null) }} disabled={isSunday}
                  style={{
                    padding: '10px 14px', borderRadius: 10, border: `2px solid ${date?.day === d.day ? tenant.primaryColor : '#e5e7eb'}`,
                    background: date?.day === d.day ? `${tenant.primaryColor}10` : 'white',
                    cursor: isSunday ? 'not-allowed' : 'pointer', opacity: isSunday ? 0.4 : 1,
                    textAlign: 'center', minWidth: 52,
                  }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 600, color: date?.day === d.day ? tenant.primaryColor : '#6b7280' }}>{d.label}</div>
                  <div style={{ fontWeight: 700, color: date?.day === d.day ? tenant.primaryColor : '#111827' }}>{d.day}</div>
                </button>
              )
            })}
          </div>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: 12 }}>Horário</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {activeTimes.map(t => {
              const todaySelected = isToday(date)
              const pastNow = todaySelected && (() => {
                const now = new Date()
                const [h, m] = t.split(':').map(Number)
                return h * 60 + m <= now.getHours() * 60 + now.getMinutes()
              })()
              const disabled = !date || pastNow
              return (
                <button key={t} onClick={() => !disabled && setTime(t)} disabled={disabled}
                  style={{
                    padding: '8px 14px', borderRadius: 8,
                    border: `2px solid ${time === t ? tenant.primaryColor : '#e5e7eb'}`,
                    background: time === t ? `${tenant.primaryColor}10` : disabled ? '#f9fafb' : 'white',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    color: time === t ? tenant.primaryColor : disabled ? '#9ca3af' : '#374151',
                    fontWeight: time === t ? 700 : 500,
                    fontSize: '0.875rem',
                  }}>
                  {t}
                </button>
              )
            })}
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Seus dados</h3>
          <div style={{ display: 'grid', gap: 14 }}>
            {[
              { label: 'Seu nome *', value: tutorName, onChange: setTutorName, placeholder: 'Ex: Ana Silva' },
              { label: 'WhatsApp *', value: phone, onChange: (v: string) => setPhone(v.replace(/\D/g,'')), placeholder: '(85) 9 9999-9999' },
              { label: 'Nome do pet *', value: petName, onChange: setPetName, placeholder: 'Ex: Mel' },
            ].map(f => (
              <div key={f.label}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>{f.label}</label>
                <input value={f.value} onChange={e => f.onChange(e.target.value)} placeholder={f.placeholder}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #d1d5db', fontSize: '0.9rem', boxSizing: 'border-box', outline: 'none' }} />
              </div>
            ))}
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Observações</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Alergias, medicamentos, comportamento..."
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #d1d5db', fontSize: '0.9rem', boxSizing: 'border-box', resize: 'vertical', minHeight: 80, outline: 'none' }} />
            </div>
          </div>
          {error && <p style={{ color: '#dc2626', fontSize: '0.85rem', marginTop: 8 }}>{error}</p>}
        </>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24, paddingTop: 20, borderTop: '1px solid #f3f4f6' }}>
        {step > 0 ? (
          <button onClick={() => setStep(s => s - 1)}
            style={{ background: 'none', border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontWeight: 600, color: '#374151' }}>
            ← Voltar
          </button>
        ) : <span />}
        {step < 2 ? (
          <button onClick={() => setStep(s => s + 1)} disabled={!canNext()}
            style={{ background: canNext() ? tenant.primaryColor : '#d1d5db', color: 'white', border: 'none', borderRadius: 8, padding: '10px 24px', cursor: canNext() ? 'pointer' : 'not-allowed', fontWeight: 700 }}>
            Continuar →
          </button>
        ) : (
          <button onClick={handleSubmit} disabled={!canNext() || loading}
            style={{ background: canNext() && !loading ? tenant.primaryColor : '#d1d5db', color: 'white', border: 'none', borderRadius: 8, padding: '10px 24px', cursor: canNext() && !loading ? 'pointer' : 'not-allowed', fontWeight: 700 }}>
            {loading ? 'Aguarde...' : '✓ Confirmar agendamento'}
          </button>
        )}
      </div>
    </div>
  )
}
