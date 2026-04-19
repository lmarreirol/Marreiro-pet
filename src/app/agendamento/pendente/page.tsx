import Link from 'next/link'

export default function Pendente() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: '#fff', borderRadius: 24, padding: 48, maxWidth: 480, width: '100%', textAlign: 'center', boxShadow: 'var(--shadow-lg)' }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#F59E0B', color: '#fff', display: 'grid', placeItems: 'center', margin: '0 auto 24px', fontSize: 40 }}>
          ⏳
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 900, marginBottom: 12, color: 'var(--ink)' }}>Pagamento em análise</h1>
        <p style={{ color: 'var(--ink-soft)', fontSize: 16, lineHeight: 1.6, marginBottom: 32 }}>
          Seu pagamento está sendo processado. Assim que for confirmado, você receberá uma mensagem no WhatsApp com os detalhes do agendamento.
        </p>
        <Link href="/" className="btn btn-primary" style={{ display: 'inline-flex' }}>
          Voltar para o site
        </Link>
      </div>
    </div>
  )
}
