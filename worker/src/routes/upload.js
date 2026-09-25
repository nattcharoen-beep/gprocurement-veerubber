import { Hono } from 'hono';

const router = new Hono();

router.post('/announcements', async (c) => {
  const apiKey = c.req.header('X-API-Key');
  if (!apiKey || apiKey !== c.env.API_KEY) {
    return c.json({ error: 'Unauthorized: Invalid API Key' }, 401);
  }

  const announcements = await c.req.json();
  if (!Array.isArray(announcements)) {
    return c.json({ error: 'Body must be an array of announcements' }, 400);
  }

  const db = c.env.DB;
  let inserted = 0;
  let errors = 0;

  // Ideally, use batching for performance in production
  for (const item of announcements) {
    try {
      await db.prepare(`
        INSERT INTO announcements (
          id, project_id, project_name, announce_type, announce_date, 
          budget, department, province, product_group, url,
          winner_name, winner_price, winner_tax_id, discount_percent,
          boq_summary, boq_matches, doc_verified,
          doc_start_date, doc_end_date, bid_date, bid_time, flow_name,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(id) DO UPDATE SET
          project_id = excluded.project_id,
          project_name = excluded.project_name,
          announce_type = excluded.announce_type,
          announce_date = excluded.announce_date,
          budget = excluded.budget,
          department = excluded.department,
          province = excluded.province,
          product_group = excluded.product_group,
          url = excluded.url,
          flow_name = COALESCE(excluded.flow_name, announcements.flow_name),
          winner_name = COALESCE(excluded.winner_name, announcements.winner_name),
          winner_price = COALESCE(excluded.winner_price, announcements.winner_price),
          winner_tax_id = COALESCE(excluded.winner_tax_id, announcements.winner_tax_id),
          discount_percent = COALESCE(excluded.discount_percent, announcements.discount_percent),
          boq_summary = COALESCE(excluded.boq_summary, announcements.boq_summary),
          boq_matches = COALESCE(excluded.boq_matches, announcements.boq_matches),
          doc_verified = MAX(excluded.doc_verified, announcements.doc_verified),
          doc_start_date = COALESCE(excluded.doc_start_date, announcements.doc_start_date),
          doc_end_date = COALESCE(excluded.doc_end_date, announcements.doc_end_date),
          bid_date = COALESCE(excluded.bid_date, announcements.bid_date),
          bid_time = COALESCE(excluded.bid_time, announcements.bid_time),
          updated_at = CURRENT_TIMESTAMP
      `).bind(
        item.id || crypto.randomUUID(),
        item.project_id || null,
        item.project_name,
        item.announce_type,
        item.announce_date || null,
        item.budget || null,
        item.department || null,
        item.province || null,
        item.product_group || null,
        item.url || null,
        item.winner_name || null,
        item.winner_price || null,
        item.winner_tax_id || null,
        item.discount_percent || null,
        item.boq_summary || null,
        item.boq_matches ? (typeof item.boq_matches === 'string' ? item.boq_matches : JSON.stringify(item.boq_matches)) : null,
        item.doc_verified ? 1 : 0,
        item.doc_start_date || null,
        item.doc_end_date || null,
        item.bid_date || null,
        item.bid_time || null,
        item.flow_name || null
      ).run();
      inserted++;
    } catch (err) {
      // Error logged silently
      errors++;
    }
  }

  // Log the fetch operation
  const logId = crypto.randomUUID();
  await db.prepare(`
    INSERT INTO fetch_logs (id, status, items_fetched, errors)
    VALUES (?, ?, ?, ?)
  `).bind(logId, errors > 0 ? 'completed_with_errors' : 'success', inserted, errors > 0 ? 'Check logs for details' : null).run();

  return c.json({
    data: {
      message: 'Upload completed',
      inserted,
      errors
    }
  });
});

router.get('/subscribers', async (c) => {
  const apiKey = c.req.header('X-API-Key');
  if (!apiKey || apiKey !== c.env.API_KEY) {
    return c.json({ error: 'Unauthorized: Invalid API Key' }, 401);
  }

  const db = c.env.DB;
  try {
    const { results } = await db.prepare(`
      SELECT email, name FROM users 
      WHERE receive_email = 1 AND status = 'approved'
    `).all();

    return c.json({
      data: results || []
    });
  } catch (err) {
    return c.json({ error: 'Failed to fetch subscribers' }, 500);
  }
});

router.post('/update-boq', async (c) => {
  const apiKey = c.req.header('X-API-Key');
  if (!apiKey || apiKey !== c.env.API_KEY) {
    return c.json({ error: 'Unauthorized: Invalid API Key' }, 401);
  }

  const updates = await c.req.json();
  if (!Array.isArray(updates)) {
    return c.json({ error: 'Body must be an array of updates' }, 400);
  }

  const db = c.env.DB;
  let updated = 0;
  let errors = 0;

  for (const item of updates) {
    try {
      const boqMatchesStr = item.boq_matches 
        ? (typeof item.boq_matches === 'string' ? item.boq_matches : JSON.stringify(item.boq_matches)) 
        : null;

      await db.prepare(`
        UPDATE announcements
        SET boq_summary = ?,
            boq_matches = ?,
            doc_verified = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE project_id = ? OR id = ?
      `).bind(
        item.boq_summary || null,
        boqMatchesStr,
        item.doc_verified ? 1 : 0,
        item.project_id || item.id,
        item.id || item.project_id
      ).run();
      updated++;
    } catch (err) {
      errors++;
    }
  }

  return c.json({
    data: {
      message: 'BOQ update completed',
      updated,
      errors
    }
  });
});

export default router;
