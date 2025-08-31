#!/usr/bin/env tsx

/**
 * Deployment Checklist Script
 * 
 * Verifies all required environment variables and configurations
 * for production deployment of bossio.io barbershop booking system.
 * 
 * Run with: npx tsx scripts/deployment-checklist.ts
 */

import { config } from 'dotenv';
import { existsSync } from 'fs';
import { join } from 'path';

// Load environment variables from different sources
const envFiles = ['.env.local', '.env.production', '.env'];
for (const file of envFiles) {
  if (existsSync(file)) {
    config({ path: file });
    console.log(`📁 Loaded environment variables from: ${file}`);
  }
}

// Environment variable categories and requirements
const ENV_REQUIREMENTS = {
  CORE: {
    name: '🎯 Core Application',
    required: [
      { key: 'NEXT_PUBLIC_APP_URL', description: 'Frontend application URL', example: 'https://bossio.io' },
      { key: 'DATABASE_URL', description: 'PostgreSQL connection string', example: 'postgres://user:pass@host:5432/db' },
      { key: 'BETTER_AUTH_SECRET', description: 'Authentication secret key', example: 'your-secret-key-32-chars-min' }
    ],
    optional: []
  },
  AUTHENTICATION: {
    name: '🔐 Authentication (OAuth)',
    required: [],
    optional: [
      { key: 'GOOGLE_CLIENT_ID', description: 'Google OAuth client ID', example: 'your-client-id.googleusercontent.com' },
      { key: 'GOOGLE_CLIENT_SECRET', description: 'Google OAuth client secret', example: 'your-client-secret' }
    ]
  },
  PAYMENTS: {
    name: '💳 Payment Processing (Stripe)',
    required: [
      { key: 'STRIPE_SECRET_KEY', description: 'Stripe secret key', example: 'sk_live_...' },
      { key: 'NEXT_PUBLIC_STRIPE_PUBLIC_KEY', description: 'Stripe publishable key', example: 'pk_live_...' },
      { key: 'STRIPE_WEBHOOK_SECRET', description: 'Stripe webhook secret', example: 'whsec_...' }
    ],
    optional: [
      { key: 'STRIPE_AI_PRICE_ID', description: 'AI agents price ID', example: 'price_...' },
      { key: 'STRIPE_SMS_PRICE_ID', description: 'SMS notifications price ID', example: 'price_...' },
      { key: 'STRIPE_ENTERPRISE_PRICE_ID', description: 'Enterprise plan price ID', example: 'price_...' }
    ]
  },
  PAYMENTS_ALTERNATIVE: {
    name: '💰 Alternative Payments (Polar)',
    required: [],
    optional: [
      { key: 'POLAR_ACCESS_TOKEN', description: 'Polar API access token', example: 'polar_...' },
      { key: 'POLAR_SUCCESS_URL', description: 'Polar checkout success URL', example: '/success?checkout_id={CHECKOUT_ID}' },
      { key: 'POLAR_WEBHOOK_SECRET', description: 'Polar webhook secret', example: 'whsec_...' }
    ]
  },
  SUBSCRIPTIONS: {
    name: '📊 Subscription Tiers',
    required: [],
    optional: [
      { key: 'NEXT_PUBLIC_STARTER_TIER', description: 'Starter tier configuration', example: 'true' },
      { key: 'NEXT_PUBLIC_STARTER_SLUG', description: 'Starter tier slug', example: 'starter' }
    ]
  },
  NOTIFICATIONS: {
    name: '📱 Notification Services',
    required: [],
    optional: [
      { key: 'TWILIO_ACCOUNT_SID', description: 'Twilio account SID', example: 'AC...' },
      { key: 'TWILIO_AUTH_TOKEN', description: 'Twilio auth token', example: 'your-auth-token' },
      { key: 'TWILIO_PHONE_NUMBER', description: 'Twilio phone number', example: '+1234567890' },
      { key: 'SENDGRID_API_KEY', description: 'SendGrid API key', example: 'SG...' },
      { key: 'SENDGRID_FROM_EMAIL', description: 'SendGrid from email', example: 'notifications@bossio.io' },
      { key: 'SENDGRID_FROM_NAME', description: 'SendGrid from name', example: 'BookedBarber' }
    ]
  },
  STORAGE: {
    name: '☁️ File Storage (Cloudflare R2)',
    required: [],
    optional: [
      { key: 'R2_UPLOAD_IMAGE_ACCESS_KEY_ID', description: 'R2 access key ID', example: 'your-access-key' },
      { key: 'R2_UPLOAD_IMAGE_SECRET_ACCESS_KEY', description: 'R2 secret access key', example: 'your-secret-key' },
      { key: 'CLOUDFLARE_ACCOUNT_ID', description: 'Cloudflare account ID', example: 'your-account-id' },
      { key: 'R2_UPLOAD_IMAGE_BUCKET_NAME', description: 'R2 bucket name', example: 'images' }
    ]
  },
  AI: {
    name: '🤖 AI Services',
    required: [],
    optional: [
      { key: 'OPENAI_API_KEY', description: 'OpenAI API key', example: 'sk-...' }
    ]
  },
  SECURITY: {
    name: '🛡️ Security & Monitoring',
    required: [],
    optional: [
      { key: 'CRON_SECRET', description: 'Cron job secret for Vercel', example: 'your-random-secret' }
    ]
  }
};

