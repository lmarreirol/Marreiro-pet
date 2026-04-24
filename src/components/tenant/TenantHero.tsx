import type { TenantWithDetails } from '@/lib/tenant'

export default function TenantHero({
  tenant,
  offersGrooming,
  offersVet,
}: {
  tenant: TenantWithDetails
  offersGrooming: boolean
  offersVet: boolean
}) {
  return (
    <section style={{
      background: `linear-gradient(135deg, ${tenant.primaryColor}15, ${tenant.primaryColor}30)`,
      padding: '5rem 1.5rem',
      textAlign: 'center',
    }}>
      <p style={{ color: tenant.primaryColor, fontWeight: 600, marginBottom: 12, fontSize: '0.9rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
        Bem-vindo à
      </p>
      <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 800, color: '#111827', marginBottom: 16 }}>
        {tenant.name}
      </h1>
      <p style={{ color: '#6b7280', fontSize: '1.125rem', maxWidth: 560, margin: '0 auto 2rem' }}>
        Cuidado completo para seu pet. Agende online em segundos.
      </p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        {offersGrooming && (
          <a href="#agendamento" style={{
            background: tenant.primaryColor,
            color: 'white',
            padding: '12px 28px',
            borderRadius: 10,
            textDecoration: 'none',
            fontWeight: 700,
            fontSize: '1rem',
          }}>
            Agendar Banho & Tosa
          </a>
        )}
        {offersVet && (
          <a href="#agendamento" style={{
            background: 'white',
            color: tenant.primaryColor,
            border: `2px solid ${tenant.primaryColor}`,
            padding: '12px 28px',
            borderRadius: 10,
            textDecoration: 'none',
            fontWeight: 700,
            fontSize: '1rem',
          }}>
            Agendar Consulta
          </a>
        )}
      </div>
      {tenant.units.length > 0 && (
        <div style={{ marginTop: '3rem', display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          {tenant.units.map(u => (
            <div key={u.id} style={{
              background: 'white',
              padding: '10px 20px',
              borderRadius: 8,
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
              fontSize: '0.875rem',
              color: '#374151',
            }}>
              📍 {u.name}{u.city && u.city !== u.name ? ` — ${u.city}` : ''}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
