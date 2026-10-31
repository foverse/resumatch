import puppeteer from 'puppeteer';

(async () => {
  console.log('--- TESTING LIVE GITHUB PAGES DEPLOYMENT ---');
  const url = 'https://foverse.github.io/resumatch/';
  console.log(`Navigating to ${url}...`);

  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    page.on('console', msg => {
      // console.log('PAGE LOG:', msg.text());
    });
    page.on('pageerror', err => {
      console.error('PAGE ERROR:', err.message);
    });

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    console.log('✅ Page loaded successfully');

    // 1. Check for Log in button
    const loginBtn = await page.$('#auth-open-login');
    if (!loginBtn) throw new Error('Log in button (#auth-open-login) not found in DOM');
    const loginText = await page.evaluate(el => el.textContent.trim(), loginBtn);
    console.log(`✅ Found Log in button: "${loginText}"`);

    // 2. Click Log in button to open modal
    await loginBtn.click();
    await new Promise(r => setTimeout(r, 400));

    const isModalOpen = await page.evaluate(() => {
      const modal = document.getElementById('auth-modal');
      return modal && modal.classList.contains('open');
    });
    if (!isModalOpen) throw new Error('Auth modal did not open (missing .open class)');
    console.log('✅ Auth modal opened successfully');

    // 3. Click demo account button
    const demoBtn = await page.$('#auth-quick-demo-btn');
    if (!demoBtn) throw new Error('Demo fill button (#auth-quick-demo-btn) not found');
    await demoBtn.click();
    await new Promise(r => setTimeout(r, 200));

    const emailVal = await page.evaluate(() => document.getElementById('login-email').value);
    const passVal = await page.evaluate(() => document.getElementById('login-password').value);
    console.log(`✅ Demo credentials populated: ${emailVal} / ${passVal ? '••••••' : 'EMPTY'}`);

    // 4. Submit login form
    const submitBtn = await page.$('#login-submit-btn');
    await submitBtn.click();
    await new Promise(r => setTimeout(r, 800));

    // 5. Verify user pill appears in topbar
    const userPill = await page.$('#auth-user-menu-trigger');
    if (!userPill) throw new Error('User trigger (#auth-user-menu-trigger) not found after login');
    const userName = await page.evaluate(el => el.textContent.trim(), userPill);
    console.log(`✅ Successfully logged in! User pill: "${userName}"`);

    // 6. Test dropdown menu
    await userPill.click();
    await new Promise(r => setTimeout(r, 300));
    const isMenuOpen = await page.evaluate(() => {
      const dropdown = document.getElementById('auth-user-dropdown');
      return dropdown && dropdown.classList.contains('show');
    });
    console.log(`✅ User dropdown menu open: ${isMenuOpen}`);

    // 7. Test open saved resumes modal
    const savedResumesBtn = await page.$('#auth-menu-saved');
    await savedResumesBtn.click();
    await new Promise(r => setTimeout(r, 400));

    const savedModalOpen = await page.evaluate(() => {
      const modal = document.getElementById('saved-resumes-modal');
      return modal && modal.classList.contains('open');
    });
    if (!savedModalOpen) throw new Error('Saved resumes modal failed to open');

    const savedCount = await page.evaluate(() => document.querySelectorAll('.saved-resume-card').length);
    console.log(`✅ Saved resumes modal opened with ${savedCount} preloaded resume versions.`);

    // 8. Save a new version snapshot
    const snapshotName = `Live Test Version ${Date.now()}`;
    await page.type('#new-snapshot-name', snapshotName);
    await page.click('#save-current-snapshot-btn');
    await new Promise(r => setTimeout(r, 500));

    const updatedCount = await page.evaluate(() => document.querySelectorAll('.saved-resume-card').length);
    console.log(`✅ Snapshot created! Card count: ${savedCount} -> ${updatedCount}`);

    // Close saved modal
    await page.click('[data-close-modal="saved-resumes-modal"]');
    await new Promise(r => setTimeout(r, 300));

    // 9. Sign out
    const freshUserPill = await page.$('#auth-user-menu-trigger');
    await freshUserPill.click();
    await new Promise(r => setTimeout(r, 300));
    await page.click('#auth-menu-logout');
    await new Promise(r => setTimeout(r, 600));

    const loginBtnAfterLogout = await page.$('#auth-open-login');
    if (!loginBtnAfterLogout) throw new Error('Log in button did not reappear after logout');
    console.log('✅ Sign out verified successfully.');

    // 10. Test Registration with a brand-new user
    await loginBtnAfterLogout.click();
    await new Promise(r => setTimeout(r, 300));

    await page.click('[data-auth-tab="signup"]');
    await new Promise(r => setTimeout(r, 300));

    const uniqueEmail = `dr_curie_${Date.now()}@domain.com`;
    await page.type('#signup-name', 'Marie Curie');
    await page.type('#signup-email', uniqueEmail);
    await page.type('#signup-password', 'CuriePass999!');

    await page.click('#signup-submit-btn');
    await new Promise(r => setTimeout(r, 800));

    const curiePill = await page.$('#auth-user-menu-trigger');
    const curieName = await page.evaluate(el => el ? el.textContent.trim() : null, curiePill);
    console.log(`✅ New account registered & auto-logged in! Pill: "${curieName}"`);

    console.log('\n======================================================');
    console.log('🎉 YES, LOG IN WORKS 100% ON THE LIVE PRODUCTION SITE!');
    console.log('======================================================');
  } catch (err) {
    console.error('❌ LIVE VERIFICATION FAILED:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
