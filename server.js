require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const db = require('./database');
const { buildAllDownloads } = require('./scripts/build-downloads');
const { buildPersonalizedZip, PLACEHOLDERS } = require('./scripts/personalize');

// Build zips on startup — force rebuild every deploy so templates are always fresh
buildAllDownloads(true).catch(e => console.error('[downloads] startup error:', e.message));

const upload = multer({ dest: path.join(__dirname, 'uploads') });

const app = express();
const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// ── MIDDLEWARE ────────────────────────────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
// Serve static files but block /templates/* so Express routes handle those
app.use((req, res, next) => {
  if (req.path.startsWith('/templates/') && !req.path.match(/\.[a-z]{2,4}$/i)) return next();
  express.static(path.join(__dirname, 'public'))(req, res, next);
});
// Serve template previews under /preview/ — inject watermark into HTML pages
app.use('/preview', (req, res, next) => {
  const fs = require('fs');
  const filePath = path.join(__dirname, 'public', 'templates', req.path);
  if (!req.path.endsWith('.html') && !req.path.endsWith('/') && req.path !== '/') return next();
  const htmlFile = req.path.endsWith('.html') ? filePath : path.join(filePath, 'index.html');
  if (!fs.existsSync(htmlFile)) return next();
  let html = fs.readFileSync(htmlFile, 'utf8');
  const watermark = `
<style>
#sbm-watermark{position:fixed;top:0;left:0;width:100%;z-index:999999;pointer-events:none;}
#sbm-watermark-bar{background:rgba(27,47,78,0.95);color:#C9922B;text-align:center;padding:9px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:.82rem;font-weight:700;letter-spacing:.04em;box-shadow:0 2px 8px rgba(0,0,0,0.3);}
#sbm-watermark-bar a{color:#C9922B;text-decoration:underline;pointer-events:all;}
#sbm-watermark-diag{position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;overflow:hidden;z-index:999998;}
#sbm-watermark-diag::before{content:'PREVIEW ONLY — sitesbymel.com — PREVIEW ONLY — sitesbymel.com — PREVIEW ONLY — sitesbymel.com';position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-35deg);font-size:1.4rem;font-weight:800;color:rgba(27,47,78,0.07);white-space:nowrap;font-family:Arial,sans-serif;letter-spacing:.1em;width:200%;text-align:center;}
</style>
<script>
(function(){
  var BAR_H = 42;
  function nudge(){
    document.querySelectorAll('header,nav,.navbar,.nav-bar,.site-nav,[class*="navbar"],[class*="nav-wrap"],[id*="navbar"],[id*="nav-bar"]').forEach(function(el){
      var s = window.getComputedStyle(el);
      if(s.position==='fixed'||s.position==='sticky'){
        var cur = parseInt(el.style.top)||0;
        if(cur < BAR_H){ el.style.top = BAR_H+'px'; }
      }
    });
    document.body.style.paddingTop = BAR_H+'px';
  }
  if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',nudge);}else{nudge();}
  window.addEventListener('load',nudge);
})();
</script>
<div id="sbm-watermark">
  <div id="sbm-watermark-bar">
    PREVIEW ONLY &nbsp;|&nbsp; This design is property of <a href="https://sitesbymel.com/templates" target="_blank">sitesbymel.com</a> &nbsp;|&nbsp; Purchase to use &nbsp;|&nbsp; <a href="https://sitesbymel.com/templates" target="_blank">Buy This Template &rarr;</a>
  </div>
</div>
<div id="sbm-watermark-diag"></div>`;
  html = html.replace('</body>', watermark + '\n</body>');
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});
app.use('/preview', express.static(path.join(__dirname, 'public', 'templates')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 1000 * 60 * 60 * 8 }
}));

// Auth middleware
function requireAuth(req, res, next) {
  if (req.session && req.session.admin) return next();
  res.redirect('/admin/login');
}

// ── EMAIL HELPER ──────────────────────────────────────────────────────────────
async function sendEmail({ to, subject, text, html }) {
  if (!process.env.RESEND_API_KEY) return;
  const body = { from: process.env.FROM_ADDRESS || 'Mel <mel@sitesbymel.com>', to, subject };
  if (html) body.html = html; else body.text = text;
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
  } catch(e) { console.error('[email]', e.message); }
}

function autoReplyHtml(name, heading, body) {
  return `<!DOCTYPE html><html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f5f4f2;padding:32px">
<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e0d8">
<div style="background:#1B2F4E;padding:28px 32px"><h1 style="color:#C9922B;font-size:1.2rem;margin:0">Sites by Mel</h1></div>
<div style="padding:28px 32px">
<p style="color:#1a1a1a;font-size:1rem;margin-bottom:16px">Hi ${name},</p>
<p style="color:#333;line-height:1.7;margin-bottom:16px">${heading}</p>
${body}
<p style="color:#333;margin-top:24px;line-height:1.7">Talk soon,<br><strong>Mel</strong><br><span style="color:#888;font-size:.85rem">sitesbymel.com</span></p>
</div>
</div></body></html>`;
}

// ── ANALYTICS TRACKING ────────────────────────────────────────────────────────
function trackView(req) {
  try {
    const ref = req.get('referer') || '';
    let source = 'direct';
    if (ref.includes('google')) source = 'google';
    else if (ref.includes('facebook') || ref.includes('fb.com')) source = 'facebook';
    else if (ref.includes('instagram')) source = 'instagram';
    else if (ref) source = 'other';
    const session_id = req.session?.id || null;
    db.prepare('INSERT INTO page_views (path, referrer, source, session_id) VALUES (?,?,?,?)')
      .run(req.path, ref.slice(0, 500), source, session_id);
  } catch(e) { /* never crash on analytics */ }
}

