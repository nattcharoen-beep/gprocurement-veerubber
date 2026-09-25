import { Hono } from 'hono';

const router = new Hono();

const BASE_EXCLUSIONS = [
  'announce_type IN ("P0", "B0", "B1", "B2", "B3", "15", "D0", "D1", "IM", "BOQ")',
  '(winner_name IS NULL OR winner_name = "")',
  'announce_type NOT IN ("W0", "W1", "W2")',
  'project_name NOT LIKE "%ยกเลิก%"',
  'project_id IS NOT NULL',
  '(project_id LIKE "70%" OR project_id LIKE "69%" OR project_id LIKE "68%")',
  'budget IS NOT NULL AND budget > 0',
  'id NOT IN (SELECT announcement_id FROM project_feedback WHERE is_match = 0 GROUP BY announcement_id HAVING COUNT(DISTINCT user_id) >= 5)',
  // Strict Exclusion: Any project_id where ANY stage has been contracted, bidded, or won
  'project_id NOT IN (SELECT project_id FROM announcements WHERE (winner_name IS NOT NULL AND winner_name != "") OR announce_type IN ("W0", "W1", "W2"))',
  // Deduplication: If tender announcement (D0/D1/IM) exists, suppress obsolete earlier stages (15/BOQ/B0)
  'NOT (announce_type IN ("15", "BOQ", "B0", "B1", "B2", "B3") AND project_id IN (SELECT project_id FROM announcements WHERE announce_type IN ("D0", "D1", "IM")))'
];

// Post-query exclusion keywords for Vee Rubber (filtered in JS)
export const POST_EXCLUSIONS = [
  'ยางลบ', 'ตรายาง', 'หมึกตรายาง', 'ยางรัดของ', 'ยางรัด', 'ยางวง',
  'ถุงมือยาง', 'ถุงมือตรวจโรค', 'ถุงมือแพทย์', 'ถุงมือผ่าตัด', 'ถุงยางอนามัย',
  'น้ำยางพารา', 'ยางพาราแผ่น', 'ขี้ยาง', 'กล้ายางพารา', 'ต้นยางพารา', 'กรีดยาง', 'สวนยางพารา',
  'ยางมะตอย', 'ยางมะตอยผสมเสร็จ', 'แอสฟัลต์', 'แอสฟัลท์', 'ผิวทางแอสฟัลต์', 'ยางหยอดรอยต่อ',
  'แผ่นยางปูพื้น', 'ยางปูพื้น', 'กระเบื้องยาง', 'ยางกันชนเสา',
  'ขอบยางกระจก', 'ขอบยางประตู', 'ขอบยางตู้เย็น', 'ซีลยาง', 'ปะเก็นยาง', 'สายยางฉีดน้ำ', 'สายยางรดน้ำ',
  'ปะยาง', 'ค่าปะยาง', 'จ้างปะยาง',
  'จ้างออกแบบ', 'จ้างที่ปรึกษา', 'อาหารกลางวัน', 'จัดเลี้ยง', 'ชุดกีฬา', 'ลูกฟุตบอล'
];

export function isExcludedRow(row) {
  const name = (row.project_name || '').toLowerCase();
  
  // 1. If explicitly cancelled, exclude
  if (name.includes('ยกเลิก')) return true;

  // 1.1 If verified by AI In-Memory BOQ Scanner, KEEP IT!
  if (row.doc_verified === 1 || row.boq_summary) return false;

  // 2. Core tire business terms for Vee Rubber
  const isCoreTireBusiness = [
    'ยางรถยนต์', 'ยางรถกระบะ', 'ยางรถปิกอัพ', 'ยางรถตู้', 'ยางรถบรรทุก', 'ยางรถจักรยานยนต์', 'ยางมอเตอร์ไซค์',
    'ยางเรเดียล', 'ยาง radial', 'ยาง otr', 'ยางเครื่องจักรกล', 'ยางรถแทรกเตอร์', 'ยางรถไถ', 'ยางรถตัก',
    'ยางรถเกลี่ยดิน', 'ยางรถบด', 'ยางรถยก', 'ยาง forklift', 'ยางตัน', 'ยางลมรถยก', 'ยางรถจักรยาน',
    'ยางวีลแชร์', 'ยางใน', 'ยางในบิวทิล', 'ยางรองคอด', 'จุ๊บลมยาง', 'จัดซื้อยาง', 'ซื้อยาง'
  ].some(k => name.includes(k));

  if (isCoreTireBusiness) {
    const hardExcludes = ['ยางมะตอย', 'แอสฟัลต์', 'ถุงมือยาง', 'ยางลบ', 'ตรายาง', 'ปะยาง', 'น้ำยางพารา'];
    return hardExcludes.some(kw => name.includes(kw));
  }

  return POST_EXCLUSIONS.some(kw => name.includes(kw.toLowerCase()));
}

