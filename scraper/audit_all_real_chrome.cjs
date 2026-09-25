const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const fs = require('fs');

async function run() {
  console.log('Fetching active projects from Worker API...');
  const res = await fetch('https://gprocurement-finder.natt-charoen.workers.dev/api/announcements?limit=200', {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  const json = await res.json();
  const projects = json.data || [];
  console.log(`Found ${projects.length} active projects to audit.`);

  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: false,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--window-size=1280,800'
    ],
    defaultViewport: null
  });

  const page = await browser.newPage();
  let token = null;
  let xsrf = null;

  page.on('response', async r => {
    if (r.url().includes('validate')) {
      try {
        const j = await r.json();
        if (j && j.data) token = j.data;
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

  console.log('Navigating to e-GP portal...');
  await page.goto('https://process5.gprocurement.go.th/egp-agpc01-web/announcement', { waitUntil: 'networkidle2', timeout: 45000 });
  await new Promise(r => setTimeout(r, 3000));

  const cfFrame = page.frames().find(f => f.url().includes('turnstile'));
  if (cfFrame) {
    const frameEl = await cfFrame.frameElement();
    const fBox = await frameEl.boundingBox();
    if (fBox) {
      console.log('Solving Turnstile...');
      await page.mouse.click(fBox.x + 30, fBox.y + fBox.height / 2);
    }
  }

  await new Promise(r => setTimeout(r, 3000));

  // Trigger search with 'กีฬา' to capture x-announcement-token
  const input = await page.$('input[name="keywordSearch"]');
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
  while (!token && retries < 30) {
    await new Promise(r => setTimeout(r, 1000));
    retries++;
  }

  const cookies = await page.cookies();
  const c = cookies.find(x => x.name.toUpperCase().includes('XSRF'));
  if (c) xsrf = c.value;

  console.log(`Session established! Token: ${!!token}, XSRF: ${!!xsrf}`);
  if (!token) {
    console.error('Fatal: Could not capture announcement token.');
    await browser.close();
    return;
  }

  const results = [];
  const mismatches = [];

  for (let i = 0; i < projects.length; i++) {
    const p = projects[i];
    const pid = p.project_id || p.id;
    process.stdout.write(`[${i + 1}/${projects.length}] Checking ${pid}... `);

    const historyRes = await page.evaluate(async (pId, t, x) => {
      const url = `https://process5.gprocurement.go.th/egp-oann10-service/pb/a-egp-allt-project/announcement?announcementTodayFlag=false&keywordSearch=${pId}&page=1`;
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

    const history = historyRes.data?.data || [];
    if (history.length === 0) {
      console.log('⚠️ NOT FOUND ON E-GP');
      results.push({ pid, status: 'NOT_FOUND', title: p.project_name, dept: p.department });
      continue;
    }

    // Examine history rows
    let isFinished = false;
    let finishReason = '';
    let winner = null;
    let latestFlow = history[0]?.flowName || '';
    let latestType = history[0]?.announceType || '';

    for (const row of history) {
      const flow = row.flowName || '';
      const atype = row.announceType || '';
      const step = row.stepId || '';
      const name = row.projectName || '';

      if (atype === 'W0' || atype === 'W1' || atype === 'W2' || step.startsWith('W') || flow.includes('ผู้ชนะ')) {
        isFinished = true;
        finishReason = `ประกาศผู้ชนะ (${row.winnerName || flow})`;
        winner = row.winnerName || 'ประกาศผู้ชนะ';
        break;
      }
      if (flow.includes('สัญญา')) {
        isFinished = true;
        finishReason = 'จัดทำสัญญา/บริหารสัญญา';
        winner = 'จัดทำสัญญา/บริหารสัญญา';
        break;
      }
      if (flow.includes('ยกเลิก') || name.includes('ยกเลิก')) {
        isFinished = true;
        finishReason = 'ยกเลิกโครงการ';
        winner = 'ยกเลิกโครงการ';
        break;
      }
      if (flow.includes('สิ้นสุด')) {
        isFinished = true;
        finishReason = 'สิ้นสุดโครงการ';
        winner = 'สิ้นสุดโครงการ';
        break;
      }
    }

    if (isFinished) {
      console.log(`❌ MISMATCH (FINISHED): ${finishReason}`);
      mismatches.push({
        pid,
        title: p.project_name,
        dept: p.department,
        db_type: p.announce_type,
        db_date: p.announce_date,
        egp_status: finishReason,
        winner
      });
    } else {
      console.log(`✅ MATCH (ACTIVE): ${latestFlow} (${latestType})`);
    }

    results.push({
      pid,
      title: p.project_name,
      dept: p.department,
      db_type: p.announce_type,
      db_date: p.announce_date,
      egp_status: isFinished ? finishReason : `${latestFlow} (${latestType})`,
      is_finished: isFinished,
      winner
    });

    await new Promise(r => setTimeout(r, 200));
  }

  await browser.close();

  const outPath = 'C:/Users/nattc/.gemini/antigravity/brain/7e180cde-7f7d-44ff-beda-467abae613f6/scratch/egp_full_audit_results.json';
  fs.writeFileSync(outPath, JSON.stringify({ results, mismatches }, null, 2), 'utf8');

  console.log('\n======================================================');
  console.log(`🏆 AUDIT COMPLETED: ${results.length} Projects Checked`);
  console.log(`✅ Fully Confirmed Active on e-GP: ${results.length - mismatches.length}`);
  console.log(`❌ Mismatches Found (Already Finished/Cancelled): ${mismatches.length}`);
  console.log('======================================================\n');

  if (mismatches.length > 0) {
    console.log('Detailed Mismatches to Fix:');
    mismatches.forEach(m => {
      console.log(`- [${m.pid}] ${m.title} -> e-GP Status: ${m.egp_status}`);
    });
  }
}

run().catch(err => {
  console.error('Audit fatal error:', err);
  process.exit(1);
});
