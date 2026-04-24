import Stripe from 'stripe'

let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY not configured')
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2026-03-25.dahlia' })
  }
  return _stripe
}

// Convenience alias kept for webhook route (also lazy)
export { getStripe as stripe }

export const PLANS = {
  FREE: {
    name: 'Gratuito',
    priceId: null,
    price: 0,
    features: ['1 unidade', '50 agendamentos/mês', 'Painel básico', 'Página pública de agendamento'],
  },
  PRO: {
    name: 'Pro',
    priceId: process.env.STRIPE_PRICE_PRO ?? null,
    price: 9700, // R$ 97,00 em centavos
    features: ['1 unidade', '300 agendamentos/mês', 'Banho & Tosa', 'Relatórios avançados', 'Suporte prioritário'],
  },
  ENTERPRISE: {
    name: 'Enterprise',
    priceId: process.env.STRIPE_PRICE_ENTERPRISE ?? null,
    price: 29700, // R$ 297,00 em centavos
    features: ['Até 10 unidades', 'Agendamentos ilimitados', 'Todos os serviços', 'Domínio personalizado', 'API + Webhooks', 'Suporte dedicado'],
  },
} as const

export type PlanKey = keyof typeof PLANS
