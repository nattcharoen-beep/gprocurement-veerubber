import { Hono } from 'hono';
import { REGION_MAP } from './announcements.js';

const router = new Hono();

function getStartDateForYears(years) {
  if (!years || years === 'all') return null;
  const y = parseInt(years, 10);
  if (isNaN(y)) return null;

  // Fiscal year cutoffs (FY starts Oct 1):
  // 1 year back: FY 2568 - 2569 (from Oct 1, 2024 onwards) -> Strict 1-year window, excludes 66 and 63
  // 2 years back: FY 2567 - 2569 (from Oct 1, 2023 onwards) -> Includes 66, excludes 63
  // 5 years back: FY 2563 - 2569 (from Jan 1, 2020 onwards) -> Includes 63 (Uttaradit, Phayao)
  // 10 years back: FY 2558 - 2569 (from Jan 1, 2015 onwards) -> Includes 61 (Mahasarakham)
  if (y === 1) return '2024-10-01';
  if (y === 2) return '2023-10-01';
  if (y === 5) return '2020-01-01';
  if (y === 10) return '2015-01-01';

  const targetYear = 2026 - y;
  return `${targetYear}-01-01`;
}

router.get('/', async (c) => {
  const db = c.env.DB;
  const group = c.req.query('group');
  const company = c.req.query('company');
  const region = c.req.query('region');
  const years = c.req.query('years');
  
  const page = parseInt(c.req.query('page') || '1', 10);
  const limit = parseInt(c.req.query('limit') || '20', 10);
  const offset = (page - 1) * limit;

  let conditions = ['announce_type IN ("W0", "W1")'];
  let params = [];

  if (group) {
    conditions.push('product_group = ?');
    params.push(group);
  }
  const search = c.req.query('search') || company;
  if (search) {
    conditions.push('(winner_name LIKE ? OR project_name LIKE ? OR project_id LIKE ?)');
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (region) {
    const rKey = region.toLowerCase();
    const provs = REGION_MAP[rKey];
    if (provs && provs.length > 0) {
      const expandedProvs = provs.flatMap(p => [p, `จังหวัด${p}`, `จ.${p}`, `จ. ${p}`]);
      conditions.push(`province IN (${expandedProvs.map(() => '?').join(',')})`);
      params.push(...expandedProvs);
    }
  }
  const date = c.req.query('date');
  let date_start = c.req.query('date_start') || getStartDateForYears(years);
  const date_end = c.req.query('date_end');

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

  const whereClause = `WHERE ${conditions.join(' AND ')}`;

  const countQuery = `SELECT COUNT(*) as total FROM announcements ${whereClause}`;
  const countResult = await db.prepare(countQuery).bind(...params).first();
  const total = countResult ? countResult.total : 0;

  const dataQuery = `SELECT * FROM announcements ${whereClause} ORDER BY announce_date DESC LIMIT ? OFFSET ?`;
  const { results } = await db.prepare(dataQuery).bind(...params, limit, offset).all();

  return c.json({
    data: results,
    pagination: { page, limit, total }
  });
});

router.get('/stats', async (c) => {
  const db = c.env.DB;
  const years = c.req.query('years');
  const date_start = c.req.query('date_start') || getStartDateForYears(years);
  
  let dateFilter = '';
  let params = [];
  
  if (date_start) {
    dateFilter = ' AND date(announce_date) >= date(?)';
    params.push(date_start);
  }
  
  // Top winning companies
  const topCompanies = await db.prepare(`
    SELECT winner_name, COUNT(*) as win_count, SUM(winner_price) as total_value
    FROM announcements 
    WHERE announce_type IN ('W0', 'W1') AND winner_name IS NOT NULL ${dateFilter}
    GROUP BY winner_name
    ORDER BY win_count DESC
    LIMIT 10
  `).bind(...params).all();

  // Avg discount by product group
  const avgDiscount = await db.prepare(`
    SELECT product_group, AVG(discount_percent) as avg_discount, COUNT(*) as project_count
    FROM announcements 
    WHERE announce_type IN ('W0', 'W1') AND discount_percent IS NOT NULL ${dateFilter}
    GROUP BY product_group
  `).bind(...params).all();

  return c.json({
    data: {
      topCompanies: topCompanies.results,
      groupStats: avgDiscount.results
    }
  });
});

export default router;
