# Vercel Deployment Guide for Skillsyncc

This guide will help you deploy the Skillsyncc platform to Vercel with proper configuration.

## Prerequisites

1. Vercel account
2. Vercel CLI installed: `npm i -g vercel`
3. PostgreSQL database (Vercel Postgres recommended)

## Step 1: Environment Setup

1. Copy the environment template:
```bash
cp .env.vercel .env.local
```

2. Set up Vercel Postgres:
```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Login to Vercel
vercel login

# Create a new project
vercel

# When prompted, select:
# - Framework: Other
# - Root Directory: ./
# - Build Command: npm run vercel-build
# - Output Directory: dist/public
```

3. Configure environment variables in Vercel dashboard:
   - Go to your project settings
   - Navigate to "Environment Variables"
   - Add all variables from `.env.vercel`

## Step 2: Database Setup

1. Set up Vercel Postgres:
```bash
# Install Vercel Postgres
npm install @vercel/postgres

# Push schema to database
npm run db:push
```

2. Alternative: Use external PostgreSQL and set `DATABASE_URL`

## Step 3: Authentication Setup

Configure your authentication providers:

### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create OAuth 2.0 credentials
3. Add authorized redirect URI: `https://your-domain.vercel.app/api/auth/google/callback`

### GitHub OAuth
1. Go to GitHub Settings > Developer settings > OAuth Apps
2. Create a new OAuth App
3. Authorization callback URL: `https://your-domain.vercel.app/api/auth/github/callback`

### Other Providers
Follow similar patterns for LinkedIn, Azure AD, and Replit authentication.

## Step 4: AI Services Setup

### OpenAI
1. Get API key from [OpenAI](https://platform.openai.com/)
2. Set `OPENAI_API_KEY` and `AI_INTEGRATIONS_OPENAI_API_KEY`

### Stripe (Optional)
1. Get API keys from [Stripe Dashboard](https://dashboard.stripe.com/)
2. Configure webhook endpoint: `https://your-domain.vercel.app/api/stripe/webhook`

## Step 5: Deploy

```bash
# Build and deploy
npm run vercel-build
vercel --prod

# Or use the Vercel dashboard
```

## Step 6: Post-Deployment

1. **Test Authentication**: Visit `/api/auth/google` to test OAuth flow
2. **Test Database**: Check if user data is being saved
3. **Test AI Features**: Try the chat and voice features
4. **Monitor Logs**: Check Vercel function logs for any errors

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Ensure `POSTGRES_URL` is set correctly
   - Check database permissions
   - Verify network access

2. **Build Failures**
   - Run `npm run check` locally to check TypeScript errors
   - Ensure all dependencies are installed
   - Check build logs in Vercel dashboard

3. **Authentication Issues**
   - Verify callback URLs match exactly
   - Check client IDs and secrets
   - Ensure HTTPS for production

4. **Audio Processing Issues**
   - FFmpeg may not be available in Vercel functions
   - Consider using WebAssembly alternatives
   - Test with smaller audio files first

### Performance Optimization

1. **Function Cold Starts**
   - Minimize dependencies in server functions
   - Use Vercel Edge Functions where possible
   - Consider connection pooling for database

2. **Static Assets**
   - Use Vercel's CDN for client assets
   - Enable compression
   - Optimize images and audio files

3. **Database Queries**
   - Add proper indexes
   - Use connection pooling
   - Consider caching strategies

## Environment Variables Reference

### Required
- `POSTGRES_URL` - Vercel Postgres connection string
- `SESSION_SECRET` - Random string for session encryption
- `CLIENT_URL` - Your deployed domain

### Authentication (Choose at least one)
- `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`
- `GITHUB_CLIENT_ID` & `GITHUB_CLIENT_SECRET`
- `LINKEDIN_CLIENT_ID` & `LINKEDIN_CLIENT_SECRET`
- `AZURE_AD_CLIENT_ID` & `AZURE_AD_CLIENT_SECRET` & `AZURE_AD_TENANT_ID`

### Optional
- `OPENAI_API_KEY` - For AI features
- `STRIPE_SECRET_KEY` - For payments
- `STRIPE_WEBHOOK_SECRET` - For Stripe webhooks

## Monitoring

1. **Vercel Analytics**: Enable in project settings
2. **Error Tracking**: Consider Sentry integration
3. **Performance**: Use Vercel's built-in performance monitoring
4. **Uptime**: Set up external monitoring service

## Support

For deployment issues:
1. Check Vercel documentation
2. Review this project's README
3. Check Vercel function logs
4. Test locally with `npm run dev`