// Chat bot script for FitLife template
// Injected into every HTML page + INSTRUCTIONS.html
// Auto-hides when site is live online — only shows on local file://

function getFitLifeBotScript() {
  return `
<script>
if (window.location.protocol === 'file:') {
(function() {
  var css = '<style>' +
    '#mel-bot-bubble{position:fixed;bottom:24px;right:24px;z-index:9999;width:52px;height:52px;border-radius:50%;background:#1B2F4E;color:#fff;border:none;font-size:1.5rem;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center;transition:transform .2s}' +
    '#mel-bot-bubble:hover{transform:scale(1.08)}' +
    '#mel-bot-window{position:fixed;bottom:90px;right:24px;z-index:9999;width:340px;max-height:520px;background:#fff;border-radius:16px;box-shadow:0 8px 40px rgba(0,0,0,0.18);display:none;flex-direction:column;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}' +
    '#mel-bot-header{background:#1B2F4E;color:#fff;padding:14px 18px;display:flex;align-items:center;gap:10px}' +
    '#mel-bot-header span{font-size:.9rem;font-weight:700}' +
    '#mel-bot-header small{font-size:.72rem;opacity:.7;display:block}' +
    '#mel-bot-messages{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px;max-height:340px}' +
    '.bot-msg{background:#f0f4ff;border-radius:12px 12px 12px 2px;padding:10px 14px;font-size:.83rem;line-height:1.6;color:#1a1a1a;max-width:90%}' +
    '.bot-msg code{background:#1B2F4E;color:#fff;padding:2px 7px;border-radius:4px;font-size:.78rem;font-family:monospace}' +
    '.bot-msg b{color:#1B2F4E}' +
    '#mel-bot-choices{padding:10px 14px 14px;display:flex;flex-direction:column;gap:6px}' +
    '.bot-choice{background:#fff;border:1.5px solid #1B2F4E;color:#1B2F4E;border-radius:8px;padding:8px 12px;font-size:.82rem;font-weight:600;cursor:pointer;text-align:left;transition:background .15s,color .15s}' +
    '.bot-choice:hover{background:#1B2F4E;color:#fff}' +
    '#mel-bot-restart{font-size:.72rem;color:#9CA3AF;text-align:center;padding-bottom:10px;cursor:pointer;text-decoration:underline}' +
    '</style>';

  var html =
    '<button id="mel-bot-bubble" title="Get help">&#x1F916;</button>' +
    '<div id="mel-bot-window">' +
      '<div id="mel-bot-header">' +
        '<div><span>Mel\'s Setup Assistant</span><small>I\'ll walk you through every step</small></div>' +
        '<button id="mel-bot-close" style="margin-left:auto;background:none;border:none;color:#fff;font-size:1.1rem;cursor:pointer">&#x2715;</button>' +
      '</div>' +
      '<div id="mel-bot-messages"></div>' +
      '<div id="mel-bot-choices"></div>' +
      '<div id="mel-bot-restart">&#x21A9; Start over</div>' +
    '</div>';

  var el = document.createElement('div');
  el.innerHTML = css + html;
  document.body.appendChild(el);

  var BOT = {
    welcome: {
      msg: "Hi! &#x1F44B; I'm Mel's setup assistant and I'm going to walk you through every single step.<br><br><b>Quick tip before we start:</b> Keep this browser window open while you work. Open your page in <b>Notepad</b> to edit, and keep the <b>browser</b> open to preview and get help from me. I'll be right here!<br><br>What do you want to do first?",
      choices: [
        { label: "✏️ Edit my business name & text", next: "edit_which_page" },
        { label: "📸 Swap out the photos", next: "photos_intro" },
        { label: "🎨 Change the colors", next: "colors_intro" },
        { label: "🌐 Get my site live online", next: "netlify_intro" },
        { label: "😰 I'm stuck / something went wrong", next: "stuck" }
      ]
    },
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
    home_intro: {
      msg: "Let's edit your Home page. First — open your website folder, right-click the file called <b>index.html</b>, choose <b>Open with</b>, then choose <b>Notepad</b>.<br><br>Got it open?",
      choices: [
        { label: "✅ Yes, it's open", next: "home_name" },
        { label: "❓ I can't find Notepad", next: "help_notepad" }
      ]
    },
    home_name: {
      msg: "Perfect. Let's start with your business name. The template uses <b>FitLife</b> everywhere.<br><br>Press <code>Ctrl+H</code> on your keyboard. A box pops up with two fields:<br>• <b>Find what:</b> type FitLife<br>• <b>Replace with:</b> type YOUR business name<br><br>Then click <b>Replace All</b>.<br><br>Did that work?",
      choices: [
        { label: "✅ Yes! Name is updated", next: "home_tagline" },
        { label: "❓ I don't see the Ctrl+H box", next: "help_ctrlh" },
        { label: "❓ Nothing changed", next: "help_nothing_changed" }
      ]
    },
    home_tagline: {
      msg: 'Amazing! Now let\'s swap the tagline. The template says:<br><br><b>"Transform Your Body. Transform Your Life."</b><br><br>Press <code>Ctrl+H</code> again:<br>• <b>Find what:</b> Transform Your Body. Transform Your Life.<br>• <b>Replace with:</b> YOUR tagline<br><br>If you don\'t have a tagline yet, try something simple like <i>"Portland\'s Best Personal Trainer"</i> — you can always change it later.',
      choices: [
        { label: "✅ Done!", next: "home_city" },
        { label: "❓ What's a tagline?", next: "help_tagline" }
      ]
    },
    home_city: {
      msg: "Now replace the city. The template says <b>Portland</b> in several spots.<br><br>Press <code>Ctrl+H</code>:<br>• <b>Find what:</b> Portland<br>• <b>Replace with:</b> YOUR city<br><br>Click Replace All.",
      choices: [{ label: "✅ Done!", next: "home_phone" }]
    },
    home_phone: {
      msg: "Now your phone number. The template has <b>(555) 123-4567</b>.<br><br>Press <code>Ctrl+H</code>:<br>• <b>Find what:</b> (555) 123-4567<br>• <b>Replace with:</b> your real phone number<br><br>Click Replace All.",
      choices: [
        { label: "✅ Done!", next: "home_testimonials" },
        { label: "❓ I don't have a business number yet", next: "help_no_phone" }
      ]
    },
    home_testimonials: {
      msg: "The home page has fake customer reviews from <b>Jennifer M.</b> and <b>Todd K.</b> — replace those with real reviews from your actual clients.<br><br>Press <code>Ctrl+H</code>:<br>• <b>Find what:</b> Jennifer M.<br>• <b>Replace with:</b> your real client's name<br><br>Then do the same for Todd K. and replace the quote text too.",
      choices: [
        { label: "✅ Yes, I'll add my real reviews", next: "home_save" },
        { label: "❓ I don't have reviews yet", next: "help_no_reviews" }
      ]
    },
    home_save: {
      msg: "You're doing great! 🎉 Now save everything.<br><br>Press <code>Ctrl+S</code> on your keyboard. Then double-click <b>index.html</b> in your folder to open it in your browser and see how it looks!",
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
    about_intro: {
      msg: "The About page has the most to change — it tells YOUR story. Right-click <b>about.html</b> → Open with → Notepad.<br><br>Ready?",
      choices: [
        { label: "✅ It's open", next: "about_trainer_name" },
        { label: "❓ Need help opening it", next: "help_notepad" }
      ]
    },
    about_trainer_name: {
      msg: "The template uses a fictional trainer named <b>Marcus</b>. Let's replace that with your name.<br><br>Press <code>Ctrl+H</code>:<br>• <b>Find what:</b> Marcus<br>• <b>Replace with:</b> YOUR name<br><br>Click Replace All.",
      choices: [{ label: "✅ Done!", next: "about_fitlife_name" }]
    },
    about_fitlife_name: {
      msg: "Now replace <b>FitLife</b> with your business name on this page too.<br><br>Press <code>Ctrl+H</code>:<br>• <b>Find what:</b> FitLife<br>• <b>Replace with:</b> your business name<br><br>Replace All.",
      choices: [{ label: "✅ Done!", next: "about_story" }]
    },
    about_story: {
      msg: "Now the personal story. The template has Marcus's fictional background. This needs to be YOUR story.<br><br>Press <code>Ctrl+F</code> and search for: <b>Marcus grew up in Portland</b><br><br>That will highlight the paragraph. Click on it and type your own story. Keep it real and personal!",
      choices: [
        { label: "✅ I've written my story", next: "about_certs" },
        { label: "❓ I don't know what to write", next: "help_story" }
      ]
    },
    about_certs: {
      msg: "The template lists certifications: <b>NASM-CPT | ACE-GFI | Precision Nutrition Level 2</b><br><br>Replace these with YOUR actual certifications using <code>Ctrl+H</code>. If you don't have certifications yet, just delete that line.",
      choices: [
        { label: "✅ Done!", next: "about_stats" },
        { label: "❓ I don't have certifications yet", next: "help_no_certs" }
      ]
    },
    about_stats: {
      msg: "The template shows stats like <b>8+ Years Coaching</b> and <b>500+ clients</b>.<br><br>Press <code>Ctrl+H</code> and replace these with your real numbers. Be honest — authenticity builds trust.",
      choices: [
        { label: "✅ Done!", next: "about_testimonials" },
        { label: "❓ I'm just starting out", next: "help_new_business" }
      ]
    },
    about_testimonials: {
      msg: "The About page has fake testimonials from <b>Sandra & Mike T.</b> Replace those with real quotes from happy clients.<br><br>Press <code>Ctrl+F</code> and search for <b>Sandra</b> to find them. No real reviews yet? Just delete those sections.",
      choices: [{ label: "✅ Done!", next: "about_save" }]
    },
    about_save: {
      msg: "Save it! Press <code>Ctrl+S</code>.<br><br>Then double-click <b>about.html</b> to preview it in your browser. Your story, your name, your certs. That's your page! 🎉",
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
    services_intro: {
      msg: "The Services page has all your programs and prices. Right-click <b>services.html</b> → Open with → Notepad.",
      choices: [{ label: "✅ It's open", next: "services_name" }]
    },
    services_name: {
      msg: "First, replace <b>FitLife</b> with your business name on this page.<br><br>Press <code>Ctrl+H</code>:<br>• <b>Find what:</b> FitLife<br>• <b>Replace with:</b> your business name<br><br>Replace All.",
      choices: [{ label: "✅ Done!", next: "services_prices" }]
    },
    services_prices: {
      msg: "Now let's fix the prices. The template has example prices like <b>$99/mo</b>, <b>$149</b>, <b>$199</b>, <b>$295</b>, etc.<br><br>Press <code>Ctrl+H</code> for each one and replace with YOUR real prices.",
      choices: [
        { label: "✅ Prices updated!", next: "services_names" },
        { label: "❓ I haven't set my prices yet", next: "help_no_prices" }
      ]
    },
    services_names: {
      msg: "Now update the service names if needed. The template has Personal Training, Nutrition Coaching, Group Classes, etc. If your services are named differently, swap them with <code>Ctrl+H</code>.",
      choices: [{ label: "✅ Done!", next: "services_descriptions" }]
    },
    services_descriptions: {
      msg: "Read through the service descriptions. Do they describe YOUR business? If not, press <code>Ctrl+F</code> to find the text, click on it, and type your own description.<br><br>Tip: keep it short and benefit-focused.",
      choices: [{ label: "✅ Descriptions updated!", next: "services_save" }]
    },
    services_save: {
      msg: "Press <code>Ctrl+S</code> to save. Then double-click <b>services.html</b> to preview it in your browser. 💪",
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
    contact_intro: {
      msg: "The Contact page has your address, phone, hours, and the booking form. Right-click <b>contact.html</b> → Open with → Notepad.",
      choices: [{ label: "✅ It's open", next: "contact_address" }]
    },
    contact_address: {
      msg: "The template has this fake address: <b>789 Iron Street, Unit 4</b><br><br>Press <code>Ctrl+H</code>:<br>• <b>Find what:</b> 789 Iron Street, Unit 4<br>• <b>Replace with:</b> your real address<br><br>If you work online only, you can delete the address entirely.",
      choices: [
        { label: "✅ Done!", next: "contact_city_zip" },
        { label: "❓ I work online / from home", next: "help_no_address" }
      ]
    },
    contact_city_zip: {
      msg: "Now the city and zip. The template has <b>Portland, OR 97209</b>.<br><br>Press <code>Ctrl+H</code> and replace with your city, state, and zip.",
      choices: [{ label: "✅ Done!", next: "contact_phone" }]
    },
    contact_phone: {
      msg: "Replace the phone number <b>(555) 123-4567</b>.<br><br>Press <code>Ctrl+H</code>:<br>• <b>Find what:</b> (555) 123-4567<br>• <b>Replace with:</b> your number",
      choices: [{ label: "✅ Done!", next: "contact_hours" }]
    },
    contact_hours: {
      msg: "The template has hours: <b>Mon–Fri: 5:30am–8pm</b>, Saturday: 7am–2pm, Sunday: 7am–12pm.<br><br>Press <code>Ctrl+F</code> and search for <b>5:30am</b> to find them. Click and type your real hours.",
      choices: [
        { label: "✅ Hours updated!", next: "contact_formspree" },
        { label: "❓ I want to delete the hours section", next: "help_delete_section" }
      ]
    },
    contact_formspree: {
      msg: "Now let's activate your contact form! ✉️<br><br>1. Go to <b>formspree.io</b><br>2. Sign up free<br>3. Click <b>New Form</b><br>4. Copy your Form ID (looks like <b>xabcdefg</b>)<br><br>Got your Form ID?",
      choices: [
        { label: "✅ Yes, I have my Form ID", next: "contact_formspree_paste" },
        { label: "❓ I'll do this later", next: "contact_calendly" }
      ]
    },
    contact_formspree_paste: {
      msg: "In Notepad, press <code>Ctrl+H</code>:<br>• <b>Find what:</b> YOUR_FORM_ID<br>• <b>Replace with:</b> your actual Form ID<br><br>Click Replace All. Now when someone fills out your form, you get an email!",
      choices: [{ label: "✅ Done!", next: "contact_calendly" }]
    },
    contact_calendly: {
      msg: "The page also has a booking button for online scheduling using <b>Calendly</b> — free to set up at calendly.com.<br><br>Then press <code>Ctrl+H</code>:<br>• <b>Find what:</b> YOUR_CALENDLY_LINK<br>• <b>Replace with:</b> your Calendly link",
      choices: [
        { label: "✅ Done, link is in!", next: "contact_save" },
        { label: "⏭️ Skip for now", next: "contact_save" }
      ]
    },
    contact_save: {
      msg: "Press <code>Ctrl+S</code> to save. Then double-click <b>contact.html</b> to preview in your browser. 📞",
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
    gallery_intro: {
      msg: "The Gallery page is all photos — before/afters, your gym, clients in action. The easiest way to update photos is through the Photos section. Want to do that now?",
      choices: [
        { label: "✅ Yes, show me how to swap photos", next: "photos_intro" },
        { label: "⏭️ I'll do photos later", next: "edit_which_page" }
      ]
    },
    photos_intro: {
      msg: "Swapping photos is easier than it sounds. You're just telling the website which photo file to show.<br><br>Do you have photos on your computer you want to use?",
      choices: [
        { label: "✅ Yes I have photos ready", next: "photos_copy" },
        { label: "❓ I need free photos to use", next: "photos_free" },
        { label: "❓ What size should my photos be?", next: "photos_size" }
      ]
    },
    photos_free: {
      msg: "No problem! Great free photo sites:<br><br>• <b>unsplash.com</b> — beautiful professional photos<br>• <b>pexels.com</b> — great variety, all free<br><br>Search for <i>\"personal trainer\"</i> or <i>\"gym workout\"</i>. Download, then come back here.",
      choices: [{ label: "✅ Got my photos, ready to continue", next: "photos_copy" }]
    },
    photos_size: {
      msg: "For best results:<br>• Banner/hero photos: <b>wide landscape</b>, at least 1200px wide<br>• Square/profile photos: <b>at least 500x500px</b><br>• Keep each file under <b>500KB</b> for fast loading<br><br>Need to compress? Go to <b>squoosh.app</b> — free, no signup.",
      choices: [{ label: "✅ Got it, my photos are ready", next: "photos_copy" }]
    },
    photos_copy: {
      msg: "Step 1: Copy your photo into the right folder.<br><br>Open your website folder. Inside it you'll see a folder called <b>images</b>. Copy your photo file into that <b>images</b> folder.<br><br>Tip: rename your photo something simple with no spaces — like <b>my-photo.jpg</b>.",
      choices: [
        { label: "✅ Photo is in the images folder", next: "photos_find" },
        { label: "❓ I can't find the images folder", next: "help_images_folder" }
      ]
    },
    photos_find: {
      msg: "Now open the HTML page where you want to change the photo in Notepad.<br><br>Press <code>Ctrl+F</code> and search for: <b>img src</b><br><br>This will highlight an image tag that looks like:<br><code>&lt;img src=\"images/hero.jpg\"&gt;</code><br><br>See it?",
      choices: [
        { label: "✅ Yes I can see it", next: "photos_replace" },
        { label: "❓ Nothing is highlighted", next: "help_img_src" }
      ]
    },
    photos_replace: {
      msg: "See the filename inside the quotes — like <b>hero.jpg</b>? Click on that filename and change it to the name of YOUR photo file.<br><br>For example: <code>images/hero.jpg</code> → <code>images/my-photo.jpg</code><br><br>Make sure the name matches EXACTLY. Then press <code>Ctrl+S</code> to save.",
      choices: [
        { label: "✅ Changed it and saved!", next: "photos_preview" },
        { label: "❓ I have more photos to change", next: "photos_multiple" }
      ]
    },
    photos_multiple: {
      msg: "Keep pressing <code>Ctrl+F</code> (or press <b>Enter</b> to find the next one) to jump to each image tag. Change the filename for each photo, then press <code>Ctrl+S</code> when done.",
      choices: [{ label: "✅ All done, saved!", next: "photos_preview" }]
    },
    photos_preview: {
      msg: "Double-click the HTML file to open it in your browser — do you see your photo?",
      choices: [
        { label: "✅ Yes! My photo is showing", next: "photos_done" },
        { label: "❓ I see a broken image / blank box", next: "help_broken_image" }
      ]
    },
    photos_done: {
      msg: "Your photos are in! 🖼️ Now it really feels like YOUR website.<br><br>What's next?",
      choices: [
        { label: "🎨 Change the colors", next: "colors_intro" },
        { label: "✏️ Still need to edit some text", next: "edit_which_page" },
        { label: "🌐 Get my site online!", next: "netlify_intro" }
      ]
    },
    colors_intro: {
      msg: "Want to change the colors to match your brand? Your whole color scheme lives in ONE place in each file. Change it there and everything updates automatically.<br><br>Do you know your brand colors?",
      choices: [
        { label: "✅ Yes I know my colors", next: "colors_have_hex" },
        { label: "❓ What is a hex code?", next: "colors_hex_explain" },
        { label: "❓ I need help picking colors", next: "colors_pick" }
      ]
    },
    colors_hex_explain: {
      msg: "A <b>hex code</b> is just a color written in a way computers understand.<br><br>It always starts with a <b>#</b> sign and has 6 letters/numbers after it.<br><br>Examples:<br>• <b>#1B2F4E</b> = dark navy blue<br>• <b>#C9922B</b> = gold<br>• <b>#ef4444</b> = red<br>• <b>#22c55e</b> = green",
      choices: [{ label: "✅ Got it! How do I find mine?", next: "colors_pick" }]
    },
    colors_pick: {
      msg: "Two easy ways to find your color codes:<br><br><b>Option 1:</b> Google the words <b>color picker</b> — a rainbow wheel appears right in Google. Click your color, it shows the hex code.<br><br><b>Option 2:</b> Go to <b>coolors.co</b> and press the spacebar to browse beautiful color palettes.",
      choices: [{ label: "✅ I have my two hex codes!", next: "colors_have_hex" }]
    },
    colors_have_hex: {
      msg: "Open <b>index.html</b> in Notepad. Press <code>Ctrl+F</code> and search for: <b>--primary</b><br><br>You'll see a line like: <code>--primary: #1a3d6b;</code><br><br>Press <code>Ctrl+H</code>:<br>• <b>Find what:</b> #1a3d6b<br>• <b>Replace with:</b> your main color hex code<br><br>Replace All.",
      choices: [{ label: "✅ Done!", next: "colors_accent" }]
    },
    colors_accent: {
      msg: "Now the accent color — buttons and highlights.<br><br>Press <code>Ctrl+H</code>:<br>• <b>Find what:</b> #e8520a<br>• <b>Replace with:</b> your accent color hex code<br><br>Replace All. Then <code>Ctrl+S</code> and preview in browser!",
      choices: [
        { label: "✅ Love my new colors!", next: "colors_other_pages" },
        { label: "❓ The colors didn't change", next: "help_colors_no_change" }
      ]
    },
    colors_other_pages: {
      msg: "Looking good! 🎨 Now do the exact same thing on each of the other 4 pages — open each one in Notepad and replace the same hex codes.<br><br>• <b>#1a3d6b</b> → your main color<br>• <b>#e8520a</b> → your accent color",
      choices: [
        { label: "✅ Done all 5 pages!", next: "colors_done" },
        { label: "⏭️ I'll do the rest later", next: "colors_done" }
      ]
    },
    colors_done: {
      msg: "Colors done! ✅ Your site is really starting to look like yours now.<br><br>What's next?",
      choices: [
        { label: "🌐 Get my site online!", next: "netlify_intro" },
        { label: "✏️ Still need to edit text", next: "edit_which_page" },
        { label: "📸 Swap photos", next: "photos_intro" }
      ]
    },
    netlify_intro: {
      msg: "Let's get your site on the internet! 🌐<br><br>This is free and takes about 2 minutes. You're going to drag your website folder onto a website and it goes live instantly.<br><br>Is your website folder ready? (All your HTML files edited and saved?)",
      choices: [
        { label: "✅ Yes, everything is saved", next: "netlify_go" },
        { label: "❓ I still need to finish editing", next: "edit_which_page" }
      ]
    },
    netlify_go: {
      msg: "Great! Here's what to do:<br><br>1. Open your browser and go to: <b>app.netlify.com/drop</b><br>2. You'll see a big dashed box that says <b>\"Drag and drop your site folder here\"</b><br><br>Got that page open?",
      choices: [{ label: "✅ I see the drag and drop box", next: "netlify_drag" }]
    },
    netlify_drag: {
      msg: "Now open your File Explorer so you can see your website folder.<br><br>Click on your website folder, hold the mouse button down, drag it over to the browser window, and drop it onto the dashed box.<br><br>Drop the whole folder — not individual files!",
      choices: [
        { label: "✅ I dropped it!", next: "netlify_live" },
        { label: "❓ How do I drag and drop?", next: "help_drag_drop" }
      ]
    },
    netlify_live: {
      msg: "🎉 YOUR SITE IS LIVE!<br><br>Netlify will show you a link — something like <b>cozy-wolf-abc123.netlify.app</b>. That's your real website on the internet right now!<br><br>Copy that link and share it with someone. You did it! 🎊",
      choices: [
        { label: "✅ I can see my site!", next: "netlify_done" },
        { label: "❓ I got an error", next: "help_netlify_error" }
      ]
    },
    netlify_done: {
      msg: "You have a live website! 🌟<br><br>Want to update it later? Just make changes in Notepad, save, then drag the folder onto app.netlify.com/drop again. It updates in seconds.<br><br>Is there anything else you need help with?",
      choices: [
        { label: "✏️ I need to edit more text", next: "edit_which_page" },
        { label: "📸 I want to add more photos", next: "photos_intro" },
        { label: "🎉 I'm all done — thank you!", next: "all_done" }
      ]
    },
    all_done: {
      msg: "You built your own website. That's genuinely impressive — most people never do it. 🏆<br><br>Want a custom domain (yourbusiness.com), Google to find you, or someone to handle the whole thing? Mel's got you.<br><br>👉 sitesbymel.com/services<br><br>Good luck with your business! 💪",
      choices: [{ label: "↩ Start over", next: "welcome" }]
    },
    help_notepad: {
      msg: "Here's exactly how to open Notepad:<br><br>1. Open your website folder<br>2. Find the file (like <b>index.html</b>)<br>3. <b>Right-click</b> on it (click the RIGHT mouse button)<br>4. A menu pops up — look for <b>Open with</b><br>5. Click <b>Open with</b>, then click <b>Notepad</b>",
      choices: [
        { label: "✅ Got it open!", next: "edit_which_page" },
        { label: "❓ Still can't find it", next: "help_notepad_missing" }
      ]
    },
    help_notepad_missing: {
      msg: "If Notepad doesn't appear:<br><br>1. Click <b>Choose another app</b><br>2. Scroll down and click <b>More apps</b><br>3. Scroll until you see <b>Notepad</b> and click it<br><br>On a Mac? Right-click → Open with → <b>TextEdit</b>.",
      choices: [{ label: "✅ Found it, I'm in!", next: "edit_which_page" }]
    },
    help_ctrlh: {
      msg: "Make sure the Notepad window is active (click inside it first).<br><br>Then hold down the <b>Ctrl</b> key (bottom left of keyboard) and while holding it, press the <b>H</b> key.<br><br>A small box should pop up with two fields — Find what and Replace with.",
      choices: [
        { label: "✅ The box appeared!", next: "home_name" },
        { label: "❓ Still nothing happening", next: "help_ctrlh2" }
      ]
    },
    help_ctrlh2: {
      msg: "Try this: in Notepad, click the word <b>Edit</b> in the top menu bar. You should see <b>Replace...</b> in the dropdown. Click that — it opens the same box.",
      choices: [{ label: "✅ Found Replace in the menu!", next: "home_name" }]
    },
    help_nothing_changed: {
      msg: "This usually means the text wasn't found exactly. Check:<br><br>• Make sure you typed it exactly right — capital F in FitLife matters<br>• Check that you're in the right file<br>• Try searching for just part of the word — like just <b>Fit</b>",
      choices: [{ label: "✅ Found it!", next: "home_name" }]
    },
    help_tagline: {
      msg: 'A tagline is a short sentence that sums up what you do. Examples:<br><br>• <i>"Portland\'s Most Results-Driven Personal Trainer"</i><br>• <i>"Helping Busy People Get Fit in 30 Minutes a Day"</i><br>• <i>"Real Results. No Gimmicks. Just Hard Work."</i><br><br>Keep it under 10 words. You can always change it later!',
      choices: [{ label: "✅ Got my tagline!", next: "home_city" }]
    },
    help_no_phone: {
      msg: "That's okay! Options:<br><br>• Use your personal cell for now<br>• Get a free Google Voice number at voice.google.com<br>• Delete the phone number from the template",
      choices: [
        { label: "✅ I'll use my cell for now", next: "home_testimonials" },
        { label: "⏭️ I'll delete the phone number", next: "home_testimonials" }
      ]
    },
    help_no_reviews: {
      msg: "No real reviews yet? That's totally normal. Options:<br><br>• Delete the fake testimonials for now<br>• Reach out to 1-2 people you've trained and ask for a quick honest quote<br>• Add real reviews as soon as you get them!",
      choices: [{ label: "✅ Got it, I'll handle the reviews", next: "home_save" }]
    },
    help_preview: {
      msg: "A few things to check:<br><br>• Did you press <code>Ctrl+S</code> to save?<br>• Try pressing <code>F5</code> in your browser to refresh<br>• Make sure you're opening the right file<br><br>Still looks wrong?",
      choices: [
        { label: "❓ My text changes aren't showing", next: "help_preview_text" },
        { label: "❓ The layout looks broken", next: "help_layout_broken" },
        { label: "✅ Nevermind, it's working now!", next: "welcome" }
      ]
    },
    help_preview_text: {
      msg: "If your text changes aren't showing:<br><br>1. Go back to Notepad<br>2. Press <code>Ctrl+S</code> to make sure it's saved<br>3. Go to your browser<br>4. Press <code>Ctrl+F5</code> (hard refresh)<br><br>Make sure you didn't accidentally open a different copy of the file.",
      choices: [{ label: "✅ Now I can see my changes!", next: "welcome" }]
    },
    help_layout_broken: {
      msg: "If the layout looks broken, it usually means a tag got accidentally deleted.<br><br>The most important rule: <b>only change the words between the tags, not the tags themselves</b>.<br><br>Tags look like: <code>&lt;p&gt;</code> and <code>&lt;/p&gt;</code> — never delete the angle bracket parts.<br><br>Press <code>Ctrl+Z</code> in Notepad to undo your last change.",
      choices: [
        { label: "✅ Fixed it with Ctrl+Z!", next: "welcome" },
        { label: "❓ Still broken", next: "help_really_broken" }
      ]
    },
    help_really_broken: {
      msg: "If you can't undo your way out, go back to your original ZIP file and unzip it again — you'll have a fresh clean copy. Then redo your edits, being careful not to touch anything inside &lt; &gt; brackets.",
      choices: [{ label: "✅ Got a fresh copy, starting again", next: "edit_which_page" }]
    },
    help_story: {
      msg: 'Your About page story doesn\'t have to be long — just real. Simple template:<br><br><i>"[Your name] started [your business] after [what led you here]. With [X years] of experience, [what makes you different]. Based in [your city], [your business] has helped [who you help] to [result]."</i><br><br>Even 3-4 sentences is enough.',
      choices: [{ label: "✅ I've written something!", next: "about_certs" }]
    },
    help_no_certs: {
      msg: "No certifications yet? No problem. Options:<br><br>• Delete the certifications line entirely<br>• Replace with years of experience: <i>\"10+ Years Experience\"</i><br>• Replace with your specialty: <i>\"Specializing in Weight Loss & Strength Training\"</i>",
      choices: [{ label: "✅ Got it, moving on!", next: "about_stats" }]
    },
    help_new_business: {
      msg: "Just starting out? Be honest — it actually builds trust.<br><br>Instead of 8+ Years, try:<br>• <b>New & Passionate</b><br>• <b>1st Year</b><br>• Or just delete the stats section<br><br>For client count: even 5 real clients is worth saying!",
      choices: [{ label: "✅ Got it!", next: "about_testimonials" }]
    },
    help_no_prices: {
      msg: "Not sure what to charge? Look at what other trainers in your area charge and start at a price you feel confident defending. You can always change prices later — just edit and re-upload.",
      choices: [{ label: "✅ I'll set my prices now", next: "services_prices" }]
    },
    help_no_address: {
      msg: "If you're online-only or work from home:<br><br>Press <code>Ctrl+F</code> and search for <b>789 Iron Street</b> to find the address. Select and delete it.<br><br>You can replace it with: <i>\"Serving clients online nationwide\"</i>",
      choices: [{ label: "✅ Got it!", next: "contact_phone" }]
    },
    help_delete_section: {
      msg: "To delete a whole section, press <code>Ctrl+F</code> to find the text that starts it. Then carefully select from there to the end of the section and delete.<br><br>If you accidentally break something, press <code>Ctrl+Z</code> to undo.",
      choices: [{ label: "✅ Got it!", next: "contact_formspree" }]
    },
    help_images_folder: {
      msg: "Open your website folder — the one with all the .html files in it.<br><br>Inside that folder, look for a folder called <b>images</b>. It should be right there alongside index.html, about.html, etc.<br><br>If you don't see it, make sure you fully unzipped the folder!",
      choices: [{ label: "✅ Found the images folder!", next: "photos_find" }]
    },
    help_img_src: {
      msg: "Make sure you searched for <b>img src</b> exactly — lowercase, with a space between img and src.<br><br>If still not finding anything, try searching for just <b>.jpg</b> or <b>.png</b> — that will find any image filename on the page.",
      choices: [{ label: "✅ Found the image!", next: "photos_replace" }]
    },
    help_broken_image: {
      msg: "A broken image usually means:<br><br>• The filename doesn't match exactly — check spelling and capitalization<br>• You forgot the file extension — it needs <b>.jpg</b> or <b>.png</b> at the end<br>• The photo isn't in the <b>images</b> folder<br>• You have a space in the filename — rename it with no spaces",
      choices: [{ label: "✅ Fixed it!", next: "photos_done" }]
    },
    help_colors_no_change: {
      msg: "If colors didn't change, check:<br><br>• Did you press <code>Ctrl+S</code> to save?<br>• Did you press <code>F5</code> in your browser to refresh?<br>• Try <code>Ctrl+F</code> first to confirm <b>#1a3d6b</b> is there before replacing.",
      choices: [{ label: "✅ Found it and replaced it!", next: "colors_accent" }]
    },
    help_drag_drop: {
      msg: "Dragging and dropping:<br><br>1. Open <b>File Explorer</b> (folder icon on your taskbar)<br>2. Find your website folder<br>3. Put browser and File Explorer side by side<br>4. Click your website folder once to select it<br>5. Hold mouse button down<br>6. Drag mouse over to browser<br>7. Let go when over the dashed box",
      choices: [
        { label: "✅ It worked!", next: "netlify_live" },
        { label: "❓ Still not working", next: "help_netlify_error" }
      ]
    },
    help_netlify_error: {
      msg: "A few common fixes:<br><br>• Make sure you're dropping the <b>whole folder</b>, not just one file<br>• The folder must contain your index.html file directly inside it<br>• Try a different browser — Chrome works best<br>• Check your internet connection<br><br>Still stuck? Email Mel at <b>mel@sitesbymel.com</b>",
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
      msg: "If you're stuck on something not listed here, email Mel directly — she's happy to help.<br><br>📧 <b>mel@sitesbymel.com</b><br><br>Describe what you're trying to do and what's happening, and she'll get you sorted!",
      choices: [{ label: "↩ Back to main menu", next: "welcome" }]
    }
  };

  var melBotOpen = false;

  function melBotToggle() {
    melBotOpen = !melBotOpen;
    document.getElementById('mel-bot-window').style.display = melBotOpen ? 'flex' : 'none';
    if (melBotOpen && document.getElementById('mel-bot-messages').children.length === 0) {
      melBotShow('welcome');
    }
  }

  function melBotShow(nodeId) {
    var node = BOT[nodeId];
    if (!node) return;
    var msgs = document.getElementById('mel-bot-messages');
    var choices = document.getElementById('mel-bot-choices');

    var msgEl = document.createElement('div');
    msgEl.className = 'bot-msg';
    msgEl.innerHTML = node.msg;
    msgs.appendChild(msgEl);
    msgs.scrollTop = msgs.scrollHeight;

    choices.innerHTML = '';
    node.choices.forEach(function(c) {
      var btn = document.createElement('button');
      btn.className = 'bot-choice';
      btn.textContent = c.label;
      btn.onclick = function() {
        var userEl = document.createElement('div');
        userEl.style.cssText = 'background:#1B2F4E;color:#fff;border-radius:12px 12px 2px 12px;padding:8px 12px;font-size:.82rem;align-self:flex-end;max-width:80%';
        userEl.textContent = c.label;
        msgs.appendChild(userEl);
        msgs.scrollTop = msgs.scrollHeight;
        setTimeout(function() { melBotShow(c.next); }, 300);
      };
      choices.appendChild(btn);
    });
  }

  document.getElementById('mel-bot-bubble').addEventListener('click', melBotToggle);
  document.getElementById('mel-bot-close').addEventListener('click', melBotToggle);
  document.getElementById('mel-bot-restart').addEventListener('click', function() {
    document.getElementById('mel-bot-messages').innerHTML = '';
    melBotShow('welcome');
  });

})();
}
<\/script>`;
}

module.exports = { getFitLifeBotScript };
