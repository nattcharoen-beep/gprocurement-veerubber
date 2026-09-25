import { Hono } from 'hono';
import { requireAuth, requireAdmin, hashPassword } from '../middleware/auth.js';

const router = new Hono();

// ==========================================
// 1. Initial Admin Seeding (API Key Protected)
// ==========================================
router.post('/seed', async (c) => {
  const apiKey = c.req.header('X-API-Key');
  if (!apiKey || apiKey !== c.env.API_KEY) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const db = c.env.DB;
  const adminEmail = c.env.ADMIN_EMAIL || 'admin@veerubber.co.th';
  const adminPassword = c.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    return c.json({ error: 'ADMIN_PASSWORD not configured in worker environment' }, 500);
  }

  const existing = await db.prepare('SELECT id FROM users WHERE role = ?').bind('admin').first();
  if (existing) {
    return c.json({ error: 'Admin user already exists in database' }, 400);
  }

  const { hash, salt } = await hashPassword(adminPassword);
  const fullHash = `${salt}:${hash}`;
  const id = crypto.randomUUID();

  await db.prepare(`
    INSERT INTO users (id, username, email, password_hash, name, role, status, receive_email)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(id, 'admin', adminEmail, fullHash, 'ผู้ดูแลระบบสูงสุด (Super Admin)', 'admin', 'approved', 1).run();

  return c.json({ data: { message: 'Initial Vee Rubber Super Admin successfully created', email: adminEmail } });
});

// All following routes require valid JWT auth AND admin role
router.use('*', requireAuth, requireAdmin);

// ==========================================
// 2. Member Management Endpoints (ควบคุมสมาชิก)
// ==========================================

// 2.1 Get All Users with Activity & Session Aggregates
router.get('/users', async (c) => {
  try {
    const db = c.env.DB;
    const { results } = await db.prepare(`
      SELECT 
        u.id, 
        u.username, 
        u.email, 
        u.name, 
        u.role, 
        u.status, 
        u.receive_email, 
        u.created_at,
        u.last_login_at,
        u.total_usage_seconds,
        COUNT(s.id) as session_count,
        MAX(s.last_active_at) as last_active_at,
        MAX(CASE WHEN strftime('%s', 'now') - strftime('%s', s.last_active_at) <= 180 THEN 1 ELSE 0 END) as is_online
      FROM users u
      LEFT JOIN user_sessions s ON u.id = s.user_id
      GROUP BY u.id
      ORDER BY 
        CASE WHEN u.status = 'pending' THEN 0 ELSE 1 END,
        u.created_at DESC
    `).all();

    return c.json({ data: results || [] });
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

// 2.2 Approve Member (อนุมัติสมาชิก)
router.put('/users/:id/approve', async (c) => {
  try {
    const db = c.env.DB;
    const id = c.req.param('id');
    await db.prepare("UPDATE users SET status = 'approved' WHERE id = ?").bind(id).run();
    return c.json({ data: { message: 'อนุมัติผู้ใช้งานเรียบร้อยแล้ว' } });
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

// 2.3 Reject / Suspend Member (ระงับสิทธิ์ / ปฏิเสธสมาชิก)
router.put('/users/:id/reject', async (c) => {
  try {
    const currentUser = c.get('user');
    const id = c.req.param('id');
    if (currentUser && currentUser.id === id) {
      return c.json({ error: 'ไม่สามารถระงับสิทธิ์บัญชีตนเองได้' }, 400);
    }
    const db = c.env.DB;
    await db.prepare("UPDATE users SET status = 'rejected' WHERE id = ?").bind(id).run();
    return c.json({ data: { message: 'ระงับสิทธิ์ผู้ใช้งานเรียบร้อยแล้ว' } });
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

// 2.4 Change Member Role (เปลี่ยนสิทธิ์ Admin / Member)
router.put('/users/:id/role', async (c) => {
  try {
    const currentUser = c.get('user');
    const id = c.req.param('id');
    const body = await c.req.json();
    const newRole = body.role; // 'admin' or 'viewer'

    if (!newRole || !['admin', 'viewer'].includes(newRole)) {
      return c.json({ error: 'Invalid role. Must be "admin" or "viewer"' }, 400);
    }

    if (currentUser && currentUser.id === id && newRole !== 'admin') {
      return c.json({ error: 'ไม่สามารถลดสิทธิ์ Admin ของบัญชีตนเองได้' }, 400);
    }

    const db = c.env.DB;
    await db.prepare("UPDATE users SET role = ? WHERE id = ?").bind(newRole, id).run();
    return c.json({ data: { message: `เปลี่ยนสิทธิ์ผู้ใช้เป็น ${newRole} สำเร็จ` } });
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

// 2.5 Change Member Status Directly (approved, pending, rejected)
router.put('/users/:id/status', async (c) => {
  try {
    const currentUser = c.get('user');
    const id = c.req.param('id');
    const body = await c.req.json();
    const newStatus = body.status;

    if (!newStatus || !['approved', 'pending', 'rejected'].includes(newStatus)) {
      return c.json({ error: 'Invalid status' }, 400);
    }

    if (currentUser && currentUser.id === id && newStatus !== 'approved') {
      return c.json({ error: 'ไม่สามารถเปลี่ยนสถานะบัญชีตนเองเป็นสถานะอื่นได้' }, 400);
    }

    const db = c.env.DB;
    await db.prepare("UPDATE users SET status = ? WHERE id = ?").bind(newStatus, id).run();
    return c.json({ data: { message: `ปรับสถานะผู้ใช้งานเป็น ${newStatus} สำเร็จ` } });
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

// 2.6 Reset Member Password by Admin (รีเซ็ตรหัสผ่านสมาชิก)
router.put('/users/:id/reset-password', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const newPassword = body.password;

    if (!newPassword || newPassword.length < 6) {
      return c.json({ error: 'รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร' }, 400);
    }

    const { hash, salt } = await hashPassword(newPassword);
    const fullHash = `${salt}:${hash}`;

    const db = c.env.DB;
    await db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").bind(fullHash, id).run();
    return c.json({ data: { message: 'รีเซ็ตรหัสผ่านสำหรับสมาชิกรายนี้สำเร็จแล้ว' } });
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

// 2.7 Toggle Daily Digest Email Notification for Member
router.put('/users/:id/toggle-email', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const receiveEmail = body.receive_email ? 1 : 0;

    const db = c.env.DB;
    await db.prepare("UPDATE users SET receive_email = ? WHERE id = ?").bind(receiveEmail, id).run();
    return c.json({ data: { message: `อัปเดตการรับอีเมลแจ้งเตือนเป็น ${receiveEmail === 1 ? 'เปิด' : 'ปิด'} เรียบร้อยแล้ว` } });
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

// 2.8 Permanently Delete User (ลบสมาชิกถาวร)
router.delete('/users/:id', async (c) => {
  try {
    const currentUser = c.get('user');
    const id = c.req.param('id');

    if (currentUser && currentUser.id === id) {
      return c.json({ error: 'ไม่สามารถลบบัญชีตนเองที่กำลังเข้าสู่ระบบอยู่ได้' }, 400);
    }

    const db = c.env.DB;
    // Delete user sessions first to maintain FK integrity
    await db.prepare("DELETE FROM user_sessions WHERE user_id = ?").bind(id).run();
    // Delete bookmarks
    await db.prepare("DELETE FROM bookmarks WHERE user_id = ?").bind(id).run();
    // Delete user
    await db.prepare("DELETE FROM users WHERE id = ?").bind(id).run();

    return c.json({ data: { message: 'ลบข้อมูลสมาชิกรายนี้ออกจากระบบเรียบร้อยแล้ว' } });
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

// ==========================================
// 3. User Activity & Real-Time Monitoring
// ==========================================
router.get('/user-activity', async (c) => {
  try {
    const db = c.env.DB;

    // 1. Overall stats
    const statsRes = await db.prepare(`
      SELECT 
        COUNT(DISTINCT CASE WHEN strftime('%s', 'now') - strftime('%s', last_active_at) <= 180 THEN user_id END) as online_users,
        COUNT(DISTINCT user_id) as total_active_users,
        COUNT(id) as total_sessions,
        COALESCE(SUM(duration_seconds), 0) as total_duration_seconds
      FROM user_sessions
    `).first();

    // 2. Aggregate stats by user
    const userStats = await db.prepare(`
      SELECT 
        u.id,
        u.username,
        u.email,
        u.name,
        u.role,
        u.status,
        u.receive_email,
        u.last_login_at,
        COUNT(s.id) as session_count,
        COALESCE(SUM(s.duration_seconds), 0) as total_duration_seconds,
        MAX(s.last_active_at) as last_active_at,
        MAX(CASE WHEN strftime('%s', 'now') - strftime('%s', s.last_active_at) <= 180 THEN 1 ELSE 0 END) as is_online,
        (SELECT current_page FROM user_sessions WHERE user_id = u.id ORDER BY last_active_at DESC LIMIT 1) as last_page
      FROM users u
      LEFT JOIN user_sessions s ON u.id = s.user_id
      GROUP BY u.id
      ORDER BY is_online DESC, last_active_at DESC, total_duration_seconds DESC
    `).all();

    // 3. Recent 50 sessions
    const recentSessions = await db.prepare(`
      SELECT 
        s.id,
        s.user_id,
        COALESCE(s.username, u.username, u.email) as username,
        u.name,
        u.email,
        s.ip_address,
        s.device_type,
        s.user_agent,
        s.current_page,
        s.started_at,
        s.last_active_at,
        s.ended_at,
        s.duration_seconds,
        CASE WHEN strftime('%s', 'now') - strftime('%s', s.last_active_at) <= 180 THEN 1 ELSE 0 END as is_online
      FROM user_sessions s
      LEFT JOIN users u ON s.user_id = u.id
      ORDER BY s.started_at DESC
      LIMIT 50
    `).all();

    return c.json({
      data: {
        stats: {
          online_users: statsRes?.online_users || 0,
          total_active_users: statsRes?.total_active_users || 0,
          total_sessions: statsRes?.total_sessions || 0,
          total_duration_seconds: statsRes?.total_duration_seconds || 0
        },
        users: userStats.results || [],
        sessions: recentSessions.results || []
      }
    });
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

// ==========================================
// 4. Scraper Harvester Logs
// ==========================================
router.get('/logs', async (c) => {
  try {
    const db = c.env.DB;
    const { results } = await db.prepare('SELECT * FROM fetch_logs ORDER BY run_date DESC LIMIT 50').all();
    return c.json({ data: results || [] });
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

export default router;
