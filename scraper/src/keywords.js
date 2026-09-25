/**
 * Vee Rubber Corporation Ltd. (กลุ่มบริษัท วีรับเบอร์)
 * Website: https://veerubber.co.th/
 * Facebook: https://www.facebook.com/veerubberthailand/
 * เลขทะเบียนนิติบุคคล: 0105552000071
 * 
 * 6 Core Product Groups for Government Procurement & B2G e-GP Tracking:
 * 1. passenger_car_tires - ยางรถยนต์นั่ง ยางรถกระบะ และรถตู้ราชการ
 * 2. truck_bus_tires - ยางรถบรรทุก รถบัส และรถเชิงพาณิชย์
 * 3. motorcycle_tires - ยางรถจักรยานยนต์ราชการและสายตรวจ
 * 4. otr_heavy_machinery - ยาง OTR เครื่องจักรกลหนัก รถแทรกเตอร์ & รถเกษตร
 * 5. bicycle_specialty_tires - ยางรถจักรยาน วีลแชร์ & รถเฉพาะทาง
 * 6. tube_accessories - ยางใน ยางรองคอด & อุปกรณ์ล้อยาง
 */

export const PRODUCT_GROUPS = {
  // 1. ยางรถยนต์นั่ง ยางรถกระบะ และรถตู้ราชการ (Passenger Car, Pickup & Van Tires)
  passenger_car_tires: [
    "ยางรถยนต์", "จัดซื้อยางรถยนต์", "ซื้อยางรถยนต์", "เปลี่ยนยางรถยนต์", "ยางเรเดียล", "ยาง radial",
    "ยางรถยนต์นั่ง", "ยางรถเก๋ง", "ยางรถกระบะ", "ยางรถปิกอัพ", "ยางรถยนต์กระบะ", "ยางรถตู้", "ยางรถตู้ส่วนกลาง",
    "ยางรถยนต์ส่วนกลาง", "ยางรถส่วนกลาง", "ยางรถประจำตำแหน่ง", "ยางรถยนต์ราชการ", "ยางรถราชการ",
    "ยางรถ SUV", "ยางรถตรวจการณ์", "ยางรถยนต์ตรวจการณ์", "ยางรถยนต์ 4 ล้อ", "ยางรถขับเคลื่อน 4 ล้อ",
    "ยางรถพยาบาล", "ยางรถตู้พยาบาล", "ยางรถกู้ชีพ", "ยางรถฉุกเฉิน", "ยางรถพยาบาลฉุกเฉิน",
    "ยางรถสายตรวจ", "ยางรถยนต์สายตรวจ", "ยางรถยนต์ตำรวจ",
    // ขนาดยางเรเดียลรถยนต์ยอดนิยมในส่วนราชการ
    "195/65R15", "195/60R15", "185/65R15", "205/55R16", "205/60R16", "215/60R16",
    "215/55R17", "215/50R17", "215/45R17", "225/50R17", "225/55R17", "225/65R17",
    "235/60R18", "235/55R19", "265/65R17", "265/60R18", "265/70R16", "245/70R16",
    "195R14C", "205/70R15", "215/70R15", "215/70R16", "Vee Rubber Vitron", "Vee Rubber City Cross"
  ],

  // 2. ยางรถบรรทุก รถบัส และรถเชิงพาณิชย์ (Truck, Bus & Commercial Tires)
  truck_bus_tires: [
    "ยางรถบรรทุก", "จัดซื้อยางรถบรรทุก", "ซื้อยางรถบรรทุก", "ยางรถบรรทุก 6 ล้อ", "ยางรถบรรทุก 10 ล้อ",
    "ยางรถบรรทุกหกล้อ", "ยางรถบรรทุกสิบล้อ", "ยางรถบรรทุกขนาดใหญ่", "ยางรถพ่วง", "ยางรถกึ่งพ่วง", "ยางรถเทรลเลอร์",
    "ยางรถบัส", "ยางรถโดยสาร", "ยางรถบัสปรับอากาศ", "ยางรถโดยสารปรับอากาศ", "ยางรถมินิบัส",
    "ยางรถบรรทุกน้ำ", "ยางรถบรรทุกขยะ", "ยางรถขยะ", "ยางรถสุขาภิบาล", "ยางรถดับเพลิง", "ยางรถบรรทุกน้ำดับเพลิง",
    "ยางรถกู้ภัยดับเพลิง", "ยางรถบรรทุกเทท้าย", "ยางรถดัมพ์", "ยางรถดูดสิ่งปฏิกูล", "ยางรถเครน", "ยางรถสิบล้อ",
    // ขนาดยางเรเดียลและผ้าใบรถบรรทุก
    "11R22.5", "12R22.5", "295/80R22.5", "315/80R22.5", "275/70R22.5", "9.00R20", "10.00R20",
    "11.00R20", "12.00R20", "8.25R16", "7.50R16", "7.00R16", "8.25-16", "7.50-16",
    "ยาง TBR", "ยางผ้าใบรถบรรทุก", "ยางเรเดียลรถบรรทุก", "Extra Load", "Vee Rubber Truck"
  ],

  // 3. ยางรถจักรยานยนต์ราชการและสายตรวจ (Motorcycle, Scooter & Patrol Tires)
  motorcycle_tires: [
    "ยางรถจักรยานยนต์", "จัดซื้อยางรถจักรยานยนต์", "ซื้อยางรถจักรยานยนต์", "ยางมอเตอร์ไซค์", "ยางนอกรถจักรยานยนต์",
    "ยางรถจักรยานยนต์สายตรวจ", "ยางรถจักรยานยนต์ตรวจการณ์", "ยางรถสายตรวจจักรยานยนต์", "ยางรถจักรยานยนต์ตำรวจ",
    "ยางรถจักรยานยนต์กู้ชีพ", "ยางรถจักรยานยนต์ส่งสาร", "ยางรถจักรยานยนต์เทศกิจ",
    // ประเภทยางจักรยานยนต์
    "ยางสตรีท", "ยางสกู๊ตเตอร์", "ยางโมโตครอส", "ยางวิบาก", "ยาง Enduro", "ยาง Trail", "ยาง Bigbike",
    "Street Tires", "Scooter Tires", "Motocross Tires", "Maxi Scooter", "VRM",
    // ขนาดยางยอดนิยม
    "70/90-17", "80/90-17", "60/100-17", "70/100-17", "2.50-17", "2.75-17",
    "80/90-14", "90/90-14", "100/90-14", "110/80-14", "120/70-14", "140/70-14",
    "110/70-12", "120/70-12", "130/70-12", "120/70-17", "160/60-17", "180/55-17"
  ],

  // 4. ยาง OTR เครื่องจักรกลหนัก รถแทรกเตอร์ & รถเกษตร (OTR, Heavy Machinery, Tractor & Agr)
  otr_heavy_machinery: [
    "ยาง OTR", "ยาง Off The Road", "ยางเครื่องจักรกลหนัก", "ยางเครื่องจักรกล", "ยางเครื่องจักรกลก่อสร้าง",
    "ยางเครื่องจักรกลงานทาง", "ยางเครื่องจักร", "ยางรถแทรกเตอร์", "ยางรถไถ", "ยางรถไถฟาร์ม",
    "ยางรถการเกษตร", "ยางเครื่องจักรกลการเกษตร", "ยางรถเพื่อการเกษตร",
    "ยางรถเกลี่ยดิน", "ยางรถเกลี่ย", "Motor Grader", "ยางรถตัก", "Wheel Loader", "ยางรถตักหน้าขุดหลัง",
    "Backhoe Loader", "ยางรถบด", "ยางรถบดถนน", "ยางรถบดล้อยาง", "Road Roller", "ยางรถขุด",
    "ยางรถยก", "ยาง Forklift", "ยางฟอร์คลิฟท์", "ยางตันรถยก", "ยางลมรถยก", "Solid Tire",
    // ขนาดยาง OTR & แทรกเตอร์
    "17.5-25", "20.5-25", "23.5-25", "26.5-25", "14.00-24", "13.00-24",
    "16.9-28", "18.4-30", "18.4-34", "12.4-24", "9.5-24", "8.3-24", "6.00-9", "7.00-12", "28x9-15"
  ],

  // 5. ยางรถจักรยาน วีลแชร์ & ยานพาหนะเฉพาะทาง (Bicycle, Wheelchair, Golf Cart & ATV Tires)
  bicycle_specialty_tires: [
    "ยางรถจักรยาน", "จัดซื้อยางรถจักรยาน", "ซื้อยางรถจักรยาน", "ยางนอกจักรยาน", "ยางในจักรยาน",
    "ยางจักรยานเสือภูเขา", "Mountain Bike Tire", "ยางจักรยานซิตี้ไบค์", "City Bike Tire", "BMX Tire",
    "ยางรถเข็นคนพิการ", "ยางรถเข็น", "ยางวีลแชร์", "Wheelchair Tire", "ยางรถเข็นผู้ป่วย", "ยางรถเข็นนั่ง",
    "ยางรถกอล์ฟ", "Golf Cart Tire", "ยางรถ ATV", "ATV Tire", "ยางรถ UTV", "ยางรถตัดหญ้า", "Lawn Mower Tire",
    "Fatbike Tire", "จักรยานยืมเรียน", "จักรยานเพื่อการท่องเที่ยว", "จักรยานสายตรวจ"
  ],

  // 6. ยางใน ยางรองคอด & อุปกรณ์ล้อยาง (Inner Tubes, Flaps & Tire Valves)
  tube_accessories: [
    "ยางใน", "จัดซื้อยางใน", "ซื้อยางใน", "ยางในรถยนต์", "ยางในรถบรรทุก", "ยางในรถจักรยานยนต์",
    "ยางในรถจักรยาน", "ยางในรถแทรกเตอร์", "ยางในรถตัก", "ยางในรถเพื่อการเกษตร",
    "ยางในบิวทิล", "ยางในเรเดียล", "ยางในธรรมชาติ", "Inner Tube", "Butyl Tube", "Natural Rubber Tube",
    "ยางรองคอด", "ยางรองกะทะล้อ", "ยางรองขอบล้อ", "Flap", "Rim Flap",
    "จุ๊บลม", "จุ๊บยาง", "วาล์วยาง", "วาล์วยางรถยนต์", "Tire Valve", "อุปกรณ์ถอดเปลี่ยนยาง"
  ]
};

