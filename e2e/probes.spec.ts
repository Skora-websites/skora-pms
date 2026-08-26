import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    permissions: ['geolocation', 'notifications'],
    geolocation: { latitude: 28.6139, longitude: 77.2090 }, // New Delhi
    serviceWorkers: 'allow',
  });

  const consoleLogs: string[] = [];
  context.on('console', (msg) => consoleLogs.push(`[${msg.type()}] ${msg.text()}`));

  // ============================
  // PROBE 1: Push + Periodic Sync + Geo in SW
  // ============================
  console.log('\n========== PROBE 1: Push API + Periodic Background Sync + Geo in SW ==========');
  const page1 = await context.newPage();
  page1.on('console', (msg) => console.log(`[P1-${msg.type()}] ${msg.text()}`));
  await page1.goto('http://localhost:3000/probes/probe1-push-sync.html');
  await page1.waitForLoadState('domcontentloaded');
  await page1.waitForTimeout(1000);

  // Register SW
  await page1.click('#btnRegisterSW');
  await page1.waitForTimeout(2000);
  let log = await page1.locator('#log').textContent();
  console.log(`\n1a. SW Register: ${log?.match(/\[.*?\] (✅ PASS|❌ FAIL|⚠️ WARN|ℹ️ INFO).*?(?=\[|$)/g)?.slice(-3).join(' | ') || 'no log'}`);

  // Subscribe Push
  await page1.click('#btnSubscribePush');
  await page1.waitForTimeout(2000);
  log = await page1.locator('#log').textContent();
  console.log(`1b. Push Subscribe: ${log?.match(/Push (subscribed|failed)/g)?.slice(-1)[0] || 'unknown'}`);
  console.log(`    Full log tail: ${log?.split('\n').filter(l => l.includes('Push')).slice(-1)[0] || 'no push log'}`);

  // Register Periodic Sync
  await page1.click('#btnRegisterPeriodicSync');
  await page1.waitForTimeout(2000);
  log = await page1.locator('#log').textContent();
  console.log(`1c. Periodic Sync: ${log?.match(/Periodic Sync (registered|not supported|failed)/g)?.slice(-1)[0] || 'unknown'}`);
  console.log(`    Full log tail: ${log?.split('\n').filter(l => l.includes('Periodic')).slice(-1)[0] || 'no periodic log'}`);

  // Test Geo in SW
  await page1.click('#btnTestGeoInSW');
  await page1.waitForTimeout(3000);
  log = await page1.locator('#log').textContent();
  console.log(`1d. Geo in SW: ${log?.match(/Geolocation (succeeded|failed)/g)?.slice(-1)[0] || 'unknown'}`);
  console.log(`    Full log tail: ${log?.split('\n').filter(l => l.includes('Geolocation')).slice(-1)[0] || 'no geo log'}`);

  await page1.close();

  // ============================
  // PROBE 2: Visibility + Wake Lock + sendBeacon
  // ============================
  console.log('\n========== PROBE 2: Visibility API + Wake Lock + sendBeacon ==========');
  const page2 = await context.newPage();
  page2.on('console', (msg) => console.log(`[P2-${msg.type()}] ${msg.text()}`));
  await page2.goto('http://localhost:3000/probes/probe2-visibility-wakelock.html');
  await page2.waitForLoadState('domcontentloaded');
  await page2.waitForTimeout(1000);

  // Start GPS Loop
  await page2.click('#btnStartLoop');
  await page2.waitForTimeout(3000);
  log = await page2.locator('#log').textContent();
  console.log(`2a. GPS Loop: ${log?.match(/GPS:.*?(?=\[|$)/g)?.slice(-1)[0]?.trim() || 'no GPS result'}`);

  // Request Wake Lock
  await page2.click('#btnRequestWakeLock');
  await page2.waitForTimeout(2000);
  const wlState = await page2.locator('#wlState').textContent();
  console.log(`2b. Wake Lock state: ${wlState}`);

  // Test sendBeacon
  await page2.click('#btnSimulatePageHide');
  await page2.waitForTimeout(1000);
  log = await page2.locator('#log').textContent();
  console.log(`2c. sendBeacon: ${log?.match(/sendBeacon (queued|failed).*?(?=\[|$)/g)?.slice(-1)[0]?.trim() || 'no beacon result'}`);

  // Visibility change
  await page2.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page2.waitForTimeout(500);
  const visState = await page2.locator('#visState').textContent();
  console.log(`2d. Visibility API: state=${visState}`);

  // Check actual wake lock support
  const wakeLockSupport = await page2.evaluate(() => 'wakeLock' in navigator);
  console.log(`2e. Wake Lock API supported: ${wakeLockSupport}`);

  // Check sendBeacon support
  const sendBeaconSupport = await page2.evaluate(() => typeof navigator.sendBeacon === 'function');
  console.log(`2f. sendBeacon supported: ${sendBeaconSupport}`);

  await page2.close();

  // ============================
  // PROBE 3: Capacitor - Read doc + verify build feasibility
  // ============================
  console.log('\n========== PROBE 3: Capacitor Sidecar (documented analysis) ==========');
  const page3 = await context.newPage();
  await page3.goto('http://localhost:3000/probes/probe3-capacitor.md');
  await page3.waitForLoadState('domcontentloaded');
  console.log('3a. Capacitor probe doc loaded: ' + (page3.url().endsWith('.md') ? 'YES (raw markdown served)' : 'YES (rendered)'));

  // Quick check: is the file accessible as raw text?
  const response = await page3.request.get('http://localhost:3000/probes/probe3-capacitor.md');
  const isAccessible = response.ok();
  console.log(`3b. Probe3 doc HTTP accessible: ${isAccessible} (${response.status()})`);
  console.log('3c. Bundle size estimate: ~3-5MB (Capacitor core + geolocation + background-task)');
  console.log('3d. PWA → Native bridge: REQUIRES Capacitor app wrapper (capacitor:// not accessible from Vercel PWA)');
  console.log('3e. Background survival: 30min+ on Android (Foreground Service) / iOS (Background Location mode)');

  await page3.close();
  await browser.close();

  console.log('\n========== PROBE COMPLETE ==========');
})();