'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import Link from 'next/link'

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
const UNIT_NAME: Record<string, string> = {
  caucaia: 'Caucaia', pecem: 'Pecém', saogoncalo: 'São Gonçalo', taiba: 'Taíba',
}

type KPIs = {
  todayAppts: number
  pendingAppts: number
  revenueToday: number
  completedToday: number
  groomingToday: number
  vetToday: number
}
type ChartDay = { date: string; label: string; revenue: number; count: number }
type RecentAppt = {
  id: string; petName: string; tutorName: string; phone: string
  appointmentTime: string; serviceType: string; package: string | null
  status: string; unitId: string; totalPrice: string; professional: string | null
}

function StatCard({ icon, label, value, sub, color = '#f97316', href }: {
  icon: string; label: string; value: string | number; sub?: string; color?: string; href?: string
}) {
  const content = (
    <div style={{
      background: 'white', borderRadius: 14, padding: '1.25rem 1.5rem',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', gap: 16,
      alignItems: 'center', border: '1px solid #f3f4f6',
      textDecoration: 'none', color: 'inherit', transition: 'box-shadow 0.15s',
    }}>
      <div style={{ width: 48, height: 48, borderRadius: 12, background: `${color}18`, display: 'grid', placeItems: 'center', fontSize: 22, flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '0.78rem', color: '#6b7280', fontWeight: 500, marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#111827', lineHeight: 1 }}>{value}</div>
        {sub && <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: 3 }}>{sub}</div>}
      </div>
    </div>
  )
  return href ? <Link href={href} style={{ textDecoration: 'none' }}>{content}</Link> : content
}

export default function OverviewPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [kpis, setKpis] = useState<KPIs | null>(null)
  const [chart, setChart] = useState<ChartDay[]>([])
  const [appts, setAppts] = useState<RecentAppt[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (status === 'unauthenticated') router.push('/admin/login') }, [status, router])

  useEffect(() => {
    if (status !== 'authenticated') return
    fetch('/api/admin/overview')
      .then(r => r.json())
      .then(d => { setKpis(d.kpis); setChart(d.chartData ?? []); setAppts(d.recentAppts ?? []) })
      .finally(() => setLoading(false))
  }, [status])

  const user = session?.user as Record<string, unknown> | undefined
  const todayStr = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })

  if (loading || status === 'loading') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#9ca3af' }}>
        Carregando...
      </div>
    )
  }

  return (
    <div style={{ padding: '2rem', maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <p style={{ color: '#9ca3af', fontSize: '0.875rem', textTransform: 'capitalize' }}>{todayStr}</p>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#111827', marginTop: 4 }}>
          Olá, {String(user?.name ?? '').split(' ')[0]} 👋
        </h1>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <StatCard icon="📅" label="Agendamentos hoje" value={kpis?.todayAppts ?? 0} sub={`${kpis?.groomingToday ?? 0} banho · ${kpis?.vetToday ?? 0} clínica`} color="#6366f1" href="/admin/agenda" />
        <StatCard icon="✅" label="Concluídos hoje" value={kpis?.completedToday ?? 0} color="#10b981" />
        <StatCard icon="⏳" label="Aguardando confirmação" value={kpis?.pendingAppts ?? 0} color="#f59e0b" href="/admin/dashboard" />
        <StatCard icon="💰" label="Receita hoje" value={`R$ ${(kpis?.revenueToday ?? 0).toFixed(2).replace('.', ',')}`} sub="apenas concluídos" color="#f97316" href="/admin/financeiro" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '1.5rem', alignItems: 'start' }}>
        {/* Chart */}
        <div style={{ background: 'white', borderRadius: 14, padding: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f3f4f6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827' }}>Agendamentos — 7 dias</h2>
              <p style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: 2 }}>Últimos 7 dias por volume</p>
            </div>
            <Link href="/admin/financeiro" style={{ fontSize: '0.8rem', color: '#f97316', textDecoration: 'none', fontWeight: 600 }}>Ver tudo →</Link>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chart} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={28} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
                formatter={(v: unknown, name: unknown) => {
                const label = name === 'revenue' ? 'Receita' : 'Agendamentos'
                const val = name === 'revenue' ? `R$ ${Number(v).toFixed(2).replace('.', ',')}` : String(v)
                return [val, label] as [string, string]
              }}
              />
              <Bar dataKey="count" fill="#6366f115" radius={[6, 6, 0, 0]} name="count" />
              <Bar dataKey="revenue" fill="#f97316" radius={[6, 6, 0, 0]} name="revenue" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Hoje */}
        <div style={{ background: 'white', borderRadius: 14, padding: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f3f4f6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827' }}>Agenda de hoje</h2>
            <Link href="/admin/agenda" style={{ fontSize: '0.8rem', color: '#f97316', textDecoration: 'none', fontWeight: 600 }}>Ver agenda →</Link>
          </div>

          {appts.length === 0 && (
            <p style={{ color: '#9ca3af', fontSize: '0.875rem', textAlign: 'center', padding: '2rem 0' }}>Nenhum agendamento hoje.</p>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {appts.map(a => (
              <div key={a.id} style={{
                display: 'flex', gap: 12, alignItems: 'center',
                padding: '10px 12px', borderRadius: 10, background: '#f9fafb',
                border: `1px solid ${STATUS_COLOR[a.status]}30`,
              }}>
                <div style={{ fontSize: '1.1rem', width: 36, height: 36, borderRadius: 10, background: `${STATUS_COLOR[a.status]}15`, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  {a.serviceType === 'grooming' ? '✂️' : '🩺'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {a.petName} <span style={{ fontWeight: 400, color: '#6b7280' }}>· {a.tutorName}</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: 1 }}>
                    {a.appointmentTime} · {UNIT_NAME[a.unitId] ?? a.unitId}
                  </div>
                </div>
                <span style={{
                  fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                  background: `${STATUS_COLOR[a.status]}18`, color: STATUS_COLOR[a.status], flexShrink: 0,
                }}>
                  {STATUS_LABEL[a.status]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
        {[
          { href: '/admin/clientes', icon: '➕', label: 'Novo cliente', color: '#6366f1' },
          { href: '/admin/clinica', icon: '🩺', label: 'Nova consulta', color: '#10b981' },
          { href: '/admin/dashboard', icon: '✂️', label: 'Novo banho & tosa', color: '#f97316' },
          { href: '/admin/financeiro', icon: '📊', label: 'Relatório financeiro', color: '#f59e0b' },
        ].map(q => (
          <Link key={q.href} href={q.href} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'white', borderRadius: 12, padding: '14px 16px',
            textDecoration: 'none', border: '1px solid #f3f4f6',
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          }}>
            <span style={{ fontSize: 18, width: 36, height: 36, display: 'grid', placeItems: 'center', borderRadius: 8, background: `${q.color}15` }}>{q.icon}</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151' }}>{q.label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