// ── PUBLIC ROUTES ─────────────────────────────────────────────────────────────

// Home
app.get('/', (req, res) => {
  trackView(req);
  const products = db.prepare('SELECT * FROM products WHERE active=1 ORDER BY sort_order').all();
  res.render('index', { products });
});

// Templates shop
app.get('/templates', (req, res) => {
  trackView(req);
  const products = db.prepare('SELECT * FROM products ORDER BY sort_order').all();
  res.render('templates', { products });
});

// Single template page
app.get('/templates/:slug', (req, res) => {
  trackView(req);
  const product = db.prepare('SELECT * FROM products WHERE slug=?').get(req.params.slug);
  if (!product) return res.redirect('/templates');
  res.render('template-detail', { product });
});

// Services page
app.get('/services', (req, res) => { trackView(req); res.render('services'); });

// Portfolio page
app.get('/portfolio', (req, res) => { trackView(req); res.render('portfolio'); });

// About page
app.get('/about', (req, res) => { trackView(req); res.render('about'); });

// Contact page + form
app.get('/contact', (req, res) => { trackView(req); res.render('contact', { success: false, error: false }); });
app.post('/contact', async (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !message) return res.render('contact', { success: false, error: 'Please fill in all required fields.' });
  db.prepare('INSERT INTO messages (name, email, subject, message) VALUES (?,?,?,?)').run(name, email, subject||'', message);
  // Notify Mel
  await sendEmail({
    to: process.env.CONTACT_EMAIL || 'mbillingsley31@gmail.com',
    subject: `New contact from SitesByMel: ${subject || name}`,
    text: `Name: ${name}\nEmail: ${email}\n\n${message}`
  });
  // Auto-reply to customer
  await sendEmail({
    to: email,
    subject: `Got your message — Sites by Mel`,
    html: autoReplyHtml(name,
      `I received your message and I'll be back in touch within 24 hours.`,
      `<p style="color:#333;line-height:1.7">In the meantime, feel free to browse my <a href="https://sitesbymel.com/templates" style="color:#C9922B">template shop</a> or <a href="https://sitesbymel.com/services" style="color:#C9922B">services page</a> to see what I offer.</p>`)
  });
  res.render('contact', { success: true, error: false });
});

// Quote forms — two paths
app.get('/quote', (req, res) => { trackView(req); res.render('quote', { success: false, error: false, type: req.query.type || '' }); });
app.get('/quote/simple', (req, res) => { trackView(req); res.render('quote-simple', { success: false, error: false }); });
app.get('/quote/full', (req, res) => { trackView(req); res.render('quote-full', { success: false, error: false }); });

app.post('/quote', async (req, res) => {
  const { name, email, phone, business_name, business_url, project_type, budget, timeline, description } = req.body;
  if (!name || !email || !description) return res.render('quote', { success: false, error: 'Please fill in all required fields.', type: '' });
  db.prepare(`INSERT INTO quotes (name,email,phone,business_name,business_url,project_type,budget,timeline,description)
    VALUES (?,?,?,?,?,?,?,?,?)`).run(name, email, phone||'', business_name||'', business_url||'', project_type||'', budget||'', timeline||'', description);
  await sendEmail({
    to: process.env.CONTACT_EMAIL || 'mbillingsley31@gmail.com',
    subject: `New quote request from ${name} — ${business_name || 'no business listed'}`,
    text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone||'—'}\nBusiness: ${business_name||'—'}\nSite: ${business_url||'—'}\nType: ${project_type||'—'}\nBudget: ${budget||'—'}\nTimeline: ${timeline||'—'}\n\n${description}`
  });
  await sendEmail({
    to: email,
    subject: `Your quote request — Sites by Mel`,
    html: autoReplyHtml(name,
      `I received your project details and I'm excited to put together a quote for you.`,
      `<div style="background:#f5f4f2;border-radius:8px;padding:16px 20px;margin:16px 0;font-size:.9rem;color:#333">
        <strong>What happens next:</strong><br>
        <p style="margin-top:8px;line-height:1.8">
        1. I'll review your project details (usually same day)<br>
        2. I'll send you a custom quote with pricing and timeline<br>
        3. If it's a fit, we get started — simple as that
        </p>
      </div>
      <p style="color:#555;font-size:.88rem">Questions in the meantime? Just reply to this email.</p>`)
  });
  res.render('quote', { success: true, error: false, type: '' });
});

