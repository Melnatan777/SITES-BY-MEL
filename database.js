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
    INSERT INTO products (name, slug, category, description, price, active, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insert.run('ServicePro Template', 'service-pro', 'Local Service Business',
    'Perfect for pressure washing, lawn care, HVAC, plumbing & more. Bold hero, services grid, gallery, reviews, and quote form.',
    4700, 1, 1);
  insert.run('TableReady Template', 'table-ready', 'Restaurant & Food',
    'Built for restaurants, food trucks, bakeries & caterers. Menu display, hours, location, photo gallery & reservation link.',
    4700, 0, 2);
  insert.run('KeyReady Template', 'key-ready', 'Real Estate Agent',
    'For realtors and property managers. Featured listings, agent bio, testimonials, and contact form.',
    5700, 0, 3);
  insert.run('ShopFront Template', 'shop-front', 'Retail & Storefront',
    'For boutiques, retail shops & local stores. Featured products, brand story, hours, location & reviews.',
    4700, 0, 4);
  insert.run('VoiceFirst Template', 'voice-first', 'Blogger & Creator',
    'For writers, podcasters & content creators. Clean blog layout, newsletter signup, about section & social links.',
    3700, 0, 5);
  insert.run('GatherHere Template', 'gather-here', 'Church & Ministry',
    'For churches, ministries & faith-based organizations. Service times, sermons, prayer requests & giving links.',
    4700, 0, 6);
}

module.exports = db;
