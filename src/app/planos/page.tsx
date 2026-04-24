import Link from 'next/link'
import { PLANS } from '@/lib/stripe'

export const metadata = {
  title: 'Planos — Tarly',
  description: 'Escolha o plano ideal para sua clínica veterinária ou pet shop.',
}

export default function PlanosPage() {
  const plans = [
    { key: 'FREE' as const, ...PLANS.FREE, color: '#6b7280', highlight: false },
    { key: 'PRO' as const, ...PLANS.PRO, color: '#2563eb', highlight: false },
    { key: 'ENTERPRISE' as const, ...PLANS.ENTERPRISE, color: '#f97316', highlight: true },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', padding: '4rem 1rem' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{ fontWeight: 800, fontSize: '2rem', color: '#f97316', letterSpacing: '-0.05em', marginBottom: 20 }}>tarly</div>
          <p style={{ color: '#f97316', fontWeight: 600, marginBottom: 8 }}>Para clínicas veterinárias e pet shops</p>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 800, color: '#111827', marginBottom: 12 }}>
            Planos simples e transparentes
          </h1>
          <p style={{ color: '#6b7280', fontSize: '1.125rem' }}>
            A plataforma de gestão para clínicas e pet shops. Comece grátis.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
          {plans.map(plan => (
            <div key={plan.key} style={{
              background: 'white',
              borderRadius: 16,
              padding: '2rem',
              boxShadow: plan.highlight ? '0 8px 32px rgba(249,115,22,0.2)' : '0 2px 12px rgba(0,0,0,0.06)',
              border: plan.highlight ? '2px solid #f97316' : '1px solid #e5e7eb',
              position: 'relative',
            }}>
              {plan.highlight && (
                <div style={{
                  position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
                  background: '#f97316', color: 'white', fontSize: '0.75rem', fontWeight: 700,
                  padding: '4px 16px', borderRadius: 20, whiteSpace: 'nowrap',
                }}>
                  Mais popular
                </div>
              )}
              <div style={{ color: plan.color, fontWeight: 700, marginBottom: 8 }}>{plan.name}</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#111827', marginBottom: 4 }}>
                {plan.price === 0 ? 'Grátis' : `R$ ${(plan.price / 100).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`}
                {plan.price > 0 && <span style={{ fontSize: '1rem', fontWeight: 400, color: '#6b7280' }}>/mês</span>}
              </div>
              <hr style={{ border: 'none', borderTop: '1px solid #f3f4f6', margin: '1.5rem 0' }} />
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {plan.features.map(f => (
                  <li key={f} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: '0.9rem', color: '#374151' }}>
                    <span style={{ color: '#10b981', flexShrink: 0, marginTop: 1 }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link href={`/cadastrar?plan=${plan.key}`} style={{
                display: 'block', textAlign: 'center',
                background: plan.highlight ? '#f97316' : plan.key === 'FREE' ? 'white' : '#111827',
                color: plan.highlight ? 'white' : plan.key === 'FREE' ? '#111827' : 'white',
                border: plan.key === 'FREE' ? '1.5px solid #e5e7eb' : 'none',
                padding: '12px', borderRadius: 10, textDecoration: 'none', fontWeight: 700,
              }}>
                {plan.key === 'FREE' ? 'Começar grátis' : 'Assinar agora'}
              </Link>
            </div>
          ))}
        </div>

        <p style={{ textAlign: 'center', color: '#9ca3af', marginTop: '3rem', fontSize: '0.875rem' }}>
          Já tem uma conta?{' '}
          <Link href="/admin/login" style={{ color: '#f97316', textDecoration: 'none', fontWeight: 600 }}>
            Entrar no Tarly
          </Link>
        </p>
      </div>
    </div>
  )
}
