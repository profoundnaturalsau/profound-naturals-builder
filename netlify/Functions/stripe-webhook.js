// netlify/Functions/stripe-webhook.js
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.zoho.com.au",
  port: 465,
  secure: true,
  auth: { user: process.env.ZOHO_USER, pass: process.env.ZOHO_PASS },
});

function parseFormulaFromMetadata(metadata) {
  const totalChunks = parseInt(metadata.formula_chunks_total || "1", 10);
  let formulaJSON = "";
  for (let i = 0; i < totalChunks; i++) formulaJSON += metadata[`formula_chunk_${i}`] || "";
  try { return JSON.parse(formulaJSON); } catch { return []; }
}

function buildFormulaTable(ingredients) {
  if (!ingredients || !ingredients.length) return "<p style='color:#a0a098;'>No ingredients.</p>";
  const rows = ingredients.map(i => `
    <tr>
      <td style="padding:9px 16px 9px 0;font-family:Georgia,serif;font-size:14px;color:#f0ede8;border-bottom:1px solid #1e231f;">${i.name}</td>
      <td style="padding:9px 12px 9px 0;font-family:Georgia,serif;font-size:13px;color:#d4a017;text-align:center;border-bottom:1px solid #1e231f;">${i.pct}%</td>
      <td style="padding:9px 0;font-family:Georgia,serif;font-size:13px;color:#a0a098;text-align:right;border-bottom:1px solid #1e231f;">$${Number(i.price).toFixed(2)}</td>
    </tr>`).join("");
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0">
    <thead><tr>
      <th style="text-align:left;padding:0 16px 8px 0;font-family:Georgia,serif;font-size:10px;letter-spacing:0.16em;text-transform:uppercase;color:#8cc40f;font-weight:400;border-bottom:1px solid #2a2e2b;">Ingredient</th>
      <th style="text-align:center;padding:0 12px 8px 0;font-family:Georgia,serif;font-size:10px;letter-spacing:0.16em;text-transform:uppercase;color:#8cc40f;font-weight:400;border-bottom:1px solid #2a2e2b;">%</th>
      <th style="text-align:right;padding:0 0 8px;font-family:Georgia,serif;font-size:10px;letter-spacing:0.16em;text-transform:uppercase;color:#8cc40f;font-weight:400;border-bottom:1px solid #2a2e2b;">Cost</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
}

