const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = process.env.DATABASE_PATH || './sbm.sqlite';
const dbDir = path.dirname(dbPath);
if (dbDir !== '.' && !fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ── PRODUCTS (templates for sale) ────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    slug        TEXT NOT NULL UNIQUE,
    category    TEXT NOT NULL,
    description TEXT,
    price       INTEGER NOT NULL,  -- in cents (e.g. 4700 = $47)
    file_path   TEXT,              -- path to downloadable zip
    preview_url TEXT,              -- live demo URL
    thumbnail   TEXT,              -- image filename
    active      INTEGER DEFAULT 1,
    sort_order  INTEGER DEFAULT 0,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// ── ORDERS (template purchases) ───────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS orders (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id          INTEGER REFERENCES products(id),
    product_name        TEXT,
    amount              INTEGER NOT NULL,
    customer_name       TEXT,
    customer_email      TEXT NOT NULL,
    stripe_session_id   TEXT UNIQUE,
    stripe_payment_intent TEXT,
    status              TEXT DEFAULT 'pending',  -- pending | paid | refunded
    download_token      TEXT UNIQUE,
    download_count      INTEGER DEFAULT 0,
    download_expires_at DATETIME,
    selected_addon      TEXT DEFAULT 'none',
    created_at          DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);
try { db.exec(`ALTER TABLE orders ADD COLUMN selected_addon TEXT DEFAULT 'none'`); } catch(e) {}
try { db.exec(`ALTER TABLE orders ADD COLUMN photo_notes TEXT`); } catch(e) {}
try { db.exec(`ALTER TABLE orders ADD COLUMN coupon_code TEXT`); } catch(e) {}
try { db.exec(`ALTER TABLE orders ADD COLUMN discount_amount INTEGER DEFAULT 0`); } catch(e) {}
try { db.exec(`ALTER TABLE orders ADD COLUMN brand_colors TEXT`); } catch(e) {}
try { db.exec(`ALTER TABLE orders ADD COLUMN glove_notes TEXT`); } catch(e) {}
try { db.exec(`ALTER TABLE orders ADD COLUMN city TEXT`); } catch(e) {}
try { db.exec(`ALTER TABLE orders ADD COLUMN built_zip_path TEXT`); } catch(e) {}
try { db.exec(`ALTER TABLE orders ADD COLUMN built_zip_token TEXT`); } catch(e) {}
try { db.exec(`ALTER TABLE orders ADD COLUMN built_zip_expires TEXT`); } catch(e) {}
try { db.exec(`ALTER TABLE order_photos ADD COLUMN field_name TEXT`); } catch(e) {}
// Intake form fields — business details
try { db.exec(`ALTER TABLE orders ADD COLUMN business_name TEXT`); } catch(e) {}
try { db.exec(`ALTER TABLE orders ADD COLUMN phone TEXT`); } catch(e) {}
try { db.exec(`ALTER TABLE orders ADD COLUMN email TEXT`); } catch(e) {}
try { db.exec(`ALTER TABLE orders ADD COLUMN address TEXT`); } catch(e) {}
try { db.exec(`ALTER TABLE orders ADD COLUMN tagline TEXT`); } catch(e) {}
// FitLife extended intake fields
try { db.exec(`ALTER TABLE orders ADD COLUMN trainer_name TEXT`); } catch(e) {}
try { db.exec(`ALTER TABLE orders ADD COLUMN hero_badge TEXT`); } catch(e) {}
try { db.exec(`ALTER TABLE orders ADD COLUMN city_zip TEXT`); } catch(e) {}
try { db.exec(`ALTER TABLE orders ADD COLUMN instagram TEXT`); } catch(e) {}
try { db.exec(`ALTER TABLE orders ADD COLUMN hours_mf TEXT`); } catch(e) {}
try { db.exec(`ALTER TABLE orders ADD COLUMN hours_sat TEXT`); } catch(e) {}
try { db.exec(`ALTER TABLE orders ADD COLUMN hours_sun TEXT`); } catch(e) {}
try { db.exec(`ALTER TABLE orders ADD COLUMN bio TEXT`); } catch(e) {}
try { db.exec(`ALTER TABLE orders ADD COLUMN years_exp TEXT`); } catch(e) {}
try { db.exec(`ALTER TABLE orders ADD COLUMN client_count TEXT`); } catch(e) {}
try { db.exec(`ALTER TABLE orders ADD COLUMN certs TEXT`); } catch(e) {}
try { db.exec(`ALTER TABLE orders ADD COLUMN services_json TEXT`); } catch(e) {}
try { db.exec(`ALTER TABLE orders ADD COLUMN testimonials_json TEXT`); } catch(e) {}
try { db.exec(`ALTER TABLE orders ADD COLUMN formspree_id TEXT`); } catch(e) {}
try { db.exec(`ALTER TABLE orders ADD COLUMN calendly_link TEXT`); } catch(e) {}
try { db.exec(`ALTER TABLE orders ADD COLUMN stock_requests TEXT`); } catch(e) {}
try { db.exec(`ALTER TABLE orders ADD COLUMN netlify_url TEXT`); } catch(e) {}
try { db.exec(`ALTER TABLE orders ADD COLUMN extra_fields TEXT`); } catch(e) {}
try { db.exec(`ALTER TABLE orders ADD COLUMN agreement_accepted_at TEXT`); } catch(e) {}
try { db.exec(`ALTER TABLE orders ADD COLUMN agreement_accepted_ip TEXT`); } catch(e) {}

