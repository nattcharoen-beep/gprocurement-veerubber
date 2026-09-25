// app.js — Dashboard logic
let currentPage = 1;
const limit = 100;

// Fallback label mappings if not defined in common.js
if (typeof typeLabels === 'undefined') {
  window.typeLabels = {
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
}

if (typeof groupLabels === 'undefined') {
  window.groupLabels = {
    'passenger_car_tires': 'ยางรถยนต์ & กระบะ', 'truck_bus_tires': 'ยางรถบรรทุก & บัส', 'motorcycle_tires': 'ยางจักรยานยนต์ & สายตรวจ', 'otr_heavy_machinery': 'ยาง OTR & เครื่องจักร', 'bicycle_specialty_tires': 'ยางจักรยาน & วีลแชร์', 'tube_accessories': 'ยางใน & อุปกรณ์'
  };
}

if (typeof formatMoney === 'undefined') {
  window.formatMoney = function(amount) {
    if (!amount && amount !== 0) return 'ไม่ระบุ';
    return '฿' + Number(amount).toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };
}

if (typeof formatDate === 'undefined') {
  window.formatDate = function(dateStr) {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch { return dateStr; }
  };
}

window.renderBoqKeywordBox = function(item) {
  if (!item || (!item.boq_summary && !item.boq_matches && !item.doc_verified)) return '';
  
  let keyword = '';
  // 1. Try to get keyword from boq_matches
  if (item.boq_matches) {
    try {
      const matches = typeof item.boq_matches === 'string' ? JSON.parse(item.boq_matches) : item.boq_matches;
      if (Array.isArray(matches) && matches.length > 0 && matches[0].keyword) {
        keyword = matches[0].keyword;
      }
    } catch (e) {}
  }
  
  // 2. Try to get keyword from boq_summary regex: พบสเปก "([^\"]+)"
  if (!keyword && item.boq_summary) {
    const m = item.boq_summary.match(/พบสเปก\s*["“]([^"”]+)["”]/i);
    if (m && m[1]) {
      keyword = m[1];
    }
  }

  // 3. Fallback from product_group
  if (!keyword) {
    if (item.product_group === 'passenger_car_tires') keyword = 'ยางรถยนต์ & กระบะ';
    else if (item.product_group === 'truck_bus_tires') keyword = 'ยางรถบรรทุก & บัส';
    else if (item.product_group === 'motorcycle_tires') keyword = 'ยางจักรยานยนต์ & สายตรวจ';
    else if (item.product_group === 'otr_heavy_machinery') keyword = 'ยาง OTR & เครื่องจักร';
    else if (item.product_group === 'bicycle_specialty_tires') keyword = 'ยางจักรยาน & วีลแชร์';
    else if (item.product_group === 'tube_accessories') keyword = 'ยางใน & อุปกรณ์';
    else keyword = 'จัดซื้อยางราชการ';
  }

  return `
    <div class="boq-verified-box" style="background: #f0fdf4; border: 1.5px solid #86efac; border-radius: 8px; padding: 12px 18px; margin: 12px 0; color: #14532d; display: flex; align-items: center; gap: 12px; box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);">
      <span style="font-size: 1.8rem; line-height: 1;">🎯</span>
      <div style="display: flex; align-items: center; flex-wrap: wrap; gap: 8px;">
        <span style="font-size: 1.15rem; font-weight: 800; color: #15803d; white-space: nowrap;">ตรวจพบ Keyword =</span>
        <span style="background: #15803d; color: #ffffff; padding: 3px 14px; border-radius: 6px; font-size: 1.35rem; font-weight: 800; letter-spacing: 0.3px; white-space: nowrap;">${keyword}</span>
      </div>
    </div>
  `;
};

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

// Global copyText with visual feedback
window.copyText = function(text, btn) {
  if (!text) return;
  const doFeedback = (b) => {
    if (b) {
      const origText = b.innerHTML;
      b.innerHTML = '✅ คัดลอกแล้ว!';
      b.style.background = '#28a745';
      b.style.color = '#ffffff';
      b.style.borderColor = '#28a745';
      setTimeout(() => {
        b.innerHTML = origText;
        b.style.background = '';
        b.style.color = '';
        b.style.borderColor = '';
      }, 2500);
    }
  };

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      doFeedback(btn);
    }).catch(() => {
      fallbackCopy(text, btn, doFeedback);
    });
  } else {
    fallbackCopy(text, btn, doFeedback);
  }
};

function fallbackCopy(text, btn, doFeedback) {
  const t = document.createElement('input');
  t.value = text;
  document.body.appendChild(t);
  t.select();
  document.execCommand('copy');
  document.body.removeChild(t);
  doFeedback(btn);
}

// Default keywords - Comprehensive Vee Rubber Business Keywords (6 Core Groups)
const DEFAULT_KEYWORDS = {
  passenger_car_tires: [
    "ยางรถยนต์", "จัดซื้อยางรถยนต์", "ซื้อยางรถยนต์", "เปลี่ยนยางรถยนต์", "ยางเรเดียล", "ยาง radial",
    "ยางรถยนต์นั่ง", "ยางรถเก๋ง", "ยางรถกระบะ", "ยางรถปิกอัพ", "ยางรถยนต์กระบะ", "ยางรถตู้", "ยางรถตู้ส่วนกลาง",
    "ยางรถยนต์ส่วนกลาง", "ยางรถส่วนกลาง", "ยางรถประจำตำแหน่ง", "ยางรถยนต์ราชการ", "ยางรถราชการ",
    "ยางรถ SUV", "ยางรถตรวจการณ์", "ยางรถยนต์ตรวจการณ์", "ยางรถยนต์ 4 ล้อ", "ยางรถขับเคลื่อน 4 ล้อ",
    "ยางรถพยาบาล", "ยางรถตู้พยาบาล", "ยางรถกู้ชีพ", "ยางรถฉุกเฉิน", "ยางรถพยาบาลฉุกเฉิน",
    "ยางรถสายตรวจ", "ยางรถยนต์สายตรวจ", "ยางรถยนต์ตำรวจ",
    "195/65R15", "195/60R15", "185/65R15", "205/55R16", "205/60R16", "215/60R16",
    "215/55R17", "215/50R17", "215/45R17", "225/50R17", "225/55R17", "225/65R17",
    "235/60R18", "235/55R19", "265/65R17", "265/60R18", "265/70R16", "245/70R16",
    "195R14C", "205/70R15", "215/70R15", "215/70R16", "Vee Rubber Vitron", "Vee Rubber City Cross"
  ],
  truck_bus_tires: [
    "ยางรถบรรทุก", "จัดซื้อยางรถบรรทุก", "ซื้อยางรถบรรทุก", "ยางรถบรรทุก 6 ล้อ", "ยางรถบรรทุก 10 ล้อ",
    "ยางรถบรรทุกหกล้อ", "ยางรถบรรทุกสิบล้อ", "ยางรถบรรทุกขนาดใหญ่", "ยางรถพ่วง", "ยางรถกึ่งพ่วง", "ยางรถเทรลเลอร์",
    "ยางรถบัส", "ยางรถโดยสาร", "ยางรถบัสปรับอากาศ", "ยางรถโดยสารปรับอากาศ", "ยางรถมินิบัส",
    "ยางรถบรรทุกน้ำ", "ยางรถบรรทุกขยะ", "ยางรถขยะ", "ยางรถสุขาภิบาล", "ยางรถดับเพลิง", "ยางรถบรรทุกน้ำดับเพลิง",
    "ยางรถกู้ภัยดับเพลิง", "ยางรถบรรทุกเทท้าย", "ยางรถดัมพ์", "ยางรถดูดสิ่งปฏิกูล", "ยางรถเครน", "ยางรถสิบล้อ",
    "11R22.5", "12R22.5", "295/80R22.5", "315/80R22.5", "275/70R22.5", "9.00R20", "10.00R20",
    "11.00R20", "12.00R20", "8.25R16", "7.50R16", "7.00R16", "8.25-16", "7.50-16",
    "ยาง TBR", "ยางผ้าใบรถบรรทุก", "ยางเรเดียลรถบรรทุก", "Extra Load", "Vee Rubber Truck"
  ],
  motorcycle_tires: [
    "ยางรถจักรยานยนต์", "จัดซื้อยางรถจักรยานยนต์", "ซื้อยางรถจักรยานยนต์", "ยางมอเตอร์ไซค์", "ยางนอกรถจักรยานยนต์",
    "ยางรถจักรยานยนต์สายตรวจ", "ยางรถจักรยานยนต์ตรวจการณ์", "ยางรถสายตรวจจักรยานยนต์", "ยางรถจักรยานยนต์ตำรวจ",
    "ยางรถจักรยานยนต์กู้ชีพ", "ยางรถจักรยานยนต์ส่งสาร", "ยางรถจักรยานยนต์เทศกิจ",
    "ยางสตรีท", "ยางสกู๊ตเตอร์", "ยางโมโตครอส", "ยางวิบาก", "ยาง Enduro", "ยาง Trail", "ยาง Bigbike",
    "70/90-17", "80/90-17", "60/100-17", "70/100-17", "2.50-17", "2.75-17",
    "80/90-14", "90/90-14", "100/90-14", "110/80-14", "120/70-14", "140/70-14",
    "110/70-12", "120/70-12", "130/70-12", "120/70-17", "160/60-17", "180/55-17"
  ],
  otr_heavy_machinery: [
    "ยาง OTR", "ยาง Off The Road", "ยางเครื่องจักรกลหนัก", "ยางเครื่องจักรกล", "ยางเครื่องจักรกลก่อสร้าง",
    "ยางเครื่องจักรกลงานทาง", "ยางเครื่องจักร", "ยางรถแทรกเตอร์", "ยางรถไถ", "ยางรถไถฟาร์ม",
    "ยางรถการเกษตร", "ยางเครื่องจักรกลการเกษตร", "ยางรถเพื่อการเกษตร",
    "ยางรถเกลี่ยดิน", "ยางรถเกลี่ย", "Motor Grader", "ยางรถตัก", "Wheel Loader", "ยางรถตักหน้าขุดหลัง",
    "Backhoe Loader", "ยางรถบด", "ยางรถบดถนน", "ยางรถบดล้อยาง", "Road Roller", "ยางรถขุด",
    "ยางรถยก", "ยาง Forklift", "ยางฟอร์คลิฟท์", "ยางตันรถยก", "ยางลมรถยก", "Solid Tire",
    "17.5-25", "20.5-25", "23.5-25", "26.5-25", "14.00-24", "13.00-24",
    "16.9-28", "18.4-30", "18.4-34", "12.4-24", "9.5-24", "8.3-24", "6.00-9", "7.00-12", "28x9-15"
  ],
  bicycle_specialty_tires: [
    "ยางรถจักรยาน", "จัดซื้อยางรถจักรยาน", "ซื้อยางรถจักรยาน", "ยางนอกจักรยาน", "ยางในจักรยาน",
    "ยางจักรยานเสือภูเขา", "Mountain Bike Tire", "ยางจักรยานซิตี้ไบค์", "City Bike Tire", "BMX Tire",
    "ยางรถเข็นคนพิการ", "ยางรถเข็น", "ยางวีลแชร์", "Wheelchair Tire", "ยางรถเข็นผู้ป่วย", "ยางรถเข็นนั่ง",
    "ยางรถกอล์ฟ", "Golf Cart Tire", "ยางรถ ATV", "ATV Tire", "ยางรถ UTV", "ยางรถตัดหญ้า", "Lawn Mower Tire",
    "Fatbike Tire", "จักรยานยืมเรียน", "จักรยานเพื่อการท่องเที่ยว", "จักรยานสายตรวจ"
  ],
  tube_accessories: [
    "ยางใน", "จัดซื้อยางใน", "ซื้อยางใน", "ยางในรถยนต์", "ยางในรถบรรทุก", "ยางในรถจักรยานยนต์",
    "ยางในรถจักรยาน", "ยางในรถแทรกเตอร์", "ยางในรถตัก", "ยางในรถเพื่อการเกษตร",
    "ยางในบิวทิล", "ยางในเรเดียล", "ยางในธรรมชาติ", "Inner Tube", "Butyl Tube", "Natural Rubber Tube",
    "ยางรองคอด", "ยางรองกะทะล้อ", "ยางรองขอบล้อ", "Flap", "Rim Flap",
    "จุ๊บลม", "จุ๊บยาง", "วาล์วยาง", "วาล์วยางรถยนต์", "Tire Valve", "อุปกรณ์ถอดเปลี่ยนยาง"
  ]
};

