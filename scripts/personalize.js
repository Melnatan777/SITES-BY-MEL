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
  'fit-life': {
    businessName: 'FitLife',
    phone: '(555) 123-4567',
    email: 'info@fitlifestudio.com',
    address: '789 Iron Street, Unit 4',
    tagline: 'Transform Your Body. Transform Your Life.',
    city: 'Portland',
    trainerName: 'Marcus',
  },
  'pet-shop': {
    businessName: 'Paw Paradise',
    phone: '(555) 789-0123',
    email: 'hello@pawparadise.com',
    address: '456 Maple Street',
    tagline: 'Where Every Pet Gets the Royal Treatment',
    city: 'Denver',
  },
  'beauty-studio': {
    businessName: 'Glow Studio',
    phone: '(555) 234-5678',
    email: 'hello@glowstudio.com',
    address: '123 Beauty Lane',
    tagline: 'Your Beauty, Our Passion',
    city: 'Seattle',
  },
  'lens-and-light': {
    businessName: 'Lens & Light Photography',
    phone: '(555) 345-6789',
    email: 'hello@lensandlight.com',
    address: '789 Studio Row',
    tagline: 'Capturing Life\'s Most Beautiful Moments',
    city: 'Austin',
  },
  'wellness-pro': {
    businessName: 'WellnessPro Medical',
    phone: '(555) 456-7890',
    email: 'info@wellnesspro.com',
    address: '321 Health Blvd',
    tagline: 'Your Health, Our Priority',
    city: 'Phoenix',
  },
  'green-cut': {
    businessName: 'GreenCut Landscaping',
    phone: '(555) 567-8901',
    email: 'info@greencut.com',
    address: '654 Garden Way',
    tagline: 'Beautiful Lawns, Happy Homes',
    city: 'Dallas',
  },
  'sparkle-clean': {
    businessName: 'Sparkle Clean Co.',
    phone: '(555) 678-9012',
    email: 'hello@sparkleclean.com',
    address: '987 Fresh Street',
    tagline: 'We Clean. You Relax.',
    city: 'Miami',
  },
  'bright-minds': {
    businessName: 'Bright Minds Tutoring',
    phone: '(555) 789-0123',
    email: 'hello@brightminds.com',
    address: '123 Learning Lane',
    tagline: 'Unlocking Every Child\'s Potential',
    city: 'Boston',
  },
  'forever-events': {
    businessName: 'Forever Events Co.',
    phone: '(555) 890-1234',
    email: 'hello@foreverevents.com',
    address: '456 Celebration Drive',
    tagline: 'Your Perfect Day, Perfectly Planned',
    city: 'New York',
  },
  'auto-shine': {
    businessName: 'AutoShine Detailing',
    phone: '(555) 901-2345',
    email: 'info@autoshine.com',
    address: '789 Motor Row',
    tagline: 'We Make Your Car Shine',
    city: 'Las Vegas',
  },
  'detail-pro': {
    businessName: 'DetailPro Auto',
    phone: '(555) 012-3456',
    email: 'info@detailpro.com',
    address: '321 Auto Court',
    tagline: 'Professional Auto Detailing Done Right',
    city: 'Chicago',
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
    const indexPath = path.join(templateDir, 'index.html');

    if (!fs.existsSync(indexPath)) return reject(new Error('Template not found: ' + slug));

    const indexHtml = fs.readFileSync(indexPath, 'utf8');
    const primaryMatch = indexHtml.match(/--primary\s*:\s*(#[0-9a-fA-F]{3,6})/);
    const accentMatch  = indexHtml.match(/--accent\s*:\s*(#[0-9a-fA-F]{3,6})/);
    const instructions = buildInstructions(templateName, slug, niche, primaryMatch && primaryMatch[1], accentMatch && accentMatch[1]);

    const output = fs.createWriteStream(outputPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => resolve(outputPath));
    archive.on('error', reject);
    archive.pipe(output);

    // Personalize ALL HTML files and add everything else as-is
    if (fs.existsSync(templateDir)) {
      const entries = fs.readdirSync(templateDir, { withFileTypes: true });
      for (const entry of entries) {
        const filePath = path.join(templateDir, entry.name);
        if (entry.isDirectory()) {
          archive.directory(filePath, `${slug}/${entry.name}`);
        } else if (entry.name.endsWith('.html')) {
          const raw = fs.readFileSync(filePath, 'utf8');
          archive.append(personalizeHtml(slug, raw, data), { name: `${slug}/${entry.name}` });
        } else {
          archive.file(filePath, { name: `${slug}/${entry.name}` });
        }
      }
    }

    // Add instructions
    archive.append(instructions, { name: `${slug}/INSTRUCTIONS.html` });

    archive.finalize();
  });
}

module.exports = { buildPersonalizedZip, PLACEHOLDERS };