// ── COUPONS ───────────────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS coupons (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    code         TEXT NOT NULL UNIQUE COLLATE NOCASE,
    type         TEXT NOT NULL DEFAULT 'percent', -- 'percent' or 'fixed'
    value        REAL NOT NULL,                   -- percent: 0-100, fixed: dollars
    description  TEXT,                            -- internal label e.g. "Summer sale 20%"
    applies_to   TEXT DEFAULT 'all',              -- 'all' or product slug
    max_uses     INTEGER DEFAULT 0,               -- 0 = unlimited
    uses_count   INTEGER DEFAULT 0,
    expires_at   TEXT,                            -- ISO date string or null
    is_active    INTEGER DEFAULT 1,
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// ── SETUP REQUESTS (done-for-you service) ─────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS setup_requests (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id     INTEGER REFERENCES products(id),
    product_name   TEXT,
    name           TEXT NOT NULL,
    email          TEXT NOT NULL,
    phone          TEXT,
    business_name  TEXT,
    business_url   TEXT,
    notes          TEXT,
    amount         INTEGER NOT NULL,
    stripe_session_id TEXT UNIQUE,
    status         TEXT DEFAULT 'pending',  -- pending | paid | in_progress | completed
    admin_notes    TEXT,
    created_at     DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// ── QUOTE REQUESTS (full custom sites) ───────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS quotes (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    name           TEXT NOT NULL,
    email          TEXT NOT NULL,
    phone          TEXT,
    business_name  TEXT,
    business_url   TEXT,
    project_type   TEXT,
    budget         TEXT,
    timeline       TEXT,
    description    TEXT NOT NULL,
    status         TEXT DEFAULT 'new',  -- new | contacted | quoted | won | lost
    admin_notes    TEXT,
    created_at     DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// ── TEMPLATE ADD-ONS ─────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS template_addons (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id          INTEGER REFERENCES orders(id),
    customer_name     TEXT,
    customer_email    TEXT,
    product_name      TEXT,
    addon_type        TEXT,  -- drive_link | photo_upload | white_glove
    addon_amount      INTEGER,
    drive_link        TEXT,
    photo_paths       TEXT,  -- JSON array of uploaded file paths
    stripe_session_id TEXT UNIQUE,
    status            TEXT DEFAULT 'pending',  -- pending | paid | in_progress | completed
    admin_notes       TEXT,
    created_at        DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// ── PAGE VIEWS (analytics) ───────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS page_views (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    path       TEXT NOT NULL,
    referrer   TEXT,
    source     TEXT,  -- direct | google | facebook | instagram | other
    session_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// ── EXPENSES (financials) ─────────────────────────────────────────────────────
