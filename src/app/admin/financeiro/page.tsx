'use client'
import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

const UNITS: Record<string, string> = { caucaia: 'Caucaia', pecem: 'Pecém', saogoncalo: 'São Gonçalo', taiba: 'Taíba' }
const STATUS_LABEL: Record<string, string> = { AWAITING_PAYMENT: 'Aguardando', CONFIRMED: 'Confirmado', COMPLETED: 'Concluído', CANCELLED: 'Cancelado' }
const STATUS_COLOR: Record<string, string> = { AWAITING_PAYMENT: '#f59e0b', CONFIRMED: '#10b981', COMPLETED: '#6366f1', CANCELLED: '#ef4444' }
const PACKAGE_LABEL: Record<string, string> = { banho: 'Banho', 'banho-tosa': 'Banho + Tosa', spa: 'Spa Completo' }

type Row = {
  id: string; petName: string; tutorName: string; phone: string; unitId: string
  serviceType: string; package: string | null; status: string; totalPrice: string
  appointmentDate: string; appointmentTime: string; professional: string | null
}
type Data = {
  totalRevenue: number; total: number; pages: number
  byStatus: Record<string, { count: number; revenue: number }>
  byUnit: Record<string, number>
  byService: Record<string, number>
  chartData: { date: string; label: string; revenue: number; count: number }[]
  rows: Row[]
}

function fmt(n: number) { return `R$ ${n.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}` }

