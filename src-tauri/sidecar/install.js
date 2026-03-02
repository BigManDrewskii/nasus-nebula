/**
 * Nasus Browser Sidecar - Install Script
 *
 * Downloads Chromium browser for Playwright.
 * Displays progress during installation.
 */

import { execSync } from 'child_process';
import { stdout } from 'process';

console.log('[Sidecar] Installing dependencies...');

try {
  // Install npm dependencies
  execSync('npm install --no-save', {
    stdio: 'inherit',
    cwd: import.meta.dirname,
  });

  console.log('[Sidecar] Installing Chromium for Playwright...');
  console.log('[Sidecar] This will be downloaded once and reused.');

  // Install Chromium browser
  execSync('npx playwright install chromium', {
    stdio: 'inherit',
    cwd: import.meta.dirname,
  });

  console.log('[Sidecar] Installation complete!');
  console.log('[Sidecar] Run "npm start" to start the sidecar server.');
} catch (error) {
  console.error('[Sidecar] Installation failed:', error.message);
  process.exit(1);
}
