require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const fs = require('fs');
const db = require('./database');

// Per-order photo storage
const photoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const token = req.params.token || 'misc';
    const order = db.prepare('SELECT id FROM orders WHERE download_token=?').get(token);
    const dir = path.join(__dirname, 'uploads', 'orders', String(order ? order.id : 'misc'));
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  }
});
const photoUpload = multer({ storage: photoStorage, limits: { files: 5, fileSize: 20 * 1024 * 1024 } });
const { buildAllDownloads } = require('./scripts/build-downloads');
const { buildPersonalizedZip, PLACEHOLDERS } = require('./scripts/personalize');

// Build zips on startup — force rebuild every deploy so templates are always fresh
buildAllDownloads(true).catch(e => console.error('[downloads] startup error:', e.message));

// Ensure detail-pro template exists in DB with preview URL
(function seedDetailPro() {
  try {
    const exists = db.prepare('SELECT id, preview_url FROM products WHERE slug=?').get('detail-pro');
    if (!exists) {
      const maxOrder = db.prepare('SELECT MAX(sort_order) as m FROM products').get().m || 0;
      db.prepare(`INSERT INTO products (name, slug, category, description, price, thumbnail, preview_url, active, sort_order)
        VALUES (?,?,?,?,?,?,?,1,?)`)
        .run('DetailPro Template', 'detail-pro', 'Auto Detailing & Mechanic', 'For auto detailers & mechanics. Bold dark design, services grid, before/after gallery, reviews & appointment booking.', 19700, 'detail-pro.jpg', '/preview/detail-pro/', maxOrder + 1);
      console.log('[seed] Added detail-pro template');
    } else {
      db.prepare('UPDATE products SET category=?, description=?, preview_url=? WHERE slug=?')
        .run('Auto Detailing & Mechanic', 'For auto detailers & mechanics. Bold dark design, services grid, before/after gallery, reviews & appointment booking.', '/preview/detail-pro/', 'detail-pro');
      console.log('[seed] Updated detail-pro template');
    }
  } catch(e) { console.error('[seed] detail-pro error:', e.message); }
})();

// Ensure ALL templates have preview_url set
(function fixPreviewUrls() {
  const slugs = [
    'service-pro','table-ready','key-ready','shop-front','voice-first',
    'gather-here','pet-shop','beauty-studio','lens-and-light','green-cut',
    'wellness-pro','fit-life','sparkle-clean','bright-minds','forever-events',
    'auto-shine','detail-pro'
  ];
  try {
    for (const slug of slugs) {
      const row = db.prepare('SELECT id, preview_url FROM products WHERE slug=?').get(slug);
      if (row && !row.preview_url) {
        db.prepare('UPDATE products SET preview_url=? WHERE slug=?').run(`/preview/${slug}/`, slug);
        console.log(`[seed] Fixed preview_url for ${slug}`);
      }
    }
  } catch(e) { console.error('[seed] fixPreviewUrls error:', e.message); }
})();

// Ensure all templates have correct thumbnail filenames in DB
(function fixThumbnails() {
  const thumbs = [
    { slug: 'service-pro',    thumbnail: 'service-pro.jpg' },
    { slug: 'table-ready',    thumbnail: 'Tables.jpg' },
    { slug: 'key-ready',      thumbnail: 'KeyReady.jpg' },
    { slug: 'shop-front',     thumbnail: 'ShopReady.jpg' },
    { slug: 'voice-first',    thumbnail: 'ThoughtfulCreator.jpg' },
    { slug: 'gather-here',    thumbnail: 'Cornerstone.jpg' },
    { slug: 'pet-shop',       thumbnail: 'pet-shop.jpg' },
    { slug: 'beauty-studio',  thumbnail: 'beauty-studio.jpg' },
    { slug: 'lens-and-light', thumbnail: 'lens-and-light.jpg' },
    { slug: 'green-cut',      thumbnail: 'green-cut.jpg' },
    { slug: 'wellness-pro',   thumbnail: 'wellness-pro.jpg' },
    { slug: 'fit-life',       thumbnail: 'fit-life.jpg' },
    { slug: 'sparkle-clean',  thumbnail: 'sparkle-clean.jpg' },
    { slug: 'bright-minds',   thumbnail: 'bright-minds.jpg' },
    { slug: 'forever-events', thumbnail: 'forever-events.jpg' },
    { slug: 'auto-shine',     thumbnail: 'auto-shine.jpg' },
    { slug: 'detail-pro',     thumbnail: 'detail-pro.jpg' },
  ];
  try {
    for (const t of thumbs) {
      db.prepare('UPDATE products SET thumbnail=? WHERE slug=?').run(t.thumbnail, t.slug);
    }
    console.log('[seed] Thumbnails updated for all templates');
  } catch(e) { console.error('[seed] fixThumbnails error:', e.message); }
})();

const upload = multer({ dest: path.join(__dirname, 'uploads') });

const app = express();
const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// ── MIDDLEWARE ────────────────────────────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Direct image route — bypasses all middleware
app.get('/images/:filename', (req, res) => {

  const imgPath = path.join(__dirname, 'public', 'images', req.params.filename);
  if (fs.existsSync(imgPath)) return res.sendFile(imgPath);
  res.status(404).send('Image not found');
});

