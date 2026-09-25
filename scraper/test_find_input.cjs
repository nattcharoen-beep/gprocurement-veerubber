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
  
  let token = null;
  let xsrf = null;
  page.on('request', req => {
    if (req.url().includes('a-egp-allt-project/announcement')) {
      const h = req.headers();
      if (h['x-announcement-token']) token = h['x-announcement-token'];
      if (h['x-xsrf-token']) xsrf = h['x-xsrf-token'];
    }
  });

  console.log('Navigating...');
  await page.goto('https://process5.gprocurement.go.th/egp-agpc01-web/announcement', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 6000));
  
  const cfFrame = page.frames().find(f => f.url().includes('turnstile') || f.url().includes('challenge'));
  console.log('CF Frame found:', !!cfFrame);
  if (cfFrame) {
    const frameEl = await cfFrame.frameElement();
    const fBox = await frameEl.boundingBox();
    if (fBox) {
      console.log('Clicking Turnstile...');
      await page.mouse.click(fBox.x + 30, fBox.y + fBox.height / 2);
      await new Promise(r => setTimeout(r, 3000));
    }
  }

  const input = await page.$('input[name="keywordSearch"]');
  console.log('Input found:', !!input);

  if (input) {
    await input.click();
    await page.keyboard.type('กีฬา', { delay: 20 });
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find(x => x.innerText.trim() === 'ค้นหา');
      if (b) b.click();
    });
    console.log('Clicked search!');
    await new Promise(r => setTimeout(r, 3000));
  }

  console.log('Token captured:', !!token, 'XSRF captured:', !!xsrf);

  if (token) {
    // Try to query project 69099277215
    const testPid = '69099277215';
    const res = await page.evaluate(async (pId, t, x) => {
      const url = `https://process5.gprocurement.go.th/egp-oann10-service/pb/a-egp-allt-project/announcement?announcementTodayFlag=false&keywordSearch=${pId}&page=1`;
      const r = await fetch(url, {
        headers: {
          'x-announcement-token': t,
          'x-xsrf-token': x,
          'accept': 'application/json, text/plain, */*'
        }
      });
      return await r.json();
    }, testPid, token, xsrf);

    console.log('Test PID Result:');
    const rows = res.data?.data || [];
    console.log(`Found ${rows.length} rows`);
    for (const r of rows) {
      console.log(`  Flow: ${r.flowName} | Type: ${r.announceType} | Date: ${r.announceDate}`);
    }
  }

  await browser.close();
})();
