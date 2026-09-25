// formatters
const formatMoney = (amount) => {
  if (amount == null) return '-';
  return '฿' + amount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatDate = (dateString) => {
  if (!dateString) return '-';
  const d = new Date(dateString);
  return d.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
};

const typeLabels = {
  'D0': 'เชิญชวน',
  'D1': 'เชิญชวน',
  'IM': 'เชิญชวน',
  'B0': 'ร่าง TOR',
  'B1': 'ร่าง TOR',
  'B2': 'ร่าง TOR',
  'B3': 'ร่าง TOR',
  '15': 'ราคากลาง',
  'BOQ': 'ราคากลาง',
  'P0': 'แผนจัดซื้อ',
  'W0': 'ผู้ชนะ'
};

const groupLabels = {
  'passenger_car_tires': 'ยางรถยนต์ & กระบะ',
  'truck_bus_tires': 'ยางรถบรรทุก & บัส',
  'motorcycle_tires': 'ยางจักรยานยนต์ & สายตรวจ',
  'otr_heavy_machinery': 'ยาง OTR & เครื่องจักร',
  'bicycle_specialty_tires': 'ยางจักรยาน & วีลแชร์',
  'tube_accessories': 'ยางใน & อุปกรณ์'
};

function addWorkDays(startDate, days) {
  const cur = new Date(startDate);
  let added = 0;
  while (added < days) {
    cur.setDate(cur.getDate() + 1);
    const day = cur.getDay();
    if (day !== 0 && day !== 6) { // skip Saturday and Sunday
      added++;
    }
  }
  return cur;
}

const getBiddingTimeline = (announceDateStr, typeKey) => {
  if (!announceDateStr) return null;
  const d = new Date(announceDateStr);
  if (isNaN(d.getTime())) return null;

  if (typeKey === 'D0') {
    // 5 business days for downloading documents (e-Bidding statutory period)
    const docEnd = addWorkDays(d, 5);
    // Next business day is the bidding / auction day
    const bidDay = addWorkDays(docEnd, 1);

    return {
      docStart: formatDate(d),
      docEnd: formatDate(docEnd),
      bidDate: formatDate(bidDay),
      bidTime: '09:00 – 12:00 น.'
    };
  } else if (typeKey === 'B0') {
    // 3 business days for public TOR comment
    const torEnd = addWorkDays(d, 3);
    return {
      torStart: formatDate(d),
      torEnd: formatDate(torEnd)
    };
  }
  return null;
};

window.getBiddingTimeline = getBiddingTimeline;

window.PROVINCE_TO_REGION = {
  // 1. กทม.และปริมณฑล (6 จังหวัด)
  'กรุงเทพมหานคร': { id: 'bkk', name: 'กทม.และปริมณฑล', icon: '🏙️', bg: '#e0f2fe', color: '#0369a1', border: '#7dd3fc' },
  'นนทบุรี': { id: 'bkk', name: 'กทม.และปริมณฑล', icon: '🏙️', bg: '#e0f2fe', color: '#0369a1', border: '#7dd3fc' },
  'ปทุมธานี': { id: 'bkk', name: 'กทม.และปริมณฑล', icon: '🏙️', bg: '#e0f2fe', color: '#0369a1', border: '#7dd3fc' },
  'สมุทรปราการ': { id: 'bkk', name: 'กทม.และปริมณฑล', icon: '🏙️', bg: '#e0f2fe', color: '#0369a1', border: '#7dd3fc' },
  'สมุทรสาคร': { id: 'bkk', name: 'กทม.และปริมณฑล', icon: '🏙️', bg: '#e0f2fe', color: '#0369a1', border: '#7dd3fc' },
  'นครปฐม': { id: 'bkk', name: 'กทม.และปริมณฑล', icon: '🏙️', bg: '#e0f2fe', color: '#0369a1', border: '#7dd3fc' },
  // 2. ภาคกลาง (9 จังหวัด)
  'พระนครศรีอยุธยา': { id: 'central', name: 'ภาคกลาง', icon: '🏛️', bg: '#faf5ff', color: '#6d28d9', border: '#e9d5ff' },
  'สระบุรี': { id: 'central', name: 'ภาคกลาง', icon: '🏛️', bg: '#faf5ff', color: '#6d28d9', border: '#e9d5ff' },
  'นครนายก': { id: 'central', name: 'ภาคกลาง', icon: '🏛️', bg: '#faf5ff', color: '#6d28d9', border: '#e9d5ff' },
  'ลพบุรี': { id: 'central', name: 'ภาคกลาง', icon: '🏛️', bg: '#faf5ff', color: '#6d28d9', border: '#e9d5ff' },
  'สิงห์บุรี': { id: 'central', name: 'ภาคกลาง', icon: '🏛️', bg: '#faf5ff', color: '#6d28d9', border: '#e9d5ff' },
  'อ่างทอง': { id: 'central', name: 'ภาคกลาง', icon: '🏛️', bg: '#faf5ff', color: '#6d28d9', border: '#e9d5ff' },
  'ชัยนาท': { id: 'central', name: 'ภาคกลาง', icon: '🏛️', bg: '#faf5ff', color: '#6d28d9', border: '#e9d5ff' },
  'สมุทรสงคราม': { id: 'central', name: 'ภาคกลาง', icon: '🏛️', bg: '#faf5ff', color: '#6d28d9', border: '#e9d5ff' },
  'สุพรรณบุรี': { id: 'central', name: 'ภาคกลาง', icon: '🏛️', bg: '#faf5ff', color: '#6d28d9', border: '#e9d5ff' },
  // 3. ภาคตะวันออก
  'ชลบุรี': { id: 'east', name: 'ภาคตะวันออก', icon: '🌊', bg: '#ecfeff', color: '#0e7490', border: '#a5f3fc' },
  'ระยอง': { id: 'east', name: 'ภาคตะวันออก', icon: '🌊', bg: '#ecfeff', color: '#0e7490', border: '#a5f3fc' },
  'จันทบุรี': { id: 'east', name: 'ภาคตะวันออก', icon: '🌊', bg: '#ecfeff', color: '#0e7490', border: '#a5f3fc' },
  'ตราด': { id: 'east', name: 'ภาคตะวันออก', icon: '🌊', bg: '#ecfeff', color: '#0e7490', border: '#a5f3fc' },
  'ฉะเชิงเทรา': { id: 'east', name: 'ภาคตะวันออก', icon: '🌊', bg: '#ecfeff', color: '#0e7490', border: '#a5f3fc' },
  'ปราจีนบุรี': { id: 'east', name: 'ภาคตะวันออก', icon: '🌊', bg: '#ecfeff', color: '#0e7490', border: '#a5f3fc' },
  'สระแก้ว': { id: 'east', name: 'ภาคตะวันออก', icon: '🌊', bg: '#ecfeff', color: '#0e7490', border: '#a5f3fc' },
  // 4. ภาคเหนือ
  'เชียงใหม่': { id: 'north', name: 'ภาคเหนือ', icon: '⛰️', bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
  'เชียงราย': { id: 'north', name: 'ภาคเหนือ', icon: '⛰️', bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
  'ลำปาง': { id: 'north', name: 'ภาคเหนือ', icon: '⛰️', bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
  'ลำพูน': { id: 'north', name: 'ภาคเหนือ', icon: '⛰️', bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
  'แม่ฮ่องสอน': { id: 'north', name: 'ภาคเหนือ', icon: '⛰️', bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
  'น่าน': { id: 'north', name: 'ภาคเหนือ', icon: '⛰️', bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
  'พะเยา': { id: 'north', name: 'ภาคเหนือ', icon: '⛰️', bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
  'แพร่': { id: 'north', name: 'ภาคเหนือ', icon: '⛰️', bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
  'อุตรดิตถ์': { id: 'north', name: 'ภาคเหนือ', icon: '⛰️', bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
  'สุโขทัย': { id: 'north', name: 'ภาคเหนือ', icon: '⛰️', bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
  'พิษณุโลก': { id: 'north', name: 'ภาคเหนือ', icon: '⛰️', bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
  'พิจิตร': { id: 'north', name: 'ภาคเหนือ', icon: '⛰️', bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
  'กำแพงเพชร': { id: 'north', name: 'ภาคเหนือ', icon: '⛰️', bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
  'เพชรบูรณ์': { id: 'north', name: 'ภาคเหนือ', icon: '⛰️', bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
  'นครสวรรค์': { id: 'north', name: 'ภาคเหนือ', icon: '⛰️', bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
  'อุทัยธานี': { id: 'north', name: 'ภาคเหนือ', icon: '⛰️', bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
  // 5. ภาคอีสาน
  'นครราชสีมา': { id: 'northeast', name: 'ภาคอีสาน', icon: '🌾', bg: '#fffbeb', color: '#b45309', border: '#fde68a' },
  'ขอนแก่น': { id: 'northeast', name: 'ภาคอีสาน', icon: '🌾', bg: '#fffbeb', color: '#b45309', border: '#fde68a' },
  'อุดรธานี': { id: 'northeast', name: 'ภาคอีสาน', icon: '🌾', bg: '#fffbeb', color: '#b45309', border: '#fde68a' },
  'อุบลราชธานี': { id: 'northeast', name: 'ภาคอีสาน', icon: '🌾', bg: '#fffbeb', color: '#b45309', border: '#fde68a' },
  'บุรีรัมย์': { id: 'northeast', name: 'ภาคอีสาน', icon: '🌾', bg: '#fffbeb', color: '#b45309', border: '#fde68a' },
  'สุรินทร์': { id: 'northeast', name: 'ภาคอีสาน', icon: '🌾', bg: '#fffbeb', color: '#b45309', border: '#fde68a' },
  'ศรีสะเกษ': { id: 'northeast', name: 'ภาคอีสาน', icon: '🌾', bg: '#fffbeb', color: '#b45309', border: '#fde68a' },
  'ชัยภูมิ': { id: 'northeast', name: 'ภาคอีสาน', icon: '🌾', bg: '#fffbeb', color: '#b45309', border: '#fde68a' },
  'มหาสารคาม': { id: 'northeast', name: 'ภาคอีสาน', icon: '🌾', bg: '#fffbeb', color: '#b45309', border: '#fde68a' },
  'ร้อยเอ็ด': { id: 'northeast', name: 'ภาคอีสาน', icon: '🌾', bg: '#fffbeb', color: '#b45309', border: '#fde68a' },
  'กาฬสินธุ์': { id: 'northeast', name: 'ภาคอีสาน', icon: '🌾', bg: '#fffbeb', color: '#b45309', border: '#fde68a' },
  'สกลนคร': { id: 'northeast', name: 'ภาคอีสาน', icon: '🌾', bg: '#fffbeb', color: '#b45309', border: '#fde68a' },
  'นครพนม': { id: 'northeast', name: 'ภาคอีสาน', icon: '🌾', bg: '#fffbeb', color: '#b45309', border: '#fde68a' },
  'มุกดาหาร': { id: 'northeast', name: 'ภาคอีสาน', icon: '🌾', bg: '#fffbeb', color: '#b45309', border: '#fde68a' },
  'ยโสธร': { id: 'northeast', name: 'ภาคอีสาน', icon: '🌾', bg: '#fffbeb', color: '#b45309', border: '#fde68a' },
  'อำนาจเจริญ': { id: 'northeast', name: 'ภาคอีสาน', icon: '🌾', bg: '#fffbeb', color: '#b45309', border: '#fde68a' },
  'หนองคาย': { id: 'northeast', name: 'ภาคอีสาน', icon: '🌾', bg: '#fffbeb', color: '#b45309', border: '#fde68a' },
  'เลย': { id: 'northeast', name: 'ภาคอีสาน', icon: '🌾', bg: '#fffbeb', color: '#b45309', border: '#fde68a' },
  'หนองบัวลำภู': { id: 'northeast', name: 'ภาคอีสาน', icon: '🌾', bg: '#fffbeb', color: '#b45309', border: '#fde68a' },
  'บึงกาฬ': { id: 'northeast', name: 'ภาคอีสาน', icon: '🌾', bg: '#fffbeb', color: '#b45309', border: '#fde68a' },
  // 6. ภาคตะวันตก
  'กาญจนบุรี': { id: 'west', name: 'ภาคตะวันตก', icon: '🌲', bg: '#f0fdf4', color: '#166534', border: '#bbf7d0' },
  'ตาก': { id: 'west', name: 'ภาคตะวันตก', icon: '🌲', bg: '#f0fdf4', color: '#166534', border: '#bbf7d0' },
  'ราชบุรี': { id: 'west', name: 'ภาคตะวันตก', icon: '🌲', bg: '#f0fdf4', color: '#166534', border: '#bbf7d0' },
  'เพชรบุรี': { id: 'west', name: 'ภาคตะวันตก', icon: '🌲', bg: '#f0fdf4', color: '#166534', border: '#bbf7d0' },
  'ประจวบคีรีขันธ์': { id: 'west', name: 'ภาคตะวันตก', icon: '🌲', bg: '#f0fdf4', color: '#166534', border: '#bbf7d0' },
  // 7. ภาคใต้
  'ชุมพร': { id: 'south', name: 'ภาคใต้', icon: '🌴', bg: '#f0fdfa', color: '#0f766e', border: '#99f6e4' },
  'ระนอง': { id: 'south', name: 'ภาคใต้', icon: '🌴', bg: '#f0fdfa', color: '#0f766e', border: '#99f6e4' },
  'สุราษฎร์ธานี': { id: 'south', name: 'ภาคใต้', icon: '🌴', bg: '#f0fdfa', color: '#0f766e', border: '#99f6e4' },
  'นครศรีธรรมราช': { id: 'south', name: 'ภาคใต้', icon: '🌴', bg: '#f0fdfa', color: '#0f766e', border: '#99f6e4' },
  'กระบี่': { id: 'south', name: 'ภาคใต้', icon: '🌴', bg: '#f0fdfa', color: '#0f766e', border: '#99f6e4' },
  'พังงา': { id: 'south', name: 'ภาคใต้', icon: '🌴', bg: '#f0fdfa', color: '#0f766e', border: '#99f6e4' },
  'ภูเก็ต': { id: 'south', name: 'ภาคใต้', icon: '🌴', bg: '#f0fdfa', color: '#0f766e', border: '#99f6e4' },
  'ตรัง': { id: 'south', name: 'ภาคใต้', icon: '🌴', bg: '#f0fdfa', color: '#0f766e', border: '#99f6e4' },
  'พัทลุง': { id: 'south', name: 'ภาคใต้', icon: '🌴', bg: '#f0fdfa', color: '#0f766e', border: '#99f6e4' },
  'สงขลา': { id: 'south', name: 'ภาคใต้', icon: '🌴', bg: '#f0fdfa', color: '#0f766e', border: '#99f6e4' },
  'สตูล': { id: 'south', name: 'ภาคใต้', icon: '🌴', bg: '#f0fdfa', color: '#0f766e', border: '#99f6e4' },
  'ปัตตานี': { id: 'south', name: 'ภาคใต้', icon: '🌴', bg: '#f0fdfa', color: '#0f766e', border: '#99f6e4' },
  'ยะลา': { id: 'south', name: 'ภาคใต้', icon: '🌴', bg: '#f0fdfa', color: '#0f766e', border: '#99f6e4' },
  'นราธิวาส': { id: 'south', name: 'ภาคใต้', icon: '🌴', bg: '#f0fdfa', color: '#0f766e', border: '#99f6e4' }
};

window.getRegionInfo = function(provName) {
  if (!provName) return null;
  const clean = provName.replace(/^จ(ังหวัด|\.)\s*/, '').trim();
  return window.PROVINCE_TO_REGION[clean] || null;
};

// Universal Exclude List to reject false positives
window.EXCLUDE_KEYWORDS = [
  "จ้างออกแบบ", "จ้างควบคุมงาน", "จ้างที่ปรึกษา", "ควบคุมงานก่อสร้าง", "ควบคุมการก่อสร้าง",
  "ปรับปรุงห้องน้ำ", "ห้องน้ำสาธารณะ", "ห้องน้ำ", "ซื้อครุภัณฑ์สำหรับงานซ่อม", "สารเคมี", "กำจัดปลวก", "ปฐมพยาบาล",
  "ถัง", "ถังน้ำ", "ถังสลักเกลียว", "ถังเก็บน้ำ", "สถานีสูบน้ำ", "ท่อส่งน้ำ", "ท่อระบายน้ำ", "ระบบประปา", "บ่อบำบัด", "ประปา",
  "ถนนลาดยาง", "แอสฟัลท์", "ผิวทางแอสฟัลต์", "ป้ายจราจร", "ป้ายแขวนสูง", "ป้ายประชาสัมพันธ์", "ตีเส้นจราจร", "สะพานลอย", "การ์ดเรล",
  "ทางหลวง", "ทางหลวงหมายเลข", "ผิวทาง", "ปรับระดับผิวทาง", "ปรับปรุงถนน", "ถนนสาย", "ถมดิน", "กำแพงกันดิน",
  "ไฟฟ้าส่องสว่าง", "ไฟส่องสว่าง", "ไฟฟ้าแสงสว่าง", "โคมไฟถนน", "เสาไฟ",
  "โซลาร์เซลล์", "โซลาร์", "พลังงานแสงอาทิตย์", "ผลิตไฟฟ้าพลังงาน",
  "หม้อแปลงไฟฟ้า", "จอภาพ", "จอ LED", "LED", "กล้องวงจรปิด", "CCTV", "กล้องโทรทัศน์",
  "รักษาความปลอดภัย", "รปภ", "จ้างเหมาบริการ", "ดูแลทำความสะอาด", "รักษาความสะอาด", "ทำความสะอาด", "แม่บ้าน", "จัดเก็บขยะ", "จัดซื้อที่ดิน",
  "จ้างดูแลรักษา", "จ้างดูแลบำรุงรักษา", "จ้างเหมาดูแล",
  "ตรายาง", "น้ำดื่ม", "ยางรถยนต์", "ถุงมือยาง", "ยางลบ", "ยาเวชภัณฑ์", "เครื่องพยุงน้ำหนัก", "เตียงผู้ป่วย",
  "ห้องประชุม", "อาหาร", "อาหารกลางวัน",
  "ชุดกีฬา", "เสื้อกีฬา", "ลูกฟุตบอล", "ลูกบาส", "ลูกวอลเลย์บอล", "ถ้วยรางวัล", "เหรียญรางวัล", "อุปกรณ์กีฬา",
  "ลู่วิ่งไฟฟ้า", "จักรยานออกกำลังกาย", "เครื่องปรับอากาศ",
  "เทศกาล", "การแข่งขัน", "จัดงาน", "มหกรรม", "จัดกิจกรรม", "นำเที่ยว", "ส่งเสริมการท่องเที่ยว",
  "festival", "organizer", "สัมมนา", "อบรม", "ยุทธกีฬา", "ฝึกหลักสูตร", "สป.สายวศ."
];

window.isExcluded = function(title) {
  if (!title) return false;
  const lower = title.toLowerCase();

  if (lower.includes('ยกเลิก')) return true;

  // 2. Core tire business terms for Vee Rubber
  const isTargetBusiness = [
    'ยางรถยนต์', 'ยางรถกระบะ', 'ยางรถปิกอัพ', 'ยางรถตู้', 'ยางรถบรรทุก', 'ยางรถจักรยานยนต์', 'ยางมอเตอร์ไซค์',
    'ยางเรเดียล', 'ยาง radial', 'ยาง otr', 'ยางเครื่องจักรกล', 'ยางรถแทรกเตอร์', 'ยางรถไถ', 'ยางรถตัก',
    'ยางรถเกลี่ยดิน', 'ยางรถบด', 'ยางรถยก', 'ยาง forklift', 'ยางตัน', 'ยางลมรถยก', 'ยางรถจักรยาน',
    'ยางวีลแชร์', 'ยางใน', 'ยางในบิวทิล', 'ยางรองคอด', 'จุ๊บลมยาง', 'จัดซื้อยาง', 'ซื้อยาง'
  ].some(k => lower.includes(k));

  if (isTargetBusiness) {
    const hardExcludes = ['ยางมะตอย', 'แอสฟัลต์', 'ถุงมือยาง', 'ยางลบ', 'ตรายาง', 'ปะยาง', 'น้ำยางพารา'];
    return hardExcludes.some(kw => lower.includes(kw));
  }

  if (Array.isArray(window.EXCLUDE_KEYWORDS) && window.EXCLUDE_KEYWORDS.some(ex => lower.includes(ex.toLowerCase()))) return true;
  return false;
};