export const REGION_MAP = {
  'bkk': ['กรุงเทพมหานคร'],
  'central': ['นนทบุรี', 'ปทุมธานี', 'พระนครศรีอยุธยา', 'สระบุรี', 'นครนายก', 'ลพบุรี', 'สิงห์บุรี', 'อ่างทอง', 'ชัยนาท', 'สมุทรปราการ', 'สมุทรสงคราม', 'สมุทรสาคร', 'นครปฐม', 'สุพรรณบุรี'],
  'east': ['ชลบุรี', 'ระยอง', 'จันทบุรี', 'ตราด', 'ฉะเชิงเทรา', 'ปราจีนบุรี', 'สระแก้ว'],
  'north': ['เชียงใหม่', 'เชียงราย', 'ลำปาง', 'ลำพูน', 'แม่ฮ่องสอน', 'น่าน', 'พะเยา', 'แพร่', 'อุตรดิตถ์', 'สุโขทัย', 'พิษณุโลก', 'พิจิตร', 'กำแพงเพชร', 'เพชรบูรณ์', 'นครสวรรค์', 'อุทัยธานี'],
  'northeast': ['นครราชสีมา', 'ขอนแก่น', 'อุดรธานี', 'อุบลราชธานี', 'บุรีรัมย์', 'สุรินทร์', 'ศรีสะเกษ', 'ชัยภูมิ', 'มหาสารคาม', 'ร้อยเอ็ด', 'กาฬสินธุ์', 'สกลนคร', 'นครพนม', 'มุกดาหาร', 'ยโสธร', 'อำนาจเจริญ', 'หนองคาย', 'เลย', 'หนองบัวลำภู', 'บึงกาฬ'],
  'west': ['กาญจนบุรี', 'ตาก', 'ราชบุรี', 'เพชรบุรี', 'ประจวบคีรีขันธ์'],
  'south': ['ชุมพร', 'ระนอง', 'สุราษฎร์ธานี', 'นครศรีธรรมราช', 'กระบี่', 'พังงา', 'ภูเก็ต', 'ตรัง', 'พัทลุง', 'สงขลา', 'สตูล', 'ปัตตานี', 'ยะลา', 'นราธิวาส']
};

REGION_MAP['กทม'] = REGION_MAP['bkk'];
REGION_MAP['ภาคกลาง'] = REGION_MAP['central'];
REGION_MAP['ภาคตะวันออก'] = REGION_MAP['east'];
REGION_MAP['ภาคเหนือ'] = REGION_MAP['north'];
REGION_MAP['ภาคอีสาน'] = REGION_MAP['northeast'];
REGION_MAP['ภาคตะวันตก'] = REGION_MAP['west'];
REGION_MAP['ภาคใต้'] = REGION_MAP['south'];