// Serve static files — skip /templates/* page routes, all other assets served normally
app.use((req, res, next) => {
  if (req.path.startsWith('/templates/') && !req.path.match(/\.[a-z]{2,4}$/i)) return next();
  express.static(path.join(__dirname, 'public'), { fallthrough: true })(req, res, next);
});
// Serve template previews under /preview/ — inject watermark into HTML pages
app.use('/preview', (req, res, next) => {

  const filePath = path.join(__dirname, 'public', 'templates', req.path);
  if (!req.path.endsWith('.html') && !req.path.endsWith('/') && req.path !== '/') return next();
  const htmlFile = req.path.endsWith('.html') ? filePath : path.join(filePath, 'index.html');
  if (!fs.existsSync(htmlFile)) return next();
  let html = fs.readFileSync(htmlFile, 'utf8');
  const slug = req.path.split('/').filter(Boolean)[0] || '';
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
    PREVIEW ONLY &nbsp;|&nbsp; This design is property of <a href="https://sitesbymel.com/templates" target="_blank">sitesbymel.com</a> &nbsp;|&nbsp; Purchase to use &nbsp;|&nbsp; <a href="https://sitesbymel.com/templates/${slug}" target="_blank">Buy This Template &rarr;</a>
  </div>
</div>
<div id="sbm-watermark-diag"></div>`;
  html = html.replace('</body>', watermark + '\n</body>');
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});
app.use('/preview', express.static(path.join(__dirname, 'public', 'templates')));
app.use('/uploads/intake', requireAuth, express.static(path.join(__dirname, 'uploads', 'intake')));
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

function autoReplyHtml(name, heading, body, buttonUrl, buttonLabel) {
  const btn = buttonUrl ? `<p style="margin:24px 0"><a href="${buttonUrl}" style="display:inline-block;background:#C9922B;color:#fff;padding:13px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:1rem">${buttonLabel || 'Click Here'}</a></p>` : '';
  return `<!DOCTYPE html><html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f5f4f2;padding:32px">
<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e0d8">
<div style="background:#1B2F4E;padding:28px 32px"><h1 style="color:#C9922B;font-size:1.2rem;margin:0">Sites by Mel</h1></div>
<div style="padding:28px 32px">
<p style="color:#1a1a1a;font-size:1rem;margin-bottom:16px">Hi ${name},</p>
<p style="color:#333;line-height:1.7;margin-bottom:16px">${heading}</p>
${body}${btn}
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
app.get('/services', (req, res) => {
  trackView(req);
  const packages = db.prepare('SELECT * FROM service_packages WHERE is_active=1 ORDER BY sort_order').all();
  packages.forEach(p => { try { p.bullets = JSON.parse(p.bullets || '[]'); } catch(e) { p.bullets = []; } });
  res.render('services', { packages });
});

// Portfolio page
app.get('/portfolio', (req, res) => { trackView(req); res.render('portfolio'); });

// About page
app.get('/about', (req, res) => { trackView(req); res.render('about'); });

// Blog
const BLOG_POSTS = [
  { slug:'why-your-business-needs-a-website', title:'Why Every Small Business Needs a Website in 2025', category:'Business', date:'Jun 16, 2025', read:'4 min', excerpt:'If a customer can\'t find you online, they\'ll find your competitor. Here\'s why having your own website — not just a Facebook page — is the single best thing you can do for your business this year.', body:`<p>Let's be honest — if someone hears about your business and Googles you, what do they find? If the answer is "nothing" or "just my Facebook page," you're leaving money on the table every single day.</p><h3>Your website works while you sleep</h3><p>A website is the only marketing tool that works 24/7 without you lifting a finger. While you're with a customer, sleeping, or enjoying a Saturday, your website is out there answering questions, showing off your work, and convincing strangers to choose you.</p><h3>Facebook isn't enough</h3><p>Social media is rented land. The algorithm changes, your reach drops, the platform could disappear. Your website is <em>yours</em> — no one can take it away or change the rules on you.</p><h3>Customers expect it</h3><p>Over 80% of shoppers research a business online before making contact. If you don't have a website, some of those people will move on to someone who does. It's not personal — it's just how people shop now.</p><h3>The good news</h3><p>Getting online doesn't have to be expensive or complicated. A clean, professional 5-page website — home, services, about, gallery, contact — is everything most small businesses need. That's it. Start there.</p>` },
  { slug:'seo-basics-for-small-business', title:'SEO Basics: How to Get Found on Google Without Paying for Ads', category:'SEO', date:'Jun 23, 2025', read:'5 min', excerpt:'SEO sounds technical but the basics are simple. Here\'s what actually moves the needle for a small business website — no jargon, no fluff, just what works.', body:`<p>SEO stands for Search Engine Optimization. In plain English: it's how you show up on Google when someone searches for what you do.</p><h3>Start with your Google Business Profile</h3><p>This is free and it's the single most impactful thing you can do. Go to business.google.com, claim your listing, fill in every field, and add photos. This is what shows up in the map results when someone searches "hair salon near me."</p><h3>Put your city in your website copy</h3><p>Google needs to know where you are. Say it clearly: "Nashville's best pet groomer" or "serving the Houston area since 2018." Don't make Google guess.</p><h3>Get your site indexed</h3><p>Go to Google Search Console (free), add your website, and submit your sitemap. This tells Google your site exists and to come look at it. Without this step, Google might not find you for weeks or months.</p><h3>Earn a few backlinks</h3><p>A backlink is when another website links to yours. Get listed on Yelp, your local Chamber of Commerce, and any industry directories. Each link tells Google your site is real and trustworthy.</p><h3>Be patient</h3><p>SEO takes 3–6 months to kick in. It's a long game. But once it works, it keeps working — unlike ads that stop the moment you stop paying.</p>` },
  { slug:'how-to-choose-your-brand-colors', title:'How to Choose Brand Colors That Actually Work for Your Business', category:'Design', date:'Jun 30, 2025', read:'4 min', excerpt:'Colors aren\'t just pretty — they communicate trust, energy, and personality before a single word is read. Here\'s how to pick yours intentionally.', body:`<p>Most small business owners pick colors they personally like. That's a start — but the best brand colors are chosen strategically, not just aesthetically.</p><h3>Colors carry meaning</h3><p>Blue = trust and professionalism (banks, doctors, lawyers). Green = health, nature, growth. Black = luxury and sophistication. Pink = warmth and femininity. Orange = energy and creativity. Yellow = happiness and optimism.</p><p>What does your business want to communicate? Start there.</p><h3>Look at your competitors — then differentiate</h3><p>If every law firm in your city uses navy blue, going with a deep burgundy makes you memorable. You want to fit the industry just enough that people recognize what you do — but stand out enough to be remembered.</p><h3>Keep it simple: 2 colors max</h3><p>One primary color (your main brand color — used on headers, buttons, key elements) and one accent color (a contrasting pop — used sparingly). That's it. Two colors used consistently look more professional than five colors used randomly.</p><h3>Test before you commit</h3><p>Go to coolors.co and browse palettes. Find two colors you love together, then live with them for a day. Look at them on your phone, on a light background, on a dark background. If you still love them tomorrow, they're yours.</p>` },
  { slug:'google-my-business-complete-guide', title:'Your Google Business Profile: The Complete Setup Guide', category:'Google', date:'Jul 7, 2025', read:'6 min', excerpt:'Your Google Business Profile is often the first thing customers see. Here\'s how to set it up properly so it actually brings in business.', body:`<p>When someone searches "coffee shop near me" or "best plumber in [your city]," Google shows a map with business listings before it shows websites. That map is powered by Google Business Profiles. If you're not on it, you're invisible for those searches.</p><h3>Step 1: Claim your profile</h3><p>Go to business.google.com. Search for your business name. If it's already there (Google sometimes auto-creates listings), claim it. If not, create a new one. You'll verify via postcard, phone, or email.</p><h3>Step 2: Fill in everything</h3><p>Don't leave anything blank. Business name, category, address (or service area if you go to customers), phone, website, hours. Every empty field is a missed opportunity.</p><h3>Step 3: Add photos</h3><p>Businesses with photos get 42% more requests for directions and 35% more clicks to their website. Add your logo, your storefront, your team, your work. Aim for at least 10 photos.</p><h3>Step 4: Collect reviews</h3><p>Reviews are the #1 ranking factor for local search. Ask every happy customer to leave one. Make it easy — send them a direct link. Respond to every review, good and bad.</p><h3>Step 5: Post regularly</h3><p>Google Business has a posts feature — use it like a mini social media feed. Post a photo, an offer, or an update once a week. Google rewards active profiles with better visibility.</p>` },
  { slug:'what-shoppers-want-from-a-website', title:'What Shoppers Actually Want From a Small Business Website', category:'Business', date:'Jul 14, 2025', read:'4 min', excerpt:'Customers aren\'t impressed by fancy animations or stock photos. Here\'s what they actually look for — and what makes them pick up the phone or hit the contact button.', body:`<p>I've seen a lot of small business websites. The ones that convert visitors into customers aren't always the prettiest — they're the clearest.</p><h3>They want to know: can you help me?</h3><p>In the first 5 seconds of landing on your site, a visitor decides whether to stay or leave. Your homepage headline should answer: what you do, who you help, and where you are. "Nashville's trusted family dentist — accepting new patients" does that in one sentence.</p><h3>They want to see your work</h3><p>Photos of real work beat stock photos every time. Before/after photos, completed projects, happy customers, your actual space — these build trust faster than any paragraph of text.</p><h3>They want to know what it costs</h3><p>You don't have to list every price, but giving a starting point ("services from $75") removes a huge barrier. When people don't see pricing, they assume it's too expensive and leave.</p><h3>They want it to be easy to contact you</h3><p>Your phone number should be visible on every page. Your contact form should be simple — name, email, message, done. Every extra field you add loses you a percentage of people who almost contacted you.</p><h3>They want to trust you</h3><p>Reviews, testimonials, years in business, certifications, association logos — anything that answers "is this business legit?" Put these near your call to action.</p>` },
  { slug:'klarna-stripe-for-small-business', title:'Buy Now Pay Later: Should Your Small Business Offer It?', category:'Payments', date:'Jul 21, 2025', read:'3 min', excerpt:'Klarna, Afterpay, Shop Pay — buy now pay later is everywhere. Here\'s whether it makes sense for your small business and how to set it up.', body:`<p>Buy now pay later (BNPL) lets customers split their purchase into smaller installments — usually 4 payments over 6 weeks — at no extra cost to them. You get paid in full upfront. The BNPL provider takes a small fee (typically 2–6%).</p><h3>Who it helps most</h3><p>If your services cost $200 or more, BNPL can meaningfully increase your conversion rate. Customers who might hesitate at a $400 invoice don't hesitate nearly as much at "4 payments of $100." Same price, very different psychology.</p><h3>The Stripe + Klarna option</h3><p>If you already use Stripe for payments, adding Klarna is a checkbox in your Stripe dashboard — no extra code, no separate account. Customers see it as an option at checkout automatically.</p><h3>The trade-off</h3><p>You pay a slightly higher processing fee on BNPL transactions. For most small businesses the increased conversion rate more than covers it — but it depends on your margins. If you're selling $50 services, BNPL probably isn't worth it. If you're selling $500+ packages, it very likely is.</p><h3>Bottom line</h3><p>If your customers ever comment that your prices are high or ask about payment plans, turn on Klarna. It's free to enable and you only pay when someone uses it.</p>` },
  { slug:'website-mistakes-small-businesses-make', title:'7 Website Mistakes Small Businesses Make (And How to Fix Them)', category:'Design', date:'Jul 28, 2025', read:'5 min', excerpt:'Most small business websites lose customers before they ever make contact. Here are the most common mistakes — and the simple fixes.', body:`<p>After looking at hundreds of small business websites, the same mistakes come up over and over. The good news: every single one is fixable.</p><h3>1. No clear headline on the homepage</h3><p>Visitors give you about 5 seconds. If your homepage says "Welcome to our website" instead of "Houston's #1 rated carpet cleaning service," they're gone. Fix: write a headline that says exactly what you do and who you help.</p><h3>2. Phone number buried or missing</h3><p>Your phone number should be in the header of every page. Many customers decide to call before they decide to email. Make it click-to-call on mobile. Fix: add your number to your site header and footer.</p><h3>3. No photos of real work</h3><p>Stock photos scream "generic." Photos of your actual work, your team, your space — these build instant trust. Fix: take 10 photos with your phone this week and use them.</p><h3>4. Too much text</h3><p>Nobody reads paragraphs on a website. They scan. Use short sentences, bullet points, and headers. Fix: cut your copy in half. Then cut it in half again.</p><h3>5. Slow loading speed</h3><p>If your site takes more than 3 seconds to load, half your visitors leave. Huge image files are the #1 culprit. Fix: compress your images before uploading (use squoosh.app — free).</p><h3>6. Not mobile-friendly</h3><p>Over 60% of web traffic is on phones. If your site looks broken on mobile, you're losing the majority of your visitors. Fix: use a modern template that's built to be responsive.</p><h3>7. No call to action</h3><p>Every page should end with a clear next step: "Call now," "Book an appointment," "Get a free quote." Don't make visitors guess what to do. Fix: add a button to every page.</p>` },
  { slug:'email-marketing-for-small-business', title:'Email Marketing: The Most Underrated Tool for Small Business Growth', category:'Marketing', date:'Aug 4, 2025', read:'4 min', excerpt:'Social media algorithms bury your posts. Email lands directly in your customer\'s inbox. Here\'s why email marketing is the best investment you\'re not making.', body:`<p>Every social media post you make reaches maybe 5% of your followers — and that number keeps shrinking. An email reaches 100% of the people on your list. That's the difference.</p><h3>Your list is yours</h3><p>If Instagram disappeared tomorrow, your followers would be gone. If your email list disappeared, you'd still have those contacts in a spreadsheet. Email is the only marketing channel you truly own.</p><h3>It works remarkably well</h3><p>Email marketing has an average ROI of $36 for every $1 spent. No other channel comes close. Why? Because the people on your list already know you and chose to hear from you.</p><h3>Start a list today</h3><p>You don't need a big fancy email platform to start. Add a simple sign-up form to your website (like the one at the bottom of this page). Offer something in return — a discount, a free guide, a helpful tip. Even getting 10 subscribers a month adds up fast.</p><h3>What to send</h3><p>Don't overthink it. One email a month with: something useful (a tip, a how-to), something personal (a behind-the-scenes moment), and a soft call to action (book a service, visit the site). That's a solid email newsletter.</p><h3>The tools</h3><p>Mailchimp is free up to 500 subscribers. ConvertKit is great for creators. For most small businesses, either one is more than enough to start.</p>` },
];

app.get('/blog', (req, res) => {
  trackView(req);
  const weekNum = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
  const featured = BLOG_POSTS[weekNum % BLOG_POSTS.length];
  res.render('blog', { posts: BLOG_POSTS, featured });
});

app.get('/blog/:slug', (req, res) => {
  const post = BLOG_POSTS.find(p => p.slug === req.params.slug);
  if (!post) return res.status(404).redirect('/blog');
  trackView(req);
  const others = BLOG_POSTS.filter(p => p.slug !== post.slug).slice(0, 3);
  res.render('blog-post', { post, others });
});

// Upgrades / CMS features page
app.get('/upgrades', (req, res) => { trackView(req); res.render('upgrades'); });

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
const stripeKey = process.env.STRIPE_TEST_KEY || process.env.STRIPE_SECRET_KEY;
const stripe = stripeKey ? require('stripe')(stripeKey) : null;
console.log('[stripe] key starts:', stripeKey ? stripeKey.slice(0,12) : 'MISSING');

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
    const addonAmounts = { none: 0, upload: 9700, glove: 40000 };
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
    db.prepare(`INSERT INTO orders (product_id, product_name, amount, stripe_session_id, status, customer_email, selected_addon)
      VALUES (?,?,?,?,'pending','',?)`).run(product.id, product.name, totalAmount, session.id, selectedAddon);
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
  const depositAmount = 40000; // $400 deposit
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
      text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone||'—'}\nBusiness: ${business_name||'—'}\nCurrent site: ${business_url||'—'}\nTemplate: ${product ? product.name : 'No specific template'}\nNotes: ${notes||'—'}\n\n$400 deposit initiated via Stripe. Check the dashboard for payment confirmation.`
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
      try {
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
        console.log('[success] email sent to', order.customer_email);
      } catch(e) { console.error('[success] email error:', e.message); }
    } else {
      console.warn('[success] no customer email — skipping email send');
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
  res.render('personalize', { token: req.params.token, product, placeholder, selectedAddon: order.selected_addon || 'none' });
});

// Build personalized zip and deliver it (or route to Stripe for add-ons)
app.post('/personalize/:token', photoUpload.array('photos', 5), async (req, res) => {
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

  const brandColors = req.body.brand_colors || '';
  const driveLink   = req.body.drive_link || '';
  const selectedAddon = order.selected_addon || 'none';

  const addonLabel = { none:'Template Only', drive:'Photo Swap via Google Drive', upload:'Direct Photo Upload', glove:'Full White-Glove Finish', colors:'Custom Brand Colors', payment:'Payment Button & Business Email Setup' };
  const needsManualWork = ['drive','upload','glove','colors','payment'].includes(selectedAddon);

  // Email Mel with all order details
  await sendEmail({
    to: process.env.CONTACT_EMAIL || 'mbillingsley31@gmail.com',
    subject: `New order ready — ${product.name}${selectedAddon !== 'none' ? ' + ' + addonLabel[selectedAddon] : ''}`,
    text: `Customer: ${order.customer_name || 'unknown'}\nEmail: ${order.customer_email || 'unknown'}\nProduct: ${product.name}\nAdd-on paid: ${addonLabel[selectedAddon] || selectedAddon}\nAmount paid: $${(order.amount/100).toFixed(0)}\n\nBusiness details entered:\nName: ${data.businessName}\nPhone: ${data.phone}\nEmail: ${data.email}\nAddress: ${data.address}\nTagline: ${data.tagline}\nBrand colors: ${brandColors || 'none'}\nDrive link: ${driveLink || 'none'}`
  }).catch(e => console.error('[personalize email]', e.message));

  // Save uploaded photos to DB linked to this order
  if (req.files && req.files.length > 0) {
    const insertPhoto = db.prepare('INSERT INTO order_photos (order_id, filename, original, path) VALUES (?,?,?,?)');
    for (const f of req.files) {
      insertPhoto.run(order.id, f.filename, f.originalname, f.path);
    }
    const photoNotes = req.body.photo_notes || '';
    if (photoNotes) db.prepare('UPDATE orders SET photo_notes=? WHERE id=?').run(photoNotes, order.id);
    if (resend) {
      resend.emails.send({
        from: 'Sites by Mel <mel@sitesbymel.com>',
        to: 'mel@sitesbymel.com',
        subject: `📸 Photos uploaded — Order #${order.id} (${order.product_name})`,
        html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px">
          <h2 style="color:#1B2F4E">Customer Photos Uploaded</h2>
          <p style="color:#374151"><strong>${order.customer_name || 'A customer'}</strong> (${order.customer_email || 'unknown'}) just uploaded <strong>${req.files.length} photo${req.files.length > 1 ? 's' : ''}</strong> for their order.</p>
          <table style="width:100%;border-collapse:collapse;font-size:.9rem;margin:16px 0">
            <tr><td style="padding:6px 0;color:#6B7280;width:40%">Order</td><td style="font-weight:600;color:#1B2F4E">#${order.id} — ${order.product_name}</td></tr>
            <tr><td style="padding:6px 0;color:#6B7280">Add-On</td><td style="color:#1B2F4E">${order.selected_addon && order.selected_addon !== 'none' ? order.selected_addon : 'None'}</td></tr>
            <tr><td style="padding:6px 0;color:#6B7280">Files</td><td style="color:#1B2F4E">${req.files.map(f => f.originalname).join(', ')}</td></tr>
            ${photoNotes ? `<tr><td style="padding:6px 0;color:#6B7280;vertical-align:top">Notes</td><td style="color:#1B2F4E;font-style:italic">${photoNotes}</td></tr>` : ''}
          </table>
          <a href="${BASE_URL}/admin/orders" style="display:inline-block;background:#1B2F4E;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:700;font-size:.88rem">View in Admin →</a>
        </div>`
      }).catch(e => console.error('[photo notify]', e.message));
    }
  }

  // Add-on orders: show "We're on it" page — Mel delivers manually
  if (needsManualWork) {
    return res.render('addon-pending', {
      customerName: data.businessName || order.customer_name || 'there',
      customerEmail: order.customer_email || data.email,
      addonLabel: addonLabel[selectedAddon],
      productName: product.name,
      token: req.params.token
    });
  }

  // DIY only: deliver zip immediately
  const tmpPath = path.join(__dirname, 'downloads', `custom-${order.id}-${Date.now()}.zip`);
  const niche = (PLACEHOLDERS[product.slug] || {}).niche || product.category;
  try { await buildPersonalizedZip(product.slug, product.name, niche, data, tmpPath); } catch(e) {
    console.error('[personalize]', e.message);
  }
  db.prepare('UPDATE orders SET download_count = download_count + 1 WHERE id=?').run(order.id);

  if (fs.existsSync(tmpPath)) {
    return res.download(tmpPath, `${product.slug}-sitesbymel.zip`, () => {
      try { fs.unlinkSync(tmpPath); } catch(e) {}
    });
  }
  res.redirect(`/download/${req.params.token}`);
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
      const email = s.customer_details?.email || '';
      const name  = s.customer_details?.name  || '';
      db.prepare("UPDATE orders SET status='paid', customer_email=?, customer_name=? WHERE stripe_session_id=?")
        .run(email, name, s.id);
      // Create intake record and send welcome email
      const order = db.prepare("SELECT * FROM orders WHERE stripe_session_id=?").get(s.id);
      if (order && email) {
        const intakeToken = require('crypto').randomBytes(16).toString('hex');
        try {
          db.prepare("INSERT OR IGNORE INTO intake_responses (order_id, token) VALUES (?,?)").run(order.id, intakeToken);
        } catch(e) {}
        const intakeUrl = `${BASE_URL}/intake/${intakeToken}`;
        const personalizeUrl = `${BASE_URL}/personalize/${order.download_token}`;
        if (resend) {
          resend.emails.send({
            from: 'Mel <mel@sitesbymel.com>',
            to: email,
            subject: `Welcome! Here's what's next for your new website 🎉`,
            html: `
<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1a1a2e">
<div style="text-align:center;margin-bottom:28px">
  <div style="font-size:1.4rem;font-weight:700;color:#1B2F4E">Sites by <span style="color:#C9922B">Mel</span></div>
</div>
<h1 style="font-size:1.3rem;color:#1B2F4E;margin-bottom:8px">Your website is on its way, ${name.split(' ')[0] || 'there'}! 🎉</h1>
<p style="color:#374151;line-height:1.7">Thank you so much for your purchase of <strong>${order.product_name}</strong>. I'm excited to help you get your new site looking exactly right.</p>
<p style="color:#374151;line-height:1.7">Here's what happens next — two quick steps and we're off to the races:</p>

<div style="background:#f9fafb;border:1px solid #E5E0D8;border-radius:10px;padding:24px;margin:24px 0">
  <div style="margin-bottom:20px">
    <div style="font-weight:700;color:#1B2F4E;font-size:1rem;margin-bottom:6px">Step 1 — Fill out your intake form <span style="color:#C9922B">(most important!)</span></div>
    <p style="color:#374151;font-size:.9rem;line-height:1.6;margin:0 0 12px">Tell me your business name, brand colors, logo, about text, and services. This is how I customize your site for you.</p>
    <a href="${intakeUrl}" style="display:inline-block;background:#C9922B;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:700;font-size:.95rem">Fill Out My Intake Form →</a>
  </div>
  <hr style="border:none;border-top:1px solid #E5E0D8;margin:20px 0">
  <div>
    <div style="font-weight:700;color:#1B2F4E;font-size:1rem;margin-bottom:6px">Step 2 — Personalize & download your template</div>
    <p style="color:#374151;font-size:.9rem;line-height:1.6;margin:0 0 12px">You can also jump straight into personalizing your template and downloading your files.</p>
    <a href="${personalizeUrl}" style="display:inline-block;background:#1B2F4E;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:700;font-size:.95rem">Personalize My Template →</a>
  </div>
</div>

<p style="color:#374151;line-height:1.7">Once I receive your intake form, I'll get to work and reach out within <strong>1–2 business days</strong> with an update.</p>
<p style="color:#374151;line-height:1.7">Have questions? Just reply to this email — I personally read every message.</p>
<p style="color:#374151;line-height:1.7;margin-top:28px">With excitement,<br><strong>Mel</strong><br><span style="color:#6B7280;font-size:.88rem">Sites by Mel | sitesbymel.com</span></p>
<hr style="border:none;border-top:1px solid #E5E0D8;margin:28px 0">
<p style="color:#9CA3AF;font-size:.75rem;text-align:center">Your intake link: ${intakeUrl}<br>Your template link: ${personalizeUrl}<br>Save these — they're valid for 48 hours.</p>
</body></html>`
          }).catch(e => console.error('[webhook] welcome email failed:', e.message));

          // Notify Mel
          resend.emails.send({
            from: 'Sites by Mel <mel@sitesbymel.com>',
            to: 'mel@sitesbymel.com',
            subject: `💰 New order — ${order.product_name} ($${(order.amount/100).toFixed(2)})`,
            html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px">
              <h2 style="color:#1B2F4E;margin-bottom:4px">New Template Order</h2>
              <p style="color:#6B7280;font-size:.85rem;margin-bottom:20px">${new Date().toLocaleString()}</p>
              <table style="width:100%;border-collapse:collapse;font-size:.9rem">
                <tr><td style="padding:8px 0;color:#6B7280;width:40%">Customer</td><td style="font-weight:600;color:#1B2F4E">${name || '—'}</td></tr>
                <tr><td style="padding:8px 0;color:#6B7280">Email</td><td style="color:#1B2F4E">${email}</td></tr>
                <tr><td style="padding:8px 0;color:#6B7280">Template</td><td style="font-weight:600;color:#1B2F4E">${order.product_name}</td></tr>
                <tr><td style="padding:8px 0;color:#6B7280">Add-On</td><td style="color:#1B2F4E">${order.selected_addon && order.selected_addon !== 'none' ? order.selected_addon : 'None'}</td></tr>
                <tr><td style="padding:8px 0;color:#6B7280">Amount</td><td style="font-weight:700;color:#C9922B;font-size:1.1rem">$${(order.amount/100).toFixed(2)}</td></tr>
              </table>
              <div style="margin-top:20px;display:flex;gap:10px">
                <a href="${BASE_URL}/admin/orders" style="display:inline-block;background:#1B2F4E;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:700;font-size:.88rem">View in Admin →</a>
                <a href="${intakeUrl}" style="display:inline-block;background:#C9922B;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:700;font-size:.88rem">View Intake Form →</a>
              </div>
            </div>`
          }).catch(e => console.error('[webhook] mel notify failed:', e.message));
        }
      }
    } else if (s.metadata.type === 'setup') {
      db.prepare("UPDATE setup_requests SET status='paid' WHERE stripe_session_id=?").run(s.id);
    }
  }
  res.sendStatus(200);
});

