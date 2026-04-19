import type { GroomingPackage, GroomingAddon } from '@/types'

export const GROOMING_PACKAGES: GroomingPackage[] = [
  {
    id: 'banho',
    name: 'Banho',
    description: 'Banho completo com secagem e perfume',
    prices: { small: 45, medium: 65, large: 90 },
    duration: '1h',
    includes: ['Banho com shampoo premium', 'Condicionador', 'Secagem completa', 'Perfume'],
  },
  {
    id: 'banho-tosa',
    name: 'Banho & Tosa',
    description: 'Banho completo + tosa higiênica ou modelada',
    prices: { small: 75, medium: 110, large: 155 },
    duration: '2h',
    includes: ['Tudo do Banho', 'Tosa higiênica', 'Corte das unhas', 'Limpeza de ouvidos'],
  },
  {
    id: 'spa',
    name: 'Spa Premium',
    description: 'Experiência completa de cuidados para o seu pet',
    prices: { small: 120, medium: 170, large: 230 },
    duration: '3h',
    includes: ['Tudo do Banho & Tosa', 'Hidratação profunda', 'Massagem relaxante', 'Aromaterapia'],
  },
]

export const GROOMING_ADDONS: GroomingAddon[] = [
  { id: 'hidra', name: 'Hidratação extra', price: 25, description: 'Máscara de hidratação intensiva' },
  { id: 'ozonio', name: 'Banho de ozônio', price: 35, description: 'Tratamento antibacteriano e antifúngico' },
  { id: 'perfume-premium', name: 'Perfume premium', price: 15, description: 'Fragrância duradoura importada' },
  { id: 'lacos', name: 'Laços & acessórios', price: 10, description: 'Acabamento fofo com laços e gravatas' },
]

export const GROOMING_TIMES = [
  '08:00', '09:00', '10:00', '11:00',
  '13:00', '14:00', '15:00', '16:00', '17:00',
]

export const PET_SIZES = [
  { id: 'small' as const, label: 'Pequeno', description: 'Até 10kg', emoji: '🐾' },
  { id: 'medium' as const, label: 'Médio', description: '10 a 25kg', emoji: '🐕' },
  { id: 'large' as const, label: 'Grande', description: 'Acima de 25kg', emoji: '🦮' },
]
