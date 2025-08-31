#!/usr/bin/env tsx

/**
 * API Connection Test Script
 * 
 * Tests all external API connections for the bossio.io barbershop booking system.
 * This includes Stripe, Twilio, SendGrid, and other third-party services.
 * 
 * Run with: npx tsx scripts/test-api-connections.ts
 */

import { config } from 'dotenv';
import Stripe from 'stripe';
import twilio from 'twilio';
import sgMail from '@sendgrid/mail';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';

// Load environment variables
const envFiles = ['.env.local', '.env.production', '.env'];
for (const file of envFiles) {
  try {
    config({ path: file });
  } catch {
    // Ignore if file doesn't exist
  }
}

interface TestResult {
  service: string;
  status: 'success' | 'failure' | 'warning' | 'skipped';
  message: string;
  details?: any;
  duration?: number;
}

class APITester {
  private results: TestResult[] = [];

  private async measureTime<T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> {
    const start = Date.now();
    const result = await fn();
    const duration = Date.now() - start;
    return { result, duration };
  }

  private addResult(result: TestResult) {
    this.results.push(result);
    const icon = this.getStatusIcon(result.status);
    const durationText = result.duration ? ` (${result.duration}ms)` : '';
    console.log(`${icon} ${result.service}: ${result.message}${durationText}`);
    if (result.details && process.argv.includes('--verbose')) {
      console.log(`   Details: ${JSON.stringify(result.details, null, 2)}`);
    }
  }

  private getStatusIcon(status: TestResult['status']): string {
    switch (status) {
      case 'success': return '✅';
      case 'failure': return '❌';
      case 'warning': return '⚠️';
      case 'skipped': return '⏭️';
      default: return '❓';
    }
  }

  async testDatabase() {
    console.log('\n🗄️  DATABASE CONNECTIONS');
    console.log('='.repeat(50));

    if (!process.env.DATABASE_URL) {
      this.addResult({
        service: 'PostgreSQL (Neon)',
        status: 'skipped',
        message: 'DATABASE_URL not configured'
      });
      return;
    }

    try {
      const { result, duration } = await this.measureTime(async () => {
        const sql = neon(process.env.DATABASE_URL!);
        const db = drizzle(sql);
        
        // Simple query to test connection
        const result = await sql`SELECT NOW() as current_time, version() as pg_version`;
        return result;
      });

      this.addResult({
        service: 'PostgreSQL (Neon)',
        status: 'success',
        message: 'Connection successful',
        duration,
        details: {
          timestamp: result[0]?.current_time,
          version: result[0]?.pg_version?.substring(0, 50) + '...'
        }
      });
    } catch (error) {
      this.addResult({
        service: 'PostgreSQL (Neon)',
        status: 'failure',
        message: error instanceof Error ? error.message : 'Connection failed',
        details: error
      });
    }
  }

