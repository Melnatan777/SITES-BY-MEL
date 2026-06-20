// Chat bot script for FitLife template
// Injected into every HTML page + INSTRUCTIONS.html
// Auto-hides when site is live online — only shows on local file://

function getFitLifeBotScript() {
  return `
<script>
// Only show the setup bot when editing locally — hide completely when site goes live
if (window.location.protocol === 'file:') {
document.addEventListener('DOMContentLoaded', function() {
  var botHTML = \`
<style>
#mel-bot-bubble {
  position:fixed;bottom:24px;right:24px;z-index:9999;
  width:52px;height:52px;border-radius:50%;
  background:#1B2F4E;color:#fff;border:none;
  font-size:1.5rem;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,0.25);
  display:flex;align-items:center;justify-content:center;
  transition:transform .2s;
}
#mel-bot-bubble:hover{transform:scale(1.08)}
#mel-bot-window {
  position:fixed;bottom:90px;right:24px;z-index:9999;
  width:340px;max-height:520px;
  background:#fff;border-radius:16px;
  box-shadow:0 8px 40px rgba(0,0,0,0.18);
  display:none;flex-direction:column;overflow:hidden;
  font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
}
#mel-bot-header {
  background:#1B2F4E;color:#fff;padding:14px 18px;
  display:flex;align-items:center;gap:10px;
}
#mel-bot-header span{font-size:.9rem;font-weight:700}
#mel-bot-header small{font-size:.72rem;opacity:.7;display:block}
#mel-bot-messages {
  flex:1;overflow-y:auto;padding:16px;
  display:flex;flex-direction:column;gap:10px;
  max-height:340px;
}
.bot-msg {
  background:#f0f4ff;border-radius:12px 12px 12px 2px;
  padding:10px 14px;font-size:.83rem;line-height:1.6;color:#1a1a1a;
  max-width:90%;
}
.bot-msg code {
  background:#1B2F4E;color:#fff;padding:2px 7px;
  border-radius:4px;font-size:.78rem;font-family:monospace;
}
.bot-msg b { color:#1B2F4E; }
#mel-bot-choices {
  padding:10px 14px 14px;display:flex;flex-direction:column;gap:6px;
}
.bot-choice {
  background:#fff;border:1.5px solid #1B2F4E;color:#1B2F4E;
  border-radius:8px;padding:8px 12px;font-size:.82rem;
  font-weight:600;cursor:pointer;text-align:left;
  transition:background .15s,color .15s;
}
.bot-choice:hover{background:#1B2F4E;color:#fff}
#mel-bot-restart {
  font-size:.72rem;color:#9CA3AF;text-align:center;
  padding-bottom:10px;cursor:pointer;text-decoration:underline;
}
</style>

<button id="mel-bot-bubble" onclick="melBotToggle()" title="Get help">🤖</button>

<div id="mel-bot-window">
  <div id="mel-bot-header">
    <div>
      <span>Mel's Setup Assistant</span>
      <small>I'll walk you through every step</small>
    </div>
    <button onclick="melBotToggle()" style="margin-left:auto;background:none;border:none;color:#fff;font-size:1.1rem;cursor:pointer">✕</button>
  </div>
  <div id="mel-bot-messages"></div>
  <div id="mel-bot-choices"></div>
  <div id="mel-bot-restart" onclick="melBotStart()">↩ Start over</div>
</div>

<script>
const BOT = {

  welcome: {
    msg: "Hi! 👋 I'm here to walk you through setting up your FitLife template. What do you want to do first?",
    choices: [
      { label: "✏️ Edit my business name & text", next: "edit_which_page" },
      { label: "📸 Swap out the photos", next: "photos_intro" },
      { label: "🎨 Change the colors", next: "colors_intro" },
      { label: "🌐 Get my site live online", next: "netlify_intro" },
      { label: "😰 I'm stuck / something went wrong", next: "stuck" }
    ]
  },

  // ── WHICH PAGE ──────────────────────────────────────────────
  edit_which_page: {
    msg: "Great! Which page do you want to edit? Start with the Home page — it's the one people see first.",
    choices: [
      { label: "🏠 Home page (index.html)", next: "home_intro" },
      { label: "👤 About page (about.html)", next: "about_intro" },
      { label: "💰 Services & Pricing (services.html)", next: "services_intro" },
      { label: "📞 Contact page (contact.html)", next: "contact_intro" },
      { label: "🖼️ Gallery page (gallery.html)", next: "gallery_intro" },
      { label: "⬅️ Go back", next: "welcome" }
    ]
  },

  // ── HOME PAGE ───────────────────────────────────────────────
  home_intro: {
    msg: "Let's edit your Home page. First — open your website folder, right-click the file called <b>index.html</b>, choose <b>Open with</b>, then choose <b>Notepad</b>.\n\nGot it open?",
    choices: [
      { label: "✅ Yes, it's open", next: "home_name" },
      { label: "❓ I can't find Notepad", next: "help_notepad" }
    ]
  },

  home_name: {
    msg: "Perfect. Let's start with your business name. The template uses <b>FitLife</b> everywhere.\n\nPress <code>Ctrl+H</code> on your keyboard. A box pops up with two fields:\n• <b>Find what:</b> type  FitLife\n• <b>Replace with:</b> type YOUR business name\n\nThen click <b>Replace All</b>.\n\nDid that work?",
    choices: [
      { label: "✅ Yes! Name is updated", next: "home_tagline" },
      { label: "❓ I don't see the Ctrl+H box", next: "help_ctrlh" },
      { label: "❓ Nothing changed", next: "help_nothing_changed" }
    ]
  },

  home_tagline: {
    msg: "Amazing! Now let's swap the tagline. The template says:\n\n<b>\"Transform Your Body. Transform Your Life.\"</b>\n\nPress <code>Ctrl+H</code> again:\n• <b>Find what:</b> Transform Your Body. Transform Your Life.\n• <b>Replace with:</b> YOUR tagline\n\nIf you don't have a tagline yet, try something simple like <i>\"Portland's Best Personal Trainer\"</i> — you can always change it later.",
    choices: [
      { label: "✅ Done!", next: "home_city" },
      { label: "❓ What's a tagline?", next: "help_tagline" }
    ]
  },

  home_city: {
    msg: "Now replace the city. The template says <b>Portland</b> in several spots.\n\nPress <code>Ctrl+H</code>:\n• <b>Find what:</b> Portland\n• <b>Replace with:</b> YOUR city\n\nClick Replace All.",
    choices: [
      { label: "✅ Done!", next: "home_phone" }
    ]
  },

  home_phone: {
    msg: "Now your phone number. The template has <b>(555) 123-4567</b>.\n\nPress <code>Ctrl+H</code>:\n• <b>Find what:</b> (555) 123-4567\n• <b>Replace with:</b> your real phone number\n\nClick Replace All.",
    choices: [
      { label: "✅ Done!", next: "home_testimonials" },
      { label: "❓ I don't have a business number yet", next: "help_no_phone" }
    ]
  },

  home_testimonials: {
    msg: "The home page has fake customer reviews from <b>Jennifer M.</b> and <b>Todd K.</b> — you'll want to replace those with real reviews from your actual clients.\n\nPress <code>Ctrl+H</code>:\n• <b>Find what:</b> Jennifer M.\n• <b>Replace with:</b> your real client's name\n\nThen do the same for Todd K. and replace the quote text too — just click directly on the words and type over them.\n\nDo you have real reviews you can use?",
    choices: [
      { label: "✅ Yes, I'll add my real reviews", next: "home_save" },
      { label: "❓ I don't have reviews yet", next: "help_no_reviews" }
    ]
  },

  home_save: {
    msg: "You're doing great! 🎉 Now save everything.\n\nPress <code>Ctrl+S</code> on your keyboard. That saves the file right where it is — nothing moves.\n\nThen double-click <b>index.html</b> in your folder to open it in your browser and see how it looks!",
    choices: [
      { label: "✅ Looks great!", next: "home_done" },
      { label: "❓ It doesn't look right", next: "help_preview" }
    ]
  },

  home_done: {
    msg: "Home page — DONE! ✅ That's the big one. What do you want to do next?",
    choices: [
      { label: "👤 Edit the About page next", next: "about_intro" },
      { label: "💰 Edit Services & Pricing", next: "services_intro" },
      { label: "📞 Edit the Contact page", next: "contact_intro" },
      { label: "🖼️ Swap out photos", next: "photos_intro" },
      { label: "🌐 Get my site online", next: "netlify_intro" }
    ]
  },

  // ── ABOUT PAGE ──────────────────────────────────────────────
  about_intro: {
    msg: "The About page has the most to change — it tells YOUR story. Right-click <b>about.html</b> → Open with → Notepad.\n\nReady?",
    choices: [
      { label: "✅ It's open", next: "about_trainer_name" },
      { label: "❓ Need help opening it", next: "help_notepad" }
    ]
  },

  about_trainer_name: {
    msg: "The template uses a fictional trainer named <b>Marcus</b>. Let's replace that with your name.\n\nPress <code>Ctrl+H</code>:\n• <b>Find what:</b> Marcus\n• <b>Replace with:</b> YOUR name\n\nClick Replace All.",
    choices: [
      { label: "✅ Done!", next: "about_fitlife_name" }
    ]
  },

  about_fitlife_name: {
    msg: "Now replace <b>FitLife</b> with your business name on this page too.\n\nPress <code>Ctrl+H</code>:\n• <b>Find what:</b> FitLife\n• <b>Replace with:</b> your business name\n\nReplace All.",
    choices: [
      { label: "✅ Done!", next: "about_story" }
    ]
  },

  about_story: {
    msg: "Now the personal story. The template has Marcus's fictional background — the knee injury, Portland State University, etc. This needs to be YOUR story.\n\nPress <code>Ctrl+F</code> and search for:\n<b>Marcus grew up in Portland</b>\n\nThat will highlight the paragraph. Click right on it and start typing your own story.\n\nKeep it real and personal — people hire trainers they connect with!",
    choices: [
      { label: "✅ I've written my story", next: "about_certs" },
      { label: "❓ I don't know what to write", next: "help_story" }
    ]
  },

  about_certs: {
    msg: "The template lists these certifications:\n<b>NASM-CPT | ACE-GFI | Precision Nutrition Level 2</b>\n\nReplace these with YOUR actual certifications.\n\nPress <code>Ctrl+H</code>:\n• <b>Find what:</b> NASM-CPT\n• <b>Replace with:</b> your certification\n\nIf you have more than one, repeat for each. If you don't have certifications yet, just delete that line.",
    choices: [
      { label: "✅ Done!", next: "about_stats" },
      { label: "❓ I don't have certifications yet", next: "help_no_certs" }
    ]
  },

  about_stats: {
    msg: "The template shows stats like <b>8+ Years Coaching</b> and <b>500+ clients</b>.\n\nPress <code>Ctrl+H</code>:\n• <b>Find what:</b> 8+\n• <b>Replace with:</b> your years (even if it's 1!)\n\nThen find <b>500+</b> and replace with your real number. Be honest — authenticity builds trust.",
    choices: [
      { label: "✅ Done!", next: "about_testimonials" },
      { label: "❓ I'm just starting out", next: "help_new_business" }
    ]
  },

  about_testimonials: {
    msg: "The About page has fake testimonials from <b>Sandra & Mike T.</b> Replace those with real quotes from happy clients.\n\nPress <code>Ctrl+F</code> and search for <b>Sandra</b> to find them. Click and type your real client quotes.\n\nNo real reviews yet? Just delete those sections for now — you can add them later.",
    choices: [
      { label: "✅ Done!", next: "about_save" }
    ]
  },

  about_save: {
    msg: "Save it! Press <code>Ctrl+S</code>.\n\nThen double-click <b>about.html</b> to preview it in your browser. Your story, your name, your certs. That's your page! 🎉",
    choices: [
      { label: "✅ Looks good!", next: "about_done" },
      { label: "❓ Something looks off", next: "help_preview" }
    ]
  },

  about_done: {
    msg: "About page — DONE! ✅ What's next?",
    choices: [
      { label: "💰 Edit Services & Pricing", next: "services_intro" },
      { label: "📞 Edit the Contact page", next: "contact_intro" },
      { label: "🖼️ Swap out photos", next: "photos_intro" },
      { label: "🌐 Get my site online", next: "netlify_intro" }
    ]
  },

  // ── SERVICES PAGE ───────────────────────────────────────────
  services_intro: {
    msg: "The Services page has all your programs and prices. This is where customers decide to book — so make sure YOUR services and YOUR real prices are on here.\n\nRight-click <b>services.html</b> → Open with → Notepad.",
    choices: [
      { label: "✅ It's open", next: "services_name" }
    ]
  },

  services_name: {
    msg: "First, replace <b>FitLife</b> with your business name on this page.\n\nPress <code>Ctrl+H</code>:\n• <b>Find what:</b> FitLife\n• <b>Replace with:</b> your business name\n\nReplace All.",
    choices: [
      { label: "✅ Done!", next: "services_prices" }
    ]
  },

  services_prices: {
    msg: "Now let's fix the prices. The template has example prices like <b>$99/mo</b>, <b>$149</b>, <b>$199</b>, <b>$295</b>, etc.\n\nPress <code>Ctrl+H</code> for each one:\n• Find the old price → Replace with YOUR real price\n\nDo them one at a time so you control which changes to what.",
    choices: [
      { label: "✅ Prices updated!", next: "services_names" },
      { label: "❓ I haven't set my prices yet", next: "help_no_prices" }
    ]
  },

  services_names: {
    msg: "Now update the service names if needed. The template has things like:\n• <b>Personal Training</b>\n• <b>Nutrition Coaching</b>\n• <b>Group Classes</b>\n\nIf your services are named differently, press <code>Ctrl+H</code> and swap them. If the names work for you — leave them!",
    choices: [
      { label: "✅ Done!", next: "services_descriptions" }
    ]
  },

  services_descriptions: {
    msg: "The service descriptions are the short paragraphs under each service name. Read through them — do they describe YOUR business?\n\nIf not, press <code>Ctrl+F</code> to find the text, click on it, and type your own description.\n\nTip: keep it short and benefit-focused. <i>\"Lose weight and feel confident in 90 days\"</i> beats <i>\"We offer customized fitness programs.\"</i>",
    choices: [
      { label: "✅ Descriptions updated!", next: "services_save" }
    ]
  },

  services_save: {
    msg: "Press <code>Ctrl+S</code> to save. Then double-click <b>services.html</b> to preview it in your browser.\n\nYour real services, your real prices. Looking good? 💪",
    choices: [
      { label: "✅ Looks great!", next: "services_done" },
      { label: "❓ Something looks off", next: "help_preview" }
    ]
  },

  services_done: {
    msg: "Services page — DONE! ✅ What's next?",
    choices: [
      { label: "📞 Edit the Contact page", next: "contact_intro" },
      { label: "👤 Edit the About page", next: "about_intro" },
      { label: "🖼️ Swap out photos", next: "photos_intro" },
      { label: "🌐 Get my site online", next: "netlify_intro" }
    ]
  },

  // ── CONTACT PAGE ────────────────────────────────────────────
  contact_intro: {
    msg: "The Contact page has your address, phone, hours, and the booking form. Let's get your real info on there.\n\nRight-click <b>contact.html</b> → Open with → Notepad.",
    choices: [
      { label: "✅ It's open", next: "contact_address" }
    ]
  },

  contact_address: {
    msg: "The template has this fake address:\n<b>789 Iron Street, Unit 4</b>\n\nPress <code>Ctrl+H</code>:\n• <b>Find what:</b> 789 Iron Street, Unit 4\n• <b>Replace with:</b> your real address\n\nIf you work from home or online only, you can delete the address entirely — just find it and remove it.",
    choices: [
      { label: "✅ Done!", next: "contact_city_zip" },
      { label: "❓ I work online / from home", next: "help_no_address" }
    ]
  },

  contact_city_zip: {
    msg: "Now the city and zip code. The template has <b>Portland, OR 97209</b>.\n\nPress <code>Ctrl+H</code>:\n• <b>Find what:</b> Portland, OR 97209\n• <b>Replace with:</b> your city, state, and zip",
    choices: [
      { label: "✅ Done!", next: "contact_phone" }
    ]
  },

  contact_phone: {
    msg: "Replace the phone number. Find <b>(555) 123-4567</b> on this page too.\n\nPress <code>Ctrl+H</code>:\n• <b>Find what:</b> 5551234567\n• <b>Replace with:</b> your number (no dashes)\n\nThen do it again for the display version:\n• <b>Find what:</b> (555) 123-4567\n• <b>Replace with:</b> (your number with dashes)",
    choices: [
      { label: "✅ Done!", next: "contact_hours" }
    ]
  },

  contact_hours: {
    msg: "The template has these hours:\n<b>Mon–Fri: 5:30am–8pm</b>\n<b>Saturday: 7am–2pm</b>\n<b>Sunday: 7am–12pm</b>\n\nPress <code>Ctrl+F</code> and search for <b>5:30am</b> to find the hours. Click on each one and type your real hours.\n\nIf you don't have set hours, just delete that section.",
    choices: [
      { label: "✅ Hours updated!", next: "contact_formspree" },
      { label: "❓ I want to delete the hours section", next: "help_delete_section" }
    ]
  },

  contact_formspree: {
    msg: "Now let's activate your contact form so messages actually reach you! ✉️\n\nThe form won't work yet — you need a free Formspree account first.\n\n1. Go to <b>formspree.io</b>\n2. Sign up free\n3. Click <b>New Form</b>\n4. Copy your Form ID (looks like <b>xabcdefg</b>)\n\nGot your Form ID?",
    choices: [
      { label: "✅ Yes, I have my Form ID", next: "contact_formspree_paste" },
      { label: "❓ I'll do this later", next: "contact_calendly" }
    ]
  },

  contact_formspree_paste: {
    msg: "In Notepad, press <code>Ctrl+H</code>:\n• <b>Find what:</b> YOUR_FORM_ID\n• <b>Replace with:</b> your actual Form ID\n\nClick Replace All. Now when someone fills out your form, you get an email!",
    choices: [
      { label: "✅ Done!", next: "contact_calendly" }
    ]
  },

  contact_calendly: {
    msg: "The page also has a booking button for online scheduling. It uses <b>Calendly</b> — free to set up.\n\n1. Go to <b>calendly.com</b>\n2. Create a free account\n3. Set up your availability\n4. Copy your Calendly link\n\nThen press <code>Ctrl+H</code>:\n• <b>Find what:</b> YOUR_CALENDLY_LINK\n• <b>Replace with:</b> your Calendly link\n\nWant to do this now or skip it for later?",
    choices: [
      { label: "✅ Done, link is in!", next: "contact_save" },
      { label: "⏭️ Skip for now", next: "contact_save" }
    ]
  },

  contact_save: {
    msg: "Press <code>Ctrl+S</code> to save. Then double-click <b>contact.html</b> to preview in your browser.\n\nYour real address, your real phone, your real hours. That's YOUR contact page! 📞",
    choices: [
      { label: "✅ Looks perfect!", next: "contact_done" },
      { label: "❓ Something looks off", next: "help_preview" }
    ]
  },

  contact_done: {
    msg: "Contact page — DONE! ✅ What's next?",
    choices: [
      { label: "🖼️ Swap out the photos", next: "photos_intro" },
      { label: "🎨 Change the colors", next: "colors_intro" },
      { label: "🌐 Get my site online now!", next: "netlify_intro" }
    ]
  },

  // ── GALLERY PAGE ────────────────────────────────────────────
  gallery_intro: {
    msg: "The Gallery page is all photos — before/afters, your gym, your clients in action. The template has placeholder images.\n\nThe easiest way to update photos is to go through the Photos section. Want to do that now?",
    choices: [
      { label: "✅ Yes, show me how to swap photos", next: "photos_intro" },
      { label: "⏭️ I'll do photos later", next: "edit_which_page" }
    ]
  },

  // ── PHOTOS ──────────────────────────────────────────────────
  photos_intro: {
    msg: "Swapping photos is easier than it sounds. You're just telling the website which photo file to show — you're not uploading anything online.\n\nFirst — do you have photos on your computer you want to use?",
    choices: [
      { label: "✅ Yes I have photos ready", next: "photos_copy" },
      { label: "❓ I need free photos to use", next: "photos_free" },
      { label: "❓ What size should my photos be?", next: "photos_size" }
    ]
  },

  photos_free: {
    msg: "No problem! Here are two great free photo sites — all photos are free to use on your website:\n\n• <b>unsplash.com</b> — beautiful professional photos\n• <b>pexels.com</b> — great variety, all free\n\nSearch for something like <i>\"personal trainer\"</i> or <i>\"gym workout\"</i>. Download the photo, then come back here.",
    choices: [
      { label: "✅ Got my photos, ready to continue", next: "photos_copy" }
    ]
  },

  photos_size: {
    msg: "For best results:\n• Banner/hero photos: <b>wide landscape</b>, at least 1200px wide\n• Square/profile photos: <b>at least 500x500px</b>\n• Keep each file under <b>500KB</b> for fast loading\n\nNeed to compress a photo? Go to <b>squoosh.app</b> — free, no signup, drag and drop.",
    choices: [
      { label: "✅ Got it, my photos are ready", next: "photos_copy" }
    ]
  },

  photos_copy: {
    msg: "Step 1: Copy your photo into the right folder.\n\nOpen your website folder. Inside it you'll see a folder called <b>images</b>. Copy your photo file into that <b>images</b> folder.\n\nTip: rename your photo something simple with no spaces — like <b>my-photo.jpg</b> or <b>gym-front.jpg</b>.\n\nDone?",
    choices: [
      { label: "✅ Photo is in the images folder", next: "photos_find" },
      { label: "❓ I can't find the images folder", next: "help_images_folder" }
    ]
  },

  photos_find: {
    msg: "Now open the HTML page where you want to change the photo.\n\nRight-click the page file → Open with → Notepad.\n\nThen press <code>Ctrl+F</code> and search for: <b>img src</b>\n\nThis will highlight an image tag that looks like:\n<code>&lt;img src=\"images/hero.jpg\"&gt;</code>\n\nSee it?",
    choices: [
      { label: "✅ Yes I can see it", next: "photos_replace" },
      { label: "❓ Nothing is highlighted", next: "help_img_src" }
    ]
  },

  photos_replace: {
    msg: "See the filename inside the quotes — like <b>hero.jpg</b>? That's the photo it's currently showing.\n\nClick right on that filename and change it to the name of YOUR photo file.\n\nFor example:\n<code>images/hero.jpg</code> → <code>images/my-photo.jpg</code>\n\nMake sure the name matches EXACTLY — including .jpg or .png at the end.\n\nThen press <code>Ctrl+S</code> to save.",
    choices: [
      { label: "✅ Changed it and saved!", next: "photos_preview" },
      { label: "❓ I have more photos to change", next: "photos_multiple" }
    ]
  },

  photos_multiple: {
    msg: "Keep pressing <code>Ctrl+F</code> (or just press <b>Enter</b> to find the next one) to jump to each image tag one by one.\n\nChange the filename for each photo you want to swap. Press <code>Ctrl+S</code> when you're done.",
    choices: [
      { label: "✅ All done, saved!", next: "photos_preview" }
    ]
  },

  photos_preview: {
    msg: "Double-click the HTML file to open it in your browser — do you see your photo?",
    choices: [
      { label: "✅ Yes! My photo is showing", next: "photos_done" },
      { label: "❓ I see a broken image / blank box", next: "help_broken_image" }
    ]
  },

  photos_done: {
    msg: "Your photos are in! 🖼️ That always makes such a big difference — now it really feels like YOUR website.\n\nWhat's next?",
    choices: [
      { label: "🎨 Change the colors", next: "colors_intro" },
      { label: "✏️ Still need to edit some text", next: "edit_which_page" },
      { label: "🌐 Get my site online!", next: "netlify_intro" }
    ]
  },

  // ── COLORS ──────────────────────────────────────────────────
  colors_intro: {
    msg: "Want to change the colors to match your brand? Good news — your whole color scheme lives in ONE place in each file. Change it there and every button, heading, and banner updates automatically.\n\nFirst, do you know your brand colors?",
    choices: [
      { label: "✅ Yes I know my colors", next: "colors_have_hex" },
      { label: "❓ What is a hex code?", next: "colors_hex_explain" },
      { label: "❓ I need help picking colors", next: "colors_pick" }
    ]
  },

  colors_hex_explain: {
    msg: "A <b>hex code</b> is just a color written in a way computers understand.\n\nEvery color has one. It always starts with a <b>#</b> sign and has 6 letters/numbers after it.\n\nExamples:\n• <b>#1B2F4E</b> = dark navy blue\n• <b>#C9922B</b> = gold\n• <b>#ef4444</b> = red\n• <b>#22c55e</b> = green\n\nYou just look up the color you want and copy the code. Easy!",
    choices: [
      { label: "✅ Got it! How do I find mine?", next: "colors_pick" }
    ]
  },

  colors_pick: {
    msg: "Two easy ways to find your color codes:\n\n<b>Option 1:</b> Google the words <b>color picker</b> — a rainbow wheel appears right in Google. Click your color, it shows the hex code automatically.\n\n<b>Option 2:</b> Go to <b>coolors.co</b> and press the spacebar to browse beautiful color palettes. Click any color to see its code.\n\nWrite down two codes — one for your main color, one for your accent color.",
    choices: [
      { label: "✅ I have my two hex codes!", next: "colors_have_hex" }
    ]
  },

  colors_have_hex: {
    msg: "Open <b>index.html</b> in Notepad. Press <code>Ctrl+F</code> and search for:\n<b>--primary</b>\n\nYou'll see a line that looks like:\n<code>--primary: #1a3d6b;</code>\n\nThat's your main dark color. Press <code>Ctrl+H</code>:\n• <b>Find what:</b> #1a3d6b\n• <b>Replace with:</b> your main color hex code\n\nReplace All.",
    choices: [
      { label: "✅ Done!", next: "colors_accent" }
    ]
  },

  colors_accent: {
    msg: "Now the accent color — that's the bright highlight color on buttons and links.\n\nPress <code>Ctrl+H</code>:\n• <b>Find what:</b> #e8520a\n• <b>Replace with:</b> your accent color hex code\n\nReplace All. Then press <code>Ctrl+S</code> and double-click the file to preview in your browser!",
    choices: [
      { label: "✅ Love my new colors!", next: "colors_other_pages" },
      { label: "❓ The colors didn't change", next: "help_colors_no_change" }
    ]
  },

  colors_other_pages: {
    msg: "Looking good! 🎨 Now do the exact same thing on each of the other 4 pages — open each one in Notepad and use <code>Ctrl+H</code> to replace the same hex codes.\n\nSame two replacements on every file:\n• <b>#1a3d6b</b> → your main color\n• <b>#e8520a</b> → your accent color",
    choices: [
      { label: "✅ Done all 5 pages!", next: "colors_done" },
      { label: "⏭️ I'll do the rest later", next: "colors_done" }
    ]
  },

  colors_done: {
    msg: "Colors done! ✅ Your site is really starting to look like yours now.\n\nWhat's next?",
    choices: [
      { label: "🌐 Get my site online!", next: "netlify_intro" },
      { label: "✏️ Still need to edit text", next: "edit_which_page" },
      { label: "📸 Swap photos", next: "photos_intro" }
    ]
  },

  // ── NETLIFY ─────────────────────────────────────────────────
  netlify_intro: {
    msg: "Let's get your site on the internet! 🌐\n\nThis is free and takes about 2 minutes. You're going to drag your website folder onto a website and it goes live instantly.\n\nIs your website folder ready? (All your HTML files edited and saved?)",
    choices: [
      { label: "✅ Yes, everything is saved", next: "netlify_go" },
      { label: "❓ I still need to finish editing", next: "edit_which_page" }
    ]
  },

  netlify_go: {
    msg: "Great! Here's what to do:\n\n1. Open your browser and go to: <b>app.netlify.com/drop</b>\n2. You'll see a big dashed box that says <b>\"Drag and drop your site folder here\"</b>\n\nGot that page open?",
    choices: [
      { label: "✅ I see the drag and drop box", next: "netlify_drag" }
    ]
  },

  netlify_drag: {
    msg: "Now open your File Explorer (Windows) or Finder (Mac) so you can see your website folder.\n\nClick on your website folder, hold the mouse button down, drag it over to the browser window, and drop it onto that dashed box.\n\nThe whole folder goes in at once — don't drag individual files!",
    choices: [
      { label: "✅ I dropped it!", next: "netlify_live" },
      { label: "❓ How do I drag and drop?", next: "help_drag_drop" }
    ]
  },

  netlify_live: {
    msg: "🎉 YOUR SITE IS LIVE!\n\nNetlify will show you a link — something like <b>cozy-wolf-abc123.netlify.app</b>. That's your real website on the internet right now!\n\nCopy that link and share it with someone. You did it! 🎊",
    choices: [
      { label: "✅ I can see my site!", next: "netlify_done" },
      { label: "❓ I got an error", next: "help_netlify_error" }
    ]
  },

  netlify_done: {
    msg: "You have a live website! 🌟\n\nWant to update it later? Just make your changes in Notepad, save, then drag the folder onto app.netlify.com/drop again. It updates in seconds.\n\nIs there anything else you need help with?",
    choices: [
      { label: "✏️ I need to edit more text", next: "edit_which_page" },
      { label: "📸 I want to add more photos", next: "photos_intro" },
      { label: "🎉 I'm all done — thank you!", next: "all_done" }
    ]
  },

  all_done: {
    msg: "You built your own website. That's genuinely impressive — most people never do it. 🏆\n\nWant a custom domain (yourbusiness.com), Google to find you, or someone to handle the whole thing? Mel's got you.\n\n👉 sitesbymel.com/services\n\nGood luck with your business! 💪",
    choices: [
      { label: "↩ Start over", next: "welcome" }
    ]
  },

  // ── HELP NODES ──────────────────────────────────────────────
  help_notepad: {
    msg: "No problem! Here's exactly how to open Notepad:\n\n1. Open your website folder\n2. Find the file (like <b>index.html</b>)\n3. <b>Right-click</b> on it (click the RIGHT mouse button)\n4. A menu pops up — look for <b>Open with</b>\n5. Click <b>Open with</b>, then click <b>Notepad</b>\n\nIf you don't see Notepad in the list, click <b>Choose another app</b> and look for it there.",
    choices: [
      { label: "✅ Got it open!", next: "edit_which_page" },
      { label: "❓ Still can't find it", next: "help_notepad_missing" }
    ]
  },

  help_notepad_missing: {
    msg: "If Notepad doesn't appear in the list:\n\n1. Click <b>Choose another app</b>\n2. Scroll down and click <b>More apps</b>\n3. Scroll until you see <b>Notepad</b> and click it\n\nOn a Mac? Right-click → Open with → <b>TextEdit</b>. If TextEdit isn't there, click <b>Other</b> and find it in your Applications folder.",
    choices: [
      { label: "✅ Found it, I'm in!", next: "edit_which_page" }
    ]
  },

  help_ctrlh: {
    msg: "Make sure the Notepad window is the active window (click inside it first).\n\nThen hold down the <b>Ctrl</b> key (bottom left of keyboard) and while holding it, press the <b>H</b> key.\n\nA small box should pop up with two fields — Find what and Replace with.\n\nIf nothing happens, try clicking somewhere inside the Notepad text first, then try Ctrl+H again.",
    choices: [
      { label: "✅ The box appeared!", next: "home_name" },
      { label: "❓ Still nothing happening", next: "help_ctrlh2" }
    ]
  },

  help_ctrlh2: {
    msg: "Try this: in Notepad, click the word <b>Edit</b> in the top menu bar. You should see <b>Replace...</b> in the dropdown. Click that — it opens the same box.\n\nOn a Mac in TextEdit: click <b>Edit</b> in the top menu → <b>Find</b> → <b>Find and Replace</b>.",
    choices: [
      { label: "✅ Found Replace in the menu!", next: "home_name" }
    ]
  },

  help_nothing_changed: {
    msg: "This usually means the text wasn't found exactly. A few things to check:\n\n• Make sure you typed it exactly right — capital F in FitLife matters\n• Check that you're searching in the right file\n• Try searching for just part of the word — like just <b>Fit</b>\n\nIf you find it that way, then you can replace the whole thing.",
    choices: [
      { label: "✅ Found it!", next: "home_name" }
    ]
  },

  help_tagline: {
    msg: "A tagline is a short sentence that sums up what you do and who you help. Think of it as your headline.\n\nExamples:\n• <i>\"Portland's Most Results-Driven Personal Trainer\"</i>\n• <i>\"Helping Busy People Get Fit in 30 Minutes a Day\"</i>\n• <i>\"Real Results. No Gimmicks. Just Hard Work.\"</i>\n\nKeep it under 10 words. It doesn't have to be perfect — you can always change it later!",
    choices: [
      { label: "✅ Got my tagline!", next: "home_city" }
    ]
  },

  help_no_phone: {
    msg: "That's okay! A few options:\n\n• Use your personal cell for now — you can always change it later\n• Get a free Google Voice number at voice.google.com — it gives you a real local number that rings to your phone\n• Leave the phone number out for now — delete it from the template\n\nWhat would you like to do?",
    choices: [
      { label: "✅ I'll use my cell for now", next: "home_testimonials" },
      { label: "⏭️ I'll delete the phone number", next: "home_testimonials" }
    ]
  },

  help_no_reviews: {
    msg: "No real reviews yet? That's totally normal if you're just starting out. Here's what to do:\n\n• Delete the fake testimonials for now — better to have none than fake ones\n• Or reach out to 1-2 people you've trained (even friends/family) and ask for a quick honest quote\n• Add real reviews as soon as you get them!\n\nTo delete a testimonial: press <code>Ctrl+F</code>, find the quote, select all the text from the opening quote mark to the client name, and delete it.",
    choices: [
      { label: "✅ Got it, I'll handle the reviews", next: "home_save" }
    ]
  },

  help_preview: {
    msg: "A few things to check:\n\n• Did you press <code>Ctrl+S</code> to save before opening in browser?\n• Try pressing <code>F5</code> in your browser to refresh\n• Make sure you're opening the right file — double-click the actual .html file, not the zip\n\nStill looks wrong? Tell me what you're seeing:",
    choices: [
      { label: "❓ My text changes aren't showing", next: "help_preview_text" },
      { label: "❓ The layout looks broken", next: "help_layout_broken" },
      { label: "✅ Nevermind, it's working now!", next: "welcome" }
    ]
  },

  help_preview_text: {
    msg: "If your text changes aren't showing:\n\n1. Go back to Notepad\n2. Press <code>Ctrl+S</code> to make sure it's saved\n3. Go to your browser\n4. Press <code>Ctrl+F5</code> (hard refresh) — this forces the browser to reload fresh\n\nStill not showing? Make sure you didn't accidentally open a different copy of the file.",
    choices: [
      { label: "✅ Now I can see my changes!", next: "welcome" }
    ]
  },

  help_layout_broken: {
    msg: "If the layout looks broken or weird, it usually means a tag got accidentally deleted while editing.\n\nThe most important rule in Notepad: <b>only change the words between the tags, not the tags themselves</b>.\n\nTags look like: <code>&lt;p&gt;</code> and <code>&lt;/p&gt;</code> — never delete the angle bracket parts.\n\nIf something got broken, press <code>Ctrl+Z</code> in Notepad to undo your last change. Keep pressing until it looks right, then try again more carefully.",
    choices: [
      { label: "✅ Fixed it with Ctrl+Z!", next: "welcome" },
      { label: "❓ Still broken", next: "help_really_broken" }
    ]
  },

  help_really_broken: {
    msg: "If you can't undo your way out, the easiest fix is to get a fresh copy of the template file.\n\nGo back to your original ZIP file and unzip it again — you'll have a fresh clean copy. Then redo your edits, being careful not to touch anything inside < > brackets.",
    choices: [
      { label: "✅ Got a fresh copy, starting again", next: "edit_which_page" }
    ]
  },

  help_story: {
    msg: "Your About page story doesn't have to be long — it just has to be real. Here's a simple template:\n\n<i>\"[Your name] started [your business] after [what led you here]. With [X years] of experience, [what makes you different]. Based in [your city], [your business] has helped [who you help] to [what result].</i>\"\n\nJust fill in the blanks — even 3–4 sentences is enough. Real beats perfect every time.",
    choices: [
      { label: "✅ I've written something!", next: "about_certs" }
    ]
  },

  help_no_certs: {
    msg: "No certifications yet? No problem. A few options:\n\n• Delete the certifications line entirely\n• Replace it with years of experience: <i>\"10+ Years Experience\"</i>\n• Replace it with your specialty: <i>\"Specializing in Weight Loss & Strength Training\"</i>\n\nYou don't need letters after your name to be great at what you do.",
    choices: [
      { label: "✅ Got it, moving on!", next: "about_stats" }
    ]
  },

  help_new_business: {
    msg: "Just starting out? Be honest — it actually builds trust.\n\nInstead of <b>8+ Years</b>, try:\n• <b>New & Passionate</b>\n• <b>1st Year</b>\n• Or just delete the stats section\n\nFor client count: if you have any clients at all, count them! Even 5 real clients is worth saying.",
    choices: [
      { label: "✅ Got it!", next: "about_testimonials" }
    ]
  },

  help_no_prices: {
    msg: "Not sure what to charge? A few ways to figure it out:\n\n• Look at what other trainers in your area charge\n• Start at a price you feel confident defending\n• You can always change prices later — just edit the file and redrop to Netlify\n\nDon't leave the fake prices in — real (even if imperfect) prices build credibility.",
    choices: [
      { label: "✅ I'll set my prices now", next: "services_prices" }
    ]
  },

  help_no_address: {
    msg: "If you're online-only or work from home:\n\nPress <code>Ctrl+F</code> and search for <b>789 Iron Street</b> to find the address. Then select everything from the street to the zip code and delete it.\n\nYou can replace it with something like: <i>\"Serving clients online nationwide\"</i> or just leave that section blank.",
    choices: [
      { label: "✅ Got it!", next: "contact_phone" }
    ]
  },

  help_delete_section: {
    msg: "To delete a whole section, press <code>Ctrl+F</code> to find the text that starts the section. Then carefully select from there to the end of the section and delete.\n\n<b>Important:</b> Don't delete the tags — look for the section that ends with something like <code>&lt;/div&gt;</code> and make sure you remove everything including that closing tag.\n\nIf you accidentally break something, press <code>Ctrl+Z</code> to undo.",
    choices: [
      { label: "✅ Got it!", next: "contact_formspree" }
    ]
  },

  help_images_folder: {
    msg: "Open your website folder — the one with all the .html files in it.\n\nInside that folder, look for a folder called <b>images</b>. It should be right there alongside index.html, about.html, etc.\n\nIf you don't see it, make sure you unzipped the folder fully — don't work from inside the zip file!",
    choices: [
      { label: "✅ Found the images folder!", next: "photos_find" }
    ]
  },

  help_img_src: {
    msg: "Make sure you searched for <b>img src</b> exactly — lowercase, with a space between img and src.\n\nIf it really isn't finding anything, you may be on a page that has photos in a different format. Try searching for just <b>.jpg</b> or <b>.png</b> — that will find any image filename on the page.",
    choices: [
      { label: "✅ Found the image!", next: "photos_replace" }
    ]
  },

  help_broken_image: {
    msg: "A broken image usually means one of these:\n\n• The filename doesn't match exactly — check spelling and capitalization\n• You forgot the file extension — it needs <b>.jpg</b> or <b>.png</b> at the end\n• The photo isn't in the <b>images</b> folder — double check it's there\n• You have a space in the filename — rename it with no spaces (use-dashes-instead.jpg)\n\nFix the filename and try again!",
    choices: [
      { label: "✅ Fixed it!", next: "photos_done" }
    ]
  },

  help_colors_no_change: {
    msg: "If colors didn't change, check:\n\n• Did you press <code>Ctrl+S</code> to save?\n• Did you press <code>F5</code> in your browser to refresh?\n• Make sure the hex code you searched for was exactly right — it's case-sensitive\n\nTry doing a <code>Ctrl+F</code> first to find <b>#1a3d6b</b> and confirm it's there before replacing.",
    choices: [
      { label: "✅ Found it and replaced it!", next: "colors_accent" }
    ]
  },

  help_drag_drop: {
    msg: "Dragging and dropping:\n\n1. Open your <b>File Explorer</b> (the folder icon on your taskbar)\n2. Find your website folder\n3. Put your browser and File Explorer side by side on screen\n4. Click your website folder <b>once</b> to select it\n5. Hold the mouse button down\n6. While holding, move your mouse over to the browser\n7. Let go of the mouse button when you're over the dashed box\n\nThe folder should upload!",
    choices: [
      { label: "✅ It worked!", next: "netlify_live" },
      { label: "❓ Still not working", next: "help_netlify_error" }
    ]
  },

  help_netlify_error: {
    msg: "A few common fixes:\n\n• Make sure you're dropping the <b>whole folder</b>, not just one file\n• The folder must contain your index.html file directly inside it\n• Try a different browser — Chrome works best\n• Check your internet connection\n\nIf you're still stuck, email Mel at <b>mel@sitesbymel.com</b> and she can help!",
    choices: [
      { label: "✅ It worked!", next: "netlify_live" },
      { label: "📧 I'll email Mel for help", next: "all_done" }
    ]
  },

  stuck: {
    msg: "No worries — let's figure it out. What's going wrong?",
    choices: [
      { label: "❓ I can't open the file in Notepad", next: "help_notepad" },
      { label: "❓ Ctrl+H isn't working", next: "help_ctrlh" },
      { label: "❓ My changes aren't showing in browser", next: "help_preview" },
      { label: "❓ A photo isn't showing up", next: "help_broken_image" },
      { label: "❓ The layout looks broken", next: "help_layout_broken" },
      { label: "❓ Netlify isn't working", next: "help_netlify_error" },
      { label: "❓ Something else", next: "stuck_other" }
    ]
  },

  stuck_other: {
    msg: "If you're stuck on something not listed here, email Mel directly — she's happy to help.\n\n📧 <b>mel@sitesbymel.com</b>\n\nDescribe what you're trying to do and what's happening, and she'll get you sorted!",
    choices: [
      { label: "↩ Back to main menu", next: "welcome" }
    ]
  }

};

let melBotOpen = false;

function melBotToggle() {
  melBotOpen = !melBotOpen;
  document.getElementById('mel-bot-window').style.display = melBotOpen ? 'flex' : 'none';
  if (melBotOpen && document.getElementById('mel-bot-messages').children.length === 0) {
    melBotStart();
  }
}

function melBotStart() {
  document.getElementById('mel-bot-messages').innerHTML = '';
  melBotShow('welcome');
}

function melBotShow(nodeId) {
  const node = BOT[nodeId];
  if (!node) return;
  const msgs = document.getElementById('mel-bot-messages');
  const choices = document.getElementById('mel-bot-choices');

  const msgEl = document.createElement('div');
  msgEl.className = 'bot-msg';
  msgEl.innerHTML = node.msg.replace(/\\n/g, '<br>');
  msgs.appendChild(msgEl);
  msgs.scrollTop = msgs.scrollHeight;

  choices.innerHTML = '';
  node.choices.forEach(c => {
    const btn = document.createElement('button');
    btn.className = 'bot-choice';
    btn.textContent = c.label;
    btn.onclick = () => {
      const userEl = document.createElement('div');
      userEl.style.cssText = 'background:#1B2F4E;color:#fff;border-radius:12px 12px 2px 12px;padding:8px 12px;font-size:.82rem;align-self:flex-end;max-width:80%';
      userEl.textContent = c.label;
      msgs.appendChild(userEl);
      msgs.scrollTop = msgs.scrollHeight;
      setTimeout(() => melBotShow(c.next), 300);
    };
    choices.appendChild(btn);
  });
}

window._melBotReady = true;
melBotStart();
});
}
<\/script>`;
}

module.exports = { getFitLifeBotScript };
