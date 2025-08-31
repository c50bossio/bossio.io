import Stripe from 'stripe';

// Initialize Stripe with secret key
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is required');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
});

export interface StripeSubscription {
  id: string;
  customerId: string;
  status: Stripe.Subscription.Status;
  priceId: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  amount: number;
  currency: string;
  metadata?: Record<string, string>;
}

export interface StripePaymentMethod {
  id: string;
  type: string;
  card?: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  };
  isDefault: boolean;
}

export interface StripeInvoice {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created: number;
  paidAt?: number;
  description?: string;
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
    priceId: process.env.STRIPE_AI_PRICE_ID!,
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
    priceId: process.env.STRIPE_SMS_PRICE_ID!,
    unitAmount: 1, // $0.01 per message
    currency: 'usd',
    billingScheme: 'per_unit' as const,
    usageType: 'metered' as const
  },

  // Enterprise tier
  ENTERPRISE: {
    name: "Enterprise",
    priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID!,
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

/**
 * Payment Method Management
 */

/**
 * Get customer's payment methods
 */
export async function getCustomerPaymentMethods(customerId: string): Promise<StripePaymentMethod[]> {
  const paymentMethods = await stripe.paymentMethods.list({
    customer: customerId,
    type: 'card',
  });

  // Get default payment method
  const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
  const defaultPaymentMethodId = customer.invoice_settings.default_payment_method as string;

  return paymentMethods.data.map(pm => ({
    id: pm.id,
    type: pm.type,
    card: pm.card ? {
      brand: pm.card.brand,
      last4: pm.card.last4,
      expMonth: pm.card.exp_month,
      expYear: pm.card.exp_year,
    } : undefined,
    isDefault: pm.id === defaultPaymentMethodId
  }));
}

/**
 * Add a new payment method to customer
 */
export async function addPaymentMethod(
  customerId: string, 
  paymentMethodId: string,
  setAsDefault: boolean = false
): Promise<Stripe.PaymentMethod> {
  // Attach payment method to customer
  const paymentMethod = await stripe.paymentMethods.attach(paymentMethodId, {
    customer: customerId,
  });

  // Set as default if requested
  if (setAsDefault) {
    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });
  }

  return paymentMethod;
}

/**
 * Remove payment method
 */
export async function removePaymentMethod(paymentMethodId: string): Promise<void> {
  await stripe.paymentMethods.detach(paymentMethodId);
}

/**
 * Set default payment method
 */
export async function setDefaultPaymentMethod(customerId: string, paymentMethodId: string): Promise<void> {
  await stripe.customers.update(customerId, {
    invoice_settings: {
      default_payment_method: paymentMethodId,
    },
  });
}

/**
 * Subscription Management
 */

/**
 * Cancel subscription
 */
export async function cancelSubscription(
  subscriptionId: string, 
  atPeriodEnd: boolean = true,
  reason?: string
): Promise<Stripe.Subscription> {
  if (atPeriodEnd) {
    return await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
      metadata: {
        cancellation_reason: reason || 'user_requested',
        cancelled_at: new Date().toISOString(),
      },
    });
  } else {
    return await stripe.subscriptions.cancel(subscriptionId, {
      invoice_now: true,
      prorate: true,
    });
  }
}

/**
 * Reactivate canceled subscription
 */
export async function reactivateSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
  return await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
    metadata: {
      reactivated_at: new Date().toISOString(),
    },
  });
}

/**
 * Update subscription (change plan)
 */
export async function updateSubscription(
  subscriptionId: string,
  newPriceId: string,
  prorationBehavior: 'create_prorations' | 'none' | 'always_invoice' = 'create_prorations'
): Promise<Stripe.Subscription> {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  
  return await stripe.subscriptions.update(subscriptionId, {
    items: [{
      id: subscription.items.data[0].id,
      price: newPriceId,
    }],
    proration_behavior: prorationBehavior,
  });
}

