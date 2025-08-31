# 🔐 Environment Variables Configuration Guide

## Overview
This guide provides comprehensive documentation for all environment variables required by the bossio.io barbershop booking system.

## 🚀 Quick Start

1. Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

2. Fill in the required values based on the categories below.

---

## 📋 Environment Variables by Category

### 🌐 Application Settings

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `NEXT_PUBLIC_APP_URL` | ✅ | Your application's public URL | `https://bossio.io` or `http://localhost:3000` |
| `NODE_ENV` | ✅ | Environment mode | `development`, `production`, `test` |

### 🗄️ Database

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string (Neon) | `postgresql://user:pass@host/db?sslmode=require` |

### 🔐 Authentication

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `BETTER_AUTH_SECRET` | ✅ | Secret for JWT signing (min 32 chars) | Generate with: `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID` | ✅ | Google OAuth Client ID | `123456789.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | ✅ | Google OAuth Client Secret | `GOCSPX-xxxxxxxxxxxxx` |

### 💳 Payment Processing - Stripe

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `STRIPE_SECRET_KEY` | ✅ | Stripe secret key | `sk_test_51xxx` or `sk_live_51xxx` |
| `NEXT_PUBLIC_STRIPE_PUBLIC_KEY` | ✅ | Stripe publishable key | `pk_test_51xxx` or `pk_live_51xxx` |
| `STRIPE_WEBHOOK_SECRET` | ✅ | Stripe webhook endpoint secret | `whsec_xxxxxxxxxxxxx` |
| `STRIPE_AI_PRICE_ID` | ✅ | Price ID for AI features subscription | `price_1Nxxxxxx` |
| `STRIPE_SMS_PRICE_ID` | ✅ | Price ID for SMS features | `price_1Nxxxxxx` |
| `STRIPE_ENTERPRISE_PRICE_ID` | ✅ | Price ID for enterprise plan | `price_1Nxxxxxx` |

### 💳 Payment Processing - Polar (Alternative)

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `POLAR_ACCESS_TOKEN` | ❌ | Polar API access token | `polar_xxxxxxxxxxxxx` |
| `POLAR_SUCCESS_URL` | ❌ | Redirect URL after successful payment | `/success?checkout_id={CHECKOUT_ID}` |
| `POLAR_WEBHOOK_SECRET` | ❌ | Polar webhook secret | `whsec_xxxxxxxxxxxxx` |

### 📱 SMS Notifications - Twilio

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `TWILIO_ACCOUNT_SID` | ✅ | Twilio Account SID | `ACxxxxxxxxxxxxx` |
| `TWILIO_AUTH_TOKEN` | ✅ | Twilio Auth Token | `xxxxxxxxxxxxxx` |
| `TWILIO_PHONE_NUMBER` | ✅ | Twilio phone number (E.164 format) | `+12125551234` |

### 📧 Email Notifications - SendGrid

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `SENDGRID_API_KEY` | ✅ | SendGrid API Key | `SG.xxxxxxxxxxxxx` |
| `SENDGRID_FROM_EMAIL` | ✅ | Verified sender email | `notifications@yourdomain.com` |
| `SENDGRID_FROM_NAME` | ✅ | Sender display name | `BookedBarber` |

### 🤖 AI Integration

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `OPENAI_API_KEY` | ✅ | OpenAI API key for GPT features | `sk-xxxxxxxxxxxxx` |

### 📦 Storage - Cloudflare R2

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `R2_UPLOAD_IMAGE_ACCESS_KEY_ID` | ❌ | R2 Access Key ID | `xxxxxxxxxxxxx` |
| `R2_UPLOAD_IMAGE_SECRET_ACCESS_KEY` | ❌ | R2 Secret Access Key | `xxxxxxxxxxxxx` |
| `CLOUDFLARE_ACCOUNT_ID` | ❌ | Cloudflare Account ID | `xxxxxxxxxxxxx` |
| `R2_UPLOAD_IMAGE_BUCKET_NAME` | ❌ | R2 Bucket name | `images` |

### ⏰ Cron Jobs

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `CRON_SECRET` | ✅ | Secret for Vercel Cron authentication | Generate with: `openssl rand -hex 32` |

### 📊 Subscriptions

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `NEXT_PUBLIC_STARTER_TIER` | ❌ | Starter tier identifier | `starter` |
| `NEXT_PUBLIC_STARTER_SLUG` | ❌ | Starter tier slug | `starter-plan` |

---

## 🔧 Setting Up Services

### Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - Development: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://yourdomain.com/api/auth/callback/google`