app.post('/quote/simple', async (req, res) => {
  const { name, email, phone, business_name, niche, colors, have_logo, have_photos, have_text, domain, notes } = req.body;
  if (!name || !email || !business_name) return res.render('quote-simple', { success: false, error: 'Please fill in all required fields.' });
  const description = `SIMPLE SITE REQUEST\nBusiness: ${business_name}\nNiche: ${niche||'—'}\nColors: ${colors||'—'}\nHas logo: ${have_logo||'no'}\nHas photos: ${have_photos||'no'}\nHas text/copy: ${have_text||'no'}\nDomain: ${domain||'—'}\nNotes: ${notes||'—'}`;
  db.prepare(`INSERT INTO quotes (name,email,phone,business_name,project_type,description) VALUES (?,?,?,?,?,?)`)
    .run(name, email, phone||'', business_name, 'Done-For-You HTML Site', description);
  await sendEmail({ to: process.env.CONTACT_EMAIL || 'mbillingsley31@gmail.com',
    subject: `Simple site request — ${business_name}`, text: `${name}\n${email}\n${phone||''}\n\n${description}` });
  await sendEmail({ to: email, subject: `Your website request — Sites by Mel`,
    html: autoReplyHtml(name, `I got your request for a done-for-you website for ${business_name}!`,
      `<div style="background:#f5f4f2;border-radius:8px;padding:16px 20px;margin:16px 0;font-size:.9rem;color:#333">
        <strong>Here's what happens next:</strong>
        <p style="margin-top:8px;line-height:1.8">
        1. I'll review your details today<br>
        2. I'll send you a quote (usually within 24 hours)<br>
        3. You approve, pay a deposit, and I get started<br>
        4. Your site is live in 3–5 business days
        </p>
      </div>`) });
  res.render('quote-simple', { success: true, error: false });
});

app.post('/quote/full', async (req, res) => {
  const { name, email, phone, business_name, business_url, features, budget, timeline, details } = req.body;
  if (!name || !email || !business_name) return res.render('quote-full', { success: false, error: 'Please fill in all required fields.' });
  const featureList = Array.isArray(features) ? features.join(', ') : features||'—';
  const description = `FULL CMS REQUEST\nBusiness: ${business_name}\nCurrent site: ${business_url||'none'}\nFeatures needed: ${featureList}\nBudget: ${budget||'—'}\nTimeline: ${timeline||'—'}\nDetails: ${details||'—'}`;
  db.prepare(`INSERT INTO quotes (name,email,phone,business_name,business_url,project_type,budget,timeline,description) VALUES (?,?,?,?,?,?,?,?,?)`)
    .run(name, email, phone||'', business_name, business_url||'', 'Full CMS Site', budget||'', timeline||'', description);
  await sendEmail({ to: process.env.CONTACT_EMAIL || 'mbillingsley31@gmail.com',
    subject: `FULL CMS request — ${business_name}`, text: `${name}\n${email}\n${phone||''}\n\n${description}` });
  await sendEmail({ to: email, subject: `Your custom CMS request — Sites by Mel`,
    html: autoReplyHtml(name, `I received your request for a full custom website with admin dashboard for ${business_name}.`,
      `<div style="background:#f5f4f2;border-radius:8px;padding:16px 20px;margin:16px 0;font-size:.9rem;color:#333">
        <strong>What you're getting:</strong>
        <p style="margin-top:8px;line-height:1.8">A custom-built website with your own admin panel — not a template platform, not Squarespace. You'll own every file and pay no monthly platform fees.</p>
      </div>
      <div style="background:#f5f4f2;border-radius:8px;padding:16px 20px;margin:16px 0;font-size:.9rem;color:#333">
        <strong>Next steps:</strong>
        <p style="margin-top:8px;line-height:1.8">
        1. I'll review your requirements (same day)<br>
        2. I'll send a detailed scope + quote within 48 hours<br>
        3. We schedule a quick call to align on details<br>
        4. You approve, pay 50% upfront, and I start building
        </p>
      </div>`) });
  res.render('quote-full', { success: true, error: false });
});

// ── STRIPE CHECKOUT ───────────────────────────────────────────────────────────
const stripe = process.env.STRIPE_SECRET_KEY ? require('stripe')(process.env.STRIPE_SECRET_KEY) : null;

// Buy template
app.post('/buy/:slug', async (req, res) => {
  if (!stripe) {
    console.error('[buy] Stripe not initialized — STRIPE_SECRET_KEY missing');
    return res.send('<h2>Checkout unavailable</h2><p>Stripe is not configured. Please contact mel@sitesbymel.com.</p><a href="/templates">Back to templates</a>');
  }
  const product = db.prepare('SELECT * FROM products WHERE slug=? AND active=1').get(req.params.slug);
  if (!product) {
    console.error('[buy] Product not found:', req.params.slug);
    return res.redirect('/templates');
  }
  try {
    const selectedAddon = req.body.selected_addon || 'none';
    const addonAmounts = { none: 0, drive: 4900, upload: 9700, glove: 14900 };
    const totalAmount = product.price + (addonAmounts[selectedAddon] || 0);
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price_data: {
        currency: 'usd',
        product_data: { name: product.name, description: product.description },
        unit_amount: totalAmount
      }, quantity: 1 }],
      mode: 'payment',
      billing_address_collection: 'auto',
      customer_email: req.body.email || undefined,
      success_url: `${BASE_URL}/order/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${BASE_URL}/templates/${product.slug}`,
      metadata: { product_id: product.id, product_name: product.name, type: 'template', selected_addon: selectedAddon }
    });
    db.prepare(`INSERT INTO orders (product_id, product_name, amount, stripe_session_id, status, admin_notes)
      VALUES (?,?,?,?,'pending',?)`).run(product.id, product.name, totalAmount, session.id, `selected_addon:${selectedAddon}`);
    res.redirect(303, session.url);
  } catch (e) {
    console.error('[buy] Stripe error:', e.message);
    return res.send(`<h2>Checkout error</h2><p>${e.message}</p><a href="/templates/${req.params.slug}">Go back</a>`);
  }
});