// Universal Exclude List to reject false positives (strictly irrelevant goods, medical gloves, stationery rubber, asphalt)
const EXCLUDE_KEYWORDS = [
  "ยางลบ", "ตรายาง", "หมึกตรายาง", "ยางวง", "ยางรัดของ", "ยางรัด",
  "ถุงมือยาง", "ถุงมือตรวจโรค", "ถุงมือแพทย์", "ถุงมือผ่าตัด", "ถุงยางอนามัย", "ท่อสายยางการแพทย์",
  "น้ำยางพารา", "ยางพาราแผ่น", "ขี้ยาง", "กล้ายางพารา", "ต้นยางพารา", "กรีดยาง", "สวนยางพารา",
  "ยางมะตอย", "ยางมะตอยผสมเสร็จ", "แอสฟัลต์", "แอสฟัลท์", "ผิวทางแอสฟัลต์", "ยางหยอดรอยต่อ", "ยางมะตอยหยอดรอยต่อ",
  "แผ่นยางปูพื้น", "ยางปูพื้น", "กระเบื้องยาง", "ยางกันชนเสา",
  "ขอบยางกระจก", "ขอบยางประตู", "ขอบยางตู้เย็น", "ซีลยาง", "ปะเก็นยาง", "สายยางฉีดน้ำ", "สายยางรดน้ำ",
  "ปะยาง", "ค่าปะยาง", "จ้างปะยาง", "ซ่อมปะยาง",
  "จ้างออกแบบ", "จ้างที่ปรึกษา", "อาหารกลางวัน", "จัดเลี้ยง", "ชุดกีฬา", "ลูกฟุตบอล"
];

function getKeywords() {
  const ver = localStorage.getItem('veerubber_kw_version');
  if (ver !== '4.0') {
    localStorage.setItem('veerubber_custom_keywords', JSON.stringify(DEFAULT_KEYWORDS));
    localStorage.setItem('veerubber_kw_version', '4.0');
    return JSON.parse(JSON.stringify(DEFAULT_KEYWORDS));
  }
  const saved = localStorage.getItem('veerubber_custom_keywords');
  if (saved) {
    try { return JSON.parse(saved); } catch {}
  }
  return JSON.parse(JSON.stringify(DEFAULT_KEYWORDS));
}

function saveKeywords(kws) {
  localStorage.setItem('veerubber_custom_keywords', JSON.stringify(kws));
}

window.toggleKeywords = function() {
  const panel = document.getElementById('keywords-panel');
  const txt = document.getElementById('keyword-toggle-text');
  if (!panel) return;
  const isHidden = panel.classList.contains('hidden');
  if (isHidden) {
    panel.classList.remove('hidden');
    if (txt) txt.textContent = '▲ ซ่อนรายการคีย์เวิร์ด';
  } else {
    panel.classList.add('hidden');
    if (txt) txt.textContent = '▼ ดูรายการคีย์เวิร์ด / เพิ่มคำใหม่';
  }
};

window.renderKeywords = function() {
  const kws = getKeywords();
  const container = document.getElementById('keywords-container');
  const badge = document.getElementById('keyword-count-badge');
  if (!container) return;

  let totalCount = 0;
  let html = '';

  for (const [group, list] of Object.entries(kws)) {
    totalCount += list.length;
    const groupName = (typeof groupLabels !== 'undefined' && groupLabels[group]) ? groupLabels[group] : group;
    html += `
      <div style="background: #ffffff; padding: 8px 12px; border-radius: 6px; border: 1px solid #e2e8f0;">
        <div style="font-weight: bold; font-size: 0.88rem; color: #003366; margin-bottom: 6px;">${groupName} (${list.length} คำ):</div>
        <div>
          ${list.map(k => `<span class="kw-tag">${k}</span>`).join('')}
        </div>
      </div>
    `;
  }

  container.innerHTML = html;
  if (badge) badge.textContent = `${totalCount} คำหลัก (4 หมวดสินค้า)`;
};

window.addCustomKeyword = function() {
  const groupSelect = document.getElementById('new-kw-group');
  const input = document.getElementById('new-kw-input');
  if (!groupSelect || !input) return;

  const group = groupSelect.value;
  const kw = input.value.trim();
  if (!kw) {
    alert('กรุณากรอกคำค้นหาที่ต้องการเพิ่ม');
    return;
  }

  const kws = getKeywords();
  if (!kws[group]) kws[group] = [];
  if (!kws[group].includes(kw)) {
    kws[group].push(kw);
    saveKeywords(kws);
    renderKeywords();
    input.value = '';
    const groupName = (typeof groupLabels !== 'undefined' && groupLabels[group]) ? groupLabels[group] : group;
    alert(`เพิ่มคีย์เวิร์ด "${kw}" ในหมวด ${groupName} เรียบร้อยแล้ว!`);
  } else {
    alert(`คีย์เวิร์ด "${kw}" มีอยู่ในระบบแล้ว`);
  }
};

function isExcluded(title) {
  if (!title) return false;
  const lower = title.toLowerCase();

  // 1. If explicitly cancelled, exclude
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

  if (EXCLUDE_KEYWORDS.some(ex => lower.includes(ex.toLowerCase()))) return true;
  return false;
}

function findMatchedKeywords(title) {
  if (!title || isExcluded(title)) return [];
  const cleanTitle = title.toLowerCase().replace(/พื้นที่(ใช้สอย)?/g, '');
  const kws = getKeywords();
  const flat = Object.values(kws).flat();
  return flat.filter(k => cleanTitle.includes(k.toLowerCase()));
}

window.hideProject = function(id, btn) {
  if (!confirm('ต้องการซ่อนโครงการนี้ออกจากหน้ารายการหรือไม่?')) return;
  const hidden = JSON.parse(localStorage.getItem('veerubber_hidden_projects') || '[]');
  if (!hidden.includes(id)) {
    hidden.push(id);
    localStorage.setItem('veerubber_hidden_projects', JSON.stringify(hidden));
  }
  const card = btn.closest('.announcement-card');
  if (card) {
    card.style.transition = 'all 0.3s ease';
    card.style.opacity = '0';
    card.style.transform = 'scale(0.95)';
    setTimeout(() => card.remove(), 300);
  }
};

// Feedback System Global State & Handlers
let userFeedbackMap = {};
let selectedStatusFilter = 'all';

function showToast(message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  const icon = type === 'success' ? '💾' : type === 'warning' ? '🤔' : '🚫';
  toast.innerHTML = `
    <span style="font-size: 1.25rem;">${icon}</span>
    <div style="flex: 1; line-height: 1.4;">${message}</div>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('hide');
    setTimeout(() => toast.remove(), 350);
  }, 3200);
}

async function updateFeedbackTotalBadge() {
  try {
    const res = await api.getFeedbackStats();
    const countEl = document.getElementById('feedback-total-count');
    if (countEl && res?.data?.summary) {
      countEl.textContent = res.data.summary.total_feedback || 0;
    }
  } catch {}
}

async function loadMyFeedback() {
  try {
    const res = await api.getMyFeedback();
    if (res && res.data) {
      userFeedbackMap = res.data;
    }
    await updateFeedbackTotalBadge();
  } catch (err) {
    console.warn('Could not load user feedback:', err);
  }
}

// --- Quick UX/UI Controls & 2-Button Feedback ---
window.toggleFilterDrawer = function() {
  const drawer = document.getElementById('filter-drawer');
  const btn = document.getElementById('btn-toggle-drawer');
  const arrow = document.getElementById('drawer-arrow');
  if (!drawer) return;
  const isHidden = drawer.classList.toggle('hidden');
  if (arrow) arrow.textContent = isHidden ? '▼' : '▲';
  if (btn) btn.classList.toggle('active', !isHidden);
};

let urgentFilterActive = false;
window.toggleUrgentFilter = function(btn) {
  urgentFilterActive = !urgentFilterActive;
  if (btn) btn.classList.toggle('active', urgentFilterActive);
  filterCardsByUrgent();
};

function filterCardsByUrgent() {
  const cards = document.querySelectorAll('#announcement-list .announcement-card');
  cards.forEach(card => {
    if (!urgentFilterActive) {
      card.style.display = '';
      return;
    }
    const daysLeft = card.dataset.daysLeft;
    if (daysLeft !== undefined && daysLeft !== '' && parseInt(daysLeft, 10) >= 0 && parseInt(daysLeft, 10) <= 7) {
      card.style.display = '';
    } else {
      card.style.display = 'none';
    }
  });
}

function getDaysLeft(dateStr) {
  if (!dateStr) return null;
  try {
    let targetDate = null;
    if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
      targetDate = new Date(dateStr);
    } else {
      const thaiMonths = {
        'ม.ค.': 0, 'ก.พ.': 1, 'มี.ค.': 2, 'เม.ย.': 3, 'พ.ค.': 4, 'มิ.ย.': 5,
        'ก.ค.': 6, 'ส.ค.': 7, 'ก.ย.': 8, 'ต.ค.': 9, 'พ.ย.': 10, 'ธ.ค.': 11,
        'มกราคม': 0, 'กุมภาพันธ์': 1, 'มีนาคม': 2, 'เมษายน': 3, 'พฤษภาคม': 4, 'มิถุนายน': 5,
        'กรกฎาคม': 6, 'สิงหาคม': 7, 'กันยายน': 8, 'ตุลาคม': 9, 'พฤศจิกายน': 10, 'ธันวาคม': 11
      };
      const clean = dateStr.replace(/[^0-9ก-๙\s.-]/g, ' ').trim();
      const parts = clean.split(/\s+/);
      if (parts.length >= 3) {
        const day = parseInt(parts[0], 10);
        const month = thaiMonths[parts[1]];
        let year = parseInt(parts[2], 10);
        if (year > 2500) year -= 543;
        else if (year < 100) year += 2000;
        if (!isNaN(day) && month !== undefined && !isNaN(year)) {
          targetDate = new Date(year, month, day);
        }
      }
    }
    if (targetDate && !isNaN(targetDate.getTime())) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const diffTime = targetDate - today;
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
  } catch (e) {}
  return null;
}

const ALL_SYSTEM_KEYWORDS = [
  'ยางรถยนต์', 'จัดซื้อยางรถยนต์', 'ซื้อยางรถยนต์', 'ยางรถกระบะ', 'ยางรถตู้', 'ยางรถบรรทุก',
  'ยางรถบัส', 'ยางรถจักรยานยนต์', 'ยางมอเตอร์ไซค์', 'ยางสายตรวจ', 'ยางเรเดียล', 'ยาง radial',
  'ยาง OTR', 'ยางรถแทรกเตอร์', 'ยางรถไถ', 'ยางรถตัก', 'ยางรถยก', 'ยาง forklift',
  'ยางรถจักรยาน', 'ยางวีลแชร์', 'ยางใน', 'ยางในบิวทิล', 'ยางรองคอด', 'จุ๊บลมยาง',
  'เปลี่ยนยาง', 'ถ่วงล้อ', 'จัดซื้อยาง', 'ซื้อยาง'
];

window.getMatchOriginInfo = function(item) {
  const hasPdf = !!(item.boq_summary || item.doc_verified || item.boq_matches);
  let keyword = '';
  let snippet = '';
  let page = 1;

  if (item.boq_matches) {
    try {
      const matches = typeof item.boq_matches === 'string' ? JSON.parse(item.boq_matches) : item.boq_matches;
      if (Array.isArray(matches) && matches.length > 0) {
        if (matches[0].keyword) keyword = matches[0].keyword;
        if (matches[0].snippet) snippet = matches[0].snippet;
        if (matches[0].page) page = matches[0].page;
      }
    } catch (e) {}
  }

  if (!keyword && item.boq_summary) {
    const m = item.boq_summary.match(/พบสเปก\s*["“]([^"”]+)["”]/i);
    if (m && m[1]) keyword = m[1];
    const snipMatch = item.boq_summary.match(/\("([^"]+)"\)/);
    if (snipMatch && snipMatch[1] && !snippet) snippet = snipMatch[1];
    const pageMatch = item.boq_summary.match(/ที่หน้า\s*(\d+)/);
    if (pageMatch && pageMatch[1]) page = pageMatch[1];
  }

  if (!keyword && item.project_name) {
    const t = item.project_name;
    for (const kw of ALL_SYSTEM_KEYWORDS) {
      if (t.toLowerCase().includes(kw.toLowerCase())) {
        keyword = kw;
        break;
      }
    }
  }

  if (!keyword) {
    if (item.product_group === 'passenger_car_tires') keyword = 'ยางรถยนต์ & กระบะ';
    else if (item.product_group === 'truck_bus_tires') keyword = 'ยางรถบรรทุก & บัส';
    else if (item.product_group === 'motorcycle_tires') keyword = 'ยางจักรยานยนต์ & สายตรวจ';
    else if (item.product_group === 'otr_heavy_machinery') keyword = 'ยาง OTR & เครื่องจักร';
    else if (item.product_group === 'bicycle_specialty_tires') keyword = 'ยางจักรยาน & วีลแชร์';
    else if (item.product_group === 'tube_accessories') keyword = 'ยางใน & อุปกรณ์';
    else keyword = 'จัดซื้อยางราชการ';
  }

  return {
    isPdf: hasPdf,
    keyword,
    snippet,
    page
  };
};

function updateCardBanner(card, id, projId, status) {
  if (!card) return;
  const banner = card.querySelector(`#feedback-banner-${id}`);
  if (!banner) return;

  banner.className = 'card-feedback-status-banner';

  if (status === 1) {
    banner.classList.add('status-yes');
    banner.innerHTML = `
      <div class="status-banner-content">
        <span class="status-banner-icon">✅</span>
        <div>
          <strong style="color: #15803d;">คุณกดเลือก: "ใช่งานเรา (ตรงสาย 100%)"</strong>
          <span style="color: #166534; font-size: 0.82rem; margin-left: 6px;">(บันทึกลงระบบ AI แล้ว • ช่วยจดจำสเปกที่วีรับเบอร์รับทำ)</span>
        </div>
      </div>
      <button type="button" class="btn-status-banner-undo" onclick="undoFeedbackQuick('${id}', '${projId}', this)">↩ ยกเลิก / เปลี่ยนใจ</button>
    `;
    card.style.borderColor = '#16a34a';
    card.style.background = 'linear-gradient(180deg, #ffffff 0%, #fafffc 100%)';
  } else if (status === 2) {
    banner.classList.add('status-maybe');
    banner.innerHTML = `
      <div class="status-banner-content">
        <span class="status-banner-icon">🤔</span>
        <div>
          <strong style="color: #b45309;">คุณกดเลือก: "อาจจะใช่"</strong>
          <span style="color: #92400e; font-size: 0.82rem; margin-left: 6px;">(บันทึกลงระบบ AI แล้ว • เก็บไว้ในรายการรอตรวจสเปกเพิ่มเติม)</span>
        </div>
      </div>
      <button type="button" class="btn-status-banner-undo" onclick="undoFeedbackQuick('${id}', '${projId}', this)">↩ ยกเลิก / เปลี่ยนใจ</button>
    `;
    card.style.borderColor = '#f59e0b';
    card.style.background = 'linear-gradient(180deg, #ffffff 0%, #fffdfa 100%)';
  } else if (status === 0) {
    banner.classList.add('status-no');
    banner.innerHTML = `
      <div class="status-banner-content">
        <span class="status-banner-icon">🚫</span>
        <div>
          <strong style="color: #b91c1c;">คุณกดเลือก: "ไม่ใช่งาน"</strong>
          <span style="color: #991b1b; font-size: 0.82rem; margin-left: 6px;">(บันทึก 1/5 เสียงจากทีม • ยังแสดงอยู่เพื่อความปลอดภัย ไม่หลุดงานสำคัญ)</span>
        </div>
      </div>
      <button type="button" class="btn-status-banner-undo" onclick="undoFeedbackQuick('${id}', '${projId}', this)">↩ ยกเลิก / เปลี่ยนใจ</button>
    `;
    card.style.borderColor = '#fca5a5';
    card.style.background = 'linear-gradient(180deg, #ffffff 0%, #fffbfb 100%)';
  } else {
    banner.classList.add('hidden');
    banner.innerHTML = '';
    card.style.borderColor = '';
    card.style.background = '';
  }
}