function customerEmail({ formulaName, ingredients, totalPrice, shippingAddress }) {
  const address = shippingAddress
    ? [shippingAddress.line1, shippingAddress.line2, shippingAddress.city, shippingAddress.state, shippingAddress.postal_code, shippingAddress.country].filter(Boolean).join(", ")
    : "Not provided";
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#080d09 !important;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#080d09 !important;">
    <tr><td align="center" style="padding:40px 16px 48px;background-color:#080d09 !important;">
      <table width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;background-color:#0f1510 !important;border:1px solid #2a2e2b;border-radius:3px;">

        <tr><td style="padding:36px 40px 28px;background-color:#0f1510 !important;">
          <p style="margin:0 0 10px;font-family:Georgia,serif;font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:#8cc40f;">Profound Naturals — Your Order</p>
          <h1 style="margin:0 0 10px;font-family:Georgia,serif;font-size:28px;font-weight:400;color:#d4a017;">Payment Confirmed</h1>
          <p style="margin:0;font-family:Georgia,serif;font-size:14px;color:#a0a098;font-style:italic;">Your formula has been received — crafting begins shortly.</p>
        </td></tr>

        <tr><td style="padding:0;line-height:0;font-size:0;"><div style="height:1px;background:linear-gradient(to right,#080d09,#d4a017 30%,#d4a017 70%,#080d09);opacity:0.35;"></div></td></tr>

        <tr><td style="padding:28px 40px 4px;">
          <p style="margin:0 0 12px;font-family:Georgia,serif;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#8cc40f;">Your Signature Scent</p>
          <p style="margin:0;font-family:Georgia,serif;font-size:22px;font-style:italic;color:#f0ede8;">${formulaName || "Unnamed Formula"}</p>
          <p style="margin:10px 0 0;"><span style="display:inline-block;padding:3px 10px;border-radius:2px;background:#0e1f0a;border:1px solid #8cc40f;font-family:Georgia,serif;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:#8cc40f;">Confirmed</span></p>
        </td></tr>

        <tr><td style="padding:24px 40px 8px;">
          <p style="margin:0 0 12px;font-family:Georgia,serif;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#8cc40f;">Formula Breakdown</p>
          ${buildFormulaTable(ingredients)}
        </td></tr>

        <tr><td style="padding:16px 40px 32px;text-align:right;">
          <p style="margin:0;font-family:Georgia,serif;font-size:14px;color:#a0a098;">Total paid <span style="color:#d4a017;font-size:17px;margin-left:10px;">$${Number(totalPrice).toFixed(2)} <span style="font-size:11px;color:#606460;">AUD</span></span></p>
        </td></tr>

        <tr><td style="padding:0;line-height:0;font-size:0;"><div style="height:1px;background:linear-gradient(to right,#080d09,#d4a017 30%,#d4a017 70%,#080d09);opacity:0.35;"></div></td></tr>

        <tr><td style="padding:24px 40px 28px;">
          <p style="margin:0 0 12px;font-family:Georgia,serif;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#8cc40f;">Shipping To</p>
          <p style="margin:0;font-family:Georgia,serif;font-size:14px;color:#c8c8c0;line-height:1.7;">${address}</p>
        </td></tr>

        <tr><td style="padding:0;line-height:0;font-size:0;"><div style="height:1px;background:linear-gradient(to right,#080d09,#d4a017 30%,#d4a017 70%,#080d09);opacity:0.35;"></div></td></tr>

        <tr><td style="padding:20px 40px 28px;background-color:#080d09 !important;border-top:1px solid #1a201b;border-radius:0 0 3px 3px;">
          <p style="margin:0;font-family:Georgia,serif;font-size:12px;color:#3a3e3b;line-height:1.9;">
            Questions? Reply to this email or write to hello@profoundnaturals.com.au<br>
            <span style="color:#606460;">Profound Naturals · profoundnaturals.com.au</span>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function internalEmail({ customerEmail: custEmail, formulaName, ingredients, totalPrice, shippingAddress }) {
  const address = shippingAddress
    ? [shippingAddress.line1, shippingAddress.line2, shippingAddress.city, shippingAddress.state, shippingAddress.postal_code, shippingAddress.country].filter(Boolean).join(", ")
    : "Not provided";
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#080d09 !important;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#080d09 !important;">
    <tr><td align="center" style="padding:40px 16px 48px;background-color:#080d09 !important;">
      <table width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;background-color:#0f1510 !important;border:1px solid #2a2e2b;border-radius:3px;">

        <tr><td style="padding:36px 40px 28px;background-color:#0f1510 !important;">
          <p style="margin:0 0 10px;font-family:Georgia,serif;font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:#8cc40f;">Builder — New Order</p>
          <h1 style="margin:0 0 10px;font-family:Georgia,serif;font-size:28px;font-weight:400;color:#d4a017;">Formula Order Received</h1>
          <p style="margin:0;font-family:Georgia,serif;font-size:14px;color:#a0a098;font-style:italic;">Payment confirmed via Stripe. Ready to fulfil.</p>
        </td></tr>

        <tr><td style="padding:0;line-height:0;font-size:0;"><div style="height:1px;background:linear-gradient(to right,#080d09,#d4a017 30%,#d4a017 70%,#080d09);opacity:0.35;"></div></td></tr>

        <tr><td style="padding:28px 40px 24px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr><td width="130" style="padding:7px 12px 7px 0;font-family:Georgia,serif;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:#606460;">Customer</td><td style="padding:7px 0;font-family:Georgia,serif;font-size:14px;color:#35b8d4;">${custEmail || "Unknown"}</td></tr>
            <tr><td width="130" style="padding:7px 12px 7px 0;font-family:Georgia,serif;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:#606460;">Formula</td><td style="padding:7px 0;font-family:Georgia,serif;font-size:14px;color:#f0ede8;font-style:italic;">${formulaName || "Unnamed"}</td></tr>
            <tr><td width="130" style="padding:7px 12px 7px 0;font-family:Georgia,serif;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:#606460;">Ship to</td><td style="padding:7px 0;font-family:Georgia,serif;font-size:14px;color:#c8c8c0;">${address}</td></tr>
            <tr><td width="130" style="padding:7px 12px 7px 0;font-family:Georgia,serif;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:#606460;">Status</td><td style="padding:7px 0;"><span style="display:inline-block;padding:3px 10px;border-radius:2px;background:#0e1f0a;border:1px solid #8cc40f;font-family:Georgia,serif;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:#8cc40f;">Payment confirmed</span></td></tr>
          </table>
        </td></tr>

        <tr><td style="padding:0;line-height:0;font-size:0;"><div style="height:1px;background:linear-gradient(to right,#080d09,#d4a017 30%,#d4a017 70%,#080d09);opacity:0.35;"></div></td></tr>

        <tr><td style="padding:28px 40px 8px;">
          <p style="margin:0 0 12px;font-family:Georgia,serif;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#8cc40f;">Formula Breakdown</p>
          ${buildFormulaTable(ingredients)}
        </td></tr>

        <tr><td style="padding:16px 40px 32px;text-align:right;">
          <p style="margin:0;font-family:Georgia,serif;font-size:14px;color:#a0a098;">Order total <span style="color:#d4a017;font-size:17px;margin-left:10px;">$${Number(totalPrice).toFixed(2)} <span style="font-size:11px;color:#606460;">AUD</span></span></p>
        </td></tr>

        <tr><td style="padding:20px 40px 28px;background-color:#080d09 !important;border-top:1px solid #1a201b;border-radius:0 0 3px 3px;">
          <p style="margin:0;font-family:Georgia,serif;font-size:12px;color:#3a3e3b;line-height:1.9;">
            Internal notification — do not reply.<br>
            <span style="color:#606460;">Profound Naturals Builder · profoundnaturals.online</span>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

  const sig = event.headers["stripe-signature"];
  let stripeEvent;
  try {
    stripeEvent = stripe.webhooks.constructEvent(event.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook signature failed:", err.message);
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }

  if (stripeEvent.type !== "checkout.session.completed") return { statusCode: 200, body: "Event ignored" };

  const session = stripeEvent.data.object;
  const metadata = session.metadata || {};
  const ingredients = parseFormulaFromMetadata(metadata);
  const formulaName = metadata.formula_name || "";
  const totalPrice = parseFloat(metadata.total_price_aud || "0");
  const custEmail = session.customer_details?.email || "";
  const shippingAddress = session.shipping_details?.address || null;

  try {
    const jobs = [];
    if (custEmail) {
      jobs.push(transporter.sendMail({
        from: `"Profound Naturals" <${process.env.ZOHO_USER}>`,
        to: custEmail,
        subject: `Payment confirmed${formulaName ? ` — ${formulaName}` : " — Your Signature Scent"}`,
        html: customerEmail({ formulaName, ingredients, totalPrice, shippingAddress }),
      }));
    }
    jobs.push(transporter.sendMail({
      from: `"Profound Naturals Builder" <${process.env.ZOHO_USER}>`,
      to: process.env.ZOHO_USER,
      subject: `New order${formulaName ? ` — ${formulaName}` : ""} · $${Number(totalPrice).toFixed(2)} AUD`,
      html: internalEmail({ customerEmail: custEmail, formulaName, ingredients, totalPrice, shippingAddress }),
    }));
    await Promise.all(jobs);
  } catch (err) {
    console.error("Email error:", err);
  }

  return { statusCode: 200, body: "OK" };
};
