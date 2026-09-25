import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox']
  });
  const page = await browser.newPage();
  await page.goto('https://process5.gprocurement.go.th/egp-agpc01-web/announcement', { waitUntil: 'networkidle2' });
  
  const endpoints = await page.evaluate(async () => {
    const scripts = Array.from(document.querySelectorAll('script')).map(s => s.src).filter(Boolean);
    const found = [];
    for (const src of scripts) {
      try {
        const res = await fetch(src);
        const text = await res.text();
        const matches = text.match(/(\/egp-[a-z0-9-]+-service\/[a-zA-Z0-9_\-\/]+)/g);
        if (matches) found.push(...matches);
      } catch {}
    }
    return Array.from(new Set(found));
  });

  console.log('Total endpoints found:', endpoints.length);
  console.log('Endpoints sample:', JSON.stringify(endpoints.slice(0, 40), null, 2));
  await browser.close();
})();