window.undoFeedbackQuick = async function(id, projId, btn) {
  const card = document.querySelector(`.announcement-card[data-project-id="${id}"]`);
  try {
    if (btn) btn.disabled = true;
    await api.submitFeedback(id, projId, null);
    delete userFeedbackMap[id];

    if (card) {
      const yesBtn = card.querySelector('.btn-ai-yes');
      const maybeBtn = card.querySelector('.btn-ai-maybe');
      const noBtn = card.querySelector('.btn-ai-no');
      if (yesBtn) { yesBtn.classList.remove('active'); yesBtn.innerHTML = '👍 ใช่ (งานเรา)'; yesBtn.disabled = false; }
      if (maybeBtn) { maybeBtn.classList.remove('active'); maybeBtn.innerHTML = '🤔 อาจจะใช่'; maybeBtn.disabled = false; }
      if (noBtn) { noBtn.classList.remove('active'); noBtn.innerHTML = '👎 ไม่ใช่งาน'; noBtn.disabled = false; }
      updateCardBanner(card, id, projId, null);
    }

    showToast('↩ ยกเลิกการเลือกเรียบร้อย คืนค่าเริ่มต้นแล้ว', 'info');
    updateFeedbackTotalBadge();
    filterCardsByStatus();
  } catch (err) {
    alert('ยกเลิกไม่สำเร็จ: ' + err.message);
    if (btn) btn.disabled = false;
  }
};

window.submitMatchFeedbackQuick = async function(id, projId, btn) {
  const card = document.querySelector(`.announcement-card[data-project-id="${id}"]`);
  const fb = userFeedbackMap[id];
  const isAlready = fb && fb.is_match === 1;

  try {
    if (isAlready) {
      await window.undoFeedbackQuick(id, projId, btn);
      return;
    }

    if (btn) { btn.disabled = true; btn.innerHTML = '⏳ บันทึก...'; }

    await api.submitFeedback(id, projId, 1);
    userFeedbackMap[id] = { is_match: 1, reason: null };

    if (card) {
      const yesBtn = card.querySelector('.btn-ai-yes');
      const maybeBtn = card.querySelector('.btn-ai-maybe');
      const noBtn = card.querySelector('.btn-ai-no');
      if (yesBtn) { yesBtn.classList.add('active'); yesBtn.innerHTML = '✔ คุณเลือก: ใช่งานเรา'; yesBtn.disabled = false; }
      if (maybeBtn) { maybeBtn.classList.remove('active'); maybeBtn.innerHTML = '🤔 อาจจะใช่'; }
      if (noBtn) { noBtn.classList.remove('active'); noBtn.innerHTML = '👎 ไม่ใช่งาน'; }
      updateCardBanner(card, id, projId, 1);
    }

    showToast('บันทึก <strong>"ใช่งานเรา (ตรงสาย)"</strong> ส่งเข้าคลัง AI สำเร็จ!', 'success');
    updateFeedbackTotalBadge();
    filterCardsByStatus();
  } catch (err) {
    alert('บันทึกข้อมูลไม่สำเร็จ: ' + err.message);
    if (btn) btn.disabled = false;
  }
};

window.submitMaybeFeedbackQuick = async function(id, projId, btn) {
  const card = document.querySelector(`.announcement-card[data-project-id="${id}"]`);
  const fb = userFeedbackMap[id];
  const isAlready = fb && fb.is_match === 2;

  try {
    if (isAlready) {
      await window.undoFeedbackQuick(id, projId, btn);
      return;
    }

    if (btn) { btn.disabled = true; btn.innerHTML = '⏳ บันทึก...'; }

    await api.submitFeedback(id, projId, 2);
    userFeedbackMap[id] = { is_match: 2, reason: null };

    if (card) {
      const yesBtn = card.querySelector('.btn-ai-yes');
      const maybeBtn = card.querySelector('.btn-ai-maybe');
      const noBtn = card.querySelector('.btn-ai-no');
      if (maybeBtn) { maybeBtn.classList.add('active'); maybeBtn.innerHTML = '✔ คุณเลือก: อาจจะใช่'; maybeBtn.disabled = false; }
      if (yesBtn) { yesBtn.classList.remove('active'); yesBtn.innerHTML = '👍 ใช่ (งานเรา)'; }
      if (noBtn) { noBtn.classList.remove('active'); noBtn.innerHTML = '👎 ไม่ใช่งาน'; }
      updateCardBanner(card, id, projId, 2);
    }

    showToast('บันทึก <strong>"อาจจะใช่"</strong> ส่งเข้าคลัง AI สำเร็จ!', 'warning');
    updateFeedbackTotalBadge();
    filterCardsByStatus();
  } catch (err) {
    alert('บันทึกข้อมูลไม่สำเร็จ: ' + err.message);
    if (btn) btn.disabled = false;
  }
};

window.submitRejectFeedbackQuick = async function(id, projId, btn) {
  const card = document.querySelector(`.announcement-card[data-project-id="${id}"]`);
  const fb = userFeedbackMap[id];
  const isAlready = fb && fb.is_match === 0;

  try {
    if (isAlready) {
      await window.undoFeedbackQuick(id, projId, btn);
      return;
    }

    if (btn) { btn.disabled = true; btn.innerHTML = '⏳ บันทึก...'; }

    const res = await api.submitFeedback(id, projId, 0, 'ไม่ตรงสาย');
    const rejectCount = res?.data?.reject_count || 1;
    userFeedbackMap[id] = { is_match: 0, reason: 'ไม่ตรงสาย' };

    // DO NOT HIDE! Card stays visible to prevent missing important jobs
    if (card) {
      const yesBtn = card.querySelector('.btn-ai-yes');
      const maybeBtn = card.querySelector('.btn-ai-maybe');
      const noBtn = card.querySelector('.btn-ai-no');
      if (noBtn) { noBtn.classList.add('active'); noBtn.innerHTML = `✔ คุณเลือก: ไม่ใช่งาน (1/5 เสียง)`; noBtn.disabled = false; }
      if (yesBtn) { yesBtn.classList.remove('active'); yesBtn.innerHTML = '👍 ใช่ (งานเรา)'; }
      if (maybeBtn) { maybeBtn.classList.remove('active'); maybeBtn.innerHTML = '🤔 อาจจะใช่'; }
      updateCardBanner(card, id, projId, 0);
    }

    showToast(`บันทึก <strong>"ไม่ใช่งาน"</strong> (1/5 เสียง) เรียบร้อย • การ์ดยังคงแสดงอยู่ ไม่หลุดงานแน่นอนครับ`, 'danger');
    updateFeedbackTotalBadge();
    filterCardsByStatus();
  } catch (err) {
    alert('บันทึกข้อมูลไม่สำเร็จ: ' + err.message);
    if (btn) btn.disabled = false;
  }
};

window.toggleRejectPopover = function(id) {
  const popover = document.getElementById(`popover-${id}`);
  if (!popover) return;
  popover.classList.toggle('hidden');
};

window.submitMatchFeedback = async function(id, projId, btn) {
  const fb = userFeedbackMap[id];
  const card = document.querySelector(`.announcement-card[data-project-id="${id}"]`);
  
  if (fb && fb.is_match === 1) {
    await window.undoFeedback(id, projId, btn);
    return;
  }

  try {
    btn.disabled = true;
    btn.innerHTML = '⏳ บันทึก...';
    await api.submitFeedback(id, projId, 1);
    userFeedbackMap[id] = { is_match: 1, reason: null };
    
    if (card) {
      card.classList.remove('feedback-dimmed');
      card.classList.remove('feedback-maybe-active');
      const notice = card.querySelector('.feedback-dimmed-notice');
      if (notice) notice.remove();
      const maybeNotice = card.querySelector('.feedback-maybe-notice');
      if (maybeNotice) maybeNotice.remove();
      const popover = card.querySelector('.feedback-popover');
      if (popover) popover.classList.add('hidden');
      
      const mBtn = card.querySelector('.btn-feedback-match');
      const mbBtn = card.querySelector('.btn-feedback-maybe');
      const rBtn = card.querySelector('.btn-feedback-reject');
      if (mBtn) {
        mBtn.classList.add('active');
        mBtn.innerHTML = '✔ ใช่งานตรงสายแล้ว';
        mBtn.disabled = false;
      }
      if (mbBtn) {
        mbBtn.classList.remove('active');
        mbBtn.innerHTML = '🤔 อาจจะใช่';
      }
      if (rBtn) {
        rBtn.classList.remove('active');
        rBtn.innerHTML = '👎 ไม่ใช่งาน';
      }
    }
    showToast('บันทึก <strong>"ใช่งานตรงสาย"</strong> ส่งเข้าคลังพัฒนา AI สำเร็จทันที! (Auto-Save)', 'success');
    updateFeedbackTotalBadge();
    filterCardsByStatus();
  } catch (err) {
    alert('บันทึกข้อมูลไม่สำเร็จ: ' + err.message);
    if (btn) btn.disabled = false;
  }
};