interface ValidationResult {
  category: string;
  key: string;
  status: 'present' | 'missing' | 'empty';
  isRequired: boolean;
  value?: string;
  description: string;
  example?: string;
}

function validateEnvironmentVariable(key: string, isRequired: boolean, description: string, example?: string): ValidationResult {
  const value = process.env[key];
  
  let status: 'present' | 'missing' | 'empty';
  if (value === undefined) {
    status = 'missing';
  } else if (value.trim() === '') {
    status = 'empty';
  } else {
    status = 'present';
  }

  return {
    category: '',
    key,
    status,
    isRequired,
    value: status === 'present' ? value : undefined,
    description,
    example
  };
}

function validateCategory(categoryKey: string, category: typeof ENV_REQUIREMENTS.CORE) {
  console.log(`\n${category.name}`);
  console.log('='.repeat(50));

  const results: ValidationResult[] = [];

  // Check required variables
  for (const env of category.required) {
    const result = validateEnvironmentVariable(env.key, true, env.description, env.example);
    result.category = categoryKey;
    results.push(result);

    const icon = result.status === 'present' ? '✅' : '❌';
    const status = result.status === 'present' ? 'OK' : result.status.toUpperCase();
    console.log(`${icon} ${env.key.padEnd(35)} ${status}`);
    
    if (result.status !== 'present') {
      console.log(`   📝 ${env.description}`);
      if (env.example) {
        console.log(`   💡 Example: ${env.example}`);
      }
    }
  }

  // Check optional variables
  for (const env of category.optional) {
    const result = validateEnvironmentVariable(env.key, false, env.description, env.example);
    result.category = categoryKey;
    results.push(result);

    const icon = result.status === 'present' ? '✅' : '⚠️';
    const status = result.status === 'present' ? 'OK' : result.status.toUpperCase() + ' (optional)';
    console.log(`${icon} ${env.key.padEnd(35)} ${status}`);
    
    if (result.status !== 'present') {
      console.log(`   📝 ${env.description}`);
      if (env.example) {
        console.log(`   💡 Example: ${env.example}`);
      }
    }
  }

  return results;
}

