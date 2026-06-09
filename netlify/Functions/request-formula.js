// netlify/Functions/request-formula.js
// Sends an internal "checkout initiated" notification email when the customer
// clicks Continue to Checkout, BEFORE payment is taken.
//
// Post-payment confirmation is handled by stripe-webhook.js instead.

const nodemailer = require("nodemailer");
const { checkoutInitiatedEmail } = require("./email-templates");

const transporter = nodemailer.createTransport({
  host: "smtp.zoho.com.au",
  port: 465,
  secure: true,
  auth: {
    user: process.env.ZOHO_USER,
    pass: process.env.ZOHO_PASS,
  },
});

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
    name,
    email,
    phone,
    formulaName,
    ingredients,  // array of { name, pct, price }
    totalPrice,
  } = body;

  const html = checkoutInitiatedEmail({
    name,
    email,
    phone,
    formulaName,
    ingredients: ingredients || [],
    totalPrice: totalPrice || 0,
  });

  try {
    await transporter.sendMail({
      from: `"Profound Naturals Builder" <${process.env.ZOHO_USER}>`,
      to: process.env.ZOHO_USER,
      subject: `Formula checkout initiated${formulaName ? ` — ${formulaName}` : ""}`,
      html,
    });

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    console.error("Email error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
