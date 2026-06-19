// Generates INSTRUCTIONS.html for each template zip
// Called by build-downloads.js

function buildInstructions(templateName, templateSlug, niche) {
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
  .file-list{list-style:none;padding:0}
  .file-list li{padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:.88rem;display:flex;gap:12px;align-items:flex-start}
  .file-list li:last-child{border-bottom:none}
  .file-tag{background:#e8f0fe;color:#1a56a8;font-size:.72rem;font-weight:700;padding:2px 8px;border-radius:4px;white-space:nowrap;margin-top:2px}
  .contact-box{background:#1B2F4E;color:#fff;padding:24px 32px;border-radius:10px;margin-top:24px}
  .contact-box h2{color:#C9922B;margin-bottom:8px}
  .contact-box p{font-size:.88rem;opacity:.85;margin-bottom:6px}
  a{color:#C9922B}
</style>
</head>
<body>
<div class="wrap">
  <div class="header">
    <div class="badge">Sites by Mel</div>
    <h1>${templateName}</h1>
    <p>Your complete ${niche} website template — setup guide included</p>
  </div>

  <div class="card">
    <h2>What's in this zip</h2>
    <ul class="file-list">
      <li><span class="file-tag">HTML</span><div><strong>index.html</strong> — Your complete website. Open this in any browser to preview it right now.</div></li>
      <li><span class="file-tag">CSS</span><div><strong>Embedded in index.html</strong> — All styles are built directly into the HTML file. No separate CSS file needed.</div></li>
      <li><span class="file-tag">GUIDE</span><div><strong>INSTRUCTIONS.html</strong> — This file. Keep it handy.</div></li>
    </ul>
  </div>

  <div class="card">
    <h2>Step 1 — Preview your site right now</h2>
    <div class="step">
      <div class="step-num">1</div>
      <div class="step-body"><strong>Open the zip and find index.html</strong><span>Double-click it. It opens in your browser and you'll see the full website immediately. Nothing to install.</span></div>
    </div>
    <div class="tip">You're looking at your real website. Everything you see is exactly what your visitors will see once it's live.</div>
  </div>

  <div class="card">
    <h2>Step 2 — Edit your content</h2>
    <p style="font-size:.88rem;color:#555;margin-bottom:16px;">Open <code>index.html</code> in a text editor. On Windows: right-click → Open With → Notepad. On Mac: right-click → Open With → TextEdit. For a better experience, download <a href="https://code.visualstudio.com" target="_blank">VS Code</a> (free).</p>
    <div class="step">
      <div class="step-num">1</div>
      <div class="step-body"><strong>Change the business name</strong><span>Press <code>Ctrl+H</code> (Find & Replace). Search for the demo business name and replace it with yours everywhere.</span></div>
    </div>
    <div class="step">
      <div class="step-num">2</div>
      <div class="step-body"><strong>Update your phone number and address</strong><span>Search for the placeholder phone/address in the file and replace with your real info.</span></div>
    </div>
    <div class="step">
      <div class="step-num">3</div>
      <div class="step-body"><strong>Change your colors</strong><span>Find <code>:root {</code> near the top of the file. You'll see CSS variables like <code>--navy</code> and <code>--gold</code>. Replace the hex color values with your brand colors. Use <a href="https://coolors.co" target="_blank">coolors.co</a> to find color codes.</span></div>
    </div>
    <div class="step">
      <div class="step-num">4</div>
      <div class="step-body"><strong>Swap your photos</strong><span>Photos are referenced as background images in the CSS. If you add images: create an <code>images/</code> folder in the same directory as index.html, put your photos there, then find the image references in the HTML and change the URL to match your filenames.</span></div>
    </div>
    <div class="step">
      <div class="step-num">5</div>
      <div class="step-body"><strong>Update all your service/menu/product details</strong><span>Just read through the file, find any text you want to change, and type over it. The file is organized in sections — look for HTML comments like <code>&lt;!-- SERVICES --&gt;</code> to find each section.</span></div>
    </div>
    <div class="tip"><strong>Save often.</strong> After each change, save the file and refresh your browser to see the update. Press <code>Ctrl+S</code> to save, <code>F5</code> to refresh.</div>
  </div>

  <div class="card">
    <h2>Step 3 — Get your site live (free hosting)</h2>
    <div class="step">
      <div class="step-num">1</div>
      <div class="step-body"><strong>Create a free GitHub account</strong><span>Go to <a href="https://github.com" target="_blank">github.com</a> and sign up. It's free.</span></div>
    </div>
    <div class="step">
      <div class="step-num">2</div>
      <div class="step-body"><strong>Create a new repository</strong><span>Click the + button → New repository. Name it your business name. Set it to Public. Click Create.</span></div>
    </div>
    <div class="step">
      <div class="step-num">3</div>
      <div class="step-body"><strong>Upload your files</strong><span>On your new repository page, click "uploading an existing file." Drag your index.html (and images/ folder if you have one) into the upload area. Click Commit changes.</span></div>
    </div>
    <div class="step">
      <div class="step-num">4</div>
      <div class="step-body"><strong>Deploy with Cloudflare Pages (free)</strong><span>Go to <a href="https://pages.cloudflare.com" target="_blank">pages.cloudflare.com</a> → Create a project → Connect to Git → Select your GitHub repo → Deploy. Your site will be live at a <code>yourname.pages.dev</code> URL within 2 minutes.</span></div>
    </div>
    <div class="step">
      <div class="step-num">5</div>
      <div class="step-body"><strong>Connect your custom domain</strong><span>In Cloudflare Pages → Custom Domains → Add domain. Then go to wherever your domain is registered (GoDaddy, Namecheap, etc.) and add the 2 DNS records Cloudflare shows you. Your custom domain is live within an hour. Your only ongoing cost is domain renewal (~$12/yr).</span></div>
    </div>
    <div class="tip"><strong>No monthly fees.</strong> Cloudflare Pages is free forever for static sites. You're not on Squarespace, Wix, or any platform that charges $20–$50/month. You own this completely.</div>
  </div>

  <div class="card">
    <h2>Need help? I can do it for you.</h2>
    <p style="font-size:.88rem;color:#555;margin-bottom:12px;">If customizing or launching yourself feels like too much, I offer a done-for-you service. You send me your content (logo, photos, text, business info) and I'll customize this template, deploy it, and connect your domain — delivered in 3–5 business days.</p>
    <p style="font-size:.88rem;color:#555;">Visit <a href="https://sitesbymel.com/services" target="_blank">sitesbymel.com/services</a> to see options and pricing.</p>
  </div>

  <div class="contact-box">
    <h2>Questions?</h2>
    <p>Email: <strong>mel@sitesbymel.com</strong></p>
    <p>Website: <strong><a href="https://sitesbymel.com" target="_blank" style="color:#C9922B">sitesbymel.com</a></strong></p>
    <p style="margin-top:12px;font-size:.82rem;opacity:.6;">Thank you for your purchase. I built every pixel of this template myself and I hope it helps your business grow.</p>
  </div>
</div>
</body>
</html>`;
}

module.exports = { buildInstructions };