function generateSummary(allResults: ValidationResult[]) {
  console.log('\n📊 DEPLOYMENT READINESS SUMMARY');
  console.log('='.repeat(50));

  const requiredResults = allResults.filter(r => r.isRequired);
  const optionalResults = allResults.filter(r => !r.isRequired);

  const requiredPresent = requiredResults.filter(r => r.status === 'present').length;
  const requiredTotal = requiredResults.length;
  const requiredMissing = requiredResults.filter(r => r.status !== 'present');

  const optionalPresent = optionalResults.filter(r => r.status === 'present').length;
  const optionalTotal = optionalResults.length;

  console.log(`🎯 Required Variables: ${requiredPresent}/${requiredTotal} configured`);
  console.log(`⚡ Optional Variables: ${optionalPresent}/${optionalTotal} configured`);
  console.log(`📈 Overall Configuration: ${((requiredPresent + optionalPresent) / (requiredTotal + optionalTotal) * 100).toFixed(1)}%`);

  if (requiredMissing.length > 0) {
    console.log('\n❌ MISSING REQUIRED VARIABLES:');
    for (const result of requiredMissing) {
      console.log(`   • ${result.key} - ${result.description}`);
    }
    return false;
  }

  console.log('\n✅ All required variables are configured!');
  return true;
}

function generateEnvTemplate(allResults: ValidationResult[]) {
  console.log('\n📝 ENVIRONMENT TEMPLATE');
  console.log('='.repeat(50));
  console.log('# Copy this template to your .env.local or .env.production file\n');

  const categories = Object.entries(ENV_REQUIREMENTS);
  
  for (const [categoryKey, category] of categories) {
    console.log(`# ${category.name.replace(/^[🎯🔐💳💰📊📱☁️🤖🛡️]\s/, '')}`);
    
    // Required variables
    if (category.required.length > 0) {
      for (const env of category.required) {
        const currentValue = process.env[env.key];
        if (currentValue) {
          console.log(`${env.key}=${currentValue}`);
        } else {
          console.log(`${env.key}=${env.example || ''}`);
        }
      }
    }

    // Optional variables
    if (category.optional.length > 0) {
      if (category.required.length > 0) {
        console.log('');
      }
      for (const env of category.optional) {
        const currentValue = process.env[env.key];
        if (currentValue) {
          console.log(`${env.key}=${currentValue}`);
        } else {
          console.log(`# ${env.key}=${env.example || ''}`);
        }
      }
    }
    
    console.log('');
  }
}

function checkFileStructure() {
  console.log('\n📁 FILE STRUCTURE CHECK');
  console.log('='.repeat(50));

  const criticalFiles = [
    { path: 'package.json', description: 'Node.js package configuration' },
    { path: 'next.config.ts', description: 'Next.js configuration' },
    { path: 'tsconfig.json', description: 'TypeScript configuration' },
    { path: 'tailwind.config.ts', description: 'Tailwind CSS configuration' },
    { path: 'drizzle.config.ts', description: 'Database ORM configuration' },
    { path: 'lib/stripe-service.ts', description: 'Stripe service integration' },
    { path: 'lib/shop-schema.ts', description: 'Database schema definition' },
    { path: 'migrations/0000_groovy_black_bolt.sql', description: 'Database migration' },
    { path: 'app/layout.tsx', description: 'Main application layout' },
    { path: 'middleware.ts', description: 'Next.js middleware' }
  ];

  let allPresent = true;

  for (const file of criticalFiles) {
    const exists = existsSync(file.path);
    const icon = exists ? '✅' : '❌';
    const status = exists ? 'OK' : 'MISSING';
    
    console.log(`${icon} ${file.path.padEnd(40)} ${status}`);
    if (!exists) {
      console.log(`   📝 ${file.description}`);
      allPresent = false;
    }
  }

  return allPresent;
}