// Setup service deposit
app.post('/setup/:slug', async (req, res) => {
  if (!stripe) return res.redirect('/services');
  const product = db.prepare('SELECT * FROM products WHERE slug=?').get(req.params.slug);
  const { name, email, phone, business_name, business_url, notes } = req.body;
  if (!name || !email) return res.redirect('/services');
  const depositAmount = 20000; // $200 deposit
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price_data: {
        currency: 'usd',
        product_data: { name: `Done-For-You Setup${product ? ' — ' + product.name : ''}`, description: 'Setup deposit. Mel will contact you within 24 hours.' },
        unit_amount: depositAmount
      }, quantity: 1 }],
      mode: 'payment',
      success_url: `${BASE_URL}/order/setup-success`,
      cancel_url: `${BASE_URL}/services`,
      metadata: { type: 'setup', name, email }
    });
    db.prepare(`INSERT INTO setup_requests (product_id, product_name, name, email, phone, business_name, business_url, notes, amount, stripe_session_id)
      VALUES (?,?,?,?,?,?,?,?,?,?)`).run(
      product ? product.id : null, product ? product.name : 'No specific template',
      name, email, phone||'', business_name||'', business_url||'', notes||'', depositAmount, session.id
    );
    // Notify Mel
    await sendEmail({
      to: process.env.CONTACT_EMAIL || 'mbillingsley31@gmail.com',
      subject: `New done-for-you setup deposit — ${business_name || name}`,
      text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone||'—'}\nBusiness: ${business_name||'—'}\nCurrent site: ${business_url||'—'}\nTemplate: ${product ? product.name : 'No specific template'}\nNotes: ${notes||'—'}\n\n$200 deposit initiated via Stripe. Check the dashboard for payment confirmation.`
    });
    // Auto-reply to customer
    await sendEmail({
      to: email,
      subject: `Thanks for your deposit — Sites by Mel`,
      html: autoReplyHtml(name,
        `I received your done-for-you setup deposit — you're officially on my schedule!`,
        `<div style="background:#f5f4f2;border-radius:8px;padding:16px 20px;margin:16px 0;font-size:.9rem;color:#333">
          <strong>What happens next:</strong>
          <p style="margin-top:8px;line-height:1.8">
          1. I'll reach out within 24 hours to collect your content — logo, photos, and any text you have<br>
          2. I'll customize your template with your branding and info<br>
          3. You'll get a preview link to approve before anything goes live<br>
          4. Once approved, I'll connect your domain and flip the switch — your site is live!
          </p>
        </div>
        <p style="color:#555;font-size:.88rem">Questions in the meantime? Just reply to this email or reach me at <a href="mailto:mel@sitesbymel.com" style="color:#C9922B">mel@sitesbymel.com</a>.</p>`)
    });
    res.redirect(303, session.url);
  } catch (e) {
    console.error(e);
    res.redirect('/services');
  }
});

// Order success — template download
app.get('/order/success', async (req, res) => {
  const { session_id } = req.query;
  if (!session_id) return res.redirect('/');

  let order = db.prepare('SELECT * FROM orders WHERE stripe_session_id=?').get(session_id);
  if (!order) return res.render('order-success', { order: null, downloadUrl: null });

  // If customer_email not yet set by webhook, fetch directly from Stripe
  if (!order.customer_email && stripe) {
    try {
      const stripeSession = await stripe.checkout.sessions.retrieve(session_id);
      const email = stripeSession.customer_details?.email || '';
      const name  = stripeSession.customer_details?.name  || '';
      if (email) {
        db.prepare("UPDATE orders SET customer_email=?, customer_name=?, status='paid' WHERE id=?")
          .run(email, name, order.id);
        order.customer_email = email;
        order.customer_name  = name;
      }
    } catch (e) { console.error('[success] stripe fetch error:', e.message); }
  }

  // Generate download token if not already done
  if (!order.download_token) {
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
    db.prepare("UPDATE orders SET status='paid', download_token=?, download_expires_at=? WHERE id=?")
      .run(token, expires, order.id);
    order.download_token = token;
    // Email the customer their download link
    if (order.customer_email) {
      await sendEmail({
        to: order.customer_email,
        subject: `Your download is ready — ${order.product_name}`,
        html: autoReplyHtml(
          order.customer_name || 'there',
          `Thank you for purchasing <strong>${order.product_name}</strong>!`,
          `Your personalization page and download link is ready. Click below to personalize your template with your business details and download your files.<br><br>Your link is valid for <strong>48 hours</strong>.`,
          `${BASE_URL}/personalize/${token}`,
          'Personalize & Download My Template'
        )
      });
    }
  }
  res.redirect(`/personalize/${order.download_token}`);
});

app.get('/order/setup-success', (req, res) => res.render('setup-success'));

// Personalization form — shown after purchase before download
app.get('/personalize/:token', (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE download_token=?').get(req.params.token);
  if (!order) return res.status(404).send('Order not found.');
  const product = db.prepare('SELECT * FROM products WHERE id=?').get(order.product_id);
  if (!product) return res.status(404).send('Product not found.');
  const placeholder = PLACEHOLDERS[product.slug] || {};
  res.render('personalize', { token: req.params.token, product, placeholder });
});

