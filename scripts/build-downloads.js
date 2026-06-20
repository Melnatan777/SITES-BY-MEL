// Generates zip downloads for all templates
// Runs automatically on server start if zips are missing
// Can also be triggered from /admin/generate-downloads

const path = require('path');
const fs = require('fs');
const archiver = require('archiver');
const { buildInstructions } = require('./build-instructions');

// Per-template bot scripts — only loaded if the file exists
const botScripts = {};
try { botScripts['fit-life'] = require('./bot-fitlife').getFitLifeBotScript(); } catch(e) {}

// Inject bot into an HTML string before </body> — skip if already present
function injectBot(html, botScript) {
  if (!botScript) return html;
  if (html.includes('mel-bot-bubble')) return html;
  return html.replace(/<\/body>/i, botScript + '\n</body>');
}

const TEMPLATES = [
  { slug: 'service-pro',    name: 'ServicePro Template',    niche: 'local service business',               primary: '#1a3d6b', accent: '#e05c1a' },
  { slug: 'table-ready',    name: 'TableReady Template',    niche: 'restaurant & food business',           primary: '#8B1A1A', accent: '#e8a020' },
  { slug: 'key-ready',      name: 'KeyReady Template',      niche: 'real estate agent',                    primary: '#1a4f8a', accent: '#c8880a' },
  { slug: 'shop-front',     name: 'ShopFront Template',     niche: 'retail boutique',                      primary: '#5a2d82', accent: '#8b5cb1' },
  { slug: 'voice-first',    name: 'VoiceFirst Template',    niche: 'blogger & content creator',            primary: '#1A1A2E', accent: '#6B4FA0' },
  { slug: 'gather-here',    name: 'GatherHere Template',    niche: 'church & ministry',                    primary: '#3d5a8a', accent: '#e8a020' },
  { slug: 'pet-shop',       name: 'PawPerfect Template',    niche: 'pet grooming & boarding',              primary: '#1a8a7a', accent: '#e8621a' },
  { slug: 'beauty-studio',  name: 'Glow Studio Template',   niche: 'hair salon & beauty studio',           primary: '#5c1a3a', accent: '#c94070' },
  { slug: 'lens-and-light', name: 'Lens & Light Template',  niche: 'photographer & videographer',          primary: '#2a2a2a', accent: '#d4af37' },
  { slug: 'green-cut',      name: 'GreenCut Template',      niche: 'landscaping & lawn care',              primary: '#1e5c1a', accent: '#c8a61e' },
  { slug: 'wellness-pro',   name: 'WellnessPro Template',   niche: 'medical & dental practice',            primary: '#2d7a6e', accent: '#c8a020' },
  { slug: 'fit-life',       name: 'FitLife Template',       niche: 'personal trainer & fitness studio',    primary: '#1a3d6b', accent: '#e8520a' },
  { slug: 'sparkle-clean',  name: 'Sparkle Clean Template', niche: 'house cleaning & commercial cleaning', primary: '#1a7ab5', accent: '#7ec832' },
  { slug: 'bright-minds',   name: 'Bright Minds Template',  niche: 'tutoring & learning center',           primary: '#1a5c8a', accent: '#f4a020' },
  { slug: 'forever-events', name: 'Forever Events Template',niche: 'wedding & event planning',             primary: '#6b2d82', accent: '#d4af37' },
  { slug: 'auto-shine',     name: 'AutoShine Template',     niche: 'auto detailing & mechanic',            primary: '#1a2a5c', accent: '#e8a020' },
  { slug: 'detail-pro',     name: 'DetailPro Template',     niche: 'auto detailing & mechanic',            primary: '#1a1a1a', accent: '#cc1a1a' },
];

const ROOT = path.join(__dirname, '..');
const DOWNLOADS_DIR = path.join(ROOT, 'downloads');
const TEMPLATES_DIR = path.join(ROOT, 'public', 'templates');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function buildZip(template, overrides = {}) {
  return new Promise((resolve, reject) => {
    ensureDir(DOWNLOADS_DIR);

    const outputPath = path.join(DOWNLOADS_DIR, `${template.slug}.zip`);
    const output = fs.createWriteStream(outputPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => resolve(outputPath));
    archive.on('error', reject);
    archive.pipe(output);

    // Add template files — inject bot into HTML files if one exists for this template
    const templateDir = path.join(TEMPLATES_DIR, template.slug);
    const botScript = botScripts[template.slug] || null;
    if (fs.existsSync(templateDir)) {
      const files = fs.readdirSync(templateDir, { withFileTypes: true });
      for (const file of files) {
        const filePath = path.join(templateDir, file.name);
        if (file.isDirectory()) {
          archive.directory(filePath, `${template.slug}/${file.name}`);
        } else if (botScript && file.name.endsWith('.html')) {
          const html = fs.readFileSync(filePath, 'utf8');
          archive.append(injectBot(html, botScript), { name: `${template.slug}/${file.name}` });
        } else {
          archive.file(filePath, { name: `${template.slug}/${file.name}` });
        }
      }
    }

    // Generate and add instructions HTML
    const instructions = buildInstructions(template.name, template.slug, template.niche, template.primary, template.accent, overrides);
    archive.append(instructions, { name: `${template.slug}/INSTRUCTIONS.html` });

    archive.finalize();
  });
}

async function buildAllDownloads(force = false, overrides = {}) {
  const results = [];
  for (const template of TEMPLATES) {
    const zipPath = path.join(DOWNLOADS_DIR, `${template.slug}.zip`);
    if (!force && fs.existsSync(zipPath)) {
      results.push({ slug: template.slug, path: zipPath, skipped: true });
      continue;
    }
    try {
      const outputPath = await buildZip(template, overrides);
      results.push({ slug: template.slug, path: outputPath, skipped: false });
      console.log(`[downloads] Built ${template.slug}.zip`);
    } catch (e) {
      console.error(`[downloads] Failed ${template.slug}:`, e.message);
      results.push({ slug: template.slug, error: e.message });
    }
  }
  return results;
}

module.exports = { buildAllDownloads, TEMPLATES };