db.exec(`CREATE TABLE IF NOT EXISTS expenses (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  description  TEXT NOT NULL,
  category     TEXT NOT NULL,
  amount       REAL NOT NULL,
  expense_date TEXT NOT NULL,
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

// ── CLIENT PROJECT UPGRADES (membership + credentials + contract) ─────────────
try {
  db.exec(`ALTER TABLE client_projects ADD COLUMN membership_status TEXT DEFAULT 'none'`);
  db.exec(`ALTER TABLE client_projects ADD COLUMN membership_tier TEXT`);
  db.exec(`ALTER TABLE client_projects ADD COLUMN membership_amount REAL DEFAULT 0`);
  db.exec(`ALTER TABLE client_projects ADD COLUMN stripe_recurring_link TEXT`);
  db.exec(`ALTER TABLE client_projects ADD COLUMN credentials_notes TEXT`);
  db.exec(`ALTER TABLE client_projects ADD COLUMN hourly_rate REAL DEFAULT 75`);
  db.exec(`ALTER TABLE client_projects ADD COLUMN project_type TEXT DEFAULT 'template_launch'`);
  db.exec(`ALTER TABLE client_projects ADD COLUMN bitwarden_folder TEXT`);
  db.exec(`ALTER TABLE client_projects ADD COLUMN contract_status TEXT DEFAULT 'not_sent'`);
  db.exec(`ALTER TABLE client_projects ADD COLUMN contract_sent_at TEXT`);
  db.exec(`ALTER TABLE client_projects ADD COLUMN contract_signed_at TEXT`);
  db.exec(`ALTER TABLE client_projects ADD COLUMN contract_notes TEXT`);
} catch(e) {}

// ── CLIENT INTAKE RESPONSES ───────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS intake_responses (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id        INTEGER,
    token           TEXT UNIQUE,
    business_name   TEXT,
    tagline         TEXT,
    primary_color   TEXT DEFAULT '#1B2F4E',
    secondary_color TEXT DEFAULT '#C9922B',
    accent_color    TEXT DEFAULT '#ffffff',
    font_style      TEXT,
    logo_filename   TEXT,
    about_text      TEXT,
    services_text   TEXT,
    phone           TEXT,
    address         TEXT,
    facebook        TEXT,
    instagram       TEXT,
    twitter         TEXT,
    linkedin        TEXT,
    tiktok          TEXT,
    special_notes   TEXT,
    submitted       INTEGER DEFAULT 0,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// ── CONTRACT TEMPLATE (editable from admin) ───────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS contract_template (
    id       INTEGER PRIMARY KEY,
    content  TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);
const contractExists = db.prepare("SELECT COUNT(*) as n FROM contract_template").get();
if (contractExists.n === 0) {
  db.prepare("INSERT INTO contract_template (id, content) VALUES (1, ?)").run(
    JSON.stringify({
      intro: "This Service Agreement (\"Agreement\") is entered into between Sites by Mel (\"Designer\") and the client named below (\"Client\").",
      sections: [
        {
          title: "1. Services",
          body: "Designer agrees to provide the web design services selected by Client as described in the project proposal or package chosen at time of purchase. Services may include website template customization, domain setup, professional email configuration, hosting setup, and/or any agreed add-ons. Exact scope is confirmed in writing via email prior to work beginning."
        },
        {
          title: "2. Payment Terms",
          body: "A non-refundable deposit of 50% is required before any work begins. The remaining balance is due upon project completion, before final files or live access are delivered. For Template Launch projects, full payment is collected at checkout. For Custom Build projects, a deposit invoice will be sent separately. Monthly membership fees are billed automatically via the payment method on file and are due on the same date each month."
        },
        {
          title: "3. Ownership",
          body: "Upon receipt of full payment, Client owns all website content, written copy, and design files delivered. Client owns their domain name, which is registered in their name. Designer retains ownership of underlying hosting infrastructure, server configuration, and deployment setup. Client may request transfer of all files at any time. A transfer/handoff fee of $150 applies if Client wishes to move hosting to another provider."
        },
        {
          title: "4. Hosting & Maintenance",
          body: "For Template Launch and Custom Build projects, hosting is managed by Designer on behalf of Client. Hosting is included for the first year. After year 1, hosting renews at the agreed monthly rate. If Client cancels hosting with 30 days written notice, all website files will be provided to Client within 5 business days. Designer is not responsible for downtime caused by third-party hosting providers, domain registrars, or acts outside Designer's control."
        },
        {
          title: "5. Revisions & Support",
          body: "Projects include up to 2 rounds of revisions within 14 days of delivery. Additional revisions or support requests outside this window are billed at Designer's current hourly rate. Clients on a monthly membership plan receive ongoing minor updates and support as described in their membership tier. Major changes (redesigns, new pages, new features) are quoted separately regardless of membership status."
        },
        {
          title: "6. Cancellation & Refunds",
          body: "The deposit is non-refundable once work has begun. If Client cancels mid-project, any work completed will be billed at the hourly rate and deducted from the deposit. No refunds are issued after project delivery. Monthly membership fees are non-refundable for the current billing period but may be cancelled at any time with 30 days notice to take effect the following billing cycle."
        },
        {
          title: "7. Client Responsibilities",
          body: "Client agrees to provide all content (text, photos, logos) required for the project within 14 days of project start. Delays caused by late content delivery may push the delivery timeline at no fault of Designer. Client is responsible for verifying their own identity with payment processors (e.g. Stripe) as required by those platforms."
        },
        {
          title: "8. Confidentiality",
          body: "Both parties agree to keep confidential any sensitive business information shared during the project. Designer will not share Client's business details, credentials, or personal information with any third party without written consent, except as required to complete the project (e.g. domain registrars, hosting providers)."
        },
        {
          title: "9. Agreement",
          body: "By signing below (or replying to the project proposal email with written acceptance), Client agrees to the terms of this Agreement. This Agreement is governed by the laws of the state in which Designer operates."
        }
      ]
    })
  );
}

// ── SERVICE PACKAGES (public-facing, editable from admin) ────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS service_packages (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    slug             TEXT NOT NULL UNIQUE,
    name             TEXT NOT NULL,
    tagline          TEXT,
    price_display    TEXT NOT NULL,
    description      TEXT,
    bullets          TEXT DEFAULT '[]',
    cta_label        TEXT,
    cta_url          TEXT,
    is_featured      INTEGER DEFAULT 0,
    is_active        INTEGER DEFAULT 1,
    sort_order       INTEGER DEFAULT 0,
    internal_notes   TEXT,
    updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Seed packages — INSERT only if the slug doesn't exist yet.
// Once a package exists, admin edits via /admin/packages are preserved across deploys.
const insertPkgIgnore = db.prepare(`INSERT OR IGNORE INTO service_packages
  (slug,name,tagline,price_display,description,bullets,cta_label,cta_url,is_featured,sort_order,internal_notes)
  VALUES (?,?,?,?,?,?,?,?,?,?,?)`);
function upsertPkg(slug,name,tagline,price_display,description,bullets,cta_label,cta_url,is_featured,sort_order,internal_notes) {
  insertPkgIgnore.run(slug,name,tagline,price_display,description,bullets,cta_label,cta_url,is_featured,sort_order,internal_notes);
}

// ── PACKAGE 1: TEMPLATE PACKAGE ───────────────────────────────────────────────
upsertPkg(
  'diy',
  'Template Package',
  'Mel builds it for you — you launch it',
  '$350',
  'Pick an industry-specific template and fill out a quick intake form. Mel personalizes every page with your business name, photos, and details — then sends you the finished files ready to upload. No tech work on your end.',
  JSON.stringify([
    'Mel personalizes every page for your business',
    'Your photos, your colors, your business details',
    'Looks great on phones, tablets & computers',
    'Contact form ready to receive messages',
    'No monthly fees — you own the files forever',
    'Delivered within 48 hours of intake form submission',
    'Upload to any host (Netlify, Durable, etc.) in minutes',
  ]),
  'Browse Templates', '/templates', 0, 1,
  `MEL INTERNAL — TEMPLATE PACKAGE ($350)
─────────────────────────────────────────
WHAT MEL DOES:
• Reviews customer intake form
• Swaps in their photos and business details
• Updates text across all 5 pages
• Reviews on mobile + desktop
• Delivers polished ZIP via download link within 48 hours

CUSTOMER DOES:
• Fills out intake form (name, photos, colors, copy)
• Downloads ZIP and uploads to their host (Netlify, Durable, etc.)
• Registers their own domain

COST TO MEL: ~1-2 hrs labor
PROFIT: $350 per site`
);

// ── PACKAGE 2: DONE-FOR-YOU TEMPLATE (add-on tier, internal reference) ────────
upsertPkg(
  'done_for_you_template',
  'Done-For-You Template',
  'Mel customizes your template — you launch it',
  '$597',
  'Buy a template and let Mel do all the customization. Your photos, your brand colors, your text — all updated and polished. Includes Stripe payment button and professional business email setup. You receive the finished files ready to launch.',
  JSON.stringify([
    'Your photos placed in the right spots',
    'Brand colors applied throughout',
    'Your business text and details updated',
    'Stripe payment button set up and ready',
    'Professional business email configured',
    'Full review and polish before delivery',
    'Delivered within 3 business days',
  ]),
  'Browse Templates', '/templates', 0, 2,
  `MEL INTERNAL — DONE-FOR-YOU TEMPLATE ($597 = $197 template + $400 add-on)
─────────────────────────────────────────────────────────────────────────────
WHAT MEL DOES (everything in the customization, nothing in hosting):
• Swaps in customer photos (up to 5, from intake form or upload)
• Updates ALL brand colors in CSS to match their palette
• Replaces ALL placeholder text with their business details (name, services, about, contact)
• Sets up Stripe payment button (Mel creates account using their email, configures products/payment links, sends them login to verify identity + add bank account)
• Sets up professional business email (you@theirdomain.com) via Cloudflare email routing → forwards to their personal inbox
• Full visual review on mobile + desktop
• Returns polished ZIP file via email within 3 business days

WHAT MEL DOES NOT DO IN THIS PACKAGE:
• Does NOT purchase domain (they handle that themselves)
• Does NOT set up hosting (they self-host or upgrade to Template Launch)
• Does NOT deploy site live (they do it themselves or upgrade)
• Does NOT set up Railway, GitHub, Cloudflare DNS

NOTE: Business email requires customer to own their domain already. If they don't have a domain, upsell to Template Launch ($797) where domain is included.

COST TO MEL: ~$0 (their domain/email uses Cloudflare free routing)
TIME: 3-5 hours per client
PROFIT: ~$320-360 after time cost at $75/hr`
);

// ── PACKAGE 2B: DOMAIN SETUP ──────────────────────────────────────────────────
upsertPkg(
  'domain_setup',
  'Domain Setup',
  'Your template live on your own domain',
  '$499',
  'Everything in the Template Package plus Mel purchases your domain, configures DNS, and gets your site fully live at www.yourbusiness.com. You walk away with a real website at your own address — no tech work required.',
  JSON.stringify([
    'Everything in the Template Package included',
    'Mel purchases your domain name for you',
    'DNS configured and live at yourdomain.com',
    'Secure https — the padlock customers trust',
    'Contact form tested and working',
    'Mobile + desktop reviewed before delivery',
    'You own the domain and files forever',
  ]),
  'Get Started', '/contact', 0, 2,
  `MEL INTERNAL — DOMAIN SETUP ($499)
─────────────────────────────────────
WHAT MEL DOES:
• Everything in Template Package (personalize all 5 pages)
• Purchase domain in client's name (~$12-15/yr — included in $499 or charge separately year 2+)
• Deploy to Netlify (free hosting forever)
• Connect domain DNS to Netlify
• Verify SSL (green padlock)
• Test contact form end to end
• Send client their domain login credentials

WHAT CLIENT DOES:
• Nothing technical — just fill out the intake form

TIME: 2-3 hrs per client
PROFIT: ~$460 after domain cost`
);

// ── PACKAGE 3: TEMPLATE LAUNCH ────────────────────────────────────────────────
upsertPkg(
  'template_launch',
  'Template Launch',
  'Your site goes live — you do nothing technical',
  '$797',
  'Pick a template and Mel handles absolutely everything. Your site launches on your own domain with a professional business email, secure hosting, and working contact forms — all set up, tested, and live. You just show up.',
  JSON.stringify([
    'Your own domain name — included for year 1',
    'Site fully live at yourdomain.com',
    'Professional email: you@yourdomain.com',
    'Secure https — the padlock customers trust',
    'Contact forms delivering straight to your inbox',
    'Stripe payment button live and tested',
    'Looks great on phones, tablets & computers',
    'Managed hosting — we handle the tech',
    'Everything from Done-For-You Template included',
  ]),
  'Get Started', '/contact', 1, 3,
  `MEL INTERNAL — TEMPLATE LAUNCH ($797)
─────────────────────────────────────
WHAT MEL DOES (full end-to-end launch):
• All of Done-For-You Template (photos, colors, text, Stripe, email)
• Purchases domain in CLIENT'S name (use their email/card or invoice them separately for domain cost ~$12-15/yr — include in $797 or charge separately)
• Sets up Cloudflare account for the domain (DNS + free security layer + email routing)
• Creates Railway project under Mel's account (private — client never sees Railway)
• Creates GitHub repo under Mel's GitHub (private — client never sees GitHub)
• Deploys site to Railway, connects GitHub auto-deploy
• Points domain DNS to Railway
• Verifies SSL (https green padlock)
• Sets up professional email via Cloudflare routing → Resend → forwards to client inbox
• Tests all contact forms end to end
• Sets up Stripe: creates account with their email, configures products/payment links, sends them login link to verify identity + add bank account
• Full mobile + desktop review
• Sends client handoff email with their domain login, email login, Stripe login

WHAT CLIENT DOES:
• Verifies their Stripe identity (10 min — legal requirement, Mel cannot do this)
• Adds their bank account to Stripe

HOSTING COST TO MEL: Railway ~$5/mo
MEL CHARGES CLIENT: $15/mo after year 1 (net $10/mo profit per client)
TIME: 6-10 hours per client
PROFIT: ~$200-350 after time cost at $75/hr + $10/mo recurring`
);

// ── PACKAGE 4: CUSTOM BUILD ───────────────────────────────────────────────────
upsertPkg(
  'custom_build',
  'Full Custom Build',
  'A website built entirely around your business',
  'Starting at $1,200',
  'Need something unique? A custom build means your site is designed from scratch — built around your brand, your customers, and your specific goals. No templates, no compromises.',
  JSON.stringify([
    '100% custom design — nobody else has your site',
    'Built around your specific business needs',
    'As many pages as your business requires',
    'SEO foundation built in from day one',
    'Google Analytics — see who visits your site',
    'Everything in Template Launch included',
    'Advanced features: booking, e-commerce, CMS & more',
    'Priority support for 30 days after launch',
  ]),
  'Request a Quote', '/quote', 0, 4,
  `MEL INTERNAL — FULL CUSTOM BUILD (Starting at $1,500)
──────────────────────────────────────────────────────
PRICING GUIDE:
• Simple custom (5 pages, basic features): $1,500
• Medium (8-10 pages, booking or e-commerce): $2,000-2,500
• Complex (10+ pages, CMS, multiple features): $2,500-4,000+
• Always take 50% deposit before starting

WHAT MEL DOES (everything in Template Launch PLUS):
• Discovery call to understand business goals and needs
• Custom wireframe/mockup created in Canva or Figma
• Client approves design before build starts
• Site built from scratch (custom HTML/CSS/JS or Node.js/EJS for dynamic needs)
• All Template Launch setup included (domain, Cloudflare, Railway, GitHub, SSL, email, Stripe)
• SEO: meta titles + descriptions on every page
• SEO: schema markup (LocalBusiness or relevant type)
• SEO: sitemap.xml created and submitted to Google Search Console
• Google Search Console: verified and site submitted for indexing
• Google Analytics 4: full install + conversion goals configured
• GA4 linked to Google Search Console
• Any custom features quoted separately (booking = Calendly embed or custom, e-commerce = Stripe products, CMS = custom admin panel)
• 2 rounds of revisions included
• Full QA review: mobile, tablet, desktop, all browsers
• Handoff: all logins, documentation, PDF handoff sheet

MAINTENANCE OPTIONS AFTER LAUNCH:
• Hourly rate: $75/hr for one-off updates
• Monthly retainer: $150/mo (up to 2 hrs updates + hosting management)
• Full maintenance plan: $250/mo (unlimited minor updates + priority support)

TIME: 20-60+ hours depending on scope
COST TO MEL: Railway $5/mo + domain ~$15/yr
PROFIT: Depends on scope — target $50-65/hr effective rate`
);

// Done-For-You Template is internal reference only — hide from public services page
try { db.prepare("UPDATE service_packages SET is_active=0 WHERE slug='done_for_you_template'").run(); } catch(e) {}

// ── ORDER PHOTOS (uploaded photos linked to orders) ───────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS order_photos (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id   INTEGER NOT NULL REFERENCES orders(id),
    filename   TEXT NOT NULL,
    original   TEXT,
    path       TEXT NOT NULL,
    deleted    INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// ── CLIENT PROJECTS (Mel's internal project tracker) ─────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS client_projects (
    id                    INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name         TEXT NOT NULL,
    customer_email        TEXT NOT NULL,
    package_type          TEXT NOT NULL DEFAULT 'template_launch',
    status                TEXT NOT NULL DEFAULT 'active',
    domain_name           TEXT,
    domain_renewal_date   TEXT,
    railway_project_name  TEXT,
    railway_project_url   TEXT,
    railway_monthly_cost  REAL DEFAULT 5.00,
    github_repo_url       TEXT,
    cloudflare_zone       TEXT,
    professional_email    TEXT,
    resend_domain         TEXT,
    stripe_status         TEXT DEFAULT 'not_started',
    package_price         REAL,
    monthly_fee           REAL DEFAULT 15.00,
    checklist_done        TEXT DEFAULT '[]',
    notes                 TEXT,
    handed_off_at         TEXT,
    created_at            DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// ── BLOG SUBSCRIBERS ─────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS subscribers (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    email      TEXT NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// ── SETTINGS (key/value store for things like tax_rate) ───────────────────────
db.exec(`CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
)`);
// Default tax rate
db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES ('tax_rate', '28')").run();

// ── CONTACT MESSAGES ─────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL,
    email      TEXT NOT NULL,
    subject    TEXT,
    message    TEXT NOT NULL,
    read       INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// ── Seed demo products if empty ───────────────────────────────────────────────
const count = db.prepare('SELECT COUNT(*) as n FROM products').get();
if (count.n === 0) {
  const insert = db.prepare(`
    INSERT INTO products (name, slug, category, description, price, preview_url, active, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insert.run('ServicePro Template', 'service-pro', 'Local Service Business',
    'Perfect for pressure washing, lawn care, HVAC, plumbing & more. Bold hero, services grid, gallery, reviews, and quote form.',
    35000, '/templates/service-pro/index.html', 1, 1);
  insert.run('TableReady Template', 'table-ready', 'Restaurant & Food',
    'Built for restaurants, food trucks, bakeries & caterers. Menu display, hours, location, photo gallery & reservation link.',
    35000, '/templates/table-ready/index.html', 1, 2);
  insert.run('KeyReady Template', 'key-ready', 'Real Estate Agent',
    'For realtors and property managers. Featured listings, agent bio, testimonials, and contact form.',
    35000, '/templates/key-ready/index.html', 1, 3);
  insert.run('ShopFront Template', 'shop-front', 'Retail & Storefront',
    'For boutiques, retail shops & local stores. Featured products, brand story, hours, location & reviews.',
    35000, '/templates/shop-front/index.html', 1, 4);
  insert.run('VoiceFirst Template', 'voice-first', 'Blogger & Creator',
    'For writers, podcasters & content creators. Clean blog layout, newsletter signup, about section & social links.',
    35000, '/templates/voice-first/index.html', 1, 5);
  insert.run('GatherHere Template', 'gather-here', 'Church & Ministry',
    'For churches, ministries & faith-based organizations. Service times, sermons, prayer requests & giving links.',
    35000, '/templates/gather-here/index.html', 1, 6);
  insert.run('PawPerfect Template', 'pet-shop', 'Pet Grooming & Boarding',
    'For pet groomers, boarders & daycares. Services grid, gallery, pricing tiers, reviews & online booking CTA.',
    35000, '/templates/pet-shop/index.html', 1, 7);
  insert.run('Glow Studio Template', 'beauty-studio', 'Hair Salon & Beauty',
    'For hair salons, lash studios & beauty pros. Services, stylist bio, gallery, pricing & book now CTA.',
    35000, '/templates/beauty-studio/index.html', 1, 8);
  insert.run('Lens & Light Template', 'lens-and-light', 'Photography & Videography',
    'For photographers & videographers. Portfolio grid, packages, about section, testimonials & contact form.',
    35000, '/templates/lens-and-light/index.html', 1, 9);
  insert.run('GreenCut Template', 'green-cut', 'Landscaping & Lawn Care',
    'For lawn care & landscaping businesses. Services, service area map, why-choose-us, reviews & free quote form.',
    35000, '/templates/green-cut/index.html', 1, 10);
  insert.run('WellnessPro Template', 'wellness-pro', 'Medical & Dental Practice',
    'For doctors, dentists & chiropractors. Accepting new patients hero, specialties, meet the doctor, insurance badges & booking.',
    35000, '/templates/wellness-pro/index.html', 1, 11);
  insert.run('FitLife Template', 'fit-life', 'Personal Trainer & Fitness Studio',
    'For personal trainers & fitness studios. Programs, transformations, trainer bio, pricing tiers & free consult CTA.',
    35000, '/templates/fit-life/index.html', 1, 12);
  insert.run('Sparkle Clean Template', 'sparkle-clean', 'House & Commercial Cleaning',
    'For cleaning services. Services grid, 3-step how-it-works, trust badges, reviews & book a clean form.',
    35000, '/templates/sparkle-clean/index.html', 1, 13);
  insert.run('Bright Minds Template', 'bright-minds', 'Tutoring & Learning Center',
    'For tutors, learning centers & daycares. Programs, age groups, meet the teachers, parent reviews & enroll CTA.',
    35000, '/templates/bright-minds/index.html', 1, 14);
  insert.run('Forever Events Template', 'forever-events', 'Wedding & Event Planning',
    'For wedding & event planners. Services, real weddings gallery, packages, planner bio, reviews & inquiry form.',
    35000, '/templates/forever-events/index.html', 1, 15);
  insert.run('AutoShine Template', 'auto-shine', 'Auto Detailing & Mechanic',
    'For auto detailers & mechanics. Services, before/after gallery, trust section, reviews & appointment booking.',
    35000, '/templates/auto-shine/index.html', 1, 16);
}