// Exclude list to reject false positives (strictly irrelevant goods, medical gloves, stationery rubber, asphalt)
export const EXCLUDE_KEYWORDS = [
  // 1. Stationery & Office Rubber
  "ยางลบ", "ตรายาง", "หมึกตรายาง", "ยางวง", "ยางรัดของ", "ยางรัด",
  // 2. Medical, PPE & Hygiene
  "ถุงมือยาง", "ถุงมือตรวจโรค", "ถุงมือแพทย์", "ถุงมือผ่าตัด", "ถุงยางอนามัย", "ท่อสายยางการแพทย์",
  // 3. Raw Agricultural Rubber & Plantation
  "น้ำยางพารา", "ยางพาราแผ่น", "ขี้ยาง", "กล้ายางพารา", "ต้นยางพารา", "กรีดยาง", "สวนยางพารา",
  // 4. Civil Asphalt, Road Construction & Vegetation
  "ยางมะตอย", "ยางมะตอยผสมเสร็จ", "แอสฟัลต์", "แอสฟัลท์", "asphalt", "ผิวทางแอสฟัลต์", "ยางหยอดรอยต่อ", "ยางมะตอยหยอดรอยต่อ",
  "แผ่นยางปูพื้น", "ยางปูพื้น", "กระเบื้องยาง", "ยางกันชนเสา",
  "ตัดแต่งกิ่งไม้", "ตัดกิ่ง", "ตัดแต่ง", "ตัดหญ้า", "วัชพืช", "ต้นไม้", "จัดสวน", "ทำไม้หวงห้าม",
  "ซ่อมแซมถนน", "ก่อสร้างถนน", "ปรับปรุงถนน", "บำรุงถนน", "ผิวจราจร", "หินคลุก", "ลูกรัง", "ลาดยาง", "กากยาง",
  "สเลอรี่ซีล", "css-1", "ac 60", "ทางหลวง", "สะพาน", "บ่อพัก", "คอนกรีต", "คูร่องยาง",
  // 5. Architectural Glazing & Seal Rubber
  "ขอบยางกระจก", "ขอบยางประตู", "ขอบยางตู้เย็น", "ซีลยาง", "ปะเก็นยาง", "สายยางฉีดน้ำ", "สายยางรดน้ำ",
  // 6. Minor repair services & Non-tire supplies from municipalities named Yang
  "ปะยาง", "ค่าปะยาง", "จ้างปะยาง", "ซ่อมปะยาง", "เปลี่ยนถ่ายน้ำมันเครื่อง", "โช๊คแก๊ส", "เซ็นเซอร์เตือนแรงดันลมยาง",
  "วัสดุสำนักงาน", "หมึกเครื่องถ่าย", "เครื่องสูบน้ำ", "คลอรีน", "อาหารเสริม", "คอมพิวเตอร์",
  "บังเกอร์", "หลุมหลบภัย", "แผงกั้นจราจร", "กรวยยาง", "ขายางกันลื่น", "เก้าอี้พลาสติก", "โต๊ะทำงาน",
  "ถังดับเพลิง", "ถับดับเพลิง", "จัดเก็บ ขน และกำจัดขยะ", "ดูแลสนามฟุตบอล", "ซ่อมแซมประตูในอาคาร", "ป้ายอบรม",
  // 7. General non-tire consultancy / catering / entertainment
  "จ้างออกแบบ", "จ้างที่ปรึกษา", "อาหารกลางวัน", "จัดเลี้ยง", "ชุดกีฬา", "ลูกฟุตบอล"
];