/**
 * Invoice and Payment Management
 */

/**
 * Create one-time payment intent (for booking deposits, etc.)
 */
export async function createPaymentIntent(
  amount: number,
  currency: string = 'usd',
  customerId?: string,
  metadata?: Record<string, string>
): Promise<Stripe.PaymentIntent> {
  const params: Stripe.PaymentIntentCreateParams = {
    amount: Math.round(amount * 100), // Convert to cents
    currency,
    automatic_payment_methods: {
      enabled: true,
    },
    metadata: {
      platform: 'bossio',
      ...metadata,
    },
  };

  if (customerId) {
    params.customer = customerId;
  }

  return await stripe.paymentIntents.create(params);
}

/**
 * Get customer invoices
 */
export async function getCustomerInvoices(customerId: string, limit: number = 10): Promise<StripeInvoice[]> {
  const invoices = await stripe.invoices.list({
    customer: customerId,
    limit,
    expand: ['data.charge'],
  });

  return invoices.data.map(invoice => ({
    id: invoice.id,
    amount: invoice.amount_paid || invoice.amount_due,
    currency: invoice.currency,
    status: invoice.status || 'unknown',
    created: invoice.created,
    paidAt: invoice.status_transitions?.paid_at || undefined,
    description: invoice.description || undefined,
  }));
}

/**
 * Refund payment
 */
export async function createRefund(
  paymentIntentId: string,
  amount?: number,
  reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer',
  metadata?: Record<string, string>
): Promise<Stripe.Refund> {
  const params: Stripe.RefundCreateParams = {
    payment_intent: paymentIntentId,
    reason,
    metadata: {
      platform: 'bossio',
      refund_requested_at: new Date().toISOString(),
      ...metadata,
    },
  };

  if (amount) {
    params.amount = Math.round(amount * 100); // Convert to cents
  }

  return await stripe.refunds.create(params);
}

/**
 * Advanced Webhook Verification
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string,
  secret?: string
): Stripe.Event {
  const webhookSecret = secret || process.env.STRIPE_WEBHOOK_SECRET;
  
  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is required for webhook verification');
  }

  try {
    return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    throw new Error('Webhook signature verification failed');
  }
}

/**
 * Enhanced webhook handler with comprehensive event processing
 */
export async function handleAdvancedWebhookEvent(event: Stripe.Event, userId?: string): Promise<void> {
  console.log(`Processing Stripe webhook: ${event.type}`);

  try {
    switch (event.type) {
      case 'customer.subscription.created':
        const newSub = event.data.object as Stripe.Subscription;
        console.log(`New subscription created: ${newSub.id} for customer: ${newSub.customer}`);
        // TODO: Save subscription to database
        break;

      case 'customer.subscription.updated':
        const updatedSub = event.data.object as Stripe.Subscription;
        console.log(`Subscription updated: ${updatedSub.id}, status: ${updatedSub.status}`);
        // TODO: Update subscription in database
        break;

      case 'customer.subscription.deleted':
        const deletedSub = event.data.object as Stripe.Subscription;
        console.log(`Subscription deleted: ${deletedSub.id}`);
        // TODO: Update subscription status in database
        break;

      case 'invoice.payment_succeeded':
        const paidInvoice = event.data.object as Stripe.Invoice;
        console.log(`Payment succeeded for invoice: ${paidInvoice.id}, amount: ${paidInvoice.amount_paid}`);
        // TODO: Update payment status, send confirmation email
        break;

      case 'invoice.payment_failed':
        const failedInvoice = event.data.object as Stripe.Invoice;
        console.log(`Payment failed for invoice: ${failedInvoice.id}`);
        // TODO: Handle failed payment, send notification, update subscription status
        break;

      case 'payment_intent.succeeded':
        const successfulPI = event.data.object as Stripe.PaymentIntent;
        console.log(`One-time payment succeeded: ${successfulPI.id}, amount: ${successfulPI.amount}`);
        // TODO: Update booking/order status
        break;

      case 'payment_intent.payment_failed':
        const failedPI = event.data.object as Stripe.PaymentIntent;
        console.log(`Payment failed: ${failedPI.id}, error: ${failedPI.last_payment_error?.message}`);
        // TODO: Handle failed payment, notify user
        break;

      case 'customer.created':
        const customer = event.data.object as Stripe.Customer;
        console.log(`New customer created: ${customer.id}, email: ${customer.email}`);
        break;

      case 'customer.updated':
        const updatedCustomer = event.data.object as Stripe.Customer;
        console.log(`Customer updated: ${updatedCustomer.id}`);
        break;

      case 'payment_method.attached':
        const attachedPM = event.data.object as Stripe.PaymentMethod;
        console.log(`Payment method attached: ${attachedPM.id} to customer: ${attachedPM.customer}`);
        break;

      case 'setup_intent.succeeded':
        const setupIntent = event.data.object as Stripe.SetupIntent;
        console.log(`Setup intent succeeded: ${setupIntent.id}`);
        // Payment method saved successfully
        break;

      default:
        console.log(`Unhandled webhook event type: ${event.type}`);
    }
  } catch (error) {
    console.error(`Error processing webhook event ${event.type}:`, error);
    throw error;
  }
}

