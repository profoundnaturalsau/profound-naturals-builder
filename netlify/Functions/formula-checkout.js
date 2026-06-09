// netlify/Functions/formula-checkout.js
// Creates a Stripe Checkout session for a custom formula order.
// Email is sent by stripe-webhook.js AFTER payment completes — not here.

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: "Invalid JSON" };
  }

  const {
    formulaName,   // string — user's chosen scent name
    ingredients,   // array of { name, pct, price }
    totalPrice,    // number — total cost in AUD
    customerEmail, // string — pre-fill Stripe email field
  } = body;

  // ── Validation ────────────────────────────────────────────────────────────
  if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
    return { statusCode: 400, body: "No ingredients provided" };
  }
  if (typeof totalPrice !== "number" || totalPrice <= 0) {
    return { statusCode: 400, body: "Invalid total price" };
  }

  // ── Metadata ─────────────────────────────────────────────────────────────
  // Stripe metadata values must be strings and each value ≤ 500 chars.
  // We serialise the formula as a compact JSON string.
  // If the formula is very large it will be truncated — 500 char limit per value.
  const formulaJSON = JSON.stringify(
    ingredients.map((i) => ({ name: i.name, pct: i.pct, price: i.price }))
  );

  // Stripe allows up to 50 metadata keys; split into chunks if needed.
  const CHUNK_SIZE = 490; // leave a little room
  const chunks = {};
  for (let i = 0; i < formulaJSON.length; i += CHUNK_SIZE) {
    chunks[`formula_chunk_${Math.floor(i / CHUNK_SIZE)}`] =
      formulaJSON.slice(i, i + CHUNK_SIZE);
  }
  chunks.formula_chunks_total = String(
    Math.ceil(formulaJSON.length / CHUNK_SIZE)
  );

  const metadata = {
    formula_name: formulaName || "Unnamed Formula",
    total_price_aud: String(totalPrice),
    ...chunks,
  };

  // ── Stripe Checkout Session ───────────────────────────────────────────────
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      customer_email: customerEmail || undefined,

      line_items: [
        {
          price_data: {
            currency: "aud",
            product_data: {
              name: formulaName
                ? `Profound Naturals — ${formulaName}`
                : "Profound Naturals — Custom Signature Scent",
              description: ingredients
                .map((i) => `${i.name} ${i.pct}%`)
                .join(" · "),
              images: [
                "https://profoundnaturals.com.au/images/bottle-product.webp",
              ],
            },
            unit_amount: Math.round(totalPrice * 100), // cents
          },
          quantity: 1,
        },
      ],

      shipping_address_collection: { allowed_countries: ["AU"] },

      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: { amount: 895, currency: "aud" },
            display_name: "Standard Shipping",
            delivery_estimate: {
              minimum: { unit: "business_day", value: 3 },
              maximum: { unit: "business_day", value: 7 },
            },
          },
        },
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: { amount: 1395, currency: "aud" },
            display_name: "Express Shipping",
            delivery_estimate: {
              minimum: { unit: "business_day", value: 1 },
              maximum: { unit: "business_day", value: 3 },
            },
          },
        },
      ],

      mode: "payment",
      metadata,

      success_url: `${process.env.URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.URL}/`,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ url: session.url }),
    };
  } catch (err) {
    console.error("Stripe session error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