window.submitMaybeFeedback = async function(id, projId, btn) {
  const fb = userFeedbackMap[id];
  const card = document.querySelector(`.announcement-card[data-project-id="${id}"]`);

  if (fb && fb.is_match === 2) {
    await window.undoFeedback(id, projId, btn);
    return;
  }

  try {
    btn.disabled = true;
    btn.innerHTML = '⏳ บันทึก...';
    await api.submitFeedback(id, projId, 2);
    userFeedbackMap[id] = { is_match: 2, reason: null };

    if (card) {
      card.classList.remove('feedback-dimmed');
      card.classList.add('feedback-maybe-active');
      const notice = card.querySelector('.feedback-dimmed-notice');
      if (notice) notice.remove();
      const popover = card.querySelector('.feedback-popover');
      if (popover) popover.classList.add('hidden');

      let maybeNotice = card.querySelector('.feedback-maybe-notice');
      if (!maybeNotice) {
        maybeNotice = document.createElement('div');
        maybeNotice.className = 'feedback-maybe-notice';
        maybeNotice.style.cssText = 'background: #fffbeb; border: 1px solid #fde68a; border-radius: 6px; padding: 7px 12px; margin: 10px 0 6px 0; font-size: 0.84rem; color: #b45309; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;';
        const actionsBar = card.querySelector('.feedback-bar');
        card.insertBefore(maybeNotice, actionsBar);
      }
      maybeNotice.innerHTML = `
        <div>
          <strong>🤔 คุณระบุว่า "อาจจะใช่":</strong>
          <span style="margin-left: 6px;">เก็บเข้าคลังงานรอพิจารณาสเปกเพิ่มเติม</span>
        </div>
        <button class="btn-feedback-undo" onclick="undoFeedback('${id}', '${projId}', this)" style="border-color: #d97706; color: #d97706;">↩ ยกเลิก / คืนค่า</button>
      `;

      const mBtn = card.querySelector('.btn-feedback-match');
      const mbBtn = card.querySelector('.btn-feedback-maybe');
      const rBtn = card.querySelector('.btn-feedback-reject');
      if (mBtn) {
        mBtn.classList.remove('active');
        mBtn.innerHTML = '👍 ใช่งานตรงสาย';
      }
      if (mbBtn) {
        mbBtn.classList.add('active');
        mbBtn.innerHTML = '✔ บันทึกว่าอาจจะใช่';
        mbBtn.disabled = false;
      }
      if (rBtn) {
        rBtn.classList.remove('active');
        rBtn.innerHTML = '👎 ไม่ใช่งาน';
      }
    }
    showToast('บันทึก <strong>"อาจจะใช่"</strong> ส่งเข้าคลังพัฒนา AI สำเร็จทันที! (Auto-Save)', 'warning');
    updateFeedbackTotalBadge();
    filterCardsByStatus();
  } catch (err) {
    alert('บันทึกข้อมูลไม่สำเร็จ: ' + err.message);
    if (btn) btn.disabled = false;
  }
};

window.submitRejectFeedback = async function(id, projId, reasonKey, reasonLabel) {
  const card = document.querySelector(`.announcement-card[data-project-id="${id}"]`);
  try {
    const popover = document.getElementById(`popover-${id}`);
    if (popover) popover.classList.add('hidden');

    await api.submitFeedback(id, projId, 0, reasonLabel);
    userFeedbackMap[id] = { is_match: 0, reason: reasonLabel };

    if (card) {
      card.classList.remove('feedback-maybe-active');
      card.classList.add('feedback-dimmed');
      const maybeNotice = card.querySelector('.feedback-maybe-notice');
      if (maybeNotice) maybeNotice.remove();
      
      const mBtn = card.querySelector('.btn-feedback-match');
      const mbBtn = card.querySelector('.btn-feedback-maybe');
      const rBtn = card.querySelector('.btn-feedback-reject');
      if (mBtn) {
        mBtn.classList.remove('active');
        mBtn.innerHTML = '👍 ใช่งานตรงสาย';
      }
      if (mbBtn) {
        mbBtn.classList.remove('active');
        mbBtn.innerHTML = '🤔 อาจจะใช่';
      }
      if (rBtn) {
        rBtn.classList.add('active');
        rBtn.innerHTML = '🚫 ระบุว่าไม่ใช่งาน';
      }

      let notice = card.querySelector('.feedback-dimmed-notice');
      if (!notice) {
        notice = document.createElement('div');
        notice.className = 'feedback-dimmed-notice';
        const actionsBar = card.querySelector('.feedback-bar');
        card.insertBefore(notice, actionsBar);
      }
      notice.innerHTML = `
        <div>
          <strong>🚫 คุณระบุว่าไม่ใช่งาน:</strong>
          <span style="margin-left: 6px;">${reasonLabel}</span>
          <span style="font-size: 0.76rem; color: #991b1b; margin-left: 8px; background: #fee2e2; padding: 2px 7px; border-radius: 4px; border: 1px solid #fecaca;">(ซ่อนในหน้าจอคุณแล้ว • สะสมครบ 5 เสียงจากทีมเพื่อขึ้น Blacklist ถาวร)</span>
        </div>
        <button class="btn-feedback-undo" onclick="undoFeedback('${id}', '${projId}', this)">↩ ยกเลิก / คืนค่า</button>
      `;
    }
    showToast(`บันทึก <strong>"ไม่ใช่งาน (${reasonLabel})"</strong> เรียบร้อย (ซ่อนในหน้าจอคุณ • สะสมครบ 5 ครั้งจากทีมเพื่อขึ้น Blacklist)`, 'danger');
    updateFeedbackTotalBadge();
    filterCardsByStatus();
  } catch (err) {
    alert('บันทึกข้อมูลไม่สำเร็จ: ' + err.message);
  }
};

window.undoFeedback = async function(id, projId, btn) {
  const card = document.querySelector(`.announcement-card[data-project-id="${id}"]`);
  try {
    await api.submitFeedback(id, projId, null);
    delete userFeedbackMap[id];

    if (card) {
      card.classList.remove('feedback-dimmed');
      card.classList.remove('feedback-maybe-active');
      const notice = card.querySelector('.feedback-dimmed-notice');
      if (notice) notice.remove();
      const maybeNotice = card.querySelector('.feedback-maybe-notice');
      if (maybeNotice) maybeNotice.remove();
      const popover = card.querySelector('.feedback-popover');
      if (popover) popover.classList.add('hidden');

      const mBtn = card.querySelector('.btn-feedback-match');
      const mbBtn = card.querySelector('.btn-feedback-maybe');
      const rBtn = card.querySelector('.btn-feedback-reject');
      if (mBtn) {
        mBtn.classList.remove('active');
        mBtn.innerHTML = '👍 ใช่งานตรงสาย';
        mBtn.disabled = false;
      }
      if (mbBtn) {
        mbBtn.classList.remove('active');
        mbBtn.innerHTML = '🤔 อาจจะใช่';
        mbBtn.disabled = false;
      }
      if (rBtn) {
        rBtn.classList.remove('active');
        rBtn.innerHTML = '👎 ไม่ใช่งาน';
      }
    }
    showToast('↩ ยกเลิกความคิดเห็นเรียบร้อย คืนค่าเดิมแล้ว', 'success');
    updateFeedbackTotalBadge();
    filterCardsByStatus();
  } catch (err) {
    alert('ยกเลิกไม่สำเร็จ: ' + err.message);
  }
};

function filterCardsByStatus() {
  const cards = document.querySelectorAll('.announcement-card');
  cards.forEach(card => {
    const id = card.getAttribute('data-project-id');
    const fb = userFeedbackMap[id];
    let show = true;

    if (selectedStatusFilter === 'matched') {
      show = fb && fb.is_match === 1;
    } else if (selectedStatusFilter === 'maybe') {
      show = fb && fb.is_match === 2;
    } else if (selectedStatusFilter === 'rejected') {
      show = fb && fb.is_match === 0;
    } else if (selectedStatusFilter === 'unreviewed') {
      show = !fb;
    }

    if (show) {
      card.style.display = '';
    } else {
      card.style.display = 'none';
    }
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  // Clear legacy hidden projects from localStorage so user never misses critical projects
  localStorage.removeItem('veerubber_hidden_projects');

  // Render keyword list
  renderKeywords();

  // Check auth
  const token = localStorage.getItem('token');
  if (!token) { window.location.href = 'login.html'; return; }

  // Load user info
  try {
    const res = await api.getMe();
    const user = res?.data || res;
    if (user.status !== 'approved') { window.location.href = 'pending.html'; return; }

    const userInfo = document.getElementById('user-info');
    if (userInfo) {
      userInfo.textContent = `${user.name || user.email} (${user.role})`;
    }
    // Show admin link if admin
    if (user.role === 'admin') {
      const adminLink = document.getElementById('admin-link');
      if (adminLink) adminLink.classList.remove('hidden');
    }
  } catch { window.location.href = '/login.html'; return; }

  // Tabs logic
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
      
      tab.classList.add('active');
      const tabId = `tab-${tab.dataset.tab}`;
      const targetContent = document.getElementById(tabId);
      if (targetContent) targetContent.classList.remove('hidden');
      
      if (tab.dataset.tab === 'winners' && typeof loadWinners === 'function') {
        loadWinners();
      } else if (tab.dataset.tab === 'boq' && typeof loadBoqAnnouncements === 'function') {
        loadBoqAnnouncements();
      } else if (tab.dataset.tab === 'opportunities') {
        loadAnnouncements();
      }
    });
  });

  // Date filter buttons
  document.querySelectorAll('.btn-date-filter').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.btn-date-filter').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      selectedDays = parseInt(e.target.dataset.days, 10);
      currentPage = 1;
      loadStats();
      loadAnnouncements();
    });
  });

  // Budget filter buttons
  document.querySelectorAll('.btn-budget-filter').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.btn-budget-filter').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      selectedBudgetMin = e.target.dataset.bmin || '';
      selectedBudgetMax = e.target.dataset.bmax || '';
      currentPage = 1;
      loadStats();
      loadAnnouncements();
    });
  });

  // Zone filter buttons (7 โซนทั่วประเทศ)
  document.querySelectorAll('.btn-zone-filter').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const b = e.target.closest('.btn-zone-filter');
      if (!b) return;
      document.querySelectorAll('.btn-zone-filter').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      selectedZone = b.dataset.zone || '';

      const labelEl = document.getElementById('zone-active-label');
      if (labelEl) {
        const zoneNames = {
          '': 'แสดงทุกโซน',
          'bkk': 'โซน กทม.',
          'central': 'โซน ภาคกลาง',
          'east': 'โซน ภาคตะวันออก',
          'north': 'โซน ภาคเหนือ',
          'northeast': 'โซน ภาคอีสาน',
          'west': 'โซน ภาคตะวันตก',
          'south': 'โซน ภาคใต้'
        };
        labelEl.textContent = zoneNames[selectedZone] || 'แสดงทุกโซน';
      }
      currentPage = 1;
      loadAnnouncements();
    });
  });

  // Filter toggles
  document.querySelectorAll('[data-filter-type], [data-filter-group]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.target.classList.toggle('active');
      currentPage = 1;
      loadAnnouncements();
    });
  });

  // Search input
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    let timeout;
    searchInput.addEventListener('input', () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        currentPage = 1;
        loadAnnouncements();
      }, 500);
    });
  }

  const loadMoreBtn = document.getElementById('btn-load-more');
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', () => {
      currentPage++;
      loadAnnouncements(true);
    });
  }

  // Logout button
  const logoutBtn = document.getElementById('btn-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('token');
      window.location.href = '/login.html';
    });
  }

  // Load feedback for current user
  await loadMyFeedback();

  // Initialize auto-hide rejected toggle
  const toggleHideRejected = document.getElementById('toggle-hide-rejected');
  if (toggleHideRejected) {
    const savedToggle = localStorage.getItem('veerubber_auto_hide_rejected');
    if (savedToggle !== null) {
      toggleHideRejected.checked = savedToggle === 'true';
    }
    if (toggleHideRejected.checked) {
      document.body.classList.add('hide-rejected-active');
    }
    toggleHideRejected.addEventListener('change', (e) => {
      localStorage.setItem('veerubber_auto_hide_rejected', e.target.checked);
      if (e.target.checked) {
        document.body.classList.add('hide-rejected-active');
      } else {
        document.body.classList.remove('hide-rejected-active');
      }
    });
  }

  // Status filter buttons
  document.querySelectorAll('[data-status-filter]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('[data-status-filter]').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      selectedStatusFilter = e.target.dataset.statusFilter || 'all';
      filterCardsByStatus();
    });
  });

  await loadStats();
  await loadAnnouncements();
});