// Build personalized zip and deliver it (or route to Stripe for add-ons)
app.post('/personalize/:token', upload.array('photos', 5), async (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE download_token=?').get(req.params.token);
  if (!order) return res.status(404).send('Order not found.');
  if (new Date(order.download_expires_at) < new Date()) return res.status(410).send('Download link expired. Contact mel@sitesbymel.com');
  const product = db.prepare('SELECT * FROM products WHERE id=?').get(order.product_id);
  if (!product) return res.status(404).send('Product not found.');

  const data = {
    businessName: req.body.businessName || '',
    phone: req.body.phone || '',
    email: req.body.email || '',
    address: req.body.address || '',
    tagline: req.body.tagline || '',
    city: req.body.city || '',
  };

  // Check add-ons
  const wantsDrive  = req.body.addon_drive === '1';
  const wantsUpload = req.body.addon_upload === '1';
  const wantsGlove  = req.body.addon_glove === '1';
  const addonTotal  = (wantsDrive ? 4900 : 0) + (wantsUpload ? 9700 : 0) + (wantsGlove ? 14900 : 0);

  // Build the personalized zip first regardless
  const tmpPath = path.join(__dirname, 'downloads', `custom-${order.id}-${Date.now()}.zip`);
  const niche = (PLACEHOLDERS[product.slug] || {}).niche || product.category;
  try { await buildPersonalizedZip(product.slug, product.name, niche, data, tmpPath); } catch(e) {
    console.error('[personalize]', e.message);
    return res.redirect(`/download/${req.params.token}`);
  }

  // Save add-on request to DB if any selected
  if (addonTotal > 0 && stripe) {
    const photoPaths = (req.files || []).map(f => f.path);
    const addonTypes = [wantsDrive && 'drive_link', wantsUpload && 'photo_upload', wantsGlove && 'white_glove'].filter(Boolean).join(',');

    const addonRecord = db.prepare(`INSERT INTO template_addons
      (order_id, customer_name, customer_email, product_name, addon_type, addon_amount, drive_link, photo_paths)
      VALUES (?,?,?,?,?,?,?,?)`).run(
      order.id, order.customer_name || '', order.customer_email || '',
      product.name, addonTypes, addonTotal,
      req.body.drive_link || '', JSON.stringify(photoPaths)
    );

    const addonLineItems = [];
    if (wantsDrive)  addonLineItems.push({ price_data: { currency:'usd', product_data:{ name:'Photo Swap via Google Drive' }, unit_amount:4900 }, quantity:1 });
    if (wantsUpload) addonLineItems.push({ price_data: { currency:'usd', product_data:{ name:'Direct Photo Upload' }, unit_amount:9700 }, quantity:1 });
    if (wantsGlove)  addonLineItems.push({ price_data: { currency:'usd', product_data:{ name:'White-Glove Finish' }, unit_amount:14900 }, quantity:1 });

    try {
      const stripeSession = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: addonLineItems,
        mode: 'payment',
        success_url: `${BASE_URL}/order/addon-success?addon_id=${addonRecord.lastInsertRowid}&token=${req.params.token}`,
        cancel_url: `${BASE_URL}/personalize/${req.params.token}`,
        customer_email: order.customer_email || undefined,
        metadata: { addon_id: addonRecord.lastInsertRowid, order_id: order.id, type: 'addon' }
      });
      db.prepare('UPDATE template_addons SET stripe_session_id=? WHERE id=?').run(stripeSession.id, addonRecord.lastInsertRowid);

      // Store zip path temporarily so we can deliver after payment
      db.prepare('UPDATE template_addons SET admin_notes=? WHERE id=?').run(tmpPath, addonRecord.lastInsertRowid);

      // Notify Mel
      await sendEmail({
        to: process.env.CONTACT_EMAIL || 'mbillingsley31@gmail.com',
        subject: `New add-on order — ${product.name} — ${addonTypes} — $${(addonTotal/100).toFixed(0)}`,
        text: `Customer: ${order.customer_name || 'unknown'}\nEmail: ${order.customer_email || 'unknown'}\nProduct: ${product.name}\nAdd-ons: ${addonTypes}\nAmount: $${(addonTotal/100).toFixed(0)}\nDrive link: ${req.body.drive_link || 'none'}\nPhotos uploaded: ${photoPaths.length}\nCheck dashboard for details.`
      });

      return res.redirect(303, stripeSession.url);
    } catch(e) {
      console.error('[addon stripe]', e.message);
    }
  }

  // No add-ons or Stripe not configured — deliver zip directly
  db.prepare('UPDATE orders SET download_count = download_count + 1 WHERE id=?').run(order.id);
  res.download(tmpPath, `${product.slug}-sitesbymel.zip`, () => {
    const fs = require('fs');
    try { fs.unlinkSync(tmpPath); } catch(e) {}
  });
});

// Add-on payment success
app.get('/order/addon-success', async (req, res) => {
  const { addon_id, token } = req.query;
  if (addon_id) {
    db.prepare("UPDATE template_addons SET status='paid' WHERE id=?").run(addon_id);
    const addon = db.prepare('SELECT * FROM template_addons WHERE id=?').get(addon_id);
    if (addon) {
      await sendEmail({
        to: addon.customer_email || '',
        subject: `Add-on confirmed — Sites by Mel`,
        html: autoReplyHtml(addon.customer_name || 'there',
          `Your add-on payment went through. Here is what happens next:`,
          `<div style="background:#f5f4f2;border-radius:8px;padding:16px 20px;margin:16px 0;font-size:.9rem;color:#333;line-height:1.8">
            <strong>Add-ons purchased:</strong> ${addon.addon_type}<br>
            <strong>Mel will start within:</strong> 1 business day<br>
            <strong>Delivery:</strong> 2 business days via email<br><br>
            You will receive an email with your completed file when it is ready. No action needed from you.
          </div>`)
      });
    }
  }
  // Deliver the personalized zip
  if (token) {
    const order = db.prepare('SELECT * FROM orders WHERE download_token=?').get(token);
    if (order) {
      const addon = addon_id ? db.prepare('SELECT * FROM template_addons WHERE id=?').get(addon_id) : null;
      const zipPath = addon && addon.admin_notes && require('fs').existsSync(addon.admin_notes) ? addon.admin_notes : null;
      if (zipPath) {
        db.prepare('UPDATE orders SET download_count = download_count + 1 WHERE id=?').run(order.id);
        return res.download(zipPath, `${order.product_name || 'template'}-sitesbymel.zip`);
      }
    }
  }
  res.render('order-success', { order: null, downloadUrl: null, addonPaid: true });
});

