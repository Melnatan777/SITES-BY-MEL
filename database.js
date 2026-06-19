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
    created_at          DATETIME DEFAULT CURRENT_TIMESTAMP
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
}

// Activate all templates if any are still inactive from old seed
db.prepare("UPDATE products SET active=1 WHERE active=0").run();

// Update template prices to $197
db.prepare("UPDATE products SET price=19700").run();

// Backfill preview_url for existing records that don't have one
const previewUrls = [
  ['service-pro', '/templates/service-pro/index.html'],
  ['table-ready', '/templates/table-ready/index.html'],
  ['key-ready',   '/templates/key-ready/index.html'],
  ['shop-front',  '/templates/shop-front/index.html'],
  ['voice-first', '/templates/voice-first/index.html'],
  ['gather-here', '/templates/gather-here/index.html'],
];
// Always update preview_url to correct paths (fixes trailing slash issue)
const backfill = db.prepare("UPDATE products SET preview_url=? WHERE slug=?");
for (const [slug, url] of previewUrls) backfill.run(url, slug);

module.exports = db;
