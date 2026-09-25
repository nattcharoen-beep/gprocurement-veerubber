import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth.js';

const router = new Hono();
router.use('*', requireAuth);

router.get('/', async (c) => {
  const user = c.get('user');
  const db = c.env.DB;

  const { results } = await db.prepare(`
    SELECT b.id as bookmark_id, b.note, b.created_at as bookmarked_at, a.* 
    FROM bookmarks b
    JOIN announcements a ON b.announcement_id = a.id
    WHERE b.user_id = ?
    ORDER BY b.created_at DESC
  `).bind(user.id).all();

  return c.json({ data: results });
});

router.post('/:announcementId', async (c) => {
  const user = c.get('user');
  const announcementId = c.req.param('announcementId');
  const db = c.env.DB;
  const body = await c.req.json().catch(() => ({}));
  const note = body.note || null;

  const existing = await db.prepare('SELECT id FROM bookmarks WHERE user_id = ? AND announcement_id = ?')
    .bind(user.id, announcementId).first();

  if (existing) {
    // Update note if exists
    await db.prepare('UPDATE bookmarks SET note = ? WHERE id = ?').bind(note, existing.id).run();
    return c.json({ data: { message: 'Bookmark updated' } });
  }

  const id = crypto.randomUUID();
  await db.prepare(`
    INSERT INTO bookmarks (id, user_id, announcement_id, note)
    VALUES (?, ?, ?, ?)
  `).bind(id, user.id, announcementId, note).run();

  return c.json({ data: { message: 'Bookmarked successfully' } });
});

router.delete('/:announcementId', async (c) => {
  const user = c.get('user');
  const announcementId = c.req.param('announcementId');
  const db = c.env.DB;

  await db.prepare('DELETE FROM bookmarks WHERE user_id = ? AND announcement_id = ?')
    .bind(user.id, announcementId).run();

  return c.json({ data: { message: 'Bookmark removed' } });
});

export default router;