// File download
app.get('/download/:token', (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE download_token=?').get(req.params.token);
  if (!order) return res.status(404).send('Download link not found or expired.');
  if (new Date(order.download_expires_at) < new Date()) return res.status(410).send('This download link has expired. Please contact mel@sitesbymel.com');
  const product = db.prepare('SELECT * FROM products WHERE id=?').get(order.product_id);
  if (!product) return res.status(404).send('Product not found. Please contact mel@sitesbymel.com');
  // Use generated zip from downloads/ folder
  const zipPath = path.join(__dirname, 'downloads', `${product.slug}.zip`);
  const fs = require('fs');
  if (!fs.existsSync(zipPath)) {
    // Rebuild on demand if missing
    const { buildAllDownloads } = require('./scripts/build-downloads');
    buildAllDownloads(true).then(() => {
      if (fs.existsSync(zipPath)) {
        db.prepare('UPDATE orders SET download_count = download_count + 1 WHERE id=?').run(order.id);
        res.download(zipPath, `${product.slug}-sitesbymel.zip`);
      } else {
        res.send('Your file is being prepared. Please try again in 1 minute or contact mel@sitesbymel.com');
      }
    });
    return;
  }
  db.prepare('UPDATE orders SET download_count = download_count + 1 WHERE id=?').run(order.id);
  res.download(zipPath, `${product.slug}-sitesbymel.zip`);
});

// ── STRIPE WEBHOOK ────────────────────────────────────────────────────────────
app.post('/webhook/stripe', express.raw({ type: 'application/json' }), (req, res) => {
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) return res.sendStatus(200);
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], process.env.STRIPE_WEBHOOK_SECRET);
  } catch (e) { return res.status(400).send(`Webhook error: ${e.message}`); }

  if (event.type === 'checkout.session.completed') {
    const s = event.data.object;
    if (s.metadata.type === 'template') {
      db.prepare("UPDATE orders SET status='paid', customer_email=?, customer_name=? WHERE stripe_session_id=?")
        .run(s.customer_details?.email, s.customer_details?.name, s.id);
    } else if (s.metadata.type === 'setup') {
      db.prepare("UPDATE setup_requests SET status='paid' WHERE stripe_session_id=?").run(s.id);
    }
  }
  res.sendStatus(200);
});

// ── ADMIN ─────────────────────────────────────────────────────────────────────
app.get('/admin/login', (req, res) => res.render('admin/login', { error: null }));
app.post('/admin/login', (req, res) => {
  if (req.body.password === process.env.ADMIN_PASSWORD) {
    req.session.admin = true;
    res.redirect('/admin');
  } else {
    res.render('admin/login', { error: 'Incorrect password.' });
  }
});
app.post('/admin/logout', (req, res) => { req.session.destroy(); res.redirect('/admin/login'); });

// Admin dashboard
app.get('/admin', requireAuth, (req, res) => {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0,10);

  const stats = {
    // Revenue
    total_revenue: db.prepare("SELECT COALESCE(SUM(amount),0) as t FROM orders WHERE status='paid'").get().t
      + db.prepare("SELECT COALESCE(SUM(amount),0) as t FROM setup_requests WHERE status IN ('paid','in_progress','completed')").get().t,
    month_revenue: db.prepare("SELECT COALESCE(SUM(amount),0) as t FROM orders WHERE status='paid' AND created_at>=?").get(monthStart).t
      + db.prepare("SELECT COALESCE(SUM(amount),0) as t FROM setup_requests WHERE status IN ('paid','in_progress','completed') AND created_at>=?").get(monthStart).t,
    // Counts
    template_sales: db.prepare("SELECT COUNT(*) as n FROM orders WHERE status='paid'").get().n,
    active_setups: db.prepare("SELECT COUNT(*) as n FROM setup_requests WHERE status='in_progress'").get().n,
    new_quotes: db.prepare("SELECT COUNT(*) as n FROM quotes WHERE status='new'").get().n,
    unread_messages: db.prepare("SELECT COUNT(*) as n FROM messages WHERE read=0").get().n,
    pending_setups: db.prepare("SELECT COUNT(*) as n FROM setup_requests WHERE status='paid'").get().n,
  };

  // Active & pending setups
  const active_setups = db.prepare("SELECT * FROM setup_requests WHERE status IN ('paid','in_progress') ORDER BY created_at ASC").all();

  // Quote pipeline
  const quotes_new = db.prepare("SELECT * FROM quotes WHERE status='new' ORDER BY created_at DESC").all();
  const quotes_pipeline = db.prepare("SELECT * FROM quotes WHERE status IN ('contacted','quoted') ORDER BY created_at DESC LIMIT 5").all();

  // Recent orders
  const recent_orders = db.prepare("SELECT * FROM orders ORDER BY created_at DESC LIMIT 6").all();

  // Unread messages
  const unread_messages = db.prepare("SELECT * FROM messages WHERE read=0 ORDER BY created_at DESC LIMIT 5").all();

  res.render('admin/dashboard', { stats, active_setups, quotes_new, quotes_pipeline, recent_orders, unread_messages });
});

