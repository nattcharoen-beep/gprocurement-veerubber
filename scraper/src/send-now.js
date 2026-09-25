import fs from 'fs';
import path from 'path';
import readline from 'readline';
import nodemailer from 'nodemailer';
import { execSync } from 'child_process';
import { buildDigestHTML } from './email/daily-digest.js';
import { fetchLatestAnnouncements } from './d1-uploader.js';

const envPath = path.resolve(process.cwd(), '../.env');

function getEnvVars() {
  const env = {
    GMAIL_USER: process.env.GMAIL_USER || '',
    GMAIL_APP_PASSWORD: process.env.GMAIL_APP_PASSWORD || '',
    GMAIL_RECIPIENTS: process.env.GMAIL_RECIPIENTS || 'admin@veerubber.co.th',
    D1_API_URL: process.env.D1_API_URL || 'https://gprocurement-veerubber.workers.dev'
  };

  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
      const idx = trimmed.indexOf('=');
      const key = trimmed.substring(0, idx).trim();
      const val = trimmed.substring(idx + 1).trim().replace(/^["']|["']$/g, '');
      if (key) env[key] = val;
    }
  }
  return env;
}

function updateEnvPassword(appPassword) {
  if (!fs.existsSync(envPath)) return;
  let text = fs.readFileSync(envPath, 'utf8');
  if (text.includes('GMAIL_APP_PASSWORD=')) {
    text = text.replace(/GMAIL_APP_PASSWORD=.*/g, 'GMAIL_APP_PASSWORD=' + appPassword);
  } else {
    text += '\nGMAIL_APP_PASSWORD=' + appPassword + '\n';
  }
  fs.writeFileSync(envPath, text, 'utf8');
  console.log('💾 บันทึกรหัสผ่านลงไฟล์ .env เรียบร้อยแล้ว!');

  try {
    console.log('🔄 กำลังซิงค์ Secret ไปยัง GitHub Actions...');
    execSync('gh secret set GMAIL_APP_PASSWORD -b "' + appPassword + '"', { stdio: 'ignore' });
    if (env.GMAIL_USER) {
      execSync('gh secret set GMAIL_USER -b "' + env.GMAIL_USER + '"', { stdio: 'ignore' });
    }
    console.log('✅ ซิงค์ GitHub Secrets เรียบร้อย! ระบบจะส่งอีเมลอัตโนมัติได้ทุกวัน 07:00 น.');
  } catch (e) {}
}

async function promptPassword() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => {
    console.log('\n=============================================================');
    console.log('🔑 จำเป็นต้องใช้ Google App Password 16 หลัก เพื่อส่งอีเมล');
    console.log('=============================================================');
    console.log('1. เปิดลิงก์นี้ในเบราว์เซอร์: https://myaccount.google.com/apppasswords');
    console.log('2. เข้าสู่ระบบด้วยบัญชี Gmail ของท่าน');
    console.log('3. ตั้งชื่อแอปว่า "Vee Rubber Tracker" แล้วกดสร้าง (Create)');
    console.log('4. Google จะแสดงรหัส 16 ตัว (เช่น abcd efgh ijkl mnop)');
    console.log('-------------------------------------------------------------');
    rl.question('👉 วางรหัสผ่าน 16 หลักที่ได้ที่นี่ แล้วกด Enter: ', (answer) => {
      rl.close();
      resolve(answer.trim().replace(/\s+/g, ''));
    });
  });
}

async function main() {
  console.log('=============================================================');
  console.log('🚀 VEE RUBBER GPROCUREMENT TRACKER - ส่งอีเมลสรุปงานทันที');
  console.log('=============================================================');

  let env = getEnvVars();
  let user = (env.GMAIL_USER || '').trim();
  let pass = (env.GMAIL_APP_PASSWORD || '').replace(/\s+/g, '');
  let recipient = (env.GMAIL_RECIPIENTS || 'admin@veerubber.co.th').trim();

  if (!pass || pass.length < 10) {
    pass = await promptPassword();
    if (pass && pass.length >= 10) {
      updateEnvPassword(pass);
    } else {
      console.error('❌ ไม่ได้ระบุรหัสผ่าน ยกเลิกการส่ง');
      process.exit(1);
    }
  }

  console.log('\n📡 กำลังตรวจสอบการเชื่อมต่อกับ smtp.gmail.com:587...');
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: { user, pass }
  });

  try {
    await transporter.verify();
    console.log('✅ เชื่อมต่อ Gmail SMTP สำเร็จ!');
  } catch (err) {
    console.error('❌ การเชื่อมต่อล้มเหลว:', err.message);
    console.log('💡 คำแนะนำ: ตรวจสอบว่ารหัสผ่าน 16 ตัวสร้างจาก https://myaccount.google.com/apppasswords ถูกต้อง');
    process.exit(1);
  }

  console.log('📦 กำลังดึงข้อมูลโครงการล่าสุดจากระบบ...');
  const announcements = await fetchLatestAnnouncements(env.D1_API_URL, 60);
  console.log('✅ ดึงข้อมูลสำเร็จ ' + announcements.length + ' โครงการ');

  const recipients = recipient.split(',').map(r => r.trim()).filter(Boolean);
  console.log(`📨 กำลังเริ่มส่งอีเมลไปยังผู้รับทั้งหมด ${recipients.length} ท่าน จาก ${user}...`);

  const dateStr = new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
  const subject = `📋 สรุปงานจัดซื้อจัดจ้างประจำวัน — ${dateStr}`;

  let successCount = 0;
  for (const rec of recipients) {
    console.log(`  -> กำลังส่งถึง: ${rec}...`);
    const html = buildDigestHTML(announcements, { recipient: rec });
    try {
      const info = await transporter.sendMail({
        from: `"Vee Rubber • จัดซื้อจัดจ้างภาครัฐ" <${user}>`,
        to: rec,
        subject: subject,
        html: html
      });
      console.log(`     ✅ สำเร็จ! (Message ID: ${info.messageId})`);
      successCount++;
    } catch (sendErr) {
      console.error(`     ❌ ส่งไม่สำเร็จ: ${sendErr.message}`);
    }
  }

  console.log('=============================================================');
  console.log(`🎉 ส่งอีเมลสำเร็จทั้งหมด ${successCount} จาก ${recipients.length} ท่านเรียบร้อยแล้ว!`);
  console.log('📧 รายชื่อผู้รับ:', recipients.join(', '));
  console.log('👉 ผู้รับสามารถเปิดดูใน Inbox ได้ทันทีครับ!');
  console.log('=============================================================');
}

main();
