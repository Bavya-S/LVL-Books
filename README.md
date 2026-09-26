# LVL Books — Local Project

Files:
- `index.html` — the app
- `manifest.json` — real PWA manifest (name, icons, standalone display)
- `sw.js` — offline-caching service worker
- `icons/` — app icons (192px, 512px, and a maskable 512px for Android adaptive icons)

## Run it locally

Opening `index.html` directly by double-clicking (a `file://` URL) will run the app, but
**service workers and installability require a real server origin** (`http://` or
`https://`, including `http://localhost`) — browsers block service workers on `file://`
for security reasons. So for the full experience (offline caching + "Install app"
prompts), serve the folder instead of opening the file directly:

**Option A — Python (already on most machines):**
```
cd lvl-books-local
python3 -m http.server 8080
```
Then open `http://localhost:8080` in Chrome (Android) or Safari (iPhone, same Wi-Fi/via
a tunnel).

**Option B — Node:**
```
npx serve .
```

**Option C — deploy for free** so you (and your phone) can reach it from anywhere:
GitHub Pages, Netlify, Vercel, or Cloudflare Pages all host a static folder like this
for free over HTTPS in a couple of minutes — just drag-and-drop the folder into
Netlify's dashboard, for example.

## Getting a real installable Android app (.apk / .aab)

Once this is hosted at a real HTTPS URL (from Option C above, or the claude.ai artifact
link), go to **https://www.pwabuilder.com**, paste that URL in, and it will package this
exact app into a real Android APK/AAB — no coding required. From there you can side-load
the APK onto your phone directly, or publish it to the Play Store (requires a one-time
$25 Google Play developer account, and you'll sign the package yourself during that
flow).

## Data storage

All business data (customers, sessions, invoices, inventory, expenses, etc.) is stored
in the browser's IndexedDB, scoped to whichever origin you load the app from. That means:
- `file://` and `http://localhost:8080` are treated as **different storage origins** —
  data doesn't carry over between them. Pick one way of running it and stick with it,
  or use Backup/Restore in the app's "More" menu to move data between them.
- Use **More → Backup & Restore → Backup Data** regularly. On a phone this opens your
  share sheet so you can save the backup straight to Google Drive, Files, or email.