let selectedDays = -1; // Default to ทั้งหมด (งานที่ยังไม่เคาะราคาในอนาคตทั้งหมด)
let selectedBudgetMin = '';
let selectedBudgetMax = '';
let selectedZone = '';

async function loadStats() {
  try {
    const params = {};
    if (selectedDays > 0) {
      const d = new Date();
      d.setDate(d.getDate() - selectedDays);
      params.date_start = d.toISOString().split('T')[0];
    } else if (selectedDays === 0) {
      params.date = new Date().toISOString().split('T')[0];
    }

    if (selectedBudgetMin) params.budget_min = selectedBudgetMin;
    if (selectedBudgetMax) params.budget_max = selectedBudgetMax;

    const res = await api.getStats(params);
    const container = document.getElementById('summary-cards');
    if (!container || !res.data) return;

    // Map byType array to lookup
    const typeCounts = {};
    (res.data.byType || []).forEach(item => {
      typeCounts[item.announce_type] = item.count;
    });

    const countD0 = (typeCounts['D0'] || 0) + (typeCounts['D1'] || 0);
    const countB0 = typeCounts['B0'] || 0;
    const count15 = (typeCounts['15'] || 0) + (typeCounts['BOQ'] || 0);
    const countP0 = typeCounts['P0'] || 0;
    const totalActive = countD0 + countB0 + count15 + countP0;
    const boqCount = res.data.boqVerifiedCount || 0;

    let periodLabel = 'ทั้งหมด';
    if (selectedDays === 0) periodLabel = 'วันนี้';
    else if (selectedDays === 7) periodLabel = '7 วันหลังสุด';
    else if (selectedDays === 30) periodLabel = '30 วันหลังสุด';

    container.innerHTML = `
      <div class="summary-card c-total" style="background: linear-gradient(135deg, #003366 0%, #004d99 100%); color: #ffffff; border: none; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.12); padding: 12px 8px; cursor: pointer;" onclick="showAllOpportunities()" title="คลิกเพื่อดูโอกาสงานทั้งหมด (รีเซ็ตตัวกรอง)">
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 2px;">
          <span style="color: #e0f2fe; font-weight: 700; font-size: 0.82rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="รวมโอกาสงานทั้งหมด">🌟 รวมงาน</span>
          <span style="font-size: 0.7rem; background: rgba(255,255,255,0.22); color: #ffffff; padding: 1px 5px; border-radius: 8px; font-weight: 600; white-space: nowrap;">${periodLabel}</span>
        </div>
        <div class="summary-value" style="color: #ffffff; font-size: 1.85rem; font-weight: 800; margin: 6px 0 0 0;">${totalActive}</div>
      </div>
      <div class="summary-card c-boq" style="background: linear-gradient(135deg, #15803d 0%, #16a34a 100%); color: #ffffff; border: none; cursor: pointer; box-shadow: 0 4px 10px rgba(22, 163, 74, 0.25); transition: transform 0.2s ease; padding: 12px 8px;" onclick="switchToBoqTab()" title="คลิกเพื่อดูงานที่ตรวจเจอใน BOQ ทันที">
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 2px;">
          <span style="color: #dcfce7; font-weight: 700; font-size: 0.82rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="ตรวจพบใน BOQ">🎯 ใน BOQ</span>
          <span style="font-size: 0.68rem; background: rgba(255,255,255,0.25); color: #ffffff; padding: 1px 5px; border-radius: 8px; font-weight: 700; white-space: nowrap;">ตรง 100%</span>
        </div>
        <div class="summary-value" style="color: #ffffff; font-size: 1.85rem; font-weight: 800; margin: 6px 0 0 0;">${boqCount}</div>
      </div>
      <div class="summary-card c-d0" style="padding: 12px 8px; cursor: pointer;" onclick="filterByTypeOnly('D0')" title="คลิกเพื่อกรองเฉพาะประกาศเชิญชวน (D0)">
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 2px;">
          <span style="color: var(--badge-d0, #dc3545); font-weight: 700; font-size: 0.82rem; white-space: nowrap;">🔴 เชิญชวน</span>
          <span style="font-size: 0.7rem; background: #fee2e2; color: #991b1b; padding: 1px 5px; border-radius: 8px; font-weight: 600; white-space: nowrap;">${periodLabel}</span>
        </div>
        <div class="summary-value" style="font-size: 1.85rem; margin: 6px 0 0 0;">${countD0}</div>
      </div>
      <div class="summary-card c-b0" style="padding: 12px 8px; cursor: pointer;" onclick="filterByTypeOnly('B0')" title="คลิกเพื่อกรองเฉพาะร่าง TOR (B0)">
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 2px;">
          <span style="color: var(--badge-b0, #d97706); font-weight: 700; font-size: 0.82rem; white-space: nowrap;">🟡 ร่าง TOR</span>
          <span style="font-size: 0.7rem; background: #fef9c3; color: #854d0e; padding: 1px 5px; border-radius: 8px; font-weight: 600; white-space: nowrap;">${periodLabel}</span>
        </div>
        <div class="summary-value" style="font-size: 1.85rem; margin: 6px 0 0 0;">${countB0}</div>
      </div>
      <div class="summary-card c-15" style="padding: 12px 8px; cursor: pointer;" onclick="filterByTypeOnly('15')" title="คลิกเพื่อกรองเฉพาะราคากลาง (15)">
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 2px;">
          <span style="color: var(--badge-15, #ea580c); font-weight: 700; font-size: 0.82rem; white-space: nowrap;">🟠 ราคากลาง</span>
          <span style="font-size: 0.7rem; background: #ffedd5; color: #9a3412; padding: 1px 5px; border-radius: 8px; font-weight: 600; white-space: nowrap;">${periodLabel}</span>
        </div>
        <div class="summary-value" style="font-size: 1.85rem; margin: 6px 0 0 0;">${count15}</div>
      </div>
      <div class="summary-card c-p0" style="padding: 12px 8px; cursor: pointer;" onclick="filterByTypeOnly('P0')" title="คลิกเพื่อกรองเฉพาะแผนจัดซื้อ (P0)">
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 2px;">
          <span style="color: var(--badge-p0, #16a34a); font-weight: 700; font-size: 0.82rem; white-space: nowrap;">🟢 แผนจัดซื้อ</span>
          <span style="font-size: 0.7rem; background: #dcfce7; color: #166534; padding: 1px 5px; border-radius: 8px; font-weight: 600; white-space: nowrap;">${periodLabel}</span>
        </div>
        <div class="summary-value" style="font-size: 1.85rem; margin: 6px 0 0 0;">${countP0}</div>
      </div>
    `;

    const boqTabBadge = document.getElementById('boq-tab-badge');
    if (boqTabBadge) boqTabBadge.textContent = boqCount;
    const totalBoqCountEl = document.getElementById('total-boq-verified-count');
    if (totalBoqCountEl) totalBoqCountEl.textContent = `${boqCount} งาน`;

    // Update byRegion badge counts in zone tabs
    const regionCounts = {};
    let totalRegionCount = 0;
    (res.data.byRegion || []).forEach(r => {
      regionCounts[r.region] = r.count;
      totalRegionCount += r.count;
    });
    const setTxt = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    setTxt('zcount-all', totalRegionCount);
    setTxt('zcount-bkk', regionCounts['bkk'] || 0);
    setTxt('zcount-central', regionCounts['central'] || 0);
    setTxt('zcount-east', regionCounts['east'] || 0);
    setTxt('zcount-north', regionCounts['north'] || 0);
    setTxt('zcount-northeast', regionCounts['northeast'] || 0);
    setTxt('zcount-west', regionCounts['west'] || 0);
    setTxt('zcount-south', regionCounts['south'] || 0);

  } catch (err) {
    console.error('Error loading stats:', err);
  }
}

