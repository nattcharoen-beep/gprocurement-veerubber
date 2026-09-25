import { Hono } from 'hono';
import { SignJWT } from 'jose';
import { requireAuth, hashPassword, verifyPassword } from '../middleware/auth.js';
import { sendAdminNotification } from '../utils/mailer.js';

const router = new Hono();

// Simple rate limiter for auth endpoints (per-IP, 10 requests per minute)
const rateLimitMap = new Map();
function rateLimit(c, limit = 10, windowMs = 60000) {
  const ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown';
  const now = Date.now();
  const record = rateLimitMap.get(ip) || { count: 0, resetAt: now + windowMs };
  if (now > record.resetAt) {
    record.count = 0;
    record.resetAt = now + windowMs;
  }
  record.count++;
  rateLimitMap.set(ip, record);
  // Cleanup old entries periodically
  if (rateLimitMap.size > 1000) {
    for (const [key, val] of rateLimitMap) {
      if (now > val.resetAt) rateLimitMap.delete(key);
    }
  }
  if (record.count > limit) {
    return c.json({ error: 'Too many requests. Please try again later.' }, 429);
  }
  return null;
}

router.post('/register', async (c) => {
  const limited = rateLimit(c, 5, 60000);
  if (limited) return limited;

  const { username, email, password, name } = await c.req.json();
  if (!email || !password) {
    return c.json({ error: 'กรุณาระบุอีเมลและรหัสผ่าน' }, 400);
  }

  const cleanEmail = email.trim().toLowerCase();
  const rawUsername = (username || cleanEmail.split('@')[0] || '').trim();
  const cleanUsername = rawUsername.replace(/\s+/g, '_').toLowerCase();

  if (cleanUsername.length < 3) {
    return c.json({ error: 'ชื่อผู้ใช้ (Username) ต้องมีความยาวอย่างน้อย 3 ตัวอักษร' }, 400);
  }

  if (password.length < 6) {
    return c.json({ error: 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร' }, 400);
  }

  const db = c.env.DB;
  
  // Check existing user by email
  const existingEmail = await db.prepare('SELECT id FROM users WHERE LOWER(email) = ?').bind(cleanEmail).first();
  if (existingEmail) {
    return c.json({ error: 'อีเมลนี้ถูกใช้งานในระบบแล้ว' }, 400);
  }

  // Check existing user by username
  const existingUser = await db.prepare('SELECT id FROM users WHERE LOWER(username) = ?').bind(cleanUsername).first();
  if (existingUser) {
    return c.json({ error: `ชื่อผู้ใช้ "${cleanUsername}" มีผู้ใช้งานแล้ว กรุณาเลือกชื่อผู้ใช้อื่น` }, 400);
  }

  const { hash, salt } = await hashPassword(password);
  const fullHash = `${salt}:${hash}`;
  const id = crypto.randomUUID();

  let role = 'viewer';
  let status = 'pending';

  await db.prepare(`
    INSERT INTO users (id, username, email, password_hash, name, role, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(id, cleanUsername, cleanEmail, fullHash, name ? name.trim() : null, role, status).run();

  const newUser = {
    id,
    username: cleanUsername,
    email: cleanEmail,
    name: name ? name.trim() : cleanUsername
  };

  // Dispatch background email alert to Admin (natt.charoen@gmail.com)
  if (c.executionCtx && typeof c.executionCtx.waitUntil === 'function') {
    c.executionCtx.waitUntil(sendAdminNotification(c.env, newUser));
  } else {
    sendAdminNotification(c.env, newUser).catch(err => console.error('Email send err:', err));
  }

  return c.json({ 
    data: { 
      message: 'สมัครสมาชิกสำเร็จแล้ว! ระบบได้ส่งแจ้งเตือนไปยัง Admin (natt.charoen@gmail.com) เรียบร้อยแล้ว กรุณารอการอนุมัติก่อนเข้าใช้งาน' 
    } 
  });
});

router.post('/login', async (c) => {
  const limited = rateLimit(c, 10, 60000);
  if (limited) return limited;

  const { email, username, password } = await c.req.json();
  const identifier = (email || username || '').trim().toLowerCase();
  
  if (!identifier || !password) {
    return c.json({ error: 'กรุณากรอกชื่อผู้ใช้/อีเมล และรหัสผ่าน' }, 400);
  }

  const db = c.env.DB;

  let user = await db.prepare(
    'SELECT * FROM users WHERE LOWER(email) = ? OR LOWER(username) = ?'
  ).bind(identifier, identifier).first();

  // Smart alias resolution for admin convenience
  if (!user) {
    if (identifier === 'natt' || identifier === 'ณัฐ' || identifier === 'admin') {
      user = await db.prepare('SELECT * FROM users WHERE username = "natt.charoen" OR email = "natt.charoen@gmail.com"').first();
    }
  }

  if (!user) {
    return c.json({ error: 'ชื่อผู้ใช้/อีเมล หรือรหัสผ่านไม่ถูกต้อง' }, 401);
  }

  if (user.status === 'pending') {
    return c.json({ error: 'บัญชีของคุณอยู่ระหว่างรอผู้ดูแลระบบ (natt.charoen@gmail.com) อนุมัติการใช้งาน' }, 403);
  }

  if (user.status === 'rejected') {
    return c.json({ error: 'บัญชีนี้ไม่ได้รับอนุมัติให้เข้าใช้งาน กรุณาติดต่อผู้ดูแลระบบ' }, 403);
  }

  if (user.status !== 'approved') {
    return c.json({ error: 'สถานะบัญชียังไม่พร้อมใช้งาน' }, 403);
  }

  const [salt, hash] = (user.password_hash || '').split(':');
  let isValid = false;
  if (salt && hash) {
    isValid = await verifyPassword(password, hash, salt);
  }

  // Fallback for initial admin account setup if configured via env
  if (!isValid && user.role === 'admin') {
    const pTrim = (password || '').trim();
    if (c.env.ADMIN_FALLBACK_PASSWORD && pTrim === c.env.ADMIN_FALLBACK_PASSWORD) {
      isValid = true;
    }
  }

    // Auto-update standard PBKDF2 hash on successful admin fallback login
    if (isValid) {
      try {
        const newHashData = await hashPassword(password);
        const newFullHash = `${newHashData.salt}:${newHashData.hash}`;
        await db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').bind(newFullHash, user.id).run();
      } catch (hErr) {
        // Non-fatal
      }
    }
  }

  if (!isValid) {
    return c.json({ error: 'ชื่อผู้ใช้/อีเมล หรือรหัสผ่านไม่ถูกต้อง' }, 401);
  }

  const encoder = new TextEncoder();
  const jwt = await new SignJWT({ id: user.id, email: user.email, username: user.username, role: user.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(encoder.encode(c.env.JWT_SECRET));

  const sessionId = crypto.randomUUID();
  const ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown';
  const userAgent = c.req.header('user-agent') || 'unknown';
  const isMobile = /mobile|android|iphone|ipad/i.test(userAgent);
  const deviceType = isMobile ? 'mobile' : 'desktop';

  try {
    await db.prepare(`
      INSERT INTO user_sessions (id, user_id, username, ip_address, user_agent, device_type, current_page, started_at, last_active_at, duration_seconds, is_online)
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, 1)
    `).bind(sessionId, user.id, user.username || user.email, ip, userAgent, deviceType, 'dashboard.html').run();

    await db.prepare(`
      UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?
    `).bind(user.id).run();
  } catch (sessErr) {
    console.warn('[Session] Failed to record login session:', sessErr.message);
  }

  return c.json({ 
    data: { 
      token: jwt, 
      sessionId,
      user: { 
        id: user.id, 
        username: user.username,
        email: user.email, 
        name: user.name, 
        role: user.role 
      } 
    } 
  });
});

router.get('/me', requireAuth, async (c) => {
  const userCtx = c.get('user');
  const db = c.env.DB;
  const user = await db.prepare('SELECT id, username, email, name, role, status, receive_email FROM users WHERE id = ?').bind(userCtx.id).first();
  if (!user) return c.json({ error: 'User not found' }, 404);
  return c.json({ data: user });
});

router.put('/settings', requireAuth, async (c) => {
  const userCtx = c.get('user');
  const { name, receive_email } = await c.req.json();
  const db = c.env.DB;

  await db.prepare('UPDATE users SET name = ?, receive_email = ? WHERE id = ?')
    .bind(name, receive_email ? 1 : 0, userCtx.id)
    .run();

  return c.json({ data: { message: 'Settings updated' } });
});

router.post('/reset-password', async (c) => {
  try {
    const limited = rateLimit(c, 5, 60000);
    if (limited) return limited;

    const { email, recovery_key, new_password } = await c.req.json();
    if (!email || !recovery_key || !new_password) {
      return c.json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วนทุกช่อง' }, 400);
    }

    const validKey = c.env.RECOVERY_KEY;
    if (!validKey || recovery_key.trim() !== validKey.trim()) {
      return c.json({ error: 'รหัสกู้คืน (Master Recovery Key) ไม่ถูกต้อง' }, 403);
    }

    const db = c.env.DB;
    const user = await db.prepare('SELECT id FROM users WHERE email = ?').bind(email.trim()).first();
    if (!user) {
      return c.json({ error: 'ไม่พบบัญชีผู้ใช้งานอีเมลนี้ในระบบ' }, 404);
    }

    if (new_password.length < 6) {
      return c.json({ error: 'รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร' }, 400);
    }

    const { hash, salt } = await hashPassword(new_password);
    const fullHash = `${salt}:${hash}`;

    await db.prepare('UPDATE users SET password_hash = ? WHERE id = ?')
      .bind(fullHash, user.id)
      .run();

    return c.json({ data: { message: 'เปลี่ยนรหัสผ่านสำเร็จแล้ว! สามารถเข้าสู่ระบบด้วยรหัสผ่านใหม่ได้ทันที' } });
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

router.post('/session-start', requireAuth, async (c) => {
  const userCtx = c.get('user');
  const db = c.env.DB;
  const { page } = await c.req.json().catch(() => ({}));
  const sessionId = crypto.randomUUID();
  const ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown';
  const userAgent = c.req.header('user-agent') || 'unknown';
  const isMobile = /mobile|android|iphone|ipad/i.test(userAgent);
  const deviceType = isMobile ? 'mobile' : 'desktop';

  try {
    await db.prepare(`
      INSERT INTO user_sessions (id, user_id, username, ip_address, user_agent, device_type, current_page, started_at, last_active_at, duration_seconds, is_online)
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, 1)
    `).bind(sessionId, userCtx.id, userCtx.username || userCtx.email, ip, userAgent, deviceType, page || 'dashboard.html').run();

    await db.prepare(`
      UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?
    `).bind(userCtx.id).run();
  } catch (err) {
    console.warn('[Session] session-start error:', err.message);
  }

  return c.json({ data: { sessionId } });
});

router.post('/heartbeat', requireAuth, async (c) => {
  const userCtx = c.get('user');
  const db = c.env.DB;
  const { sessionId, page } = await c.req.json().catch(() => ({}));

  if (!sessionId) {
    return c.json({ error: 'sessionId is required' }, 400);
  }

  try {
    await db.prepare(`
      UPDATE user_sessions 
      SET 
        last_active_at = CURRENT_TIMESTAMP,
        current_page = COALESCE(?, current_page),
        is_online = 1,
        duration_seconds = MAX(duration_seconds, CAST((strftime('%s', 'now') - strftime('%s', started_at)) AS INTEGER))
      WHERE id = ? AND user_id = ?
    `).bind(page || null, sessionId, userCtx.id).run();
  } catch (err) {
    console.warn('[Session] heartbeat error:', err.message);
  }

  return c.json({ data: { status: 'active' } });
});

router.post('/session-end', async (c) => {
  const { sessionId } = await c.req.json().catch(() => ({}));
  if (!sessionId) return c.json({ data: { status: 'ok' } });

  const db = c.env.DB;
  try {
    await db.prepare(`
      UPDATE user_sessions 
      SET 
        last_active_at = CURRENT_TIMESTAMP,
        ended_at = CURRENT_TIMESTAMP,
        is_online = 0,
        duration_seconds = MAX(duration_seconds, CAST((strftime('%s', 'now') - strftime('%s', started_at)) AS INTEGER))
      WHERE id = ?
    `).bind(sessionId).run();
  } catch (err) {
    console.warn('[Session] session-end error:', err.message);
  }

  return c.json({ data: { status: 'ended' } });
});

export default router;
