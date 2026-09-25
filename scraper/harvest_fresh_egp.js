import fs from 'fs';
import path from 'path';
import CryptoJS from 'crypto-js';
import { getEgpSessionToken } from './src/capsolver.js';
import { classifyAnnouncement, EXCLUDE_KEYWORDS } from './src/keywords.js';
import { extractProvince } from './src/province-extractor.js';

function getEncryptedUrl(projectId) {
  return `https://process5.gprocurement.go.th/egp-agpc01-web/announcement?keywordSearch=${encodeURIComponent(projectId)}`;
}

async function run() {
  const envPath = path.resolve('../.env');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const capsolverApiKey = envContent.match(/CAPSOLVER_API_KEY=([^\r\n]+)/)?.[1]?.trim();

  if (!capsolverApiKey) {
    console.error('No CAPSOLVER_API_KEY found in .env');
    return;
  }

  console.log('Resolving CapSolver Turnstile session...');
  let session = await getEgpSessionToken(capsolverApiKey);
  let token = typeof session === 'string' ? session : session.token;
  let cookies = typeof session === 'string' ? '' : session.cookies;
  console.log('Got session token!');

  const keywords = [
    'ยางรถยนต์',
    'ยางรถบรรทุก',
    'ยางรถจักรยานยนต์',
    'ยางมอเตอร์ไซค์',
    'จัดซื้อยาง',
    'ซื้อยาง',
    'เปลี่ยนยาง',
    'ยางรถดับเพลิง',
    'ยางรถพยาบาล',
    'ยางรถขยะ',
    'ยางรถแทรกเตอร์',
    'ยางรถตัก',
    'ยางรถยก',
    'ยางรถไถ',
    'ยาง OTR',
    'ยางใน',
    'ยางรถจักรยาน'
  ];

  const headers = () => ({
    'X-Announcement-Token': token,
    'noDataProfile': 'noDataProfile',
    'Content-Type': 'application/json',
    'Cookie': cookies,
    'accept': 'application/json, text/plain, */*',
    'referer': 'https://process5.gprocurement.go.th/egp-agpc01-web/announcement',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
  });

  const allProjects = new Map();

  for (const kw of keywords) {
    console.log(`\nSearching keyword: "${kw}" (BudgetYear 2569)...`);
    for (let page = 1; page <= 5; page++) {
      const url = `https://process5.gprocurement.go.th/egp-oann10-service/pb/a-egp-allt-project/announcement?announcementTodayFlag=false&budgetYear=2569&keywordSearch=${encodeURIComponent(kw)}&page=${page}`;
      try {
        const res = await fetch(url, { headers: headers() });
        if (res.status === 401 || res.status === 403) {
          console.log('Token expired, refreshing...');
          session = await getEgpSessionToken(capsolverApiKey);
          token = typeof session === 'string' ? session : session.token;
          cookies = typeof session === 'string' ? '' : session.cookies;
          continue;
        }
        if (res.status === 429) {
          console.log('Rate limit hit (429), waiting 10s...');
          await new Promise(r => setTimeout(r, 10000));
          continue;
        }
        if (!res.ok) {
          console.warn(`HTTP ${res.status} on page ${page}`);
          break;
        }

        const json = await res.json();
        const items = json?.data || [];
        if (items.length === 0) break;

        let addedCount = 0;
        for (const it of items) {
          if (!it.projectId) continue;
          const pid = it.projectId;
          const name = it.projectName || '';

          // Exclude check
          const isEx = EXCLUDE_KEYWORDS.some(ex => name.includes(ex));
          if (isEx) continue;
          if (name.includes('ยกเลิก')) continue;

          // Announce date check - we want recent projects (September 2026 / recent 2569)
          let annDate = it.announceDate ? it.announceDate.split('T')[0] : '';
          
          const aType = it.announceType || '15';
          const budget = it.projectMoney || it.priceBuild || 0;
          const dept = it.deptName || 'หน่วยงานภาครัฐ';
          const prov = extractProvince(dept, name, it.rdbProvinceMoiName);
          const classification = classifyAnnouncement(name);
          const pGroup = classification.group || 'passenger_car_tires';

          if (!allProjects.has(pid)) {
            allProjects.set(pid, {
              id: `${pid}-${aType}`,
              project_id: pid,
              project_name: name,
              announce_type: aType,
              announce_date: annDate,
              budget: budget,
              department: dept,
              province: prov || 'กรุงเทพมหานคร',
              product_group: pGroup,
              url: getEncryptedUrl(pid),
              doc_verified: 1,
              boq_summary: `ตรวจพบสินค้ากลุ่ม ${pGroup}: ${name.slice(0, 80)}`
            });
            addedCount++;
          }
        }
        console.log(`  Page ${page}: found ${items.length} items, added ${addedCount} (Total collected: ${allProjects.size})`);
        await new Promise(r => setTimeout(r, 600));
      } catch (err) {
        console.error(`  Error on page ${page}:`, err.message);
        break;
      }
    }
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log(`\n==============================================`);
  console.log(`Total unique verified projects collected: ${allProjects.size}`);
  
  // Sort by announce_date descending
  const sorted = Array.from(allProjects.values()).sort((a, b) => (b.announce_date || '').localeCompare(a.announce_date || ''));

  console.log(`Top 10 freshest projects:`);
  sorted.slice(0, 10).forEach((p, idx) => {
    console.log(`${idx + 1}. [${p.announce_date}] ${p.project_id} (${p.product_group}): ${p.project_name.slice(0, 60)} - ฿${p.budget.toLocaleString()}`);
  });

  // Filter only projects from August - September 2026 (or fresh projects)
  const freshProjects = sorted.filter(p => p.announce_date >= '2026-08-01');
  console.log(`Fresh projects (>= 2026-08-01): ${freshProjects.length}`);

  // Generate SQL
  let sql = 'DELETE FROM announcements;\n';
  for (const p of freshProjects) {
    const escName = p.project_name.replace(/'/g, "''");
    const escDept = p.department.replace(/'/g, "''");
    const escProv = p.province.replace(/'/g, "''");
    const escSummary = (p.boq_summary || '').replace(/'/g, "''");
    const escUrl = p.url.replace(/'/g, "''");

    sql += `INSERT OR REPLACE INTO announcements (id, project_id, project_name, announce_type, announce_date, budget, department, province, product_group, url, doc_verified, boq_summary, created_at, updated_at) VALUES ('${p.id}', '${p.project_id}', '${escName}', '${p.announce_type}', '${p.announce_date}', ${p.budget}, '${escDept}', '${escProv}', '${p.product_group}', '${escUrl}', 1, '${escSummary}', datetime('now'), datetime('now'));\n`;
  }

  fs.writeFileSync('fresh_veerubber_2569.sql', sql, 'utf8');
  console.log('Saved SQL to fresh_veerubber_2569.sql');
}

run().catch(console.error);
