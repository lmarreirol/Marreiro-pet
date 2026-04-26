'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

const UNITS = [
  { id: '',           label: 'Todas as unidades' },
  { id: 'caucaia',    label: 'Caucaia' },
  { id: 'pecem',      label: 'Pecém' },
  { id: 'saogoncalo', label: 'São Gonçalo' },
  { id: 'taiba',      label: 'Taíba' },
]

const DOW_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

type Rule = {
  id: string
  unitId: string | null
  type: string
  value: string
  multiplier: number
  label: string | null
  active: boolean
  createdAt: string
}

const EMPTY_FORM = {
  unitId: '', type: 'dow', value: '', multiplier: '1.20',
  label: '', active: true,
  dowDays: [] as string[],
  dateValue: '', rangeStart: '', rangeEnd: '',
}

function formatValue(type: string, value: string) {
  if (type === 'dow') {
    return value.split(',').map(d => DOW_LABELS[parseInt(d)]).filter(Boolean).join(', ')
  }
  if (type === 'date') {
    const [y, m, d] = value.split('-')
    return `${d}/${m}/${y}`
  }
  if (type === 'range') {
    const [s, e] = value.split(',')
    if (!s || !e) return value
    const [y1, m1, d1] = s.split('-')
    const [y2, m2, d2] = e.split('-')
    return `${d1}/${m1}/${y1} → ${d2}/${m2}/${y2}`
  }
  return value
}

function pctLabel(m: number) {
  const pct = Math.round((m - 1) * 100)
  return pct >= 0 ? `+${pct}%` : `${pct}%`
}

