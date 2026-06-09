// netlify/Functions/stripe-webhook.js
// Receives Stripe webhook events and sends confirmation emails
// AFTER payment is confirmed — never before.
//
// Event handled: checkout.session.completed
//
// Setup steps (see WEBHOOK-SETUP.md):
//   1. Add STRIPE_WEBHOOK_SECRET to builder env vars in Netlify
//   2. Register endpoint in Stripe Dashboard → Developers → Webhooks:
//      https://profoundnaturals.online/.netlify/functions/stripe-webhook
//      Event: checkout.session.completed

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const nodemailer = require("nodemailer");
const { paymentConfirmedCustomerEmail, internalOrderEmail } = require("./email-templates");

// ── Email transport (Zoho SMTP) ───────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host: "smtp.zoho.com.au",
  port: 465,
  secure: true,
  auth: {
    user: process.env.ZOHO_USER,
    pass: process.env.ZOHO_PASS,
  },
});

// ── Reassemble chunked formula JSON from Stripe metadata ─────────────────
function parseFormulaFromMetadata(metadata) {
  const totalChunks = parseInt(metadata.formula_chunks_total || "1", 10);
  let formulaJSON = "";
  for (let i = 0; i < totalChunks; i++) {
    formulaJSON += metadata[`formula_chunk_${i}`] || "";
  }
  try {
    return JSON.parse(formulaJSON);
  } catch {
    return [];
  }
}

// ── Handler ───────────────────────────────────────────────────────────────
exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const sig = event.headers["stripe-signature"];
  let stripeEvent;

  try {
    stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }

  // Only handle checkout.session.completed
  if (stripeEvent.type !== "checkout.session.completed") {
    return { statusCode: 200, body: "Event ignored" };
  }

  const session = stripeEvent.data.object;
  const metadata = session.metadata || {};

  const ingredients   = parseFormulaFromMetadata(metadata);
  const formulaName   = metadata.formula_name || "";
  const totalPrice    = parseFloat(metadata.total_price_aud || "0");
  const customerEmail = session.customer_details?.email || "";
  const shippingAddress = session.shipping_details?.address || null;

  try {
    const emailJobs = [];

    // Customer confirmation
    if (customerEmail) {
      emailJobs.push(
        transporter.sendMail({
          from: `"Profound Naturals" <${process.env.ZOHO_USER}>`,
          to: customerEmail,
          subject: `Payment confirmed${formulaName ? ` — ${formulaName}` : " — Your Signature Scent"}`,
          html: paymentConfirmedCustomerEmail({
            formulaName,
            ingredients,
            totalPrice,
            shippingAddress,
          }),
        })
      );
    }

    // Internal notification
    emailJobs.push(
      transporter.sendMail({
        from: `"Profound Naturals Builder" <${process.env.ZOHO_USER}>`,
        to: process.env.ZOHO_USER,
        subject: `New order${formulaName ? ` — ${formulaName}` : ""} · $${Number(totalPrice).toFixed(2)} AUD`,
        html: internalOrderEmail({
          customerEmail,
          formulaName,
          ingredients,
          totalPrice,
          shippingAddress,
        }),
      })
    );

    await Promise.all(emailJobs);
    console.log(`Formula emails sent for session ${session.id}`);
  } catch (err) {
    // Return 200 even on email failure — non-200 causes Stripe to retry endlessly
    console.error("Email send error:", err);
  }

  return { statusCode: 200, body: "OK" };
};