// Flat keywords array
export const KEYWORDS = Object.values(PRODUCT_GROUPS).flat();

/**
 * Check if an announcement title is a genuine vehicle tire procurement
 * Rejects whole vehicle purchases, road construction, tree trimming, and office supplies
 * @param {string} title - The title of the announcement
 * @returns {boolean} True if genuine tire project
 */
export function isGenuineTireAnnouncement(title) {
  if (!title) return false;
  const lower = title.toLowerCase();

  // 1. Exclude list
  for (const ex of EXCLUDE_KEYWORDS) {
    if (lower.includes(ex.toLowerCase())) {
      return false;
    }
  }

  // 2. Reject whole vehicle purchases (e.g. buying 6-wheel crane truck, buying backhoe, buying roller)
  // unless the title explicitly states it is purchasing/replacing TIRES for that vehicle
  const wholeVehicleRegex = /^(?:ประกวดราคา)?(?:ซื้อ|จัดซื้อ|เช่า)\s*รถ(?:ยนต์)?(?:บรรทุก|ตัก|บด|ขุด|เกลี่ย|แทรกเตอร์|ยก|ฟอร์คลิฟท์|ดับเพลิง|ขยะ|พยาบาล|กู้ชีพ|กู้ภัย|กระเช้า|ดูด|สุขาภิบาล|ส่วนกลาง|ประจำตำแหน่ง|ตู้|กระบะ|ปิกอัพ|โดยสาร|บัส|มินิบัส)/;
  if (wholeVehicleRegex.test(lower)) {
    if (!/(?:ซื้อ|จัดซื้อ|เปลี่ยน)\s*ยาง/.test(lower) && !/ยางรถ/.test(lower) && !/ยางนอก/.test(lower) && !/ยางล้อ/.test(lower)) {
      return false;
    }
  }

  // 3. Must match at least one genuine vehicle tire pattern
  const genuineTireRegex = /ยางรถ|ยางนอก|ยางล้อ|ยางเรเดียล|ยาง radial|ยาง tbr|ยาง otr|ยางตัน|ยางผ้าใบ|ซื้อยาง|จัดซื้อยาง|เปลี่ยนยาง|จ้างเปลี่ยนยาง|สลับยาง|ประเภทยางรถ|วัสดุยานพาหนะ.*ยาง|ยางใหม่.*สำหรับรถ|ยางพร้อมติดตั้ง|ยางใน\s*(?:รถ|บิวทิล|สำหรับ|จำนวน)|\b\d{3}\/\d{2}[rR]\d{2}\b|\b\d{1,2}\.\d{2}[rR]\d{2}\b|\b\d{1,2}\.\d{2}-\d{2}\b/;
  return genuineTireRegex.test(lower);
}

