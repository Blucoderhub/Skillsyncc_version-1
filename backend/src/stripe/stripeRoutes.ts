// Stripe routes for Skillsyncc Club membership - based on stripe integration blueprint
import type { Express } from "express";
import express from "express";
import { stripeService } from "./stripeService";
import { getStripePublishableKey, getStripeSync } from "./stripeClient";
import { WebhookHandlers } from "./webhookHandlers";
import { storage } from "../storage";
import { isAuthenticated } from "../lib/auth";
// import { runMigrations } from "stripe-replit-sync";

export async function initStripe() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.warn('DATABASE_URL not found - Stripe integration disabled');
    return;
  }

  try {
    console.log('Initializing Stripe schema...');
    /*
    await runMigrations({
      databaseUrl
    });
    */
    console.log('Stripe schema ready');

    const stripeSync = await getStripeSync();

    console.log('Setting up managed webhook...');
    const domains = process.env.REPLIT_DOMAINS?.split(',');
    const webhookBaseUrl = domains?.[0] ? `https://${domains[0]}` : '';

    if (webhookBaseUrl) {
      try {
        const result = await stripeSync.findOrCreateManagedWebhook(
          `${webhookBaseUrl}/api/stripe/webhook`
        );
        if (result?.webhook?.url) {
          console.log(`Webhook configured: ${result.webhook.url}`);
        } else {
          console.log('Webhook setup completed (no URL returned)');
        }
      } catch (webhookError) {
        console.warn('Webhook setup skipped:', webhookError);
      }
    }

    console.log('Syncing Stripe data...');
    stripeSync.syncBackfill()
      .then(() => console.log('Stripe data synced'))
      .catch((err: any) => console.error('Error syncing Stripe data:', err));
  } catch (error) {
    console.error('Failed to initialize Stripe:', error);
  }
}

export function registerStripeWebhookRoute(app: Express) {
  // Register webhook route BEFORE express.json() - critical for signature verification
  app.post(
    '/api/stripe/webhook',
    express.raw({ type: 'application/json' }),
    async (req, res) => {
      const signature = req.headers['stripe-signature'];

      if (!signature) {
        return res.status(400).json({ error: 'Missing stripe-signature' });
      }

      try {
        const sig = Array.isArray(signature) ? signature[0] : signature;

        if (!Buffer.isBuffer(req.body)) {
          console.error('STRIPE WEBHOOK ERROR: req.body is not a Buffer');
          return res.status(500).json({ error: 'Webhook processing error' });
        }

        await WebhookHandlers.processWebhook(req.body as Buffer, sig);

        res.status(200).json({ received: true });
      } catch (error: any) {
        console.error('Webhook error:', error.message);
        res.status(400).json({ error: 'Webhook processing error' });
      }
    }
  );
}

export function registerStripeRoutes(app: Express) {
  // Get Stripe publishable key for frontend
  app.get('/api/stripe/config', async (req, res) => {
    try {
      const publishableKey = await getStripePublishableKey();
      res.json({ publishableKey });
    } catch (error) {
      res.status(500).json({ error: 'Stripe not configured' });
    }
  });

  // Get user subscription status
  app.get('/api/subscription', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).id;
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({
        membershipStatus: user.membershipStatus || 'free',
        membershipTier: user.membershipTier || 'free',
        membershipExpiresAt: user.membershipExpiresAt,
        stripeCustomerId: user.stripeCustomerId,
        stripeSubscriptionId: user.stripeSubscriptionId,
      });
    } catch (error) {
      console.error('Error getting subscription:', error);
      res.status(500).json({ error: 'Failed to get subscription' });
    }
  });

  // Create checkout session for Club membership
  app.post('/api/checkout', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).id;
      const { priceId } = req.body;

      if (!priceId) {
        return res.status(400).json({ error: 'Price ID required' });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Create or get Stripe customer
      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripeService.createCustomer(
          user.email || `${userId}@bluecoderhub.com`,
          userId,
          `${user.firstName || ''} ${user.lastName || ''}`.trim() || undefined
        );
        await storage.updateUserStripeInfo(userId, { stripeCustomerId: customer.id });
        customerId = customer.id;
      }

      const host = req.get('host');
      const protocol = req.protocol;

      const session = await stripeService.createCheckoutSession(
        customerId,
        priceId,
        `${protocol}://${host}/club/success`,
        `${protocol}://${host}/pricing`,
        userId
      );

      res.json({ url: session.url });
    } catch (error) {
      console.error('Error creating checkout:', error);
      res.status(500).json({ error: 'Failed to create checkout session' });
    }
  });

  // Create customer portal session for managing subscription
  app.post('/api/customer-portal', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).id;
      const user = await storage.getUser(userId);

      if (!user?.stripeCustomerId) {
        return res.status(400).json({ error: 'No subscription found' });
      }

      const host = req.get('host');
      const protocol = req.protocol;

      const session = await stripeService.createCustomerPortalSession(
        user.stripeCustomerId,
        `${protocol}://${host}/profile`
      );

      res.json({ url: session.url });
    } catch (error) {
      console.error('Error creating portal session:', error);
      res.status(500).json({ error: 'Failed to create portal session' });
    }
  });

  // List available products/prices for pricing page
  app.get('/api/products', async (req, res) => {
    try {
      const rows = await stripeService.listProductsWithPrices();

      // Group prices by product
      const productsMap = new Map();
      for (const row of rows as any[]) {
        if (!productsMap.has(row.product_id)) {
          productsMap.set(row.product_id, {
            id: row.product_id,
            name: row.product_name,
            description: row.product_description,
            active: row.product_active,
            metadata: row.product_metadata,
            prices: []
          });
        }
        if (row.price_id) {
          productsMap.get(row.product_id).prices.push({
            id: row.price_id,
            unit_amount: row.unit_amount,
            currency: row.currency,
            recurring: row.recurring,
            active: row.price_active,
            metadata: row.price_metadata,
          });
        }
      }

      res.json({ data: Array.from(productsMap.values()) });
    } catch (error) {
      console.error('Error listing products:', error);
      res.status(500).json({ error: 'Failed to list products', data: [] });
    }
  });
}