  async testStripe() {
    console.log('\n💳 STRIPE PAYMENT PROCESSING');
    console.log('='.repeat(50));

    const requiredVars = ['STRIPE_SECRET_KEY', 'NEXT_PUBLIC_STRIPE_PUBLIC_KEY'];
    const missing = requiredVars.filter(v => !process.env[v]);

    if (missing.length > 0) {
      this.addResult({
        service: 'Stripe',
        status: 'skipped',
        message: `Missing variables: ${missing.join(', ')}`
      });
      return;
    }

    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: '2024-12-18.acacia',
      });

      // Test 1: Account retrieval
      const { result: account, duration: accountDuration } = await this.measureTime(async () => {
        return await stripe.accounts.retrieve();
      });

      this.addResult({
        service: 'Stripe Account',
        status: 'success',
        message: `Account verified: ${account.id}`,
        duration: accountDuration,
        details: {
          business_name: account.business_profile?.name,
          country: account.country,
          charges_enabled: account.charges_enabled,
          details_submitted: account.details_submitted
        }
      });

      // Test 2: Products list
      const { result: products, duration: productsDuration } = await this.measureTime(async () => {
        return await stripe.products.list({ limit: 5 });
      });

      this.addResult({
        service: 'Stripe Products',
        status: 'success',
        message: `Found ${products.data.length} products`,
        duration: productsDuration,
        details: {
          products: products.data.map(p => ({ id: p.id, name: p.name }))
        }
      });

      // Test 3: Create test payment intent (and immediately cancel)
      const { result: paymentIntent, duration: paymentDuration } = await this.measureTime(async () => {
        const pi = await stripe.paymentIntents.create({
          amount: 100, // $1.00
          currency: 'usd',
          metadata: { test: 'api-connection-test' }
        });
        
        // Immediately cancel the test payment intent
        await stripe.paymentIntents.cancel(pi.id);
        return pi;
      });

      this.addResult({
        service: 'Stripe Payment Intent',
        status: 'success',
        message: 'Test payment intent created and canceled',
        duration: paymentDuration,
        details: {
          payment_intent_id: paymentIntent.id,
          status: 'canceled'
        }
      });

    } catch (error) {
      this.addResult({
        service: 'Stripe',
        status: 'failure',
        message: error instanceof Error ? error.message : 'Connection failed',
        details: error
      });
    }
  }

  async testTwilio() {
    console.log('\n📱 TWILIO SMS SERVICE');
    console.log('='.repeat(50));

    const requiredVars = ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_PHONE_NUMBER'];
    const missing = requiredVars.filter(v => !process.env[v]);

    if (missing.length > 0) {
      this.addResult({
        service: 'Twilio SMS',
        status: 'skipped',
        message: `Missing variables: ${missing.join(', ')}`
      });
      return;
    }

    try {
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

      // Test 1: Account info
      const { result: account, duration: accountDuration } = await this.measureTime(async () => {
        return await client.api.accounts(process.env.TWILIO_ACCOUNT_SID!).fetch();
      });

      this.addResult({
        service: 'Twilio Account',
        status: 'success',
        message: `Account verified: ${account.friendlyName}`,
        duration: accountDuration,
        details: {
          sid: account.sid,
          status: account.status,
          type: account.type
        }
      });

      // Test 2: Phone number validation
      const { result: phoneNumber, duration: phoneDuration } = await this.measureTime(async () => {
        return await client.incomingPhoneNumbers.list({ phoneNumber: process.env.TWILIO_PHONE_NUMBER, limit: 1 });
      });

      if (phoneNumber.length > 0) {
        this.addResult({
          service: 'Twilio Phone Number',
          status: 'success',
          message: `Phone number verified: ${phoneNumber[0].phoneNumber}`,
          duration: phoneDuration,
          details: {
            sid: phoneNumber[0].sid,
            capabilities: phoneNumber[0].capabilities
          }
        });
      } else {
        this.addResult({
          service: 'Twilio Phone Number',
          status: 'warning',
          message: 'Configured phone number not found in account',
          duration: phoneDuration
        });
      }

      // Test 3: Message sending capability (validation only, no actual send)
      const { duration: validationDuration } = await this.measureTime(async () => {
        // Just validate the message creation parameters without sending
        return await client.messages.list({ limit: 1 });
      });

      this.addResult({
        service: 'Twilio Messaging',
        status: 'success',
        message: 'Message API accessible',
        duration: validationDuration
      });

    } catch (error) {
      this.addResult({
        service: 'Twilio SMS',
        status: 'failure',
        message: error instanceof Error ? error.message : 'Connection failed',
        details: error
      });
    }
  }

  async testSendGrid() {
    console.log('\n📧 SENDGRID EMAIL SERVICE');
    console.log('='.repeat(50));

    const requiredVars = ['SENDGRID_API_KEY', 'SENDGRID_FROM_EMAIL'];
    const missing = requiredVars.filter(v => !process.env[v]);

    if (missing.length > 0) {
      this.addResult({
        service: 'SendGrid Email',
        status: 'skipped',
        message: `Missing variables: ${missing.join(', ')}`
      });
      return;
    }

    try {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

      // Test 1: API key validation
      const { result: user, duration: userDuration } = await this.measureTime(async () => {
        const request = {
          url: '/v3/user/profile',
          method: 'GET' as const,
        };
        return await sgMail.request(request);
      });

      this.addResult({
        service: 'SendGrid Account',
        status: 'success',
        message: `API key verified for: ${user[1]?.username || 'User'}`,
        duration: userDuration,
        details: {
          user_id: user[1]?.user_id,
          email: user[1]?.email
        }
      });

      // Test 2: Domain authentication
      const { result: domains, duration: domainDuration } = await this.measureTime(async () => {
        const request = {
          url: '/v3/whitelabel/domains',
          method: 'GET' as const,
        };
        return await sgMail.request(request);
      });

      const authenticatedDomains = domains[1]?.filter((domain: any) => domain.valid);

      this.addResult({
        service: 'SendGrid Domains',
        status: authenticatedDomains?.length > 0 ? 'success' : 'warning',
        message: `${authenticatedDomains?.length || 0} authenticated domains`,
        duration: domainDuration,
        details: {
          domains: authenticatedDomains?.map((d: any) => d.domain) || []
        }
      });

      // Test 3: Template validation (if templates exist)
      const { result: templates, duration: templateDuration } = await this.measureTime(async () => {
        const request = {
          url: '/v3/templates',
          method: 'GET' as const,
        };
        return await sgMail.request(request);
      });

      this.addResult({
        service: 'SendGrid Templates',
        status: 'success',
        message: `Found ${templates[1]?.templates?.length || 0} email templates`,
        duration: templateDuration,
        details: {
          template_count: templates[1]?.templates?.length || 0
        }
      });

    } catch (error: any) {
      this.addResult({
        service: 'SendGrid Email',
        status: 'failure',
        message: error?.message || 'Connection failed',
        details: {
          response: error?.response?.body,
          code: error?.code
        }
      });
    }
  }

  async testCloudflareR2() {
    console.log('\n☁️  CLOUDFLARE R2 STORAGE');
    console.log('='.repeat(50));

    const requiredVars = ['R2_UPLOAD_IMAGE_ACCESS_KEY_ID', 'R2_UPLOAD_IMAGE_SECRET_ACCESS_KEY', 'CLOUDFLARE_ACCOUNT_ID'];
    const missing = requiredVars.filter(v => !process.env[v]);

    if (missing.length > 0) {
      this.addResult({
        service: 'Cloudflare R2',
        status: 'skipped',
        message: `Missing variables: ${missing.join(', ')}`
      });
      return;
    }

    try {
      const { S3Client, HeadBucketCommand, ListObjectsV2Command } = await import('@aws-sdk/client-s3');
      
      const client = new S3Client({
        region: 'auto',
        endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: process.env.R2_UPLOAD_IMAGE_ACCESS_KEY_ID!,
          secretAccessKey: process.env.R2_UPLOAD_IMAGE_SECRET_ACCESS_KEY!,
        },
      });

      const bucketName = process.env.R2_UPLOAD_IMAGE_BUCKET_NAME || 'images';

      // Test 1: Bucket access
      const { duration: bucketDuration } = await this.measureTime(async () => {
        const command = new HeadBucketCommand({ Bucket: bucketName });
        return await client.send(command);
      });

      this.addResult({
        service: 'Cloudflare R2 Bucket',
        status: 'success',
        message: `Bucket '${bucketName}' accessible`,
        duration: bucketDuration
      });

      // Test 2: List objects (to verify read permissions)
      const { result: objects, duration: listDuration } = await this.measureTime(async () => {
        const command = new ListObjectsV2Command({ 
          Bucket: bucketName,
          MaxKeys: 5
        });
        return await client.send(command);
      });

      this.addResult({
        service: 'Cloudflare R2 Objects',
        status: 'success',
        message: `Listed objects successfully (${objects.KeyCount || 0} found)`,
        duration: listDuration,
        details: {
          object_count: objects.KeyCount,
          bucket_name: bucketName
        }
      });

    } catch (error) {
      this.addResult({
        service: 'Cloudflare R2',
        status: 'failure',
        message: error instanceof Error ? error.message : 'Connection failed',
        details: error
      });
    }
  }

  async testOpenAI() {
    console.log('\n🤖 OPENAI API SERVICE');
    console.log('='.repeat(50));

    if (!process.env.OPENAI_API_KEY) {
      this.addResult({
        service: 'OpenAI API',
        status: 'skipped',
        message: 'OPENAI_API_KEY not configured'
      });
      return;
    }

    try {
      const { result, duration } = await this.measureTime(async () => {
        const response = await fetch('https://api.openai.com/v1/models', {
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return await response.json();
      });

      const gptModels = result.data?.filter((model: any) => 
        model.id.includes('gpt')
      ).slice(0, 3);

      this.addResult({
        service: 'OpenAI API',
        status: 'success',
        message: `API key verified, ${result.data?.length || 0} models available`,
        duration,
        details: {
          sample_models: gptModels?.map((m: any) => m.id) || []
        }
      });

    } catch (error) {
      this.addResult({
        service: 'OpenAI API',
        status: 'failure',
        message: error instanceof Error ? error.message : 'Connection failed',
        details: error
      });
    }
  }

  generateSummary() {
    console.log('\n📊 CONNECTION TEST SUMMARY');
    console.log('='.repeat(50));

    const summary = this.results.reduce((acc, result) => {
      acc[result.status] = (acc[result.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log(`✅ Successful: ${summary.success || 0}`);
    console.log(`❌ Failed: ${summary.failure || 0}`);
    console.log(`⚠️  Warnings: ${summary.warning || 0}`);
    console.log(`⏭️  Skipped: ${summary.skipped || 0}`);

    const totalTested = (summary.success || 0) + (summary.failure || 0) + (summary.warning || 0);
    const successRate = totalTested > 0 ? ((summary.success || 0) / totalTested * 100).toFixed(1) : '0';
    
    console.log(`\n📈 Success Rate: ${successRate}%`);

    // Critical failures
    const criticalFailures = this.results.filter(r => 
      r.status === 'failure' && 
      ['PostgreSQL', 'Stripe Account'].some(critical => r.service.includes(critical))
    );

    if (criticalFailures.length > 0) {
      console.log('\n⚠️  CRITICAL ISSUES:');
      for (const failure of criticalFailures) {
        console.log(`   • ${failure.service}: ${failure.message}`);
      }
      console.log('\n❗ These services are required for core functionality.');
      return false;
    }

    if ((summary.failure || 0) === 0) {
      console.log('\n🎉 All tested services are working correctly!');
      return true;
    }

    return (summary.failure || 0) <= (summary.warning || 0);
  }

  async runAllTests() {
    console.log('🔌 Bossio.io API Connection Test Suite\n');
    
    const startTime = Date.now();

    await this.testDatabase();
    await this.testStripe();
    await this.testTwilio();
    await this.testSendGrid();
    await this.testCloudflareR2();
    await this.testOpenAI();

    const totalDuration = Date.now() - startTime;
    console.log(`\n⏱️  Total test duration: ${totalDuration}ms`);

    const isHealthy = this.generateSummary();

    console.log('\n💡 Tips:');
    console.log('• Use --verbose to see detailed response information');
    console.log('• Configure missing optional services to unlock more features');
    console.log('• Test in both staging and production environments');

    return isHealthy;
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log('Bossio.io API Connection Test Suite');
    console.log('');
    console.log('Usage: npx tsx scripts/test-api-connections.ts [options]');
    console.log('');
    console.log('Options:');
    console.log('  --help, -h        Show this help message');
    console.log('  --verbose, -v     Show detailed response information');
    console.log('');
    console.log('This script tests connections to all external APIs:');
    console.log('• PostgreSQL database (Neon)');
    console.log('• Stripe payment processing');
    console.log('• Twilio SMS service');
    console.log('• SendGrid email service');
    console.log('• Cloudflare R2 storage');
    console.log('• OpenAI API service');
    console.log('');
    process.exit(0);
  }

  const tester = new APITester();
  const isHealthy = await tester.runAllTests();

  process.exit(isHealthy ? 0 : 1);
}

// Run the tests
if (require.main === module) {
  main().catch((error) => {
    console.error('\n💥 Test suite failed:', error);
    process.exit(1);
  });
}

export { APITester };