/**
 * Classify announcement title into Vee Rubber product groups based on keywords
 * @param {string} title - The title of the announcement
 * @returns {Array<{group: string, matchedKeywords: string[]}>} Array of matched groups with keywords
 */
export function classifyAnnouncement(title) {
  if (!title) return [];
  if (!isGenuineTireAnnouncement(title)) return [];

  const lowerTitle = title.toLowerCase();
  const matchedGroups = [];

  for (const [group, keywords] of Object.entries(PRODUCT_GROUPS)) {
    const matched = keywords.filter(keyword => lowerTitle.includes(keyword.toLowerCase()));
    
    if (matched.length > 0) {
      matchedGroups.push({
        group,
        matchedKeywords: matched
      });
    }
  }

  // If passed genuine check but didn't match specific dimension from PRODUCT_GROUPS,
  // classify based on vehicle type
  if (matchedGroups.length === 0) {
    if (/จักรยานยนต์|มอเตอร์ไซค์|สายตรวจ|สกู๊ตเตอร์|วิบาก/.test(lowerTitle)) {
      matchedGroups.push({ group: 'motorcycle_tires', matchedKeywords: ['ยางรถจักรยานยนต์'] });
    } else if (/รถบรรทุก|สิบล้อ|หกล้อ|6 ล้อ|10 ล้อ|รถบัส|โดยสาร|มินิบัส|รถพ่วง|เทรลเลอร์|รถดับเพลิง|รถขยะ|รถสุขาภิบาล|รถดัมพ์|รถดูด/.test(lowerTitle)) {
      matchedGroups.push({ group: 'truck_bus_tires', matchedKeywords: ['ยางรถบรรทุก'] });
    } else if (/otr|แทรกเตอร์|รถไถ|รถตัก|รถบด|รถยก|ฟอร์คลิฟท์|forklift|เครื่องจักรกล/.test(lowerTitle)) {
      matchedGroups.push({ group: 'otr_heavy_machinery', matchedKeywords: ['ยาง OTR & เครื่องจักร'] });
    } else if (/จักรยาน|วีลแชร์|รถเข็น|กอล์ฟ|atv|utv/.test(lowerTitle)) {
      matchedGroups.push({ group: 'bicycle_specialty_tires', matchedKeywords: ['ยางจักรยาน & วีลแชร์'] });
    } else if (/ยางใน|ยางรองคอด|จุ๊บลม|วาล์วยาง/.test(lowerTitle)) {
      matchedGroups.push({ group: 'tube_accessories', matchedKeywords: ['ยางใน & อุปกรณ์'] });
    } else {
      matchedGroups.push({ group: 'passenger_car_tires', matchedKeywords: ['ยางรถยนต์ & กระบะ'] });
    }
  }

  return matchedGroups;
}

