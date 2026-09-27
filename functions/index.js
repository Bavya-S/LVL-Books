/**
 * OPTIONAL — real, server-side automated backups every 14 days.
 *
 * The app itself already reminds whoever has it open to back up every 2 weeks (see
 * "Backup & Restore" in the app, and README.md). That works with zero setup and zero
 * cost. This Cloud Function is the upgrade: a scheduled job that runs on Google's
 * servers even if nobody opens the app, exports every Firestore collection, and writes
 * one JSON file per run to Cloud Storage — a true unattended backup.
 *
 * Requirements before deploying:
 *   1. Your Firebase project must be on the "Blaze" (pay-as-you-go) plan. Cloud
 *      Scheduler (which powers scheduled functions) is not available on the free
 *      "Spark" plan. In practice, one run every 14 days for a business this size costs
 *      a fraction of a cent — but Google requires billing to be enabled to offer the
 *      scheduling feature at all.
 *   2. Run `firebase init functions` in this folder's parent directory once (choose
 *      JavaScript, and when it asks to overwrite files, keep this index.js and
 *      package.json).
 *   3. Deploy with: firebase deploy --only functions
 *
 * Where backups land: a Cloud Storage bucket called "<your-project-id>-backups" (created
 * automatically on first run), as files named like backups/2026-09-27T00-00-00.json.
 * Download them anytime from Firebase Console → Storage, or automate further with a
 * Cloud Storage lifecycle rule to delete backups older than, say, 180 days.
 */

const { onSchedule } = require("firebase-functions/v2/scheduler");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getStorage } = require("firebase-admin/storage");

initializeApp();

const COLLECTIONS = [
  "customers", "sessions", "invoices", "products", "expenses", "settings",
  "vendors", "purchases", "employees", "employeeTx", "accounts", "dailyRecords", "counters"
];

exports.scheduledFirestoreBackup = onSchedule(
  { schedule: "every 336 hours", timeZone: "Asia/Kolkata" }, // 336 hours = 14 days
  async () => {
    const db = getFirestore();
    const backup = {};

    for (const name of COLLECTIONS) {
      const snap = await db.collection(name).get();
      backup[name] = snap.docs.map((d) => d.data());
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const bucket = getStorage().bucket(); // default bucket for this project
    const file = bucket.file(`backups/${timestamp}.json`);
    await file.save(JSON.stringify(backup, null, 2), {
      contentType: "application/json",
    });

    console.log(`LVL Books backup written: backups/${timestamp}.json`);
  }
);
