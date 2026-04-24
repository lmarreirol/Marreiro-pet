'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

type Tenant = {
  id: string
  slug: string
  name: string
  plan: string
  active: boolean
  createdAt: string
  customDomain: string | null
  stripeSubId: string | null
  _count: { units: number }
}

const PLAN_COLORS: Record<string, string> = {
  FREE: '#6b7280',
  PRO: '#2563eb',
  ENTERPRISE: '#f97316',
}

export default function TenantsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/admin/login')
  }, [status, router])

  useEffect(() => {
    if (status !== 'authenticated') return
    fetch('/api/admin/tenants')
      .then(r => r.json())
      .then(json => setTenants(json.tenants ?? []))
      .finally(() => setLoading(false))
  }, [status])

  const toggleActive = async (id: string, active: boolean) => {
    await fetch('/api/admin/tenants', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, active: !active }),
    })
    setTenants(prev => prev.map(t => t.id === id ? { ...t, active: !active } : t))
  }

  if (status === 'loading' || loading) {
    return <div style={{ padding: '4rem', textAlign: 'center', color: '#9ca3af' }}>Carregando...</div>
  }

  const user = session?.user as Record<string, unknown> | undefined
  if (user?.role !== 'ADMIN') {
    return <div style={{ padding: '4rem', textAlign: 'center', color: '#dc2626' }}>Acesso negado.</div>
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#111827' }}>Tenants</h1>
            <p style={{ color: '#6b7280', marginTop: 4 }}>{tenants.length} clínicas cadastradas</p>
          </div>
          <a href="/cadastrar" style={{ background: '#f97316', color: 'white', padding: '10px 20px', borderRadius: 8, textDecoration: 'none', fontWeight: 700, fontSize: '0.9rem' }}>
            + Nova clínica
          </a>
        </div>

        <div style={{ display: 'grid', gap: '1rem' }}>
          {tenants.map(t => (
            <div key={t.id} style={{
              background: 'white', borderRadius: 12, padding: '1.25rem 1.5rem',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              border: t.active ? '1px solid #e5e7eb' : '1px solid #fca5a5',
              display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap',
            }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontWeight: 700, color: '#111827', marginBottom: 2 }}>{t.name}</div>
                <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                  /c/{t.slug}
                  {t.customDomain && <span style={{ marginLeft: 8, color: '#6b7280' }}>· {t.customDomain}</span>}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{
                  fontSize: '0.75rem', fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                  background: `${PLAN_COLORS[t.plan] ?? '#6b7280'}18`,
                  color: PLAN_COLORS[t.plan] ?? '#6b7280',
                }}>
                  {t.plan}
                </span>
                <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>{t._count.units} unidade{t._count.units !== 1 ? 's' : ''}</span>
                <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
                  {new Date(t.createdAt).toLocaleDateString('pt-BR')}
                </span>
                {t.stripeSubId && (
                  <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>● Stripe</span>
                )}
                <span style={{
                  fontSize: '0.75rem', fontWeight: 600, color: t.active ? '#10b981' : '#ef4444',
                }}>
                  {t.active ? 'Ativo' : 'Inativo'}
                </span>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <a href={`/c/${t.slug}`} target="_blank"
                  style={{ fontSize: '0.8rem', color: '#6b7280', textDecoration: 'none', border: '1px solid #e5e7eb', borderRadius: 6, padding: '4px 12px' }}>
                  Ver site
                </a>
                <button onClick={() => toggleActive(t.id, t.active)}
                  style={{
                    fontSize: '0.8rem', fontWeight: 600, borderRadius: 6, padding: '4px 12px', cursor: 'pointer', border: 'none',
                    background: t.active ? '#fef2f2' : '#f0fdf4',
                    color: t.active ? '#ef4444' : '#16a34a',
                  }}>
                  {t.active ? 'Desativar' : 'Ativar'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {tenants.length === 0 && !loading && (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#9ca3af' }}>
            Nenhum tenant cadastrado ainda.
          </div>
        )}
      </div>
    </div>
  )
}
