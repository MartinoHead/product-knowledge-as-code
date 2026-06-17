'use strict';
/**
 * Verifies that docs/openapi.json matches what would be generated from the current source.
 * Exits 1 if the committed snapshot is out of date.
 *
 * Run via: node scripts/verify-openapi.js
 */
const { execSync } = require('child_process');
const { readFileSync, writeFileSync, existsSync } = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SNAPSHOT = path.join(ROOT, 'docs', 'openapi.json');
const TMP = path.join(ROOT, 'docs', 'openapi.gen.tmp.json');

if (!existsSync(SNAPSHOT)) {
  console.error('docs/openapi.json not found. Run npm run generate:openapi first and commit the file.');
  process.exit(1);
}

const committed = readFileSync(SNAPSHOT, 'utf8');

// Generate fresh copy to a temp file so we don't clobber the committed one yet
try {
  execSync(`npx tsx scripts/export-openapi.ts`, { cwd: ROOT, stdio: 'inherit' });
} catch {
  process.exit(1);
}

const fresh = readFileSync(SNAPSHOT, 'utf8');

// Restore committed content immediately so the working tree stays clean
writeFileSync(SNAPSHOT, committed, 'utf8');

if (committed !== fresh) {
  writeFileSync(TMP, fresh, 'utf8');
  console.error(
    'OpenAPI drift detected: docs/openapi.json is out of date.\n' +
    'Run `npm run generate:openapi` and commit the updated docs/openapi.json.\n' +
    `Fresh version written to ${path.relative(ROOT, TMP)} for review.`
  );
  process.exit(1);
}

console.log('OpenAPI document is up to date (no drift detected).');
