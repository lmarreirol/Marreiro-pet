import Link from 'next/link'

export default function Falha() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: '#fff', borderRadius: 24, padding: 48, maxWidth: 480, width: '100%', textAlign: 'center', boxShadow: 'var(--shadow-lg)' }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#EF4444', color: '#fff', display: 'grid', placeItems: 'center', margin: '0 auto 24px', fontSize: 40 }}>
          ✕
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 900, marginBottom: 12, color: 'var(--ink)' }}>Pagamento não aprovado</h1>
        <p style={{ color: 'var(--ink-soft)', fontSize: 16, lineHeight: 1.6, marginBottom: 32 }}>
          Não conseguimos processar seu pagamento. Verifique os dados do cartão e tente novamente, ou escolha outra forma de pagamento.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/#banho-tosa" className="btn btn-primary" style={{ display: 'inline-flex' }}>
            Tentar novamente
          </Link>
          <Link href="/" className="btn btn-ghost" style={{ display: 'inline-flex' }}>
            Voltar para o site
          </Link>
        </div>
      </div>
    </div>
  )
}