// Admin — Products
app.get('/admin/products', requireAuth, (req, res) => {
  const products = db.prepare('SELECT * FROM products ORDER BY sort_order').all();
  res.render('admin/products', { products, success: req.query.success });
});
// Add new product
app.post('/admin/products/new', requireAuth, upload.single('file'), (req, res) => {
  const { name, slug, category, description, price, preview_url } = req.body;
  if (!name || !slug || !category || !price) return res.redirect('/admin/products');
  const file_path = req.file ? req.file.path : null;
  const maxOrder = db.prepare('SELECT MAX(sort_order) as m FROM products').get().m || 0;
  db.prepare(`INSERT INTO products (name, slug, category, description, price, preview_url, file_path, active, sort_order)
    VALUES (?,?,?,?,?,?,?,1,?)`).run(name, slug.toLowerCase().replace(/\s+/g,'-'), category, description||'', Math.round(parseFloat(price)*100), preview_url||'', file_path||'', maxOrder+1);
  res.redirect('/admin/products?success=1');
});
app.post('/admin/products/:id/toggle', requireAuth, (req, res) => {
  const p = db.prepare('SELECT active FROM products WHERE id=?').get(req.params.id);
  db.prepare('UPDATE products SET active=? WHERE id=?').run(p.active ? 0 : 1, req.params.id);
  res.redirect('/admin/products');
});
app.post('/admin/products/:id/edit', requireAuth, (req, res) => {
  const { name, description, price, preview_url } = req.body;
  db.prepare('UPDATE products SET name=?, description=?, price=?, preview_url=? WHERE id=?')
    .run(name, description, Math.round(parseFloat(price) * 100), preview_url||'', req.params.id);
  res.redirect('/admin/products?success=1');
});
// Upload ZIP file for product
app.post('/admin/products/:id/upload', requireAuth, upload.single('file'), (req, res) => {
  if (req.file) db.prepare('UPDATE products SET file_path=? WHERE id=?').run(req.file.path, req.params.id);
  res.redirect('/admin/products?success=1');
});
// Delete product
app.post('/admin/products/:id/delete', requireAuth, (req, res) => {
  db.prepare('DELETE FROM products WHERE id=?').run(req.params.id);
  res.redirect('/admin/products');
});

// Admin — Orders
app.get('/admin/orders', requireAuth, (req, res) => {
  const orders = db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all();
  res.render('admin/orders', { orders });
});

// Admin — Setup requests
app.get('/admin/setups', requireAuth, (req, res) => {
  const setups = db.prepare('SELECT * FROM setup_requests ORDER BY created_at DESC').all();
  res.render('admin/setups', { setups });
});
app.post('/admin/setups/:id/status', requireAuth, (req, res) => {
  db.prepare('UPDATE setup_requests SET status=? WHERE id=?').run(req.body.status, req.params.id);
  res.redirect('/admin/setups');
});
app.post('/admin/setups/:id/notes', requireAuth, (req, res) => {
  db.prepare('UPDATE setup_requests SET admin_notes=? WHERE id=?').run(req.body.admin_notes, req.params.id);
  res.redirect('/admin/setups');
});

// Admin — Pricing Reference
app.get('/admin/pricing', requireAuth, (req, res) => res.render('admin/pricing'));

// ── FINANCIALS ────────────────────────────────────────────────────────────────
app.get('/admin/financials', requireAuth, (req, res) => {
  const currentYear = new Date().getFullYear();
  const year = parseInt(req.query.year) || currentYear;

  const taxRate = parseInt(db.prepare("SELECT value FROM settings WHERE key='tax_rate'").get()?.value || '28');

  // Revenue by month
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const monthlyData = months.map((month, i) => {
    const m = String(i + 1).padStart(2, '0');
    const prefix = `${year}-${m}`;
    const templates = db.prepare("SELECT COALESCE(SUM(amount),0) as t FROM orders WHERE status='paid' AND strftime('%Y-%m',created_at)=?").get(prefix).t / 100;
    const setups    = db.prepare("SELECT COALESCE(SUM(amount),0) as t FROM setup_requests WHERE status IN ('paid','in_progress','completed') AND strftime('%Y-%m',created_at)=?").get(prefix).t / 100;
    const addons    = db.prepare("SELECT COALESCE(SUM(addon_amount),0) as t FROM template_addons WHERE status IN ('paid','in_progress','completed') AND strftime('%Y-%m',created_at)=?").get(prefix).t / 100;
    return { month, templates, setups, addons, total: templates + setups + addons };
  });

  const grossRevenue  = monthlyData.reduce((s, r) => s + r.total, 0);
  const expenses      = db.prepare("SELECT * FROM expenses WHERE strftime('%Y',expense_date)=? ORDER BY expense_date DESC").all(String(year));
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const netProfit     = grossRevenue - totalExpenses;
  const estimatedTax  = Math.max(0, netProfit * taxRate / 100);
  const takeHome      = netProfit - estimatedTax;

  res.render('admin/financials', { year, currentYear, taxRate, grossRevenue, totalExpenses, netProfit, estimatedTax, takeHome, monthlyData, expenses });
});

app.post('/admin/financials/taxrate', requireAuth, (req, res) => {
  const rate = Math.min(50, Math.max(0, parseInt(req.body.tax_rate) || 28));
  db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('tax_rate', ?)").run(String(rate));
  res.redirect('/admin/financials');
});

