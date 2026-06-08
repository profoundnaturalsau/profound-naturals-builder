const Stripe     = require('stripe');
const nodemailer = require('nodemailer');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let name, email, phone, notes, formulaName, formula, price;
  try {
    ({ name, email, phone, notes, formulaName, formula, price } = JSON.parse(event.body));
  } catch {
    return { statusCode: 400, body: 'Invalid request body' };
  }

  if (!name || !email || !formula || !formula.length || !price) {
    return { statusCode: 400, body: 'Missing required fields' };
  }

  // ── Send formula email to owner ──────────────────────────────────────────
  const transporter = nodemailer.createTransport({
    host: 'smtp.zoho.com.au',
    port: 465,
    secure: true,
    auth: { user: process.env.ZOHO_USER, pass: process.env.ZOHO_PASS },
    tls: { rejectUnauthorized: false },
  });

  const fallbackTransporter = nodemailer.createTransport({
    host: 'smtp.zoho.com',
    port: 465,
    secure: true,
    auth: { user: process.env.ZOHO_USER, pass: process.env.ZOHO_PASS },
    tls: { rejectUnauthorized: false },
  });

  const formulaRows = formula.map(line =>
    `<tr>
      <td style="padding:8px 0; color:#e6ece7; border-bottom:1px solid rgba(255,255,255,0.06);">${line}</td>
    </tr>`
  ).join('');

  const mailOptions = {
    from: `"Profound Naturals" <${process.env.ZOHO_USER}>`,
    to: process.env.ZOHO_USER,
    replyTo: email,
    subject: `Custom Formula Order — ${name}${formulaName ? ' · ' + formulaName : ''}`,
    html: `
      <div style="font-family:sans-serif; max-width:600px; margin:0 auto; padding:32px; background:#0f1610; color:#e6ece7;">
        <h2 style="color:#8cc40f; font-size:1.1rem; margin-bottom:4px; letter-spacing:.1em; text-transform:uppercase;">
          Custom Scent Formula — Checkout Initiated
        </h2>
        <p style="font-size:.75rem; color:rgba(230,236,231,0.5); margin-bottom:28px; letter-spacing:.06em;">profoundnaturals.online</p>

        <table style="width:100%; border-collapse:collapse; margin-bottom:24px;">
          <tr>
            <td style="padding:8px 0; color:#a0d916; font-size:.75rem; letter-spacing:.1em; text-transform:uppercase; width:120px;">Name</td>
            <td style="padding:8px 0; color:#e6ece7;">${name}</td>
          </tr>
          <tr>
            <td style="padding:8px 0; color:#a0d916; font-size:.75rem; letter-spacing:.1em; text-transform:uppercase;">Email</td>
            <td style="padding:8px 0;"><a href="mailto:${email}" style="color:#35b8d4;">${email}</a></td>
          </tr>
          ${phone ? `<tr>
            <td style="padding:8px 0; color:#a0d916; font-size:.75rem; letter-spacing:.1em; text-transform:uppercase;">Phone</td>
            <td style="padding:8px 0; color:#e6ece7;">${phone}</td>
          </tr>` : ''}
          ${formulaName ? `<tr>
            <td style="padding:8px 0; color:#a0d916; font-size:.75rem; letter-spacing:.1em; text-transform:uppercase;">Formula Name</td>
            <td style="padding:8px 0; color:#e6ece7; font-style:italic;">${formulaName}</td>
          </tr>` : ''}
        </table>

        <div style="background:#141d15; padding:20px 24px; border-left:3px solid #8cc40f; margin-bottom:20px;">
          <p style="font-size:.7rem; color:#a0d916; letter-spacing:.12em; text-transform:uppercase; margin-bottom:12px;">
            Formula — 50ml Eau de Parfum · 30% Concentrate
          </p>
          <table style="width:100%; border-collapse:collapse;">
            ${formulaRows}
          </table>
          <p style="margin-top:14px; font-size:.85rem; color:#d4a017; font-weight:500;">
            Formula Price: $${parseFloat(price).toFixed(2)} AUD
          </p>
        </div>

        ${notes ? `
        <div style="padding:16px 20px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); margin-bottom:20px;">
          <p style="font-size:.7rem; color:#a0d916; letter-spacing:.1em; text-transform:uppercase; margin-bottom:8px;">Notes</p>
          <p style="color:#e6ece7; font-size:.85rem; line-height:1.7; font-style:italic;">${notes}</p>
        </div>` : ''}

        <p style="font-size:.7rem; color:rgba(230,236,231,0.4); margin-top:24px;">
          Customer proceeded to Stripe checkout. Await payment confirmation.
        </p>
      </div>
    `,
  };

  // Send email (non-blocking — don't fail checkout if email fails)
  try {
    await transporter.sendMail(mailOptions);
  } catch {
    try { await fallbackTransporter.sendMail(mailOptions); } catch (err) {
      console.warn('Formula email failed (checkout still proceeding):', err.message);
    }
  }

  // ── Create Stripe checkout session ───────────────────────────────────────
  const priceInCents = Math.round(parseFloat(price) * 100);
  const expressFree  = parseFloat(price) >= 180;
  const standardFree = parseFloat(price) >= 85;

  const productName = formulaName
    ? `Custom Signature Scent — "${formulaName}"`
    : 'Custom Signature Scent';

  const baseUrl = process.env.URL || 'https://profoundnaturals.online';

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'aud',
            unit_amount: priceInCents,
            product_data: {
              name: productName,
              description: '50ml Eau de Parfum · 30% Concentrate · Handcrafted to your formula',
            },
          },
          quantity: 1,
        },
      ],
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
      customer_email: email,
      metadata: {
        customer_name: name,
        formula_name: formulaName || '',
        phone: phone || '',
      },
      success_url: `${baseUrl}/?order_success=1`,
      cancel_url:  `${baseUrl}/?order_cancelled=1`,
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
