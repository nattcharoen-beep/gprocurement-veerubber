import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

async function run() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled', '--window-size=1280,800'],
    defaultViewport: null
  });

  const page = await browser.newPage();
  let token = null;
  let xsrf = null;

  page.on('response', async res => {
    if (res.url().includes('validate')) {
      try {
        const json = await res.json();
        if (json && json.data) token = json.data;
      } catch (e) {}
    }
  });

  page.on('request', req => {
    if (req.url().includes('a-egp-allt-project/announcement')) {
      const h = req.headers();
      if (h['x-announcement-token']) token = h['x-announcement-token'];
      if (h['x-xsrf-token']) xsrf = h['x-xsrf-token'];
    }
  });

  console.log('Navigating to portal...');
  await page.goto('https://process5.gprocurement.go.th/egp-agpc01-web/announcement', { waitUntil: 'networkidle2', timeout: 35000 });
  await new Promise(r => setTimeout(r, 2500));

  const cfFrame = page.frames().find(f => f.url().includes('turnstile'));
  if (cfFrame) {
    const frameEl = await cfFrame.frameElement();
    const fBox = await frameEl.boundingBox();
    if (fBox) {
      console.log('Solving Turnstile...');
      await page.mouse.click(fBox.x + 30, fBox.y + fBox.height / 2);
    }
  }

  await new Promise(r => setTimeout(r, 2500));

  const input = await page.input[name="keywordSearch"];
  if (input) {
    await input.click();
    await page.keyboard.type('กีฬา', { delay: 20 });
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find(x => x.innerText.trim() === 'ค้นหา');
      if (b) b.click();
    });
  }

  let retries = 0;
  while (!token && retries < 25) {
    await new Promise(r => setTimeout(r, 1000));
    retries++;
  }

  const cookies = await page.cookies();
  const c = cookies.find(x => x.name.toUpperCase().includes('XSRF'));
  if (c) xsrf = c.value;

  console.log('Token captured:', !!token, 'XSRF captured:', !!xsrf);

  const testPids = ['69019544809', '69089630960', '69099277215'];
  for (const pid of testPids) {
    const res = await page.evaluate(async (pId, t, x) => {
      const url = 'https://process5.gprocurement.go.th/egp-oann10-service/pb/a-egp-allt-project/announcement?announcementTodayFlag=false&keywordSearch=' + pId + '&page=1';
      try {
        const r = await fetch(url, {
          headers: {
            'x-announcement-token': t,
            'x-xsrf-token': x,
            'accept': 'application/json, text/plain, */*'
          }
        });
        return await r.json();
      } catch (err) {
        return { error: err.message };
      }
    }, pid, token, xsrf);

    console.log('=== PID:', pid, '===');
    const rows = res.data?.data || [];
    console.log('Rows count:', rows.length);
    for (const r of rows) {
      console.log('  Flow:', r.flowName, '| Type:', r.announceType, '| Step:', r.stepId, '| Date:', r.announceDate, '| Status:', r.projectStatus || r.status || '-');
    }
  }

  await browser.close();
}

run().catch(console.error);