router.get('/', async (c) => {
  try {
    const db = c.env.DB;
    const type = c.req.query('type');
    const group = c.req.query('group');
    const search = c.req.query('search');
    const budget_min = c.req.query('budget_min');
    const budget_max = c.req.query('budget_max');
    const region = c.req.query('region');
    
    const page = parseInt(c.req.query('page') || '1', 10);
    const limit = parseInt(c.req.query('limit') || '20', 10);
    const offset = (page - 1) * limit;

    const status = c.req.query('status');
    let conditions = [];
    if (status === 'archive') {
      conditions = [
        '((winner_name IS NOT NULL AND winner_name != "") OR announce_type IN ("W0", "W1", "W2"))',
        'project_id IS NOT NULL',
        '(project_id LIKE "70%" OR project_id LIKE "69%" OR project_id LIKE "68%")',
        'budget IS NOT NULL AND budget > 0'
      ];
    } else {
      conditions = [...BASE_EXCLUSIONS];
    }
    let params = [];

    if (type) {
      const rawTypes = type.split(',');
      const expandedTypes = new Set(rawTypes);
      if (rawTypes.includes('D0')) {
        expandedTypes.add('D1');
      }
      if (rawTypes.includes('B0')) {
        expandedTypes.add('B1');
        expandedTypes.add('B2');
        expandedTypes.add('B3');
      }
      if (rawTypes.includes('15')) {
        expandedTypes.add('BOQ');
      }
      const types = Array.from(expandedTypes);
      conditions.push(`announce_type IN (${types.map(() => '?').join(',')})`);
      params.push(...types);
    }
    if (group) {
      const groups = group.split(',');
      conditions.push(`product_group IN (${groups.map(() => '?').join(',')})`);
      params.push(...groups);
    }
    const province = c.req.query('province');
    if (province) {
      conditions.push(`province = ?`);
      params.push(province);
    }
    const boq_only = c.req.query('boq_only') || c.req.query('doc_verified');
    if (boq_only === '1' || boq_only === 'true') {
      conditions.push(`(doc_verified = 1 OR (boq_summary IS NOT NULL AND boq_summary != ''))`);
    }

    if (search) {
      const s = `%${search}%`;
      conditions.push(`(project_name LIKE ? OR department LIKE ? OR province LIKE ? OR winner_name LIKE ? OR project_id LIKE ? OR boq_summary LIKE ?)`);
      params.push(s, s, s, s, s, s);
    }
    if (budget_min) {
      conditions.push(`budget >= ?`);
      params.push(Number(budget_min));
    }
    if (budget_max) {
      conditions.push(`budget <= ?`);
      params.push(Number(budget_max));
    }
    if (!budget_max && status !== 'archive') {
      conditions.push(`(budget <= 200000000 OR budget IS NULL)`);
    }

    if (region && REGION_MAP[region]) {
      const provs = REGION_MAP[region];
      const placeholders = provs.map(() => '?').join(',');
      conditions.push(`province IN (${placeholders})`);
      params.push(...provs);
    }

    const date = c.req.query('date');
    if (date) {
      conditions.push(`date(announce_date) = date(?)`);
      params.push(date);
    }

    const date_start = c.req.query('date_start');
    if (date_start) {
      conditions.push(`date(announce_date) >= date(?)`);
      params.push(date_start);
    }

    const date_end = c.req.query('date_end');
    if (date_end) {
      conditions.push(`date(announce_date) <= date(?)`);
      params.push(date_end);
    }

    const sort = c.req.query('sort') || 'date_desc';
    let orderBy = 'announce_date DESC';
    if (sort === 'budget_desc') orderBy = 'budget DESC';
    if (sort === 'budget_asc') orderBy = 'budget ASC';
    if (sort === 'date_asc') orderBy = 'announce_date ASC';

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Fetch raw results matching DB query
    const { results: rawResults } = await db.prepare(`
      SELECT * FROM announcements 
      ${whereClause}
      ORDER BY ${orderBy}
    `).bind(...params).all();

    // Post-query filter: exclude records matching POST_EXCLUSIONS
    const filtered = (rawResults || []).filter(row => !isExcludedRow(row));

    // Exact total
    const total = filtered.length;

    // Apply pagination limit after filtering
    const results = filtered.slice(offset, offset + limit);

    return c.json({
      data: results,
      pagination: { page, limit, total }
    });
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

router.get('/stats', async (c) => {
  try {
    const db = c.env.DB;
    const date = c.req.query('date');
    const date_start = c.req.query('date_start');
    const date_end = c.req.query('date_end');
    const budget_min = c.req.query('budget_min');
    const budget_max = c.req.query('budget_max');

    let conditions = [...BASE_EXCLUSIONS];
    let params = [];

    if (budget_min) {
      conditions.push(`budget >= ?`);
      params.push(Number(budget_min));
    }
    if (budget_max) {
      conditions.push(`budget <= ?`);
      params.push(Number(budget_max));
    }
    if (!budget_max) {
      conditions.push(`(budget <= 200000000 OR budget IS NULL)`);
    }

    if (date) {
      conditions.push(`date(announce_date) = date(?)`);
      params.push(date);
    } else {
      if (date_start) {
        conditions.push(`date(announce_date) >= date(?)`);
        params.push(date_start);
      }
      if (date_end) {
        conditions.push(`date(announce_date) <= date(?)`);
        params.push(date_end);
      }
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Fetch candidate records to compute exact filtered stats
    const { results: allRows } = await db.prepare(`
      SELECT announce_type, product_group, province, project_name, boq_summary, doc_verified
      FROM announcements 
      ${whereClause}
    `).bind(...params).all();

    const validRows = (allRows || []).filter(row => !isExcludedRow(row));

    // Compute exact byType
    const typeCounts = { 'D0': 0, 'B0': 0, '15': 0, 'P0': 0 };
    validRows.forEach(r => {
      let t = r.announce_type;
      if (t === 'D1' || t === 'IM') t = 'D0';
      else if (t === 'B1' || t === 'B2' || t === 'B3') t = 'B0';
      else if (t === 'BOQ') t = '15';
      if (typeCounts[t] !== undefined) {
        typeCounts[t]++;
      }
    });
    const byType = Object.entries(typeCounts).map(([announce_type, count]) => ({ announce_type, count }));

    // Compute exact boqVerifiedCount
    const boqVerifiedCount = validRows.filter(r => (r.doc_verified === 1 || (r.boq_summary && r.boq_summary.trim() !== ''))).length;

    // Compute exact byGroup
    const groupCounts = {};
    validRows.forEach(r => {
      const g = r.product_group || 'other';
      groupCounts[g] = (groupCounts[g] || 0) + 1;
    });
    const byGroup = Object.entries(groupCounts).map(([product_group, count]) => ({ product_group, count }));

    // Compute exact byRegion
    const PROV_TO_REG = {};
    Object.entries(REGION_MAP).forEach(([reg, provs]) => {
      if (['bkk', 'central', 'east', 'north', 'northeast', 'west', 'south'].includes(reg)) {
        provs.forEach(p => { PROV_TO_REG[p] = reg; });
      }
    });

    const regionCounts = {
      'bkk': 0, 'central': 0, 'east': 0, 'north': 0, 'northeast': 0, 'west': 0, 'south': 0
    };
    validRows.forEach(r => {
      const p = (r.province || '').replace(/^จ(ังหวัด|\.)\s*/, '').trim();
      const reg = PROV_TO_REG[p] || 'other';
      if (regionCounts[reg] !== undefined) {
        regionCounts[reg]++;
      }
    });
    const byRegion = Object.entries(regionCounts).map(([region, count]) => ({ region, count }));

    // Compute exact archiveCount (projects that have bidded/contracted or won)
    let archiveCount = 0;
    try {
      const { results: archiveRow } = await db.prepare(`
        SELECT COUNT(*) as cnt FROM announcements 
        WHERE ((winner_name IS NOT NULL AND winner_name != "") OR announce_type IN ("W0", "W1", "W2"))
          AND project_id IS NOT NULL
          AND (project_id LIKE "70%" OR project_id LIKE "69%" OR project_id LIKE "68%")
          AND budget IS NOT NULL AND budget > 0
      `).all();
      archiveCount = archiveRow?.[0]?.cnt || 0;
    } catch (e) {
      console.error('Failed to get archiveCount:', e);
    }

    return c.json({
      data: {
        byType,
        byGroup,
        byRegion,
        boqVerifiedCount,
        archiveCount
      }
    });
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

router.get('/:id', async (c) => {
  try {
    const db = c.env.DB;
    const id = c.req.param('id');
    const result = await db.prepare('SELECT * FROM announcements WHERE id = ?').bind(id).first();
    if (!result) return c.json({ error: 'Not found' }, 404);
    return c.json({ data: result });
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

export default router;
