#!/usr/bin/env tsx

/**
 * Stripe Products and Prices Setup Script
 * 
 * This script creates all the necessary products and prices in Stripe
 * for the bossio.io barbershop booking system.
 * 
 * Run with: npx tsx scripts/setup-stripe-products.ts
 */

import { config } from 'dotenv';
import Stripe from 'stripe';

// Load environment variables
config({ path: '.env.local' });

if (!process.env.STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY not found in environment variables');
  process.exit(1);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
});

// Product and price definitions based on PRICING_CONFIG
const PRODUCTS_CONFIG = {
  AI_AGENTS: {
    name: 'AI Business Coaching',
    description: 'AI-powered business coaching and analytics for barbershop owners',
    metadata: {
      tier: 'ai_agents',
      platform: 'bossio'
    },
    price: {
      unit_amount: 4, // $0.04 per 1K tokens
      currency: 'usd',
      recurring: {
        interval: 'month',
        usage_type: 'metered',
        billing_scheme: 'per_unit',
      },
      metadata: {
        usage_type: 'ai_tokens',
        unit: 'per_1k_tokens'
      }
    }
  },
  SMS_NOTIFICATIONS: {
    name: 'SMS Notifications',
    description: 'SMS notification service for appointment reminders and updates',
    metadata: {
      tier: 'sms',
      platform: 'bossio'
    },
    price: {
      unit_amount: 1, // $0.01 per message
      currency: 'usd',
      recurring: {
        interval: 'month',
        usage_type: 'metered',
        billing_scheme: 'per_unit',
      },
      metadata: {
        usage_type: 'sms_messages',
        unit: 'per_message'
      }
    }
  },
  ENTERPRISE: {
    name: 'Enterprise Plan',
    description: 'Complete enterprise solution for multi-location barbershop chains',
    metadata: {
      tier: 'enterprise',
      platform: 'bossio'
    },
    price: {
      unit_amount: 49900, // $499/month
      currency: 'usd',
      recurring: {
        interval: 'month',
        usage_type: 'licensed',
        billing_scheme: 'per_unit',
      },
      metadata: {
        usage_type: 'licensed',
        unit: 'per_month'
      }
    }
  }
};

async function createProductsAndPrices() {
  console.log('🚀 Starting Stripe products and prices setup...\n');

  const results: Record<string, { productId: string; priceId: string }> = {};

  for (const [key, config] of Object.entries(PRODUCTS_CONFIG)) {
    try {
      console.log(`📦 Creating product: ${config.name}...`);
      
      // Create product
      const product = await stripe.products.create({
        name: config.name,
        description: config.description,
        metadata: config.metadata
      });

      console.log(`✅ Product created: ${product.id}`);

      // Create price
      console.log(`💰 Creating price for ${config.name}...`);
      
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: config.price.unit_amount,
        currency: config.price.currency,
        recurring: config.price.recurring,
        billing_scheme: config.price.billing_scheme,
        metadata: config.price.metadata
      });

      console.log(`✅ Price created: ${price.id}`);
      console.log(`   Unit amount: $${(config.price.unit_amount / 100).toFixed(2)}`);
      console.log(`   Billing: ${config.price.recurring?.usage_type} - ${config.price.recurring?.interval}ly\n`);

      results[key] = {
        productId: product.id,
        priceId: price.id
      };

    } catch (error) {
      console.error(`❌ Error creating ${config.name}:`, error);
      if (error instanceof Stripe.errors.StripeError) {
        console.error(`   Code: ${error.code}`);
        console.error(`   Message: ${error.message}`);
      }
      process.exit(1);
    }
  }

  return results;
}

async function generateEnvVariables(results: Record<string, { productId: string; priceId: string }>) {
  console.log('\n📝 Environment variables for your .env file:\n');
  console.log('# Stripe Product and Price IDs');
  
  if (results.AI_AGENTS) {
    console.log(`STRIPE_AI_PRICE_ID=${results.AI_AGENTS.priceId}`);
  }
  
  if (results.SMS_NOTIFICATIONS) {
    console.log(`STRIPE_SMS_PRICE_ID=${results.SMS_NOTIFICATIONS.priceId}`);
  }
  
  if (results.ENTERPRISE) {
    console.log(`STRIPE_ENTERPRISE_PRICE_ID=${results.ENTERPRISE.priceId}`);
  }

  console.log('\n📋 Summary:');
  for (const [key, data] of Object.entries(results)) {
    console.log(`${key}:`);
    console.log(`  Product ID: ${data.productId}`);
    console.log(`  Price ID: ${data.priceId}`);
  }
}

