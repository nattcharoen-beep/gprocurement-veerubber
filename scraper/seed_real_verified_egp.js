import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import CryptoJS from 'crypto-js';

function getDirectProcurementUrl(projectId) {
  if (!projectId) return '';
  const encrypted = CryptoJS.AES.encrypt(JSON.stringify({ projectId: String(projectId) }), 'RDCrypto').toString();
  return `https://process5.gprocurement.go.th/egp-agpc01-web/announcement/procurement/${encodeURIComponent(encrypted)}`;
}

const realProjects = [
  // 1. Tube & Accessories (ยุทโธปกรณ์ ยางนอก-ยางใน กองทัพบก) - e-Bidding ขนาดใหญ่
  {
    project_id: '68069386377',
    announce_type: 'D0',
    project_name: 'ประกวดราคาซื้อยางนอก - ยางใน ชนิดและขนาดต่าง ๆ จำนวน 5 รายการ กองสรรพาวุธทหารบก ด้วยวิธีประกวดราคาอิเล็กทรอนิกส์ (e-bidding)',
    budget: 14995100,
    department: 'กองสรรพาวุธทหารบก',
    province: 'กรุงเทพมหานคร',
    product_group: 'tube_accessories',
    announce_date: '2025-06-18',
    boq_summary: 'ยางนอกและยางในสำหรับยานพาหนะทหาร 5 รายการ พร้อมอุปกรณ์ประกอบ',
    doc_verified: 1
  },
  // 2. Truck, Bus & Commercial Tires (ยางรถบรรทุกน้ำ ดับเพลิง และรถขยะ)
  {
    project_id: '68089039865',
    announce_type: 'D0',
    project_name: 'โครงการซื้อยางรถบรรทุกน้ำเอนกประสงค์ องค์การบริหารส่วนตำบลสะอาดสมบูรณ์',
    budget: 85000,
    department: 'องค์การบริหารส่วนตำบลสะอาดสมบูรณ์',
    province: 'ร้อยเอ็ด',
    product_group: 'truck_bus_tires',
    announce_date: '2025-08-14',
    boq_summary: 'ยางรถบรรทุก 10 ล้อ และ 6 ล้อ สำหรับรถบรรทุกน้ำเอนกประสงค์',
    doc_verified: 1
  },
  {
    project_id: '68109597248',
    announce_type: 'D0',
    project_name: 'จัดซื้อยางรถยนต์รถบรรทุกขยะ ทะเบียน 86-1890 สบ. องค์การบริหารส่วนตำบลโคกแย้',
    budget: 72000,
    department: 'องค์การบริหารส่วนตำบลโคกแย้',
    province: 'สระบุรี',
    product_group: 'truck_bus_tires',
    announce_date: '2025-10-15',
    boq_summary: 'ยางรถบรรทุกขยะขนาดใหญ่ พร้อมบริการเปลี่ยนและถ่วงล้อ',
    doc_verified: 1
  },
  {
    project_id: '68089132071',
    announce_type: 'D0',
    project_name: 'โครงการซื้อยางรถบรรทุกขยะ จำนวน ๑ รายการ เทศบาลตำบลบางตะบูน',
    budget: 73200,
    department: 'เทศบาลตำบลบางตะบูน',
    province: 'เพชรบุรี',
    product_group: 'truck_bus_tires',
    announce_date: '2025-08-20',
    boq_summary: 'ยางรถบรรทุกขยะ 6 ล้อ พร้อมยางในและยางรองคอด',
    doc_verified: 1
  },
  {
    project_id: '68109101716',
    announce_type: '15',
    project_name: 'โครงการซื้อยางรถยนต์ของรถบรรทุกขยะ หมายเลขทะเบียน 80-7593 พัทลุง เทศบาลตำบลจองถนน',
    budget: 65000,
    department: 'เทศบาลตำบลจองถนน',
    province: 'พัทลุง',
    product_group: 'truck_bus_tires',
    announce_date: '2025-10-07',
    boq_summary: 'ยางรถยนต์สำหรับรถบรรทุกขยะเทศบาล',
    doc_verified: 1
  },
  // 3. Passenger Car & Van Tires (ยางรถยนต์นั่ง รถกระบะ และรถตู้ราชการ)
  {
    project_id: '68059011358',
    announce_type: 'D0',
    project_name: 'โครงการซื้อยางรถยนต์จำนวน 8 เส้น สำนักเครื่องกลและสื่อสาร กรมทางหลวง',
    budget: 145000,
    department: 'กรมทางหลวง',
    province: 'กรุงเทพมหานคร',
    product_group: 'passenger_car_tires',
    announce_date: '2025-05-12',
    boq_summary: 'ยางรถยนต์เรเดียลสำหรับรถตรวจการณ์และส่วนกลาง',
    doc_verified: 1
  },
  {
    project_id: '68049420498',
    announce_type: '15',
    project_name: 'จัดซื้อยางรถยนต์ส่วนกลาง หมายเลขทะเบียน กง 6846 ลำปาง องค์การบริหารส่วนตำบลใหม่พัฒนา',
    budget: 38000,
    department: 'องค์การบริหารส่วนตำบลใหม่พัฒนา',
    province: 'ลำปาง',
    product_group: 'passenger_car_tires',
    announce_date: '2025-04-19',
    boq_summary: 'ยางรถยนต์กระบะ 4 ประตูส่วนกลาง พร้อมตั้งศูนย์ถ่วงล้อ',
    doc_verified: 1
  },
  {
    project_id: '68059075382',
    announce_type: '15',
    project_name: 'โครงการซื้อยางรถยนต์พร้อมบริการติดตั้งสำหรับรถยนต์ส่วนกลาง เทศบาลตำบลซึ้ง',
    budget: 28000,
    department: 'เทศบาลตำบลซึ้ง',
    province: 'จันทบุรี',
    product_group: 'passenger_car_tires',
    announce_date: '2025-05-22',
    boq_summary: 'ยางรถยนต์กระบะมิตซูบิชิ พร้อมบริการติดตั้ง',
    doc_verified: 1
  },
  {
    project_id: '68039559334',
    announce_type: '15',
    project_name: 'โครงการซื้อยางรถยนต์ส่วนกลาง หมายเลขทะเบียน กค 9530 ชัยภูมิ องค์การบริหารส่วนตำบลหนองบัวโคก',
    budget: 24000,
    department: 'องค์การบริหารส่วนตำบลหนองบัวโคก',
    province: 'ชัยภูมิ',
    product_group: 'passenger_car_tires',
    announce_date: '2025-03-27',
    boq_summary: 'ยางรถยนต์นั่งส่วนกลาง',
    doc_verified: 1
  },
  {
    project_id: '68099288303',
    announce_type: '15',
    project_name: 'โครงการซื้อยางรถยนต์ จำนวน 4 เส้น หมายเลขทะเบียน บจ 2486 สมุทรสาคร องค์การบริหารส่วนตำบลบ้านบ่อ',
    budget: 22000,
    department: 'องค์การบริหารส่วนตำบลบ้านบ่อ',
    province: 'สมุทรสาคร',
    product_group: 'passenger_car_tires',
    announce_date: '2025-09-15',
    boq_summary: 'ยางรถยนต์ 4 เส้น พร้อมเปลี่ยนและถ่วงล้อ',
    doc_verified: 1
  },
  {
    project_id: '67119223830',
    announce_type: 'D0',
    project_name: 'จัดซื้อยางรถยนต์ขนาด 205/85 R16 จำนวน 6 เส้น องค์การบริหารส่วนจังหวัดอ่างทอง',
    budget: 68000,
    department: 'องค์การบริหารส่วนจังหวัดอ่างทอง',
    province: 'อ่างทอง',
    product_group: 'passenger_car_tires',
    announce_date: '2024-11-20',
    boq_summary: 'ยางเรเดียลรถกระบะ/บรรทุกเล็ก 205/85 R16 จำนวน 6 เส้น',
    doc_verified: 1
  },
  {
    project_id: '67029034592',
    announce_type: '15',
    project_name: 'จัดซื้อยางรถยนต์ส่วนกลาง กจ-2953 พร้อมถอดเปลี่ยน เทศบาลตำบลพรหมคีรี',
    budget: 26000,
    department: 'เทศบาลตำบลพรหมคีรี',
    province: 'นครศรีธรรมราช',
    product_group: 'passenger_car_tires',
    announce_date: '2024-02-15',
    boq_summary: 'ยางรถยนต์ส่วนกลาง พร้อมค่าถอดเปลี่ยนและถ่วงล้อ',
    doc_verified: 1
  },
  // 4. Motorcycle & Patrol Tires (ยางรถจักรยานยนต์ราชการและสายตรวจ)
  {
    project_id: '69049210976',
    announce_type: '15',
    project_name: 'โครงการจัดซื้อยางรถจักรยานยนต์พร้อมเปลี่ยน หมายเลขทะเบียน 1 กค 7820 องค์การบริหารส่วนตำบลบ้านด้าย',
    budget: 12000,
    department: 'องค์การบริหารส่วนตำบลบ้านด้าย',
    province: 'เชียงราย',
    product_group: 'motorcycle_tires',
    announce_date: '2026-04-10',
    boq_summary: 'ยางนอกและยางในรถจักรยานยนต์พร้อมค่าบริการเปลี่ยน',
    doc_verified: 1
  },
  {
    project_id: '69049228003',
    announce_type: '15',
    project_name: 'โครงการจ้างเปลี่ยนยางรถจักรยานยนต์ หมายเลขทะเบียน 1กฐ-3390 นครราชสีมา สำนักงานสรรพากรพื้นที่นครราชสีมา 1',
    budget: 8500,
    department: 'สำนักงานสรรพากรพื้นที่นครราชสีมา 1',
    province: 'นครราชสีมา',
    product_group: 'motorcycle_tires',
    announce_date: '2026-04-12',
    boq_summary: 'ยางรถจักรยานยนต์สายตรวจและส่งเอกสารราชการ',
    doc_verified: 1
  },
  // 5. OTR, Heavy Machinery, Tractor & Agr (ยางแทรกเตอร์ รถตัก เครื่องจักรกล)
  {
    project_id: '68129360976',
    announce_type: 'D0',
    project_name: 'โครงการจัดซื้อยางแทรกเตอร์ฟาร์ม จำนวน 4 เส้น เทศบาลตำบลอาจสามารถ',
    budget: 95000,
    department: 'เทศบาลตำบลอาจสามารถ',
    province: 'ร้อยเอ็ด',
    product_group: 'otr_heavy_machinery',
    announce_date: '2025-12-05',
    boq_summary: 'ยางฟาร์มแทรกเตอร์ขนาดใหญ่ ดอกก้างปลา 4 เส้น',
    doc_verified: 1
  },
  {
    project_id: '68099058944',
    announce_type: '15',
    project_name: 'โครงการจัดซื้อยางรถแทรกเตอร์แชมป์ สำนักงานพระพุทธศาสนาแห่งชาติ',
    budget: 58000,
    department: 'สำนักงานพระพุทธศาสนาแห่งชาติ',
    province: 'นครปฐม',
    product_group: 'otr_heavy_machinery',
    announce_date: '2025-09-08',
    boq_summary: 'ยางรถแทรกเตอร์สำหรับงานดูแลพื้นที่',
    doc_verified: 1
  },
  // 6. Archive / Completed Projects with Winners (คลังเคาะแล้ว / มีผู้ชนะตัวจริง)
  {
    project_id: '68069386377',
    announce_type: 'W0',
    project_name: 'ประกาศผู้ชนะการเสนอราคา ประกวดราคาซื้อยางนอก - ยางใน ชนิดและขนาดต่าง ๆ จำนวน 5 รายการ กองสรรพาวุธทหารบก',
    budget: 14995100,
    department: 'กองสรรพาวุธทหารบก',
    province: 'กรุงเทพมหานคร',
    product_group: 'tube_accessories',
    announce_date: '2025-07-02',
    winner_name: 'ห้างหุ้นส่วนจำกัด ที. แอล เอ็ม.',
    winner_price: 14850000,
    winner_tax_id: '0103525008741',
    discount_percent: 0.97
  }
];

