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

// Maps each template slug → photo field name → placeholder Unsplash URL used in that template's HTML.
// When a customer uploads a photo, we look up this map to find which URL to replace in the HTML.
// Only includes confident mappings. The same URL may appear across pages — we replace all occurrences.
const PHOTO_MAP = {
  'service-pro': {
    photoHero:    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600&q=80',
    photoTeam:    'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=800&q=80',
    photoBefore1: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&q=80',
    photoAfter1:  'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=800&q=80',
    photoBefore2: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80',
    photoAfter2:  'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800&q=80',
  },
  'table-ready': {
    photoHero:     'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1600&q=80',
    photoFood1:    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80',
    photoFood2:    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80',
    photoFood3:    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80',
    photoInterior: 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=800&q=80',
    photoChef:     'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=800&q=80',
  },
  'key-ready': {
    photoHeadshot:    'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=800&q=80',
    photoListing1:    'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80',
    photoListing2:    'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&q=80',
    photoListing3:    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80',
    photoNeighborhood:'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&q=80',
  },
  'shop-front': {
    photoHero:     'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&q=80',
    photoInterior: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&q=80',
    photoProduct1: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&q=80',
    photoProduct2: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&q=80',
    photoProduct3: 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=800&q=80',
    photoOwner:    'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80',
  },
  'voice-first': {
    photoHero:     'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=1600&q=80',
    photoHeadshot: 'https://images.unsplash.com/photo-1589903308904-1010c2294adc?w=800&q=80',
    photoStudio:   'https://images.unsplash.com/photo-1485579149621-3123dd979885?w=800&q=80',
    photoSpeaking: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&q=80',
  },
  'gather-here': {
    photoHero:   'https://images.unsplash.com/photo-1519677584237-752f8853252e?w=1600&q=80',
    photoTeam:   'https://images.unsplash.com/photo-1438032005730-c779502df39b?w=800&q=80',
    photoBar:    'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800&q=80',
    photoCrowd:  'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
    photoFood:   'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80',
  },
  'pet-shop': {
    photoHero:       'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=1600&q=80',
    photoGrooming:   'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=800&q=80',
    photoHappyPet1:  'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=800&q=80',
    photoHappyPet2:  'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=800&q=80',
    photoStore:      'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800&q=80',
    photoTeam:       'https://images.unsplash.com/photo-1561037404-61cd46aa615b?w=800&q=80',
  },
  'beauty-studio': {
    photoHero:     'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1600&q=80',
    photoHeadshot: 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=800&q=80',
    photoWork1:    'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&q=80',
    photoWork2:    'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=800&q=80',
    photoWork3:    'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&q=80',
    photoInterior: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=800&q=80',
  },
  'lens-and-light': {
    photoHero:       'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=1600&q=80',
    photoPortfolio1: 'https://images.unsplash.com/photo-1554080353-a576cf803bda?w=800&q=80',
    photoPortfolio2: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=800&q=80',
    photoPortfolio3: 'https://images.unsplash.com/photo-1542038374-668d2e0e2ded?w=800&q=80',
    photoPortfolio4: 'https://images.unsplash.com/photo-1471341971476-ae15ff5dd4ea?w=800&q=80',
    photoPortfolio5: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80',
    photoPortfolio6: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',
    photoHeadshot:   'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&q=80',
  },
  'green-cut': {
    photoHero:      'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=1600&q=80',
    photoBefore:    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
    photoAfter:     'https://images.unsplash.com/photo-1599598425947-5202edd56fdc?w=800&q=80',
    photoTeam:      'https://images.unsplash.com/photo-1592417817098-8fd3d9eb14a5?w=800&q=80',
    photoEquipment: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800&q=80',
  },
  'wellness-pro': {
    photoHero:      'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1600&q=80',
    photoHeadshot:  'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=800&q=80',
    photoInterior:  'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=800&q=80',
    photoTeam:      'https://images.unsplash.com/photo-1588776814546-1ffbb2b6f1f0?w=800&q=80',
  },
  'fit-life': {
    photoHero:      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1600&q=80',
    photoClass:     'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&q=80&fit=crop',
    photoNutrition: 'https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=600&q=80&fit=crop',
    photoAboutMain: 'https://images.unsplash.com/photo-1567013127542-490d757e51fc?w=800&q=80&fit=crop&crop=top',
    photoBA1:       'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=600&q=80&fit=crop',
    photoBA2:       'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=600&q=80&fit=crop',
    photoBA3:       'https://images.unsplash.com/photo-1548690312-e3b507d8c110?w=600&q=80&fit=crop',
    photoGallery1:  'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=600&q=80&fit=crop',
    photoGallery2:  'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=600&q=80&fit=crop',
    photoGallery3:  'https://images.unsplash.com/photo-1581009137042-c552e485697a?w=600&q=80&fit=crop',
    photoGallery4:  'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80&fit=crop',
    photoHIIT:      'https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=900&q=80&fit=crop',
    photoStrength:  'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=600&q=80&fit=crop',
    photoTrainer1:  'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&q=80&fit=crop',
    photoTrainer2:  'https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=600&q=80&fit=crop',
    photoTrainer3:  'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=600&q=80&fit=crop',
  },
  'sparkle-clean': {
    photoHero:      'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1600&q=80',
    photoTeam:      'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=800&q=80',
    photoKitchen:   'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80',
    photoBathroom:  'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=800&q=80',
    photoSupplies:  'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=800&q=80',
  },
  'bright-minds': {
    photoHero:        'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1600&q=80',
    photoDirector:    'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800&q=80',
    photoTutorStudent:'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&q=80',
    photoStudySpace:  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80',
  },
  'forever-events': {
    photoHero:      'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=1600&q=80',
    photoCeremony:  'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80',
    photoReception: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&q=80',
    photoPortrait:  'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800&q=80',
    photoEvent2:    'https://images.unsplash.com/photo-1507504031003-b417219a0fde?w=800&q=80',
    photoFloral:    'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?w=800&q=80',
  },
  'auto-shine': {
    photoHero:      'https://images.unsplash.com/photo-1507136566006-cfc505b114fc?w=1600&q=80',
    photoInterior:  'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=80',
    photoBA1Before: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80',
    photoBA1After:  'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&q=80',
    photoTeam:      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80',
  },
  'detail-pro': {
    photoHero:      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1600&q=80',
    photoTeam:      'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&q=80',
    photoBABefore:  'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=800&q=80',
    photoBAAfter:   'https://images.unsplash.com/photo-1507136566006-cfc505b114fc?w=800&q=80',
    photoCeramic:   'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
    photoInterior:  'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=80',
  },
};

