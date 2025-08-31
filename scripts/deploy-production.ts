#!/usr/bin/env npx tsx
/**
 * Production Deployment Script
 * Automates the entire production deployment process
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';

function runCommand(command: string, description: string, allowFailure = false): boolean {
  console.log(`🔄 ${description}...`);
  try {
    const output = execSync(command, { stdio: 'pipe', encoding: 'utf-8' });
    console.log(`✅ ${description} - Success`);
    if (output.trim()) {
      console.log(`   ${output.trim()}`);
    }
    return true;
  } catch (error: any) {
    if (allowFailure) {
      console.log(`⚠️ ${description} - Skipped (${error.message.split('\n')[0]})`);
      return false;
    } else {
      console.error(`❌ ${description} - Failed`);
      console.error(`   ${error.message}`);
      throw error;
    }
  }
}

function checkPrerequisites(): void {
  console.log('🔍 Checking Prerequisites\n');
  
  // Check if we're in the right directory
  if (!existsSync('package.json')) {
    throw new Error('Not in project root directory');
  }
  
  // Check if Vercel CLI is installed
  try {
    execSync('vercel --version', { stdio: 'pipe' });
    console.log('✅ Vercel CLI is installed');
  } catch {
    console.log('❌ Vercel CLI not installed');
    console.log('   Install with: npm i -g vercel');
    throw new Error('Vercel CLI required for deployment');
  }
  
  // Check if git is clean
  try {
    const status = execSync('git status --porcelain', { stdio: 'pipe', encoding: 'utf-8' });
    if (status.trim()) {
      console.log('⚠️ Git working directory is not clean');
      console.log('   Uncommitted changes detected');
    } else {
      console.log('✅ Git working directory is clean');
    }
  } catch {
    console.log('⚠️ Not a git repository or git not available');
  }
}

function main() {
  console.log('🚀 Bossio.io Production Deployment\n');
  
  try {
    // Check prerequisites
    checkPrerequisites();
    console.log();
    
    // Run pre-deployment checks
    console.log('📋 Pre-deployment Validation\n');
    runCommand('npm run deployment:check', 'Running deployment checklist');
    console.log();
    
    // Build the application
    console.log('🔨 Building Application\n');
    runCommand('npm run build', 'Building Next.js application');
    console.log();
    
    // Test API connections (allow failure for optional services)
    console.log('🔌 Testing Service Connections\n');
    runCommand('npm run test:apis', 'Testing API connections', true);
    console.log();
    
    // Deploy to Vercel
    console.log('🌐 Deploying to Production\n');
    console.log('📝 Note: You will need to configure environment variables in Vercel dashboard');
    console.log('   Visit: https://vercel.com/dashboard → Project Settings → Environment Variables');
    console.log('   Copy variables from .env.local to production environment\n');
    
    // Ask for confirmation
    console.log('⚠️ This will deploy to production. Make sure:');
    console.log('   • All environment variables are set in Vercel');
    console.log('   • Database is properly configured');
    console.log('   • You have tested the application locally');
    console.log();
    
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    
    readline.question('Continue with production deployment? (y/N): ', (answer: string) => {
      readline.close();
      
      if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
        console.log('\n🚀 Starting deployment...\n');
        
        try {
          runCommand('vercel --prod', 'Deploying to Vercel production');
          
          console.log('\n🎉 Production Deployment Complete!\n');
          console.log('📋 Post-deployment steps:');
          console.log('   1. Test your live application');
          console.log('   2. Set up Stripe webhooks with production URL');
          console.log('   3. Configure DNS if using custom domain');
          console.log('   4. Set up monitoring and alerts');
          console.log('   5. Run: npm run setup:stripe (with production keys)');
          console.log('\n🔗 Your application should be live at the provided URL');
          
        } catch (error) {
          console.error('\n❌ Deployment failed:', error);
          process.exit(1);
        }
      } else {
        console.log('\n❌ Deployment cancelled');
        process.exit(0);
      }
    });
    
  } catch (error) {
    console.error('\n💥 Pre-deployment check failed:', error);
    console.log('\n🔧 Fix the issues above and try again');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}