import { notFound } from 'next/navigation'
import { getTenantBySlug, hasService } from '@/lib/tenant'
import TenantNav from '@/components/tenant/TenantNav'
import TenantHero from '@/components/tenant/TenantHero'
import TenantScheduler from '@/components/tenant/TenantScheduler'
import TenantFooter from '@/components/tenant/TenantFooter'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const tenant = await getTenantBySlug(slug)
  if (!tenant) return {}
  return {
    title: `${tenant.name} — Agendamento Online`,
    description: `Agende serviços para seu pet na ${tenant.name}.`,
  }
}

export default async function TenantPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const tenant = await getTenantBySlug(slug)
  if (!tenant) notFound()

  const offersGrooming = hasService(tenant, 'grooming')
  const offersVet = hasService(tenant, 'vet')

  return (
    <>
      <style>{`
        :root {
          --tenant-primary: ${tenant.primaryColor};
        }
      `}</style>
      <TenantNav tenant={tenant} />
      <main>
        <TenantHero tenant={tenant} offersGrooming={offersGrooming} offersVet={offersVet} />
        <section style={{ padding: '3rem 1rem', maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <p style={{ color: tenant.primaryColor, fontWeight: 600, marginBottom: 8 }}>Agendamento online</p>
            <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: 12 }}>Marque atendimento em 1 minuto</h2>
            <p style={{ color: '#6b7280' }}>Sem filas, sem ligações. Escolha o serviço, o horário e confirmamos por WhatsApp.</p>
          </div>
          <TenantScheduler tenant={tenant} />
        </section>
      </main>
      <TenantFooter tenant={tenant} />
    </>
  )
}
