import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import CryptoJS from 'crypto-js';
import { getEgpSessionToken } from './src/capsolver.js';
import { extractProvince } from './src/province-extractor.js';

function loadEnvIfAvailable() {
  const envCandidates = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), '../.env')
  ];
  for (const p of envCandidates) {
    if (fs.existsSync(p)) {
      const content = fs.readFileSync(p, 'utf8');
      const lines = content.split(/\r?\n/);
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
        const idx = trimmed.indexOf('=');
        const key = trimmed.substring(0, idx).trim();
        const val = trimmed.substring(idx + 1).trim().replace(/^["']|["']$/g, '');
        if (key && !process.env[key]) {
          process.env[key] = val;
        }
      }
      break;
    }
  }
}

function getDirectProcurementUrl(projectId) {
  if (!projectId) return '';
  const encrypted = CryptoJS.AES.encrypt(JSON.stringify({ projectId: String(projectId) }), 'RDCrypto').toString();
  return `https://process5.gprocurement.go.th/egp-agpc01-web/announcement/procurement/${encodeURIComponent(encrypted)}`;
}

async function scanRealEgpProjects() {
  loadEnvIfAvailable();
  const CAPSOLVER_API_KEY = process.env.CAPSOLVER_API_KEY;

  console.log('=== VEE RUBBER PRECISION REAL e-GP HARVESTER ===');
  console.log('Resolving e-GP session via CapSolver...');

  let session = await getEgpSessionToken(CAPSOLVER_API_KEY);
  let sessionTime = Date.now();
  console.log('Session acquired successfully!');

  const keywords = [
    // 1. passenger_car_tires
    { kw: 'เปลี่ยนยางรถยนต์', group: 'passenger_car_tires' },
    { kw: 'ยางรถยนต์', group: 'passenger_car_tires' },
    { kw: 'ยางรถตู้', group: 'passenger_car_tires' },
    { kw: 'ยางรถกระบะ', group: 'passenger_car_tires' },
    // 2. truck_bus_tires
    { kw: 'ซื้อยางรถบรรทุก', group: 'truck_bus_tires' },
    { kw: 'ยางรถบรรทุก', group: 'truck_bus_tires' },
    { kw: 'ยางรถบัส', group: 'truck_bus_tires' },
    { kw: 'ยางรถโดยสาร', group: 'truck_bus_tires' },
    { kw: 'ยางรถดับเพลิง', group: 'truck_bus_tires' },
    { kw: 'ยางรถขยะ', group: 'truck_bus_tires' },
    // 3. motorcycle_tires
    { kw: 'ซื้อยางรถจักรยานยนต์', group: 'motorcycle_tires' },
    { kw: 'ยางรถจักรยานยนต์', group: 'motorcycle_tires' },
    { kw: 'ยางมอเตอร์ไซค์', group: 'motorcycle_tires' },
    // 4. otr_heavy_machinery
    { kw: 'ยางรถแทรกเตอร์', group: 'otr_heavy_machinery' },
    { kw: 'ยางรถไถ', group: 'otr_heavy_machinery' },
    { kw: 'ยางรถตัก', group: 'otr_heavy_machinery' },
    { kw: 'ยางรถบด', group: 'otr_heavy_machinery' },
    { kw: 'ยางรถยก', group: 'otr_heavy_machinery' },
    { kw: 'ยางตัน', group: 'otr_heavy_machinery' },
    // 5. bicycle_specialty_tires
    { kw: 'ยางรถจักรยาน', group: 'bicycle_specialty_tires' },
    { kw: 'ยางวีลแชร์', group: 'bicycle_specialty_tires' },
    { kw: 'ยางรถเข็นคนพิการ', group: 'bicycle_specialty_tires' },
    { kw: 'ยางรถกอล์ฟ', group: 'bicycle_specialty_tires' },
    // 6. tube_accessories
    { kw: 'ยางใน', group: 'tube_accessories' },
    { kw: 'ยางรองคอด', group: 'tube_accessories' }
  ];

  const seenProjectIds = new Set();
  const allProjects = [];

  const sqlFilePath = path.resolve(process.cwd(), 'real_veerubber_egp.sql');
  // Initialize SQL file
  fs.writeFileSync(sqlFilePath, `-- Real e-GP Vee Rubber Procurement Projects\nDELETE FROM announcements WHERE length(project_id) < 11;\n`, 'utf8');

  for (const item of keywords) {
    let kwCount = 0;
    for (let page = 1; page <= 3; page++) {
      if (Date.now() - sessionTime > 150000) {
        console.log('[e-GP] Refreshing session token...');
        session = await getEgpSessionToken(CAPSOLVER_API_KEY);
        sessionTime = Date.now();
      }

      const url = `https://process5.gprocurement.go.th/egp-oann10-service/pb/a-egp-allt-project/announcement?announcementTodayFlag=false&budgetYear=2569&keywordSearch=${encodeURIComponent(item.kw)}&page=${page}`;
      try {
        const res = await fetch(url, {
          signal: AbortSignal.timeout(12000),
          headers: {
            'x-announcement-token': session.token,
            'cookie': session.cookies,
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
            'referer': 'https://process5.gprocurement.go.th/egp-agpc01-web/announcement',
            'noDataProfile': 'noDataProfile',
            'accept': 'application/json, text/plain, */*'
          }
        });

        if (!res.ok) {
          if (res.status === 429) {
            console.log('  [429 Throttled] Cooling down 25s...');
            await new Promise(r => setTimeout(r, 25000));
            session = await getEgpSessionToken(CAPSOLVER_API_KEY);
            sessionTime = Date.now();
          }
          break;
        }

        const json = await res.json();
        const rows = Array.isArray(json.data) ? json.data : (json.data?.data || []);
        if (rows.length === 0) break;

        for (const r of rows) {
          if (!r.projectId || seenProjectIds.has(r.projectId)) continue;
          let annDate = r.announceDate;
          if (annDate && annDate.includes('T')) annDate = annDate.split('T')[0];

          const aType = r.announceType || 'D0';
          const title = (r.projectName || '').trim();

          if (title.includes('ยกเลิก')) continue;

          // Exclusions
          const lower = title.toLowerCase();
          if (
            lower.includes('อาหารกลางวัน') || 
            lower.includes('ยางมะตอย') || 
            lower.includes('แอสฟัลต์') ||
            lower.includes('แอสฟัลท์') ||
            lower.includes('ถนนลาดยาง') ||
            lower.includes('ถุงมือยาง') ||
            lower.includes('น้ำยางพารา') ||
            lower.includes('ยางพาราแผ่น') ||
            lower.includes('ยางลบ') ||
            lower.includes('ตรายาง') ||
            lower.includes('ปะยาง') ||
            lower.includes('แผ่นยางปูพื้น') ||
            lower.includes('พื้นยาง') ||
            lower.includes('กระเบื้องยาง')
          ) {
            continue;
          }

          seenProjectIds.add(r.projectId);
          const budgetVal = r.projectMoney || r.priceBuild || 0;
          const directUrl = getDirectProcurementUrl(r.projectId);
          const provinceName = extractProvince(r.deptName, title, r.rdbProvinceMoiName);

          const isWinner = ['W0', 'W1', 'W2', 'W3'].includes(aType) || r.winnerName;

          const projRecord = {
            id: `${r.projectId}-${aType}`,
            project_id: String(r.projectId),
            project_name: title,
            announce_type: aType,
            announce_date: annDate || new Date().toISOString().split('T')[0],
            budget: budgetVal,
            department: r.deptName || 'หน่วยงานภาครัฐ',
            province: provinceName,
            product_group: item.group,
            url: directUrl,
            winner_name: r.winnerName || null,
            winner_price: r.winnerPrice || null,
            winner_tax_id: r.winnerTaxId || null,
            discount_percent: r.discountPercent || null,
            boq_summary: `ตรวจพบงานจัดซื้อยางและอุปกรณ์ (${item.kw})`,
            doc_verified: 1
          };

          allProjects.push(projRecord);
          kwCount++;

          // Append SQL row immediately
          const escName = projRecord.project_name.replace(/'/g, "''");
          const escDept = (projRecord.department || '').replace(/'/g, "''");
          const escProv = (projRecord.province || 'ไม่ระบุ').replace(/'/g, "''");
          const escBoq = (projRecord.boq_summary || '').replace(/'/g, "''");
          const escUrl = (projRecord.url || '').replace(/'/g, "''");
          const escWinner = projRecord.winner_name ? `'${projRecord.winner_name.replace(/'/g, "''")}'` : 'NULL';
          const winPrice = projRecord.winner_price ? Number(projRecord.winner_price) : 'NULL';
          const winTax = projRecord.winner_tax_id ? `'${projRecord.winner_tax_id}'` : 'NULL';
          const disc = projRecord.discount_percent ? Number(projRecord.discount_percent) : 'NULL';

          const sqlRow = `INSERT OR REPLACE INTO announcements (id, project_id, project_name, announce_type, announce_date, budget, department, province, product_group, url, winner_name, winner_price, winner_tax_id, discount_percent, boq_summary, doc_verified) VALUES ('${projRecord.id}', '${projRecord.project_id}', '${escName}', '${projRecord.announce_type}', '${projRecord.announce_date}', ${Number(projRecord.budget) || 0}, '${escDept}', '${escProv}', '${projRecord.product_group}', '${escUrl}', ${escWinner}, ${winPrice}, ${winTax}, ${disc}, '${escBoq}', ${projRecord.doc_verified});\n`;
          fs.appendFileSync(sqlFilePath, sqlRow, 'utf8');
        }
      } catch (err) {
        console.warn(`  Fetch error on "${item.kw}": ${err.message}`);
        break;
      }

      await new Promise(r => setTimeout(r, 1200));
    }
    if (kwCount > 0) {
      console.log(`  [2569] "${item.kw}": +${kwCount} projects (Total: ${allProjects.length})`);
    }
  }

  console.log(`\n======================================================`);
  console.log(`🏆 FOUND TOTAL ${allProjects.length} REAL PROJECTS FROM e-GP`);
  console.log(`======================================================`);

  if (allProjects.length === 0) {
    console.log('No projects found to sync.');
    return;
  }

  console.log('Executing SQL import into remote Cloudflare D1 database (gprocurement-veerubber-db)...');
  execSync(`npx wrangler d1 execute gprocurement-veerubber-db --remote --file="${sqlFilePath}"`, {
    cwd: path.resolve(process.cwd(), '../worker'),
    stdio: 'inherit'
  });
  console.log('✅ Remote D1 Sync Completed Successfully!');
}

scanRealEgpProjects().catch(console.error);
