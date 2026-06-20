// Personalizes a template HTML file by swapping placeholder content
// with the buyer's real business info, then zips it up for download.

const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const { buildInstructions } = require('./build-instructions');

// Placeholder values used in each template
const PLACEHOLDERS = {
  'service-pro': {
    businessName: 'ProClean Services',
    phone: '(555) 867-5309',
    email: 'info@procleanservices.com',
    address: '123 Main Street, Springfield, IL',
    tagline: 'Professional Pressure Washing & Exterior Cleaning',
    city: 'Springfield',
  },
  'table-ready': {
    businessName: 'La Mesa',
    phone: '(555) 234-5678',
    email: 'reservations@lamesa.com',
    address: '456 Oak Avenue, Chicago, IL 60601',
    tagline: 'Authentic Flavors, Warm Atmosphere',
    city: 'Chicago',
  },
  'key-ready': {
    businessName: 'Sarah Mitchell Realty',
    phone: '(555) 321-7890',
    email: 'sarah@sarahmitchellrealty.com',
    address: 'Austin, Texas',
    tagline: 'Your Key to the Perfect Home',
    city: 'Austin',
  },
  'shop-front': {
    businessName: 'Blush & Co.',
    phone: '(555) 456-7890',
    email: 'hello@blushandco.com',
    address: '789 Boutique Lane, Nashville, TN',
    tagline: 'Curated Fashion for Every Occasion',
    city: 'Nashville',
  },
  'voice-first': {
    businessName: 'The Thoughtful Creator',
    phone: '',
    email: 'hello@thoughtfulcreator.com',
    address: '',
    tagline: 'Ideas Worth Sharing',
    city: '',
  },
  'gather-here': {
    businessName: 'Cornerstone Fellowship Church',
    phone: '(555) 987-6543',
    email: 'info@cornerstonefellowship.org',
    address: '321 Faith Avenue, Memphis, TN 38101',
    tagline: 'A Place to Belong',
    city: 'Memphis',
  },
};

function replaceAll(str, find, replace) {
  if (!find || !replace) return str;
  return str.split(find).join(replace);
}

function personalizeHtml(slug, html, data) {
  const placeholders = PLACEHOLDERS[slug];
  if (!placeholders) return html;

  let out = html;

  if (data.businessName && data.businessName.trim()) {
    out = replaceAll(out, placeholders.businessName, data.businessName.trim());
  }
  if (data.phone && data.phone.trim()) {
    out = replaceAll(out, placeholders.phone, data.phone.trim());
  }
  if (data.email && data.email.trim()) {
    out = replaceAll(out, placeholders.email, data.email.trim());
  }
  if (data.address && data.address.trim()) {
    out = replaceAll(out, placeholders.address, data.address.trim());
  }
  if (data.tagline && data.tagline.trim()) {
    out = replaceAll(out, placeholders.tagline, data.tagline.trim());
  }
  if (data.city && data.city.trim() && placeholders.city) {
    out = replaceAll(out, placeholders.city, data.city.trim());
  }

  return out;
}

function buildPersonalizedZip(slug, templateName, niche, data, outputPath) {
  return new Promise((resolve, reject) => {
    const templateDir = path.join(__dirname, '..', 'public', 'templates', slug);
    const htmlPath = path.join(templateDir, 'index.html');

    if (!fs.existsSync(htmlPath)) return reject(new Error('Template not found: ' + slug));

    const rawHtml = fs.readFileSync(htmlPath, 'utf8');
    const personalizedHtml = personalizeHtml(slug, rawHtml, data);
    const primaryMatch = rawHtml.match(/--primary\s*:\s*(#[0-9a-fA-F]{3,6})/);
    const accentMatch  = rawHtml.match(/--accent\s*:\s*(#[0-9a-fA-F]{3,6})/);
    const instructions = buildInstructions(templateName, slug, niche, primaryMatch && primaryMatch[1], accentMatch && accentMatch[1]);

    const output = fs.createWriteStream(outputPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => resolve(outputPath));
    archive.on('error', reject);
    archive.pipe(output);

    // Add personalized index.html
    archive.append(personalizedHtml, { name: `${slug}/index.html` });

    // Add any other files in the template dir (images etc) except index.html
    if (fs.existsSync(templateDir)) {
      fs.readdirSync(templateDir).forEach(file => {
        if (file !== 'index.html') {
          archive.file(path.join(templateDir, file), { name: `${slug}/${file}` });
        }
      });
    }

    // Add instructions
    archive.append(instructions, { name: `${slug}/INSTRUCTIONS.html` });

    archive.finalize();
  });
}

module.exports = { buildPersonalizedZip, PLACEHOLDERS };
