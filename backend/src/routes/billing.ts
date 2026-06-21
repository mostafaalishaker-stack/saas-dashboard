import { Router, Response } from 'express';
import Stripe from 'stripe';
import { AuthRequest, auth } from '../middleware/auth.js';

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', { apiVersion: '2024-11-20.acacia' });
const subscriptions: Record<string, { plan: string; status: string; currentPeriodEnd: number }> = {};

const PLANS = [
  { id: 'free', name: 'Free', price: 0, features: ['Up to 3 users', 'Basic analytics', '1 project'] },
  { id: 'starter', name: 'Starter', price: 29, features: ['Up to 10 users', 'Advanced analytics', '10 projects', 'Email support'], priceId: 'price_starter' },
  { id: 'pro', name: 'Professional', price: 99, features: ['Unlimited users', 'All analytics', 'Unlimited projects', 'Priority support', 'API access'], priceId: 'price_pro' },
  { id: 'enterprise', name: 'Enterprise', price: 299, features: ['Everything in Pro', 'SSO', 'Custom integrations', 'SLA', 'Dedicated support'], priceId: 'price_enterprise' },
];

router.get('/plans', (_req, res: Response) => res.json(PLANS));

router.get('/subscription', auth, (req: AuthRequest, res: Response) => {
  const sub = subscriptions[req.user!.orgId!] || { plan: 'free', status: 'active', currentPeriodEnd: Date.now() + 30 * 86400000 };
  res.json(sub);
});

router.post('/subscribe', auth, async (req: AuthRequest, res: Response) => {
  try {
    const { planId } = req.body;
    const plan = PLANS.find(p => p.id === planId);
    if (!plan) return res.status(400).json({ error: 'Invalid plan' });
    if (plan.price === 0) {
      subscriptions[req.user!.orgId!] = { plan: 'free', status: 'active', currentPeriodEnd: Date.now() + 30 * 86400000 };
      return res.json(subscriptions[req.user!.orgId!]);
    }
    // In production: create Stripe checkout session
    subscriptions[req.user!.orgId!] = { plan: planId, status: 'active', currentPeriodEnd: Date.now() + 30 * 86400000 };
    res.json({ ...subscriptions[req.user!.orgId!], checkoutUrl: `https://checkout.stripe.com/session_${planId}` });
  } catch { res.status(500).json({ error: 'Subscription failed' }); }
});

export { router as billingRouter };
