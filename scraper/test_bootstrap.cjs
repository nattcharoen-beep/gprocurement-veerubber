const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: false,
    args: ['--no-sandbox', '--window-size=1280,800']
  });
  const page = await browser.newPage();
  console.log('Navigating...');
  await page.goto('https://process5.gprocurement.go.th/egp-agpc01-web/announcement', { waitUntil: 'domcontentloaded' });
  
  console.log('Waiting for app-root to bootstrap...');
  try {
    await page.waitForFunction(() => {
      const root = document.querySelector('app-root');
      return root && root.children.length > 0;
    }, { timeout: 25000 });
    console.log('SUCCESS: Angular bootstrapped!');
    const rootChildren = await page.evaluate(() => document.querySelector('app-root').innerHTML.slice(0, 300));
    console.log('App root preview:', rootChildren);
  } catch (err) {
    console.error('Wait failed:', err.message);
  }

  await browser.close();
})();
