const Database = require('better-sqlite3');
const path = require('path');

const dbPath = process.env.DATABASE_PATH || './sbm.sqlite';
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
    19700, '/templates/service-pro/index.html', 1, 1);
  insert.run('TableReady Template', 'table-ready', 'Restaurant & Food',
    'Built for restaurants, food trucks, bakeries & caterers. Menu display, hours, location, photo gallery & reservation link.',
    19700, '/templates/table-ready/index.html', 1, 2);
  insert.run('KeyReady Template', 'key-ready', 'Real Estate Agent',
    'For realtors and property managers. Featured listings, agent bio, testimonials, and contact form.',
    19700, '/templates/key-ready/index.html', 1, 3);
  insert.run('ShopFront Template', 'shop-front', 'Retail & Storefront',
    'For boutiques, retail shops & local stores. Featured products, brand story, hours, location & reviews.',
    19700, '/templates/shop-front/index.html', 1, 4);
  insert.run('VoiceFirst Template', 'voice-first', 'Blogger & Creator',
    'For writers, podcasters & content creators. Clean blog layout, newsletter signup, about section & social links.',
    19700, '/templates/voice-first/index.html', 1, 5);
  insert.run('GatherHere Template', 'gather-here', 'Church & Ministry',
    'For churches, ministries & faith-based organizations. Service times, sermons, prayer requests & giving links.',
    19700, '/templates/gather-here/index.html', 1, 6);
  insert.run('PawPerfect Template', 'pet-shop', 'Pet Grooming & Boarding',
    'For pet groomers, boarders & daycares. Services grid, gallery, pricing tiers, reviews & online booking CTA.',
    19700, '/templates/pet-shop/index.html', 1, 7);
  insert.run('Glow Studio Template', 'beauty-studio', 'Hair Salon & Beauty',
    'For hair salons, lash studios & beauty pros. Services, stylist bio, gallery, pricing & book now CTA.',
    19700, '/templates/beauty-studio/index.html', 1, 8);
  insert.run('Lens & Light Template', 'lens-and-light', 'Photography & Videography',
    'For photographers & videographers. Portfolio grid, packages, about section, testimonials & contact form.',
    19700, '/templates/lens-and-light/index.html', 1, 9);
  insert.run('GreenCut Template', 'green-cut', 'Landscaping & Lawn Care',
    'For lawn care & landscaping businesses. Services, service area map, why-choose-us, reviews & free quote form.',
    19700, '/templates/green-cut/index.html', 1, 10);
  insert.run('WellnessPro Template', 'wellness-pro', 'Medical & Dental Practice',
    'For doctors, dentists & chiropractors. Accepting new patients hero, specialties, meet the doctor, insurance badges & booking.',
    19700, '/templates/wellness-pro/index.html', 1, 11);
  insert.run('FitLife Template', 'fit-life', 'Personal Trainer & Fitness Studio',
    'For personal trainers & fitness studios. Programs, transformations, trainer bio, pricing tiers & free consult CTA.',
    19700, '/templates/fit-life/index.html', 1, 12);
  insert.run('Sparkle Clean Template', 'sparkle-clean', 'House & Commercial Cleaning',
    'For cleaning services. Services grid, 3-step how-it-works, trust badges, reviews & book a clean form.',
    19700, '/templates/sparkle-clean/index.html', 1, 13);
  insert.run('Bright Minds Template', 'bright-minds', 'Tutoring & Learning Center',
    'For tutors, learning centers & daycares. Programs, age groups, meet the teachers, parent reviews & enroll CTA.',
    19700, '/templates/bright-minds/index.html', 1, 14);
  insert.run('Forever Events Template', 'forever-events', 'Wedding & Event Planning',
    'For wedding & event planners. Services, real weddings gallery, packages, planner bio, reviews & inquiry form.',
    19700, '/templates/forever-events/index.html', 1, 15);
  insert.run('AutoShine Template', 'auto-shine', 'Auto Detailing & Mechanic',
    'For auto detailers & mechanics. Services, before/after gallery, trust section, reviews & appointment booking.',
    19700, '/templates/auto-shine/index.html', 1, 16);
}

// Activate all templates if any are still inactive from old seed
db.prepare("UPDATE products SET active=1 WHERE active=0").run();

// Update template prices to $197
db.prepare("UPDATE products SET price=19700").run();

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
  ['table-ready',    'Tables.jpg'],
  ['key-ready',      'KeyReady.jpg'],
  ['shop-front',     'ShopReady.jpg'],
  ['voice-first',    'ThoughtfulCreator.jpg'],
  ['gather-here',    'Cornerstone.jpg'],
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
];
const setThumb = db.prepare("UPDATE products SET thumbnail=? WHERE slug=?");
for (const [slug, file] of thumbnails) setThumb.run(file, slug);

module.exports = db;