export default function FinanceiroPage() {
  const { status } = useSession()
  const router = useRouter()

  const [period, setPeriod] = useState('30')
  const [unitFilter, setUnitFilter] = useState('all')
  const [serviceFilter, setServiceFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [data, setData] = useState<Data | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (status === 'unauthenticated') router.push('/admin/login') }, [status, router])

  const load = useCallback(() => {
    if (status !== 'authenticated') return
    setLoading(true)
    const p = new URLSearchParams({ period, page: String(page) })
    if (unitFilter !== 'all') p.set('unitId', unitFilter)
    if (serviceFilter !== 'all') p.set('serviceType', serviceFilter)
    if (statusFilter !== 'all') p.set('status', statusFilter)
    fetch(`/api/admin/financeiro?${p}`)
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [status, period, unitFilter, serviceFilter, statusFilter, page])

  useEffect(() => { load() }, [load])
  useEffect(() => { setPage(1) }, [period, unitFilter, serviceFilter, statusFilter])

  const sel: React.CSSProperties = { border: '1px solid #e5e7eb', borderRadius: 8, padding: '7px 10px', fontSize: '0.82rem', color: '#374151', background: 'white' }

  return (
    <div style={{ padding: '2rem', maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111827' }}>Financeiro</h1>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: 2 }}>Receita e movimentações do período</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <select value={period} onChange={e => setPeriod(e.target.value)} style={sel}>
            <option value="7">Últimos 7 dias</option>
            <option value="30">Últimos 30 dias</option>
            <option value="90">Últimos 90 dias</option>
          </select>
          <select value={unitFilter} onChange={e => setUnitFilter(e.target.value)} style={sel}>
            <option value="all">Todas as unidades</option>
            {Object.entries(UNITS).map(([id, name]) => <option key={id} value={id}>{name}</option>)}
          </select>
          <select value={serviceFilter} onChange={e => setServiceFilter(e.target.value)} style={sel}>
            <option value="all">Todos os serviços</option>
            <option value="grooming">✂️ Banho & Tosa</option>
            <option value="vet">🩺 Clínica</option>
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={sel}>
            <option value="all">Todos os status</option>
            <option value="COMPLETED">Concluído</option>
            <option value="CONFIRMED">Confirmado</option>
            <option value="AWAITING_PAYMENT">Aguardando</option>
            <option value="CANCELLED">Cancelado</option>
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <KpiCard label="Receita total" value={fmt(data?.totalRevenue ?? 0)} sub="apenas concluídos" color="#f97316" icon="💰" />
        <KpiCard label="Total agendamentos" value={String(data?.total ?? 0)} color="#6366f1" icon="📅" />
        <KpiCard label="Concluídos" value={String(data?.byStatus?.COMPLETED?.count ?? 0)} color="#10b981" icon="✅" />
        <KpiCard label="Cancelados" value={String(data?.byStatus?.CANCELLED?.count ?? 0)} color="#ef4444" icon="❌" />
      </div>

      {/* Chart + breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 240px', gap: '1.5rem', marginBottom: '1.5rem', alignItems: 'start' }}>
        {/* Area chart */}
        <div style={{ background: 'white', borderRadius: 14, padding: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f3f4f6' }}>
          <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#111827', marginBottom: '1rem' }}>Receita por dia</h2>
          {loading ? (
            <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>Carregando...</div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={data?.chartData ?? []}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={50}
                  tickFormatter={v => `R$${Number(v).toFixed(0)}`} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
                  formatter={(v: unknown) => [`R$ ${Number(v).toFixed(2).replace('.', ',')}`, 'Receita']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={2} fill="url(#rev)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Breakdown cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* By unit */}
          <div style={{ background: 'white', borderRadius: 14, padding: '1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f3f4f6' }}>
            <h3 style={{ fontSize: '0.78rem', fontWeight: 700, color: '#6b7280', marginBottom: 10 }}>POR UNIDADE</h3>
            {Object.entries(data?.byUnit ?? {}).length === 0 ? (
              <p style={{ fontSize: '0.8rem', color: '#d1d5db' }}>—</p>
            ) : Object.entries(data?.byUnit ?? {}).sort((a, b) => b[1] - a[1]).map(([uid, rev]) => (
              <div key={uid} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#374151', marginBottom: 6 }}>
                <span>{UNITS[uid] ?? uid}</span>
                <span style={{ fontWeight: 700 }}>{fmt(rev)}</span>
              </div>
            ))}
          </div>
          {/* By service */}
          <div style={{ background: 'white', borderRadius: 14, padding: '1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f3f4f6' }}>
            <h3 style={{ fontSize: '0.78rem', fontWeight: 700, color: '#6b7280', marginBottom: 10 }}>POR SERVIÇO</h3>
            {Object.entries(data?.byService ?? {}).length === 0 ? (
              <p style={{ fontSize: '0.8rem', color: '#d1d5db' }}>—</p>
            ) : Object.entries(data?.byService ?? {}).sort((a, b) => b[1] - a[1]).map(([svc, rev]) => (
              <div key={svc} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#374151', marginBottom: 6 }}>
                <span>{svc === 'grooming' ? '✂️ Banho & Tosa' : '🩺 Clínica'}</span>
                <span style={{ fontWeight: 700 }}>{fmt(rev)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: 'white', borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f3f4f6', overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#111827' }}>Movimentações</h2>
          <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>{data?.total ?? 0} registros</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                {['Data', 'Pet', 'Tutor', 'Unidade', 'Serviço', 'Profissional', 'Status', 'Total'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#6b7280', fontSize: '0.72rem', whiteSpace: 'nowrap' }}>{h.toUpperCase()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>Carregando...</td></tr>
              ) : (data?.rows ?? []).length === 0 ? (
                <tr><td colSpan={8} style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>Nenhum registro encontrado.</td></tr>
              ) : (data?.rows ?? []).map((r, i) => (
                <tr key={r.id} style={{ borderTop: '1px solid #f3f4f6', background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                  <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', color: '#6b7280' }}>
                    {new Date(r.appointmentDate).toLocaleDateString('pt-BR')}<br />
                    <span style={{ fontSize: '0.72rem' }}>{r.appointmentTime.substring(0, 5)}</span>
                  </td>
                  <td style={{ padding: '10px 14px', fontWeight: 600, color: '#111827' }}>{r.petName}</td>
                  <td style={{ padding: '10px 14px', color: '#374151' }}>
                    {r.tutorName}<br />
                    <span style={{ fontSize: '0.72rem', color: '#9ca3af' }}>{r.phone}</span>
                  </td>
                  <td style={{ padding: '10px 14px', color: '#374151' }}>{UNITS[r.unitId] ?? r.unitId}</td>
                  <td style={{ padding: '10px 14px', color: '#374151' }}>
                    {r.serviceType === 'grooming' ? '✂️' : '🩺'} {r.package ? (PACKAGE_LABEL[r.package] ?? r.package) : (r.serviceType === 'vet' ? 'Consulta' : '—')}
                  </td>
                  <td style={{ padding: '10px 14px', color: '#6b7280' }}>{r.professional ?? '—'}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: `${STATUS_COLOR[r.status]}18`, color: STATUS_COLOR[r.status] }}>
                      {STATUS_LABEL[r.status]}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px', fontWeight: 800, color: r.status === 'COMPLETED' ? '#111827' : '#9ca3af', whiteSpace: 'nowrap' }}>
                    {fmt(Number(r.totalPrice))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {(data?.pages ?? 1) > 1 && (
          <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #f3f4f6', display: 'flex', gap: 6, justifyContent: 'center', alignItems: 'center' }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={pgBtn}>‹ Anterior</button>
            <span style={{ fontSize: '0.82rem', color: '#6b7280' }}>{page} / {data?.pages}</span>
            <button onClick={() => setPage(p => Math.min(data?.pages ?? 1, p + 1))} disabled={page === (data?.pages ?? 1)} style={pgBtn}>Próxima ›</button>
          </div>
        )}
      </div>
    </div>
  )
}

function KpiCard({ label, value, sub, color, icon }: { label: string; value: string; sub?: string; color: string; icon: string }) {
  return (
    <div style={{ background: 'white', borderRadius: 14, padding: '1.25rem 1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f3f4f6', display: 'flex', gap: 14, alignItems: 'center' }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}15`, display: 'grid', placeItems: 'center', fontSize: 20, flexShrink: 0 }}>{icon}</div>
      <div>
        <div style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 500, marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111827', lineHeight: 1 }}>{value}</div>
        {sub && <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  )
}

const pgBtn: React.CSSProperties = {
  background: '#f3f4f6', border: 'none', borderRadius: 8, padding: '6px 14px',
  cursor: 'pointer', fontSize: '0.82rem', color: '#374151', fontWeight: 600,
}
