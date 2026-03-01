import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
})

export const PRICE_IDS = {
  plan: process.env.STRIPE_PRICE_PLAN!,
  coaching: process.env.STRIPE_PRICE_COACHING!,
  elite: process.env.STRIPE_PRICE_ELITE!,
} as const

export type PlanTier = keyof typeof PRICE_IDS
