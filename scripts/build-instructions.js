// Generates INSTRUCTIONS.html for each template zip
// Called by build-downloads.js

function buildInstructions(templateName, templateSlug, niche, primaryColor, accentColor, overrides = {}) {
  const primary = primaryColor || '#3d5a8a';
  const accent  = accentColor  || '#e8a020';
  const o = overrides;
  const tipUnzip    = o.tip_unzip    || 'You\'re looking at your real website. Every page, every button, every link — exactly as your visitors will see it once it\'s live.';
  const tipSave     = o.tip_save     || '<strong>Nothing gets lost.</strong> Every time you press Ctrl+S, your file is saved in your folder. When you\'re ready to go live, you just upload that same folder — exactly as it is on your computer.';
  const tipPhotos   = o.tip_photos   || '<strong>Photo tips:</strong> Use JPG or PNG files. For banner/hero images, use a wide landscape photo (at least 1200px wide). Keep file sizes under 500KB for fast loading — you can compress photos free at <a href="https://squoosh.app" target="_blank">squoosh.app</a>.';
  const tipFormspree= o.tip_formspree|| '';
  const tipNetlify  = o.tip_netlify  || '🎉 You have a live website. People can visit it, contact you, and book appointments. That\'s real. You did that!';
  const tipClosing  = o.tip_closing  || 'Thank you so much for your purchase. I built every pixel of this template myself and I genuinely hope it helps your business grow. Now go make it yours — the world is your oyster! 🌍';
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>${templateName} — Setup Instructions | Sites by Mel</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f5f4f2;color:#1a1a1a;line-height:1.6}
  .wrap{max-width:760px;margin:0 auto;padding:40px 24px}
  .header{background:#1B2F4E;color:#fff;padding:32px 40px;border-radius:12px;margin-bottom:32px}
  .header h1{font-size:1.6rem;margin-bottom:6px}
  .header p{opacity:.7;font-size:.95rem}
  .badge{display:inline-block;background:#C9922B;color:#fff;font-size:.75rem;font-weight:700;padding:4px 12px;border-radius:100px;margin-bottom:12px;letter-spacing:.05em;text-transform:uppercase}
  h2{font-size:1.1rem;font-weight:700;margin-bottom:12px;color:#1B2F4E;padding-top:4px}
  .card{background:#fff;border-radius:10px;padding:28px 32px;margin-bottom:20px;border:1px solid #e5e0d8}
  .step{display:flex;gap:16px;margin-bottom:16px;align-items:flex-start}
  .step-num{width:30px;height:30px;border-radius:50%;background:#1B2F4E;color:#fff;font-size:.82rem;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px}
  .step-body strong{display:block;font-size:.92rem;margin-bottom:2px}
  .step-body span{font-size:.84rem;color:#555;line-height:1.5}
  code{background:#f0f0f0;padding:2px 7px;border-radius:4px;font-size:.82rem;font-family:monospace}
  .tip{background:#fdf6e3;border-left:3px solid #C9922B;padding:12px 16px;border-radius:0 6px 6px 0;font-size:.85rem;color:#7d5a00;margin:16px 0}
  .fun{background:#eef6ff;border-left:3px solid #1B2F4E;padding:12px 16px;border-radius:0 6px 6px 0;font-size:.85rem;color:#1B2F4E;margin:16px 0}
  .file-list{list-style:none;padding:0}
  .file-list li{padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:.88rem;display:flex;gap:12px;align-items:flex-start}
  .file-list li:last-child{border-bottom:none}
  .file-tag{background:#e8f0fe;color:#1a56a8;font-size:.72rem;font-weight:700;padding:2px 8px;border-radius:4px;white-space:nowrap;margin-top:2px}
  .color-row{display:flex;gap:10px;flex-wrap:wrap;margin:12px 0}
  .color-chip{border-radius:8px;padding:10px 14px;font-size:.78rem;font-weight:700;color:#fff;text-shadow:0 1px 2px rgba(0,0,0,0.3)}
  .contact-box{background:#1B2F4E;color:#fff;padding:24px 32px;border-radius:10px;margin-top:24px}
  .contact-box h2{color:#C9922B;margin-bottom:8px}
  .contact-box p{font-size:.88rem;opacity:.85;margin-bottom:6px}
  a{color:#C9922B}
  .oyster{font-size:1.5rem;margin-bottom:8px}
</style>
</head>
<body>
<div class="wrap">
  <div class="header">
    <div class="badge">Sites by Mel</div>
    <h1>${templateName}</h1>
    <p>Your complete ${niche} website template — ready to make it yours.</p>
  </div>

  <!-- WHAT'S IN THE ZIP -->
  <div class="card">
    <h2>What's in this zip</h2>
    <ul class="file-list">
      <li><span class="file-tag">HOME</span><div><strong>index.html</strong> — Your home page. Open this first to see your site.</div></li>
      <li><span class="file-tag">PAGE</span><div><strong>services.html</strong> — Your full services and pricing page.</div></li>
      <li><span class="file-tag">PAGE</span><div><strong>about.html</strong> — About you, your team, and your story.</div></li>
      <li><span class="file-tag">PAGE</span><div><strong>contact.html</strong> — Contact form, hours, phone, and online booking.</div></li>
      <li><span class="file-tag">PAGE</span><div><strong>gallery.html</strong> — Photo gallery / before-and-after showcase.</div></li>
      <li><span class="file-tag">GUIDE</span><div><strong>INSTRUCTIONS.html</strong> — This file. Keep it handy!</div></li>
    </ul>
    <div class="tip"><strong>All 5 pages are already linked together.</strong> The navigation menu connects every page — you don't need to wire anything up yourself.</div>
  </div>

  <!-- STEP 1: PREVIEW -->
  <div class="card">
    <h2>Step 1 — Save the folder somewhere on your computer</h2>
    <div class="step">
      <div class="step-num">1</div>
      <div class="step-body"><strong>Unzip the folder</strong><span>Right-click the zip file → "Extract All" (Windows) or double-click (Mac). A folder will appear with all your website files inside.</span></div>
    </div>
    <div class="step">
      <div class="step-num">2</div>
      <div class="step-body"><strong>Move the folder somewhere easy to find</strong><span>Drag it to your Desktop or your Documents folder — wherever makes sense to you. Name it something like "My Website." <strong>Keep all the files inside it together — don't move them out individually.</strong></span></div>
    </div>
    <div class="step">
      <div class="step-num">3</div>
      <div class="step-body"><strong>Preview it right now</strong><span>Open the folder and double-click <code>index.html</code>. It opens in your browser. Click around — all 5 pages work immediately, right on your computer. No internet needed yet!</span></div>
    </div>
    <div class="tip">${tipUnzip}</div>
  </div>

  <!-- STEP 2: MAKE IT YOURS -->
  <div class="card">
    <div class="oyster">🌍</div>
    <h2>Step 2 — The world is your oyster. Make it yours!</h2>
    <p style="font-size:.88rem;color:#555;margin-bottom:16px;">This is the fun part. Every word, price, and photo is yours to change. You don't need to know how to code — just open each page file, find the text you want to change, type something new, and save. Here's exactly how:</p>
    <div class="fun"><strong>Best tool (free):</strong> Download <a href="https://code.visualstudio.com" target="_blank">VS Code</a>. It's free, highlights your code in color so it's easy to read, and is what most web designers use. Once installed, you'll use it to open and edit each page.</div>

    <div class="step">
      <div class="step-num">1</div>
      <div class="step-body"><strong>Open a page file in VS Code</strong><span>In VS Code, go to <strong>File → Open File</strong>, then navigate to your website folder and open one file — for example <code>about.html</code> to edit your About page, or <code>index.html</code> for your Home page. Edit one page at a time.</span></div>
    </div>
    <div class="step">
      <div class="step-num">2</div>
      <div class="step-body"><strong>Find the text you want to change and type your own</strong><span>Press <code>Ctrl+F</code> (Windows) or <code>Cmd+F</code> (Mac) to search for words on the page. Find a placeholder like "DetailPro" or "Over a decade of passion..." and just click on it and type your own words instead.</span></div>
    </div>
    <div class="step">
      <div class="step-num">3</div>
      <div class="step-body"><strong>Save — it saves right back to the same file</strong><span>Press <code>Ctrl+S</code> (Windows) or <code>Cmd+S</code> (Mac). VS Code saves your changes directly back to the file in your folder — no "Save As," no moving files. Then press <code>F5</code> in your browser to refresh and see your changes.</span></div>
    </div>
    <div class="step">
      <div class="step-num">4</div>
      <div class="step-body"><strong>Repeat for each page</strong><span>Open <code>services.html</code> to edit your services and pricing, <code>about.html</code> for your story, <code>contact.html</code> for your contact info. Each file is its own page — edit, save, done.</span></div>
    </div>
    <div class="step">
      <div class="step-num">5</div>
      <div class="step-body"><strong>Replace the business name across all pages at once (shortcut!)</strong><span>In VS Code, press <code>Ctrl+Shift+H</code> (Windows) or <code>Cmd+Shift+H</code> (Mac) to open Find &amp; Replace across ALL files. Type the demo business name in the top box, your name in the bottom — hit Replace All. Every page updated in one click.</span></div>
    </div>
    <div class="tip">${tipSave}</div>
  </div>

  <!-- STEP 2B: PHOTOS -->
  <div class="card">
    <div class="oyster">📸</div>
    <h2>Replacing Photos — Easier Than It Sounds</h2>
    <p style="font-size:.88rem;color:#555;margin-bottom:16px;">Your template already has placeholder images. Here's how to swap them for your own photos:</p>
    <div class="step">
      <div class="step-num">1</div>
      <div class="step-body"><strong>Add your photos to the images folder</strong><span>Inside your website folder there is an <code>images</code> folder. Copy your own photos into that folder. Use simple names with no spaces — like <code>my-team.jpg</code> or <code>storefront.jpg</code>.</span></div>
    </div>
    <div class="step">
      <div class="step-num">2</div>
      <div class="step-body"><strong>Find the image in the HTML file</strong><span>In VS Code, search (<code>Ctrl+F</code>) for <code>img src</code> to find image tags. They look like this: <code>&lt;img src="images/hero.jpg"&gt;</code></span></div>
    </div>
    <div class="step">
      <div class="step-num">3</div>
      <div class="step-body"><strong>Replace the filename with your photo's name</strong><span>Change <code>images/hero.jpg</code> to <code>images/your-photo-name.jpg</code> — using the exact filename you saved in the images folder. Save the file and refresh your browser to see your photo appear.</span></div>
    </div>
    <div class="tip">${tipPhotos}</div>
    <div class="fun">💡 <strong>Not a photographer?</strong> Free high-quality photos at <a href="https://unsplash.com" target="_blank">unsplash.com</a> and <a href="https://www.pexels.com" target="_blank">pexels.com</a> — free to use on your website, no credit required.</div>
  </div>

  <!-- COLORS -->
  <div class="card">
    <div class="oyster">🎨</div>
    <h2>Change Your Colors — It's Easier Than You Think!</h2>
    <p style="font-size:.88rem;color:#555;margin-bottom:14px;">Your entire color scheme lives in ONE place at the top of each HTML file. Change it there and every button, heading, and banner on that page updates automatically.</p>
    <p style="font-size:.88rem;color:#555;margin-bottom:10px;">In VS Code, open <code>index.html</code> and look near the very top for something like this:</p>
    <div style="background:#1a1a2e;color:#e8e8e8;padding:16px 20px;border-radius:8px;font-family:monospace;font-size:.82rem;line-height:1.8;margin-bottom:14px;">
      <span style="color:#888">/* YOUR BRAND COLORS — change these! */</span><br/>
      :root {<br/>
      &nbsp;&nbsp;<span style="color:#79b8ff">--primary</span>: <span style="color:#C9922B">${primary}</span>;  <span style="color:#888">/* main dark color */</span><br/>
      &nbsp;&nbsp;<span style="color:#79b8ff">--accent</span>: <span style="color:#C9922B">${accent}</span>;   <span style="color:#888">/* highlight color */</span><br/>
      &nbsp;&nbsp;<span style="color:#79b8ff">--text</span>: <span style="color:#C9922B">#1a1a2a</span>;    <span style="color:#888">/* body text */</span><br/>
      }
    </div>
    <p style="font-size:.84rem;color:#555;margin-bottom:12px;">Just replace those <strong>#hex codes</strong> with your brand colors. Don't know your hex codes? No problem:</p>
    <div class="step">
      <div class="step-num">1</div>
      <div class="step-body"><strong>Go to <a href="https://coolors.co" target="_blank">coolors.co</a></strong><span>Hit the spacebar to generate beautiful color palettes. When you find colors you love, click on one to copy the hex code (it looks like #FF5733).</span></div>
    </div>
    <div class="step">
      <div class="step-num">2</div>
      <div class="step-body"><strong>Or Google "color picker"</strong><span>Google has a built-in color picker right in the search results. Pick any color and it shows you the hex code instantly.</span></div>
    </div>
    <div class="step">
      <div class="step-num">3</div>
      <div class="step-body"><strong>Paste your hex code in the file</strong><span>Replace the existing hex code (like <code>${primary}</code>) with your new one. Save, refresh your browser — your whole site changes color instantly. Magic!</span></div>
    </div>
    <div class="fun">💡 <strong>Pro tip:</strong> Do this on index.html first to preview how your colors look. Once you're happy, use <code>Ctrl+Shift+H</code> to find and replace the old hex codes across all 5 pages at once.</div>
    <p style="font-size:.83rem;color:#555;margin-top:12px;">Here are some example color combos to get you inspired:</p>
    <div class="color-row">
      <div class="color-chip" style="background:${primary};">Your Primary ${primary}</div>
      <div class="color-chip" style="background:${accent};">Your Accent ${accent}</div>
      <div class="color-chip" style="background:#2d6a2d;">Forest #2d6a2d</div>
      <div class="color-chip" style="background:#8B1A1A;">Deep Red #8B1A1A</div>
      <div class="color-chip" style="background:#5c1a3a;">Plum #5c1a3a</div>
      <div class="color-chip" style="background:#0d3b5e;">Ocean #0d3b5e</div>
    </div>
  </div>

  <!-- FONTS -->
  <div class="card">
    <div class="oyster">✍️</div>
    <h2>Change Your Font — Also Super Easy!</h2>
    <p style="font-size:.88rem;color:#555;margin-bottom:14px;">Want a different vibe? Swap the font. Google Fonts has hundreds of beautiful free fonts.</p>
    <div class="step">
      <div class="step-num">1</div>
      <div class="step-body"><strong>Go to <a href="https://fonts.google.com" target="_blank">fonts.google.com</a></strong><span>Browse and click any font you like. Click "Get Font" then "Get embed code." Google gives you a <code>&lt;link&gt;</code> tag to copy.</span></div>
    </div>
    <div class="step">
      <div class="step-num">2</div>
      <div class="step-body"><strong>Paste the link in your HTML file</strong><span>Open index.html in VS Code. Near the top, inside the <code>&lt;head&gt;</code> section, paste the link tag Google gave you.</span></div>
    </div>
    <div class="step">
      <div class="step-num">3</div>
      <div class="step-body"><strong>Update the font name in the CSS</strong><span>Find <code>font-family:</code> in the CSS (near the top of the file). Replace the existing font name with your new one — exactly as Google shows it. Example: <code>font-family: 'Playfair Display', serif;</code></span></div>
    </div>
    <div class="fun">🔤 <strong>Popular choices:</strong> Playfair Display (elegant), Montserrat (modern), Lato (clean), Oswald (bold), Merriweather (readable). Try a few — it only takes 30 seconds to swap!</div>
  </div>

  <!-- CONTACT FORM -->
  <div class="card">
    <h2>Step 3 — Activate Your Contact Form (Free, 2 Minutes)</h2>
    <div class="step">
      <div class="step-num">1</div>
      <div class="step-body"><strong>Go to <a href="https://formspree.io" target="_blank">formspree.io</a> and create a free account</strong><span>Click "New Form," give it a name, and copy your Form ID (looks like <code>xabcdefg</code>).</span></div>
    </div>
    <div class="step">
      <div class="step-num">2</div>
      <div class="step-body"><strong>Open contact.html and find <code>YOUR_FORM_ID</code></strong><span>Replace it with your real Form ID. Now every message submitted on your site lands straight in your email inbox. No spam, no middleman.</span></div>
    </div>
    <div class="step">
      <div class="step-num">3</div>
      <div class="step-body"><strong>Add online booking (optional but awesome)</strong><span>Go to <a href="https://calendly.com" target="_blank">calendly.com</a>, set up your availability for free, copy your link, and replace <code>YOUR_CALENDLY_LINK</code> in contact.html. Customers can book appointments directly from your website!</span></div>
    </div>
  </div>

  <!-- WHAT DIY INCLUDES -->
  <div class="card" style="border-left:4px solid #C9922B">
    <div class="oyster">📋</div>
    <h2>What's included in your DIY template — and what's not</h2>
    <p style="font-size:.88rem;color:#555;margin-bottom:16px;">Your template gives you a real, professional website that visitors can browse, contact you through, and book appointments on. Here's exactly what that means:</p>

    <p style="font-size:.85rem;font-weight:700;color:#1B2F4E;margin-bottom:8px;">✅ What works right out of the box:</p>
    <ul style="font-size:.84rem;color:#555;line-height:1.9;margin-bottom:18px;padding-left:18px">
      <li>5 fully designed pages (Home, Services, About, Contact, Gallery)</li>
      <li>Contact form — activate in 2 minutes with a free <a href="https://formspree.io" target="_blank">Formspree</a> account</li>
      <li>Online booking — plug in your free <a href="https://calendly.com" target="_blank">Calendly</a> link and customers can schedule appointments directly</li>
      <li>Your services, prices, photos, and story — all editable by you</li>
      <li>Mobile-friendly design that looks great on every device</li>
    </ul>

    <p style="font-size:.85rem;font-weight:700;color:#1B2F4E;margin-bottom:8px;">⚠️ What DIY does <em>not</em> include:</p>
    <ul style="font-size:.84rem;color:#555;line-height:1.9;margin-bottom:18px;padding-left:18px">
      <li><strong>Custom domain setup</strong> — your live site will have a free <code>.netlify.app</code> address, not <code>yourbusiness.com</code></li>
      <li><strong>DNS configuration</strong> — connecting a domain you own requires technical steps not covered here</li>
      <li><strong>SEO setup</strong> — your site will be live but Google won't know it exists yet (no Google Search Console, no sitemap submission, no meta optimization)</li>
      <li><strong>Google Analytics</strong> — no visitor tracking or data unless you add it yourself</li>
      <li><strong>Online payments or a shopping cart</strong> — the services page displays your offerings but does not process payments</li>
      <li><strong>CMS (content management)</strong> — to update text or photos you'll need to edit the HTML files directly each time</li>
    </ul>

    <div class="tip"><strong>Bottom line:</strong> Your DIY site is 100% real and functional — people can find you, read about your business, fill out your contact form, and book appointments. It just won't have a custom domain, Google visibility, or built-in analytics until those are added.</div>
  </div>

  <!-- GET ONLINE -->
  <div class="card">
    <div class="oyster">🌐</div>
    <h2>Step 4 — Get Your Site Online (Free, 2 Minutes)</h2>
    <p style="font-size:.88rem;color:#555;margin-bottom:14px;">Ready to see it live? The quickest way is <strong>Netlify Drop</strong> — no account needed, no tech knowledge required.</p>
    <div class="step">
      <div class="step-num">1</div>
      <div class="step-body"><strong>Go to <a href="https://app.netlify.com/drop" target="_blank">app.netlify.com/drop</a></strong><span>You'll see a drop zone. That's the whole thing.</span></div>
    </div>
    <div class="step">
      <div class="step-num">2</div>
      <div class="step-body"><strong>Drag your unzipped folder onto that box</strong><span>Drop the folder with all your HTML files onto the page.</span></div>
    </div>
    <div class="step">
      <div class="step-num">3</div>
      <div class="step-body"><strong>Your site is live instantly</strong><span>Netlify gives you a free address like <code>your-site.netlify.app</code>. Share it with anyone — it's real and it works.</span></div>
    </div>
    <div class="fun">${tipNetlify}</div>
    <div class="tip" style="margin-top:14px">Want a real domain (<code>yourbusiness.com</code>), Google to find you, and a site you can update without touching code? That's where Mel comes in — see below.</div>
  </div>

  <!-- NEED HELP -->
  <div class="card" style="border:2px solid #1B2F4E">
    <h2>🙋 Ready to take it further? Mel's got you.</h2>
    <p style="font-size:.88rem;color:#555;margin-bottom:12px;">Your template gets you live. Mel's done-for-you services get you <em>found</em>. Here's what she handles:</p>
    <ul style="font-size:.84rem;color:#555;line-height:1.9;margin-bottom:14px;padding-left:18px">
      <li>Custom domain purchase &amp; DNS setup so your site lives at <code>yourbusiness.com</code></li>
      <li>Google Search Console + sitemap so Google indexes your site</li>
      <li>Google Analytics so you can see who's visiting and where they're coming from</li>
      <li>Full customization — colors, photos, copy — done for you in 3–5 business days</li>
      <li>Optional: online payment setup, CMS so you can update content yourself, and more</li>
    </ul>
    <p style="font-size:.88rem;color:#555;">👉 <a href="https://sitesbymel.com/services" target="_blank" style="font-weight:700">sitesbymel.com/services</a> — see all options and pricing.</p>
  </div>

  <div class="contact-box">
    <h2>Questions? Just ask.</h2>
    <p>Email: <strong>mel@sitesbymel.com</strong></p>
    <p>Website: <strong><a href="https://sitesbymel.com" target="_blank" style="color:#C9922B">sitesbymel.com</a></strong></p>
    <p style="margin-top:12px;font-size:.82rem;opacity:.6;">${tipClosing}</p>
  </div>
</div>
</body>
</html>`;
}

module.exports = { buildInstructions };