async function loadAnnouncements(append = false) {
  const container = document.getElementById('announcement-list');
  const btn = document.getElementById('btn-load-more');
  if (!container) return;

  if (!append) container.innerHTML = '<div class="text-center">กำลังโหลด...</div>';

  const types = Array.from(document.querySelectorAll('[data-filter-type].active')).map(el => el.dataset.filterType);
  const groups = Array.from(document.querySelectorAll('[data-filter-group].active')).map(el => el.dataset.filterGroup);
  const search = document.getElementById('search-input')?.value || '';

  const params = { page: currentPage, limit };
  if (types.length) params.type = types.join(',');
  if (groups.length) params.group = groups.join(',');
  if (search) params.search = search;
  if (selectedZone) params.region = selectedZone;

  // Budget range filter
  if (selectedBudgetMin) params.budget_min = selectedBudgetMin;
  if (selectedBudgetMax) params.budget_max = selectedBudgetMax;

  // Calculate date range filter
  if (selectedDays > 0) {
    const d = new Date();
    d.setDate(d.getDate() - selectedDays);
    params.date_start = d.toISOString().split('T')[0];
  } else if (selectedDays === 0) {
    params.date = new Date().toISOString().split('T')[0];
  }

  try {
    const res = await api.getAnnouncements(params);
    const rawItems = res.data || [];
    
    // Do not filter out projects locally - keep visible for safety until 5 team rejects occur
    const items = rawItems;
    
    const startIdx = append ? container.querySelectorAll('.announcement-card').length : 0;
    let html = items.map((item, idx) => {
      const itemIndex = startIdx + idx + 1;
      const typeKey = item.announce_type || '';
      let displayTypeClass = typeKey.toLowerCase();
      if (['d1'].includes(displayTypeClass)) displayTypeClass = 'd0';
      if (['im', 'w0', 'w1', 'w2'].includes(displayTypeClass)) displayTypeClass = 'archive';
      if (['b1', 'b2', 'b3'].includes(displayTypeClass)) displayTypeClass = 'b0';
      if (['boq'].includes(displayTypeClass)) displayTypeClass = '15';
      const groupKey = item.product_group || '';
      const projId = (item.project_id || item.id || '').replace(/-[A-Za-z0-9]+$/, '');
      const dept = item.department || '';
      const egpWebUrl = (window.getEgpPortalUrl ? window.getEgpPortalUrl(item) : `https://process5.gprocurement.go.th/egp-agpc01-web/announcement?keywordSearch=${encodeURIComponent(projId)}`);
      // 1. Direct 100% Fit: Explicit tire procurement, radial, vehicle, truck, bus, patrol, OTR
      const titleLower = (item.project_name || '').toLowerCase();
      const coreTireKeywords = [
        'ยางรถยนต์', 'ยางรถบรรทุก', 'ยางรถ', 'ยางนอก', 'ยางใน', 
        'เปลี่ยนยาง', 'จัดซื้อยาง', 'ซื้อยาง', 'ยางเรเดียล', 'ยาง radial',
        'ยางรถจักรยานยนต์', 'ยางมอเตอร์ไซค์', 'ยาง otr', 'ยางรถตัก', 'ยางรถแทรกเตอร์'
      ];
      const isTopFit = coreTireKeywords.some(k => titleLower.includes(k)) && 
                       (titleLower.includes('จัดซื้อ') || titleLower.includes('ซื้อ') || titleLower.includes('เปลี่ยน') || titleLower.includes('จ้างเหมา') || titleLower.includes('ซ่อมบำรุง'));

      // 2. Disguised Fleet Maintenance Fit:
      // The project title is framed broadly (ซ่อมบำรุงยานพาหนะ, ซ่อมแซมรถยนต์ส่วนกลาง) but inside the BOQ / quotation there is tire replacement!
      const disguisedKeywords = [
        'ซ่อมบำรุงยานพาหนะ', 'ซ่อมแซมรถยนต์', 'บำรุงรักษายานพาหนะ', 'ซ่อมรถยนต์ส่วนกลาง', 'ซ่อมรถบรรทุก', 'ซ่อมรถพยาบาล'
      ];
      const isDisguisedFit = !isTopFit && disguisedKeywords.some(k => titleLower.includes(k));
      const isSpecificProcurement = titleLower.includes('เฉพาะเจาะจง') || (item.flow_name && item.flow_name.includes('เฉพาะเจาะจง'));

      // Extract matched keyword
      let matchedKw = '';
      if (item.boq_matches) {
        try {
          const matches = typeof item.boq_matches === 'string' ? JSON.parse(item.boq_matches) : item.boq_matches;
          if (Array.isArray(matches) && matches.length > 0 && matches[0].keyword) {
            matchedKw = matches[0].keyword;
          }
        } catch(e) {}
      }
      if (!matchedKw && item.boq_summary) {
        const m = item.boq_summary.match(/พบสเปก\s*["“]([^"”]+)["”]/i);
        if (m && m[1]) matchedKw = m[1];
      }
      if (!matchedKw && item.project_name) {
        const t = item.project_name;
        if (t.includes('ยางรถยนต์') || t.includes('ยางรถเก๋ง') || t.includes('ยางรถกระบะ') || t.includes('ยางรถตู้')) matchedKw = 'ยางรถยนต์ & กระบะ';
        else if (t.includes('ยางรถบรรทุก') || t.includes('ยางรถบัส') || t.includes('ยางรถขยะ') || t.includes('ยางรถน้ำ')) matchedKw = 'ยางรถบรรทุก & บัส';
        else if (t.includes('ยางรถจักรยานยนต์') || t.includes('ยางมอเตอร์ไซค์') || t.includes('ยางสายตรวจ')) matchedKw = 'ยางจักรยานยนต์ & สายตรวจ';
        else if (t.includes('ยาง otr') || t.includes('ยาง OTR') || t.includes('ยางรถแทรกเตอร์') || t.includes('ยางรถไถ') || t.includes('ยางรถตัก') || t.includes('ยางรถยก')) matchedKw = 'ยาง OTR & เครื่องจักร';
        else if (t.includes('ยางรถจักรยาน') || t.includes('ยางวีลแชร์')) matchedKw = 'ยางจักรยาน & วีลแชร์';
        else if (t.includes('ยางใน') || t.includes('ยางรองคอด') || t.includes('จุ๊บลม')) matchedKw = 'ยางใน & อุปกรณ์';
        else if (t.includes('ยางเรเดียล') || t.includes('ยาง radial')) matchedKw = 'ยางเรเดียล';
        else if (t.includes('เปลี่ยนยาง') || t.includes('จัดซื้อยาง') || t.includes('ซื้อยาง')) matchedKw = 'จัดซื้อยางราชการ';
      }

      // Calculate days left to bid
      const daysLeft = getDaysLeft(item.bid_date || item.doc_end_date);
      let bidBadge = '';
      if (item.bid_date) {
        if (daysLeft !== null) {
          if (daysLeft < 0) {
            bidBadge = `<span class="card-meta-item" style="color: #64748b;"><span style="font-size: 1rem;">📅</span> เคาะราคาแล้ว (${item.bid_date})</span>`;
          } else if (daysLeft === 0) {
            bidBadge = `<span class="card-meta-item" style="color: #b91c1c; font-weight: 800; background: #fee2e2; padding: 2px 8px; border-radius: 6px; border: 1px solid #fca5a5;">🔥 เคาะราคาวันนี้! (${item.bid_time || '09:00 - 12:00'})</span>`;
          } else if (daysLeft <= 7) {
            bidBadge = `<span class="card-meta-item" style="color: #b91c1c; font-weight: 800; background: #fee2e2; padding: 2px 8px; border-radius: 6px; border: 1px solid #fca5a5;">🔥 เคาะ: ${item.bid_date} (⏳ อีก ${daysLeft} วัน)</span>`;
          } else {
            bidBadge = `<span class="card-meta-item" style="color: #0369a1; font-weight: 700; background: #e0f2fe; padding: 2px 8px; border-radius: 6px; border: 1px solid #bae6fd;">📅 เคาะ: ${item.bid_date} (⏳ อีก ${daysLeft} วัน)</span>`;
          }
        } else {
          bidBadge = `<span class="card-meta-item" style="color: #0369a1; font-weight: 700;"><span style="font-size: 1rem;">📅</span> เคาะราคา: ${item.bid_date}</span>`;
        }
      } else {
        bidBadge = '';
      }

      // Announcement Date Badge for Layer 1
      let isToday = false;
      try {
        const now = new Date();
        const thaiYear = now.getFullYear();
        const thaiMonth = String(now.getMonth() + 1).padStart(2, '0');
        const thaiDay = String(now.getDate()).padStart(2, '0');
        const todayLocalStr = `${thaiYear}-${thaiMonth}-${thaiDay}`;
        if (item.announce_date && item.announce_date.includes(todayLocalStr)) {
          isToday = true;
        }
      } catch (e) {}

      const announceDateBadge = isToday
        ? `<span class="card-hero-date-badge is-today" title="วันที่ประกาศ e-GP">
            <span>🔥</span> ประกาศ: <strong style="color: #b91c1c; font-size: 0.92rem; font-weight: 800;">วันนี้ (${formatDate(item.announce_date)})</strong>
          </span>`
        : `<span class="card-hero-date-badge" title="วันที่ประกาศ e-GP">
            <span>📅</span> ประกาศ: <strong style="color: #1d4ed8; font-size: 0.92rem; font-weight: 800;">${formatDate(item.announce_date)}</strong>
          </span>`;

      let provName = (item.province || '').trim();
      if (!provName || provName === 'ไม่ระบุ' || provName === 'null') {
        if (window.extractProvince) {
          provName = window.extractProvince(item);
        }
      }
      let provBadge = '';
      if (provName && provName !== 'ไม่ระบุ' && provName !== 'null') {
        const displayProv = (provName.startsWith('จังหวัด') || provName === 'กรุงเทพมหานคร' || provName.startsWith('จ.'))
          ? provName
          : `จ.${provName}`;
        provBadge = `<span style="background: #e0f2fe; color: #0284c7; font-weight: 700; font-size: 0.88rem; padding: 2px 10px; border-radius: 6px; border: 1px solid #bae6fd; display: inline-flex; align-items: center; gap: 3px;">📍 ${displayProv}</span>`;
      }

      const reg = window.getRegionInfo ? window.getRegionInfo(provName) : null;
      let regBadge = '';
      if (reg) {
        regBadge = `<span style="background: ${reg.bg}; color: ${reg.color}; border: 1px solid ${reg.border}; font-weight: 700; font-size: 0.82rem; padding: 2px 8px; border-radius: 6px; display: inline-flex; align-items: center; gap: 3px;">${reg.icon} ${reg.name}</span>`;
      }

      if (window.projectDataStore) {
        window.projectDataStore.set(item.id, item);
      }

      const fb = userFeedbackMap[item.id];
      const isMatched = fb && fb.is_match === 1;
      const isMaybe = fb && fb.is_match === 2;
      const isRejected = fb && fb.is_match === 0;
      let cardExtraClass = '';
      if (isRejected) cardExtraClass = ' feedback-dimmed';
      else if (isMaybe) cardExtraClass = ' feedback-maybe-active';

      const hasBoqVerified = !!(item.boq_summary || item.doc_verified);
      const boqCardClass = hasBoqVerified ? ' boq-highlight-card' : '';
      const origin = window.getMatchOriginInfo ? window.getMatchOriginInfo(item) : null;

      return `
        <div class="announcement-card${cardExtraClass}${boqCardClass}" data-project-id="${item.id}" data-days-left="${daysLeft !== null ? daysLeft : ''}">
          
          <!-- Layer 1: Hero Header (Date & Budget in COLOR; other tags neutral) -->
          <div class="card-layer-hero" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
            <div class="card-hero-left" style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
              <span style="background: #1e293b; color: #ffffff; font-weight: 700; font-size: 0.82rem; padding: 3px 8px; border-radius: 4px;">#${itemIndex}</span>
              ${announceDateBadge}
              ${hasBoqVerified ? `
                <div class="card-keyword-pill" style="font-size: 0.82rem; padding: 2px 8px;">
                  <span>🎯 Keyword =</span>
                  <span class="kw-value">${matchedKw || (origin?.keyword) || 'สเปกตรงสาย'}</span>
                </div>
              ` : `
                <span class="badge type-${displayTypeClass}">${typeLabels[typeKey] || typeKey}</span>
                ${groupKey ? `<span class="badge group-${groupKey}">${groupLabels[groupKey] || groupKey}</span>` : ''}
              `}
            </div>
            <div class="card-hero-budget" title="งบประมาณโครงการ">
              ${formatMoney(item.budget)}
            </div>
          </div>

          <!-- Layer 2: Core Info (Project Title, Detection Origin & Meta row) -->
          <div class="card-layer-body">
            <h3 class="card-project-title">
              <a href="detail.html?id=${encodeURIComponent(item.id)}" title="คลิกเพื่อดูรายละเอียด">${item.project_name || 'ไม่มีชื่อโครงการ'}</a>
            </h3>

            ${origin ? `
              <div class="card-origin-box ${origin.isPdf ? 'origin-pdf' : 'origin-title'}">
                <div class="origin-header">
                  <span class="${origin.isPdf ? 'origin-badge-pdf' : 'origin-badge-title'}">
                    ${origin.isPdf ? '📑 มุดสแกนพบในไฟล์ PDF (ปร.4/BOQ)' : '🏷️ ตรวจพบจากชื่อประกาศโครงการ'}
                  </span>
                  <span class="origin-keyword-badge">
                    ตรวจพบ Keyword: <span class="kw-highlight">"${origin.keyword}"</span>
                  </span>
                </div>
                ${origin.snippet ? `
                  <div class="origin-snippet">
                    <strong>🔎 ข้อความที่สกัดได้จากเอกสาร:</strong> ${origin.snippet}
                  </div>
                ` : ''}
              </div>
            ` : ''}
            
            <div class="card-meta-row">
              <span class="card-meta-item">
                <span style="font-size: 1.05rem;">🏢</span>
                <strong style="color: #1e293b;">${dept || '-'}</strong>
              </span>
              ${provBadge}
              ${regBadge}
              ${bidBadge}
            </div>
          </div>

          <!-- Layer 3: Action Buttons (Clear, Clickable, No Guesswork) -->
          <div class="card-layer-actions">
            <button type="button" class="btn-card-action btn-action-copy" onclick="copyText('${projId}', this)" title="คัดลอกเลข e-GP เพื่อนำไปค้นหาใน e-GP">
              📋 คัดลอกเลข e-GP: <strong style="font-family: monospace; margin-left: 2px; color: #003366;">${projId}</strong>
            </button>
            <a href="${egpWebUrl}" target="_blank" rel="noopener noreferrer" class="btn-card-action btn-action-egp" onclick="return window.openEgpWithCopy ? window.openEgpWithCopy('${projId}', event) : true" title="กดคัดลอกเลขแล้วเปิด e-GP เพื่อวางค้นหาเอกสาร">
              🔗 เปิดใน e-GP
            </a>
            <button type="button" class="btn-card-action btn-action-sim" onclick="openBiddingSimulator('${item.id}')" title="คำนวณราคาเคาะและกำไร">
              🧮 เคาะราคา
            </button>
            <a href="detail.html?id=${encodeURIComponent(item.id)}" class="btn-card-action btn-action-detail" title="ดูรายละเอียดโครงการ">
              🔍 รายละเอียด
            </a>
          </div>

          <!-- Layer 4: AI Feedback (3 Clear Buttons + Status Banner) -->
          <div class="card-layer-feedback">
            <div class="feedback-question-row">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 1.15rem;">💡</span>
                <strong style="color: #334155; font-size: 0.92rem;">งานนี้ตรงกับ วีรับเบอร์ ไหม?</strong>
              </div>
              <div class="feedback-buttons-group">
                <button type="button" class="btn-ai-choice btn-ai-yes ${isMatched ? 'active' : ''}" onclick="submitMatchFeedbackQuick('${item.id}', '${projId}', this)" title="กดเพื่อระบุว่าเป็นงานที่เราทำ เพื่อฝึกระบบ AI">
                  ${isMatched ? '✔ คุณเลือก: ใช่งานเรา' : '👍 ใช่ (งานเรา)'}
                </button>
                <button type="button" class="btn-ai-choice btn-ai-maybe ${isMaybe ? 'active' : ''}" onclick="submitMaybeFeedbackQuick('${item.id}', '${projId}', this)" title="กดเพื่อระบุว่าอาจจะใช่ รอพิจารณาสเปกเพิ่มเติม">
                  ${isMaybe ? '✔ คุณเลือก: อาจจะใช่' : '🤔 อาจจะใช่'}
                </button>
                <button type="button" class="btn-ai-choice btn-ai-no ${isRejected ? 'active' : ''}" onclick="submitRejectFeedbackQuick('${item.id}', '${projId}', this)" title="กดเพื่อระบุว่าไม่ใช่งาน (ต้องครบ 5 เสียงจึงจะแบล็คลิสต์ ป้องกันงานหลุด)">
                  ${isRejected ? '✔ คุณเลือก: ไม่ใช่งาน (1/5 เสียง)' : '👎 ไม่ใช่งาน'}
                </button>
              </div>
            </div>

            <!-- Dedicated Status Banner (explicitly displays what was selected) -->
            <div id="feedback-banner-${item.id}">
              ${isMatched ? `
                <div class="card-feedback-status-banner status-yes">
                  <div class="status-banner-content">
                    <span class="status-banner-icon">✔</span>
                    <div>
                      <strong>คุณเลือก: "ใช่งานเรา (ตรงสาย)"</strong>
                      <div class="status-banner-sub">บันทึกส่งเข้าคลังพัฒนา AI สำเร็จ • พร้อมเตรียมยื่นประมูล</div>
                    </div>
                  </div>
                  <button type="button" class="btn-status-banner-undo" onclick="undoFeedbackQuick('${item.id}', '${projId}', this)">↩ ยกเลิก / เปลี่ยนใจ</button>
                </div>
              ` : isMaybe ? `
                <div class="card-feedback-status-banner status-maybe">
                  <div class="status-banner-content">
                    <span class="status-banner-icon">🤔</span>
                    <div>
                      <strong>คุณเลือก: "อาจจะใช่"</strong>
                      <div class="status-banner-sub">เก็บเข้าคลังงานรอตรวจสอบสเปก/BOQ ละเอียดเพิ่มเติม</div>
                    </div>
                  </div>
                  <button type="button" class="btn-status-banner-undo" onclick="undoFeedbackQuick('${item.id}', '${projId}', this)">↩ ยกเลิก / เปลี่ยนใจ</button>
                </div>
              ` : isRejected ? `
                <div class="card-feedback-status-banner status-no">
                  <div class="status-banner-content">
                    <span class="status-banner-icon">👎</span>
                    <div>
                      <strong>คุณเลือก: "ไม่ใช่งาน" (1/5 เสียง)</strong>
                      <div class="status-banner-sub">ยังคงแสดงบนหน้าจอเพื่อความปลอดภัย (ต้องครบ 5 เสียงถึงจะคัดออก)</div>
                    </div>
                  </div>
                  <button type="button" class="btn-status-banner-undo" onclick="undoFeedbackQuick('${item.id}', '${projId}', this)">↩ ยกเลิก / เปลี่ยนใจ</button>
                </div>
              ` : ''}
            </div>
          </div>

        </div>
      `;
    }).join('');

    if (append) {
      const temp = document.createElement('div');
      temp.innerHTML = html;
      while(temp.firstChild) container.appendChild(temp.firstChild);
    } else {
      container.innerHTML = html || '<div class="text-center">ไม่พบข้อมูล</div>';
    }

    filterCardsByStatus();

    if (btn) {
      const hasMore = rawItems.length >= limit || (res.pagination && (currentPage * limit < res.pagination.total));
      if (hasMore) {
        btn.classList.remove('hidden');
        btn.innerHTML = `⬇️ โหลดโครงการเพิ่มเติม (แสดงแล้ว ${container.querySelectorAll('.announcement-card').length} โครงการ)`;
      } else {
        btn.classList.add('hidden');
      }
    }

  } catch (err) {
    if (!append) container.innerHTML = `<div class="error-msg">เกิดข้อผิดพลาด: ${err.message}</div>`;
  }
}

// -------------------------------------------------------------
// BOQ Tab Functions & Logic
// -------------------------------------------------------------
let boqPage = 1;
const boqLimit = 50;
let boqSearchKeyword = '';
let selectedBoqGroup = '';
let boqSearchTimer = null;

window.showAllOpportunities = function() {
  // 1. Switch to opportunities tab
  const oppTab = document.querySelector('.tab[data-tab="opportunities"]');
  if (oppTab) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
    oppTab.classList.add('active');
    const targetContent = document.getElementById('tab-opportunities');
    if (targetContent) targetContent.classList.remove('hidden');
  }

  // 2. Activate ALL type filter buttons so no types are filtered out
  document.querySelectorAll('[data-filter-type]').forEach(btn => {
    btn.classList.add('active');
  });

  // 3. Reset status filter to 'all'
  document.querySelectorAll('[data-status-filter]').forEach(b => b.classList.remove('active'));
  const allStatusBtn = document.querySelector('[data-status-filter="all"]');
  if (allStatusBtn) allStatusBtn.classList.add('active');
  selectedStatusFilter = 'all';

  // 4. Reset page and reload
  currentPage = 1;
  loadAnnouncements();

  // 5. Smooth scroll down to the announcements
  const filtersEl = document.querySelector('#tab-opportunities .filters');
  if (filtersEl) {
    filtersEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } else {
    window.scrollTo({ top: 350, behavior: 'smooth' });
  }
};

