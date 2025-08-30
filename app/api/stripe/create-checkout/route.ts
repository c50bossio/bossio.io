import { NextRequest, NextResponse } from 'next/server';
import { createCheckoutSession, createCustomer, PRICING_CONFIG } from '@/lib/stripe-service';

export async function POST(request: NextRequest) {
  try {
    const { tierId, successUrl, cancelUrl, customerEmail, customerName } = await request.json();

    if (!tierId || !successUrl || !cancelUrl) {
      return NextResponse.json(
        { error: 'Missing required fields: tierId, successUrl, cancelUrl' },
        { status: 400 }
      );
    }

    // Get price ID based on tier
    let priceId: string;
    
    switch (tierId) {
      case 'ai_agents':
        priceId = PRICING_CONFIG.AI_AGENTS.priceId;
        break;
      case 'enterprise':
        priceId = PRICING_CONFIG.ENTERPRISE.priceId;
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid tier ID' },
          { status: 400 }
        );
    }

    // Create or get customer
    let customerId: string;
    
    if (customerEmail && customerName) {
      const customer = await createCustomer(customerEmail, customerName, {
        tier: tierId,
        source: 'bossio_pricing_page'
      });
      customerId = customer.id;
    } else {
      // For demo purposes, create a temporary customer
      const tempCustomer = await createCustomer(
        'demo@bossio.io', 
        'Demo User',
        { 
          tier: tierId,
          source: 'bossio_pricing_demo' 
        }
      );
      customerId = tempCustomer.id;
    }

    // Create checkout session
    const session = await createCheckoutSession(
      customerId,
      priceId,
      successUrl,
      cancelUrl,
      'subscription'
    );

    return NextResponse.json({
      sessionId: session.id,
      url: session.url
    });

  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}