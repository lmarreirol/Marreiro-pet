'use client'
import Link from 'next/link'
import Image from 'next/image'
import type { TenantWithDetails } from '@/lib/tenant'

export default function TenantNav({ tenant }: { tenant: TenantWithDetails }) {
  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: 'white', borderBottom: '1px solid #e5e7eb',
      padding: '0 1.5rem', display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', height: 64,
    }}>
      <Link href={`/c/${tenant.slug}`} style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
        {tenant.logoUrl ? (
          <Image src={tenant.logoUrl} alt={tenant.name} width={120} height={40} style={{ objectFit: 'contain' }} />
        ) : (
          <span style={{ fontSize: '1.2rem', fontWeight: 700, color: tenant.primaryColor }}>{tenant.name}</span>
        )}
      </Link>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        {tenant.units.length > 0 && (
          <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>
            {tenant.units.length} unidade{tenant.units.length > 1 ? 's' : ''}
          </span>
        )}
        <a
          href="#agendamento"
          style={{
            background: tenant.primaryColor,
            color: 'white',
            padding: '8px 18px',
            borderRadius: 8,
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: '0.875rem',
          }}
        >
          Agendar
        </a>
      </div>
    </nav>
  )
}
