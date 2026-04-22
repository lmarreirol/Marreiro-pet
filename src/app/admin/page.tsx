'use client'
import { useEffect, useState } from 'react'

const UNITS = [
  { id: 'caucaia', name: 'Caucaia' },
  { id: 'pecem', name: 'Pecém' },
  { id: 'saogoncalo', name: 'São Gonçalo' },
  { id: 'taiba', name: 'Taíba' },
]

const PROFESSIONALS: Record<string, { id: string; name: string }[]> = {
  caucaia: [
    { id: 'victor', name: 'Victor Lopes' },
    { id: 'daniele', name: 'Daniele Santos' },
    { id: 'eduarda', name: 'Eduarda' },
    { id: 'israel', name: 'Israel' },
  ],
  pecem: [
    { id: 'vitoria', name: 'Vitória Duraes' },
    { id: 'christian', name: 'Christian Fernandes' },
  ],
  taiba: [
    { id: 'andresa', name: 'Andresa Martins' },
    { id: 'erica', name: 'Erica Melo' },
  ],
  saogoncalo: [
    { id: 'anderson', name: 'Anderson Correia' },
    { id: 'carla', name: 'Carla Janaina' },
  ],
}

const ALL_SLOTS = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30']

function todayISO() {
  return new Date().toISOString().split('T')[0]
}

export default function AdminPage() {
  const [key, setKey] = useState('')
  const [authed, setAuthed] = useState(false)
  const [authError, setAuthError] = useState(false)

  const [unitId, setUnitId] = useState('caucaia')
  const [professional, setProfessional] = useState(PROFESSIONALS['caucaia'][0].id)
  const [date, setDate] = useState(todayISO())
  const [slots, setSlots] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const professionals = PROFESSIONALS[unitId] ?? []

  useEffect(() => {
    setProfessional(professionals[0]?.id ?? '')
    setSlots([])
  }, [unitId])

  useEffect(() => {
    if (!authed || !professional || !date) return
    setSlots([])
    fetch(`/api/availability?professional=${professional}&date=${date}`)
      .then(r => r.json())
      .then(d => setSlots(d.slots ?? []))
  }, [authed, professional, date])

  const toggleSlot = (s: string) =>
    setSlots(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])

  const save = async () => {
    setSaving(true)
    setSaved(false)
    await fetch('/api/availability', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-key': key },
      body: JSON.stringify({ professional, unitId, date, slots }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (!authed) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' }}>
        <div style={{ background: '#fff', borderRadius: 16, padding: 40, boxShadow: '0 4px 24px rgba(0,0,0,0.1)', width: 340 }}>
          <div style={{ fontWeight: 900, fontSize: 22, marginBottom: 8 }}>🐾 Painel Admin</div>
          <div style={{ color: '#666', fontSize: 14, marginBottom: 24 }}>Marreiro Pet — Gestão de Disponibilidade</div>
          <input
            type="password"
            placeholder="Senha de acesso"
            value={key}
            onChange={e => setKey(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && setAuthed(true)}
            style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #ddd', fontSize: 15, marginBottom: 12, boxSizing: 'border-box' }}
          />
          {authError && <div style={{ color: 'red', fontSize: 13, marginBottom: 8 }}>Senha incorreta.</div>}
          <button
            onClick={async () => {
              const res = await fetch('/api/availability?professional=test&date=2099-01-01', { headers: { 'x-admin-key': key } })
              if (key.length > 3) { setAuthed(true); setAuthError(false) }
              else setAuthError(true)
            }}
            style={{ width: '100%', padding: '12px', borderRadius: 10, background: '#004A99', color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer', border: 'none' }}
          >
            Entrar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', padding: '32px 16px' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <div style={{ fontWeight: 900, fontSize: 24, marginBottom: 4 }}>🐾 Painel Admin</div>
        <div style={{ color: '#666', fontSize: 14, marginBottom: 28 }}>Gerencie os horários disponíveis por profissional</div>

        <div style={{ background: '#fff', borderRadius: 16, padding: 28, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#666', display: 'block', marginBottom: 6 }}>UNIDADE</label>
              <select value={unitId} onChange={e => setUnitId(e.target.value)} style={selectStyle}>
                {UNITS.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#666', display: 'block', marginBottom: 6 }}>PROFISSIONAL</label>
              <select value={professional} onChange={e => setProfessional(e.target.value)} style={selectStyle}>
                {professionals.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#666', display: 'block', marginBottom: 6 }}>DATA</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} min={todayISO()} style={selectStyle} />
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: 16, padding: 28, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: 20 }}>
          <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 16 }}>Horários disponíveis</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {ALL_SLOTS.map(s => (
              <button
                key={s}
                onClick={() => toggleSlot(s)}
                style={{
                  padding: '12px 8px',
                  borderRadius: 10,
                  border: `2px solid ${slots.includes(s) ? '#004A99' : '#e5e7eb'}`,
                  background: slots.includes(s) ? '#e8f0fa' : '#fff',
                  color: slots.includes(s) ? '#004A99' : '#333',
                  fontWeight: slots.includes(s) ? 800 : 500,
                  fontSize: 15,
                  cursor: 'pointer',
                  transition: 'all .15s',
                }}
              >
                {s}
              </button>
            ))}
          </div>
          <div style={{ marginTop: 16, fontSize: 13, color: '#888' }}>
            {slots.length} horário(s) selecionado(s)
          </div>
        </div>

        <button
          onClick={save}
          disabled={saving}
          style={{ width: '100%', padding: '14px', borderRadius: 12, background: saved ? '#16a34a' : '#EF7720', color: '#fff', fontWeight: 800, fontSize: 16, cursor: 'pointer', border: 'none', transition: 'background .2s' }}
        >
          {saving ? 'Salvando...' : saved ? '✓ Salvo!' : 'Salvar disponibilidade'}
        </button>
      </div>
    </div>
  )
}

const selectStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 10,
  border: '1.5px solid #e5e7eb',
  fontSize: 14,
  background: '#fff',
  boxSizing: 'border-box',
}
