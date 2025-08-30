"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Zap, Crown, Building2, ArrowRight } from "lucide-react";
import { useState } from "react";
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY || 'pk_test_placeholder');

interface PricingTier {
  id: string;
  name: string;
  description: string;
  price: string;
  billingDetails: string;
  popular?: boolean;
  icon: React.ReactNode;
  features: string[];
  limitations?: string[];
  buttonText: string;
  buttonVariant: "default" | "outline" | "secondary";
}

const pricingTiers: PricingTier[] = [
  {
    id: 'free',
    name: 'Insights Free',
    description: 'Complete business intelligence at no cost',
    price: '$0',
    billingDetails: 'forever',
    icon: <Zap className="h-6 w-6 text-blue-600" />,
    features: [
      'Business Intelligence Dashboard',
      'Client & Service Management',
      'Analytics & Reporting', 
      'Calendar Integration',
      'Basic Email Notifications',
      'Up to 100 clients',
      'Up to 10 services',
      '5 monthly reports'
    ],
    buttonText: 'Start Free',
    buttonVariant: 'outline'
  },
  {
    id: 'ai_agents',
    name: 'AI Business Coach',
    description: 'Pay-as-you-grow AI business coaching',
    price: '$0.04',
    billingDetails: 'per 1,000 AI tokens',
    popular: true,
    icon: <Zap className="h-6 w-6 text-primary" />,
    features: [
      'Everything in Insights Free',
      'AI Business Coaching & Strategy',
      'Smart Recommendations Engine',
      'Predictive Analytics',
      'Advanced Business Intelligence',
      'SMS Notifications ($0.01/message)',
      'Email Marketing Automation',
      'Custom Business Reports',
      'Priority Email Support'
    ],
    limitations: [
      'Usage-based billing for AI features',
      'SMS charges apply separately'
    ],
    buttonText: 'Launch AI Agents',
    buttonVariant: 'default'
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Multi-location business management',
    price: '$499',
    billingDetails: 'per month',
    icon: <Building2 className="h-6 w-6 text-orange-600" />,
    features: [
      'Everything in AI Business Coach',
      'Multi-Location Management',
      'Advanced API Access',
      'Custom Integrations',
      'Dedicated Account Manager',
      'Priority Phone & Chat Support',
      'Custom Feature Development',
      'White-label Options',
      'Advanced Security & Compliance',
      'Custom Reporting & Analytics'
    ],
    buttonText: 'Contact Sales',
    buttonVariant: 'outline'
  }
];

interface EnhancedPricingProps {
  userTier?: 'free' | 'ai_agents' | 'enterprise';
  currentUsage?: {
    aiTokens: number;
    smsMessages: number;
    monthlyCost: number;
  };
}

export default function EnhancedPricing({ userTier = 'free', currentUsage }: EnhancedPricingProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async (tierId: string) => {
    if (tierId === 'free') {
      // Redirect to dashboard for free tier
      window.location.href = '/dashboard';
      return;
    }

    if (tierId === 'enterprise') {
      // Open contact form or email
      window.location.href = 'mailto:sales@bossio.io?subject=Enterprise Inquiry';
      return;
    }

    setLoading(tierId);
    
    try {
      // For AI Agents, we create a usage-based subscription
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tierId,
          successUrl: `${window.location.origin}/dashboard?subscription=success`,
          cancelUrl: window.location.href,
        }),
      });

      const { sessionId } = await response.json();
      const stripe = await stripePromise;
      
      if (stripe) {
        const { error } = await stripe.redirectToCheckout({ sessionId });
        if (error) {
          console.error('Stripe checkout error:', error);
        }
      }
    } catch (error) {
      console.error('Subscription error:', error);
    } finally {
      setLoading(null);
    }
  };

  return (
    <section className="w-full py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">
            Insights Free, Agents Paid
          </h2>
          <p className="text-xl text-muted-foreground mb-6">
            Get complete business intelligence for free. Pay only for AI coaching that grows your business.
          </p>
          
          {/* Current Usage Display */}
          {userTier !== 'free' && currentUsage && (
            <div className="inline-flex items-center gap-4 px-6 py-3 bg-muted rounded-lg">
              <div className="text-center">
                <div className="font-semibold text-primary">{currentUsage.aiTokens.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">AI Tokens Used</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-primary">{currentUsage.smsMessages}</div>
                <div className="text-xs text-muted-foreground">SMS Sent</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-green-600">${currentUsage.monthlyCost.toFixed(2)}</div>
                <div className="text-xs text-muted-foreground">This Month</div>
              </div>
            </div>
          )}
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {pricingTiers.map((tier) => (
            <Card 
              key={tier.id} 
              className={`relative h-fit ${tier.popular ? 'border-primary shadow-lg' : ''} ${userTier === tier.id ? 'ring-2 ring-primary' : ''}`}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground px-4 py-1">
                    Most Popular
                  </Badge>
                </div>
              )}

              {userTier === tier.id && (
                <div className="absolute -top-3 right-4">
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Current Plan
                  </Badge>
                </div>
              )}

              <CardHeader className="pb-4">
                <div className="flex items-center gap-3 mb-2">
                  {tier.icon}
                  <CardTitle className="text-xl">{tier.name}</CardTitle>
                </div>
                <CardDescription className="text-base">
                  {tier.description}
                </CardDescription>
                <div className="mt-4">
                  <span className="text-3xl font-bold">{tier.price}</span>
                  <span className="text-muted-foreground ml-2">/{tier.billingDetails}</span>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {tier.features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
                
                {tier.limitations && tier.limitations.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Usage Notes:</p>
                    {tier.limitations.map((limitation, index) => (
                      <p key={index} className="text-xs text-muted-foreground">• {limitation}</p>
                    ))}
                  </div>
                )}
              </CardContent>

              <CardFooter>
                <Button
                  className="w-full"
                  variant={tier.buttonVariant}
                  onClick={() => handleSubscribe(tier.id)}
                  disabled={loading === tier.id || userTier === tier.id}
                >
                  {loading === tier.id ? (
                    "Processing..."
                  ) : userTier === tier.id ? (
                    "Current Plan"
                  ) : (
                    <>
                      {tier.buttonText}
                      {tier.id !== 'free' && <ArrowRight className="ml-2 h-4 w-4" />}
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Value Proposition */}
        <div className="mt-16 text-center">
          <h3 className="text-2xl font-semibold mb-6">Why Choose Bossio.io?</h3>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h4 className="font-semibold mb-2">AI-Powered Growth</h4>
              <p className="text-sm text-muted-foreground">
                Intelligent business coaching that learns from your data and provides actionable recommendations for revenue optimization.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Crown className="h-6 w-6 text-primary" />
              </div>
              <h4 className="font-semibold mb-2">Own Your Data</h4>
              <p className="text-sm text-muted-foreground">
                Build your business empire, not someone else's. Complete business intelligence and customer insights that belong to you.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <h4 className="font-semibold mb-2">Scale With Confidence</h4>
              <p className="text-sm text-muted-foreground">
                From solo entrepreneur to multi-location enterprise, our platform grows with your business ambitions.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <p className="text-muted-foreground mb-4">
            Questions about pricing? <a href="mailto:support@bossio.io" className="text-primary hover:underline">Contact our team</a>
          </p>
          <p className="text-sm text-muted-foreground">
            All plans include 14-day free trial • No setup fees • Cancel anytime
          </p>
        </div>
      </div>
    </section>
  );
}