// Activate all templates if any are still inactive from old seed
db.prepare("UPDATE products SET active=1 WHERE active=0").run();

// Prices are managed via /admin/products — no force-override on deploy

// Backfill preview_url for existing records that don't have one
const previewUrls = [
  ['service-pro',    '/preview/service-pro/index.html'],
  ['table-ready',    '/preview/table-ready/index.html'],
  ['key-ready',      '/preview/key-ready/index.html'],
  ['shop-front',     '/preview/shop-front/index.html'],
  ['voice-first',    '/preview/voice-first/index.html'],
  ['gather-here',    '/preview/gather-here/index.html'],
  ['pet-shop',       '/preview/pet-shop/index.html'],
  ['beauty-studio',  '/preview/beauty-studio/index.html'],
  ['lens-and-light', '/preview/lens-and-light/index.html'],
  ['green-cut',      '/preview/green-cut/index.html'],
  ['wellness-pro',   '/preview/wellness-pro/index.html'],
  ['fit-life',       '/preview/fit-life/index.html'],
  ['sparkle-clean',  '/preview/sparkle-clean/index.html'],
  ['bright-minds',   '/preview/bright-minds/index.html'],
  ['forever-events', '/preview/forever-events/index.html'],
  ['auto-shine',     '/preview/auto-shine/index.html'],
];
// Always update preview_url to correct paths (fixes trailing slash issue)
const backfill = db.prepare("UPDATE products SET preview_url=? WHERE slug=?");
for (const [slug, url] of previewUrls) backfill.run(url, slug);

// Wire up thumbnail images
const thumbnails = [
  ['service-pro',    'service-pro.jpg'],
  ['table-ready',    'table-ready.jpg'],
  ['key-ready',      'key-ready.jpg'],
  ['shop-front',     'shop-front.jpg'],
  ['voice-first',    'voice-first.jpg'],
  ['gather-here',    'gather-here.jpg'],
  ['pet-shop',       'pet-shop.jpg'],
  ['beauty-studio',  'beauty-studio.jpg'],
  ['lens-and-light', 'lens-and-light.jpg'],
  ['green-cut',      'green-cut.jpg'],
  ['wellness-pro',   'wellness-pro.jpg'],
  ['fit-life',       'fit-life.jpg'],
  ['sparkle-clean',  'sparkle-clean.jpg'],
  ['bright-minds',   'bright-minds.jpg'],
  ['forever-events', 'forever-events.jpg'],
  ['auto-shine',     'auto-shine.jpg'],
  ['detail-pro',     'detail-pro.jpg'],
];
const setThumb = db.prepare("UPDATE products SET thumbnail=? WHERE slug=?");
for (const [slug, file] of thumbnails) setThumb.run(file, slug);

module.exports = db;