window.filterByTypeOnly = function(typeCode) {
  // 1. Switch to opportunities tab
  const oppTab = document.querySelector('.tab[data-tab="opportunities"]');
  if (oppTab) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
    oppTab.classList.add('active');
    const targetContent = document.getElementById('tab-opportunities');
    if (targetContent) targetContent.classList.remove('hidden');
  }

  // 2. Deactivate all type filters, activate only the chosen typeCode
  document.querySelectorAll('[data-filter-type]').forEach(btn => {
    if (btn.dataset.filterType === typeCode) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // 3. Reset page and reload
  currentPage = 1;
  loadAnnouncements();

  // 4. Smooth scroll
  const filtersEl = document.querySelector('#tab-opportunities .filters');
  if (filtersEl) {
    filtersEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } else {
    window.scrollTo({ top: 350, behavior: 'smooth' });
  }
};

window.switchToBoqTab = function() {
  const boqTabBtn = document.querySelector('.tab[data-tab="boq"]');
  if (boqTabBtn) {
    boqTabBtn.click();
    window.scrollTo({ top: 350, behavior: 'smooth' });
  }
};

window.onBoqSearchInput = function(event) {
  clearTimeout(boqSearchTimer);
  boqSearchTimer = setTimeout(() => {
    boqSearchKeyword = event.target.value.trim();
    boqPage = 1;
    loadBoqAnnouncements();
  }, 350);
};

window.filterBoqGroup = function(group, btn) {
  selectedBoqGroup = group;
  document.querySelectorAll('#boq-group-filters button').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  boqPage = 1;
  loadBoqAnnouncements();
};

async function loadBoqAnnouncements(append = false) {
  const container = document.getElementById('boq-announcement-list');
  const btn = document.getElementById('btn-load-more-boq');
  if (!container) return;

  if (!append) {
    container.innerHTML = '<div class="text-center" style="padding: 40px 20px; color: #16a34a; font-weight: 700; font-size: 1.1rem;">⏳ กำลังโหลดโครงการที่ตรวจพบใน BOQ...</div>';
  }

  const params = {
    page: boqPage,
    limit: boqLimit,
    boq_only: 1
  };
  if (boqSearchKeyword) params.search = boqSearchKeyword;
  if (selectedBoqGroup) params.group = selectedBoqGroup;

  try {
    const res = await api.getAnnouncements(params);
    const rawItems = res.data || [];

    // Filter to ensure verified items; do not hide locally for safety until 5 team rejects occur
    const items = rawItems.filter(it => {
      return !!(it.boq_summary || it.doc_verified);
    });

    const boqTabBadge = document.getElementById('boq-tab-badge');
    if (boqTabBadge && !boqSearchKeyword && !selectedBoqGroup) {
      boqTabBadge.textContent = items.length;
    }
    const totalBoqCountEl = document.getElementById('total-boq-verified-count');
    if (totalBoqCountEl && !boqSearchKeyword && !selectedBoqGroup) {
      totalBoqCountEl.textContent = `${items.length} งาน`;
    }

    if (items.length === 0) {
      if (!append) {
        container.innerHTML = `
          <div style="background: #f8fafc; border: 1.5px dashed #cbd5e1; border-radius: 12px; padding: 40px 20px; text-align: center; margin: 20px 0;">
            <div style="font-size: 3rem; margin-bottom: 12px;">🔍</div>
            <h3 style="color: #334155; margin-bottom: 8px;">ไม่พบโครงการที่ค้นหาในหมวด BOQ</h3>
            <p style="color: #64748b; font-size: 0.95rem; max-width: 520px; margin: 0 auto; line-height: 1.5;">
              ระบบ AI In-Memory Scanner สแกนไฟล์ PDF และ ปร.4 อย่างต่อเนื่องทุกวัน หากมีประกาศใหม่ที่พบสเปกของ วีรับเบอร์ จะแสดงขึ้นที่นี่ทันที
            </p>
          </div>
        `;
      }
      if (btn) btn.classList.add('hidden');
      return;
    }

    const startIdx = append ? container.querySelectorAll('.announcement-card').length : 0;
    const html = items.map((item, idx) => {
      const itemIndex = startIdx + idx + 1;
      const typeKey = item.announce_type || '';
      let displayTypeClass = typeKey.toLowerCase();
      if (['d1'].includes(displayTypeClass)) displayTypeClass = 'd0';
      if (['im', 'w0', 'w1', 'w2'].includes(displayTypeClass)) displayTypeClass = 'archive';
      if (['b1', 'b2', 'b3'].includes(displayTypeClass)) displayTypeClass = 'b0';
      if (['boq'].includes(displayTypeClass)) displayTypeClass = '15';
      const groupKey = item.product_group || '';
      const projId = (item.project_id || item.id || '').replace(/-[A-Za-z0-9]+$/, '');
      const egpWebUrl = (window.getEgpPortalUrl ? window.getEgpPortalUrl(item) : `https://process5.gprocurement.go.th/egp-agpc01-web/announcement?keywordSearch=${encodeURIComponent(projId)}`);
      const dept = item.department || '';

      // Extract matched keyword
      let matchedKw = '';
      if (item.boq_matches) {
        try {
          const matches = typeof item.boq_matches === 'string' ? JSON.parse(item.boq_matches) : item.boq_matches;
          if (Array.isArray(matches) && matches.length > 0 && matches[0].keyword) {
            matchedKw = matches[0].keyword;
          }
        } catch(e) {}
      }
      if (!matchedKw && item.boq_summary) {
        const m = item.boq_summary.match(/พบสเปก\s*["“]([^"”]+)["”]/i);
        if (m && m[1]) matchedKw = m[1];
      }
      if (!matchedKw && item.project_name) {
        const t = item.project_name;
        if (t.includes('ยางรถยนต์') || t.includes('ยางรถเก๋ง') || t.includes('ยางรถกระบะ') || t.includes('ยางรถตู้')) matchedKw = 'ยางรถยนต์ & กระบะ';
        else if (t.includes('ยางรถบรรทุก') || t.includes('ยางรถบัส') || t.includes('ยางรถขยะ') || t.includes('ยางรถน้ำ')) matchedKw = 'ยางรถบรรทุก & บัส';
        else if (t.includes('ยางรถจักรยานยนต์') || t.includes('ยางมอเตอร์ไซค์') || t.includes('ยางสายตรวจ')) matchedKw = 'ยางจักรยานยนต์ & สายตรวจ';
        else if (t.includes('ยาง otr') || t.includes('ยาง OTR') || t.includes('ยางรถแทรกเตอร์') || t.includes('ยางรถไถ') || t.includes('ยางรถตัก') || t.includes('ยางรถยก')) matchedKw = 'ยาง OTR & เครื่องจักร';
        else if (t.includes('ยางรถจักรยาน') || t.includes('ยางวีลแชร์')) matchedKw = 'ยางจักรยาน & วีลแชร์';
        else if (t.includes('ยางใน') || t.includes('ยางรองคอด') || t.includes('จุ๊บลม')) matchedKw = 'ยางใน & อุปกรณ์';
        else if (t.includes('ยางเรเดียล') || t.includes('ยาง radial')) matchedKw = 'ยางเรเดียล';
        else if (t.includes('เปลี่ยนยาง') || t.includes('จัดซื้อยาง') || t.includes('ซื้อยาง')) matchedKw = 'จัดซื้อยางราชการ';
      }

      // Calculate days left to bid
      const daysLeft = getDaysLeft(item.bid_date || item.doc_end_date);
      let bidBadge = '';
      if (item.bid_date) {
        if (daysLeft !== null) {
          if (daysLeft < 0) {
            bidBadge = `<span class="card-meta-item" style="color: #64748b;"><span style="font-size: 1rem;">📅</span> เคาะราคาแล้ว (${item.bid_date})</span>`;
          } else if (daysLeft === 0) {
            bidBadge = `<span class="card-meta-item" style="color: #b91c1c; font-weight: 800; background: #fee2e2; padding: 2px 8px; border-radius: 6px; border: 1px solid #fca5a5;">🔥 เคาะราคาวันนี้! (${item.bid_time || '09:00 - 12:00'})</span>`;
          } else if (daysLeft <= 7) {
            bidBadge = `<span class="card-meta-item" style="color: #b91c1c; font-weight: 800; background: #fee2e2; padding: 2px 8px; border-radius: 6px; border: 1px solid #fca5a5;">🔥 เคาะ: ${item.bid_date} (⏳ อีก ${daysLeft} วัน)</span>`;
          } else {
            bidBadge = `<span class="card-meta-item" style="color: #0369a1; font-weight: 700; background: #e0f2fe; padding: 2px 8px; border-radius: 6px; border: 1px solid #bae6fd;">📅 เคาะ: ${item.bid_date} (⏳ อีก ${daysLeft} วัน)</span>`;
          }
        } else {
          bidBadge = `<span class="card-meta-item" style="color: #0369a1; font-weight: 700;"><span style="font-size: 1rem;">📅</span> เคาะราคา: ${item.bid_date}</span>`;
        }
      } else {
        bidBadge = '';
      }

      // Announcement Date Badge for Layer 1
      let isToday = false;
      try {
        const now = new Date();
        const thaiYear = now.getFullYear();
        const thaiMonth = String(now.getMonth() + 1).padStart(2, '0');
        const thaiDay = String(now.getDate()).padStart(2, '0');
        const todayLocalStr = `${thaiYear}-${thaiMonth}-${thaiDay}`;
        if (item.announce_date && item.announce_date.includes(todayLocalStr)) {
          isToday = true;
        }
      } catch (e) {}

      const announceDateBadge = isToday
        ? `<span class="card-hero-date-badge is-today" title="วันที่ประกาศ e-GP">
            <span>🔥</span> ประกาศ: <strong style="color: #b91c1c; font-size: 0.92rem; font-weight: 800;">วันนี้ (${formatDate(item.announce_date)})</strong>
          </span>`
        : `<span class="card-hero-date-badge" title="วันที่ประกาศ e-GP">
            <span>📅</span> ประกาศ: <strong style="color: #1d4ed8; font-size: 0.92rem; font-weight: 800;">${formatDate(item.announce_date)}</strong>
          </span>`;

      let provName = (item.province || '').trim();
      if (!provName || provName === 'ไม่ระบุ' || provName === 'null') {
        if (window.extractProvince) {
          provName = window.extractProvince(item);
        }
      }
      let provBadge = '';
      if (provName && provName !== 'ไม่ระบุ' && provName !== 'null') {
        const displayProv = (provName.startsWith('จังหวัด') || provName === 'กรุงเทพมหานคร' || provName.startsWith('จ.'))
          ? provName
          : `จ.${provName}`;
        provBadge = `<span style="background: #e0f2fe; color: #0284c7; font-weight: 700; font-size: 0.88rem; padding: 2px 10px; border-radius: 6px; border: 1px solid #bae6fd; display: inline-flex; align-items: center; gap: 3px;">📍 ${displayProv}</span>`;
      }

      const reg = window.getRegionInfo ? window.getRegionInfo(provName) : null;
      let regBadge = '';
      if (reg) {
        regBadge = `<span style="background: ${reg.bg}; color: ${reg.color}; border: 1px solid ${reg.border}; font-weight: 700; font-size: 0.82rem; padding: 2px 8px; border-radius: 6px; display: inline-flex; align-items: center; gap: 3px;">${reg.icon} ${reg.name}</span>`;
      }

      if (window.projectDataStore) {
        window.projectDataStore.set(item.id, item);
      }

      const fb = userFeedbackMap[item.id];
      const isMatched = fb && fb.is_match === 1;
      const isMaybe = fb && fb.is_match === 2;
      const isRejected = fb && fb.is_match === 0;
      let cardExtraClass = '';
      if (isRejected) cardExtraClass = ' feedback-dimmed';
      else if (isMaybe) cardExtraClass = ' feedback-maybe-active';
      const origin = window.getMatchOriginInfo ? window.getMatchOriginInfo(item) : null;

      return `
        <div class="announcement-card boq-highlight-card${cardExtraClass}" data-project-id="${item.id}" data-days-left="${daysLeft !== null ? daysLeft : ''}">
          
          <!-- Layer 1: Hero Header (Date & Budget in COLOR; other tags neutral) -->
          <div class="card-layer-hero" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
            <div class="card-hero-left" style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
              <span style="background: #1e293b; color: #ffffff; font-weight: 700; font-size: 0.82rem; padding: 3px 8px; border-radius: 4px;">#${itemIndex}</span>
              ${announceDateBadge}
              <div class="card-keyword-pill" style="font-size: 0.82rem; padding: 2px 8px;">
                <span>🎯 Keyword =</span>
                <span class="kw-value">${matchedKw || (origin?.keyword) || 'สเปกตรงสาย'}</span>
              </div>
              <span class="badge type-${displayTypeClass}">${typeLabels[typeKey] || typeKey}</span>
              ${groupKey ? `<span class="badge group-${groupKey}">${groupLabels[groupKey] || groupKey}</span>` : ''}
            </div>
            <div class="card-hero-budget" title="งบประมาณโครงการ">
              ${formatMoney(item.budget)}
            </div>
          </div>

          <!-- Layer 2: Core Info (Project Title, Detection Origin & Meta row) -->
          <div class="card-layer-body">
            <h3 class="card-project-title">
              <a href="detail.html?id=${encodeURIComponent(item.id)}" title="คลิกเพื่อดูรายละเอียด">${item.project_name || 'ไม่มีชื่อโครงการ'}</a>
            </h3>

            ${origin ? `
              <div class="card-origin-box ${origin.isPdf ? 'origin-pdf' : 'origin-title'}">
                <div class="origin-header">
                  <span class="${origin.isPdf ? 'origin-badge-pdf' : 'origin-badge-title'}">
                    ${origin.isPdf ? '📑 มุดสแกนพบในไฟล์ PDF (ปร.4/BOQ)' : '🏷️ ตรวจพบจากชื่อประกาศโครงการ'}
                  </span>
                  <span class="origin-keyword-badge">
                    ตรวจพบ Keyword: <span class="kw-highlight">"${origin.keyword}"</span>
                  </span>
                </div>
                ${origin.snippet ? `
                  <div class="origin-snippet">
                    <strong>🔎 ข้อความที่สกัดได้จากเอกสาร:</strong> ${origin.snippet}
                  </div>
                ` : ''}
              </div>
            ` : ''}
            
            <div class="card-meta-row">
              <span class="card-meta-item">
                <span style="font-size: 1.05rem;">🏢</span>
                <strong style="color: #1e293b;">${dept || '-'}</strong>
              </span>
              ${provBadge}
              ${regBadge}
              ${bidBadge}
            </div>
          </div>

          <!-- Layer 3: Action Buttons (Clear, Clickable, No Guesswork) -->
          <div class="card-layer-actions">
            <button type="button" class="btn-card-action btn-action-copy" onclick="copyText('${projId}', this)" title="คัดลอกเลข e-GP เพื่อนำไปค้นหาใน e-GP">
              📋 คัดลอกเลข e-GP: <strong style="font-family: monospace; margin-left: 2px; color: #003366;">${projId}</strong>
            </button>
            <a href="${egpWebUrl}" target="_blank" rel="noopener noreferrer" class="btn-card-action btn-action-egp" onclick="return window.openEgpWithCopy ? window.openEgpWithCopy('${projId}', event) : true" title="กดคัดลอกเลขแล้วเปิด e-GP เพื่อวางค้นหาเอกสาร">
              🔗 เปิดใน e-GP
            </a>
            <button type="button" class="btn-card-action btn-action-sim" onclick="openBiddingSimulator('${item.id}')" title="คำนวณราคาเคาะและกำไร">
              🧮 เคาะราคา
            </button>
            <a href="detail.html?id=${encodeURIComponent(item.id)}" class="btn-card-action btn-action-detail" title="ดูรายละเอียดโครงการ">
              🔍 รายละเอียด
            </a>
          </div>

          <!-- Layer 4: AI Feedback (3 Clear Buttons + Status Banner) -->
          <div class="card-layer-feedback">
            <div class="feedback-question-row">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 1.15rem;">💡</span>
                <strong style="color: #334155; font-size: 0.92rem;">งานนี้ตรงกับ วีรับเบอร์ ไหม?</strong>
              </div>
              <div class="feedback-buttons-group">
                <button type="button" class="btn-ai-choice btn-ai-yes ${isMatched ? 'active' : ''}" onclick="submitMatchFeedbackQuick('${item.id}', '${projId}', this)" title="กดเพื่อระบุว่าเป็นงานที่เราทำ เพื่อฝึกระบบ AI">
                  ${isMatched ? '✔ คุณเลือก: ใช่งานเรา' : '👍 ใช่ (งานเรา)'}
                </button>
                <button type="button" class="btn-ai-choice btn-ai-maybe ${isMaybe ? 'active' : ''}" onclick="submitMaybeFeedbackQuick('${item.id}', '${projId}', this)" title="กดเพื่อระบุว่าอาจจะใช่ รอพิจารณาสเปกเพิ่มเติม">
                  ${isMaybe ? '✔ คุณเลือก: อาจจะใช่' : '🤔 อาจจะใช่'}
                </button>
                <button type="button" class="btn-ai-choice btn-ai-no ${isRejected ? 'active' : ''}" onclick="submitRejectFeedbackQuick('${item.id}', '${projId}', this)" title="กดเพื่อระบุว่าไม่ใช่งาน (ต้องครบ 5 เสียงจึงจะแบล็คลิสต์ ป้องกันงานหลุด)">
                  ${isRejected ? '✔ คุณเลือก: ไม่ใช่งาน (1/5 เสียง)' : '👎 ไม่ใช่งาน'}
                </button>
              </div>
            </div>

            <!-- Dedicated Status Banner (explicitly displays what was selected) -->
            <div id="feedback-banner-${item.id}">
              ${isMatched ? `
                <div class="card-feedback-status-banner status-yes">
                  <div class="status-banner-content">
                    <span class="status-banner-icon">✔</span>
                    <div>
                      <strong>คุณเลือก: "ใช่งานเรา (ตรงสาย)"</strong>
                      <div class="status-banner-sub">บันทึกส่งเข้าคลังพัฒนา AI สำเร็จ • พร้อมเตรียมยื่นประมูล</div>
                    </div>
                  </div>
                  <button type="button" class="btn-status-banner-undo" onclick="undoFeedbackQuick('${item.id}', '${projId}', this)">↩ ยกเลิก / เปลี่ยนใจ</button>
                </div>
              ` : isMaybe ? `
                <div class="card-feedback-status-banner status-maybe">
                  <div class="status-banner-content">
                    <span class="status-banner-icon">🤔</span>
                    <div>
                      <strong>คุณเลือก: "อาจจะใช่"</strong>
                      <div class="status-banner-sub">เก็บเข้าคลังงานรอตรวจสอบสเปก/BOQ ละเอียดเพิ่มเติม</div>
                    </div>
                  </div>
                  <button type="button" class="btn-status-banner-undo" onclick="undoFeedbackQuick('${item.id}', '${projId}', this)">↩ ยกเลิก / เปลี่ยนใจ</button>
                </div>
              ` : isRejected ? `
                <div class="card-feedback-status-banner status-no">
                  <div class="status-banner-content">
                    <span class="status-banner-icon">👎</span>
                    <div>
                      <strong>คุณเลือก: "ไม่ใช่งาน" (1/5 เสียง)</strong>
                      <div class="status-banner-sub">ยังคงแสดงบนหน้าจอเพื่อความปลอดภัย (ต้องครบ 5 เสียงถึงจะคัดออก)</div>
                    </div>
                  </div>
                  <button type="button" class="btn-status-banner-undo" onclick="undoFeedbackQuick('${item.id}', '${projId}', this)">↩ ยกเลิก / เปลี่ยนใจ</button>
                </div>
              ` : ''}
            </div>
          </div>

        </div>
      `;
    }).join('');

    if (append) {
      const temp = document.createElement('div');
      temp.innerHTML = html;
      while(temp.firstChild) container.appendChild(temp.firstChild);
    } else {
      container.innerHTML = html;
    }

    if (btn) {
      if (rawItems.length >= boqLimit) {
        btn.classList.remove('hidden');
        btn.onclick = () => {
          boqPage++;
          loadBoqAnnouncements(true);
        };
      } else {
        btn.classList.add('hidden');
      }
    }
  } catch (err) {
    if (!append) container.innerHTML = `<div class="error-msg">เกิดข้อผิดพลาด: ${err.message}</div>`;
  }
}

