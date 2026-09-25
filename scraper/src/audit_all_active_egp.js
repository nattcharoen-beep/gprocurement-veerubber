import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import fs from 'fs';

puppeteer.use(StealthPlugin());

async function run() {
  console.log('Fetching active projects from Worker API...');
  const apiRes = await fetch('https://gprocurement-finder.natt-charoen.workers.dev/api/announcements?limit=200', {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  const apiJson = await apiRes.json();
  const activeProjects = apiJson.data || [];
  console.log('Total active projects to audit:', activeProjects.length);

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

  console.log('Navigating to e-GP portal...');
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

  console.log('Token captured:', !!token, 'XSRF captured:', !!xsrf);
  if (!token) {
    console.error('Failed to get token!');
    await browser.close();
    return;
  }

  const auditResults = [];
  let count = 0;

  for (const proj of activeProjects) {
    count++;
    const pid = proj.project_id || proj.id;
    process.stdout.write(`[${count}/${activeProjects.length}] Auditing ${pid}... `);

    const pidYear = pid.length >= 2 ? '25' + pid.slice(0, 2) : '2569';
    const res = await page.evaluate(async (pId, bYear, t, x) => {
      const url = `https://process5.gprocurement.go.th/egp-oann10-service/pb/a-egp-allt-project/announcement?announcementTodayFlag=false&budgetYear=${bYear}&keywordSearch=${pId}&page=1`;
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
    }, pid, pidYear, token, xsrf);

    const history = Array.isArray(res?.data) ? res.data : (res?.data?.data || []);
    let isFinished = false;
    let finishReason = '';
    let latestFlow = '';
    let latestType = '';
    let winnerName = null;

    if (history.length === 0) {
      console.log('NO HISTORY FOUND ON E-GP');
      auditResults.push({
        pid,
        title: proj.project_name,
        dept: proj.department,
        db_type: proj.announce_type,
        db_date: proj.announce_date,
        egp_status: 'NOT_FOUND',
        action_needed: 'CHECK_MANUAL'
      });
      continue;
    }

    // Check all history events for completion / cancellation
    for (const row of history) {
      const aType = row.announceType || '';
      const step = row.stepId || '';
      const flow = row.flowName || '';
      const name = row.projectName || '';
      if (!latestFlow) {
        latestFlow = flow;
        latestType = aType;
      }

      if (aType === 'W0' || aType === 'W1' || aType === 'W2' || step.startsWith('W') || flow.includes('ผู้ชนะ')) {
        isFinished = true;
        finishReason = 'ผู้ชนะราคา (' + (row.winnerName || flow) + ')';
        winnerName = row.winnerName || 'ประกาศผู้ชนะการเสนอราคา';
        break;
      }
      if (flow.includes('สัญญา') || flow.includes('จัดทำสัญญา')) {
        isFinished = true;
        finishReason = 'จัดทำสัญญา/บริหารสัญญา';
        winnerName = 'จัดทำสัญญา/บริหารสัญญา';
        break;
      }
      if (flow.includes('ยกเลิก') || name.includes('ยกเลิก')) {
        isFinished = true;
        finishReason = 'ยกเลิกโครงการ';
        winnerName = 'ยกเลิกโครงการ';
        break;
      }
      if (flow.includes('สิ้นสุด')) {
        isFinished = true;
        finishReason = 'สิ้นสุดโครงการ';
        winnerName = 'สิ้นสุดโครงการ';
        break;
      }
    }

    if (isFinished) {
      console.log(`❌ COMPLETED/CANCELLED: ${finishReason}`);
    } else {
      console.log(`✅ ACTIVE ON E-GP: ${latestFlow} (${latestType})`);
    }

    auditResults.push({
      pid,
      title: proj.project_name,
      dept: proj.department,
      db_type: proj.announce_type,
      db_date: proj.announce_date,
      egp_latest_flow: latestFlow,
      egp_latest_type: latestType,
      is_finished: isFinished,
      finish_reason: finishReason,
      winner_name: winnerName,
      history_count: history.length
    });

    // small throttle
    await new Promise(r => setTimeout(r, 200));
  }

  await browser.close();

  fs.writeFileSync('audit_results.json', JSON.stringify(auditResults, null, 2), 'utf8');
  console.log('\n=== AUDIT SUMMARY ===');
  const finishedList = auditResults.filter(r => r.is_finished);
  const activeList = auditResults.filter(r => !r.is_finished && r.egp_status !== 'NOT_FOUND');
  console.log(`Total Audited: ${auditResults.length}`);
  console.log(`Truly Active: ${activeList.length}`);
  console.log(`Found Finished/Cancelled: ${finishedList.length}`);

  if (finishedList.length > 0) {
    console.log('\nList of projects that must be removed from active:');
    finishedList.forEach(f => {
      console.log(`- [${f.pid}] ${f.title} -> Reason: ${f.finish_reason}`);
    });
  }
}

run().catch(console.error);
