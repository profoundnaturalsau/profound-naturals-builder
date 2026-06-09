// netlify/Functions/email-templates.js
// Shared HTML email template helpers for all Profound Naturals transactional emails.
// Dark luxe aesthetic — matches profoundnaturals.online builder.
//
// Colours:
//   #080d09  bg (near-black green-black)
//   #0f1510  card bg
//   #1a201b  subtle section bg
//   #2a2e2b  border
//   #8cc40f  green (brand / labels)
//   #a0d916  green-light
//   #d4a017  amber (headings / highlights)
//   #f0ede8  near-white body text
//   #c8c8c0  secondary text
//   #a0a098  muted text
//   #606460  footer text

// ─────────────────────────────────────────────────────────────────────────────
// SHARED PARTIALS
// ─────────────────────────────────────────────────────────────────────────────

function emailWrapper(innerContent) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="dark">
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#080d09;-webkit-text-size-adjust:100%;mso-line-height-rule:exactly;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
    style="background-color:#080d09;min-width:320px;">
    <tr>
      <td align="center" style="padding:40px 16px 48px;">

        <!-- Outer card -->
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0"
          style="max-width:560px;width:100%;background-color:#0f1510;border:1px solid #2a2e2b;border-radius:3px;">

          ${innerContent}

        </table>
        <!-- /card -->

        <!-- Footer below card -->
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0"
          style="max-width:560px;width:100%;margin-top:24px;">
          <tr>
            <td style="padding:0 8px;text-align:center;">
              <p style="margin:0;font-family:Georgia,serif;font-size:11px;letter-spacing:0.15em;
                color:#3a3e3b;text-transform:uppercase;">
                Profound&nbsp;Naturals &nbsp;·&nbsp; profoundnaturals.com.au
              </p>
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
</body>
</html>`;
}

// Amber rule divider
function divider() {
  return `<tr>
    <td style="padding:0;line-height:0;font-size:0;">
      <div style="height:1px;background:linear-gradient(to right,#080d09,#d4a017 30%,#d4a017 70%,#080d09);opacity:0.35;"></div>
    </td>
  </tr>`;
}

// Top header block — eyebrow + headline + subline
function headerBlock({ eyebrow, headline, subline }) {
  return `<tr>
    <td style="padding:36px 40px 28px;">
      <!-- Eyebrow -->
      <p style="margin:0 0 10px;font-family:Georgia,serif;font-size:10px;letter-spacing:0.22em;
        text-transform:uppercase;color:#8cc40f;">
        ${eyebrow}
      </p>
      <!-- Headline -->
      <h1 style="margin:0 0 10px;font-family:Georgia,serif;font-size:28px;font-weight:400;
        letter-spacing:0.04em;color:#d4a017;line-height:1.2;">
        ${headline}
      </h1>
      <!-- Subline -->
      <p style="margin:0;font-family:Georgia,serif;font-size:14px;color:#a0a098;
        font-style:italic;line-height:1.6;">
        ${subline}
      </p>
    </td>
  </tr>`;
}

// Two-column label + value row
function detailRow(label, value, valueColour) {
  return `<tr>
    <td width="130" valign="top"
      style="padding:7px 12px 7px 0;font-family:Georgia,serif;font-size:10px;
        letter-spacing:0.18em;text-transform:uppercase;color:#606460;white-space:nowrap;">
      ${label}
    </td>
    <td valign="top"
      style="padding:7px 0;font-family:Georgia,serif;font-size:14px;
        color:${valueColour || "#c8c8c0"};line-height:1.5;">
      ${value}
    </td>
  </tr>`;
}

// Section label above content
function sectionLabel(text) {
  return `<p style="margin:0 0 12px;font-family:Georgia,serif;font-size:10px;
    letter-spacing:0.2em;text-transform:uppercase;color:#8cc40f;">${text}</p>`;
}

