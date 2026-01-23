// Stripe product seeding script for BlueCoderHub Club membership
// Run with: npx tsx server/stripe/seed-products.ts

import { getUncachableStripeClient } from './stripeClient';

async function seedClubProducts() {
  const stripe = await getUncachableStripeClient();

  console.log('Checking for existing Club products...');
  
  // Check if Club product already exists
  const existingProducts = await stripe.products.search({ 
    query: "name:'BlueCoderHub Club'" 
  });
  
  if (existingProducts.data.length > 0) {
    console.log('Club product already exists:', existingProducts.data[0].id);
    const prices = await stripe.prices.list({ product: existingProducts.data[0].id });
    console.log('Existing prices:', prices.data.map(p => ({ id: p.id, amount: p.unit_amount, interval: p.recurring?.interval })));
    return;
  }

  console.log('Creating BlueCoderHub Club product...');
  
  // Create Club membership product
  const clubProduct = await stripe.products.create({
    name: 'BlueCoderHub Club',
    description: 'Premium membership with full access to all courses, certificates, code mentors, unlimited AI help, and exclusive events.',
    images: [],
    metadata: {
      type: 'membership',
      tier: 'club',
      features: JSON.stringify([
        'Complete access to all courses',
        'Course Certificates',
        'Code Mentors access',
        'Unlimited AI help',
        'Unlimited Builds',
        'Club-exclusive events',
        'Monthly challenges',
        'Portfolio hosting'
      ]),
    },
  });

  console.log('Created product:', clubProduct.id);

  // Create monthly price ($9.99/month)
  const monthlyPrice = await stripe.prices.create({
    product: clubProduct.id,
    unit_amount: 999, // $9.99 in cents
    currency: 'usd',
    recurring: { interval: 'month' },
    metadata: {
      tier: 'club_monthly',
      display_name: 'Monthly',
    },
  });

  console.log('Created monthly price:', monthlyPrice.id, '($9.99/month)');

  // Create yearly price ($79.99/year - save ~33%)
  const yearlyPrice = await stripe.prices.create({
    product: clubProduct.id,
    unit_amount: 7999, // $79.99 in cents
    currency: 'usd',
    recurring: { interval: 'year' },
    metadata: {
      tier: 'club_yearly',
      display_name: 'Yearly',
      savings: '33%',
    },
  });

  console.log('Created yearly price:', yearlyPrice.id, '($79.99/year)');

  console.log('\n✅ Club membership products created successfully!');
  console.log('Product ID:', clubProduct.id);
  console.log('Monthly Price ID:', monthlyPrice.id);
  console.log('Yearly Price ID:', yearlyPrice.id);
}

seedClubProducts().catch(console.error);
