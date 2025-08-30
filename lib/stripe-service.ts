import Stripe from 'stripe';

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2024-12-18.acacia',
});

export interface StripeSubscription {
  id: string;
  customerId: string;
  status: string;
  priceId: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  amount: number;
  currency: string;
}

export interface UsageRecord {
  subscriptionItemId: string;
  quantity: number;
  timestamp?: number;
  action?: 'increment' | 'set';
}

// Pricing configuration matching our freemium model
export const PRICING_CONFIG = {
  // Free tier - no subscription needed
  FREE: {
    name: "Insights Free",
    features: [
      "Business Intelligence Dashboard",
      "Service & Client Management", 
      "Analytics & Reporting",
      "Calendar Integration",
      "Basic Notifications"
    ],
    limits: {
      clients: 100,
      services: 10,
      monthlyReports: 5
    }
  },

  // AI Agents - Usage-based pricing
  AI_AGENTS: {
    name: "AI Business Coaching",
    priceId: process.env.STRIPE_AI_PRICE_ID || 'price_placeholder',
    unitAmount: 4, // $0.04 per 1K tokens
    currency: 'usd',
    billingScheme: 'per_unit' as const,
    usageType: 'metered' as const,
    features: [
      "Everything in Free",
      "AI Business Coaching",
      "Smart Recommendations", 
      "Predictive Analytics",
      "SMS Notifications"
    ]
  },

  // SMS Notifications - Usage-based
  SMS_NOTIFICATIONS: {
    name: "SMS Notifications",
    priceId: process.env.STRIPE_SMS_PRICE_ID || 'price_placeholder_sms',
    unitAmount: 1, // $0.01 per message
    currency: 'usd',
    billingScheme: 'per_unit' as const,
    usageType: 'metered' as const
  },

  // Enterprise tier
  ENTERPRISE: {
    name: "Enterprise",
    priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID || 'price_placeholder_enterprise',
    unitAmount: 49900, // $499/month
    currency: 'usd',
    billingScheme: 'per_unit' as const,
    usageType: 'licensed' as const,
    features: [
      "Everything in AI Agents",
      "Multi-Location Management",
      "Advanced Integrations",
      "Priority Support",
      "Custom Features"
    ]
  }
};

/**
 * Create a Stripe customer
 */
export async function createCustomer(email: string, name: string, metadata?: Record<string, string>): Promise<Stripe.Customer> {
  return await stripe.customers.create({
    email,
    name,
    metadata: {
      source: 'bossio_platform',
      ...metadata
    }
  });
}

/**
 * Create subscription for usage-based billing (AI Agents)
 */
export async function createUsageSubscription(
  customerId: string, 
  priceId: string,
  metadata?: Record<string, string>
): Promise<Stripe.Subscription> {
  return await stripe.subscriptions.create({
    customer: customerId,
    items: [{
      price: priceId,
    }],
    billing_cycle_anchor: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // Bill monthly
    metadata: {
      platform: 'bossio',
      billing_type: 'usage',
      ...metadata
    }
  });
}

/**
 * Record usage for metered billing (AI tokens, SMS messages)
 */
export async function recordUsage(
  subscriptionItemId: string,
  quantity: number,
  timestamp?: number
): Promise<Stripe.UsageRecord> {
  return await stripe.subscriptionItems.createUsageRecord(subscriptionItemId, {
    quantity,
    timestamp: timestamp || Math.floor(Date.now() / 1000),
    action: 'increment'
  });
}

/**
 * Create Checkout Session for new subscriptions
 */
export async function createCheckoutSession(
  customerId: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string,
  mode: 'subscription' | 'payment' = 'subscription'
): Promise<Stripe.Checkout.Session> {
  return await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [{
      price: priceId,
      quantity: 1,
    }],
    mode,
    success_url: successUrl,
    cancel_url: cancelUrl,
    allow_promotion_codes: true,
    billing_address_collection: 'required',
    metadata: {
      platform: 'bossio',
      pricing_model: 'freemium'
    }
  });
}

/**
 * Create Customer Portal Session for self-service billing
 */
export async function createPortalSession(
  customerId: string, 
  returnUrl: string
): Promise<Stripe.BillingPortal.Session> {
  return await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
}

/**
 * Get customer's active subscriptions
 */
export async function getCustomerSubscriptions(customerId: string): Promise<StripeSubscription[]> {
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: 'active',
    expand: ['data.items.data.price']
  });

  return subscriptions.data.map(sub => ({
    id: sub.id,
    customerId: sub.customer as string,
    status: sub.status,
    priceId: sub.items.data[0]?.price?.id || '',
    currentPeriodStart: new Date(sub.current_period_start * 1000),
    currentPeriodEnd: new Date(sub.current_period_end * 1000),
    cancelAtPeriodEnd: sub.cancel_at_period_end,
    amount: sub.items.data[0]?.price?.unit_amount || 0,
    currency: sub.currency
  }));
}