// Formula ingredient table
function formulaTable(ingredients) {
  if (!ingredients || !ingredients.length) {
    return `<p style="font-family:Georgia,serif;font-size:14px;color:#a0a098;margin:0;">
      Formula details unavailable.</p>`;
  }

  const rows = ingredients.map((i) => `
    <tr>
      <td style="padding:9px 16px 9px 0;font-family:Georgia,serif;font-size:14px;
        color:#f0ede8;border-bottom:1px solid #1e231f;line-height:1.4;">
        ${i.name}
      </td>
      <td style="padding:9px 12px 9px 0;font-family:Georgia,serif;font-size:13px;
        color:#d4a017;text-align:center;border-bottom:1px solid #1e231f;
        white-space:nowrap;">
        ${i.pct}%
      </td>
      <td style="padding:9px 0;font-family:Georgia,serif;font-size:13px;
        color:#a0a098;text-align:right;border-bottom:1px solid #1e231f;
        white-space:nowrap;">
        $${Number(i.price).toFixed(2)}
      </td>
    </tr>`).join("");

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <thead>
        <tr>
          <th style="text-align:left;padding:0 16px 8px 0;font-family:Georgia,serif;
            font-size:10px;letter-spacing:0.16em;text-transform:uppercase;
            color:#8cc40f;font-weight:400;border-bottom:1px solid #2a2e2b;">
            Ingredient
          </th>
          <th style="text-align:center;padding:0 12px 8px 0;font-family:Georgia,serif;
            font-size:10px;letter-spacing:0.16em;text-transform:uppercase;
            color:#8cc40f;font-weight:400;border-bottom:1px solid #2a2e2b;">
            %
          </th>
          <th style="text-align:right;padding:0 0 8px;font-family:Georgia,serif;
            font-size:10px;letter-spacing:0.16em;text-transform:uppercase;
            color:#8cc40f;font-weight:400;border-bottom:1px solid #2a2e2b;">
            Cost
          </th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

// Total price row
function totalRow(label, amountAUD) {
  return `<tr>
    <td style="padding:16px 40px 0;text-align:right;">
      <p style="margin:0;font-family:Georgia,serif;font-size:14px;color:#a0a098;">
        ${label}
        <span style="color:#d4a017;font-size:17px;margin-left:10px;">
          $${Number(amountAUD).toFixed(2)}&nbsp;<span style="font-size:11px;letter-spacing:0.1em;color:#606460;">AUD</span>
        </span>
      </p>
    </td>
  </tr>`;
}

// Amber CTA button
function ctaButton(text, url) {
  return `<tr>
    <td style="padding:28px 40px 8px;text-align:center;">
      <a href="${url}"
        style="display:inline-block;padding:13px 36px;font-family:Georgia,serif;
          font-size:12px;letter-spacing:0.2em;text-transform:uppercase;
          color:#080d09;background-color:#d4a017;text-decoration:none;
          border-radius:2px;font-weight:400;">
        ${text}
      </a>
    </td>
  </tr>`;
}

// Status badge — green for confirmed, amber for pending
function statusBadge(status, colour) {
  const bg = colour === "amber" ? "#2b2200" : "#0e1f0a";
  const fg = colour === "amber" ? "#d4a017" : "#8cc40f";
  return `<span style="display:inline-block;padding:3px 10px;border-radius:2px;
    background:${bg};border:1px solid ${fg};font-family:Georgia,serif;
    font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:${fg};">
    ${status}
  </span>`;
}

// Contact / footer strip inside card
function cardFooter(text) {
  return `<tr>
    <td style="padding:20px 40px 28px;background-color:#080d09;
      border-top:1px solid #1a201b;border-radius:0 0 3px 3px;">
      <p style="margin:0;font-family:Georgia,serif;font-size:12px;
        color:#3a3e3b;line-height:1.9;">
        ${text}
      </p>
    </td>
  </tr>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE A — Checkout initiated (from request-formula.js)
// ─────────────────────────────────────────────────────────────────────────────

function checkoutInitiatedEmail({ name, email, phone, formulaName, ingredients, totalPrice }) {
  const inner = `
    ${headerBlock({
      eyebrow: "Profound Naturals — Custom Scent",
      headline: "Your Signature Scent",
      subline: "Checkout initiated — complete payment to confirm your formula.",
    })}

    ${divider()}

    <!-- Details -->
    <tr>
      <td style="padding:28px 40px 24px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          ${detailRow("Name", name || "—")}
          ${detailRow("Email", email || "—", "#35b8d4")}
          ${detailRow("Phone", phone || "—")}
          ${detailRow("Formula", `<em>${formulaName || "Unnamed"}</em>`, "#f0ede8")}
          ${detailRow("Status", statusBadge("Pending payment", "amber"))}
        </table>
      </td>
    </tr>

    ${divider()}

    <!-- Formula breakdown -->
    <tr>
      <td style="padding:28px 40px 8px;">
        ${sectionLabel("Formula — 50ml Eau de Parfum · 30% Concentrate")}
        ${formulaTable(ingredients)}
      </td>
    </tr>

    ${totalRow("Formula price", totalPrice)}

    <!-- Spacer -->
    <tr><td style="padding:0 0 8px;"></td></tr>

    ${divider()}

    ${cardFooter(`
      This notification was sent when checkout was initiated.<br>
      A second email will confirm once payment is complete.<br><br>
      <span style="color:#606460;">hello@profoundnaturals.com.au &nbsp;·&nbsp; profoundnaturals.com.au</span>
    `)}
  `;

  return emailWrapper(inner);
}

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE B — Customer payment confirmed (from stripe-webhook.js)
// ─────────────────────────────────────────────────────────────────────────────

function paymentConfirmedCustomerEmail({ formulaName, ingredients, totalPrice, shippingAddress }) {
  const addressLines = shippingAddress
    ? [
        shippingAddress.line1,
        shippingAddress.line2,
        shippingAddress.city,
        shippingAddress.state,
        shippingAddress.postal_code,
        shippingAddress.country,
      ].filter(Boolean).join(", ")
    : "Not provided";

  const inner = `
    ${headerBlock({
      eyebrow: "Profound Naturals — Your Order",
      headline: "Payment Confirmed",
      subline: "Your formula has been received — we will begin crafting it shortly.",
    })}

    ${divider()}

    <!-- Formula name -->
    <tr>
      <td style="padding:28px 40px 4px;">
        ${sectionLabel("Your Signature Scent")}
        <p style="margin:0;font-family:Georgia,serif;font-size:22px;font-weight:400;
          font-style:italic;color:#f0ede8;letter-spacing:0.03em;">
          ${formulaName || "Unnamed Formula"}
        </p>
        <p style="margin:10px 0 0;">
          ${statusBadge("Confirmed", "green")}
        </p>
      </td>
    </tr>

    <!-- Formula table -->
    <tr>
      <td style="padding:24px 40px 8px;">
        ${sectionLabel("Formula Breakdown")}
        ${formulaTable(ingredients)}
      </td>
    </tr>

    ${totalRow("Total paid", totalPrice)}

    <!-- Spacer -->
    <tr><td style="padding:8px 0;"></td></tr>

    ${divider()}

    <!-- Shipping -->
    <tr>
      <td style="padding:24px 40px 28px;">
        ${sectionLabel("Shipping To")}
        <p style="margin:0;font-family:Georgia,serif;font-size:14px;
          color:#c8c8c0;line-height:1.7;">${addressLines}</p>
      </td>
    </tr>

    ${divider()}

    ${cardFooter(`
      Questions? Reply to this email or write to us at hello@profoundnaturals.com.au<br>
      <span style="color:#606460;">Profound Naturals &nbsp;·&nbsp; profoundnaturals.com.au</span>
    `)}
  `;

  return emailWrapper(inner);
}

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE C — Internal order notification (post-payment, to hello@)
// ─────────────────────────────────────────────────────────────────────────────

function internalOrderEmail({ customerEmail, formulaName, ingredients, totalPrice, shippingAddress }) {
  const addressLines = shippingAddress
    ? [
        shippingAddress.line1,
        shippingAddress.line2,
        shippingAddress.city,
        shippingAddress.state,
        shippingAddress.postal_code,
        shippingAddress.country,
      ].filter(Boolean).join(", ")
    : "Not provided";

  const inner = `
    ${headerBlock({
      eyebrow: "Builder — New Order",
      headline: "Formula Order Received",
      subline: "Payment confirmed via Stripe. Ready to fulfil.",
    })}

    ${divider()}

    <!-- Customer details -->
    <tr>
      <td style="padding:28px 40px 24px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          ${detailRow("Customer", customerEmail || "Unknown", "#35b8d4")}
          ${detailRow("Formula", `<em>${formulaName || "Unnamed"}</em>`, "#f0ede8")}
          ${detailRow("Ship to", addressLines)}
          ${detailRow("Status", statusBadge("Payment confirmed", "green"))}
        </table>
      </td>
    </tr>

    ${divider()}

    <!-- Formula table -->
    <tr>
      <td style="padding:28px 40px 8px;">
        ${sectionLabel("Formula Breakdown")}
        ${formulaTable(ingredients)}
      </td>
    </tr>

    ${totalRow("Order total", totalPrice)}

    <!-- Spacer -->
    <tr><td style="padding:8px 0;"></td></tr>

    ${divider()}

    ${cardFooter(`
      Internal notification — do not reply.<br>
      <span style="color:#606460;">Profound Naturals Builder &nbsp;·&nbsp; profoundnaturals.online</span>
    `)}
  `;

  return emailWrapper(inner);
}

// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  checkoutInitiatedEmail,
  paymentConfirmedCustomerEmail,
  internalOrderEmail,
};
