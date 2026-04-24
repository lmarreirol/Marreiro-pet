'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { PLANS } from '@/lib/stripe'

const PLAN_LABELS: Record<string, string> = {
  FREE: 'Gratuito',
  PRO: 'Pro — R$ 97/mês',
  ENTERPRISE: 'Enterprise — R$ 297/mês',
}

function CadastrarForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const planParam = searchParams.get('plan') ?? 'FREE'

  const [form, setForm] = useState({
    clinicName: '',
    ownerName: '',
    username: '',
    password: '',
    email: '',
    phone: '',
    plan: planParam as keyof typeof PLANS,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setForm(f => ({ ...f, plan: planParam as keyof typeof PLANS }))
  }, [planParam])

  const update = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Erro ao criar conta')

      // For paid plans, redirect to Stripe checkout
      if (form.plan !== 'FREE' && PLANS[form.plan].priceId) {
        const checkoutRes = await fetch('/api/stripe/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tenantId: json.tenantId, plan: form.plan, email: form.email }),
        })
        const checkoutJson = await checkoutRes.json()
        if (checkoutJson.url) {
          window.location.href = checkoutJson.url
          return
        }
      }

      // Free plan: go to admin login
      router.push(`/admin/login?registered=1&slug=${json.slug}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
      <div style={{ background: 'white', borderRadius: 16, padding: '2.5rem', width: '100%', maxWidth: 480, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
        <Link href="/planos" style={{ color: '#6b7280', textDecoration: 'none', fontSize: '0.875rem', display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 24 }}>
          ← Voltar aos planos
        </Link>
        <div style={{ fontWeight: 800, fontSize: '1.5rem', color: '#f97316', marginBottom: 16, letterSpacing: '-0.03em' }}>tarly</div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#111827', marginBottom: 4 }}>Criar sua conta</h1>
        <p style={{ color: '#6b7280', marginBottom: 28 }}>
          Plano selecionado: <strong style={{ color: '#f97316' }}>{PLAN_LABELS[form.plan] ?? form.plan}</strong>
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[
            { key: 'clinicName', label: 'Nome da clínica / pet shop *', placeholder: 'Ex: PetCare Fortaleza' },
            { key: 'ownerName', label: 'Seu nome completo *', placeholder: 'Ex: João Silva' },
            { key: 'email', label: 'E-mail (para cobrança)', placeholder: 'joao@exemplo.com', type: 'email' },
            { key: 'phone', label: 'Telefone / WhatsApp', placeholder: '(85) 9 9999-9999' },
            { key: 'username', label: 'Usuário de login *', placeholder: 'Ex: joaosilva' },
            { key: 'password', label: 'Senha *', placeholder: 'Mínimo 8 caracteres', type: 'password' },
          ].map(f => (
            <div key={f.key}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>{f.label}</label>
              <input
                type={f.type ?? 'text'}
                value={form[f.key as keyof typeof form]}
                onChange={e => update(f.key as keyof typeof form, e.target.value)}
                placeholder={f.placeholder}
                required={f.label.includes('*')}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #d1d5db', fontSize: '0.9rem', boxSizing: 'border-box', outline: 'none' }}
              />
            </div>
          ))}

          {error && <p style={{ color: '#dc2626', fontSize: '0.85rem', margin: 0 }}>{error}</p>}

          <button type="submit" disabled={loading} style={{
            background: loading ? '#d1d5db' : '#f97316', color: 'white', border: 'none', borderRadius: 10,
            padding: '14px', fontWeight: 700, fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer', marginTop: 8,
          }}>
            {loading ? 'Criando conta...' : form.plan === 'FREE' ? 'Criar conta grátis' : 'Criar conta e pagar →'}
          </button>
        </form>

        <p style={{ textAlign: 'center', color: '#9ca3af', marginTop: 20, fontSize: '0.8rem' }}>
          Ao criar uma conta, você concorda com os termos de uso do Tarly.
        </p>
      </div>
    </div>
  )
}

export default function CadastrarPage() {
  return (
    <Suspense>
      <CadastrarForm />
    </Suspense>
  )
}
