import { prisma } from './prisma'
import { cache } from 'react'

export type TenantWithDetails = {
  id: string
  slug: string
  name: string
  logoUrl: string | null
  primaryColor: string
  customDomain: string | null
  plan: string
  active: boolean
  units: { id: string; unitKey: string; name: string; city: string | null; phone: string | null }[]
  services: { serviceType: string; enabled: boolean }[]
}

export const getTenantBySlug = cache(async (slug: string): Promise<TenantWithDetails | null> => {
  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    include: {
      units: { where: { active: true }, select: { id: true, unitKey: true, name: true, city: true, phone: true } },
      services: { where: { enabled: true }, select: { serviceType: true, enabled: true } },
    },
  })
  if (!tenant || !tenant.active) return null
  return tenant
})

export const getTenantByDomain = cache(async (domain: string): Promise<TenantWithDetails | null> => {
  const tenant = await prisma.tenant.findUnique({
    where: { customDomain: domain },
    include: {
      units: { where: { active: true }, select: { id: true, unitKey: true, name: true, city: true, phone: true } },
      services: { where: { enabled: true }, select: { serviceType: true, enabled: true } },
    },
  })
  if (!tenant || !tenant.active) return null
  return tenant
})

export function hasService(tenant: TenantWithDetails, serviceType: string): boolean {
  return tenant.services.some(s => s.serviceType === serviceType && s.enabled)
}

export function planLimits(plan: string) {
  switch (plan) {
    case 'FREE':
      return { maxUnits: 1, maxApptPerMonth: 50, grooming: false, vet: false, delivery: false }
    case 'PRO':
      return { maxUnits: 1, maxApptPerMonth: 300, grooming: true, vet: false, delivery: false }
    case 'ENTERPRISE':
      return { maxUnits: 10, maxApptPerMonth: Infinity, grooming: true, vet: true, delivery: true }
    default:
      return { maxUnits: 1, maxApptPerMonth: 50, grooming: false, vet: false, delivery: false }
  }
}