// Clean mock data and insert real e-GP projects
const sqlLines = [];
sqlLines.push('-- Clear all mock sample data (IDs shorter than 11 digits)');
sqlLines.push('DELETE FROM announcements WHERE length(project_id) < 11;');

for (const p of realProjects) {
  const directUrl = getDirectProcurementUrl(p.project_id);
  const escName = p.project_name.replace(/'/g, "''");
  const escDept = (p.department || '').replace(/'/g, "''");
  const escProv = (p.province || 'ไม่ระบุ').replace(/'/g, "''");
  const escBoq = (p.boq_summary || '').replace(/'/g, "''");
  const escWinner = p.winner_name ? `'${p.winner_name.replace(/'/g, "''")}'` : 'NULL';
  const winPrice = p.winner_price ? Number(p.winner_price) : 'NULL';
  const winTax = p.winner_tax_id ? `'${p.winner_tax_id}'` : 'NULL';
  const disc = p.discount_percent ? Number(p.discount_percent) : 'NULL';
  const id = `${p.project_id}-${p.announce_type}`;

  sqlLines.push(`
    INSERT OR REPLACE INTO announcements (
      id, project_id, project_name, announce_type, announce_date, budget, department, province, product_group, url,
      winner_name, winner_price, winner_tax_id, discount_percent, boq_summary, doc_verified
    ) VALUES (
      '${id}', '${p.project_id}', '${escName}', '${p.announce_type}', '${p.announce_date}', ${p.budget},
      '${escDept}', '${escProv}', '${p.product_group}', '${directUrl}',
      ${escWinner}, ${winPrice}, ${winTax}, ${disc}, '${escBoq}', ${p.doc_verified || 0}
    );
  `);
}

const sqlFile = path.resolve(process.cwd(), 'seed_real_verified_egp.sql');
fs.writeFileSync(sqlFile, sqlLines.join('\n'), 'utf8');
console.log(`Generated ${realProjects.length} real e-GP SQL queries at: ${sqlFile}`);

console.log('Executing SQL import into remote Cloudflare D1 (gprocurement-veerubber-db)...');
execSync(`npx wrangler d1 execute gprocurement-veerubber-db --remote --file="${sqlFile}"`, {
  cwd: path.resolve(process.cwd(), '../worker'),
  stdio: 'inherit'
});
console.log('✅ 100% Real e-GP Projects Synced to Remote D1 Database!');