app.post('/admin/financials/expense', requireAuth, (req, res) => {
  const { description, category, amount, expense_date } = req.body;
  if (description && amount) {
    db.prepare("INSERT INTO expenses (description, category, amount, expense_date) VALUES (?,?,?,?)").run(description, category, parseFloat(amount), expense_date || new Date().toISOString().slice(0,10));
  }
  res.redirect('/admin/financials');
});

app.post('/admin/financials/expense/:id/delete', requireAuth, (req, res) => {
  db.prepare("DELETE FROM expenses WHERE id=?").run(req.params.id);
  res.redirect('/admin/financials');
});

// Admin — Analytics
app.get('/admin/analytics', requireAuth, (req, res) => {
  const days = parseInt(req.query.days || '30');
  const since = new Date(Date.now() - days * 86400000).toISOString().slice(0,10);

  // Traffic
  const total_views = db.prepare('SELECT COUNT(*) as n FROM page_views WHERE created_at>=?').get(since).n;
  const by_source = db.prepare("SELECT source, COUNT(*) as n FROM page_views WHERE created_at>=? GROUP BY source ORDER BY n DESC").all(since);
  const top_pages = db.prepare("SELECT path, COUNT(*) as n FROM page_views WHERE created_at>=? GROUP BY path ORDER BY n DESC LIMIT 10").all(since);
  const views_by_day = db.prepare("SELECT DATE(created_at) as day, COUNT(*) as n FROM page_views WHERE created_at>=? GROUP BY day ORDER BY day").all(since);

  // Template page views (purchase funnel)
  const template_views = db.prepare("SELECT path, COUNT(*) as n FROM page_views WHERE path LIKE '/templates/%' AND path != '/templates' AND created_at>=? GROUP BY path ORDER BY n DESC").all(since);

  // Revenue & orders
  const revenue_total = db.prepare("SELECT COALESCE(SUM(amount),0) as t FROM orders WHERE status='paid' AND created_at>=?").get(since).t;
  const orders_count = db.prepare("SELECT COUNT(*) as n FROM orders WHERE status='paid' AND created_at>=?").get(since).n;
  const revenue_by_product = db.prepare("SELECT product_name, COUNT(*) as sales, SUM(amount) as revenue FROM orders WHERE status='paid' AND created_at>=? GROUP BY product_name ORDER BY revenue DESC").all(since);
  const revenue_by_day = db.prepare("SELECT DATE(created_at) as day, SUM(amount) as revenue, COUNT(*) as sales FROM orders WHERE status='paid' AND created_at>=? GROUP BY day ORDER BY day").all(since);

  // Leads
  const new_quotes = db.prepare("SELECT COUNT(*) as n FROM quotes WHERE created_at>=?").get(since).n;
  const won_quotes = db.prepare("SELECT COUNT(*) as n FROM quotes WHERE status='won' AND created_at>=?").get(since).n;
  const quote_types = db.prepare("SELECT project_type, COUNT(*) as n FROM quotes WHERE created_at>=? GROUP BY project_type ORDER BY n DESC").all(since);

  res.render('admin/analytics', {
    days, since,
    total_views, by_source, top_pages, views_by_day, template_views,
    revenue_total, orders_count, revenue_by_product, revenue_by_day,
    new_quotes, won_quotes, quote_types
  });
});

// Admin — Rebuild downloads
app.post('/admin/rebuild-downloads', requireAuth, async (req, res) => {
  try {
    await buildAllDownloads(true);
    res.redirect('/admin/products?success=1');
  } catch(e) {
    res.redirect('/admin/products');
  }
});

// Admin — Quotes
app.get('/admin/quotes', requireAuth, (req, res) => {
  const quotes = db.prepare('SELECT * FROM quotes ORDER BY created_at DESC').all();
  res.render('admin/quotes', { quotes });
});
app.post('/admin/quotes/:id/status', requireAuth, (req, res) => {
  db.prepare('UPDATE quotes SET status=? WHERE id=?').run(req.body.status, req.params.id);
  res.redirect('/admin/quotes');
});
app.post('/admin/quotes/:id/notes', requireAuth, (req, res) => {
  db.prepare('UPDATE quotes SET admin_notes=? WHERE id=?').run(req.body.admin_notes, req.params.id);
  res.redirect('/admin/quotes');
});

// Admin — Add-ons
app.get('/admin/addons', requireAuth, (req, res) => {
  const addons = db.prepare('SELECT * FROM template_addons ORDER BY created_at DESC').all();
  res.render('admin/addons', { addons });
});
app.post('/admin/addons/:id/status', requireAuth, (req, res) => {
  db.prepare('UPDATE template_addons SET status=? WHERE id=?').run(req.body.status, req.params.id);
  res.redirect('/admin/addons');
});
app.post('/admin/addons/:id/notes', requireAuth, (req, res) => {
  db.prepare('UPDATE template_addons SET admin_notes=? WHERE id=?').run(req.body.admin_notes, req.params.id);
  res.redirect('/admin/addons');
});

// Admin — Messages
app.get('/admin/messages', requireAuth, (req, res) => {
  db.prepare('UPDATE messages SET read=1').run();
  const messages = db.prepare('SELECT * FROM messages ORDER BY created_at DESC').all();
  res.render('admin/messages', { messages });
});

// ── START ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => console.log(`Sites by Mel running on port ${PORT}`));
