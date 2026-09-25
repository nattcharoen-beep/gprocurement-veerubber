import fs from 'fs';
import { classifyAnnouncement } from './src/keywords.js';

const rawSql = fs.readFileSync('fresh_veerubber_2569.sql', 'utf8');
const lines = rawSql.split('\n').filter(l => l.startsWith('INSERT'));
console.log('Total insert lines in sql:', lines.length);

function getBestGroup(title) {
  const matches = classifyAnnouncement(title);
  const priority = ['truck_bus_tires', 'motorcycle_tires', 'otr_heavy_machinery', 'bicycle_specialty_tires', 'tube_accessories', 'passenger_car_tires'];
  
  if (matches && matches.length > 0) {
    for (const p of priority) {
      if (matches.some(m => m.group === p)) return p;
    }
  }

  // Fallbacks if keywords regex didn't catch
  if (title.includes('บรรทุก') || title.includes('ขยะ') || title.includes('ดับเพลิง') || title.includes('บัส') || title.includes('หกล้อ') || title.includes('สิบล้อ')) return 'truck_bus_tires';
  if (title.includes('จักรยานยนต์') || title.includes('มอเตอร์ไซค์') || title.includes('สายตรวจ')) return 'motorcycle_tires';
  if (title.includes('แทรกเตอร์') || title.includes('รถตัก') || title.includes('รถยก') || title.includes('OTR') || title.includes('รถไถ') || title.includes('ฟอร์คลิฟท์')) return 'otr_heavy_machinery';
  if (title.includes('จักรยาน') || title.includes('วีลแชร์')) return 'bicycle_specialty_tires';
  if (title.includes('ยางใน') || title.includes('จุ๊บ')) return 'tube_accessories';
  return 'passenger_car_tires';
}

const groupCounts = {};
let fixedSql = 'DELETE FROM announcements;\n';
let count = 0;

for (const line of lines) {
  const valuesIdx = line.indexOf('VALUES (');
  if (valuesIdx === -1) continue;
  
  // Extract values part
  const valuesStr = line.substring(valuesIdx + 8, line.length - 2); // remove closing ');'
  // Split carefully by comma taking into account quoted strings
  // Simple regex for our generated SQL format:
  const match = line.match(/VALUES \('([^']+)', '([^']+)', '((?:[^']|'')*)', '([^']+)', '([^']+)', ([0-9.]+), '((?:[^']|'')*)', '((?:[^']|'')*)', '([^']+)', '([^']+)', ([0-9]+), '((?:[^']|'')*)'/);
  
  if (match) {
    const id = match[1];
    const pid = match[2];
    const title = match[3].replace(/''/g, "'");
    const aType = match[4];
    const aDate = match[5];
    const budget = match[6];
    const dept = match[7].replace(/''/g, "'");
    const prov = match[8].replace(/''/g, "'");
    const url = match[10];
    
    const realGroup = getBestGroup(title);
    groupCounts[realGroup] = (groupCounts[realGroup] || 0) + 1;
    const newSummary = `ตรวจพบสินค้ากลุ่ม ${realGroup}: ${title.slice(0, 70)}`;
    
    const escTitle = title.replace(/'/g, "''");
    const escDept = dept.replace(/'/g, "''");
    const escProv = prov.replace(/'/g, "''");
    const escSummary = newSummary.replace(/'/g, "''");
    
    fixedSql += `INSERT OR REPLACE INTO announcements (id, project_id, project_name, announce_type, announce_date, budget, department, province, product_group, url, doc_verified, boq_summary, created_at, updated_at) VALUES ('${id}', '${pid}', '${escTitle}', '${aType}', '${aDate}', ${budget}, '${escDept}', '${escProv}', '${realGroup}', '${url}', 1, '${escSummary}', datetime('now'), datetime('now'));\n`;
    count++;
  }
}

fs.writeFileSync('fresh_veerubber_2569_fixed.sql', fixedSql, 'utf8');
console.log('Reclassified and saved', count, 'projects to fresh_veerubber_2569_fixed.sql');
console.log('Group counts:', groupCounts);
