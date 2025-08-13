# Resend Email Setup Guide

This guide will help you configure Resend for handling contact forms and newsletter subscriptions on your Hugo site.

## Prerequisites

1. A [Resend account](https://resend.com) (free tier available)
2. A verified domain or email address in Resend
3. Access to your Vercel deployment environment variables

## Step-by-Step Setup

### 1. Create Resend Account

1. Go to [resend.com](https://resend.com) and sign up
2. Verify your email address
3. Complete the onboarding process

### 2. Verify Your Domain (Recommended)

**Option A: Domain Verification (Best for production)**

1. Go to [Resend Domains](https://resend.com/domains)
2. Click "Add Domain"
3. Enter your domain (e.g., `mysite.com`)
4. Add the provided DNS records to your domain
5. Wait for verification (can take up to 48 hours)

**Option B: Use Resend's Shared Domain (Quick setup)**

- You can start immediately with `@resend.dev` addresses
- Example: `noreply@resend.dev`

### 3. Get Your API Key

1. Go to [Resend API Keys](https://resend.com/api-keys)
2. Click "Create API Key"
3. Choose permissions:
   - **Name**: "Hugo Site Email"
   - **Permission**: "Sending access" (default)
   - **Domain**: Select your verified domain or "All domains"
4. Copy the API key (starts with `re_`)

### 4. Create Newsletter Audience (Optional)

1. Go to [Resend Audiences](https://resend.com/audiences)
2. Click "Create audience"
3. Enter details:
   - **Name**: "Newsletter Subscribers"
   - **Description**: "Subscribers to coloring page updates"
4. Copy the Audience ID

### 5. Configure Environment Variables

Add these variables to your deployment environment:

#### Required Variables

```env
# Your Resend API key
RESEND_API_KEY=re_your_api_key_here

# Email addresses for sending
RESEND_FROM_EMAIL=noreply@yourdomain.com
RESEND_TO_EMAIL=admin@yourdomain.com

# Newsletter audience ID (if using newsletter)
RESEND_AUDIENCE_ID=your_audience_id_here
```

#### Optional Variables

```env
# Separate newsletter sender (optional)
RESEND_NEWSLETTER_FROM_EMAIL=newsletter@yourdomain.com
```

### 6. Vercel Configuration

#### Option A: Via Vercel Dashboard

1. Go to your project in [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to Settings → Environment Variables
3. Add each variable from step 5
4. Set Environment: **Production** (and **Preview** if needed)
5. Save and redeploy your site

#### Option B: Via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Set environment variables
vercel env add RESEND_API_KEY production
vercel env add RESEND_FROM_EMAIL production
vercel env add RESEND_TO_EMAIL production
vercel env add RESEND_AUDIENCE_ID production

# Redeploy
vercel --prod
```

### 7. Local Development

1. Create `.env.local` file in project root:

```env
RESEND_API_KEY=re_your_api_key_here
RESEND_FROM_EMAIL=noreply@yourdomain.com
RESEND_TO_EMAIL=admin@yourdomain.com
RESEND_AUDIENCE_ID=your_audience_id_here
```

2. **Never commit `.env.local` to git** (it's in `.gitignore`)

### 8. Test Your Setup

1. Deploy your site to Vercel
2. Test the contact form at `/contact`
3. Test newsletter signup in the footer
4. Check Resend dashboard for sent emails
5. Verify newsletter subscribers in Resend Audiences

## Email Template Customization

### Customizing Welcome Email

Edit `api/_templates/welcome-newsletter.js` to modify:

- Colors and branding
- Content and messaging
- Call-to-action buttons
- Footer information

### Customizing Contact Form Email

Edit `api/_templates/contact-form.js` to modify:

- Layout and styling
- Information displayed
- Footer content

## Troubleshooting

### Common Issues

**API Key Not Working**

- Verify the key starts with `re_`
- Check it's set correctly in Vercel environment variables
- Ensure it has "Sending access" permission

**Emails Not Sending**

- Verify your domain in Resend
- Check from/to addresses are valid
- Look at Vercel function logs for errors

**Newsletter Audience Errors**

- Ensure `RESEND_AUDIENCE_ID` is set
- Verify the audience exists in Resend dashboard
- Check API key has access to audiences

**403 Forbidden Errors**

- Domain might not be verified
- API key might not have correct permissions
- From address might not be authorized

### Checking Logs

**Vercel Function Logs:**

1. Go to Vercel Dashboard
2. Select your project
3. Go to "Functions" tab
4. Click on `/api/contact` or `/api/newsletter`
5. Check logs for errors

**Resend Activity:**

1. Go to [Resend Logs](https://resend.com/logs)
2. Check recent email activity
3. Look for failed sends or errors

## Security Best Practices

1. **Never commit API keys** to your repository
2. **Use environment variables** for all sensitive data
3. **Set up proper CORS** headers (already configured)
4. **Validate all inputs** on both client and server
5. **Rate limit** your endpoints if needed
6. **Use HTTPS** only (Vercel handles this automatically)

## Next Steps

Once setup is complete:

1. Monitor email delivery in Resend dashboard
2. Set up email templates for different occasions
3. Configure unsubscribe handling if needed
4. Add analytics to track form submissions
5. Consider setting up webhooks for advanced automation

## Support

- [Resend Documentation](https://resend.com/docs)
- [Resend API Reference](https://resend.com/docs/api-reference)
- [React Email Documentation](https://react.email/docs)
- [Vercel Functions Documentation](https://vercel.com/docs/functions)
