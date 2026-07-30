#!/usr/bin/env node
/**
 * Increments iOS buildNumber and Android versionCode in app.json.
 * Run before every EAS / App Store / Play Store submission to avoid
 * duplicate build number rejections.
 *
 * Usage:
 *   node scripts/increment-build.js          # increment both platforms
 *   node scripts/increment-build.js --dry-run # preview without writing
 */

const fs = require("fs");
const path = require("path");

const APP_JSON_PATH = path.resolve(__dirname, "../app.json");
const isDryRun = process.argv.includes("--dry-run");

const raw = fs.readFileSync(APP_JSON_PATH, "utf8");
const config = JSON.parse(raw);

const expo = config.expo;

// iOS buildNumber is a string, Android versionCode is a number
const currentIos = parseInt(expo.ios?.buildNumber ?? "0", 10);
const currentAndroid = expo.android?.versionCode ?? 0;

const nextIos = currentIos + 1;
const nextAndroid = currentAndroid + 1;

console.log(`iOS     buildNumber : ${currentIos} → ${nextIos}`);
console.log(`Android versionCode : ${currentAndroid} → ${nextAndroid}`);

if (isDryRun) {
  console.log("\n[dry-run] No files were changed.");
  process.exit(0);
}

expo.ios = { ...expo.ios, buildNumber: String(nextIos) };
expo.android = { ...expo.android, versionCode: nextAndroid };

// Preserve original formatting (2-space indent)
fs.writeFileSync(APP_JSON_PATH, JSON.stringify(config, null, 2) + "\n", "utf8");

console.log(`\napp.json updated. Commit the change before submitting to the stores.`);