/**
 * Reporting and Analytics
 */

/**
 * Get revenue analytics for a date range
 */
export async function getRevenueAnalytics(
  customerId?: string,
  startDate?: Date,
  endDate?: Date
): Promise<{
  totalRevenue: number;
  subscriptionRevenue: number;
  oneTimeRevenue: number;
  refunds: number;
  netRevenue: number;
}> {
  const params: any = {
    limit: 100,
  };

  if (customerId) {
    params.customer = customerId;
  }

  if (startDate) {
    params.created = { gte: Math.floor(startDate.getTime() / 1000) };
  }

  if (endDate) {
    params.created = { 
      ...params.created, 
      lte: Math.floor(endDate.getTime() / 1000) 
    };
  }

  // Get charges
  const charges = await stripe.charges.list(params);
  
  // Get refunds
  const refunds = await stripe.refunds.list(params);

  let subscriptionRevenue = 0;
  let oneTimeRevenue = 0;
  let totalRefunds = 0;

  // Calculate subscription vs one-time revenue
  for (const charge of charges.data) {
    if (charge.invoice) {
      subscriptionRevenue += charge.amount;
    } else {
      oneTimeRevenue += charge.amount;
    }
  }

  // Calculate total refunds
  totalRefunds = refunds.data.reduce((sum, refund) => sum + refund.amount, 0);

  const totalRevenue = subscriptionRevenue + oneTimeRevenue;
  const netRevenue = totalRevenue - totalRefunds;

  return {
    totalRevenue: totalRevenue / 100, // Convert from cents
    subscriptionRevenue: subscriptionRevenue / 100,
    oneTimeRevenue: oneTimeRevenue / 100,
    refunds: totalRefunds / 100,
    netRevenue: netRevenue / 100,
  };
}

/**
 * Setup Intents for Payment Method Collection
 */
export async function createSetupIntent(customerId: string): Promise<Stripe.SetupIntent> {
  return await stripe.setupIntents.create({
    customer: customerId,
    payment_method_types: ['card'],
    usage: 'off_session',
  });
}

/**
 * Utility Functions
 */

/**
 * Format currency amount for display
 */
export function formatCurrency(amount: number, currency: string = 'usd'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount);
}

/**
 * Check if environment variables are configured
 */
export function validateStripeConfig(): { isValid: boolean; missingVars: string[] } {
  const requiredVars = [
    'STRIPE_SECRET_KEY',
    'NEXT_PUBLIC_STRIPE_PUBLIC_KEY',
    'STRIPE_WEBHOOK_SECRET',
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  return {
    isValid: missingVars.length === 0,
    missingVars,
  };
}

export default stripe;