function buildPersonalizedZip(slug, templateName, niche, data, outputPath, photos = []) {
  return new Promise((resolve, reject) => {
    const templateDir = path.join(__dirname, '..', 'public', 'templates', slug);
    const indexPath = path.join(templateDir, 'index.html');

    if (!fs.existsSync(indexPath)) return reject(new Error('Template not found: ' + slug));

    const indexHtml = fs.readFileSync(indexPath, 'utf8');
    const primaryMatch = indexHtml.match(/--primary\s*:\s*(#[0-9a-fA-F]{3,6})/);
    const accentMatch  = indexHtml.match(/--accent\s*:\s*(#[0-9a-fA-F]{3,6})/);
    const instructions = buildInstructions(templateName, slug, niche, primaryMatch && primaryMatch[1], accentMatch && accentMatch[1]);

    // Build photo replacement map: { unsplashUrl -> 'images/fieldName.ext' }
    const urlReplacements = {};
    const photoEntries = []; // { fieldName, ext, diskPath }
    const slugPhotoMap = PHOTO_MAP[slug] || {};

    for (const photo of photos) {
      if (!photo.field_name || !photo.path) continue;
      if (!fs.existsSync(photo.path)) continue; // skip missing uploads

      const ext = path.extname(photo.original || photo.filename || '').toLowerCase() || '.jpg';
      const destName = `images/${photo.field_name}${ext}`;
      photoEntries.push({ fieldName: photo.field_name, ext, diskPath: photo.path, destName });

      const placeholderUrl = slugPhotoMap[photo.field_name];
      if (placeholderUrl) {
        // The same photo ID appears at multiple query-string sizes in the HTML.
        // Extract just the photo ID portion so we can replace all size variants.
        urlReplacements[placeholderUrl] = destName;
      }
    }

    function applyPhotoReplacements(html) {
      let out = html;
      for (const [unsplashUrl, destName] of Object.entries(urlReplacements)) {
        // Replace the exact URL as-is (covers all occurrences across the file)
        out = out.split(unsplashUrl).join(destName);
      }
      return out;
    }

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
          const personalized = personalizeHtml(slug, raw, data);
          archive.append(applyPhotoReplacements(personalized), { name: `${slug}/${entry.name}` });
        } else {
          archive.file(filePath, { name: `${slug}/${entry.name}` });
        }
      }
    }

    // Add customer photos to the ZIP under {slug}/images/
    for (const p of photoEntries) {
      archive.file(p.diskPath, { name: `${slug}/${p.destName}` });
    }

    // Add instructions
    archive.append(instructions, { name: `${slug}/INSTRUCTIONS.html` });

    archive.finalize();
  });
}

module.exports = { buildPersonalizedZip, PLACEHOLDERS };
