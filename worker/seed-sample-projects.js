// Use native fetch

const sampleAnnouncements = [
  {
    id: "69010001",
    project_id: "69010001001",
    project_name: "ประกวดราคาจ้างก่อสร้างสนามฟุตซอลพร้อมพื้นยางสังเคราะห์และหลังคาคลุม อบต.บางกรวย",
    announce_type: "D0",
    announce_date: new Date().toISOString(),
    budget: 3500000,
    department: "องค์การบริหารส่วนตำบลบางกรวย",
    province: "นนทบุรี",
    product_group: "sport_flooring",
    url: "https://process.gprocurement.go.th"
  },
  {
    id: "69010002",
    project_id: "69010002002",
    project_name: "จ้างปรับปรุงลู่วิ่งและลานกรีฑายางสังเคราะห์ EPDM สนามกีฬากลางจังหวัดเชียงใหม่",
    announce_type: "B0",
    announce_date: new Date().toISOString(),
    budget: 7200000,
    department: "องค์การบริหารส่วนจังหวัดเชียงใหม่",
    province: "เชียงใหม่",
    product_group: "sport_flooring",
    url: "https://process.gprocurement.go.th"
  },
  {
    id: "69010003",
    project_id: "69010003003",
    project_name: "ประกวดราคาจ้างก่อสร้างสนามเด็กเล่นสร้างปัญญาและพื้นยางกันกระแทกนิรภัย เทศบาลนครหาดใหญ่",
    announce_type: "15",
    announce_date: new Date().toISOString(),
    budget: 1850000,
    department: "เทศบาลนครหาดใหญ่",
    province: "สงขลา",
    product_group: "playground",
    url: "https://process.gprocurement.go.th"
  },
  {
    id: "69010004",
    project_id: "69010004004",
    project_name: "แผนจัดซื้อจัดจ้างปรับปรุงพื้นสนามกีฬาอเนกประสงค์โพลียูรีเทน (PU) ศูนย์กีฬาเฉลิมพระเกียรติ",
    announce_type: "P0",
    announce_date: new Date().toISOString(),
    budget: 4500000,
    department: "การกีฬาแห่งประเทศไทย",
    province: "กรุงเทพมหานคร",
    product_group: "sport_flooring",
    url: "https://process.gprocurement.go.th"
  },
  {
    id: "69010005",
    project_id: "69010005005",
    project_name: "ประกวดราคาจ้างทำพื้นอีพ็อกซี่ (Epoxy Flooring) อาคารซ่อมบำรุงโรงงานผลิตยา",
    announce_type: "D0",
    announce_date: new Date().toISOString(),
    budget: 2200000,
    department: "องค์การเภสัชกรรม",
    province: "ปทุมธานี",
    product_group: "factory_flooring",
    url: "https://process.gprocurement.go.th"
  },
  {
    id: "69010006",
    project_id: "69010006006",
    project_name: "ประกาศผู้ชนะการเสนอราคา ก่อสร้างสนามฟุตซอลหญ้าเทียมมาตรฐาน เทศบาลเมืองหัวหิน",
    announce_type: "W0",
    announce_date: new Date().toISOString(),
    budget: 2800000,
    department: "เทศบาลเมืองหัวหิน",
    province: "ประจวบคีรีขันธ์",
    product_group: "sport_flooring",
    url: "https://process.gprocurement.go.th",
    winner_name: "บริษัท สปอร์ต คอนสตรัคชั่น กรุ๊ป จำกัด",
    winner_price: 2450000,
    winner_tax_id: "0105556012345",
    discount_percent: 12.50
  },
  {
    id: "69010007",
    project_id: "69010007007",
    project_name: "ประกาศผู้ชนะการเสนอราคา งานปรับปรุงพื้นระบบกันซึมดาดฟ้าอาคารเรียน 4 ชั้น",
    announce_type: "W0",
    announce_date: new Date().toISOString(),
    budget: 1500000,
    department: "มหาวิทยาลัยราชภัฏเชียงราย",
    province: "เชียงราย",
    product_group: "waterproofing",
    url: "https://process.gprocurement.go.th",
    winner_name: "ห้างหุ้นส่วนจำกัด เหนือการช่าง แอนด์ โค้ทติ้ง",
    winner_price: 1380000,
    winner_tax_id: "0503554009876",
    discount_percent: 8.00
  }
];

(async () => {
  console.log('Uploading sample announcements to local Worker...');
  const res = await fetch('http://localhost:8787/api/upload/announcements', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': 'blucher-scraper-internal-api-key'
    },
    body: JSON.stringify(sampleAnnouncements)
  });
  console.log('Status:', res.status);
  const json = await res.json();
  console.log('Upload Result:', JSON.stringify(json, null, 2));
})();
