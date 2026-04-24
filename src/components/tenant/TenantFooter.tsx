import type { TenantWithDetails } from '@/lib/tenant'

export default function TenantFooter({ tenant }: { tenant: TenantWithDetails }) {
  return (
    <footer style={{
      background: '#111827',
      color: '#9ca3af',
      textAlign: 'center',
      padding: '2rem 1rem',
      marginTop: '4rem',
      fontSize: '0.875rem',
    }}>
      <p style={{ marginBottom: 4 }}>
        <span style={{ color: 'white', fontWeight: 600 }}>{tenant.name}</span>
      </p>
      <p>
        Powered by{' '}
        <a href="/planos" style={{ color: tenant.primaryColor, textDecoration: 'none', fontWeight: 600 }}>
          Tarly
        </a>
      </p>
    </footer>
  )
}
