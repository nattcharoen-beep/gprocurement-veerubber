import { WorkerMailer } from 'worker-mailer';

export async function sendAdminNotification(env, newUser) {
  const gmailUser = (env.GMAIL_USER || '').trim();
  const gmailPass = (env.GMAIL_APP_PASSWORD || '').replace(/\s+/g, '');
  const adminEmail = (env.ADMIN_EMAIL || 'admin@veerubber.co.th').trim();

  if (!gmailUser || !gmailPass) {
    console.warn('[Mailer] Missing GMAIL_USER or GMAIL_APP_PASSWORD in worker env');
    return false;
  }

  const approveUrl = env.FRONTEND_URL ? `${env.FRONTEND_URL}/admin.html` : 'https://veerubber-finder.pages.dev/admin.html';
  const timeStr = new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' });

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family: Arial, sans-serif; background-color: #f8fafc; padding: 20px; color: #1e293b;">
  <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
    <div style="background: #003366; color: #ffffff; padding: 20px; text-align: center;">
      <h2 style="margin: 0; font-size: 1.25rem;">วีรับเบอร์ | GProcurement Tracker</h2>
      <p style="margin: 5px 0 0 0; color: #93c5fd; font-size: 0.9rem;">แจ้งเตือน: มีสมาชิกใหม่สมัครเข้าใช้งาน (รอการอนุมัติ)</p>
    </div>
    <div style="padding: 24px;">
      <p style="font-size: 1rem; margin-top: 0;">เรียน <strong>ผู้ดูแลระบบ Admin (${adminEmail})</strong>,</p>
      <p style="line-height: 1.6; color: #475569;">มีผู้ใช้งานใหม่ได้ลงทะเบียนในระบบเรียบร้อยแล้ว โดยกำลังรอการกดอนุมัติสิทธิ์จากท่านเพื่อเข้าใช้งาน:</p>
      
      <div style="background: #f1f5f9; border-radius: 6px; padding: 16px; margin: 18px 0; border: 1px solid #cbd5e1;">
        <div style="margin-bottom: 8px;"><strong>👤 ชื่อผู้ใช้ (Username):</strong> <span style="color: #003366; font-weight: 700;">${newUser.username || '-'}</span></div>
        <div style="margin-bottom: 8px;"><strong>📝 ชื่อ-นามสกุล:</strong> <span>${newUser.name || '-'}</span></div>
        <div style="margin-bottom: 8px;"><strong>✉️ อีเมล:</strong> <span>${newUser.email || '-'}</span></div>
        <div style="margin-bottom: 8px;"><strong>📅 เวลาที่สมัคร:</strong> <span>${timeStr}</span></div>
        <div><strong>🚦 สถานะปัจจุบัน:</strong> <span style="color: #d97706; font-weight: 700;">⏳ รอ Admin อนุมัติ (Pending)</span></div>
      </div>

      <div style="text-align: center; margin: 28px 0 16px 0;">
        <a href="${approveUrl}" style="background: #16a34a; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 700; font-size: 0.95rem; display: inline-block; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          👉 เข้าสู่ระบบเพื่อกดอนุมัติผู้ใช้งาน (Approve)
        </a>
      </div>

      <p style="font-size: 0.85rem; color: #64748b; text-align: center; margin-top: 20px;">
        หรือไปที่ URL: <a href="${approveUrl}" style="color: #0066cc;">${approveUrl}</a>
      </p>
    </div>
    <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 12px; text-align: center; font-size: 0.75rem; color: #94a3b8;">
      ระบบแจ้งเตือนอัตโนมัติ • บริษัท วีรับเบอร์ คอร์ปอเรชั่น จำกัด (Vee Rubber Corporation Ltd.)
    </div>
  </div>
</body>
</html>
`;

  try {
    const mailer = await WorkerMailer.connect({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      credentials: {
        username: gmailUser,
        password: gmailPass,
      },
      authType: 'login',
    });

    await mailer.send({
      from: { name: 'GProcurement Finder', email: gmailUser },
      to: { name: 'Admin', email: adminEmail },
      subject: `🔔 สมาชิกใหม่สมัครเข้าใช้งาน: ${newUser.username || newUser.email} (รอการอนุมัติ)`,
      html: html,
    });

    await mailer.close();
    console.log('[Mailer] Admin notification email sent successfully to', adminEmail);
    return true;
  } catch (err) {
    console.error('[Mailer] Error sending admin notification with port 465:', err.message);
    try {
      const mailer587 = await WorkerMailer.connect({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        startTls: true,
        credentials: {
          username: gmailUser,
          password: gmailPass,
        },
        authType: 'login',
      });

      await mailer587.send({
        from: { name: 'GProcurement Finder', email: gmailUser },
        to: { name: 'Admin', email: adminEmail },
        subject: `🔔 สมาชิกใหม่สมัครเข้าใช้งาน: ${newUser.username || newUser.email} (รอการอนุมัติ)`,
        html: html,
      });

      await mailer587.close();
      console.log('[Mailer] Fallback: Notification email sent successfully via port 587');
      return true;
    } catch (fallbackErr) {
      console.error('[Mailer] Fallback port 587 also failed:', fallbackErr.message);
      return false;
    }
  }
}
