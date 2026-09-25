import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth.js';

const router = new Hono();

// All feedback endpoints require authentication
router.use('*', requireAuth);

/**
 * POST /api/feedback
 * Submit or update feedback for an announcement
 * Body: { announcement_id, project_id, is_match: 1 | 0 | null, reason, note }
 */
router.post('/', async (c) => {
  const user = c.get('user');
  const db = c.env.DB;

  try {
    const { announcement_id, project_id, is_match, reason, note } = await c.req.json();

    if (!announcement_id) {
      return c.json({ error: 'announcement_id is required' }, 400);
    }

    // If is_match is null, remove the feedback (undo/cancel)
    if (is_match === null || is_match === undefined) {
      await db.prepare(`
        DELETE FROM project_feedback 
        WHERE user_id = ? AND announcement_id = ?
      `).bind(user.id, announcement_id).run();

      return c.json({ data: { message: 'Feedback removed', is_match: null } });
    }

    let matchVal = Number(is_match);
    if (![0, 1, 2].includes(matchVal)) matchVal = 0;
    const reasonVal = reason ? String(reason).trim() : null;
    const noteVal = note ? String(note).trim() : null;
    const id = `${user.id}_${announcement_id}`;

    await db.prepare(`
      INSERT OR REPLACE INTO project_feedback (
        id, user_id, user_email, announcement_id, project_id, is_match, reason, note, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(
      id,
      user.id,
      user.email,
      announcement_id,
      project_id || null,
      matchVal,
      reasonVal,
      noteVal
    ).run();

    let msg = 'บันทึกเรียบร้อย';
    if (matchVal === 1) msg = 'บันทึกว่าเป็นงานตรงสาย (เข้าคลังเรียนรู้เชิงบวก)';
    else if (matchVal === 2) msg = 'บันทึกว่าอาจจะใช่ (เข้าคลังงานรอพิจารณา)';
    else if (matchVal === 0) msg = 'บันทึกว่าไม่ใช่งาน (เข้าคลังเรียนรู้คำบล็อก)';

    return c.json({
      data: {
        announcement_id,
        is_match: matchVal,
        reason: reasonVal,
        note: noteVal,
        message: msg
      }
    });
  } catch (err) {
    console.error('Error in POST /api/feedback:', err);
    return c.json({ error: err.message }, 500);
  }
});

/**
 * GET /api/feedback/mine
 * Returns a map of all announcements the current user has rated
 */
router.get('/mine', async (c) => {
  const user = c.get('user');
  const db = c.env.DB;

  try {
    const { results } = await db.prepare(`
      SELECT announcement_id, project_id, is_match, reason, note, updated_at
      FROM project_feedback
      WHERE user_id = ?
    `).bind(user.id).all();

    const map = {};
    (results || []).forEach(row => {
      map[row.announcement_id] = {
        is_match: row.is_match,
        reason: row.reason,
        note: row.note,
        updated_at: row.updated_at
      };
    });

    return c.json({ data: map });
  } catch (err) {
    console.error('Error in GET /api/feedback/mine:', err);
    return c.json({ error: err.message }, 500);
  }
});

/**
 * GET /api/feedback/stats
 * Aggregated stats across all users for intelligence and model training
 */
router.get('/stats', async (c) => {
  const db = c.env.DB;

  try {
    // Total counts
    const countRes = await db.prepare(`
      SELECT 
        SUM(CASE WHEN is_match = 1 THEN 1 ELSE 0 END) as matched_count,
        SUM(CASE WHEN is_match = 2 THEN 1 ELSE 0 END) as maybe_count,
        SUM(CASE WHEN is_match = 0 THEN 1 ELSE 0 END) as rejected_count,
        COUNT(*) as total_feedback
      FROM project_feedback
    `).first();

    // Group by reason for rejections
    const { results: reasons } = await db.prepare(`
      SELECT reason, COUNT(*) as count
      FROM project_feedback
      WHERE is_match = 0 AND reason IS NOT NULL AND reason != ''
      GROUP BY reason
      ORDER BY count DESC
    `).all();

    // Projects with 5+ negative votes (candidate for global suppression/blacklist)
    const { results: multiRejected } = await db.prepare(`
      SELECT 
        announcement_id, 
        project_id,
        COUNT(DISTINCT user_id) as negative_votes,
        GROUP_CONCAT(DISTINCT reason) as reasons
      FROM project_feedback
      WHERE is_match = 0
      GROUP BY announcement_id
      HAVING COUNT(DISTINCT user_id) >= 5
    `).all();

    return c.json({
      data: {
        summary: countRes || { matched_count: 0, rejected_count: 0, total_feedback: 0 },
        reasons: reasons || [],
        multi_rejected: multiRejected || []
      }
    });
  } catch (err) {
    console.error('Error in GET /api/feedback/stats:', err);
    return c.json({ error: err.message }, 500);
  }
});

export default router;
