import type { Unit, Professional } from '@/types'

export const UNITS: Unit[] = [
  {
    id: 'fortaleza-centro',
    name: 'Fortaleza Centro',
    address: 'Rua Exemplo, 123 — Centro, Fortaleza/CE',
    phone: '(85) 8 8888-8888',
    hours: 'Seg–Sáb 8h–18h',
  },
  {
    id: 'fortaleza-aldeota',
    name: 'Fortaleza Aldeota',
    address: 'Av. Exemplo, 456 — Aldeota, Fortaleza/CE',
    phone: '(85) 8 8888-8888',
    hours: 'Seg–Sáb 8h–18h',
  },
]

export const PROFESSIONALS: Professional[] = [
  { id: 'any', name: 'Sem preferência', role: '', unitIds: ['fortaleza-centro', 'fortaleza-aldeota'] },
  { id: 'vitor', name: 'Vítor', role: 'Tosador', unitIds: ['fortaleza-centro'] },
  { id: 'daniele', name: 'Daniele', role: 'Tosadora', unitIds: ['fortaleza-centro', 'fortaleza-aldeota'] },
]
