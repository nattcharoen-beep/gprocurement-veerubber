// frontend/js/v2.js — VEE RUBBER Procurement Tracker V2.0 Controller

let currentV2View = 'overview';
let v2Announcements = [];
let v2ArchivedAnnouncements = null;
let v2BoqAnnouncements = [];
let v2Watchlist = [];
let v2Page = 1;
const v2Limit = 150;

// Fallback label mappings
if (typeof window.typeLabels === 'undefined') {
  window.typeLabels = {
    'D0': 'เชิญชวน',
    'D1': 'เชิญชวน',
    'IM': 'เคาะแล้ว (สัญญา)',
    'B0': 'ร่าง TOR',
    'B1': 'ร่าง TOR',
    'B2': 'ร่าง TOR',
    'B3': 'ร่าง TOR',
    '15': 'ราคากลาง',
    'BOQ': 'ราคากลาง',
    'P0': 'แผนจัดซื้อ',
    'W0': 'ประกาศผู้ชนะ',
    'W1': 'สัญญาแล้ว',
    'W2': 'ยกเลิกผู้ชนะ'
  };
}

if (typeof window.groupLabels === 'undefined') {
  window.groupLabels = {
    'passenger_car_tires': 'ยางรถยนต์ & กระบะ',
    'truck_bus_tires': 'ยางรถบรรทุก & บัส',
    'motorcycle_tires': 'ยางจักรยานยนต์ & สายตรวจ',
    'otr_heavy_machinery': 'ยาง OTR & เครื่องจักร',
    'bicycle_specialty_tires': 'ยางจักรยาน & วีลแชร์',
    'tube_accessories': 'ยางใน & อุปกรณ์'
  };
}

if (typeof window.formatMoney === 'undefined') {
  window.formatMoney = function(amount) {
    if (!amount && amount !== 0) return 'ไม่ระบุ';
    return '฿' + Number(amount).toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };
}

if (typeof window.formatDate === 'undefined') {
  window.formatDate = function(dateStr) {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch { return dateStr; }
  };
}

// Normalize e-GP announce type sub-codes
function getNormalizedType(type) {
  if (!type) return '';
  const t = type.toUpperCase().trim();
  if (['D0', 'D1'].includes(t)) return 'D0';
  if (['IM', 'W0', 'W1', 'W2'].includes(t)) return 'ARCHIVE';
  if (['B0', 'B1', 'B2', 'B3'].includes(t)) return 'B0';
  if (['15', 'BOQ'].includes(t)) return '15';
  if (['P0'].includes(t)) return 'P0';
  return t;
}

// Comprehensive Filter state
let v2SelectedTypes = ['D0', 'B0', '15', 'P0'];
let v2SelectedGroups = ['passenger_car_tires', 'truck_bus_tires', 'motorcycle_tires', 'otr_heavy_machinery', 'bicycle_specialty_tires', 'tube_accessories'];
let v2SearchKeyword = '';
let v2SelectedDays = -1; // -1: all active, 0: today, 7: last 7 days, 30: last 30 days
let v2BudgetMin = '';
let v2BudgetMax = '';
let v2SelectedZone = '';
let v2UrgentOnly = false;
let v2SelectedStatus = 'all'; // all, matched, maybe, unreviewed, rejected
let v2HideRejected = false;
let v2BoqSearchKeyword = '';
let v2BoqSelectedGroup = '';
let v2BoqOnly = false;

// Local feedback store & safe reject votes tally
const v2FeedbackKey = 'veerubber_user_feedback';
const v2RejectTallyKey = 'veerubber_reject_tally';
let v2UserFeedbackMap = {};
let v2RejectTallyMap = {};

try {
  v2UserFeedbackMap = JSON.parse(localStorage.getItem(v2FeedbackKey) || '{}');
  v2RejectTallyMap = JSON.parse(localStorage.getItem(v2RejectTallyKey) || '{}');
} catch (e) {
  v2UserFeedbackMap = {};
  v2RejectTallyMap = {};
}