async function validateStripeConnection() {
  try {
    console.log('🔌 Testing Stripe connection...');
    const account = await stripe.accounts.retrieve();
    console.log(`✅ Connected to Stripe account: ${account.id}`);
    console.log(`   Business name: ${account.business_profile?.name || 'Not set'}`);
    console.log(`   Country: ${account.country}`);
    console.log(`   Charges enabled: ${account.charges_enabled}`);
    console.log(`   Details submitted: ${account.details_submitted}\n`);
    return true;
  } catch (error) {
    console.error('❌ Failed to connect to Stripe:', error);
    if (error instanceof Stripe.errors.StripeError) {
      console.error(`   Code: ${error.code}`);
      console.error(`   Message: ${error.message}`);
    }
    return false;
  }
}

async function checkExistingProducts() {
  try {
    console.log('🔍 Checking for existing products...');
    const products = await stripe.products.list({
      limit: 100,
      active: true
    });

    const existingProducts = products.data.filter(product => 
      product.metadata.platform === 'bossio'
    );

    if (existingProducts.length > 0) {
      console.log(`⚠️  Found ${existingProducts.length} existing bossio products:`);
      for (const product of existingProducts) {
        console.log(`   - ${product.name} (${product.id})`);
      }
      
      console.log('\n❓ Do you want to continue? This will create duplicate products.');
      console.log('   Consider deleting existing products first or using --force flag');
      
      // In a real scenario, you might want to prompt the user
      // For now, we'll continue but warn
      console.log('   Continuing with setup...\n');
    }
  } catch (error) {
    console.error('⚠️  Could not check existing products:', error);
    console.log('   Continuing with setup anyway...\n');
  }
}

async function setupWebhookEndpoint() {
  try {
    console.log('🪝 Setting up webhook endpoint...');
    
    const webhookEndpoint = await stripe.webhookEndpoints.create({
      url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://bossio.io'}/api/stripe/webhook`,
      enabled_events: [
        'customer.subscription.created',
        'customer.subscription.updated',
        'customer.subscription.deleted',
        'invoice.payment_succeeded',
        'invoice.payment_failed',
        'payment_intent.succeeded',
        'payment_intent.payment_failed',
        'customer.created',
        'customer.updated',
        'payment_method.attached',
        'setup_intent.succeeded'
      ],
      metadata: {
        platform: 'bossio',
        environment: process.env.NODE_ENV || 'development'
      }
    });

    console.log(`✅ Webhook endpoint created: ${webhookEndpoint.id}`);
    console.log(`   URL: ${webhookEndpoint.url}`);
    console.log(`   Secret: ${webhookEndpoint.secret} (save this to STRIPE_WEBHOOK_SECRET)\n`);
    
    return webhookEndpoint;
  } catch (error) {
    console.error('❌ Failed to create webhook endpoint:', error);
    if (error instanceof Stripe.errors.StripeError) {
      console.error(`   Code: ${error.code}`);
      console.error(`   Message: ${error.message}`);
    }
    return null;
  }
}

// Main execution
async function main() {
  console.log('🎯 Bossio.io Stripe Setup Script\n');

  // Step 1: Validate connection
  const connectionValid = await validateStripeConnection();
  if (!connectionValid) {
    process.exit(1);
  }

  // Step 2: Check existing products
  await checkExistingProducts();

  // Step 3: Create products and prices
  const results = await createProductsAndPrices();

  // Step 4: Setup webhook
  const webhook = await setupWebhookEndpoint();

  // Step 5: Generate environment variables
  await generateEnvVariables(results);

  if (webhook) {
    console.log('\n🪝 Additional environment variable:');
    console.log(`STRIPE_WEBHOOK_SECRET=${webhook.secret}`);
  }

  console.log('\n🎉 Stripe setup complete!');
  console.log('\n📋 Next steps:');
  console.log('1. Copy the environment variables above to your .env.local file');
  console.log('2. Update your .env.production file for production deployment');
  console.log('3. Test the integration with npm run dev');
  console.log('4. Verify webhook endpoint is accessible from the internet');
  console.log('\n💡 Pro tip: Use Stripe CLI for local webhook testing:');
  console.log('   stripe listen --forward-to localhost:3000/api/stripe/webhook');
}

// Handle command line arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log('Bossio.io Stripe Setup Script');
  console.log('');
  console.log('Usage: npx tsx scripts/setup-stripe-products.ts [options]');
  console.log('');
  console.log('Options:');
  console.log('  --help, -h     Show this help message');
  console.log('  --force        Skip existing product check');
  console.log('');
  console.log('Environment variables required:');
  console.log('  STRIPE_SECRET_KEY        Your Stripe secret key');
  console.log('  NEXT_PUBLIC_APP_URL      Your app URL for webhooks');
  console.log('');
  process.exit(0);
}

// Run the setup
if (require.main === module) {
  main().catch((error) => {
    console.error('\n💥 Setup failed:', error);
    process.exit(1);
  });
}

export { main as setupStripeProducts };