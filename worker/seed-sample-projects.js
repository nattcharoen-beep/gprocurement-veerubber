// Use native fetch

const sampleAnnouncements = [
  {
    id: "69010001",
    project_id: "69010001001",
    project_name: "ยางรถยนต์นั่งและรถกระบะส่วนกลาง เทศบาลนครนนทบุรี",
    announce_type: "D0",
    announce_date: new Date().toISOString(),
    budget: 850000,
    department: "เทศบาลนครนนทบุรี",
    province: "นนทบุรี",
    product_group: "passenger_car_tires",
    url: "https://process.gprocurement.go.th"
  },
  {
    id: "69010002",
    project_id: "69010002002",
    project_name: "ซื้อยางรถบรรทุกน้ำและรถขยะ 10 ล้อ องค์การบริหารส่วนจังหวัดเชียงใหม่",
    announce_type: "B0",
    announce_date: new Date().toISOString(),
    budget: 1450000,
    department: "องค์การบริหารส่วนจังหวัดเชียงใหม่",
    province: "เชียงใหม่",
    product_group: "truck_bus_tires",
    url: "https://process.gprocurement.go.th"
  },
  {
    id: "69010003",
    project_id: "69010003003",
    project_name: "จัดซื้อยางรถจักรยานยนต์สายตรวจ สถานีตำรวจภูธรเมืองพัทยา",
    announce_type: "15",
    announce_date: new Date().toISOString(),
    budget: 320000,
    department: "สถานีตำรวจภูธรเมืองพัทยา",
    province: "ชลบุรี",
    product_group: "motorcycle_tires",
    url: "https://process.gprocurement.go.th"
  },
  {
    id: "69010004",
    project_id: "69010004004",
    project_name: "ซื้อยางเครื่องจักรกลหนัก OTR รถตักและรถเกลี่ยดิน กรมทางหลวงชนบท",
    announce_type: "P0",
    announce_date: new Date().toISOString(),
    budget: 2800000,
    department: "กรมทางหลวงชนบท",
    province: "กรุงเทพมหานคร",
    product_group: "otr_heavy_machinery",
    url: "https://process.gprocurement.go.th"
  },
  {
    id: "69010005",
    project_id: "69010005005",
    project_name: "ซื้อยางในและยางรองคอดรถบรรทุกส่วนกลาง กรมชลประทาน",
    announce_type: "W0",
    announce_date: new Date().toISOString(),
    budget: 450000,
    department: "กรมชลประทาน",
    province: "กรุงเทพมหานคร",
    product_group: "tube_accessories",
    url: "https://process.gprocurement.go.th",
    winner_name: "บริษัท วีรับเบอร์ คอร์ปอเรชั่น จำกัด",
    winner_price: 440000,
    winner_tax_id: "0105556012345",
    discount_percent: 2.22
  }
];

(async () => {
  console.log('Uploading sample announcements to local Worker...');
  const res = await fetch('http://localhost:8787/api/upload/announcements', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': 'veerubber-scraper-internal-api-key'
    },
    body: JSON.stringify(sampleAnnouncements)
  });
  console.log('Status:', res.status);
  const json = await res.json();
  console.log('Upload Result:', JSON.stringify(json, null, 2));
})();
