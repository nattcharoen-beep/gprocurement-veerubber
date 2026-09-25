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
  await page.goto('https://process5.gprocurement.go.th/egp-agpc01-web/announcement', { waitUntil: 'networkidle2' });
  
  const formHtml = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('input, select, button, label')).map(el => ({
      tag: el.tagName,
      name: el.name || el.getAttribute('name'),
      id: el.id,
      type: el.type,
      text: el.innerText ? el.innerText.trim() : '',
      value: el.value,
      checked: el.checked
    }));
  });
  console.log(JSON.stringify(formHtml.filter(x => x.text || x.name || x.id), null, 2));
  await browser.close();
})();
