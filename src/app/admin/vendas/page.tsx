'use client'
import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

const UNITS: Record<string, string> = { caucaia: 'Caucaia', pecem: 'Pecém', saogoncalo: 'São Gonçalo', taiba: 'Taíba' }
const PAYMENT_LABEL: Record<string, string> = { cash: '💵 Dinheiro', card_debit: '💳 Débito', card_credit: '💳 Crédito', pix: '📲 PIX' }
const PAYMENT_COLOR: Record<string, string> = { cash: '#16a34a', card_debit: '#6366f1', card_credit: '#0ea5e9', pix: '#f97316' }

type SaleItem = { id: string; name: string; price: string; quantity: number; subtotal: string }
type Sale = {
  id: string; unitId: string; sellerName: string | null; clientName: string | null; clientPhone: string | null
  subtotal: string; discount: string; total: string; paymentMethod: string
  amountPaid: string | null; change: string | null; notes: string | null
  status: string; createdAt: string; items: SaleItem[]
}
type Data = { sales: Sale[]; total: number; pages: number; totalRevenue: number; byPayment: Record<string, number> }

function fmt(n: string | number) {
  return `R$ ${Number(n).toFixed(2).replace('.', ',')}`
}

export default function VendasPage() {
  const { status } = useSession()
  const router = useRouter()

  const [period, setPeriod] = useState('30')
  const [unitFilter, setUnitFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [data, setData] = useState<Data | null>(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => { if (status === 'unauthenticated') router.push('/admin/login') }, [status, router])

  const load = useCallback(() => {
    if (status !== 'authenticated') return
    setLoading(true)
    const p = new URLSearchParams({ period, page: String(page) })
    if (unitFilter !== 'all') p.set('unitId', unitFilter)
    fetch(`/api/admin/sales?${p}`)
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [status, period, unitFilter, page])

  useEffect(() => { load() }, [load])
  useEffect(() => { setPage(1) }, [period, unitFilter])

  const sel: React.CSSProperties = { border: '1px solid #e5e7eb', borderRadius: 8, padding: '7px 10px', fontSize: '0.82rem', color: '#374151', background: 'white' }

  return (
    <div style={{ padding: '2rem', maxWidth: 1000, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111827' }}>Vendas</h1>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: 2 }}>Histórico de vendas do PDV</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <select value={period} onChange={e => setPeriod(e.target.value)} style={sel}>
            <option value="7">Últimos 7 dias</option>
            <option value="30">Últimos 30 dias</option>
            <option value="90">Últimos 90 dias</option>
          </select>
          <select value={unitFilter} onChange={e => setUnitFilter(e.target.value)} style={sel}>
            <option value="all">Todas as unidades</option>
            {Object.entries(UNITS).map(([id, name]) => <option key={id} value={id}>{name}</option>)}
          </select>
        </div>
      </div>

      {/* KPI + Payment breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <KpiCard icon="💰" label="Receita total" value={fmt(data?.totalRevenue ?? 0)} color="#f97316" />
        <KpiCard icon="🧾" label="Vendas" value={String(data?.total ?? 0)} color="#6366f1" />
        {Object.entries(data?.byPayment ?? {}).map(([method, rev]) => (
          <KpiCard key={method} icon={PAYMENT_LABEL[method]?.split(' ')[0] ?? '💳'} label={PAYMENT_LABEL[method]?.split(' ').slice(1).join(' ') ?? method} value={fmt(rev)} color={PAYMENT_COLOR[method] ?? '#9ca3af'} />
        ))}
      </div>

      {/* Table */}
      <div style={{ background: 'white', borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f3f4f6', overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #f3f4f6' }}>
          <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#111827' }}>Movimentações</h2>
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>Carregando...</p>
        ) : (data?.sales ?? []).length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#9ca3af' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🧾</div>
            <p>Nenhuma venda encontrada.</p>
          </div>
        ) : (
          <div>
            {(data?.sales ?? []).map(sale => (
              <div key={sale.id}>
                <button
                  onClick={() => setExpanded(expanded === sale.id ? null : sale.id)}
                  style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: '14px 18px', borderBottom: '1px solid #f9fafb', display: 'flex', alignItems: 'center', gap: 14 }}
                >
                  {/* Date */}
                  <div style={{ width: 80, flexShrink: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#111827' }}>
                      {new Date(sale.createdAt).toLocaleDateString('pt-BR')}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>
                      {new Date(sale.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  {/* Client / seller */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {sale.clientName ?? 'Cliente avulso'}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>
                      {UNITS[sale.unitId] ?? sale.unitId}{sale.sellerName ? ` · ${sale.sellerName}` : ''} · {sale.items.length} iten{sale.items.length > 1 ? 's' : ''}
                    </div>
                  </div>

                  {/* Payment */}
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: `${PAYMENT_COLOR[sale.paymentMethod] ?? '#9ca3af'}18`, color: PAYMENT_COLOR[sale.paymentMethod] ?? '#9ca3af', flexShrink: 0 }}>
                    {PAYMENT_LABEL[sale.paymentMethod] ?? sale.paymentMethod}
                  </span>

                  {/* Total */}
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: '#111827', flexShrink: 0, width: 90, textAlign: 'right' }}>
                    {fmt(sale.total)}
                  </div>

                  <span style={{ color: '#9ca3af', flexShrink: 0 }}>{expanded === sale.id ? '▲' : '▼'}</span>
                </button>

                {/* Expanded items */}
                {expanded === sale.id && (
                  <div style={{ background: '#f9fafb', padding: '14px 18px 14px 52px', borderBottom: '1px solid #f3f4f6' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {sale.items.map(item => (
                        <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                          <span style={{ color: '#374151' }}>{item.quantity}× {item.name}</span>
                          <span style={{ fontWeight: 700, color: '#111827' }}>{fmt(item.subtotal)}</span>
                        </div>
                      ))}
                      {Number(sale.discount) > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#ef4444', marginTop: 4 }}>
                          <span>Desconto</span><span>− {fmt(sale.discount)}</span>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '0.9rem', color: '#111827', marginTop: 4, paddingTop: 8, borderTop: '1px solid #e5e7eb' }}>
                        <span>Total</span><span>{fmt(sale.total)}</span>
                      </div>
                      {sale.amountPaid && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#6b7280' }}>
                          <span>Pago</span><span>{fmt(sale.amountPaid)}</span>
                        </div>
                      )}
                      {sale.change && Number(sale.change) > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#16a34a', fontWeight: 700 }}>
                          <span>Troco</span><span>{fmt(sale.change)}</span>
                        </div>
                      )}
                      {sale.notes && <p style={{ fontSize: '0.78rem', color: '#9ca3af', marginTop: 4 }}>Obs: {sale.notes}</p>}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {(data?.pages ?? 1) > 1 && (
          <div style={{ padding: '1rem', display: 'flex', gap: 8, justifyContent: 'center', borderTop: '1px solid #f3f4f6' }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={pgBtn}>‹ Anterior</button>
            <span style={{ fontSize: '0.82rem', color: '#6b7280', display: 'flex', alignItems: 'center' }}>{page} / {data?.pages}</span>
            <button onClick={() => setPage(p => Math.min(data?.pages ?? 1, p + 1))} disabled={page === (data?.pages ?? 1)} style={pgBtn}>Próxima ›</button>
          </div>
        )}
      </div>
    </div>
  )
}

function KpiCard({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) {
  return (
    <div style={{ background: 'white', borderRadius: 12, padding: '1rem 1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f3f4f6', display: 'flex', gap: 12, alignItems: 'center' }}>
      <div style={{ width: 38, height: 38, borderRadius: 10, background: `${color}15`, display: 'grid', placeItems: 'center', fontSize: 18, flexShrink: 0 }}>{icon}</div>
      <div>
        <div style={{ fontSize: '0.72rem', color: '#6b7280', marginBottom: 1 }}>{label}</div>
        <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#111827' }}>{value}</div>
      </div>
    </div>
  )
}

const pgBtn: React.CSSProperties = {
  background: '#f3f4f6', border: 'none', borderRadius: 8, padding: '6px 14px',
  cursor: 'pointer', fontSize: '0.82rem', color: '#374151', fontWeight: 600,
}
