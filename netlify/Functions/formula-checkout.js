const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let customerEmail, formulaName, ingredients, totalPrice;
  try {
    ({ customerEmail, formulaName, ingredients, totalPrice } = JSON.parse(event.body));
  } catch {
    return { statusCode: 400, body: 'Invalid request body' };
  }

  if (!ingredients || !ingredients.length || typeof totalPrice !== 'number') {
    return { statusCode: 400, body: 'Invalid formula data' };
  }

  // Free shipping thresholds — match main site
  const standardFree = totalPrice >= 85;
  const expressFree  = totalPrice >= 180;

  // Chunk formula into Stripe metadata (500 char limit per value)
  const formulaJson = JSON.stringify(ingredients);
  const chunkSize = 490;
  const chunks = [];
  for (let i = 0; i < formulaJson.length; i += chunkSize) {
    chunks.push(formulaJson.slice(i, i + chunkSize));
  }
  const metadata = { formula_chunks_total: String(chunks.length), formula_name: formulaName || 'Custom Formula', customer_email: customerEmail || '' };
  chunks.forEach((chunk, i) => { metadata[`formula_chunk_${i}`] = chunk; });

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: customerEmail || undefined,
      line_items: [{
        price_data: {
          currency: 'aud',
          unit_amount: Math.round(totalPrice * 100),
          product_data: {
            name: formulaName || 'Custom Botanical Formula',
            description: 'Personalised formula — Profound Naturals',
          },
        },
        quantity: 1,
      }],
      shipping_address_collection: { allowed_countries: ['AU'] },
      shipping_options: [
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: { amount: standardFree ? 0 : 895, currency: 'aud' },
            display_name: standardFree ? 'Standard Shipping — Free' : 'Standard Shipping — $8.95',
            delivery_estimate: {
              minimum: { unit: 'business_day', value: 3 },
              maximum: { unit: 'business_day', value: 7 },
            },
          },
        },
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: { amount: expressFree ? 0 : 1395, currency: 'aud' },
            display_name: expressFree ? 'Express Shipping — Free' : 'Express Shipping — $13.95',
            delivery_estimate: {
              minimum: { unit: 'business_day', value: 1 },
              maximum: { unit: 'business_day', value: 3 },
            },
          },
        },
      ],
      metadata,
      success_url: 'https://profoundnaturals.online/?payment=success&session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'https://profoundnaturals.online/',
      automatic_tax: { enabled: false },
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ url: session.url }),
    };
  } catch (err) {
    console.error('Stripe checkout error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