/**
 * Calculate current month's usage costs
 */
export async function getUsageCosts(customerId: string): Promise<{
  aiTokens: { quantity: number; cost: number };
  smsMessages: { quantity: number; cost: number };
  totalCost: number;
}> {
  // Get usage records for current billing period
  const subscriptions = await getCustomerSubscriptions(customerId);
  
  let aiTokens = { quantity: 0, cost: 0 };
  let smsMessages = { quantity: 0, cost: 0 };

  for (const subscription of subscriptions) {
    const stripeSubscription = await stripe.subscriptions.retrieve(subscription.id, {
      expand: ['items.data.price']
    });

    for (const item of stripeSubscription.items.data) {
      const currentPeriodStart = Math.floor(subscription.currentPeriodStart.getTime() / 1000);
      
      const usage = await stripe.subscriptionItems.listUsageRecordSummaries(item.id, {
        limit: 100
      });

      const totalQuantity = usage.data.reduce((sum, record) => sum + record.total_usage, 0);
      const unitAmount = (item.price.unit_amount || 0) / 100; // Convert cents to dollars

      if (item.price.id === PRICING_CONFIG.AI_AGENTS.priceId) {
        aiTokens = { 
          quantity: totalQuantity, 
          cost: (totalQuantity * unitAmount) / 1000 // Per 1K tokens
        };
      } else if (item.price.id === PRICING_CONFIG.SMS_NOTIFICATIONS.priceId) {
        smsMessages = { 
          quantity: totalQuantity, 
          cost: totalQuantity * unitAmount 
        };
      }
    }
  }

  return {
    aiTokens,
    smsMessages,
    totalCost: aiTokens.cost + smsMessages.cost
  };
}

/**
 * Handle Stripe webhook events
 */
export async function handleWebhookEvent(event: Stripe.Event): Promise<void> {
  console.log(`Processing Stripe webhook: ${event.type}`);

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      const subscription = event.data.object as Stripe.Subscription;
      // Update your database with subscription changes
      console.log(`Subscription ${event.type}: ${subscription.id}`);
      break;

    case 'invoice.payment_succeeded':
      const invoice = event.data.object as Stripe.Invoice;
      console.log(`Payment succeeded for invoice: ${invoice.id}`);
      break;

    case 'invoice.payment_failed':
      const failedInvoice = event.data.object as Stripe.Invoice;
      console.log(`Payment failed for invoice: ${failedInvoice.id}`);
      // Handle failed payment (send notification, suspend service, etc.)
      break;

    default:
      console.log(`Unhandled webhook event type: ${event.type}`);
  }
}

/**
 * Check if customer has active subscription for a specific price
 */
export async function hasActiveSubscription(customerId: string, priceId: string): Promise<boolean> {
  const subscriptions = await getCustomerSubscriptions(customerId);
  return subscriptions.some(sub => sub.priceId === priceId && sub.status === 'active');
}

/**
 * Get customer's current tier and usage limits
 */
export async function getCustomerTier(customerId: string): Promise<{
  tier: 'free' | 'ai_agents' | 'enterprise';
  features: string[];
  usage: {
    aiTokens: number;
    smsMessages: number;
    monthlyCost: number;
  };
}> {
  const subscriptions = await getCustomerSubscriptions(customerId);
  const usageCosts = await getUsageCosts(customerId);

  // Determine tier based on active subscriptions
  const hasEnterprise = subscriptions.some(sub => sub.priceId === PRICING_CONFIG.ENTERPRISE.priceId);
  const hasAIAgents = subscriptions.some(sub => sub.priceId === PRICING_CONFIG.AI_AGENTS.priceId);

  if (hasEnterprise) {
    return {
      tier: 'enterprise',
      features: PRICING_CONFIG.ENTERPRISE.features,
      usage: {
        aiTokens: usageCosts.aiTokens.quantity,
        smsMessages: usageCosts.smsMessages.quantity,
        monthlyCost: usageCosts.totalCost
      }
    };
  } else if (hasAIAgents) {
    return {
      tier: 'ai_agents',
      features: PRICING_CONFIG.AI_AGENTS.features,
      usage: {
        aiTokens: usageCosts.aiTokens.quantity,
        smsMessages: usageCosts.smsMessages.quantity,
        monthlyCost: usageCosts.totalCost
      }
    };
  }

  // Default to free tier
  return {
    tier: 'free',
    features: PRICING_CONFIG.FREE.features,
    usage: {
      aiTokens: 0,
      smsMessages: 0,
      monthlyCost: 0
    }
  };
}

export default stripe;