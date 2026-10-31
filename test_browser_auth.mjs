/**
 * ResuMatch End-to-End Browser Testing with Puppeteer
 * Tests live UI interaction for Auth:
 * - Opening Login Modal
 * - Quick 1-Click Demo Login
 * - User pill & dropdown
 * - Saved resumes modal
 * - Sign up new account
 * - Logout
 */

import puppeteer from 'puppeteer';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.join(__dirname, 'dist');

function getBrowserExecutable() {
  const candidatePaths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    (process.env.LOCALAPPDATA || '') + '\\Google\\Chrome\\Application\\chrome.exe',
    (process.env.LOCALAPPDATA || '') + '\\Microsoft\\Edge\\Application\\msedge.exe'
  ];
  for (const p of candidatePaths) {
    if (p && fs.existsSync(p)) return p;
  }
  return undefined;
}

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg'
};

function startServer(port = 4173) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let cleanUrl = req.url.split('?')[0];
      if (cleanUrl === '/' || cleanUrl === '') cleanUrl = '/index.html';
      const filePath = path.join(DIST_DIR, cleanUrl);

      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const ext = path.extname(filePath);
        res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
        fs.createReadStream(filePath).pipe(res);
      } else {
        res.writeHead(404);
        res.end('Not found');
      }
    });

    server.listen(port, () => {
      resolve(server);
    });
  });
}

async function runE2ETest() {
  console.log('\n--- STARTING BROWSER E2E TEST ---\n');
  const port = 49152 + Math.floor(Math.random() * 1000);
  const server = await startServer(port);
  console.log(`Test server running at http://localhost:${port}`);

  const execPath = getBrowserExecutable();
  console.log(`Using browser executable: ${execPath || 'default'}`);

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: execPath,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  try {
    // 1. Navigate to page
    await page.goto(`http://localhost:${port}/`, { waitUntil: 'networkidle0' });
    console.log('✅ Page loaded');

    // 2. Check title and brand
    const title = await page.title();
    console.log(`Page title: "${title}"`);
    if (!title.includes('ResuMatch')) throw new Error('Title does not contain ResuMatch');

    // 3. Verify Login button is visible in topbar
    await page.waitForSelector('#auth-open-login', { timeout: 4000 });
    console.log('✅ Found "#auth-open-login" button');

    // 4. Click login button to open modal
    await page.click('#auth-open-login');
    await page.waitForSelector('#auth-modal.open', { timeout: 3000 });
    console.log('✅ Auth modal opened successfully');

    // 5. Click 1-Click Demo button
    await page.waitForSelector('#auth-quick-demo-btn', { timeout: 3000 });
    await page.click('#auth-quick-demo-btn');
    console.log('Clicked 1-Click Demo button');

    // 6. Verify modal closed and user pill appeared
    await page.waitForSelector('#auth-user-menu-trigger', { timeout: 4000 });
    const userName = await page.$eval('.auth-user-name', el => el.textContent);
    console.log(`✅ Logged in! User name in pill: "${userName}"`);
    if (!userName.includes('Alex')) throw new Error('Expected Alex in user pill');

    // 7. Click User Pill to open dropdown menu
    await page.click('#auth-user-menu-trigger');
    await page.waitForSelector('#auth-user-dropdown.show', { timeout: 3000 });
    const emailInMenu = await page.$eval('.auth-dropdown-email', el => el.textContent);
    console.log(`✅ User dropdown open, email: "${emailInMenu}"`);
    if (emailInMenu !== 'demo@resumatch.io') throw new Error('Dropdown does not show demo email');

    // 8. Open Saved Resumes from menu
    await page.click('#auth-menu-saved');
    await page.waitForSelector('#saved-resumes-modal.open', { timeout: 3000 });
    console.log('✅ Saved resumes modal opened');

    const cardsCount = await page.$$eval('.saved-resume-card', els => els.length);
    console.log(`Found ${cardsCount} preloaded demo resume cards`);
    if (cardsCount < 2) throw new Error('Expected at least 2 demo resume versions');

    // 9. Save new snapshot
    await page.type('#new-snapshot-name', 'E2E Test Lead Version');
    await page.click('#save-current-snapshot-btn');
    await page.waitForFunction(
      expected => document.querySelectorAll('.saved-resume-card').length === expected,
      {},
      cardsCount + 1
    );
    console.log(`✅ New version snapshot successfully saved and displayed in list!`);

    // 10. Close saved resumes modal
    await page.click('[data-close-modal="saved-resumes-modal"]');
    await page.waitForFunction(() => !document.querySelector('#saved-resumes-modal').classList.contains('open'));

    // 11. Test Sign Out
    await page.click('#auth-user-menu-trigger');
    await page.waitForSelector('#auth-menu-logout', { timeout: 3000 });
    await page.click('#auth-menu-logout');

    await page.waitForSelector('#auth-open-login', { timeout: 4000 });
    console.log('✅ Successfully signed out, login button reappeared');

    // 12. Test Sign Up with a new account
    await page.click('#auth-open-login');
    await page.waitForSelector('#auth-modal.open', { timeout: 3000 });
    await page.click('[data-auth-tab="signup"]');
    await page.waitForSelector('#auth-signup-form', { visible: true });

    const testEmail = `tester_${Date.now()}@test.io`;
    await page.type('#signup-name', 'Jane Foster');
    await page.type('#signup-email', testEmail);
    await page.type('#signup-password', 'Mjolnir2026!');
    await page.click('#signup-submit-btn');

    await page.waitForSelector('#auth-user-menu-trigger', { timeout: 5000 });
    const newUserName = await page.$eval('.auth-user-name', el => el.textContent);
    console.log(`✅ Registered & auto-logged in as: "${newUserName}"`);
    if (!newUserName.includes('Jane')) throw new Error('Expected Jane in user pill');

    console.log('\n========================================');
    console.log('🎉 ALL BROWSER E2E TESTS PASSED 100%!');
    console.log('========================================\n');

  } finally {
    await browser.close();
    server.close();
  }
}

runE2ETest().catch(err => {
  console.error('E2E Test Failed:', err);
  process.exit(1);
});