function tierColor(m: number) {
  if (m < 0.95)  return { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' }
  if (m <= 1.05) return { bg: '#f8fafc', color: '#64748b', border: '#e2e8f0' }
  if (m <= 1.20) return { bg: '#fffbeb', color: '#d97706', border: '#fde68a' }
  return { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' }
}

export default function PrecosPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const user = session?.user as Record<string, unknown> | undefined

  const [rules, setRules] = useState<Rule[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [editing, setEditing] = useState<Rule | null>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { if (status === 'unauthenticated') router.push('/admin/login') }, [status, router])
  useEffect(() => { if (status === 'authenticated' && user?.role !== 'ADMIN') router.push('/admin/overview') }, [status, user, router])

  const load = () => {
    setLoading(true)
    fetch('/api/admin/price-rules')
      .then(r => r.json())
      .then(d => setRules(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false))
  }
  useEffect(() => { if (status === 'authenticated') load() }, [status])

  const openCreate = () => {
    setForm({ ...EMPTY_FORM })
    setEditing(null)
    setError('')
    setModal('create')
  }

  const openEdit = (r: Rule) => {
    const dowDays = r.type === 'dow' ? r.value.split(',') : []
    const dateValue = r.type === 'date' ? r.value : ''
    const [rangeStart, rangeEnd] = r.type === 'range' ? r.value.split(',') : ['', '']
    setForm({
      unitId: r.unitId ?? '', type: r.type, value: r.value,
      multiplier: String(r.multiplier), label: r.label ?? '', active: r.active,
      dowDays, dateValue, rangeStart: rangeStart ?? '', rangeEnd: rangeEnd ?? '',
    })
    setEditing(r)
    setError('')
    setModal('edit')
  }

  const buildValue = () => {
    if (form.type === 'dow')   return form.dowDays.sort().join(',')
    if (form.type === 'date')  return form.dateValue
    if (form.type === 'range') return `${form.rangeStart},${form.rangeEnd}`
    return ''
  }

  const save = async () => {
    const value = buildValue()
    if (!value) { setError('Preencha a aplicação da regra.'); return }
    const mult = parseFloat(form.multiplier)
    if (isNaN(mult) || mult <= 0) { setError('Multiplicador inválido.'); return }
    setSaving(true)
    setError('')
    try {
      const body = { unitId: form.unitId || null, type: form.type, value, multiplier: mult, label: form.label || null, active: form.active }
      const url  = editing ? `/api/admin/price-rules/${editing.id}` : '/api/admin/price-rules'
      const res  = await fetch(url, { method: editing ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const text = await res.text()
      if (!res.ok) { let msg = 'Erro ao salvar'; try { msg = JSON.parse(text).error ?? msg } catch (_e) { /**/ } setError(msg); return }
      setModal(null)
      load()
    } finally { setSaving(false) }
  }

  const del = async (r: Rule) => {
    if (!confirm(`Excluir regra "${r.label ?? r.type}"?`)) return
    await fetch(`/api/admin/price-rules/${r.id}`, { method: 'DELETE' })
    load()
  }

  const toggleActive = async (r: Rule) => {
    await fetch(`/api/admin/price-rules/${r.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ active: !r.active }) })
    load()
  }

  const toggleDay = (d: string) => setForm(f => ({
    ...f, dowDays: f.dowDays.includes(d) ? f.dowDays.filter(x => x !== d) : [...f.dowDays, d],
  }))

  const pctFromMult = (m: string) => {
    const v = parseFloat(m)
    if (isNaN(v)) return ''
    const p = Math.round((v - 1) * 100)
    return p >= 0 ? `+${p}%` : `${p}%`
  }

  const inp: React.CSSProperties = { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 14, color: '#111827', outline: 'none', boxSizing: 'border-box', background: '#fff' }
  const lbl: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: '#555', display: 'block', marginBottom: 4 }

  if (status === 'loading') return <div style={{ padding: 40, textAlign: 'center' }}>Carregando...</div>

  return (
    <div style={{ padding: '2rem', maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.75rem', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111827', margin: 0 }}>Precificação Dinâmica</h1>
          <p style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>Regras manuais + ajuste automático por demanda · estilo Google Flights</p>
        </div>
        <button onClick={openCreate} style={{ background: '#004A99', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}>
          + Nova regra
        </button>
      </div>

      {/* Info box */}
      <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12, padding: '16px 20px', marginBottom: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#1e40af', marginBottom: 6 }}>⚡ Ajuste automático por ocupação</div>
          <div style={{ fontSize: 13, color: '#3b82f6', lineHeight: 1.6 }}>
            O sistema ajusta automaticamente o preço com base no quanto a agenda do dia está preenchida — sem nenhuma configuração extra.<br />
            <span style={{ fontWeight: 700 }}>{'< 30%'} ocupado → até −10%</span> · <span style={{ fontWeight: 700 }}>{'> 70%'} ocupado → até +20%</span>
          </div>
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#1e40af', marginBottom: 6 }}>🎯 Regras manuais (este painel)</div>
          <div style={{ fontSize: 13, color: '#3b82f6', lineHeight: 1.6 }}>
            Defina multiplicadores por dia da semana, data específica ou período.<br />
            As regras se combinam com o ajuste de ocupação. O cliente vê indicadores coloridos no calendário.
          </div>
        </div>
      </div>

      {/* Legenda */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { color: '#16a34a', bg: '#f0fdf4', label: 'Mais barato (< −5%)' },
          { color: '#64748b', bg: '#f8fafc', label: 'Normal (±5%)' },
          { color: '#d97706', bg: '#fffbeb', label: 'Procurado (+5 a +20%)' },
          { color: '#dc2626', bg: '#fef2f2', label: 'Alta demanda (> +20%)' },
        ].map(({ color, bg, label }) => (
          <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 20, background: bg, color }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block' }} />{label}
          </span>
        ))}
      </div>

      {/* Tabela de regras */}
      {loading ? (
        <p style={{ textAlign: 'center', color: '#9ca3af', padding: '4rem' }}>Carregando...</p>
      ) : rules.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#9ca3af', background: '#f8fafc', borderRadius: 12, border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
          <p style={{ fontWeight: 600 }}>Nenhuma regra criada ainda.</p>
          <p style={{ fontSize: 13, marginTop: 4 }}>O ajuste automático por ocupação já está ativo. Crie regras para definir preços em datas ou dias especiais.</p>
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e5e7eb' }}>
                {['Tipo', 'Aplicação', 'Ajuste', 'Unidade', 'Rótulo', 'Status', ''].map(h => (
                  <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#888' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rules.map((r, i) => {
                const tc = tierColor(r.multiplier)
                return (
                  <tr key={r.id} style={{ borderBottom: i < rules.length - 1 ? '1px solid #f3f4f6' : 'none', opacity: r.active ? 1 : 0.5 }}>
                    <td style={{ padding: '11px 14px', fontSize: 13 }}>
                      <span style={{ background: '#f1f5f9', color: '#475569', fontWeight: 700, fontSize: 11, padding: '3px 8px', borderRadius: 6 }}>
                        {r.type === 'dow' ? 'Dia da semana' : r.type === 'date' ? 'Data específica' : 'Período'}
                      </span>
                    </td>
                    <td style={{ padding: '11px 14px', fontSize: 13, color: '#374151', fontWeight: 600 }}>
                      {formatValue(r.type, r.value)}
                    </td>
                    <td style={{ padding: '11px 14px' }}>
                      <span style={{ fontSize: 13, fontWeight: 800, padding: '3px 10px', borderRadius: 20, background: tc.bg, color: tc.color, border: `1px solid ${tc.border}` }}>
                        {pctLabel(r.multiplier)}
                      </span>
                    </td>
                    <td style={{ padding: '11px 14px', fontSize: 13, color: '#6b7280' }}>
                      {UNITS.find(u => u.id === (r.unitId ?? ''))?.label ?? r.unitId ?? 'Todas'}
                    </td>
                    <td style={{ padding: '11px 14px', fontSize: 13, color: '#374151' }}>
                      {r.label ?? <span style={{ color: '#d1d5db' }}>—</span>}
                    </td>
                    <td style={{ padding: '11px 14px' }}>
                      <button onClick={() => toggleActive(r)} style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20, border: 'none', cursor: 'pointer', background: r.active ? '#dcfce7' : '#f3f4f6', color: r.active ? '#16a34a' : '#6b7280' }}>
                        {r.active ? 'Ativa' : 'Inativa'}
                      </button>
                    </td>
                    <td style={{ padding: '11px 14px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => openEdit(r)} style={{ padding: '4px 10px', borderRadius: 7, background: '#f1f5f9', border: 'none', fontSize: 12, fontWeight: 700, color: '#374151', cursor: 'pointer' }}>Editar</button>
                        <button onClick={() => del(r)} style={{ padding: '4px 10px', borderRadius: 7, background: '#fff', border: '1.5px solid #fca5a5', fontSize: 12, fontWeight: 700, color: '#dc2626', cursor: 'pointer' }}>Excluir</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal criar/editar */}
      {modal && (
        <div onClick={() => setModal(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, padding: 28, width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#111827', marginBottom: '1.25rem' }}>
              {modal === 'create' ? 'Nova regra de preço' : 'Editar regra'}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Tipo */}
              <div>
                <label style={lbl}>Tipo de regra</label>
                <select style={inp} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value, dowDays: [], dateValue: '', rangeStart: '', rangeEnd: '' }))}>
                  <option value="dow">Dia da semana (recorrente)</option>
                  <option value="date">Data específica</option>
                  <option value="range">Período (intervalo de datas)</option>
                </select>
              </div>

              {/* Aplicação */}
              {form.type === 'dow' && (
                <div>
                  <label style={lbl}>Dias da semana</label>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {DOW_LABELS.map((d, i) => (
                      <button key={i} type="button" onClick={() => toggleDay(String(i))} style={{
                        padding: '6px 12px', borderRadius: 20, fontWeight: 700, fontSize: 13, cursor: 'pointer',
                        background: form.dowDays.includes(String(i)) ? '#004A99' : '#f1f5f9',
                        color: form.dowDays.includes(String(i)) ? '#fff' : '#374151',
                        border: form.dowDays.includes(String(i)) ? '2px solid #004A99' : '2px solid transparent',
                      }}>{d}</button>
                    ))}
                  </div>
                </div>
              )}

              {form.type === 'date' && (
                <div>
                  <label style={lbl}>Data</label>
                  <input type="date" style={inp} value={form.dateValue} onChange={e => setForm(f => ({ ...f, dateValue: e.target.value }))} />
                </div>
              )}

              {form.type === 'range' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={lbl}>Data início</label>
                    <input type="date" style={inp} value={form.rangeStart} onChange={e => setForm(f => ({ ...f, rangeStart: e.target.value }))} />
                  </div>
                  <div>
                    <label style={lbl}>Data fim</label>
                    <input type="date" style={inp} value={form.rangeEnd} onChange={e => setForm(f => ({ ...f, rangeEnd: e.target.value }))} />
                  </div>
                </div>
              )}

              {/* Multiplicador */}
              <div>
                <label style={lbl}>
                  Ajuste de preço
                  <span style={{ marginLeft: 8, fontSize: 14, fontWeight: 800, color: (() => { const v = parseFloat(form.multiplier); return v > 1 ? '#dc2626' : v < 1 ? '#16a34a' : '#6b7280' })() }}>
                    {pctFromMult(form.multiplier)}
                  </span>
                </label>
                <input
                  type="range" min="0.50" max="2.00" step="0.05"
                  value={form.multiplier}
                  onChange={e => setForm(f => ({ ...f, multiplier: e.target.value }))}
                  style={{ width: '100%', accentColor: '#004A99' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
                  <span>−50%</span><span>Normal</span><span>+100%</span>
                </div>
                <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, color: '#555' }}>Ou digitar:</span>
                  <input
                    type="number" min="0.50" max="2.00" step="0.01"
                    value={form.multiplier}
                    onChange={e => setForm(f => ({ ...f, multiplier: e.target.value }))}
                    style={{ ...inp, width: 100, padding: '6px 10px', fontSize: 13 }}
                  />
                  <span style={{ fontSize: 12, color: '#6b7280' }}>(1.0 = sem ajuste)</span>
                </div>
              </div>

              {/* Rótulo */}
              <div>
                <label style={lbl}>Rótulo no calendário (opcional)</label>
                <input style={inp} placeholder="Ex: Fim de semana, Feriado, Promoção Janeiro..." value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} />
                <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 3 }}>Aparece no tooltip quando o cliente passa o mouse na data.</p>
              </div>

              {/* Unidade */}
              <div>
                <label style={lbl}>Unidade</label>
                <select style={inp} value={form.unitId} onChange={e => setForm(f => ({ ...f, unitId: e.target.value }))}>
                  {UNITS.map(u => <option key={u.id} value={u.id}>{u.label}</option>)}
                </select>
              </div>

              {/* Ativo */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="checkbox" id="active-toggle" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} style={{ width: 16, height: 16, accentColor: '#004A99', cursor: 'pointer' }} />
                <label htmlFor="active-toggle" style={{ fontSize: 14, fontWeight: 600, color: '#374151', cursor: 'pointer' }}>Regra ativa</label>
              </div>

              {error && <p style={{ color: '#dc2626', fontSize: 13, margin: 0 }}>{error}</p>}
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: '1.25rem' }}>
              <button onClick={() => setModal(null)} style={{ flex: 1, padding: '10px', borderRadius: 8, background: '#f3f4f6', border: 'none', fontWeight: 600, fontSize: 14, color: '#374151', cursor: 'pointer' }}>Cancelar</button>
              <button onClick={save} disabled={saving} style={{ flex: 1, padding: '10px', borderRadius: 8, background: '#004A99', border: 'none', fontWeight: 700, fontSize: 14, color: '#fff', cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Salvando...' : modal === 'create' ? 'Criar regra' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