### Stripe Setup
1. Sign up at [Stripe Dashboard](https://dashboard.stripe.com)
2. Get your API keys from Developers → API keys
3. Create products and prices in Products section
4. Set up webhook endpoint:
   - Endpoint URL: `https://yourdomain.com/api/webhooks/stripe`
   - Events to listen: `checkout.session.completed`, `payment_intent.succeeded`, etc.

### Twilio Setup
1. Sign up at [Twilio Console](https://console.twilio.com)
2. Get Account SID and Auth Token from dashboard
3. Purchase a phone number with SMS capabilities
4. Configure messaging service if needed

### SendGrid Setup
1. Sign up at [SendGrid](https://sendgrid.com)
2. Create API key with full access
3. Verify sender domain or email address
4. Set up domain authentication for better deliverability

### Neon Database Setup
1. Sign up at [Neon](https://neon.tech)
2. Create a new project
3. Copy the connection string from dashboard
4. Ensure SSL mode is set to 'require'

---

## 🔒 Security Best Practices

1. **Never commit `.env` files** to version control
2. **Use different keys** for development and production
3. **Rotate secrets regularly** (every 90 days recommended)
4. **Use strong secrets**: 
   ```bash
   # Generate strong secrets
   openssl rand -base64 32  # For auth secrets
   openssl rand -hex 32      # For webhook secrets
   ```
5. **Limit API key permissions** to minimum required
6. **Use environment-specific** prefixes (TEST_ for test keys)

---

## 🚀 Deployment Configuration

### Vercel Deployment
1. Go to your project settings in Vercel dashboard
2. Navigate to Environment Variables section
3. Add each variable for Production, Preview, and Development environments
4. Use the Vercel CLI to pull env variables locally:
   ```bash
   vercel env pull .env.local
   ```

### Local Development
1. Create `.env.local` file in project root
2. Copy values from `.env.example`
3. Fill in your development API keys (use test keys when available)
4. Restart development server after changes

---

## 🧪 Testing Environment Variables

Test your configuration:
```bash
# Check if all required variables are set
node scripts/check-env.js

# Test database connection
node scripts/test-db-connection.js

# Test external services
node scripts/test-services.js
```

---

## 📝 Environment Variable Checklist

Before deploying to production, ensure:

- [ ] All required variables are set
- [ ] Production keys are used (not test keys)
- [ ] Webhook secrets are configured
- [ ] Database has SSL enabled
- [ ] Email domain is verified
- [ ] SMS number is verified
- [ ] OAuth redirect URIs are correct
- [ ] CORS settings match your domain
- [ ] Rate limiting is configured
- [ ] Monitoring is set up

---

## 🆘 Troubleshooting

### Common Issues

**Database Connection Failed**
- Check if DATABASE_URL includes `?sslmode=require`
- Verify database is not sleeping (Neon free tier)
- Check IP whitelist if applicable

**OAuth Not Working**
- Verify redirect URIs match exactly
- Check if APIs are enabled in Google Cloud
- Ensure client ID and secret are from same project

**SMS/Email Not Sending**
- Check if using production keys
- Verify sender is authenticated
- Check service quotas/limits
- Review service logs for errors

**Stripe Webhooks Failing**
- Ensure webhook secret matches
- Check if endpoint URL is accessible
- Verify SSL certificate is valid
- Review Stripe webhook logs

---

Last Updated: August 2024