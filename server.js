require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const db = require('./database');

const upload = multer({ dest: path.join(__dirname, 'uploads') });

const app = express();
const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// ── MIDDLEWARE ────────────────────────────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
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
async function sendEmail({ to, subject, text }) {
  if (!process.env.RESEND_API_KEY) return;
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: process.env.FROM_ADDRESS || 'Mel <mel@sitesbymel.com>',
      to, subject, text
    })
  });
}

// ── PUBLIC ROUTES ─────────────────────────────────────────────────────────────

// Home
app.get('/', (req, res) => {
  const products = db.prepare('SELECT * FROM products WHERE active=1 ORDER BY sort_order').all();
  res.render('index', { products });
});

// Templates shop
app.get('/templates', (req, res) => {
  const products = db.prepare('SELECT * FROM products ORDER BY sort_order').all();
  res.render('templates', { products });
});

// Single template page
app.get('/templates/:slug', (req, res) => {
  const product = db.prepare('SELECT * FROM products WHERE slug=?').get(req.params.slug);
  if (!product) return res.redirect('/templates');
  res.render('template-detail', { product });
});

// Services page
app.get('/services', (req, res) => res.render('services'));

// Portfolio page
app.get('/portfolio', (req, res) => res.render('portfolio'));

// About page
app.get('/about', (req, res) => res.render('about'));

// Contact page + form
app.get('/contact', (req, res) => res.render('contact', { success: false, error: false }));
app.post('/contact', async (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !message) return res.render('contact', { success: false, error: 'Please fill in all required fields.' });
  db.prepare('INSERT INTO messages (name, email, subject, message) VALUES (?,?,?,?)').run(name, email, subject||'', message);
  await sendEmail({
    to: process.env.CONTACT_EMAIL || 'mbillingsley31@gmail.com',
    subject: `New contact from SitesByMel: ${subject || name}`,
    text: `Name: ${name}\nEmail: ${email}\n\n${message}`
  });
  res.render('contact', { success: true, error: false });
});

// Quote request
app.get('/quote', (req, res) => res.render('quote', { success: false, error: false }));
app.post('/quote', async (req, res) => {
  const { name, email, phone, business_name, business_url, project_type, budget, timeline, description } = req.body;
  if (!name || !email || !description) return res.render('quote', { success: false, error: 'Please fill in all required fields.' });
  db.prepare(`INSERT INTO quotes (name,email,phone,business_name,business_url,project_type,budget,timeline,description)
    VALUES (?,?,?,?,?,?,?,?,?)`).run(name, email, phone||'', business_name||'', business_url||'', project_type||'', budget||'', timeline||'', description);
  await sendEmail({
    to: process.env.CONTACT_EMAIL || 'mbillingsley31@gmail.com',
    subject: `New quote request from ${name} — ${business_name || 'no business listed'}`,
    text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone||'—'}\nBusiness: ${business_name||'—'}\nSite: ${business_url||'—'}\nType: ${project_type||'—'}\nBudget: ${budget||'—'}\nTimeline: ${timeline||'—'}\n\n${description}`
  });
  res.render('quote', { success: true, error: false });
});

// ── STRIPE CHECKOUT ───────────────────────────────────────────────────────────
const stripe = process.env.STRIPE_SECRET_KEY ? require('stripe')(process.env.STRIPE_SECRET_KEY) : null;

// Buy template
app.post('/buy/:slug', async (req, res) => {
  if (!stripe) return res.redirect('/templates');
  const product = db.prepare('SELECT * FROM products WHERE slug=? AND active=1').get(req.params.slug);
  if (!product) return res.redirect('/templates');
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price_data: {
        currency: 'usd',
        product_data: { name: product.name, description: product.description },
        unit_amount: product.price
      }, quantity: 1 }],
      mode: 'payment',
      success_url: `${BASE_URL}/order/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${BASE_URL}/templates/${product.slug}`,
      metadata: { product_id: product.id, product_name: product.name, type: 'template' }
    });
    // Create pending order
    db.prepare(`INSERT INTO orders (product_id, product_name, amount, stripe_session_id, status)
      VALUES (?,?,?,?,'pending')`).run(product.id, product.name, product.price, session.id);
    res.redirect(303, session.url);
  } catch (e) {
    console.error(e);
    res.redirect('/templates');
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
  const order = db.prepare('SELECT * FROM orders WHERE stripe_session_id=?').get(session_id);
  if (!order) return res.render('order-success', { order: null, downloadUrl: null });

  // Generate download token if not already done
  if (!order.download_token) {
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(); // 48 hours
    db.prepare("UPDATE orders SET status='paid', download_token=?, download_expires_at=? WHERE id=?")
      .run(token, expires, order.id);
    order.download_token = token;
    // Email the customer
    await sendEmail({
      to: order.customer_email || '',
      subject: `Your download is ready — ${order.product_name}`,
      text: `Hi! Thanks for purchasing ${order.product_name}.\n\nYour download link (valid 48 hours):\n${BASE_URL}/download/${token}\n\nQuestions? Reply to this email or visit sitesbymel.com\n\nMel`
    });
  }
  res.render('order-success', { order, downloadUrl: `${BASE_URL}/download/${order.download_token}` });
});

app.get('/order/setup-success', (req, res) => res.render('setup-success'));

// File download
app.get('/download/:token', (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE download_token=?').get(req.params.token);
  if (!order) return res.status(404).send('Download link not found or expired.');
  if (new Date(order.download_expires_at) < new Date()) return res.status(410).send('This download link has expired. Please contact mel@sitesbymel.com');
  if (!order.download_file) {
    const product = db.prepare('SELECT * FROM products WHERE id=?').get(order.product_id);
    if (!product || !product.file_path) return res.send('Your file is being prepared. Mel will email it to you shortly.');
    db.prepare('UPDATE orders SET download_count = download_count + 1 WHERE id=?').run(order.id);
    return res.download(path.join(__dirname, product.file_path), `${product.slug}.zip`);
  }
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

// Admin — Messages
app.get('/admin/messages', requireAuth, (req, res) => {
  db.prepare('UPDATE messages SET read=1').run();
  const messages = db.prepare('SELECT * FROM messages ORDER BY created_at DESC').all();
  res.render('admin/messages', { messages });
});

// ── START ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => console.log(`Sites by Mel running on port ${PORT}`));