// ── INTAKE FORM ───────────────────────────────────────────────────────────────
const intakeLogoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, 'uploads', 'intake');
    require('fs').mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `logo-${req.params.token}${ext}`);
  }
});
const intakeUpload = multer({ storage: intakeLogoStorage, limits: { fileSize: 10 * 1024 * 1024 } });

app.get('/intake/:token', (req, res) => {
  const intake = db.prepare('SELECT * FROM intake_responses WHERE token=?').get(req.params.token);
  if (!intake) return res.status(404).render('404', { message: 'Intake form not found. Please use the link from your welcome email.' });
  const order = intake.order_id ? db.prepare('SELECT * FROM orders WHERE id=?').get(intake.order_id) : null;
  res.render('intake', { intake, order, token: req.params.token, submitted: intake.submitted });
});

app.post('/intake/:token', intakeUpload.single('logo'), (req, res) => {
  const intake = db.prepare('SELECT * FROM intake_responses WHERE token=?').get(req.params.token);
  if (!intake) return res.status(404).send('Not found.');
  const { business_name, tagline, primary_color, secondary_color, accent_color, font_style,
    about_text, services_text, phone, address, facebook, instagram, twitter, linkedin, tiktok, special_notes } = req.body;
  const logo_filename = req.file ? req.file.filename : intake.logo_filename;
  db.prepare(`UPDATE intake_responses SET
    business_name=?,tagline=?,primary_color=?,secondary_color=?,accent_color=?,font_style=?,
    logo_filename=?,about_text=?,services_text=?,phone=?,address=?,
    facebook=?,instagram=?,twitter=?,linkedin=?,tiktok=?,special_notes=?,submitted=1
    WHERE token=?`)
    .run(business_name, tagline, primary_color||'#1B2F4E', secondary_color||'#C9922B', accent_color||'#ffffff',
      font_style, logo_filename, about_text, services_text, phone, address,
      facebook, instagram, twitter, linkedin, tiktok, special_notes, req.params.token);
  // Notify Mel
  if (resend) {
    const order = intake.order_id ? db.prepare('SELECT * FROM orders WHERE id=?').get(intake.order_id) : null;
    resend.emails.send({
      from: 'Sites by Mel <mel@sitesbymel.com>',
      to: 'mel@sitesbymel.com',
      subject: `New intake form submitted — ${business_name}`,
      html: `<p><strong>${business_name}</strong> just submitted their intake form${order ? ` for order #${order.id} (${order.product_name})` : ''}.</p>
      <p><a href="${BASE_URL}/admin/intake/${req.params.token}">View in Admin →</a></p>`
    }).catch(()=>{});
  }
  res.render('intake-thanks', { business_name });
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
  const photos = db.prepare('SELECT * FROM order_photos WHERE deleted=0 ORDER BY created_at DESC').all();
  const photosByOrder = {};
  photos.forEach(p => { (photosByOrder[p.order_id] = photosByOrder[p.order_id] || []).push(p); });
  res.render('admin/orders', { orders, photosByOrder });
});

// Serve uploaded order photos
app.get('/admin/order-photo/:id', requireAuth, (req, res) => {
  const photo = db.prepare('SELECT * FROM order_photos WHERE id=? AND deleted=0').get(req.params.id);
  if (!photo || !fs.existsSync(photo.path)) return res.status(404).send('Not found');
  res.sendFile(photo.path);
});

// Delete uploaded photo
app.post('/admin/order-photo/:id/delete', requireAuth, (req, res) => {
  const photo = db.prepare('SELECT * FROM order_photos WHERE id=?').get(req.params.id);
  if (photo) {
    db.prepare('UPDATE order_photos SET deleted=1 WHERE id=?').run(photo.id);
    try { if (fs.existsSync(photo.path)) fs.unlinkSync(photo.path); } catch(e) {}
  }
  res.redirect('/admin/orders');
});

// Blog subscribe
app.post('/subscribe', async (req, res) => {
  const email = (req.body.email || '').trim().toLowerCase();
  if (!email || !email.includes('@')) return res.json({ ok: false, message: 'Please enter a valid email.' });
  try {
    db.prepare('INSERT OR IGNORE INTO subscribers (email) VALUES (?)').run(email);
    await sendEmail({ to: email, subject: 'You\'re subscribed — Sites by Mel', html: autoReplyHtml('there', 'You\'re on the list!', '<p style="color:#333;line-height:1.7">Thanks for subscribing to the Sites by Mel blog. You\'ll get weekly tips on websites, SEO, Google, and growing your business online.</p>') });
  } catch(e) { console.error('[subscribe]', e.message); }
  res.json({ ok: true, message: 'You\'re subscribed! Check your inbox.' });
});

// Admin subscribers list
// Admin: list all intake responses
app.get('/admin/intakes', requireAuth, (req, res) => {
  const intakes = db.prepare(`SELECT i.*, o.product_name, o.customer_email
    FROM intake_responses i LEFT JOIN orders o ON i.order_id=o.id
    ORDER BY i.created_at DESC`).all();
  res.render('admin/intakes', { intakes });
});

app.get('/admin/intake/:token', requireAuth, (req, res) => {
  const intake = db.prepare('SELECT * FROM intake_responses WHERE token=?').get(req.params.token);
  if (!intake) return res.redirect('/admin/intakes');
  const order = intake.order_id ? db.prepare('SELECT * FROM orders WHERE id=?').get(intake.order_id) : null;
  const logoUrl = intake.logo_filename ? `/uploads/intake/${intake.logo_filename}` : null;
  res.render('admin/intake-detail', { intake, order, logoUrl });
});

app.get('/admin/subscribers', requireAuth, (req, res) => {
  const subscribers = db.prepare('SELECT * FROM subscribers ORDER BY created_at DESC').all();
  res.render('admin/subscribers', { subscribers });
});

// ── ADMIN CLIENT PROJECTS ────────────────────────────────────────────────────
const PACKAGE_CHECKLISTS = {
  template_launch: [
    'Domain purchased in client name',
    'Cloudflare account set up (DNS + security)',
    'Railway project created',
    'GitHub repo created and connected to Railway',
    'Template deployed and live on Railway',
    'Domain pointed to Railway',
    'SSL verified (https working)',
    'Professional email set up (forwarding to client inbox)',
    'Resend configured for their domain',
    'Contact forms tested and delivering',
    'Stripe: create account using client email (mel does this)',
    'Stripe: configure products / payment link / branding (mel does this)',
    'Stripe: send client their login + "Activate Account" instructions',
    'Stripe: confirm client verified identity + bank account added',
    'Stripe payment button live on site and tested',
    'Full site review and test on mobile',
    'Client handoff email sent with login info',
  ],
  custom_build: [
    'Custom design mockup created and approved by client',
    'Full site built from scratch',
    'Domain purchased in client name',
    'Cloudflare account set up (DNS + security)',
    'Railway project created',
    'GitHub repo created and connected to Railway',
    'Site deployed and live on Railway',
    'Domain pointed to Railway',
    'SSL verified (https working)',
    'Professional email set up (forwarding to client inbox)',
    'Resend configured for their domain',
    'Contact forms tested and delivering',
    'Stripe: create account using client email (mel does this)',
    'Stripe: configure products / payment link / branding (mel does this)',
    'Stripe: send client their login + "Activate Account" instructions',
    'Stripe: confirm client verified identity + bank account added',
    'Stripe payment button live on site and tested',
    'SEO: meta titles + descriptions on all pages',
    'SEO: schema markup added',
    'SEO: sitemap.xml created and submitted',
    'Google Search Console set up and verified',
    'Google Analytics 4 installed and goals configured',
    'GA4 linked to Search Console',
    'CMS additions complete (per client request)',
    'Full site review and test on mobile + desktop',
    'Client handoff email sent with login info',
  ],
  diy: [],
};

app.get('/admin/clients', requireAuth, (req, res) => {
  const clients = db.prepare('SELECT * FROM client_projects ORDER BY created_at DESC').all();
  res.render('admin/clients', { clients });
});

app.get('/admin/clients/new', requireAuth, (req, res) => {
  res.render('admin/client-form', { client: null, PACKAGE_CHECKLISTS });
});

app.post('/admin/clients/new', requireAuth, (req, res) => {
  const { customer_name, customer_email, package_type, domain_name, domain_renewal_date,
    railway_project_name, railway_project_url, railway_monthly_cost, github_repo_url,
    cloudflare_zone, professional_email, resend_domain, stripe_status,
    package_price, monthly_fee, notes } = req.body;
  db.prepare(`INSERT INTO client_projects
    (customer_name,customer_email,package_type,domain_name,domain_renewal_date,
     railway_project_name,railway_project_url,railway_monthly_cost,github_repo_url,
     cloudflare_zone,professional_email,resend_domain,stripe_status,
     package_price,monthly_fee,notes)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    .run(customer_name, customer_email, package_type, domain_name, domain_renewal_date,
      railway_project_name, railway_project_url, parseFloat(railway_monthly_cost)||5,
      github_repo_url, cloudflare_zone, professional_email, resend_domain, stripe_status,
      parseFloat(package_price)||0, parseFloat(monthly_fee)||15, notes);
  res.redirect('/admin/clients');
});

app.get('/admin/clients/:id', requireAuth, (req, res) => {
  const client = db.prepare('SELECT * FROM client_projects WHERE id=?').get(req.params.id);
  if (!client) return res.redirect('/admin/clients');
  client.checklist_done = JSON.parse(client.checklist_done || '[]');
  const checklist = PACKAGE_CHECKLISTS[client.package_type] || [];
  res.render('admin/client-detail', { client, checklist, PACKAGE_CHECKLISTS });
});

app.post('/admin/clients/:id/edit', requireAuth, (req, res) => {
  const { customer_name, customer_email, package_type, status, domain_name, domain_renewal_date,
    railway_project_name, railway_project_url, railway_monthly_cost, github_repo_url,
    cloudflare_zone, professional_email, resend_domain, stripe_status,
    package_price, monthly_fee, notes,
    membership_status, membership_tier, membership_amount, stripe_recurring_link,
    credentials_notes, hourly_rate, bitwarden_folder } = req.body;
  db.prepare(`UPDATE client_projects SET
    customer_name=?,customer_email=?,package_type=?,status=?,domain_name=?,domain_renewal_date=?,
    railway_project_name=?,railway_project_url=?,railway_monthly_cost=?,github_repo_url=?,
    cloudflare_zone=?,professional_email=?,resend_domain=?,stripe_status=?,
    package_price=?,monthly_fee=?,notes=?,
    membership_status=?,membership_tier=?,membership_amount=?,stripe_recurring_link=?,
    credentials_notes=?,hourly_rate=?,bitwarden_folder=? WHERE id=?`)
    .run(customer_name, customer_email, package_type, status, domain_name, domain_renewal_date,
      railway_project_name, railway_project_url, parseFloat(railway_monthly_cost)||5,
      github_repo_url, cloudflare_zone, professional_email, resend_domain, stripe_status,
      parseFloat(package_price)||0, parseFloat(monthly_fee)||15, notes,
      membership_status||'none', membership_tier, parseFloat(membership_amount)||0,
      stripe_recurring_link, credentials_notes, parseFloat(hourly_rate)||75,
      bitwarden_folder, req.params.id);
  res.redirect('/admin/clients/' + req.params.id);
});

app.post('/admin/clients/:id/checklist', requireAuth, (req, res) => {
  const done = Array.isArray(req.body.done) ? req.body.done : (req.body.done ? [req.body.done] : []);
  db.prepare('UPDATE client_projects SET checklist_done=? WHERE id=?')
    .run(JSON.stringify(done), req.params.id);
  res.redirect('/admin/clients/' + req.params.id);
});

app.get('/admin/clients/:id/handoff', requireAuth, (req, res) => {
  const client = db.prepare('SELECT * FROM client_projects WHERE id=?').get(req.params.id);
  if (!client) return res.redirect('/admin/clients');
  res.render('admin/client-handoff', { client });
});

// Client contract
app.get('/admin/clients/:id/contract', requireAuth, (req, res) => {
  const client = db.prepare('SELECT * FROM client_projects WHERE id=?').get(req.params.id);
  if (!client) return res.redirect('/admin/clients');
  const tmpl = db.prepare('SELECT content FROM contract_template WHERE id=1').get();
  const contract = tmpl ? JSON.parse(tmpl.content) : { intro: '', sections: [] };
  res.render('admin/client-contract', { client, contract });
});

app.post('/admin/clients/:id/contract-status', requireAuth, (req, res) => {
  const { contract_status, contract_notes } = req.body;
  const now = new Date().toISOString().substring(0, 10);
  const current = db.prepare('SELECT contract_status FROM client_projects WHERE id=?').get(req.params.id);
  let sent_at = null, signed_at = null;
  if (contract_status === 'sent' && current.contract_status !== 'sent') sent_at = now;
  if (contract_status === 'signed') signed_at = now;
  db.prepare(`UPDATE client_projects SET contract_status=?,contract_notes=?
    ${sent_at ? ',contract_sent_at=?' : ''}
    ${signed_at ? ',contract_signed_at=?' : ''}
    WHERE id=?`)
    .run(...[contract_status, contract_notes, sent_at, signed_at].filter(v=>v!==null), req.params.id);
  res.redirect('/admin/clients/' + req.params.id);
});

// Edit contract template
app.get('/admin/contract-template', requireAuth, (req, res) => {
  const tmpl = db.prepare('SELECT content FROM contract_template WHERE id=1').get();
  const contract = tmpl ? JSON.parse(tmpl.content) : { intro: '', sections: [] };
  res.render('admin/contract-template', { contract });
});

app.post('/admin/contract-template', requireAuth, (req, res) => {
  const { intro } = req.body;
  const titles = Array.isArray(req.body.title) ? req.body.title : [req.body.title];
  const bodies = Array.isArray(req.body.body) ? req.body.body : [req.body.body];
  const sections = titles.map((t, i) => ({ title: t, body: bodies[i] || '' })).filter(s => s.title);
  const content = JSON.stringify({ intro, sections });
  db.prepare('UPDATE contract_template SET content=?, updated_at=CURRENT_TIMESTAMP WHERE id=1').run(content);
  res.redirect('/admin/contract-template?saved=1');
});

// ── ADMIN PACKAGES ───────────────────────────────────────────────────────────
app.get('/admin/packages', requireAuth, (req, res) => {
  const packages = db.prepare('SELECT * FROM service_packages ORDER BY sort_order').all();
  packages.forEach(p => { try { p.bullets = JSON.parse(p.bullets || '[]'); } catch(e) { p.bullets = []; } });
  res.render('admin/packages', { packages });
});

app.post('/admin/packages/:id/edit', requireAuth, (req, res) => {
  const { name, tagline, price_display, description, cta_label, cta_url, is_featured, is_active, sort_order, internal_notes } = req.body;
  const rawBullets = req.body.bullets || '';
  const bullets = rawBullets.split('\n').map(b => b.trim()).filter(Boolean);
  db.prepare(`UPDATE service_packages SET
    name=?,tagline=?,price_display=?,description=?,bullets=?,
    cta_label=?,cta_url=?,is_featured=?,is_active=?,sort_order=?,
    internal_notes=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`)
    .run(name, tagline, price_display, description, JSON.stringify(bullets),
      cta_label, cta_url, is_featured?1:0, is_active?1:0,
      parseInt(sort_order)||0, internal_notes, req.params.id);
  res.redirect('/admin/packages');
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

// Admin — Check images on Railway server
app.get('/admin/check-images', requireAuth, (req, res) => {

  const imgDir = path.join(__dirname, 'public', 'images');
  const files = fs.existsSync(imgDir) ? fs.readdirSync(imgDir) : [];
  const products = db.prepare('SELECT slug, thumbnail FROM products ORDER BY slug').all();
  let html = '<h2>Images on server</h2><ul>' + files.map(f => `<li>${f}</li>`).join('') + '</ul>';
  html += '<h2>DB thumbnails</h2><ul>' + products.map(p => `<li>${p.slug}: <b>${p.thumbnail || 'NULL'}</b> ${files.includes(p.thumbnail) ? '✅' : '❌ MISSING'}</li>`).join('') + '</ul>';
  res.send(html);
});

// Admin — Force fix thumbnails in DB
app.get('/admin/fix-thumbnails', requireAuth, (req, res) => {
  const thumbs = [
    { slug: 'service-pro',    thumbnail: 'service-pro.jpg' },
    { slug: 'table-ready',    thumbnail: 'Tables.jpg' },
    { slug: 'key-ready',      thumbnail: 'KeyReady.jpg' },
    { slug: 'shop-front',     thumbnail: 'ShopReady.jpg' },
    { slug: 'voice-first',    thumbnail: 'ThoughtfulCreator.jpg' },
    { slug: 'gather-here',    thumbnail: 'Cornerstone.jpg' },
    { slug: 'pet-shop',       thumbnail: 'pet-shop.jpg' },
    { slug: 'beauty-studio',  thumbnail: 'beauty-studio.jpg' },
    { slug: 'lens-and-light', thumbnail: 'lens-and-light.jpg' },
    { slug: 'green-cut',      thumbnail: 'green-cut.jpg' },
    { slug: 'wellness-pro',   thumbnail: 'wellness-pro.jpg' },
    { slug: 'fit-life',       thumbnail: 'fit-life.jpg' },
    { slug: 'sparkle-clean',  thumbnail: 'sparkle-clean.jpg' },
    { slug: 'bright-minds',   thumbnail: 'bright-minds.jpg' },
    { slug: 'forever-events', thumbnail: 'forever-events.jpg' },
    { slug: 'auto-shine',     thumbnail: 'auto-shine.jpg' },
    { slug: 'detail-pro',     thumbnail: 'detail-pro.jpg' },
  ];
  for (const t of thumbs) {
    db.prepare('UPDATE products SET thumbnail=? WHERE slug=?').run(t.thumbnail, t.slug);
  }
  res.redirect('/admin/check-images');
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
