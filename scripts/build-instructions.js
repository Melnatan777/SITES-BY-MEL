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
    <h2>Step 2 — Make It Yours! (No coding needed, promise.)</h2>
    <p style="font-size:.88rem;color:#555;margin-bottom:16px;">Every word, price, and business name in this template is yours to change. You're not coding — you're just finding words and replacing them. That's it.</p>

    <div class="fun" style="margin-bottom:18px">
      <strong>✏️ No downloads, no installs, no accounts.</strong><br>
      <span style="font-size:.82rem">You already have everything you need on your computer right now.<br>
      <strong>Windows:</strong> Notepad &nbsp;|&nbsp; <strong>Mac:</strong> TextEdit — both come pre-installed.</span>
    </div>

    <p style="font-size:.9rem;font-weight:700;color:#1B2F4E;margin-bottom:12px">Here's exactly what to do, step by step:</p>

    <div class="step">
      <div class="step-num">1</div>
      <div class="step-body"><strong>Open your website folder</strong><span>Find the folder you unzipped on your computer. You'll see files like <code>index.html</code>, <code>about.html</code>, <code>services.html</code>, etc. Each one is a page of your website.</span></div>
    </div>

    <div class="step">
      <div class="step-num">2</div>
      <div class="step-body"><strong>Right-click a file and open it in Notepad (or TextEdit on Mac)</strong><span>Right-click on <code>index.html</code> → choose <strong>Open with</strong> → choose <strong>Notepad</strong>. You'll see a lot of text. <em>Don't panic!</em> You're not reading all of it — you're just searching for the words you want to swap out.</span></div>
    </div>

    <div class="step">
      <div class="step-num">3</div>
      <div class="step-body">
        <strong>Use Find &amp; Replace to swap your business name (the easy way!)</strong>
        <span>
          This is the secret trick that makes it fast:<br><br>
          Press <code>Ctrl+H</code> on Windows (or <code>Cmd+H</code> on Mac). A small box pops up with two fields:<br><br>
          &nbsp;&nbsp;• <strong>Find what:</strong> type the demo business name (e.g. <em>FitLife</em>)<br>
          &nbsp;&nbsp;• <strong>Replace with:</strong> type YOUR business name<br><br>
          Then click <strong>Replace All</strong>. Every single instance on that page changes at once. Takes 10 seconds.
        </span>
      </div>
    </div>

    <div class="step">
      <div class="step-num">4</div>
      <div class="step-body"><strong>Change any other text the same way</strong><span>Want to update your tagline, phone number, address, or service descriptions? Same trick — press <code>Ctrl+H</code>, type the old words in the top box, type your new words in the bottom box, click Replace All. Or just click directly on the word in Notepad and type over it.</span></div>
    </div>

    <div class="step">
      <div class="step-num">5</div>
      <div class="step-body"><strong>Save your changes</strong><span>Press <code>Ctrl+S</code> (Windows) or <code>Cmd+S</code> (Mac). That's it — it saves right back to the same file. Nothing moves, nothing gets lost.</span></div>
    </div>

    <div class="step">
      <div class="step-num">6</div>
      <div class="step-body"><strong>See your changes in the browser</strong><span>Go back to your website folder and double-click <code>index.html</code> — it opens in your browser so you can see exactly how your page looks. If you made more changes, just press <code>F5</code> on your keyboard to refresh and see the latest version.</span></div>
    </div>

    <div class="step">
      <div class="step-num">7</div>
      <div class="step-body"><strong>Do the same for every page</strong><span>Right-click <code>about.html</code> → Open with Notepad → update your story → Ctrl+S. Then <code>services.html</code> for your pricing → open → update → save. Each file is one page. Edit, save, done. Repeat for each one.</span></div>
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
      <div class="step-body"><strong>Find the image in the HTML file</strong><span>In Notepad, search (<code>Ctrl+F</code>) for <code>img src</code> to find image tags. They look like this: <code>&lt;img src="images/hero.jpg"&gt;</code></span></div>
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
    <h2>Change Your Colors</h2>

    <div style="background:#f0f7ff;border:1px solid #bfdbfe;border-radius:8px;padding:14px 18px;margin-bottom:20px">
      <p style="font-size:.88rem;font-weight:700;color:#1e40af;margin:0 0 6px">💡 First — what is a hex code?</p>
      <p style="font-size:.84rem;color:#333;margin:0;line-height:1.7">A <strong>hex code</strong> is just a color written as a code that computers understand. Every color in the world has one. It always starts with a <strong>#</strong> and has 6 letters and numbers after it.<br><br>
      Examples: &nbsp;<strong style="color:#C9922B">#C9922B</strong> = gold &nbsp;|&nbsp; <strong style="color:#1B2F4E">#1B2F4E</strong> = navy blue &nbsp;|&nbsp; <strong style="color:#ef4444">#ef4444</strong> = red<br><br>
      You don't need to memorize anything — you just look up the color you want and copy the code.</p>
    </div>

    <p style="font-size:.88rem;color:#555;margin-bottom:10px;">Your template's colors live near the very top of each HTML file. Open <code>index.html</code> in Notepad and look for a section that looks like this:</p>
    <div style="background:#1a1a2e;color:#e8e8e8;padding:16px 20px;border-radius:8px;font-family:monospace;font-size:.82rem;line-height:1.8;margin-bottom:16px;">
      <span style="color:#888">/* YOUR BRAND COLORS — change these! */</span><br/>
      :root {<br/>
      &nbsp;&nbsp;<span style="color:#79b8ff">--primary</span>: <span style="color:#C9922B">${primary}</span>;  <span style="color:#888">← main color (buttons, headings)</span><br/>
      &nbsp;&nbsp;<span style="color:#79b8ff">--accent</span>: <span style="color:#C9922B">${accent}</span>;   <span style="color:#888">← highlight color (accents, links)</span><br/>
      }
    </div>
    <p style="font-size:.84rem;color:#555;margin-bottom:16px;">Just swap those codes with your own colors. Here's how to find your hex code in 30 seconds:</p>

    <div class="step">
      <div class="step-num">1</div>
      <div class="step-body"><strong>Go to Google and search: <em>color picker</em></strong><span>Google has a color picker built right into search results. A rainbow wheel appears — click anywhere on it to pick a color. The hex code shows up automatically in a box labeled "HEX." It'll look something like <strong>#3a86ff</strong>. Copy that.</span></div>
    </div>
    <div class="step">
      <div class="step-num">2</div>
      <div class="step-body"><strong>Or browse ready-made palettes at <a href="https://coolors.co" target="_blank">coolors.co</a></strong><span>Hit the spacebar to cycle through beautiful color combos. When you see one you love, click any color swatch to see its hex code. Great for picking a primary + accent combo that looks professional together.</span></div>
    </div>
    <div class="step">
      <div class="step-num">3</div>
      <div class="step-body"><strong>Paste your hex code into Notepad</strong><span>In Notepad, press <code>Ctrl+H</code> to open Find &amp; Replace. In <strong>Find what</strong> type the old code (like <code>${primary}</code>). In <strong>Replace with</strong> paste your new code. Click <strong>Replace All</strong>. Press <code>Ctrl+S</code> to save, then double-click <code>index.html</code> in your browser to see your new colors instantly.</span></div>
    </div>

    <div class="fun">💡 <strong>Do index.html first</strong> to preview your colors in the browser. Once you're happy, do the same Ctrl+H swap in each of the other page files.</div>
    <p style="font-size:.83rem;color:#555;margin-top:14px;">Need inspiration? Here are some combos to get you started:</p>
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
      <div class="step-body"><strong>Paste the link in your HTML file</strong><span>Open index.html in Notepad++. Near the top, inside the <code>&lt;head&gt;</code> section, paste the link tag Google gave you.</span></div>
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
    <h2>Step 4 — Get Your Site Online Free (2 Minutes, Just Drag &amp; Drop)</h2>
    <p style="font-size:.88rem;color:#555;margin-bottom:14px;">When you're done editing, here's how to put it on the internet for free — no account, no tech knowledge needed.</p>
    <div class="step">
      <div class="step-num">1</div>
      <div class="step-body"><strong>Go to <a href="https://app.netlify.com/drop" target="_blank">app.netlify.com/drop</a> in your browser</strong><span>You'll see a big dashed box that says "Drag and drop your site folder here." That's it — that's the whole thing.</span></div>
    </div>
    <div class="step">
      <div class="step-num">2</div>
      <div class="step-body"><strong>Drag your website folder onto that box and drop it</strong><span>Open File Explorer (Windows) or Finder (Mac), find your website folder, and drag the whole folder onto the Netlify page. Hold the mouse button, drag it over the browser, and let go.</span></div>
    </div>
    <div class="step">
      <div class="step-num">3</div>
      <div class="step-body"><strong>Your site is live!</strong><span>Netlify gives you a free link like <code>my-business-abc123.netlify.app</code>. Copy it and share it — your site is real, live, and working on the internet right now.</span></div>
    </div>
    <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:12px 16px;margin:14px 0;font-size:.84rem;color:#166534;">
      <strong>🔄 Made more changes?</strong> Just go back to app.netlify.com/drop and drag your folder again. It updates your live site in seconds.
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