function generateDeploymentSteps(isReady: boolean) {
  console.log('\n🚀 DEPLOYMENT STEPS');
  console.log('='.repeat(50));

  if (!isReady) {
    console.log('❌ Your application is NOT ready for deployment.');
    console.log('\n📋 Complete these steps first:');
    console.log('1. Configure all missing required environment variables');
    console.log('2. Test your configuration with npm run dev');
    console.log('3. Run this checklist again');
    return;
  }

  console.log('✅ Your application appears ready for deployment!');
  console.log('\n📋 Deployment steps:');
  console.log('1. Push your code to GitHub/GitLab');
  console.log('2. Connect your repository to Vercel');
  console.log('3. Configure environment variables in Vercel dashboard');
  console.log('4. Deploy to production');
  console.log('5. Test all functionality in production');
  console.log('6. Set up monitoring and alerts');

  console.log('\n🔧 Vercel Configuration Commands:');
  console.log('   vercel --prod                  # Deploy to production');
  console.log('   vercel env add                 # Add environment variables');
  console.log('   vercel domains add             # Add custom domain');

  console.log('\n📊 Post-deployment verification:');
  console.log('• Test user registration and login');
  console.log('• Verify Stripe webhook connectivity');
  console.log('• Test SMS and email notifications');
  console.log('• Check database connectivity');
  console.log('• Verify file uploads (if configured)');
}

async function runHealthChecks() {
  console.log('\n🏥 HEALTH CHECKS');
  console.log('='.repeat(50));

  // Check database connection
  if (process.env.DATABASE_URL) {
    console.log('🔌 Database connection... (simulated)');
    console.log('✅ DATABASE_URL is configured');
  } else {
    console.log('❌ Database connection cannot be tested - DATABASE_URL missing');
  }

  // Check external service configurations
  const services = [
    { name: 'Stripe', vars: ['STRIPE_SECRET_KEY', 'NEXT_PUBLIC_STRIPE_PUBLIC_KEY'] },
    { name: 'Twilio SMS', vars: ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN'] },
    { name: 'SendGrid Email', vars: ['SENDGRID_API_KEY'] },
    { name: 'Cloudflare R2', vars: ['R2_UPLOAD_IMAGE_ACCESS_KEY_ID', 'CLOUDFLARE_ACCOUNT_ID'] }
  ];

  for (const service of services) {
    const configured = service.vars.every(varName => process.env[varName]);
    const icon = configured ? '✅' : '⚠️';
    const status = configured ? 'Ready' : 'Not configured (optional)';
    console.log(`${icon} ${service.name.padEnd(20)} ${status}`);
  }
}

// Main execution
async function main() {
  console.log('🎯 Bossio.io Deployment Checklist\n');
  console.log('Checking production readiness...');

  const allResults: ValidationResult[] = [];

  // Validate all environment variable categories
  for (const [categoryKey, category] of Object.entries(ENV_REQUIREMENTS)) {
    const results = validateCategory(categoryKey, category);
    allResults.push(...results);
  }

  // Generate summary
  const isReady = generateSummary(allResults);

  // Check file structure
  const filesReady = checkFileStructure();

  // Run health checks
  await runHealthChecks();

  // Generate deployment steps
  generateDeploymentSteps(isReady && filesReady);

  // Generate environment template if needed
  const args = process.argv.slice(2);
  if (args.includes('--template') || args.includes('-t')) {
    generateEnvTemplate(allResults);
  }

  console.log('\n💡 Tips:');
  console.log('• Run with --template to generate a complete .env template');
  console.log('• Use npm run dev to test your configuration locally');
  console.log('• Set up Stripe webhooks after deploying to production');

  // Exit with appropriate code
  process.exit(isReady && filesReady ? 0 : 1);
}

// Handle command line arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log('Bossio.io Deployment Checklist');
  console.log('');
  console.log('Usage: npx tsx scripts/deployment-checklist.ts [options]');
  console.log('');
  console.log('Options:');
  console.log('  --help, -h        Show this help message');
  console.log('  --template, -t    Generate environment variable template');
  console.log('');
  console.log('This script validates all required environment variables');
  console.log('and configurations for production deployment.');
  console.log('');
  process.exit(0);
}

// Run the checklist
if (require.main === module) {
  main().catch((error) => {
    console.error('\n💥 Checklist failed:', error);
    process.exit(1);
  });
}

export { main as runDeploymentChecklist };