// ============================================================================
// Master Tire Keywords (VEE RUBBER CORPORATION LTD.)
// ============================================================================
const V2_DEFAULT_KEYWORDS = {
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
    "Street Tires", "Scooter Tires", "Motocross Tires", "Maxi Scooter", "VRM",
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

function getV2Keywords() {
  const ver = localStorage.getItem('veerubber_kw_version');
  if (ver !== '1.0') {
    localStorage.setItem('veerubber_custom_keywords', JSON.stringify(V2_DEFAULT_KEYWORDS));
    localStorage.setItem('veerubber_kw_version', '1.0');
    return JSON.parse(JSON.stringify(V2_DEFAULT_KEYWORDS));
  }
  const saved = localStorage.getItem('veerubber_custom_keywords');
  if (saved) {
    try { return JSON.parse(saved); } catch (e) {}
  }
  return JSON.parse(JSON.stringify(V2_DEFAULT_KEYWORDS));
}

function saveV2Keywords(kws) {
  localStorage.setItem('veerubber_custom_keywords', JSON.stringify(kws));
}

// ============================================================================
// Initialization
// ============================================================================
document.addEventListener('DOMContentLoaded', async () => {
  try { setupUserInfo(); } catch (e) { console.warn('setupUserInfo err:', e); }
  try { renderKeywordTable(); } catch (e) { console.warn('renderKeywordTable err:', e); }
  try { loadSavedProfile(); } catch (e) { console.warn('loadSavedProfile err:', e); }
  
  // Initial load data from Worker backend
  try {
    await loadV2Data();
  } catch (e) {
    console.error('loadV2Data error:', e);
  }
  
  // If competitor intel script loaded, trigger its stats
  if (typeof loadWinnerStats === 'function') {
    try { loadWinnerStats(); } catch (e) {}
  }
});

async function setupUserInfo() {
  try {
    if (typeof api !== 'undefined' && api.getMe) {
      const res = await api.getMe();
      const user = res?.data || res;
      if (user) {
        const userNameEl = document.getElementById('v2-user-name');
        const userRoleEl = document.getElementById('v2-user-role');
        const userAvatarEl = document.getElementById('v2-user-avatar');
        
        if (userNameEl) userNameEl.textContent = user.name || user.email || 'วีรับเบอร์ แอดมิน';
        if (userRoleEl) userRoleEl.textContent = user.role === 'admin' ? 'ผู้ดูแลระบบ (Admin)' : 'ทีมงานวีรับเบอร์';
        if (userAvatarEl) {
          const initial = (user.name || user.email || 'B').trim().charAt(0).toUpperCase();
          userAvatarEl.textContent = initial;
        }

        // Show Admin navigation if user is admin
        if (user.role === 'admin') {
          const adminNav = document.getElementById('v2-admin-nav-item');
          if (adminNav) {
            adminNav.style.display = 'flex';
            adminNav.classList.remove('hidden');
          }
          const adminBtn = document.getElementById('v2-user-admin-btn');
          if (adminBtn) {
            adminBtn.style.display = 'inline-flex';
          }

          // Check pending users count to alert admin
          try {
            const adminUsersRes = await api.getAdminUsers();
            const users = adminUsersRes?.data || [];
            const pendingCount = users.filter(u => u.status === 'pending').length;
            const badge = document.getElementById('v2-pending-user-badge');
            if (badge) {
              if (pendingCount > 0) {
                badge.textContent = pendingCount;
                badge.style.display = 'inline-flex';
                badge.title = `มีผู้ใช้รออนุมัติ ${pendingCount} ท่าน`;
              } else {
                badge.style.display = 'none';
              }
            }
          } catch (adminErr) {
            console.warn('Could not check pending users count in v2:', adminErr);
          }
        }
      }
    }
  } catch (err) {
    console.warn('Could not fetch user profile in v2:', err);
  }
}

// ============================================================================
// Navigation & View Router
// ============================================================================
window.switchV2View = function(viewName) {
  currentV2View = viewName;
  
  // 1. Update active sidebar item
  document.querySelectorAll('.v2-nav-item').forEach(item => {
    if (item.dataset.view === viewName) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // 2. Hide all view sections, show target section
  document.querySelectorAll('.v2-view-section').forEach(sec => {
    sec.classList.remove('active');
  });
  
  const targetSection = document.getElementById(`view-${viewName}`);
  if (targetSection) {
    targetSection.classList.add('active');
  }

  // 3. Update top title and subtitle
  const titleEl = document.getElementById('v2-view-title');
  const descEl = document.getElementById('v2-view-desc');
  
  const viewMeta = {
    overview: { title: 'ภาพรวมระบบ', desc: 'ศูนย์บัญชาการจัดซื้อจัดจ้างภาครัฐ สรุปโอกาสงานและมูลค่าที่เฝ้าติดตาม' },
    opportunities: { title: 'โอกาสงานค้นพบใหม่', desc: 'รายการประกาศเชิญชวน, ร่าง TOR, และราคากลางที่ตรงกับคีย์เวิร์ด' },
    boq: { title: 'สแกนพบในไฟล์ BOQ', desc: 'โครงการที่มุดสแกนพบรายการสเปกยางของวีรับเบอร์ในไฟล์ PDF / ปร.4' },
    watchlist: { title: 'งานที่ติดตาม', desc: 'โครงการที่คุณปักหมุด หรือกดระบุว่าเป็น "งานเรา" เตรียมเข้ายื่นซอง' },
    archive: { title: 'คลังเคาะแล้ว (Archive)', desc: 'รวบรวมประวัติโครงการที่ผ่านการยื่นซอง สรุปผลเสนอราคา หรือจัดทำสัญญาแล้วทั้งหมด' },
    competitor: { title: 'ข่าวกรองคู่แข่ง', desc: 'วิเคราะห์บริษัทที่ชนะประมูลบ่อยที่สุด และส่วนลดราคากลางเฉลี่ย' },
    keywords: { title: 'จัดการคีย์เวิร์ด', desc: 'เฝ้าระวัง 113 คำหลักใน e-GP และเพิ่มคีย์เวิร์ดเฉพาะของวีรับเบอร์' },
    profile: { title: 'โปรไฟล์วีรับเบอร์', desc: 'หนังสือรับรองดิจิทัล ทุนจดทะเบียน และเกณฑ์คุณสมบัติความพร้อมยื่นงานรัฐ' }
  };

  if (viewMeta[viewName]) {
    if (titleEl) titleEl.textContent = viewMeta[viewName].title;
    if (descEl) descEl.textContent = viewMeta[viewName].desc;
  }

  // 4. Close mobile sidebar if open
  const sidebar = document.getElementById('v2-sidebar');
  const backdrop = document.getElementById('v2-backdrop');
  if (sidebar) sidebar.classList.remove('open');
  if (backdrop) backdrop.classList.remove('active');

  // Trigger special view updates
  if (viewName === 'watchlist') {
    renderWatchlistView();
  } else if (viewName === 'boq') {
    renderBoqView();
  } else if (viewName === 'archive') {
    loadAndRenderArchiveView();
  } else if (viewName === 'opportunities') {
    renderOpportunitiesList(v2Announcements);
  } else if (viewName === 'competitor') {
    if (typeof loadWinnerStats === 'function') {
      try { loadWinnerStats(); } catch (e) {}
    }
    if (typeof loadWinners === 'function') {
      try { loadWinners(); } catch (e) {}
    }
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.toggleMobileSidebar = function() {
  const sidebar = document.getElementById('v2-sidebar');
  const backdrop = document.getElementById('v2-backdrop');
  if (sidebar) sidebar.classList.toggle('open');
  if (backdrop) backdrop.classList.toggle('active');
};

// ============================================================================
// ============================================================================
// Genuine Tire Procurement Validator (Zero Non-Tire Noise)
// ============================================================================
function isGenuineTireItem(it) {
  if (!it) return false;
  const title = (it.project_name || it.title || '').toLowerCase();
  if (!title) return false;

  // 1. Exclude non-tire civil works, vegetation, asphalt
  if (/ตัดแต่งกิ่งไม้|ตัดกิ่ง|ตัดแต่ง|ตัดหญ้า|วัชพืช|ต้นไม้|จัดสวน|ทำไม้หวงห้าม|ซ่อมแซมถนน|ก่อสร้างถนน|ปรับปรุงถนน|บำรุงถนน|ผิวจราจร|หินคลุก|ลูกรัง|ลาดยาง|กากยาง|ยางมะตอย|แอสฟัลต์|แอสฟัลท์|asphalt|สเลอรี่ซีล|css-1|ac 60|ทางหลวง|สะพาน|บ่อพัก|คอนกรีต|คูร่องยาง/.test(title)) {
    return false;
  }

  // 2. Exclude stationery, office supplies, domestic rubber, cleaning, general municipal goods
  if (/น้ำยางพารา|ยางพาราแผ่น|ขี้ยาง|กล้ายางพารา|ต้นยางพารา|กรีดยาง|สวนยางพารา|ยางลบ|ตรายาง|หมึกตรายาง|ยางรัดของ|ยางรัด|ยางวง|ถุงมือยาง|ถุงยางอนามัย|แผ่นยางปูพื้น|กระเบื้องยาง|ยางกันชนเสา|ขอบยางกระจก|ขอบยางประตู|ซีลยาง|ปะเก็นยาง|สายยางฉีดน้ำ|สายยางรดน้ำ|ปะยาง|ค่าปะยาง|จ้างปะยาง|วัสดุสำนักงาน|หมึกเครื่องถ่าย|เครื่องสูบน้ำ|คลอรีน|อาหารเสริม|คอมพิวเตอร์|บังเกอร์|หลุมหลบภัย|แผงกั้นจราจร|กรวยยาง|ขายางกันลื่น|เก้าอี้พลาสติก|โต๊ะทำงาน|ถังดับเพลิง|ถับดับเพลิง|จัดเก็บ ขน และกำจัดขยะ|ดูแลสนามฟุตบอล|ซ่อมแซมประตูในอาคาร|ป้ายอบรม|เปลี่ยนถ่ายน้ำมันเครื่อง|โช๊คแก๊ส|เซ็นเซอร์เตือนแรงดันลมยาง/.test(title)) {
    return false;
  }

  // 3. Exclude whole vehicle purchases (buying the truck/backhoe/car instead of tires)
  const wholeVehicleRegex = /^(?:ประกวดราคา)?(?:ซื้อ|จัดซื้อ|เช่า)\s*รถ(?:ยนต์)?(?:บรรทุก|ตัก|บด|ขุด|เกลี่ย|แทรกเตอร์|ยก|ฟอร์คลิฟท์|ดับเพลิง|ขยะ|พยาบาล|กู้ชีพ|กู้ภัย|กระเช้า|ดูด|สุขาภิบาล|ส่วนกลาง|ประจำตำแหน่ง|ตู้|กระบะ|ปิกอัพ|โดยสาร|บัส|มินิบัส)/;
  if (wholeVehicleRegex.test(title)) {
    if (!/(?:ซื้อ|จัดซื้อ|เปลี่ยน)\s*ยาง/.test(title) && !/ยางรถ/.test(title) && !/ยางนอก/.test(title) && !/ยางล้อ/.test(title)) {
      return false;
    }
  }

  // 4. Must match genuine vehicle tire keywords:
  const genuineTireRegex = /ยางรถ|ยางนอก|ยางล้อ|ยางเรเดียล|ยาง radial|ยาง tbr|ยาง otr|ยางตัน|ยางผ้าใบ|ซื้อยาง|จัดซื้อยาง|เปลี่ยนยาง|จ้างเปลี่ยนยาง|สลับยาง|ประเภทยางรถ|วัสดุยานพาหนะ.*ยาง|ยางใหม่.*สำหรับรถ|ยางพร้อมติดตั้ง|ยางใน\s*(?:รถ|บิวทิล|สำหรับ|จำนวน)|\b\d{3}\/\d{2}[rR]\d{2}\b|\b\d{1,2}\.\d{2}[rR]\d{2}\b|\b\d{1,2}\.\d{2}-\d{2}\b/;
  return genuineTireRegex.test(title);
}

// ============================================================================
// Detection Origin & Extraction Helper
// ============================================================================
function getMatchOriginInfo(item) {
  if (!item) return null;
  const isPdf = !!(item.boq_summary || item.doc_verified);
  let keyword = '';
  let snippet = '';

  if (item.boq_matches) {
    try {
      const matches = typeof item.boq_matches === 'string' ? JSON.parse(item.boq_matches) : item.boq_matches;
      if (Array.isArray(matches) && matches.length > 0) {
        if (matches[0].keyword) keyword = matches[0].keyword;
        if (matches[0].snippet) snippet = matches[0].snippet;
      }
    } catch (e) {}
  }

  if (!keyword && item.boq_summary) {
    const m = item.boq_summary.match(/พบสเปก\s*["“]([^"”]+)["”]/i);
    if (m && m[1]) keyword = m[1];
    const snipMatch = item.boq_summary.match(/\("([^"]+)"\)/);
    if (snipMatch && snipMatch[1] && !snippet) snippet = snipMatch[1];
  }

  if (!keyword && item.matched_keywords) {
    keyword = item.matched_keywords;
  }

  if (!keyword && item.project_name) {
    const t = item.project_name.toLowerCase();
    const allKws = Object.values(getV2Keywords()).flat();
    for (const kw of allKws) {
      if (t.includes(kw.toLowerCase())) {
        keyword = kw;
        break;
      }
    }
  }

  if (!keyword) {
    if (item.product_group && window.groupLabels && window.groupLabels[item.product_group]) {
      keyword = window.groupLabels[item.product_group];
    } else if (item.product_group && typeof groupLabels !== 'undefined' && groupLabels[item.product_group]) {
      keyword = groupLabels[item.product_group];
    } else {
      keyword = '';
    }
  }

  if (!keyword && !snippet) return null;
  return { isPdf, keyword, snippet };
}

// ============================================================================
// Data Fetching & KPIs (Identical to V1 Backend Queries)
// ============================================================================
async function loadV2Data() {
  try {
    // Parallel fetch announcements, stats, and user feedback from backend (D1 DB)
    const [annResult, statsResult, feedbackResult] = await Promise.allSettled([
      api.getAnnouncements({ limit: 150 }),
      api.getStats(),
      (typeof api !== 'undefined' && api.getMyFeedback) ? api.getMyFeedback() : Promise.resolve(null)
    ]);

    // 1. Sync User Feedback from Backend (Ratings done in V1 or V2)
    if (feedbackResult.status === 'fulfilled' && feedbackResult.value?.data) {
      const backendFeedback = feedbackResult.value.data;
      v2UserFeedbackMap = { ...v2UserFeedbackMap, ...backendFeedback };
      try {
        localStorage.setItem(v2FeedbackKey, JSON.stringify(v2UserFeedbackMap));
      } catch (e) {}
    }

    if (annResult.status === 'fulfilled' && annResult.value?.data) {
      v2Announcements = (annResult.value.data || []).filter(it => isGenuineTireItem(it));
      // Populate projectDataStore for simulator and detail lookup
      window.projectDataStore = window.projectDataStore || new Map();
      v2Announcements.forEach(it => {
        window.projectDataStore.set(it.id, it);
        if (it.project_id) window.projectDataStore.set(it.project_id, it);
      });
    } else {
      console.warn('Announcements fetch fallback:', annResult);
    }

    let statsData = null;
    if (statsResult.status === 'fulfilled' && statsResult.value?.data) {
      statsData = statsResult.value.data;
    }

    // Extract BOQ matches
    v2BoqAnnouncements = v2Announcements.filter(it => !!(it.boq_summary || it.doc_verified));
    
    // Update Badge counts
    const oppBadge = document.getElementById('v2-badge-opp-count');
    const boqBadge = document.getElementById('v2-badge-boq-count');
    const archiveBadge = document.getElementById('v2-badge-archive-count');
    if (oppBadge) oppBadge.textContent = v2Announcements.length;
    if (boqBadge) {
      const bCount = statsData?.boqVerifiedCount || v2BoqAnnouncements.length;
      boqBadge.textContent = bCount;
    }
    if (archiveBadge) {
      archiveBadge.textContent = statsData?.archiveCount || (v2ArchivedAnnouncements ? v2ArchivedAnnouncements.length : 395);
    }

    // Calculate Executive KPIs
    calculateExecutiveKPIs(v2Announcements, v2BoqAnnouncements, statsData);
    updateV2ZoneCounters(v2Announcements, statsData);
    updateV2FeedbackCount();
    
    // Render Views
    renderOverviewTopFit(v2Announcements);
    renderOpportunitiesList(v2Announcements);
    renderBoqView();
  } catch (err) {
    console.error('Error loading V2 announcements:', err);
    const container = document.getElementById('v2-overview-top-fit-list');
    if (container) {
      container.innerHTML = `<div class="text-center" style="padding: 30px; color: #dc2626;">เกิดข้อผิดพลาดในการโหลดข้อมูล: ${err.message || err}</div>`;
    }
  }
}

// ============================================================================
// Province & Geo Helpers
// ============================================================================
// ============================================================================
// Province & Geo Intelligence Resolver (Accurate Thai Province & District Engine)
// ============================================================================
const V2_SPECIAL_OVERRIDES = [
  { match: 'วิทยาเขตสุราษฎร์ธานี', prov: 'สุราษฎร์ธานี' },
  { match: 'วิทยาเขตจันทบุรี', prov: 'จันทบุรี' },
  { match: 'วิทยาเขตขอนแก่น', prov: 'ขอนแก่น' },
  { match: 'วิทยาเขตเชียงใหม่', prov: 'เชียงใหม่' },
  { match: 'ศูนย์รังสิต', prov: 'ปทุมธานี' },
  { match: 'ศาลายา', prov: 'นครปฐม' },
  { match: 'กำแพงแสน', prov: 'นครปฐม' },
  { match: 'ศรีราชา', prov: 'ชลบุรี' },
  { match: 'องครักษ์', prov: 'นครนายก' },
  { match: 'บางเขน', prov: 'กรุงเทพมหานคร' },
  { match: 'ประสานมิตร', prov: 'กรุงเทพมหานคร' },
  { match: 'ท่าพระจันทร์', prov: 'กรุงเทพมหานคร' },
  { match: 'ศาลเยาวชนและครอบครัวจังหวัดสระแก้ว', prov: 'สระแก้ว' },
  { match: 'โรงพยาบาลสมเด็จพระยุพราชสระแก้ว', prov: 'สระแก้ว' },
  { match: 'ศูนย์โรคผิวหนังเขตร้อนภาคใต้ จ.ตรัง', prov: 'ตรัง' }
];

const V2_DISTRICT_MAP = {
  // กรุงเทพมหานคร (50 เขต + แลนด์มาร์ก + สถาบัน)
  'พระนคร': 'กรุงเทพมหานคร', 'ดุสิต': 'กรุงเทพมหานคร', 'หนองจอก': 'กรุงเทพมหานคร', 'บางรัก': 'กรุงเทพมหานคร',
  'บางเขน': 'กรุงเทพมหานคร', 'บางกะปิ': 'กรุงเทพมหานคร', 'ปทุมวัน': 'กรุงเทพมหานคร', 'ป้อมปราบ': 'กรุงเทพมหานคร',
  'พระโขนง': 'กรุงเทพมหานคร', 'มีนบุรี': 'กรุงเทพมหานคร', 'ลาดกระบัง': 'กรุงเทพมหานคร', 'ยานนาวา': 'กรุงเทพมหานคร',
  'สัมพันธวงศ์': 'กรุงเทพมหานคร', 'พญาไท': 'กรุงเทพมหานคร', 'ธนบุรี': 'กรุงเทพมหานคร', 'บางกอกใหญ่': 'กรุงเทพมหานคร',
  'ห้วยขวาง': 'กรุงเทพมหานคร', 'คลองสาน': 'กรุงเทพมหานคร', 'ตลิ่งชัน': 'กรุงเทพมหานคร', 'บางกอกน้อย': 'กรุงเทพมหานคร',
  'บางขุนเทียน': 'กรุงเทพมหานคร', 'ภาษีเจริญ': 'กรุงเทพมหานคร', 'หนองแขม': 'กรุงเทพมหานคร', 'ราษฎร์บูรณะ': 'กรุงเทพมหานคร',
  'บางพลัด': 'กรุงเทพมหานคร', 'ดินแดง': 'กรุงเทพมหานคร', 'บึงกุ่ม': 'กรุงเทพมหานคร', 'สาทร': 'กรุงเทพมหานคร',
  'บางซื่อ': 'กรุงเทพมหานคร', 'จตุจักร': 'กรุงเทพมหานคร', 'บางคอแหลม': 'กรุงเทพมหานคร', 'ประเวศ': 'กรุงเทพมหานคร',
  'คลองเตย': 'กรุงเทพมหานคร', 'สวนหลวง': 'กรุงเทพมหานคร', 'จอมทอง': 'กรุงเทพมหานคร', 'ดอนเมือง': 'กรุงเทพมหานคร',
  'ราชเทวี': 'กรุงเทพมหานคร', 'ลาดพร้าว': 'กรุงเทพมหานคร', 'วัฒนา': 'กรุงเทพมหานคร', 'บางแค': 'กรุงเทพมหานคร',
  'หลักสี่': 'กรุงเทพมหานคร', 'สายไหม': 'กรุงเทพมหานคร', 'คันนายาว': 'กรุงเทพมหานคร', 'สะพานสูง': 'กรุงเทพมหานคร',
  'วังทองหลาง': 'กรุงเทพมหานคร', 'คลองสามวา': 'กรุงเทพมหานคร', 'บางนา': 'กรุงเทพมหานคร', 'ทวีวัฒนา': 'กรุงเทพมหานคร',
  'ทุ่งครุ': 'กรุงเทพมหานคร', 'บางบอน': 'กรุงเทพมหานคร',
  // หน่วยงาน กทม. & มหาวิทยาลัยใน กทม.
  'นวมินทราธิราช': 'กรุงเทพมหานคร', 'วชิรพยาบาล': 'กรุงเทพมหานคร', 'เกื้อการุณย์': 'กรุงเทพมหานคร',
  'พัชรกิติยาภา': 'กรุงเทพมหานคร', 'จุฬาลงกรณ์': 'กรุงเทพมหานคร', 'รามคำแหง': 'กรุงเทพมหานคร',
  'ช่างฝีมือทหาร': 'กรุงเทพมหานคร', 'การกีฬาแห่งประเทศไทย': 'กรุงเทพมหานคร', 'การประปานครหลวง': 'กรุงเทพมหานคร',
  'การไฟฟ้านครหลวง': 'กรุงเทพมหานคร', 'การทางพิเศษ': 'กรุงเทพมหานคร', 'เกษตรศาสตร์': 'กรุงเทพมหานคร',
  'นิด้า': 'กรุงเทพมหานคร', 'สวนดุสิต': 'กรุงเทพมหานคร', 'สวนสุนันทา': 'กรุงเทพมหานคร',
  'จันทรเกษม': 'กรุงเทพมหานคร', 'บ้านสมเด็จ': 'กรุงเทพมหานคร', 'ไทย-ญี่ปุ่น': 'กรุงเทพมหานคร',
  'ทุ่งมหาเมฆ': 'กรุงเทพมหานคร', 'พระจอมเกล้า': 'กรุงเทพมหานคร', 'ศรีนครินทรวิโรฒ': 'กรุงเทพมหานคร',
  
  // นนทบุรี
  'ปากเกร็ด': 'นนทบุรี', 'บางบัวทอง': 'นนทบุรี', 'บางใหญ่': 'นนทบุรี', 'บางกรวย': 'นนทบุรี', 'ไทรน้อย': 'นนทบุรี',
  'สาธารณสุข': 'นนทบุรี', 'พาณิชย์': 'นนทบุรี', 'ราชทัณฑ์': 'นนทบุรี',

  // ปทุมธานี
  'รังสิต': 'ปทุมธานี', 'ลำลูกกา': 'ปทุมธานี', 'ธัญบุรี': 'ปทุมธานี', 'คลองหลวง': 'ปทุมธานี',
  'ลาดหลุมแก้ว': 'ปทุมธานี', 'สามโคก': 'ปทุมธานี', 'ธรรมศาสตร์': 'ปทุมธานี',

  // สมุทรปราการ
  'บางพลี': 'สมุทรปราการ', 'บางบ่อ': 'สมุทรปราการ', 'พระประแดง': 'สมุทรปราการ', 'พระสมุทรเจดีย์': 'สมุทรปราการ',
  'บางเสาธง': 'สมุทรปราการ', 'แพรกษา': 'สมุทรปราการ', 'ด่านสำโรง': 'สมุทรปราการ', 'สำโรง': 'สมุทรปราการ', 'บางโฉลง': 'สมุทรปราการ',
  'บางแก้ว': 'สมุทรปราการ', 'บางปู': 'สมุทรปราการ', 'สำโรงเหนือ': 'สมุทรปราการ',

  // สมุทรสาคร
  'กระทุ่มแบน': 'สมุทรสาคร', 'บ้านแพ้ว': 'สมุทรสาคร', 'มหาชัย': 'สมุทรสาคร', 'ท่าฉลอม': 'สมุทรสาคร',

  // นครปฐม
  'มหิดล': 'นครปฐม', 'ศาลายา': 'นครปฐม', 'สามพราน': 'นครปฐม', 'นครชัยศรี': 'นครปฐม', 'บางเลน': 'นครปฐม',
  'กำแพงแสน': 'นครปฐม', 'ดอนตูม': 'นครปฐม', 'ศิลปากร': 'นครปฐม',

  // ชลบุรี
  'ศรีราชา': 'ชลบุรี', 'บางละมุง': 'ชลบุรี', 'พัทยา': 'ชลบุรี', 'สัตหีบ': 'ชลบุรี', 'บ้านบึง': 'ชลบุรี',
  'พานทอง': 'ชลบุรี', 'พนัสนิคม': 'ชลบุรี', 'บ่อทอง': 'ชลบุรี', 'หนองใหญ่': 'ชลบุรี', 'เกาะจันทร์': 'ชลบุรี', 'บูรพา': 'ชลบุรี',

  // ระยอง
  'บ้านฉาง': 'ระยอง', 'เมืองแกลง': 'ระยอง', 'แกลง': 'ระยอง', 'มาบตาพุด': 'ระยอง', 'ปลวกแดง': 'ระยอง',
  'บ้านค่าย': 'ระยอง', 'นิคมพัฒนา': 'ระยอง', 'วังจันทร์': 'ระยอง', 'เขาชะเมา': 'ระยอง',

  // ฉะเชิงเทรา
  'แปลงยาว': 'ฉะเชิงเทรา', 'บางปะกง': 'ฉะเชิงเทรา', 'พนมสารคาม': 'ฉะเชิงเทรา', 'หัวสำโรง': 'ฉะเชิงเทรา',
  'บางน้ำเปรี้ยว': 'ฉะเชิงเทรา', 'บ้านโพธิ์': 'ฉะเชิงเทรา', 'สนามชัยเขต': 'ฉะเชิงเทรา', 'ท่าตะเกียบ': 'ฉะเชิงเทรา',

  // จันทบุรี
  'ขลุง': 'จันทบุรี', 'ท่าใหม่': 'จันทบุรี', 'โป่งน้ำร้อน': 'จันทบุรี', 'มะขาม': 'จันทบุรี',
  'แหลมสิงห์': 'จันทบุรี', 'สอยดาว': 'จันทบุรี', 'แก่งหางแมว': 'จันทบุรี', 'เขาคิชฌกูฏ': 'จันทบุรี', 'นายายอาม': 'จันทบุรี',

  // เชียงใหม่
  'แม่ริม': 'เชียงใหม่', 'แม่โจ้': 'เชียงใหม่', 'สันทราย': 'เชียงใหม่', 'หางดง': 'เชียงใหม่', 'สารภี': 'เชียงใหม่',
  'สันกำแพง': 'เชียงใหม่', 'จอมทอง': 'เชียงใหม่', 'ฝาง': 'เชียงใหม่', 'ดอยสะเก็ด': 'เชียงใหม่',
  'สันผักหวาน': 'เชียงใหม่', 'สันป่าตอง': 'เชียงใหม่', 'เชียงดาว': 'เชียงใหม่', 'แม่แตง': 'เชียงใหม่',
  'ฮอด': 'เชียงใหม่', 'ดอยเต่า': 'เชียงใหม่', 'อมก๋อย': 'เชียงใหม่', 'สะเมิง': 'เชียงใหม่', 'แม่แจ่ม': 'เชียงใหม่', 'พร้าว': 'เชียงใหม่',

  // เชียงราย
  'แม่สาย': 'เชียงราย', 'เชียงของ': 'เชียงราย', 'เวียงป่าเป้า': 'เชียงราย', 'แม่ฟ้าหลวง': 'เชียงราย',
  'บ้านดู่': 'เชียงราย', 'แม่สลอง': 'เชียงราย', 'แม่สลองนอก': 'เชียงราย', 'เทิง': 'เชียงราย',
  'พาน': 'เชียงราย', 'แม่จัน': 'เชียงราย', 'เชียงแสน': 'เชียงราย', 'แม่สรวย': 'เชียงราย', 'เวียงชัย': 'เชียงราย', 'ป่าแดด': 'เชียงราย',

  // พิษณุโลก
  'นเรศวร': 'พิษณุโลก', 'วังทอง': 'พิษณุโลก', 'บางระกำ': 'พิษณุโลก',

  // ขอนแก่น
  'ชุมแพ': 'ขอนแก่น', 'บ้านไผ่': 'ขอนแก่น', 'น้ำพอง': 'ขอนแก่น', 'เมืองพล': 'ขอนแก่น', 'กระนวน': 'ขอนแก่น', 'บ้านเป็ด': 'ขอนแก่น', 'ศิลา': 'ขอนแก่น',

  // นครราชสีมา
  'ปากช่อง': 'นครราชสีมา', 'เขาใหญ่': 'นครราชสีมา', 'สีคิ้ว': 'นครราชสีมา', 'โชคชัย': 'นครราชสีมา',
  'พิมาย': 'นครราชสีมา', 'ปักธงชัย': 'นครราชสีมา', 'บัวใหญ่': 'นครราชสีมา', 'สุรนารี': 'นครราชสีมา',

  // ลพบุรี
  'หนองม่วง': 'ลพบุรี', 'ยางโทน': 'ลพบุรี', 'โคกสำโรง': 'ลพบุรี', 'ชัยบาดาล': 'ลพบุรี',
  'ท่าวุ้ง': 'ลพบุรี', 'ท่าหลวง': 'ลพบุรี', 'บ้านหมี่': 'ลพบุรี', 'พัฒนานิคม': 'ลพบุรี',
  'ลำสนธิ': 'ลพบุรี', 'สระโบสถ์': 'ลพบุรี', 'โคกเจริญ': 'ลพบุรี',

  // อุดรธานี
  'ไชยวาน': 'อุดรธานี', 'กุมภวาปี': 'อุดรธานี', 'บ้านดุง': 'อุดรธานี', 'หนองหาน': 'อุดรธานี',
  'บ้านผือ': 'อุดรธานี', 'น้ำโสม': 'อุดรธานี', 'กุดจับ': 'อุดรธานี', 'โนนสะอาด': 'อุดรธานี', 'เพ็ญ': 'อุดรธานี',

  // อ่างทอง
  'โพธิ์ม่วงพันธ์': 'อ่างทอง', 'สามโก้': 'อ่างทอง', 'วิเศษชัยชาญ': 'อ่างทอง', 'ป่าโมก': 'อ่างทอง',
  'โพธิ์ทอง': 'อ่างทอง', 'แสวงหา': 'อ่างทอง', 'ไชโย': 'อ่างทอง',

  // สุรินทร์
  'ตาตุม': 'สุรินทร์', 'กังแอน': 'สุรินทร์', 'ปราสาท': 'สุรินทร์', 'สังขะ': 'สุรินทร์',
  'ศีขรภูมิ': 'สุรินทร์', 'ท่าตูม': 'สุรินทร์', 'ชุมพลบุรี': 'สุรินทร์', 'รัตนบุรี': 'สุรินทร์', 'กาบเชิง': 'สุรินทร์', 'บัวเชด': 'สุรินทร์',

  // ระนอง
  'ลำเลียง': 'ระนอง', 'กระบุรี': 'ระนอง', 'กะเปอร์': 'ระนอง', 'ละอุ่น': 'ระนอง', 'สุขสำราญ': 'ระนอง',

  // สตูล
  'เจ๊ะบิลัง': 'สตูล', 'ละงู': 'สตูล', 'ควนโดน': 'สตูล', 'ควนกาหลง': 'สตูล', 'ทุ่งหว้า': 'สตูล', 'ท่าแพ': 'สตูล',

  // ปัตตานี
  'ปิตูมุดี': 'ปัตตานี', 'ยะรัง': 'ปัตตานี', 'สายบุรี': 'ปัตตานี', 'โคกโพธิ์': 'ปัตตานี', 'หนองจิก': 'ปัตตานี', 'ยะหริ่ง': 'ปัตตานี',

  // ศรีสะเกษ
  'บึงมะลู': 'ศรีสะเกษ', 'กันทรลักษ์': 'ศรีสะเกษ', 'กันทรารมย์': 'ศรีสะเกษ', 'ขุขันธ์': 'ศรีสะเกษ', 'ราษีไศล': 'ศรีสะเกษ', 'อุทุมพรพิสัย': 'ศรีสะเกษ', 'ขุนหาญ': 'ศรีสะเกษ',

  // อุบลราชธานี
  'วารินชำราบ': 'อุบลราชธานี', 'เดชอุดม': 'อุบลราชธานี', 'พิบูลมังสาหาร': 'อุบลราชธานี',

  // สุราษฎร์ธานี
  'เกาะสมุย': 'สุราษฎร์ธานี', 'เกาะพะงัน': 'สุราษฎร์ธานี', 'สมุย': 'สุราษฎร์ธานี', 'พุนพิน': 'สุราษฎร์ธานี',
  'ท่าข้าม': 'สุราษฎร์ธานี', 'กาญจนดิษฐ์': 'สุราษฎร์ธานี', 'ดอนสัก': 'สุราษฎร์ธานี', 'ไชยา': 'สุราษฎร์ธานี', 'เวียงสระ': 'สุราษฎร์ธานี', 'นาสาร': 'สุราษฎร์ธานี', 'เคียนซา': 'สุราษฎร์ธานี',

  // ภูเก็ต
  'ถลาง': 'ภูเก็ต', 'กะทู้': 'ภูเก็ต', 'ป่าตอง': 'ภูเก็ต', 'ฉลอง': 'ภูเก็ต',
  'เชิงทะเล': 'ภูเก็ต', 'กะรน': 'ภูเก็ต', 'ราไวย์': 'ภูเก็ต', 'วิชิต': 'ภูเก็ต', 'รัษฎา': 'ภูเก็ต',

  // ชลบุรี
  'บ่อกวางทอง': 'ชลบุรี', 'โป่ง': 'ชลบุรี', 'มาบประชัน': 'ชลบุรี', 'หนองปรือ': 'ชลบุรี', 'ห้วยใหญ่': 'ชลบุรี',
  'นาจอมเทียน': 'ชลบุรี', 'แหลมฉบัง': 'ชลบุรี', 'บางแสน': 'ชลบุรี', 'ดอนหัวฬ่อ': 'ชลบุรี',

  // สงขลา
  'หาดใหญ่': 'สงขลา', 'สะเดา': 'สงขลา', 'นาทวี': 'สงขลา', 'จะนะ': 'สงขลา', 'สงขลานครินทร์': 'สงขลา', 'ทักษิณ': 'สงขลา',

  // นครศรีธรรมราช
  'ทุ่งสง': 'นครศรีธรรมราช', 'ท่าศาลา': 'นครศรีธรรมราช', 'ปากพนัง': 'นครศรีธรรมราช', 'สิชล': 'นครศรีธรรมราช', 'ขนอม': 'นครศรีธรรมราช', 'วลัยลักษณ์': 'นครศรีธรรมราช',

  // ประจวบคีรีขันธ์
  'หัวหิน': 'ประจวบคีรีขันธ์', 'ปราณบุรี': 'ประจวบคีรีขันธ์', 'กุยบุรี': 'ประจวบคีรีขันธ์', 'บางสะพาน': 'ประจวบคีรีขันธ์',

  // เพชรบุรี
  'ชะอำ': 'เพชรบุรี', 'ท่ายาง': 'เพชรบุรี', 'บ้านลาด': 'เพชรบุรี', 'เขาย้อย': 'เพชรบุรี',

  // พระนครศรีอยุธยา
  'วังน้อย': 'พระนครศรีอยุธยา', 'เสนา': 'พระนครศรีอยุธยา', 'บางปะอิน': 'พระนครศรีอยุธยา', 'บางไทร': 'พระนครศรีอยุธยา',

  // สระบุรี
  'แก่งคอย': 'สระบุรี', 'หนองแค': 'สระบุรี', 'มวกเหล็ก': 'สระบุรี', 'วิหารแดง': 'สระบุรี', 'พระพุทธบาท': 'สระบุรี',

  // กรุงเทพมหานครเพิ่มเติม
  'ป่าในกรุง': 'กรุงเทพมหานคร', 'เพชรรัตน์': 'กรุงเทพมหานคร', 'มหาวชิราวุธ': 'กรุงเทพมหานคร'
};

function extractProvince(item) {
  if (!item) return '';

  // 1. Direct province field from DB
  let p = (item.province || '').trim();
  if (p && p !== 'ไม่ระบุ' && p !== 'null' && p !== '-') {
    const clean = p.replace(/^จ(ังหวัด|\.)\s*/, '').trim();
    if (window.PROVINCE_TO_REGION && window.PROVINCE_TO_REGION[clean]) {
      return clean;
    }
  }

  const dept = (item.department || '').trim();
  const title = (item.project_name || item.title || '').trim();
  const combined = `${dept} ${title}`;

  // 2. Special Overrides
  for (const o of V2_SPECIAL_OVERRIDES) {
    if (combined.includes(o.match)) return o.prov;
  }

  // 3. Direct Regex: "จังหวัด[ชื่อจังหวัด]" or "จ.[ชื่อจังหวัด]"
  const m1 = combined.match(/จังหวัด([ก-๙]+)/);
  if (m1 && m1[1]) {
    const cleanM = m1[1].replace(/นคราชสีมา/, 'นครราชสีมา');
    if (window.PROVINCE_TO_REGION && window.PROVINCE_TO_REGION[cleanM]) return cleanM;
  }
  const m2 = combined.match(/จ\.([ก-๙]+)/);
  if (m2 && m2[1]) {
    const cleanM2 = m2[1].replace(/นคราชสีมา/, 'นครราชสีมา');
    if (window.PROVINCE_TO_REGION && window.PROVINCE_TO_REGION[cleanM2]) return cleanM2;
  }

  // 4. District / Landmark / University Mapping
  for (const [key, prov] of Object.entries(V2_DISTRICT_MAP)) {
    if (dept.includes(key) || title.includes(key)) {
      return prov;
    }
  }

  // 4.5 School heuristic (e.g. โรงเรียนหนองม่วงวิทยา -> หนองม่วง -> ลพบุรี, โรงเรียนไชยวานวิทยา -> ไชยวาน -> อุดรธานี)
  if (dept.startsWith('โรงเรียน') || title.includes('โรงเรียน')) {
    const rawSchool = dept.startsWith('โรงเรียน') ? dept : (title.match(/โรงเรียน[ก-๙]+/)?.[0] || '');
    if (rawSchool) {
      const strippedSchool = rawSchool
        .replace(/^โรงเรียน/, '')
        .replace(/(วิทยาคม|วิทยา|พิทยาคม|พิทยา|วิทยานุกูล|ศึกษา|สงเคราะห์|พัฒนา|ประชาสรรค์|ราษฎร์บำรุง)$/, '')
        .trim();
      if (strippedSchool) {
        if (window.PROVINCE_TO_REGION && window.PROVINCE_TO_REGION[strippedSchool]) {
          return strippedSchool;
        }
        for (const [key, prov] of Object.entries(V2_DISTRICT_MAP)) {
          if (strippedSchool.includes(key)) {
            return prov;
          }
        }
      }
    }
  }

  // 4.6 Local Government (อบต./เทศบาล) stripped keyword match
  const strippedDept = dept
    .replace(/^(องค์การบริหารส่วนตำบล|อบต\.|เทศบาลตำบล|ทต\.|เทศบาลเมือง|ทม\.|เทศบาลนคร|ทน\.)\s*/, '')
    .trim();
  if (strippedDept) {
    if (window.PROVINCE_TO_REGION && window.PROVINCE_TO_REGION[strippedDept]) {
      return strippedDept;
    }
    for (const [key, prov] of Object.entries(V2_DISTRICT_MAP)) {
      if (strippedDept.includes(key)) {
        return prov;
      }
    }
  }

  // 5. Match Province Name inside Department
  if (window.PROVINCE_TO_REGION) {
    for (const provName of Object.keys(window.PROVINCE_TO_REGION)) {
      if (dept.includes(provName)) return provName;
    }
  }

  // 6. Match Province Name inside Project Title
  if (window.PROVINCE_TO_REGION) {
    for (const provName of Object.keys(window.PROVINCE_TO_REGION)) {
      // Avoid short ambiguous words
      if (provName === 'เลย' || provName === 'ตาก' || provName === 'แพร่') {
        if (combined.includes(`จ.${provName}`) || combined.includes(`จังหวัด${provName}`) || dept.includes(provName)) {
          return provName;
        }
        continue;
      }
      if (title.includes(provName)) return provName;
    }
  }

  // 7. Central Government Ministries / Departments / BMA Fallback
  if (
    dept.includes('กรุงเทพมหานคร') || dept.includes('กทม.') ||
    dept.includes('สำนักงานเขต') || dept.includes('สำนักการโยธา') ||
    dept.includes('สำนักการระบายน้ำ') || dept.includes('สำนักสิ่งแวดล้อม') ||
    dept.includes('สำนักการศึกษา') || dept.includes('การกีฬาแห่งประเทศไทย') ||
    dept.includes('การประปานครหลวง') || dept.includes('การไฟฟ้านครหลวง') ||
    dept.includes('การทางพิเศษ') || dept.includes('วชิรพยาบาล') ||
    dept.includes('นวมินทราธิราช')
  ) {
    return 'กรุงเทพมหานคร';
  }

  if (dept.includes('สาธารณสุข') || dept.includes('พาณิชย์') || dept.includes('ราชทัณฑ์')) {
    return 'นนทบุรี';
  }

  if (dept.startsWith('กระทรวง') || dept.startsWith('กรม') || dept.includes('สำนักนายก')) {
    return 'กรุงเทพมหานคร';
  }

  return '';
}
window.extractProvince = extractProvince;

function updateV2ZoneCounters(list, statsData) {
  const regionCounts = {
    bkk: 0,
    central: 0,
    east: 0,
    north: 0,
    northeast: 0,
    west: 0,
    south: 0
  };
  const regionBudgets = {
    bkk: 0,
    central: 0,
    east: 0,
    north: 0,
    northeast: 0,
    west: 0,
    south: 0
  };

  list.forEach(item => {
    const prov = extractProvince(item);
    const reg = window.getRegionInfo ? window.getRegionInfo(prov) : null;
    const b = Number(item.budget) || 0;
    if (reg && regionCounts[reg.id] !== undefined) {
      regionCounts[reg.id]++;
      regionBudgets[reg.id] += b;
    }
  });

  const total = list.length || 1;
  const setTxt = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  // Update Drawer Counts
  setTxt('v2-zcount-all', list.length);
  setTxt('v2-zcount-bkk', regionCounts.bkk);
  setTxt('v2-zcount-central', regionCounts.central);
  setTxt('v2-zcount-east', regionCounts.east);
  setTxt('v2-zcount-north', regionCounts.north);
  setTxt('v2-zcount-northeast', regionCounts.northeast);
  setTxt('v2-zcount-west', regionCounts.west);
  setTxt('v2-zcount-south', regionCounts.south);

  // Helper to format Thai budget strings nicely
  const formatM = (amt) => {
    if (!amt) return '฿0';
    if (amt >= 1e9) return `฿${(amt / 1e9).toFixed(2)} พันล้าน`;
    if (amt >= 1e6) return `฿${(amt / 1e6).toFixed(1)} ล้าน`;
    return window.formatMoney(amt);
  };

  // Update Overview Dashboard Regional Cards
  const zones = ['northeast', 'south', 'bkk', 'east', 'north', 'central', 'west'];
  zones.forEach(zid => {
    const cnt = regionCounts[zid];
    const bgt = regionBudgets[zid];
    const pct = Math.round((cnt / total) * 100);

    setTxt(`ov-zcount-${zid}`, `${cnt} งาน`);
    setTxt(`ov-zbudget-${zid}`, formatM(bgt));
    setTxt(`ov-zpct-${zid}`, `${pct}%`);

    const bar = document.getElementById(`ov-zbar-${zid}`);
    if (bar) bar.style.width = `${pct}%`;
  });

  // Update Overview Product Groups
  const groupCounts = {
    passenger_car_tires: 0,
    truck_bus_tires: 0,
    motorcycle_tires: 0,
    otr_heavy_machinery: 0,
    bicycle_specialty_tires: 0,
    tube_accessories: 0
  };
  list.forEach(item => {
    const g = item.product_group;
    if (groupCounts[g] !== undefined) {
      groupCounts[g]++;
    }
  });

  setTxt('ov-gcount-passenger', `${groupCounts.passenger_car_tires} งาน`);
  setTxt('ov-gcount-truck', `${groupCounts.truck_bus_tires} งาน`);
  setTxt('ov-gcount-motorcycle', `${groupCounts.motorcycle_tires} งาน`);
  setTxt('ov-gcount-otr', `${groupCounts.otr_heavy_machinery} งาน`);
  setTxt('ov-gcount-bicycle', `${groupCounts.bicycle_specialty_tires} งาน`);
  setTxt('ov-gcount-tube', `${groupCounts.tube_accessories} งาน`);
}

function updateV2FeedbackCount() {
  const count = Object.keys(v2UserFeedbackMap).length;
  const el = document.getElementById('v2-feedback-total-count');
  if (el) el.textContent = count;
}

function isWithinDateFilter(announceDateStr, days) {
  if (days === -1) return true; // Show all active
  if (!announceDateStr) return false;
  try {
    const pubDate = new Date(announceDateStr);
    pubDate.setHours(0, 0, 0, 0);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const diffTime = now.getTime() - pubDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    if (days === 0) {
      return diffDays <= 1; // today or past 24h
    }
    return diffDays >= 0 && diffDays <= days;
  } catch (e) {
    return false;
  }
}

function getDaysLeft(dateStr) {
  if (!dateStr) return null;
  try {
    const bDate = new Date(dateStr);
    bDate.setHours(0, 0, 0, 0);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const diffTime = bDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  } catch (e) {
    return null;
  }
}

function calculateExecutiveKPIs(allList, boqList, statsData) {
  // 1. Total active discovered opportunities count (Exactly matches sidebar badge)
  const totalDiscovered = allList.length;
  const countD0 = allList.filter(it => ['D0', 'D1', 'IM'].includes((it.announce_type || '').toUpperCase())).length;
  const countB0 = allList.filter(it => ['B0', 'B1', 'B2', 'B3'].includes((it.announce_type || '').toUpperCase())).length;
  const count15 = allList.filter(it => ['15', 'BOQ'].includes((it.announce_type || '').toUpperCase())).length;
  
  const activeValEl = document.getElementById('kpi-val-active');
  const activeSubEl = document.querySelector('.v2-kpi-card.kpi-active .v2-kpi-sub');
  if (activeValEl) activeValEl.textContent = `${totalDiscovered} โครงการ`;
  if (activeSubEl) activeSubEl.innerHTML = `<span style="color: #dc2626;">●</span> เชิญชวน ${countD0} • ร่าง TOR ${countB0} • ราคากลาง ${count15}`;

  // 2. BOQ count
  const boqValEl = document.getElementById('kpi-val-boq');
  const boqCount = statsData?.boqVerifiedCount || boqList.length;
  if (boqValEl) boqValEl.textContent = `${boqCount} รายการ`;

  // 3. Total tracked budget
  const totalBudget = allList.reduce((sum, it) => sum + (Number(it.budget) || 0), 0);
  const budgetValEl = document.getElementById('kpi-val-budget');
  if (budgetValEl) {
    if (totalBudget >= 1e9) {
      budgetValEl.textContent = `฿${(totalBudget / 1e9).toFixed(2)} พันล้าน`;
    } else if (totalBudget >= 1e6) {
      budgetValEl.textContent = `฿${(totalBudget / 1e6).toFixed(1)} ล้าน`;
    } else {
      budgetValEl.textContent = window.formatMoney(totalBudget);
    }
  }

  // 4. Archive count
  const archiveValEl = document.getElementById('kpi-val-archive');
  if (archiveValEl) {
    const aCount = statsData?.archiveCount || (v2ArchivedAnnouncements ? v2ArchivedAnnouncements.length : 407);
    archiveValEl.textContent = `${aCount} โครงการ`;
  }

  // 5. Watchlist count
  updateWatchlistCountBadge();
}

function updateWatchlistCountBadge() {
  const matchedFeedbackCount = Object.values(v2UserFeedbackMap).filter(f => f && (f.is_match === 1 || f.is_match === 2)).length;
  const watchBadge = document.getElementById('v2-badge-watch-count');
  const watchValEl = document.getElementById('kpi-val-watch');
  if (watchBadge) watchBadge.textContent = matchedFeedbackCount;
  if (watchValEl) watchValEl.textContent = `${matchedFeedbackCount} งาน`;
}

// ============================================================================
// AI Confidence Score Calculator (ListGov Benchmark)
// ============================================================================
function calculateConfidenceScore(item) {
  let score = 75;
  let reason = 'ตรวจพบจากชื่อประกาศ';
  let badgeClass = 'check';

  const hasBoq = !!(item.boq_summary || item.doc_verified);
  const title = (item.project_name || '').toLowerCase();

  if (hasBoq) {
    score = 95;
    reason = 'สแกนพบสเปกใน BOQ';
    badgeClass = 'high';
  } else if (title.includes('ยางรถยนต์') || title.includes('ยางรถบรรทุก') || title.includes('ยางรถจักรยานยนต์') || title.includes('ยางเรเดียล')) {
    score = 92;
    reason = 'คีย์เวิร์ดตรงสายเป้าหมายหลัก 100%';
    badgeClass = 'high';
  } else if (title.includes('ยาง otr') || title.includes('ยางรถแทรกเตอร์') || title.includes('ยางใน') || title.includes('ยางรถจักรยาน')) {
    score = 85;
    reason = 'โครงการหมวดยางเฉพาะทางและอุปกรณ์';
    badgeClass = 'medium';
  } else if (title.includes('ยาง') || title.includes('เปลี่ยนยาง') || title.includes('จัดซื้อยาง')) {
    score = 80;
    reason = 'งานจัดซื้อยางและบริการล้อยาง';
    badgeClass = 'medium';
  }

  return { score, reason, badgeClass };
}

// ============================================================================
// Card Template Generator (Preserves ALL existing features + V2 Enhancements)
// ============================================================================
function generateV2CardHTML(item, index) {
  const projId = (item.project_id || item.id || '').replace(/-[A-Za-z0-9]+$/, '');
  const egpWebUrl = (window.getEgpPortalUrl ? window.getEgpPortalUrl(item) : `https://process5.gprocurement.go.th/egp-agpc01-web/announcement?keywordSearch=${encodeURIComponent(projId)}`);
  
  // Calculate Days Left & Countdown
  let daysLeft = null;
  let bidBadge = '';
  if (item.winner_name) {
    bidBadge = `
      <span style="background: #f1f5f9; color: #475569; border: 1.5px solid #cbd5e1; padding: 4px 10px; border-radius: 20px; font-size: 0.84rem; display: inline-flex; align-items: center; gap: 4px;">
        <span>📁</span> <strong>เคาะราคาแล้ว</strong> (${item.winner_name})
      </span>
    `;
  } else if (item.bid_date) {
    try {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const bDate = new Date(item.bid_date);
      bDate.setHours(0, 0, 0, 0);
      daysLeft = Math.ceil((bDate - now) / (1000 * 60 * 60 * 24));

      let urgencyStyle = 'background: #f0fdf4; color: #166534; border: 1.5px solid #bbf7d0;';
      let urgencyIcon = '🟢';
      if (daysLeft < 0) {
        urgencyStyle = 'background: #f1f5f9; color: #64748b; border: 1.5px solid #cbd5e1;';
        urgencyIcon = '⚪';
      } else if (daysLeft <= 3) {
        urgencyStyle = 'background: #fef2f2; color: #991b1b; border: 1.5px solid #fecaca; font-weight: 800;';
        urgencyIcon = '🔴';
      } else if (daysLeft <= 7) {
        urgencyStyle = 'background: #fffbeb; color: #92400e; border: 1.5px solid #fde68a; font-weight: 700;';
        urgencyIcon = '🟡';
      }

      const daysText = daysLeft < 0 ? 'หมดเขตแล้ว' : daysLeft === 0 ? 'ยื่นซองวันนี้!' : `เหลือ ${daysLeft} วัน`;
      bidBadge = `
        <span style="${urgencyStyle} padding: 4px 10px; border-radius: 20px; font-size: 0.84rem; display: inline-flex; align-items: center; gap: 4px;">
          <span>${urgencyIcon}</span> <strong>${daysText}</strong> (ยื่น: ${window.formatDate(item.bid_date)})
        </span>
      `;
    } catch (e) {
      bidBadge = `<span style="color: #64748b; font-size: 0.84rem;">ยื่นซอง: ${window.formatDate(item.bid_date)}</span>`;
    }
  } else {
    const rawType = (item.announce_type || '').toUpperCase();
    const isFinished = ['IM', 'W0', 'W1', 'W2'].includes(rawType) || (item.winner_name && item.winner_name.trim() !== '') || (item.flow_name && (item.flow_name.includes('สัญญา') || item.flow_name.includes('ผู้ชนะ')));
    if (isFinished) {
      bidBadge = `<span style="background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; padding: 4px 10px; border-radius: 20px; font-size: 0.82rem; display: inline-flex; align-items: center; gap: 4px;"><span>📁</span> <strong>เคาะแล้ว</strong> (${item.winner_name || 'จัดทำสัญญาแล้ว'})</span>`;
    } else if (rawType === '15' || rawType === 'BOQ') {
      bidBadge = `<span style="background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; padding: 4px 10px; border-radius: 20px; font-size: 0.82rem; display: inline-flex; align-items: center; gap: 4px;"><span>📋</span> ราคากลาง (${window.formatDate(item.announce_date)})</span>`;
    } else if (rawType.startsWith('B')) {
      bidBadge = `<span style="background: #fdf4ff; color: #86198f; border: 1px solid #f0abfc; padding: 4px 10px; border-radius: 20px; font-size: 0.82rem; display: inline-flex; align-items: center; gap: 4px;"><span>📝</span> ร่าง TOR (${window.formatDate(item.announce_date)})</span>`;
    } else if (item.doc_end_date) {
      bidBadge = `<span style="background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; padding: 4px 10px; border-radius: 20px; font-size: 0.82rem; display: inline-flex; align-items: center; gap: 4px;"><span>📥</span> รับเอกสารถึง: ${window.formatDate(item.doc_end_date)}</span>`;
    } else {
      bidBadge = `<a href="${egpWebUrl}" target="_blank" rel="noopener noreferrer" style="background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; padding: 4px 10px; border-radius: 20px; font-size: 0.82rem; display: inline-flex; align-items: center; gap: 4px; text-decoration: none;"><span>📢</span> <strong>เปิดรับข้อเสนอ</strong> (ดูวันยื่นใน e-GP)</a>`;
    }
  }

  // Announcement Date Badge for Layer 1 (Top line beside #${index})
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
        <span>🔥</span> ประกาศ: <strong style="color: #b91c1c; font-size: 0.92rem; font-weight: 800;">วันนี้ (${window.formatDate(item.announce_date)})</strong>
      </span>`
    : `<span class="card-hero-date-badge" title="วันที่ประกาศ e-GP">
        <span>📅</span> ประกาศ: <strong style="color: #1d4ed8; font-size: 0.92rem; font-weight: 800;">${window.formatDate(item.announce_date)}</strong>
      </span>`;

  // Detection Origin
  const origin = getMatchOriginInfo(item);

  // AI Confidence Score
  const confidence = calculateConfidenceScore(item);

  // User Feedback state
  const fb = v2UserFeedbackMap[item.id];
  const isMatched = fb && fb.is_match === 1;
  const isMaybe = fb && fb.is_match === 2;
  const isRejected = fb && fb.is_match === 0;

  // Safe Reject Tally count (out of 5 votes)
  const rejectCount = v2RejectTallyMap[item.id] || (isRejected ? 1 : 0);

  // Smart Province Extraction
  const cleanProv = extractProvince(item);
  const regInfo = window.getRegionInfo ? window.getRegionInfo(cleanProv) : null;
  const provFormatted = cleanProv
    ? (cleanProv === 'กรุงเทพมหานคร' ? cleanProv : (cleanProv.startsWith('จ.') ? cleanProv : `จ.${cleanProv}`))
    : '';

  // Province Hero Pill for Layer 1 Header (Top-level eye catcher)
  const provHeroPill = cleanProv
    ? `<span class="card-hero-prov-badge" style="background: #e0f2fe; color: #0369a1; border: 1.5px solid #bae6fd; font-weight: 800; font-size: 0.82rem; padding: 2px 9px; border-radius: 6px; display: inline-flex; align-items: center; gap: 4px;" title="จังหวัด / สถานที่ตั้ง: ${provFormatted} ${regInfo ? '(' + regInfo.name + ')' : ''}">
        <span>📍</span> <strong>${cleanProv === 'กรุงเทพมหานคร' ? 'กรุงเทพฯ' : provFormatted}</strong>
      </span>`
    : `<span class="card-hero-prov-badge" style="background: #f1f5f9; color: #64748b; border: 1.5px solid #cbd5e1; font-weight: 700; font-size: 0.82rem; padding: 2px 9px; border-radius: 6px; display: inline-flex; align-items: center; gap: 4px;" title="สถานที่ตั้งไม่ระบุในชื่อโครงการ (ตรวจสอบใน TOR)">
        <span>📍</span> ตรวจใน TOR
      </span>`;

  // Province Meta Badge for Layer 2 Row (Beside department)
  const provMetaBadge = cleanProv
    ? `<span style="background: #eff6ff; color: #1d4ed8; font-weight: 700; font-size: 0.82rem; padding: 2px 10px; border-radius: 6px; border: 1.5px solid #bfdbfe; display: inline-flex; align-items: center; gap: 4px;">
        <span>📍</span> ${provFormatted} ${regInfo ? `<span style="color: #64748b; font-weight: 500; font-size: 0.78rem;">(${regInfo.name})</span>` : ''}
      </span>`
    : `<span style="background: #f8fafc; color: #64748b; font-weight: 600; font-size: 0.82rem; padding: 2px 8px; border-radius: 6px; border: 1px dashed #cbd5e1; display: inline-flex; align-items: center; gap: 4px;" title="ตรวจสอบสถานที่ตั้งโครงการในเอกสาร TOR">
        <span>📍</span> ไม่ระบุจังหวัดในชื่อ
      </span>`;

  const normType = getNormalizedType(item.announce_type);
  const typeText = window.typeLabels[normType] || window.typeLabels[item.announce_type] || item.announce_type;
  const groupText = window.groupLabels[item.product_group] || item.product_group;

  return `
    <div class="announcement-card ${origin?.isPdf ? 'boq-highlight-card' : ''}" id="card-${item.id}">
      
      <!-- Layer 1: Header (Only Date and Budget in COLOR; other tags neutral) -->
      <div class="card-layer-hero" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
        <div class="card-hero-left" style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
          <span style="background: #1e293b; color: #ffffff; font-weight: 700; font-size: 0.8rem; padding: 3px 8px; border-radius: 4px;">#${index}</span>
          ${announceDateBadge}
          ${provHeroPill}
          
          <!-- Neutral Metadata Badges (No rainbow) -->
          <span class="badge type-${normType.toLowerCase()}">${typeText}</span>
          <span class="badge group-${item.product_group}">${groupText}</span>

          <!-- ListGov Confidence Score Pill (Neutral subtle) -->
          <span class="v2-confidence-pill ${confidence.badgeClass}" title="${confidence.reason}">
            🎯 AI ${confidence.score}%
          </span>
        </div>

        <!-- Project Budget: IN VIVID EMERALD GREEN -->
        <div class="card-hero-budget" title="งบประมาณโครงการ">
          ${window.formatMoney(item.budget)}
        </div>
      </div>

      <!-- Layer 2: Core Info & Detection Origin Box -->
      <div class="card-layer-body" style="margin-top: 10px;">
        <h3 class="card-project-title" style="font-size: 1.12rem; line-height: 1.4; margin: 0 0 10px 0;">
          <a href="javascript:void(0)" onclick="openV2Inspector('${item.id}'); return false;" style="color: #0f172a; text-decoration: none; font-weight: 700;" title="คลิกเพื่อตรวจสอบสเปกละเอียด">
            ${item.project_name || 'ไม่มีชื่อโครงการ'}
          </a>
        </h3>

        <!-- Clear Detection Origin Box -->
        ${origin && (origin.keyword || origin.snippet) ? `
          <div class="card-origin-box ${origin.isPdf ? 'origin-pdf' : 'origin-title'}" style="margin-bottom: 12px;">
            <div class="origin-header">
              <span class="${origin.isPdf ? 'origin-badge-pdf' : 'origin-badge-title'}">
                ${origin.isPdf ? '📑 มุดสแกนพบในไฟล์ PDF (ปร.4/BOQ)' : '🏷️ ตรวจพบจากชื่อประกาศโครงการ'}
              </span>
              ${origin.keyword ? `
                <span class="origin-keyword-badge">
                  ตรวจพบ: <span class="kw-highlight">"${origin.keyword}"</span>
                </span>
              ` : ''}
            </div>
            ${origin.snippet ? `
              <div class="origin-snippet">
                <strong>🔎 ข้อความที่สกัดได้จากเอกสาร:</strong> ${origin.snippet}
              </div>
            ` : ''}
          </div>
        ` : ''}

        <!-- Meta info row -->
        <div class="card-meta-row" style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 12px;">
          <span class="card-meta-item">
            <span style="font-size: 1.05rem;">🏛️</span>
            <strong style="color: #1e293b;">${item.department || '-'}</strong>
          </span>
          ${provMetaBadge}
          ${bidBadge}
        </div>
      </div>

      <!-- Layer 3: Action Buttons (Clear & Touch-friendly) -->
      <div class="card-layer-actions" style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 14px;">
        <button type="button" class="btn-card-action btn-action-detail" onclick="openV2Inspector('${item.id}')" style="background: #003366; color: #fff; font-weight: 700;" title="เปิดแถบตรวจสอบสเปกละเอียด">
          ⚡ ตรวจสอบสเปก
        </button>
        <button type="button" class="btn-card-action btn-action-copy" onclick="copyV2Text('${projId}', this)" title="คัดลอกเลข e-GP">
          📋 คัดลอกเลข: <strong style="font-family: monospace; color: #003366; margin-left: 3px;">${projId}</strong>
        </button>
        <a href="${egpWebUrl}" target="_blank" rel="noopener noreferrer" class="btn-card-action btn-action-egp" onclick="return window.openEgpWithCopy ? window.openEgpWithCopy('${projId}', event) : true" title="คัดลอกเลขโครงการและเปิดค้นหาใน e-GP">
          🔗 เปิดใน e-GP
        </a>
        <button type="button" class="btn-card-action btn-action-sim" onclick="openBiddingSimulator('${item.id}')" title="คำนวณราคาเคาะและกำไร">
          🧮 เคาะราคา
        </button>
      </div>

      <!-- Layer 4: AI Feedback (3 Buttons + Solid Colors + Status Banner + Safe Reject) -->
      <div class="card-layer-feedback" style="background: #f8fafc; border-radius: 8px; padding: 12px 14px; border: 1px solid #e2e8f0;">
        <div class="feedback-question-row" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
          <div style="display: flex; align-items: center; gap: 6px;">
            <span style="font-size: 1.15rem;">💡</span>
            <strong style="color: #334155; font-size: 0.92rem;">งานนี้ตรงกับ วีรับเบอร์ ไหม?</strong>
          </div>
          
          <div class="feedback-buttons-group" style="display: flex; gap: 6px; flex-wrap: wrap;">
            <button type="button" class="btn-ai-choice btn-ai-yes ${isMatched ? 'active' : ''}" onclick="submitV2Feedback('${item.id}', 1, this)">
              ${isMatched ? '✔ คุณเลือก: ใช่งานเรา' : '👍 ใช่ (งานเรา)'}
            </button>
            <button type="button" class="btn-ai-choice btn-ai-maybe ${isMaybe ? 'active' : ''}" onclick="submitV2Feedback('${item.id}', 2, this)">
              ${isMaybe ? '✔ คุณเลือก: อาจจะใช่' : '🤔 อาจจะใช่'}
            </button>
            <button type="button" class="btn-ai-choice btn-ai-no ${isRejected ? 'active' : ''}" onclick="submitV2Feedback('${item.id}', 0, this)" title="ต้องครบ 5 เสียงจึงจะซ่อน เพื่อความปลอดภัย">
              ${isRejected ? `✔ ไม่ใช่งาน (${rejectCount}/5 เสียง)` : '👎 ไม่ใช่งาน'}
            </button>
          </div>
        </div>

        <!-- Feedback Status Banner with Undo -->
        <div id="v2-feedback-banner-${item.id}" style="margin-top: 8px;">
          ${isMatched ? `
            <div class="card-feedback-status-banner status-yes" style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 6px;">
              <div style="font-size: 0.85rem; color: #065f46;">
                <strong>✔ คุณเลือก: "ใช่งานเรา (ตรงสาย)"</strong> • บันทึกเข้าคลังงานที่ติดตามแล้ว
              </div>
              <button type="button" class="btn-status-banner-undo" onclick="undoV2Feedback('${item.id}', this)" style="background: none; border: none; color: #047857; font-weight: 700; cursor: pointer; text-decoration: underline; font-size: 0.82rem;">↩ เปลี่ยนใจ</button>
            </div>
          ` : isMaybe ? `
            <div class="card-feedback-status-banner status-maybe" style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 6px;">
              <div style="font-size: 0.85rem; color: #92400e;">
                <strong>🤔 คุณเลือก: "อาจจะใช่"</strong> • บันทึกรอตรวจสเปกละเอียด
              </div>
              <button type="button" class="btn-status-banner-undo" onclick="undoV2Feedback('${item.id}', this)" style="background: none; border: none; color: #b45309; font-weight: 700; cursor: pointer; text-decoration: underline; font-size: 0.82rem;">↩ เปลี่ยนใจ</button>
            </div>
          ` : isRejected ? `
            <div class="card-feedback-status-banner status-no" style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px;">
              <div style="font-size: 0.85rem; color: #991b1b;">
                <strong>👎 คุณเลือก: "ไม่ใช่งาน" (${rejectCount}/5 เสียง)</strong> • ยังแสดงอยู่เพื่อความปลอดภัย
              </div>
              <button type="button" class="btn-status-banner-undo" onclick="undoV2Feedback('${item.id}', this)" style="background: none; border: none; color: #dc2626; font-weight: 700; cursor: pointer; text-decoration: underline; font-size: 0.82rem;">↩ เปลี่ยนใจ</button>
            </div>
          ` : ''}
        </div>

      </div>

    </div>
  `;
}

// ============================================================================
// High-Density Data Table Row Generator (Inspo Spec Sheet Grid)
// ============================================================================
function generateV2TableRowHTML(item, index) {
  const projId = (item.project_id || item.id || '').replace(/-[A-Za-z0-9]+$/, '');
  const egpWebUrl = (window.getEgpPortalUrl ? window.getEgpPortalUrl(item) : `https://process5.gprocurement.go.th/egp-agpc01-web/announcement?keywordSearch=${encodeURIComponent(projId)}`);
  const origin = getMatchOriginInfo(item);
  const normType = getNormalizedType(item.announce_type);
  const typeText = window.typeLabels[normType] || window.typeLabels[item.announce_type] || item.announce_type;
  const groupText = window.groupLabels[item.product_group] || item.product_group;
  const cleanProv = extractProvince(item);
  const regInfo = window.getRegionInfo ? window.getRegionInfo(cleanProv) : null;
  const provFormatted = cleanProv
    ? (cleanProv === 'กรุงเทพมหานคร' ? cleanProv : (cleanProv.startsWith('จ.') ? cleanProv : `จ.${cleanProv}`))
    : '';
  
  let isToday = false;
  try {
    const now = new Date();
    const todayLocalStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    if (item.announce_date && item.announce_date.includes(todayLocalStr)) isToday = true;
  } catch(e) {}

  const dateBadge = isToday
    ? `<span style="background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c; padding: 2px 6px; border-radius: 4px; font-weight: 700; font-size: 0.72rem; white-space: nowrap;">🔥 วันนี้</span>`
    : `<span style="color: #475569; font-weight: 600; font-size: 0.8rem; white-space: nowrap;">${window.formatDate(item.announce_date)}</span>`;

  const fb = v2UserFeedbackMap[item.id];
  const isMatched = fb && fb.is_match === 1;

  return `
    <tr class="${origin?.isPdf ? 'table-row-pdf' : ''}" id="trow-${item.id}" onclick="openV2Inspector('${item.id}')" style="cursor: pointer;">
      <td style="white-space: nowrap;">
        <div style="font-weight: 700; color: #94a3b8; font-size: 0.76rem; margin-bottom: 2px;">#${index}</div>
        ${dateBadge}
        ${item.winner_name ? `<div style="color: #64748b; font-size: 0.72rem; font-weight: 700; margin-top: 3px;">📁 เคาะแล้ว: ${item.winner_name}</div>` : item.bid_date ? `<div style="color: #dc2626; font-size: 0.72rem; font-weight: 700; margin-top: 3px;">⏳ ยื่น: ${window.formatDate(item.bid_date)}</div>` : ''}
      </td>
      <td class="col-title">
        <a href="javascript:void(0)" onclick="openV2Inspector('${item.id}'); return false;" title="${item.project_name || ''}">
          ${item.project_name || 'ไม่มีชื่อโครงการ'}
        </a>
        ${origin?.isPdf ? `
          <div style="margin-top: 3px;">
            <span style="background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; font-size: 0.72rem; padding: 1px 6px; border-radius: 4px; font-weight: 600;">
              📑 ปร.4: "${origin.keyword}"
            </span>
          </div>
        ` : ''}
      </td>
      <td>
        <div style="font-weight: 600; color: #1e293b; font-size: 0.85rem;">${item.department || '-'}</div>
        ${provFormatted ? `
          <div style="color: #0369a1; font-size: 0.78rem; font-weight: 700; margin-top: 3px; display: inline-flex; align-items: center; gap: 3px; background: #e0f2fe; padding: 1px 7px; border-radius: 4px; border: 1px solid #bae6fd;">
            <span>📍</span> ${provFormatted} ${regInfo ? `<span style="color: #64748b; font-weight: normal; font-size: 0.72rem;">(${regInfo.name})</span>` : ''}
          </div>
        ` : `<div style="color: #94a3b8; font-size: 0.75rem; margin-top: 3px;">📍 ตรวจใน TOR</div>`}
      </td>
      <td class="col-budget">
        ${window.formatMoney(item.budget)}
      </td>
      <td>
        <div style="display: flex; flex-direction: column; gap: 3px; align-items: flex-start;">
          <span class="badge type-${normType.toLowerCase()}" style="font-size: 0.72rem; padding: 2px 6px;">${typeText}</span>
          <span class="badge group-${item.product_group}" style="font-size: 0.72rem; padding: 2px 6px;">${groupText}</span>
        </div>
      </td>
      <td class="col-actions" onclick="event.stopPropagation()">
        <button type="button" class="btn-card-action btn-action-detail" onclick="openV2Inspector('${item.id}')" style="height: 30px; padding: 0 8px; font-size: 0.78rem; font-weight: 700;" title="ตรวจสเปกละเอียด">
          ⚡ ตรวจ
        </button>
        <button type="button" class="btn-card-action btn-action-sim" onclick="openBiddingSimulator('${item.id}')" style="height: 30px; padding: 0 8px; font-size: 0.78rem;" title="เคาะราคา">
          🧮
        </button>
        <a href="${egpWebUrl}" target="_blank" rel="noopener noreferrer" class="btn-card-action btn-action-egp" onclick="return window.openEgpWithCopy ? window.openEgpWithCopy('${projId}', event) : true" style="height: 30px; padding: 0 8px; font-size: 0.78rem;" title="คัดลอกเลขและเปิด e-GP">
          🔗
        </a>
        <button type="button" class="btn-ai-choice btn-ai-yes ${isMatched ? 'active' : ''}" onclick="submitV2Feedback('${item.id}', 1, this)" style="height: 30px; padding: 0 8px; font-size: 0.78rem;" title="ใช่งานเรา">
          ${isMatched ? '⭐' : '👍'}
        </button>
      </td>
    </tr>
  `;
}

// View Mode state (Card vs Table)
let currentV2ViewMode = localStorage.getItem('veerubber_v2_view_mode') || 'card';

window.setV2ViewMode = function(mode) {
  currentV2ViewMode = mode;
  try { localStorage.setItem('veerubber_v2_view_mode', mode); } catch(e) {}

  const btnCard = document.getElementById('v2-view-btn-card');
  const btnTable = document.getElementById('v2-view-btn-table');
  const cardList = document.getElementById('v2-opportunities-list');
  const tableWrap = document.getElementById('v2-opportunities-table-wrap');

  if (btnCard) btnCard.classList.toggle('active', mode === 'card');
  if (btnTable) btnTable.classList.toggle('active', mode === 'table');

  if (cardList && tableWrap) {
    if (mode === 'table') {
      cardList.style.display = 'none';
      tableWrap.style.display = 'block';
    } else {
      cardList.style.display = 'flex';
      tableWrap.style.display = 'none';
    }
  }

  // Re-render current list
  if (v2Announcements && v2Announcements.length > 0) {
    renderOpportunitiesList(v2Announcements);
  }
};

// ============================================================================
// Render Views
// ============================================================================
function renderOverviewTopFit(list) {
  const container = document.getElementById('v2-overview-top-fit-list');
  const countEl = document.getElementById('v2-top-fit-count');
  if (!container) return;

  // Filter top fit: BOQ or high relevance keywords
  let topFit = list.filter(it => {
    const score = calculateConfidenceScore(it).score;
    return score >= 85;
  });

  if (topFit.length === 0) {
    topFit = list;
  }

  if (countEl) countEl.textContent = topFit.length;

  if (topFit.length === 0) {
    container.innerHTML = `<div class="text-center" style="padding: 30px; color: #64748b;">ไม่พบรายการประกาศในระบบขณะนี้</div>`;
    return;
  }

  // Show top items on overview
  const slice = topFit.slice(0, 10);
  container.innerHTML = slice.map((item, idx) => generateV2CardHTML(item, idx + 1)).join('');
}

function renderOpportunitiesList(list) {
  const container = document.getElementById('v2-opportunities-list');
  if (!container) return;

  const currentSource = (v2SelectedStatus === 'archived')
    ? (v2ArchivedAnnouncements || [])
    : (list || v2Announcements);

  // Multi-condition Comprehensive Filtering
  const filtered = currentSource.filter(item => {
    // 1. Announce Type (Allow all types including W0 in archive mode)
    if (v2SelectedStatus !== 'archived') {
      const normType = getNormalizedType(item.announce_type);
      if (v2SelectedTypes.length > 0 && !v2SelectedTypes.includes(normType)) return false;
    }

    // 2. Product Group
    if (v2SelectedGroups.length > 0 && !v2SelectedGroups.includes(item.product_group)) return false;

    // 3. Search Keyword (Title, Dept, Matched KW, ID, Province, Winner)
    if (v2SearchKeyword) {
      const q = v2SearchKeyword.toLowerCase();
      const matchTitle = (item.project_name || '').toLowerCase().includes(q);
      const matchDept = (item.department || '').toLowerCase().includes(q);
      const matchKw = (item.matched_keywords || '').toLowerCase().includes(q);
      const matchId = (item.project_id || item.id || '').toLowerCase().includes(q);
      const matchProv = extractProvince(item).toLowerCase().includes(q);
      const matchWinner = (item.winner_name || '').toLowerCase().includes(q);
      if (!matchTitle && !matchDept && !matchKw && !matchId && !matchProv && !matchWinner) return false;
    }

    // 4. Date Filter (ช่วงเวลาประกาศ: วันนี้, 7 วัน, 30 วัน, ยังไม่เคาะ - ไม่จำกัดใน archive)
    if (v2SelectedStatus !== 'archived' && v2SelectedDays !== -1) {
      if (!isWithinDateFilter(item.announce_date, v2SelectedDays)) return false;
    }

    // 5. Budget Range Filter (มูลค่าโครงการ)
    const b = Number(item.budget) || 0;
    if (v2BudgetMin !== '' && b < v2BudgetMin) return false;
    if (v2BudgetMax !== '' && b > v2BudgetMax) return false;
    if (v2BudgetMin === '' && v2BudgetMax === '' && b > 200000000) return false; // Default cap 200M

    // 6. Geographic Zone Filter (7 โซนทั่วประเทศ)
    if (v2SelectedZone) {
      const prov = extractProvince(item);
      const reg = window.getRegionInfo ? window.getRegionInfo(prov) : null;
      if (!reg || reg.id !== v2SelectedZone) return false;
    }

    // 7. Urgent Filter (< 7 days before bidding date)
    if (v2UrgentOnly) {
      const dl = getDaysLeft(item.bid_date);
      if (dl === null || dl < 0 || dl > 7) return false;
    }

    // 7.5 BOQ Scanned Only (มุดเจอใน BOQ / ปร.4)
    if (v2BoqOnly) {
      const hasBoq = !!(item.boq_summary || item.doc_verified);
      if (!hasBoq) return false;
    }

    // 8. Status Filter (Feedback)
    if (v2SelectedStatus === 'archived') {
      // In archive mode, all items from archive endpoint are displayed
    } else {
      const fb = v2UserFeedbackMap[item.id];
      const itemStatus = fb ? (fb.is_match === 1 ? 'matched' : fb.is_match === 2 ? 'maybe' : 'rejected') : 'unreviewed';
      if (v2SelectedStatus !== 'all' && itemStatus !== v2SelectedStatus) return false;
    }

    // 9. Auto-hide Rejected (Strict 5-vote rule)
    if (v2HideRejected && v2SelectedStatus !== 'archived') {
      const fb = v2UserFeedbackMap[item.id];
      const itemStatus = fb ? (fb.is_match === 1 ? 'matched' : fb.is_match === 2 ? 'maybe' : 'rejected') : 'unreviewed';
      const rejectCount = v2RejectTallyMap[item.id] || 0;
      if (itemStatus === 'rejected' && rejectCount >= 5) return false;
    }

    return true;
  });

  // Track active filtered list for inspector navigation
  window.v2CurrentFilteredList = filtered;

  // Update result count badge in view toolbar
  const countBadge = document.getElementById('v2-visible-count-badge');
  if (countBadge) {
    countBadge.textContent = v2SelectedStatus === 'archived'
      ? `${filtered.length} โครงการในคลัง`
      : `${filtered.length} โครงการ`;
  }

  const tableWrap = document.getElementById('v2-opportunities-table-wrap');
  const tbody = document.getElementById('v2-opportunities-tbody');

  if (filtered.length === 0) {
    let archivePromptHTML = '';
    if (v2SelectedStatus !== 'archived') {
      const arcCount = (window.v2Stats && window.v2Stats.archiveCount) ? window.v2Stats.archiveCount : 239;
      archivePromptHTML = `
        <div style="margin-top: 18px; padding-top: 18px; border-top: 1px dashed #cbd5e1;">
          <p style="color: #475569; font-size: 0.92rem; margin-bottom: 10px;">
            📁 โครงการจัดซื้อยางที่มีการเคาะราคา ประกาศผู้ชนะ หรือทำสัญญาแล้วทั้งหมด (<strong>${arcCount} โครงการ</strong>) ถูกแยกเก็บไว้ใน <strong>"คลังเคาะแล้ว (Archive)"</strong>
          </p>
          <button type="button" onclick="switchV2View('archive')" style="background: #003366; color: #ffffff; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 700; cursor: pointer; font-family: 'Anuphan', sans-serif; box-shadow: 0 2px 4px rgba(0,51,102,0.2);">
            👉 เปิดดูข้อมูลราคาและผู้ชนะใน "คลังเคาะแล้ว (Archive)"
          </button>
        </div>
      `;
    }

    const emptyHTML = `
      <div style="background: #ffffff; border: 1.5px dashed #cbd5e1; border-radius: 12px; padding: 40px; text-align: center;">
        <div style="font-size: 2.5rem; margin-bottom: 10px;">🔍</div>
        <h3 style="color: #334155; margin-bottom: 6px;">${v2SelectedStatus === 'archived' ? 'ไม่พบโครงการในคลังเคาะแล้วตามเงื่อนไข' : 'ไม่พบโครงการตามเงื่อนไขตัวกรองที่เลือก'}</h3>
        <p style="color: #64748b; font-size: 0.9rem;">ลองปรับช่วงเวลา งบประมาณ โซนจังหวัด หรือกด "↺ รีเซ็ต" เพื่อดูโครงการทั้งหมด</p>
        ${archivePromptHTML}
      </div>
    `;
    container.innerHTML = emptyHTML;
    if (tbody) tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 30px; color: #64748b;">${v2SelectedStatus === 'archived' ? 'ไม่พบโครงการในคลังเคาะแล้วตามเงื่อนไข' : 'ไม่พบโครงการตามเงื่อนไขตัวกรอง'}</td></tr>`;
    const loadMoreBtn = document.getElementById('btn-v2-load-more');
    if (loadMoreBtn) loadMoreBtn.style.display = 'none';
    return;
  }

  // Render Card View
  container.innerHTML = filtered.map((item, idx) => generateV2CardHTML(item, idx + 1)).join('');

  // Render Table View
  if (tbody) {
    tbody.innerHTML = filtered.map((item, idx) => generateV2TableRowHTML(item, idx + 1)).join('');
  }

  // Apply active view mode visibility
  if (currentV2ViewMode === 'table') {
    container.style.display = 'none';
    if (tableWrap) tableWrap.style.display = 'block';
  } else {
    container.style.display = 'flex';
    if (tableWrap) tableWrap.style.display = 'none';
  }

  // Sync toolbar button states
  const btnCard = document.getElementById('v2-view-btn-card');
  const btnTable = document.getElementById('v2-view-btn-table');
  if (btnCard) btnCard.classList.toggle('active', currentV2ViewMode === 'card');
  if (btnTable) btnTable.classList.toggle('active', currentV2ViewMode === 'table');

  // Update load more button
  const loadMoreBtn = document.getElementById('btn-v2-load-more');
  if (loadMoreBtn) {
    loadMoreBtn.style.display = 'inline-block';
    loadMoreBtn.disabled = true;
    loadMoreBtn.textContent = `✅ แสดงครบทุกรายการแล้ว (${filtered.length} โครงการ)`;
  }
}

window.loadMoreV2Announcements = function() {
  const btn = document.getElementById('btn-v2-load-more');
  if (btn) {
    btn.disabled = true;
    btn.textContent = `✅ แสดงครบทุกรายการแล้ว (${v2Announcements.length} โครงการ)`;
  }
};

function renderBoqView() {
  const container = document.getElementById('v2-boq-list');
  const countBadge = document.getElementById('v2-boq-verified-count-badge');
  if (!container) return;

  let filtered = v2BoqAnnouncements;
  if (v2BoqSelectedGroup) {
    filtered = filtered.filter(it => it.product_group === v2BoqSelectedGroup);
  }
  if (v2BoqSearchKeyword) {
    const q = v2BoqSearchKeyword.toLowerCase();
    filtered = filtered.filter(it => {
      const matchTitle = (it.project_name || '').toLowerCase().includes(q);
      const matchDept = (it.department || '').toLowerCase().includes(q);
      const matchBoq = (it.boq_summary || '').toLowerCase().includes(q);
      return matchTitle || matchDept || matchBoq;
    });
  }

  if (countBadge) countBadge.textContent = `${filtered.length} งาน`;

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="background: #ffffff; border: 1.5px dashed #cbd5e1; border-radius: 12px; padding: 40px; text-align: center;">
        <div style="font-size: 2.5rem; margin-bottom: 10px;">🔬</div>
        <h3 style="color: #334155; margin-bottom: 6px;">ไม่พบงาน BOQ ตามเงื่อนไขที่เลือก</h3>
        <p style="color: #64748b; font-size: 0.9rem;">ลองค้นหาด้วยคำอื่น หรือเลือกดูทุกหมวดสินค้า</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map((item, idx) => generateV2CardHTML(item, idx + 1)).join('');
}

function renderWatchlistView() {
  const container = document.getElementById('v2-watchlist-container');
  if (!container) return;

  const watchedItems = v2Announcements.filter(it => {
    const fb = v2UserFeedbackMap[it.id];
    return fb && (fb.is_match === 1 || fb.is_match === 2);
  });

  if (watchedItems.length === 0) {
    container.innerHTML = `
      <div style="background: #ffffff; border: 1.5px dashed #cbd5e1; border-radius: 12px; padding: 40px; text-align: center;">
        <div style="font-size: 2.5rem; margin-bottom: 10px;">📌</div>
        <h3 style="color: #334155; margin-bottom: 6px;">ยังไม่มีงานที่บันทึกติดตาม</h3>
        <p style="color: #64748b; font-size: 0.9rem;">เมื่อคุณกดเลือก "👍 ใช่ (งานเรา)" หรือ "🤔 อาจจะใช่" โครงการจะถูกรวบรวมมาไว้ที่นี่โดยอัตโนมัติ</p>
      </div>
    `;
    return;
  }

  container.innerHTML = watchedItems.map((item, idx) => generateV2CardHTML(item, idx + 1)).join('');
}

// ============================================================================
// VIEW 4.5: คลังเคาะแล้ว (Archive / Completed Projects) Controller
// ============================================================================
let v2ArchiveSearchKeyword = '';
let v2ArchiveSelectedGroup = '';
let v2ArchiveBudgetMin = '';
let v2ArchiveBudgetMax = '';

window.goToArchiveWithSearch = function(keyword) {
  const kw = keyword !== undefined ? keyword : v2SearchKeyword;
  switchV2View('archive');
  if (kw) {
    setTimeout(() => {
      const inp = document.getElementById('v2-archive-search-input');
      if (inp) {
        inp.value = kw;
        v2ArchiveSearchKeyword = kw;
        renderArchiveList();
      }
    }, 100);
  }
};

window.loadAndRenderArchiveView = async function() {
  const container = document.getElementById('v2-archive-list');
  const totalBadge = document.getElementById('v2-archive-total-badge');
  const badgeNav = document.getElementById('v2-badge-archive-count');

  if (!v2ArchivedAnnouncements) {
    if (container) {
      container.innerHTML = `
        <div style="background: #ffffff; border: 1.5px dashed #cbd5e1; border-radius: 12px; padding: 40px; text-align: center;">
          <div style="font-size: 2.2rem; margin-bottom: 10px;">⏳</div>
          <h3 style="color: #334155; margin-bottom: 6px;">กำลังโหลดคลังโครงการที่เคาะราคาแล้ว...</h3>
          <p style="color: #64748b; font-size: 0.9rem;">ดึงข้อมูลโครงการที่ผ่านการยื่นซอง/เซ็นสัญญาแล้วจากฐานข้อมูล</p>
        </div>
      `;
    }
    try {
      const res = await api.getAnnouncements({ status: 'archive', limit: 500 });
      if (res && res.data) {
        v2ArchivedAnnouncements = (res.data || []).filter(it => isGenuineTireItem(it));
        v2ArchivedAnnouncements.forEach(it => {
          if (window.projectDataStore) {
            window.projectDataStore.set(it.id, it);
            if (it.project_id) window.projectDataStore.set(it.project_id, it);
          }
        });
      } else {
        v2ArchivedAnnouncements = [];
      }
    } catch (err) {
      console.error('Error fetching archived announcements:', err);
      v2ArchivedAnnouncements = [];
    }
  }

  const count = v2ArchivedAnnouncements ? v2ArchivedAnnouncements.length : 0;
  if (totalBadge) totalBadge.textContent = count;
  if (badgeNav) badgeNav.textContent = count;

  renderArchiveList();
};

function renderArchiveList() {
  const container = document.getElementById('v2-archive-list');
  const visibleBadge = document.getElementById('v2-archive-visible-badge');
  if (!container) return;

  let items = v2ArchivedAnnouncements || [];

  if (v2ArchiveSelectedGroup) {
    items = items.filter(it => it.product_group === v2ArchiveSelectedGroup);
  }

  if (v2ArchiveSearchKeyword) {
    const q = v2ArchiveSearchKeyword.toLowerCase();
    items = items.filter(it => {
      const matchTitle = (it.project_name || '').toLowerCase().includes(q);
      const matchDept = (it.department || '').toLowerCase().includes(q);
      const matchId = (it.project_id || it.id || '').toLowerCase().includes(q);
      const matchProv = (it.province || '').toLowerCase().includes(q);
      const matchWinner = (it.winner_name || '').toLowerCase().includes(q);
      return matchTitle || matchDept || matchId || matchProv || matchWinner;
    });
  }

  if (v2ArchiveBudgetMin !== '' || v2ArchiveBudgetMax !== '') {
    const minVal = v2ArchiveBudgetMin !== '' ? parseFloat(v2ArchiveBudgetMin) : -Infinity;
    const maxVal = v2ArchiveBudgetMax !== '' ? parseFloat(v2ArchiveBudgetMax) : Infinity;
    items = items.filter(it => {
      const b = parseFloat(it.budget || 0);
      return b >= minVal && (maxVal === Infinity || b < maxVal);
    });
  }

  if (visibleBadge) {
    visibleBadge.textContent = `แสดง ${items.length} โครงการ`;
  }

  if (items.length === 0) {
    container.innerHTML = `
      <div style="background: #ffffff; border: 1.5px dashed #cbd5e1; border-radius: 12px; padding: 40px; text-align: center;">
        <div style="font-size: 2.5rem; margin-bottom: 10px;">📁</div>
        <h3 style="color: #334155; margin-bottom: 6px;">ไม่พบโครงการในคลังเคาะแล้วตามคำค้นหาหรือตัวกรองที่เลือก</h3>
        <p style="color: #64748b; font-size: 0.9rem;">ลองค้นหาด้วยคำอื่น หรือกด "ทั้งหมด" เพื่อดูโครงการทั้งหมด</p>
      </div>
    `;
    return;
  }

  container.innerHTML = items.map((item, idx) => generateV2CardHTML(item, idx + 1)).join('');
}

let v2ArchiveSearchTimer = null;
window.onV2ArchiveSearchInput = function(e) {
  clearTimeout(v2ArchiveSearchTimer);
  v2ArchiveSearchTimer = setTimeout(() => {
    v2ArchiveSearchKeyword = (e.target.value || '').trim();
    renderArchiveList();
  }, 250);
};

window.filterV2ArchiveGroup = function(group, btn) {
  v2ArchiveSelectedGroup = group;
  const groupContainer = document.getElementById('v2-archive-group-filters');
  if (groupContainer) {
    groupContainer.querySelectorAll('button').forEach(b => b.classList.remove('active'));
  }
  if (btn) btn.classList.add('active');
  renderArchiveList();
};

window.filterV2ArchiveBudget = function(min, max, btn) {
  v2ArchiveBudgetMin = min;
  v2ArchiveBudgetMax = max;
  const budgetContainer = document.getElementById('v2-archive-budget-filters');
  if (budgetContainer) {
    budgetContainer.querySelectorAll('button').forEach(b => b.classList.remove('active'));
  }
  if (btn) btn.classList.add('active');
  renderArchiveList();
};

// ============================================================================
// Filter Handlers & Controls (Date, Budget, Zone, Urgent, Drawer, Reset)
// ============================================================================
window.toggleV2FilterDrawer = function() {
  const drawer = document.getElementById('v2-filter-drawer');
  const btn = document.getElementById('btn-v2-toggle-drawer');
  const arrow = document.getElementById('v2-drawer-arrow');
  if (!drawer) return;
  const isHidden = drawer.classList.toggle('hidden');
  if (arrow) arrow.textContent = isHidden ? '▼' : '▲';
  if (btn) btn.classList.toggle('active', !isHidden);
};

window.selectV2Days = function(days, btn) {
  v2SelectedDays = parseInt(days, 10);
  document.querySelectorAll('.btn-date-filter').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderOpportunitiesList(v2Announcements);
};

window.selectV2Budget = function(bmin, bmax, btn) {
  v2BudgetMin = bmin !== '' ? Number(bmin) : '';
  v2BudgetMax = bmax !== '' ? Number(bmax) : '';
  document.querySelectorAll('.btn-budget-filter').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderOpportunitiesList(v2Announcements);
};

function updateZoneButtonsUI(activeZone) {
  document.querySelectorAll('.btn-zone-filter').forEach(b => {
    b.classList.toggle('active', (b.getAttribute('data-v2-zone') || '') === (activeZone || ''));
  });
  const labelEl = document.getElementById('v2-zone-active-label');
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
    labelEl.textContent = zoneNames[activeZone || ''] || 'แสดงทุกโซน';
  }
}

function updateBoqQuickButtonUI(active) {
  const btn = document.getElementById('btn-v2-quick-boq');
  if (btn) {
    btn.classList.toggle('active', !!active);
    if (active) {
      btn.style.background = '#16a34a';
      btn.style.color = '#ffffff';
      btn.style.borderColor = '#15803d';
      btn.innerHTML = '<span>✓ เฉพาะใน BOQ</span>';
    } else {
      btn.style.background = '';
      btn.style.color = '';
      btn.style.borderColor = '';
      btn.innerHTML = '<span>🔬 มุดพบใน BOQ</span>';
    }
  }
}

window.selectV2Zone = function(zone, btn) {
  v2SelectedZone = zone || '';
  updateZoneButtonsUI(v2SelectedZone);
  renderOpportunitiesList(v2Announcements);
};

window.toggleV2BoqOnly = function(btn) {
  v2BoqOnly = !v2BoqOnly;
  updateBoqQuickButtonUI(v2BoqOnly);
  renderOpportunitiesList(v2Announcements);
  if (typeof showToast === 'function') {
    showToast(v2BoqOnly ? 'กรองเฉพาะงานที่มุดพบใน BOQ แล้ว' : 'แสดงงานทุกประเภท', 'info');
  }
};

// Overview Navigation & Direct Filter Functions
window.filterOpportunitiesAll = function() {
  v2BoqOnly = false;
  v2SelectedZone = '';
  v2SelectedStatus = 'all';
  v2SearchKeyword = '';
  v2SelectedDays = -1;
  v2BudgetMin = '';
  v2BudgetMax = '';
  v2SelectedTypes = ['D0', 'B0', '15', 'P0'];
  v2SelectedGroups = ['passenger_car_tires', 'truck_bus_tires', 'motorcycle_tires', 'otr_heavy_machinery', 'bicycle_specialty_tires', 'tube_accessories'];

  const s1 = document.getElementById('v2-search-input');
  if (s1) s1.value = '';
  const s2 = document.getElementById('v2-global-search');
  if (s2) s2.value = '';

  updateBoqQuickButtonUI(false);
  updateZoneButtonsUI('');

  document.querySelectorAll('[data-v2-type], [data-v2-group]').forEach(el => el.classList.add('active'));
  document.querySelectorAll('.btn-date-filter').forEach(b => {
    b.classList.toggle('active', b.getAttribute('data-v2-days') === '-1');
  });
  document.querySelectorAll('.btn-budget-filter').forEach(b => {
    b.classList.toggle('active', !b.getAttribute('data-v2-bmin') && !b.getAttribute('data-v2-bmax'));
  });
  document.querySelectorAll('.btn-status-filter').forEach(b => {
    b.classList.toggle('active', b.getAttribute('data-v2-status') === 'all');
  });

  switchV2View('opportunities');
  renderOpportunitiesList(v2Announcements);
};

window.filterOpportunitiesBoq = function() {
  v2BoqOnly = true;
  v2SelectedZone = '';
  v2SelectedStatus = 'all';

  updateBoqQuickButtonUI(true);
  updateZoneButtonsUI('');

  switchV2View('opportunities');
  renderOpportunitiesList(v2Announcements);

  if (typeof showToast === 'function') {
    showToast('กรองเฉพาะงานที่มุดสแกนพบสเปกในไฟล์ BOQ', 'info');
  }
};

window.filterOpportunitiesZone = function(zoneId) {
  v2BoqOnly = false;
  v2SelectedZone = zoneId || '';

  updateBoqQuickButtonUI(false);
  updateZoneButtonsUI(v2SelectedZone);

  switchV2View('opportunities');
  renderOpportunitiesList(v2Announcements);

  const zoneNames = {
    '': 'ทั่วประเทศ (ทุกโซน)',
    'bkk': 'กทม.และปริมณฑล',
    'central': 'ภาคกลาง',
    'east': 'ภาคตะวันออก',
    'north': 'ภาคเหนือ',
    'northeast': 'ภาคอีสาน',
    'west': 'ภาคตะวันตก',
    'south': 'ภาคใต้'
  };
  if (typeof showToast === 'function') {
    showToast(`กรองโครงการ: ${zoneNames[zoneId] || 'ทุกโซน'}`, 'info');
  }
};

window.filterOpportunitiesGroup = function(groupKey) {
  v2BoqOnly = false;
  v2SelectedZone = '';
  v2SelectedGroups = [groupKey];

  updateBoqQuickButtonUI(false);
  updateZoneButtonsUI('');

  document.querySelectorAll('[data-v2-group]').forEach(b => {
    const grp = b.getAttribute('data-v2-group');
    b.classList.toggle('active', grp === groupKey);
  });

  switchV2View('opportunities');
  renderOpportunitiesList(v2Announcements);

  const groupTitles = {
    passenger_car_tires: 'ยางรถยนต์ & กระบะ',
    truck_bus_tires: 'ยางรถบรรทุก & บัส',
    motorcycle_tires: 'ยางจักรยานยนต์ & สายตรวจ',
    otr_heavy_machinery: 'ยาง OTR & เครื่องจักร',
    bicycle_specialty_tires: 'ยางจักรยาน & วีลแชร์',
    tube_accessories: 'ยางใน & อุปกรณ์'
  };
  if (typeof showToast === 'function') {
    showToast(`กรองหมวดหมู่: ${groupTitles[groupKey] || groupKey}`, 'info');
  }
};

window.toggleV2Urgent = function(btn) {
  v2UrgentOnly = !v2UrgentOnly;
  if (btn) btn.classList.toggle('active', v2UrgentOnly);
  renderOpportunitiesList(v2Announcements);
};

window.selectV2Status = async function(status, btn) {
  v2SelectedStatus = status;
  document.querySelectorAll('.btn-status-filter').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');

  if (status === 'archived') {
    // Reset date filter to all when opening archive so older bidded items are visible
    v2SelectedDays = -1;
    document.querySelectorAll('.btn-date-filter').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-v2-days') === '-1');
    });

    if (!v2ArchivedAnnouncements) {
      const container = document.getElementById('v2-opportunities-list');
      if (container) {
        container.innerHTML = `
          <div style="background: #ffffff; border: 1.5px dashed #cbd5e1; border-radius: 12px; padding: 40px; text-align: center;">
            <div style="font-size: 2.2rem; margin-bottom: 10px;">⏳</div>
            <h3 style="color: #334155; margin-bottom: 6px;">กำลังโหลดคลังโครงการที่เคาะราคาแล้ว...</h3>
            <p style="color: #64748b; font-size: 0.9rem;">ดึงข้อมูลโครงการที่ผ่านการยื่นซอง/เซ็นสัญญาแล้วจากฐานข้อมูล</p>
          </div>
        `;
      }
      try {
        const res = await api.getAnnouncements({ status: 'archive', limit: 500 });
        if (res && res.data) {
          v2ArchivedAnnouncements = (res.data || []).filter(it => isGenuineTireItem(it));
          v2ArchivedAnnouncements.forEach(it => {
            if (window.projectDataStore) {
              window.projectDataStore.set(it.id, it);
              if (it.project_id) window.projectDataStore.set(it.project_id, it);
            }
          });
        } else {
          v2ArchivedAnnouncements = [];
        }
      } catch (err) {
        console.error('Error fetching archived announcements:', err);
        v2ArchivedAnnouncements = [];
      }
    }
    renderOpportunitiesList(v2ArchivedAnnouncements);
  } else {
    renderOpportunitiesList(v2Announcements);
  }
};

window.toggleV2HideRejected = function(checked) {
  v2HideRejected = checked;
  renderOpportunitiesList(v2Announcements);
};

let v2SearchInputTimer = null;
window.onV2SearchInput = function(e) {
  clearTimeout(v2SearchInputTimer);
  v2SearchInputTimer = setTimeout(() => {
    v2SearchKeyword = e.target.value.trim();
    renderOpportunitiesList(v2Announcements);
  }, 250);
};

let v2BoqSearchTimer = null;
window.onV2BoqSearchInput = function(e) {
  clearTimeout(v2BoqSearchTimer);
  v2BoqSearchTimer = setTimeout(() => {
    v2BoqSearchKeyword = e.target.value.trim();
    renderBoqView();
  }, 250);
};

window.filterV2BoqGroup = function(group, btn) {
  v2BoqSelectedGroup = group;
  document.querySelectorAll('#v2-boq-group-filters .badge').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderBoqView();
};

window.toggleV2TypeFilter = function(type, el) {
  if (v2SelectedTypes.includes(type)) {
    v2SelectedTypes = v2SelectedTypes.filter(t => t !== type);
    el.classList.remove('active');
  } else {
    v2SelectedTypes.push(type);
    el.classList.add('active');
  }
  renderOpportunitiesList(v2Announcements);
};

window.toggleV2GroupFilter = function(group, el) {
  if (v2SelectedGroups.includes(group)) {
    v2SelectedGroups = v2SelectedGroups.filter(g => g !== group);
    el.classList.remove('active');
  } else {
    v2SelectedGroups.push(group);
    el.classList.add('active');
  }
  renderOpportunitiesList(v2Announcements);
};

window.resetV2Filters = function() {
  v2BoqOnly = false;
  v2SelectedTypes = ['D0', 'B0', '15', 'P0'];
  v2SelectedGroups = ['passenger_car_tires', 'truck_bus_tires', 'motorcycle_tires', 'otr_heavy_machinery', 'bicycle_specialty_tires', 'tube_accessories'];
  v2SearchKeyword = '';
  v2SelectedDays = -1;
  v2BudgetMin = '';
  v2BudgetMax = '';
  v2SelectedZone = '';
  v2UrgentOnly = false;
  v2SelectedStatus = 'all';

  updateBoqQuickButtonUI(false);

  const s1 = document.getElementById('v2-search-input');
  if (s1) s1.value = '';
  const s2 = document.getElementById('v2-global-search');
  if (s2) s2.value = '';

  document.querySelectorAll('[data-v2-type], [data-v2-group]').forEach(el => el.classList.add('active'));

  document.querySelectorAll('.btn-date-filter').forEach(b => {
    if (b.getAttribute('data-v2-days') === '-1') b.classList.add('active');
    else b.classList.remove('active');
  });

  document.querySelectorAll('.btn-budget-filter').forEach(b => {
    if (!b.getAttribute('data-v2-bmin') && !b.getAttribute('data-v2-bmax')) b.classList.add('active');
    else b.classList.remove('active');
  });

  document.querySelectorAll('.btn-zone-filter').forEach(b => {
    if (!b.getAttribute('data-v2-zone')) b.classList.add('active');
    else b.classList.remove('active');
  });

  document.querySelectorAll('.btn-status-filter').forEach(b => {
    if (b.getAttribute('data-v2-status') === 'all') b.classList.add('active');
    else b.classList.remove('active');
  });

  const urgentBtn = document.getElementById('btn-v2-quick-urgent');
  if (urgentBtn) urgentBtn.classList.remove('active');

  const zoneLabel = document.getElementById('v2-zone-active-label');
  if (zoneLabel) zoneLabel.textContent = 'แสดงทุกโซน';

  renderOpportunitiesList(v2Announcements);
  showToast('รีเซ็ตตัวกรองทั้งหมดแล้ว');
};

let searchDebounceTimer = null;
window.handleGlobalSearch = function(event) {
  clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(() => {
    v2SearchKeyword = event.target.value.trim();
    if (currentV2View === 'overview') {
      switchV2View('opportunities');
    }
    renderOpportunitiesList(v2Announcements);
  }, 300);
};

// ============================================================================
// User Feedback & Safe Non-Hiding Reject (5 Voices Rule)
// ============================================================================
window.submitV2Feedback = async function(itemId, isMatch, btnEl) {
  v2UserFeedbackMap[itemId] = {
    is_match: isMatch,
    updated_at: new Date().toISOString()
  };
  localStorage.setItem(v2FeedbackKey, JSON.stringify(v2UserFeedbackMap));

  if (isMatch === 0) {
    const prevTally = v2RejectTallyMap[itemId] || 0;
    v2RejectTallyMap[itemId] = prevTally + 1;
    localStorage.setItem(v2RejectTallyKey, JSON.stringify(v2RejectTallyMap));
  }

  // Update backend API asynchronously
  try {
    if (typeof api !== 'undefined' && typeof api.submitFeedback === 'function') {
      const item = v2Announcements.find(it => it.id === itemId);
      const projId = item ? (item.project_id || item.id) : itemId;
      api.submitFeedback(itemId, projId, isMatch);
    }
  } catch (e) {
    console.warn('submitFeedback error:', e);
  }

  updateWatchlistCountBadge();
  updateV2FeedbackCount();

  // Re-render card in place if in card view
  const cardEl = document.getElementById(`card-${itemId}`);
  if (cardEl) {
    const item = v2Announcements.find(it => it.id === itemId);
    if (item) {
      cardEl.outerHTML = generateV2CardHTML(item, 1);
    }
  }

  // Re-render table row in place if in table view
  const trowEl = document.getElementById(`trow-${itemId}`);
  if (trowEl) {
    const item = v2Announcements.find(it => it.id === itemId);
    if (item) {
      trowEl.outerHTML = generateV2TableRowHTML(item, 1);
    }
  }

  const msg = isMatch === 1 ? 'บันทึก "ใช่งานเรา" สำเร็จ' : isMatch === 2 ? 'บันทึก "อาจจะใช่" สำเร็จ' : 'บันทึก "ไม่ใช่งาน" สำเร็จ';
  showToast(msg);
};

window.undoV2Feedback = async function(itemId, btnEl) {
  delete v2UserFeedbackMap[itemId];
  localStorage.setItem(v2FeedbackKey, JSON.stringify(v2UserFeedbackMap));

  // Update backend API asynchronously to delete
  try {
    if (typeof api !== 'undefined' && typeof api.submitFeedback === 'function') {
      const item = v2Announcements.find(it => it.id === itemId);
      const projId = item ? (item.project_id || item.id) : itemId;
      api.submitFeedback(itemId, projId, null);
    }
  } catch (e) {
    console.warn('undoFeedback error:', e);
  }

  updateWatchlistCountBadge();
  updateV2FeedbackCount();

  const cardEl = document.getElementById(`card-${itemId}`);
  if (cardEl) {
    const item = v2Announcements.find(it => it.id === itemId);
    if (item) {
      cardEl.outerHTML = generateV2CardHTML(item, 1);
    }
  }

  const trowEl = document.getElementById(`trow-${itemId}`);
  if (trowEl) {
    const item = v2Announcements.find(it => it.id === itemId);
    if (item) {
      trowEl.outerHTML = generateV2TableRowHTML(item, 1);
    }
  }

  showToast('ยกเลิกตัวเลือกแล้ว');
};

// ============================================================================
// Keyword Sync Manager View Logic (113 Keywords + Live Search)
// ============================================================================
function renderKeywordTable() {
  const tbody = document.getElementById('v2-keywords-tbody');
  const countBadge = document.getElementById('v2-badge-kw-count');
  if (!tbody) return;

  const kwsObj = getV2Keywords();
  const flatKeywords = [];

  for (const [group, kwList] of Object.entries(kwsObj)) {
    const groupName = window.groupLabels[group] || group;
    kwList.forEach(kw => {
      flatKeywords.push({
        kw,
        group,
        groupName,
        active: true
      });
    });
  }

  tbody.innerHTML = flatKeywords.map((item, idx) => {
    // Count how many projects match this keyword
    const matchCount = v2Announcements.filter(it => {
      const t = (it.project_name || '').toLowerCase();
      const s = (it.boq_summary || '').toLowerCase();
      const m = (it.matched_keywords || '').toLowerCase();
      const q = item.kw.toLowerCase();
      return t.includes(q) || s.includes(q) || m.includes(q);
    }).length;

    return `
      <tr>
        <td>
          <label class="v2-toggle-switch">
            <input type="checkbox" ${item.active ? 'checked' : ''} onchange="toggleKeywordActive('${item.kw}', this.checked)">
            <span class="v2-slider"></span>
          </label>
        </td>
        <td>
          <strong style="color: #003366; font-size: 0.95rem;">${item.kw}</strong>
        </td>
        <td>
          <span class="badge group-${item.group}">${item.groupName}</span>
        </td>
        <td>
          <span style="background: ${matchCount > 0 ? '#e0f2fe' : '#f1f5f9'}; color: ${matchCount > 0 ? '#0284c7' : '#64748b'}; padding: 3px 10px; border-radius: 12px; font-weight: 700; font-size: 0.82rem;">
            ${matchCount} โครงการ
          </span>
        </td>
        <td style="text-align: right;">
          <button onclick="searchByKeyword('${item.kw}')" class="btn btn-secondary" style="padding: 4px 10px; font-size: 0.8rem; border-radius: 6px;">
            🔍 ค้นหางาน
          </button>
        </td>
      </tr>
    `;
  }).join('');

  if (countBadge) countBadge.textContent = flatKeywords.length;
}

window.toggleKeywordActive = function(kw, isActive) {
  showToast(`${isActive ? 'เปิดใช้งาน' : 'ระงับ'} คำค้น "${kw}"`);
};

window.addV2CustomKeyword = function() {
  const input = document.getElementById('v2-new-kw-input');
  const groupSelect = document.getElementById('v2-new-kw-group');
  if (!input || !input.value.trim()) return;

  const kw = input.value.trim();
  const group = groupSelect.value;

  const kws = getV2Keywords();
  if (!kws[group]) kws[group] = [];
  if (!kws[group].includes(kw)) {
    kws[group].push(kw);
    saveV2Keywords(kws);
    input.value = '';
    renderKeywordTable();
    showToast(`เพิ่มคีย์เวิร์ด "${kw}" เข้าสู่ระบบเรียบร้อย (ซิงค์ตรงกับ V1)`);
  } else {
    showToast(`คีย์เวิร์ด "${kw}" มีอยู่ในระบบแล้ว`);
  }
};

window.searchByKeyword = function(kw) {
  v2SearchKeyword = kw;
  const searchInput = document.getElementById('v2-global-search');
  if (searchInput) searchInput.value = kw;
  switchV2View('opportunities');
};

// ============================================================================
// Company Profile View Logic (ListGov Benchmark)
// ============================================================================
function loadSavedProfile() {
  const profileKey = 'veerubber_company_profile';
  let profile = {
    name: 'บริษัท วีรับเบอร์ คอร์ปอเรชั่น จำกัด (Vee Rubber)',
    capital: 3000000000,
    maxBudget: 200000000,
    expertise: 'โรงงานผู้ผลิตและจัดจำหน่ายยางรถยนต์เรเดียล ยางรถกระบะ ยางรถตู้ ยางรถบรรทุกและรถโดยสาร ยางรถจักรยานยนต์สายตรวจ ยาง OTR เครื่องจักรกลหนัก ยางรถแทรกเตอร์ ยางรถยก ยางรถจักรยาน วีลแชร์ และยางในคุณภาพส่งออกกว่า 100 ประเทศทั่วโลก',
    certs: 'มอก. 2718-2560 (ยางรถยนต์นั่ง), มอก. 2719-2560 (ยางรถกระบะ), มอก. 2720-2560 (ยางรถบรรทุก), มอก. 1042 (ยางรถจักรยานยนต์), IATF 16949, ISO 9001, ISO 14001, DOT, E-Mark'
  };

  try {
    const saved = localStorage.getItem(profileKey);
    if (saved) profile = { ...profile, ...JSON.parse(saved) };
  } catch (e) {}

  const nameInput = document.getElementById('v2-prof-company-name');
  const capInput = document.getElementById('v2-prof-capital');
  const maxInput = document.getElementById('v2-prof-max-budget');
  const expInput = document.getElementById('v2-prof-expertise');
  const certInput = document.getElementById('v2-prof-certs');

  if (nameInput) nameInput.value = profile.name;
  if (capInput) capInput.value = profile.capital;
  if (maxInput) maxInput.value = profile.maxBudget;
  if (expInput) expInput.value = profile.expertise;
  if (certInput) certInput.value = profile.certs;

  const passName = document.getElementById('passport-display-name');
  const passCap = document.getElementById('passport-display-capital');
  if (passName) passName.textContent = profile.name;
  if (passCap) passCap.textContent = window.formatMoney(profile.capital);
}

window.saveCompanyProfile = function(event) {
  event.preventDefault();
  const profile = {
    name: document.getElementById('v2-prof-company-name').value,
    capital: Number(document.getElementById('v2-prof-capital').value) || 5000000,
    maxBudget: Number(document.getElementById('v2-prof-max-budget').value) || 25000000,
    expertise: document.getElementById('v2-prof-expertise').value,
    certs: document.getElementById('v2-prof-certs').value
  };

  localStorage.setItem('veerubber_company_profile', JSON.stringify(profile));
  loadSavedProfile();
  showToast('💾 บันทึกโปรไฟล์บริษัทวีรับเบอร์เรียบร้อย');
};

// ============================================================================
// Utilities
// ============================================================================
window.copyV2Text = function(text, btn) {
  navigator.clipboard.writeText(text).then(() => {
    const orig = btn.innerHTML;
    btn.innerHTML = '✔ คัดลอกแล้ว!';
    setTimeout(() => { btn.innerHTML = orig; }, 1500);
    showToast(`คัดลอกเลข ${text} เรียบร้อย`);
  });
};

function showToast(msg) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.style.background = '#003366';
  toast.style.color = '#ffffff';
  toast.style.padding = '10px 18px';
  toast.style.borderRadius = '8px';
  toast.style.marginBottom = '10px';
  toast.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
  toast.style.fontWeight = '600';
  toast.style.fontSize = '0.88rem';
  toast.style.display = 'flex';
  toast.style.alignItems = 'center';
  toast.style.gap = '6px';
  toast.innerHTML = `<span>🛡️</span> ${msg}`;
  
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

// ============================================================================
// Slide-over Inspector Drawer Controller (Inspo Spec Benchmark)
// ============================================================================
let currentInspectedId = null;

window.openV2Inspector = function(itemId) {
  const item = (v2ArchivedAnnouncements && v2ArchivedAnnouncements.find(it => it.id === itemId))
            || v2Announcements.find(it => it.id === itemId) 
            || v2BoqAnnouncements.find(it => it.id === itemId)
            || v2Watchlist.find(it => it.id === itemId);
  if (!item) return;

  currentInspectedId = itemId;

  // Mark selected row / card
  document.querySelectorAll('.table-row-selected').forEach(el => el.classList.remove('table-row-selected'));
  const trowEl = document.getElementById(`trow-${itemId}`);
  if (trowEl) trowEl.classList.add('table-row-selected');

  // Find index in current filtered list or fallback
  const list = (window.v2CurrentFilteredList && window.v2CurrentFilteredList.length > 0)
    ? window.v2CurrentFilteredList
    : ((v2SelectedStatus === 'archived' && v2ArchivedAnnouncements) ? v2ArchivedAnnouncements : v2Announcements);
  const currentIndex = list.findIndex(it => it.id === itemId);
  const totalCount = list.length;

  const drawerEl = document.getElementById('v2-inspector-drawer');
  const backdropEl = document.getElementById('v2-inspector-backdrop');
  const indexBadge = document.getElementById('inspector-index-badge');
  const dateDisplay = document.getElementById('inspector-date-display');
  const prevBtn = document.getElementById('inspector-prev-btn');
  const nextBtn = document.getElementById('inspector-next-btn');
  const contentEl = document.getElementById('v2-inspector-content');
  const footerEl = document.getElementById('v2-inspector-footer');

  if (indexBadge) {
    indexBadge.textContent = currentIndex >= 0 ? `โครงการ #${currentIndex + 1} จาก ${totalCount}` : 'โครงการ';
  }
  if (dateDisplay) {
    dateDisplay.textContent = `ประกาศเมื่อ: ${window.formatDate(item.announce_date)}`;
  }

  if (prevBtn) prevBtn.disabled = currentIndex <= 0;
  if (nextBtn) nextBtn.disabled = currentIndex < 0 || currentIndex >= totalCount - 1;

  const projId = (item.project_id || item.id || '').replace(/-[A-Za-z0-9]+$/, '');
  const egpWebUrl = (window.getEgpPortalUrl ? window.getEgpPortalUrl(item) : `https://process5.gprocurement.go.th/egp-agpc01-web/announcement?keywordSearch=${encodeURIComponent(projId)}`);
  const origin = getMatchOriginInfo(item);
  const normType = getNormalizedType(item.announce_type);
  const typeText = window.typeLabels[normType] || window.typeLabels[item.announce_type] || item.announce_type;
  const groupText = window.groupLabels[item.product_group] || item.product_group;
  const cleanProv = extractProvince(item);
  const regInfo = window.getRegionInfo ? window.getRegionInfo(cleanProv) : null;
  const provFormatted = cleanProv 
    ? (cleanProv === 'กรุงเทพมหานคร' ? cleanProv : (cleanProv.startsWith('จ.') ? cleanProv : `จ.${cleanProv}`))
    : '';
  const provWithRegion = cleanProv 
    ? `${provFormatted} ${regInfo ? `(${regInfo.name})` : ''}`
    : 'ไม่ระบุจังหวัดในชื่อ (ตรวจใน TOR)';

  const fb = v2UserFeedbackMap[item.id];
  const isMatched = fb && fb.is_match === 1;
  const isMaybe = fb && fb.is_match === 2;
  const isRejected = fb && fb.is_match === 0;

  // Factor F estimation calculation
  const budgetNum = Number(item.budget) || 0;
  const directCostEst = Math.round(budgetNum / 1.30);
  const factorFEst = 1.3074;

  if (contentEl) {
    contentEl.innerHTML = `
      <div>
        <div style="display: flex; gap: 6px; align-items: center; margin-bottom: 8px; flex-wrap: wrap;">
          <span class="badge type-${normType.toLowerCase()}" style="font-size: 0.76rem; padding: 2px 7px;">${typeText}</span>
          <span class="badge group-${item.product_group}" style="font-size: 0.76rem; padding: 2px 7px;">${groupText}</span>
          <span style="font-size: 0.78rem; font-weight: 700; color: #0369a1; background: #e0f2fe; border: 1.5px solid #bae6fd; padding: 2px 8px; border-radius: 6px; display: inline-flex; align-items: center; gap: 4px;">
            <span>📍</span> ${provWithRegion}
          </span>
        </div>
        <h2 style="font-size: 1.2rem; font-weight: 800; color: #0f172a; line-height: 1.4; margin: 0 0 8px 0;">
          ${item.project_name || 'ไม่มีชื่อโครงการ'}
        </h2>
        <div style="font-size: 0.86rem; color: #475569; display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
          <span>🏛️</span> <strong style="color: #1e293b;">${item.department || '-'}</strong>
          ${cleanProv ? `<span style="color: #0369a1; background: #f0f9ff; border: 1px solid #bae6fd; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: 700;">📍 ${provWithRegion}</span>` : ''}
        </div>
        ${item.winner_name ? `
          <div style="background: #f1f5f9; border: 1.5px solid #cbd5e1; border-radius: 8px; padding: 10px 14px; margin-top: 10px; display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 1.3rem;">📁</span>
            <div>
              <strong style="color: #334155; font-size: 0.88rem;">โครงการนี้เคาะราคา / สิ้นสุดการเสนอราคาแล้ว</strong>
              <div style="color: #64748b; font-size: 0.8rem; margin-top: 2px;">สถานะ: <strong>${item.winner_name}</strong></div>
            </div>
          </div>
        ` : ''}
      </div>

      <!-- Financial & e-GP ID Spec Box -->
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px; display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
        <div>
          <div style="font-size: 0.74rem; font-weight: 700; color: #64748b; text-transform: uppercase;">ราคากลาง / งบประมาณ</div>
          <div style="font-size: 1.35rem; font-weight: 800; color: #047857; margin-top: 2px; font-variant-numeric: tabular-nums;">
            ${window.formatMoney(item.budget)}
          </div>
        </div>
        <div>
          <div style="font-size: 0.74rem; font-weight: 700; color: #64748b; text-transform: uppercase;">เลขที่ e-GP</div>
          <div style="font-family: ui-monospace, monospace; font-size: 0.95rem; font-weight: 700; color: #003366; margin-top: 4px; display: flex; align-items: center; gap: 6px;">
            <span>${projId}</span>
            <button type="button" onclick="copyV2Text('${projId}', this)" style="border: 1px solid #cbd5e1; background: #fff; padding: 2px 6px; border-radius: 4px; font-size: 0.72rem; cursor: pointer;" title="คัดลอก">📋</button>
          </div>
        </div>
      </div>

      <!-- 📅 Procurement Timeline Box (e-GP Real Dates) -->
      <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 14px 16px;">
        <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 10px;">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0284c7" stroke-width="2"><rect width="18" height="18" x="3" y="4" rx="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
          <span style="font-size: 0.82rem; font-weight: 700; color: #0369a1;">ไทม์ไลน์จัดซื้อจัดจ้าง</span>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 0.82rem;">
          <div style="background: #fff; border: 1px solid #e0f2fe; border-radius: 6px; padding: 8px 10px;">
            <div style="font-size: 0.7rem; font-weight: 700; color: #64748b;">📅 วันที่ประกาศ</div>
            <div style="font-weight: 700; color: #1e293b; margin-top: 2px;">${window.formatDate(item.announce_date)}</div>
          </div>
          ${item.bid_date ? `
          <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 8px 10px;">
            <div style="font-size: 0.7rem; font-weight: 700; color: #991b1b;">⏳ กำหนดยื่นซอง</div>
            <div style="font-weight: 800; color: #dc2626; margin-top: 2px;">${window.formatDate(item.bid_date)}${item.bid_time ? ' (' + item.bid_time + ')' : ''}</div>
          </div>
          ` : `
          <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 6px; padding: 8px 10px;">
            <div style="font-size: 0.7rem; font-weight: 700; color: #92400e;">⏳ กำหนดยื่นซอง</div>
            <div style="font-weight: 600; color: #b45309; margin-top: 2px;">ยังไม่ระบุ</div>
          </div>
          `}
          ${item.doc_start_date ? `
          <div style="background: #fff; border: 1px solid #e0f2fe; border-radius: 6px; padding: 8px 10px;">
            <div style="font-size: 0.7rem; font-weight: 700; color: #64748b;">📥 เริ่มรับเอกสาร</div>
            <div style="font-weight: 700; color: #1e293b; margin-top: 2px;">${window.formatDate(item.doc_start_date)}</div>
          </div>
          ` : ''}
          ${item.doc_end_date ? `
          <div style="background: #fff; border: 1px solid #e0f2fe; border-radius: 6px; padding: 8px 10px;">
            <div style="font-size: 0.7rem; font-weight: 700; color: #64748b;">📤 สิ้นสุดรับเอกสาร</div>
            <div style="font-weight: 700; color: #1e293b; margin-top: 2px;">${window.formatDate(item.doc_end_date)}</div>
          </div>
          ` : ''}
        </div>
      </div>

      <!-- BOQ / Attachments Terminal Extraction Box -->
      ${origin ? `
        <div>
          <div style="font-size: 0.82rem; font-weight: 700; color: #0f172a; margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><circle cx="11" cy="15" r="2.5"/><path d="m13 17 2.5 2.5"/></svg>
            <span>ผลการสกัดข้อมูลไฟล์แนบ BOQ / ปร.4</span>
          </div>
          <div class="v2-boq-terminal">
            <div class="v2-boq-terminal-bar">
              <span>SCANNER: ${origin.isPdf ? 'IN-MEMORY PDF ATTACHMENT PARSER' : 'TITLE PARSER'}</span>
              <span>MATCH: <strong>${origin.keyword}</strong></span>
            </div>
            ${origin.snippet ? `
              <div>
                <span style="color: #38bdf8; font-size: 0.75rem;">$ boq_snippet --extract:</span>
                <div style="margin-top: 6px; color: #e2e8f0; white-space: pre-wrap; font-size: 0.82rem;">
                  "${origin.snippet.replace(new RegExp(origin.keyword, 'gi'), match => `<mark>${match}</mark>`)}"
                </div>
              </div>
            ` : `
              <div style="color: #94a3b8; font-size: 0.82rem;">
                พบคำค้นสำคัญ <mark>${origin.keyword}</mark> ในชื่อโครงการตรงตามสเปกยางของวีรับเบอร์ 100%
              </div>
            `}
          </div>
        </div>
      ` : ''}

      <!-- Factor F Quick Intelligence Box -->
      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <span style="font-size: 0.82rem; font-weight: 700; color: #003366; display: flex; align-items: center; gap: 6px;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="16" height="20" x="4" y="2" rx="2"/><line x1="8" x2="16" y1="6" y2="6"/><line x1="16" x2="16" y1="14" y2="18"/></svg>
            <span>ประมาณการ Factor F & เพดานราคาประมูล</span>
          </span>
          <button type="button" onclick="openBiddingSimulator('${item.id}')" style="background: #0284c7; color: #fff; border: none; padding: 4px 10px; border-radius: 6px; font-size: 0.78rem; font-weight: 700; cursor: pointer;">
            เคาะราคาแบบละเอียด →
          </button>
        </div>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; text-align: center;">
          <div style="background: #f8fafc; padding: 8px; border-radius: 6px;">
            <div style="font-size: 0.72rem; color: #64748b;">ต้นทุนทางตรง (Direct Cost)</div>
            <div style="font-size: 0.92rem; font-weight: 700; color: #0f172a; margin-top: 2px;">${window.formatMoney(directCostEst)}</div>
          </div>
          <div style="background: #f8fafc; padding: 8px; border-radius: 6px;">
            <div style="font-size: 0.72rem; color: #64748b;">ตัวคูณ Factor F</div>
            <div style="font-size: 0.92rem; font-weight: 700; color: #0284c7; margin-top: 2px;">~${factorFEst.toFixed(4)}</div>
          </div>
          <div style="background: #ecfdf5; padding: 8px; border-radius: 6px;">
            <div style="font-size: 0.72rem; color: #047857;">เพดานลดราคาสูงสุด</div>
            <div style="font-size: 0.92rem; font-weight: 700; color: #047857; margin-top: 2px;">~5% – 12%</div>
          </div>
        </div>
      </div>

      <!-- Quick Document Links -->
      <div style="display: flex; gap: 10px; flex-wrap: wrap;">
        <a href="${egpWebUrl}" target="_blank" rel="noopener noreferrer" onclick="return window.openEgpWithCopy ? window.openEgpWithCopy('${projId}', event) : true" class="btn btn-secondary" style="flex: 1; min-width: 140px; text-align: center; padding: 9px 12px; font-size: 0.85rem; font-weight: 600; display: inline-flex; align-items: center; justify-content: center; gap: 6px;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" x2="21" y1="14" y2="3"/></svg>
          <span>เปิดดูใน e-GP</span>
        </a>
        <a href="detail.html?id=${encodeURIComponent(item.id)}" target="_blank" class="btn btn-outline" style="flex: 1; min-width: 140px; text-align: center; padding: 9px 12px; font-size: 0.85rem; font-weight: 600; display: inline-flex; align-items: center; justify-content: center; gap: 6px;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
          <span>เปิดหน้าเต็ม (Full)</span>
        </a>
      </div>
    `;
  }

  if (footerEl) {
    footerEl.innerHTML = `
      <div style="font-size: 0.82rem; font-weight: 700; color: #475569;">
        การตัดสินใจ:
      </div>
      <div style="display: flex; gap: 6px; align-items: center;">
        <button type="button" class="btn-ai-choice btn-ai-yes ${isMatched ? 'active' : ''}" onclick="submitV2Feedback('${item.id}', 1, this); openV2Inspector('${item.id}')" style="padding: 7px 12px; font-size: 0.82rem;">
          ${isMatched ? '✔ ใช่งานเรา' : '👍 ใช่ (งานเรา)'}
        </button>
        <button type="button" class="btn-ai-choice btn-ai-maybe ${isMaybe ? 'active' : ''}" onclick="submitV2Feedback('${item.id}', 2, this); openV2Inspector('${item.id}')" style="padding: 7px 12px; font-size: 0.82rem;">
          ${isMaybe ? '✔ อาจจะใช่' : '🤔 อาจจะใช่'}
        </button>
        <button type="button" class="btn-ai-choice btn-ai-no ${isRejected ? 'active' : ''}" onclick="submitV2Feedback('${item.id}', 0, this); openV2Inspector('${item.id}')" style="padding: 7px 12px; font-size: 0.82rem;">
          ${isRejected ? '✔ ไม่ใช่งาน' : '👎 ไม่ใช่งาน'}
        </button>
      </div>
    `;
  }

  if (drawerEl) drawerEl.classList.add('active');
  if (backdropEl) backdropEl.classList.add('active');
};

window.closeV2Inspector = function() {
  currentInspectedId = null;
  const drawerEl = document.getElementById('v2-inspector-drawer');
  const backdropEl = document.getElementById('v2-inspector-backdrop');
  if (drawerEl) drawerEl.classList.remove('active');
  if (backdropEl) backdropEl.classList.remove('active');
  document.querySelectorAll('.table-row-selected').forEach(el => el.classList.remove('table-row-selected'));
};

window.navigateV2Inspector = function(direction) {
  if (!currentInspectedId) return;
  const list = (window.v2CurrentFilteredList && window.v2CurrentFilteredList.length > 0)
    ? window.v2CurrentFilteredList
    : v2Announcements;
  const currentIndex = list.findIndex(it => it.id === currentInspectedId);
  if (currentIndex === -1) return;

  const newIndex = currentIndex + direction;
  if (newIndex >= 0 && newIndex < list.length) {
    openV2Inspector(list[newIndex].id);
  }
};

// Keyboard Shortcuts (Inspo Enterprise UX)
document.addEventListener('keydown', (e) => {
  // 1. Ctrl+K or Cmd+K or / to search
  if (((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') || (e.key === '/' && document.activeElement?.tagName !== 'INPUT')) {
    e.preventDefault();
    const searchInput = document.getElementById('v2-search-input') || document.getElementById('v2-global-search');
    if (searchInput) {
      searchInput.focus();
      searchInput.select();
    }
    return;
  }

  // 2. Escape to close inspector or modal
  if (e.key === 'Escape') {
    closeV2Inspector();
    if (typeof closeBiddingSimulator === 'function') closeBiddingSimulator();
    return;
  }

  // 3. Arrow Up / Down or J / K when inspector is active
  const drawerEl = document.getElementById('v2-inspector-drawer');
  if (drawerEl && drawerEl.classList.contains('active')) {
    const tag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
    if (tag === 'input' || tag === 'textarea') return;

    if (e.key === 'ArrowUp' || e.key.toLowerCase() === 'k') {
      e.preventDefault();
      navigateV2Inspector(-1);
    } else if (e.key === 'ArrowDown' || e.key.toLowerCase() === 'j') {
      e.preventDefault();
      navigateV2Inspector(1);
    } else if (e.key === '1' || e.key.toLowerCase() === 'y') {
      if (currentInspectedId) {
        submitV2Feedback(currentInspectedId, 1);
        openV2Inspector(currentInspectedId);
      }
    } else if (e.key === '2' || e.key.toLowerCase() === 'm') {
      if (currentInspectedId) {
        submitV2Feedback(currentInspectedId, 2);
        openV2Inspector(currentInspectedId);
      }
    } else if (e.key === '0' || e.key.toLowerCase() === 'n') {
      if (currentInspectedId) {
        submitV2Feedback(currentInspectedId, 0);
        openV2Inspector(currentInspectedId);
      }
    }
  }
});

