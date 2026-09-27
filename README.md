# LVL Books — Local / Production Project

Everything for LVL Gaming Café's POS + business management app, wired to your Firebase
project (`lvl-books-2dbab`) for real-time multi-device sync.

## What's in this folder
- `index.html` — the whole app (this is the only file you ever need to open/serve)
- `manifest.json` — PWA manifest (name, icons, standalone display)
- `sw.js` — offline-caching service worker for the app shell
- `icons/` — your LVL Gaming Café logo, exported as 192px / 512px / maskable-512px / favicon
- `firestore.rules` — security rules to paste into the Firebase console
- `functions/` — **optional** server-side scheduled backup (needs a paid Firebase plan — see below)

## 1. One-time Firebase setup (5 minutes)

You already have the Firestore database created. Two more steps:

1. **Turn on Anonymous Authentication.** The app signs staff in silently — no login
   screen, no passwords — purely so Firestore can tell "the app" apart from random
   internet traffic. Firebase Console → **Build → Authentication → Sign-in method →
   Anonymous → Enable**.
2. **Publish the security rules.** Firebase Console → **Build → Firestore Database →
   Rules** tab → paste the contents of `firestore.rules` → **Publish**.

Without step 2, Firestore's *default* rules block all reads/writes and the app will show
"Couldn't connect to the cloud database." If you already had test-mode rules active,
switching to the rules in this repo is what makes the app work securely instead of
wide open to the internet.

## 2. Run it

Because this uses Firebase's modular SDK (`import` statements) and a service worker, it
needs to be served from a real URL — `http://`, `https://`, or `http://localhost` — not
opened directly as a `file://` path (browsers block ES module imports and service
workers on `file://` for security reasons; this is a browser rule, not something in the
app).

**Fastest for testing on your computer:**
```
cd lvl-books-local
python3 -m http.server 8080
```
Open `http://localhost:8080`.

**To actually use it on your Apple and Android phones**, it needs to be on the public
internet over HTTPS (phones on your café Wi-Fi or mobile data need a real URL to reach).
Pick any of these — all have generous free tiers and take a few minutes:
- **Firebase Hosting** (nice since it's the same project): `firebase init hosting` →
  point it at this folder → `firebase deploy --only hosting`. You'll get a
  `https://lvl-books-2dbab.web.app` URL.
- **Netlify / Vercel / Cloudflare Pages**: drag-and-drop this folder in their dashboard.

Once it's live at a URL:
- **iPhone**: open the URL in Safari → Share icon → **Add to Home Screen**.
- **Android**: open the URL in Chrome → you'll see an **Install app** banner (or ⋮ menu →
  **Install app**). This uses the real `manifest.json`, so it installs as a proper
  standalone app icon, not just a bookmark.

## 3. Getting a real installable `.apk`

I can't compile and sign an Android package from this chat — that needs Android build
tooling I don't have access to here. Once the app is live at an HTTPS URL (previous
step), go to **https://www.pwabuilder.com**, paste that URL in, and it packages this
exact app into a real Android APK/AAB — no coding required. You can side-load the APK
directly, or publish to the Play Store (one-time $25 Google Play developer account,
and you sign the package yourself during that flow).

## 4. Multi-device real-time sync

Every phone/tablet that opens the app connects to the same Firestore database and
subscribes to live updates (`onSnapshot`). When one staff member starts a session, adds
food, or completes a payment, every other device open to the app updates within roughly
a second — no manual refresh. This works across iOS and Android since it's all standard
web technology, not a native iOS/Android-specific feature.

The app also has Firestore's **offline persistence** turned on: if a phone loses signal
mid-shift, it keeps working from its local cache and automatically syncs back up the
moment it reconnects.

## 5. Backups

Two layers, matching what was asked for:

- **Automatic reminder (works immediately, no setup):** the app tracks when you last
  backed up, and shows a dismissible banner on the Dashboard once 14 days have passed.
  Tapping "Back Up Now" (or More → Backup & Restore) opens your phone's Share sheet —
  send it to Google Drive, Files, email, WhatsApp-to-yourself, whatever you like.
- **True server-side scheduled backup (optional, needs the paid "Blaze" plan):**
  `functions/index.js` is a Cloud Function that runs every 14 days on Google's servers —
  no phone or app needs to be open — and writes a full export to Cloud Storage. Deploy
  steps and cost notes are in the comment at the top of that file. This is opt-in because
  Google requires billing enabled for scheduled functions, even though actual usage at
  this scale costs a fraction of a cent.

Either way, **use Export Day / Export CSV / Export All Data in the Reports screen** for a
detailed, itemized backup of any specific day, not just the daily totals.

## 6. Data retention ("usable even after 10 years")

Data now lives in Cloud Firestore, not just your phone's browser storage — that's the
biggest single improvement for long-term durability, since it's no longer at the mercy
of one device's storage being cleared. Realistic long-term protection still comes down
to: keep the Firebase project active (Google doesn't delete active projects), keep the
two backup layers above running, and periodically confirm you can actually open a backup
file — a backup nobody has ever restored is not a tested backup.

## 7. What's different from the claude.ai chat preview link

The link Claude gave you earlier in this conversation (the one that opens inside
claude.ai) **cannot** run the Firebase integration — Anthropic's hosting environment
blocks scripts from `gstatic.com` for security reasons outside anyone's control here.
That preview link still works, but it stores data locally in the browser only
(IndexedDB), not in Firestore, and won't sync across devices. **This downloadable
project is the real, full-featured, multi-device version** — treat it as the one to
actually run your business on.

## 8. Everything else that changed in this build
- Session deletion: every active gaming session has a 🗑️ button, no blocks.
- Checkout: "Send digital bill via WhatsApp" toggle — turn it off to skip name/phone
  entirely for walk-ins who don't want a text.
- Discounts are now a percentage of the bill, not a flat rupee amount.
- Settings → Console Pricing: edit every console/player-count rate without touching code.
- Settings → Menu Management: add, reprice, or delete food/beverage items.
- Reports page bug fixed (a real crash was found and fixed — it was throwing an error
  every time the page tried to render, which is why it looked like it "wasn't loading").
- Light/dark theme toggle (top-right of every screen).
- App icon is now your actual LVL Gaming Café logo everywhere (favicon, home-screen icon,
  install prompts).

## 9. Testing notes (so you know this isn't just untested code)

Before packaging this, I ran the entire app's logic — billing math, checkout with the new
optional-contact toggle, session start/extend/delete, food item add/edit/remove, console
pricing edits, menu CRUD, vendor/purchase/employee flows, daily records, reports
rendering, backup/restore, and the theme toggle — against a simulated Firestore backend
that mimics the real `getDocs`/`setDoc`/`onSnapshot`/`writeBatch` API. All 30 scenarios
passed. I can't reach the real `lvl-books-2dbab` project from this sandbox (its network
is locked down to a short list of package-registry domains), so the one thing I
genuinely could not test end-to-end is your exact live Firebase project responding over
the real network — that first real connection is worth watching closely the first time
you open the app.
