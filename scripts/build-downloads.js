// Generates zip downloads for all templates
// Runs automatically on server start if zips are missing
// Can also be triggered from /admin/generate-downloads

const path = require('path');
const fs = require('fs');
const archiver = require('archiver');
const { buildInstructions } = require('./build-instructions');

const TEMPLATES = [
  { slug: 'service-pro', name: 'ServicePro Template', niche: 'local service business' },
  { slug: 'table-ready', name: 'TableReady Template', niche: 'restaurant & food business' },
  { slug: 'key-ready',   name: 'KeyReady Template',   niche: 'real estate agent' },
  { slug: 'shop-front',  name: 'ShopFront Template',  niche: 'retail boutique' },
  { slug: 'voice-first', name: 'VoiceFirst Template', niche: 'blogger & content creator' },
  { slug: 'gather-here', name: 'GatherHere Template', niche: 'church & ministry' },
];

const ROOT = path.join(__dirname, '..');
const DOWNLOADS_DIR = path.join(ROOT, 'downloads');
const TEMPLATES_DIR = path.join(ROOT, 'public', 'templates');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function buildZip(template) {
  return new Promise((resolve, reject) => {
    ensureDir(DOWNLOADS_DIR);

    const outputPath = path.join(DOWNLOADS_DIR, `${template.slug}.zip`);
    const output = fs.createWriteStream(outputPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => resolve(outputPath));
    archive.on('error', reject);
    archive.pipe(output);

    // Add the template HTML file
    const templateDir = path.join(TEMPLATES_DIR, template.slug);
    if (fs.existsSync(templateDir)) {
      archive.directory(templateDir, template.slug);
    }

    // Generate and add instructions HTML
    const instructions = buildInstructions(template.name, template.slug, template.niche);
    archive.append(instructions, { name: `${template.slug}/INSTRUCTIONS.html` });

    archive.finalize();
  });
}

async function buildAllDownloads(force = false) {
  const results = [];
  for (const template of TEMPLATES) {
    const zipPath = path.join(DOWNLOADS_DIR, `${template.slug}.zip`);
    if (!force && fs.existsSync(zipPath)) {
      results.push({ slug: template.slug, path: zipPath, skipped: true });
      continue;
    }
    try {
      const outputPath = await buildZip(template);
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
