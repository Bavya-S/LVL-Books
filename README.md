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

## 8. How billing works: Start Session → Add Lines → Edit → Checkout → One Invoice

A **session** is the master bill. Tap **Start Session** (no customer details needed) and it exists immediately as
`LVL-SES-000123`. Everything on it is a **line** with its own permanent ID that you can add, edit, copy or delete.
Every change is saved the instant you make it, so closing the app, losing signal or restarting the phone loses nothing.

**Add New Line = a full-screen POS picker.** Items are grouped by category (Gaming — PS4 / PS5 55-inch / PS5 65-inch /
PS5 Pro 65-inch / Gaming PCs, Accompanying Persons, Food, Beverages, Combos, Overtime Charges, Other Items), with a
search box and category chips.
- **Gaming variants** are listed individually — "PS4 — 3 Players  ₹260/hour · ₹130/30 min". Tap **Add** and a running
  1-hour segment is on the bill immediately (no console/player configuration step). You can add as many PS4 (or any)
  lines as you like; each is independent.
- **Food, drinks, overtime, other items** have a **[−] n [+]** stepper. The row highlights, and a bar at the bottom always
  shows e.g. **2 item types · 5 units · ₹300** — *before* anything is added. **Add Selected Items** adds them once
  (double-taps are ignored; if it fails your selection is kept). Re-opening the picker shows "On bill: 2" for what is
  already billed, so the screen never disagrees with the bill.
- **Accompanying persons:** choose number of persons and duration, see the estimate ("2 persons × 30m × ₹50/h = ₹50"),
  optionally mark **Free (parent)**. They become ordinary editable lines — never a hidden surcharge.
- **Combos** ask for the two included drinks (not charged again).

**Gaming segments.** Each segment has its own start time, end time and billed duration. Buttons on a running segment:
**+30m, +1h, End, Players** (ends the segment and starts the next player-count variant — "4 players → 3 players"),
**Switch** (ends it and opens the picker for another setup), **Edit, Copy, Delete**. Ending a segment asks you to confirm
the time to bill (pre-filled with time played, rounded up to 30 minutes with a 2-minute grace). **An ended segment never
grows afterwards**, and **running segments must be ended explicitly before the invoice can be finalized** (Checkout shows
an *End segments…* button). Corrected durations/rates/players/start/end times are kept in a per-line **edit history**.

**Physical stations (optional).** Settings → Physical Stations lists the real consoles ("PS4 #1", "PS4 #2"). Assign one to
a segment and that console can't be in two running segments at once — while any number of segments of the same *model*
are always allowed.

**Delete.** Every unfinalized line has a visible **Delete**. A running gaming segment asks: *End segment / Remove line
(mistake) / Correct duration*. Deleting removes that one line by its ID. If a screen is out of date (or another phone
already removed the line) you are told, and it is never brought back by a later save.
*Root cause of the "Delete does nothing" problem:* the app used the browser's built-in `confirm()` pop-up. Phone browsers
can silently suppress those ("prevent this page from creating more dialogs"), which makes the button look dead. All
prompts are now in-app dialogs that can't be suppressed. In addition, every change now re-reads the latest saved session
and writes atomically, so a stale screen or a second phone can no longer overwrite or resurrect lines.

**Checkout** (full review page): customer lookup by mobile, items, invoice details, discount % (**gaming lines only —
food is never discounted**), split payments, and a sticky **Finalize Invoice** bar. The invoice number is issued only at
finalize (atomic across phones). **Finalized invoices are locked** — correct them with **Credit / Refund** (reason
required, audit trail kept) and **Record payment** for balances. Then: **Download PDF** (built in, works offline),
**Print**, **Copy summary**, **Open WhatsApp** (pre-filled; sent only when you press Send in WhatsApp).

**Settings (12 pages):** Items Catalogue · **Gaming Setups & Variants** (add/edit/deactivate/reorder variants; add a
gaming PC and its variants appear in the picker immediately) · **Physical Stations** · Gaming Pricing · Custom Duration
Rules (off by default: standard policy is hours + 30-minute blocks) · Overtime · Accompanying persons · Taxes · Invoice
Numbering · Business Details · Staff Permissions (Admin/Staff mode, optional PIN) · Backup & Restore.

**Look & scrolling.** Minimalist dark charcoal theme (light available from the top bar), one accent colour, no glow,
gradients, animations or emoji; respects reduced-motion. The page itself scrolls (no nested scroll areas); every screen
reserves space for the bottom navigation, sticky action bars and Android/iOS safe areas; bottom sheets and dialogs scroll
on their own; focused inputs scroll into view above the keyboard.

**Upgrading:** all existing data is kept — invoices, customers, inventory, items, prices, running sessions (old lines keep
working) and invoice numbering. Old setups get names/categories automatically.

## 9. Other things in this build
- Mobile: every screen has extra bottom clearance, safe-area padding and a spacer, so the last button is always
  reachable above the bottom navigation / phone home indicator; modals scroll smoothly.
- Light / dark theme toggle (top-right). App icon is your LVL Gaming Café logo (favicon, home screen, install).
- Reports page fixed and extended; daily revenue log with per-day detailed export; monthly/weekly charts.
- Vendors, purchases (update stock), employees, cash & bank balances, recurring expenses, CSV exports, demo data.
- Backup reminder every 14 days; optional server-side scheduled backup in `functions/` (paid Firebase plan).

## 10. Testing notes

Four independent suites were run against both builds:
1. **Logic tests (19 scenarios × 2 builds)** — all 11 acceptance tests in the spec (A–J), concurrency (6 simultaneous adds,
   nothing lost), stale-screen deletes, physical-station rules, edit history, rounding, checkout/invoice/credit/refund,
   WhatsApp text, PDF, permissions, backup/clear, demo data and every screen.
2. **Multi-device (10 scenarios)** — two simulated phones on one shared cloud: live sync, simultaneous edits to the same
   session, physical stations across phones, unique invoice numbers, no repaint while typing, near-zero reads.
3. **Upgrade (4 scenarios)** — data written by the previous version migrates and keeps working.
4. **Real browser (12 scenarios)** — headless Chromium on a 360×640 touch viewport: real taps (a tap that would land on a
   covering element fails), Add/Delete/Add-Selected, scroll-to-bottom on 18 screens with a 40-item catalogue, sheet
   scrolling, sticky footers never covering the last control, no gradients/glow/animation, no JavaScript errors.
Also verified: all 125 inline button handlers point to real functions.

Not testable from here: your live `lvl-books-2dbab` Firebase project over the real network, and an on-screen keyboard.
Open it on a phone and run a couple of test bills before relying on it.

**Known limits:** the Firestore build keeps the last 120 days of invoices/sessions loaded (older invoices open on demand;
daily totals are kept forever). Phones that are offline create unique but non-sequential session numbers. WhatsApp can't
be sent automatically. The Admin PIN is a convenience lock per device.
