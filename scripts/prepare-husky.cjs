#!/usr/bin/env node
/*
 * Safe Husky prepare script.
 * - Skips when running in CI without git metadata.
 * - Skips if devDependencies were not installed (e.g., production install).
 * - Initializes Husky only when the binary is present.
 */
const { execSync } = require('node:child_process');
const { existsSync } = require('node:fs');

function log(msg) {
  console.log(`[prepare-husky] ${msg}`);
}

try {
  // Detect production / CI minimal installs
  if (process.env.NODE_ENV === 'production') {
    log('NODE_ENV=production detected – skipping husky install.');
    process.exit(0);
  }
  if (process.env.SKIP_HUSKY) {
    log('SKIP_HUSKY set – skipping.');
    process.exit(0);
  }
  // Yarn PnP / corepack edge cases aside, simplest check: does husky binary exist?
  const huskyBin = './node_modules/.bin/husky';
  if (!existsSync(huskyBin)) {
    log('husky binary not found (likely devDependencies skipped) – skipping.');
    process.exit(0);
  }
  // Ensure we are in a git repo
  try {
    execSync('git rev-parse --is-inside-work-tree', { stdio: 'ignore' });
  } catch {
    log('Not a git repository – skipping.');
    process.exit(0);
  }
  // Run husky install (idempotent)
  // Husky v9 deprecates `husky install` (only `husky init` for first-time setup).
  // We keep backward compatibility for <9 while avoiding the deprecation warning on >=9.
  try {
    // Detect husky major version via filesystem (avoids ESM/require edge cases)
    const path = require('node:path');
    const fs = require('node:fs');
    const pkgPath = path.join(process.cwd(), 'node_modules', 'husky', 'package.json');
    if (fs.existsSync(pkgPath)) {
      const huskyPkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      const major = parseInt((huskyPkg.version || '0').split('.')[0], 10) || 0;
      if (major >= 9) {
        log(`husky v${huskyPkg.version} detected – skipping deprecated 'husky install'.`);
      } else {
        execSync('npx husky install', { stdio: 'inherit' });
        log('husky install completed.');
      }
    } else {
      log('husky package.json not found – skipping.');
    }
  } catch (e) {
    log(`version detection failed – skipping install (${e.message}).`);
  }
} catch (err) {
  log(`non-fatal error: ${err.message}`);
  // Never fail the whole install for Husky setup issues.
  process.exit(0);
}
