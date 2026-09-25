const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  console.log('Navigating to portal...');
  await page.goto('https://process5.gprocurement.go.th/egp-agpc01-web/announcement', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  // Find all radio buttons / checkboxes / text on form
  const formElements = await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll('*'));
    const clickable = all.filter(el => {
      const t = el.innerText ? el.innerText.trim() : '';
      return t === 'ทั้งหมด' || t === 'ประกาศวันนี้' || t.includes('ย้อนหลัง');
    });
    return clickable.map(el => ({
      tag: el.tagName,
      text: el.innerText.trim(),
      className: el.className
    }));
  });
  console.log('Found toggles:', formElements);

  // Click 'ทั้งหมด'
  await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll('*'));
    const allToggle = all.find(el => (el.innerText || '').trim() === 'ทั้งหมด' && (el.tagName === 'MAT-RADIO-BUTTON' || el.tagName === 'LABEL' || el.tagName === 'SPAN'));
    if (allToggle) allToggle.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  await page.waitForSelector('input[name="keywordSearch"]', { timeout: 15000 });
  await page.type('input[name="keywordSearch"]', '69019544809');
  
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const b = btns.find(x => x.innerText.trim() === 'ค้นหา');
    if (b) b.click();
  });
  console.log('Clicked search with 69019544809');
  await new Promise(r => setTimeout(r, 5000));

  const rows = await page.evaluate(() => {
    const trs = Array.from(document.querySelectorAll('table tbody tr'));
    return trs.map(tr => Array.from(tr.querySelectorAll('td')).map(td => td.innerText.trim()));
  });

  console.log('Table rows found:', rows.length);
  console.log(JSON.stringify(rows, null, 2));

  await browser.close();
})();
