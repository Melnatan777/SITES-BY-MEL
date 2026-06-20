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

function r(html, find, replace) {
  if (!replace || !replace.toString().trim()) return html;
  return replaceAll(html, find, replace.toString().trim());
}

function personalizeHtml(slug, html, data) {
  if (slug === 'fit-life') return personalizeFitLife(html, data);

  const placeholders = PLACEHOLDERS[slug];
  if (!placeholders) return html;

  let out = html;
  if (data.businessName) out = replaceAll(out, placeholders.businessName, data.businessName.trim());
  if (data.phone)        out = replaceAll(out, placeholders.phone, data.phone.trim());
  if (data.email)        out = replaceAll(out, placeholders.email, data.email.trim());
  if (data.address)      out = replaceAll(out, placeholders.address, data.address.trim());
  if (data.tagline)      out = replaceAll(out, placeholders.tagline, data.tagline.trim());
  if (data.city && placeholders.city) out = replaceAll(out, placeholders.city, data.city.trim());
  return out;
}

function personalizeFitLife(html, data) {
  let out = html;
  const p = PLACEHOLDERS['fit-life'];

  // ── Business name & trainer name ──
  out = r(out, p.businessName, data.businessName);
  out = r(out, 'Marcus J. Williams', data.trainerName ? data.trainerName + ' (your name)' : '');
  out = r(out, 'Marcus J. Williams', data.trainerName || '');
  out = r(out, p.trainerName, data.trainerName);

  // ── Tagline & hero badge ──
  out = r(out, p.tagline, data.tagline);
  out = r(out, "Portland's #1 Rated Personal Trainer", data.heroBadge || (data.city ? `${data.city}'s #1 Rated Personal Trainer` : ''));

  // ── Contact info ──
  out = r(out, p.phone, data.phone);
  // phone without formatting for tel: links
  if (data.phone) {
    const bare = data.phone.replace(/\D/g, '');
    out = replaceAll(out, '5551234567', bare);
  }
  out = r(out, p.email, data.email);

  // ── Address ──
  out = r(out, p.address, data.address);
  out = r(out, 'Portland, OR 97209', data.city ? `${data.city}${data.cityZip ? ', ' + data.cityZip : ''}` : '');
  out = r(out, p.city, data.city);

  // ── Instagram ──
  out = r(out, '@FitLifePDX', data.instagram || '');

  // ── Hours ──
  out = r(out, 'Mon–Sat: 5:30am–8pm', data.hoursMF ? `Mon–Fri: ${data.hoursMF}` : '');
  out = r(out, '5:30am – 8pm', data.hoursMF || '');
  out = r(out, '7am – 2pm', data.hoursSat || '');
  out = r(out, '7am – 12pm', data.hoursSun || '');
  out = r(out, 'Monday – Friday</strong><span>5:30am – 8pm', `Monday – Friday</strong><span>${data.hoursMF || '5:30am – 8pm'}`);
  out = r(out, 'Saturday</strong><span>7am – 2pm', `Saturday</strong><span>${data.hoursSat || '7am – 2pm'}`);
  out = r(out, 'Sunday</strong><span>7am – 12pm', `Sunday</strong><span>${data.hoursSun || '7am – 12pm'}`);

  // ── Bio / story ──
  if (data.bio) {
    // Replace the full Marcus bio block with customer's bio
    out = replaceAll(out,
      'Marcus grew up in Portland as a three-sport athlete — football, wrestling, and track. After a knee injury ended his college football career, he found himself facing the same challenge many of his future clients would: how do you stay fit, stay motivated, and build a body that lasts when the structure is gone?',
      data.bio
    );
    // Remove the second and third bio paragraphs (they follow the first)
    out = replaceAll(out,
      `The answer became FitLife. Over 8 years and 500+ clients, Marcus has developed a no-gimmick, science-based coaching methodology that consistently delivers real, lasting transformation — not just for athletes, but for busy parents, desk workers, retirees, and complete beginners.`,
      ''
    );
    out = replaceAll(out,
      `His core belief: the best program is the one you'll actually stick to. Marcus meets every client exactly where they are and builds intelligently from there — no judgment, no shortcuts, no wasted sessions.`,
      ''
    );
  }

  // ── Certifications ──
  if (data.certs) {
    out = r(out, 'NASM-CPT | ACE-GFI | Precision Nutrition Level 2', data.certs);
    out = r(out, 'NASM Certified Personal Trainer (CPT)', data.certs.split('|')[0] ? data.certs.split('|')[0].trim() : '');
    out = r(out, 'ACE Group Fitness Instructor (GFI)', data.certs.split('|')[1] ? data.certs.split('|')[1].trim() : '');
    out = r(out, 'Precision Nutrition Level 2 Coach', data.certs.split('|')[2] ? data.certs.split('|')[2].trim() : '');
  }

  // ── Stats ──
  out = r(out, '500+', data.clientCount || '');
  out = r(out, '8+', data.yearsExp || '');

  // ── Testimonial 1 (Jennifer M.) ──
  if (data.test1Name) {
    out = replaceAll(out, 'Jennifer M., 41', data.test1Name);
    out = replaceAll(out, 'Jennifer M.', data.test1Name.split(',')[0]);
    out = replaceAll(out, 'Lost 42 lbs — Personal Training + Nutrition', data.test1Result || '');
    out = replaceAll(out, 'Lost 42 lbs', data.test1Result || '');
  }
  if (data.test1Quote) {
    out = replaceAll(out,
      'I hired Marcus after trying to get fit on my own for 3 years with zero results. Six months in, I\'m down 42 pounds, I\'m stronger than I\'ve ever been, and I actually understand why I\'m doing every single exercise. Worth every penny.',
      data.test1Quote
    );
  }

  // ── Testimonial 2 (Todd K.) ──
  if (data.test2Name) {
    out = replaceAll(out, 'Todd K., 48', data.test2Name);
    out = replaceAll(out, 'Todd K.', data.test2Name.split(',')[0]);
    out = replaceAll(out, '275 lb deadlift PR', data.test2Result || '');
    out = replaceAll(out, '1-on-1 Personal Training Client', data.test2Result || '');
  }
  if (data.test2Quote) {
    out = replaceAll(out,
      'I\'ve worked with 4 trainers over the years. FitLife is the first place where my programming actually made sense. I hit a 275 lb deadlift at 48 years old. The detail in the coaching is elite.',
      data.test2Quote
    );
  }

  // ── Testimonial 3 (Sandra & Mike T.) ──
  if (data.test3Name) {
    out = replaceAll(out, 'Sandra &amp; Mike T.', data.test3Name);
    out = replaceAll(out, 'Sandra & Mike T.', data.test3Name);
    out = replaceAll(out, '68 lbs together — Couples Training · 8 months', data.test3Result || '');
    out = replaceAll(out, '68 lbs together', data.test3Result || '');
  }
  if (data.test3Quote) {
    out = replaceAll(out,
      'Doing this as a couple made all the difference. FitLife gave us a shared goal and the accountability to actually reach it.',
      data.test3Quote
    );
  }

  // ── Services ──
  if (data.svc1Name) out = replaceAll(out, '1-on-1 Personal Training', data.svc1Name);
  if (data.svc1Price) out = replaceAll(out, '$295 / 4 sessions', data.svc1Price);
  if (data.svc2Name) out = replaceAll(out, 'Group Classes', data.svc2Name);
  if (data.svc2Price) out = replaceAll(out, '$99 / month', data.svc2Price);
  if (data.svc3Name) out = replaceAll(out, 'Online Coaching', data.svc3Name);
  if (data.svc3Price) out = replaceAll(out, '$149 / month', data.svc3Price);

  // ── Formspree & Calendly ──
  if (data.formspreeId) out = replaceAll(out, 'YOUR_FORM_ID', data.formspreeId);
  if (data.calendlyLink) out = replaceAll(out, 'YOUR_CALENDLY_LINK', data.calendlyLink);

  // ── Parking note (references Iron Street) ──
  out = replaceAll(out,
    'Free street parking on Iron Street and nearby blocks. We\'re ground floor, Unit 4 — look for the FitLife sign on the north side of the building.',
    data.address ? `We are located at ${data.address}. Street parking is available nearby.` : ''
  );

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
