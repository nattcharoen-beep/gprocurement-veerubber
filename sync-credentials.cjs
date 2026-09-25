const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const envPaths = [
  path.join(__dirname, '.env'),
  path.join(__dirname, '.env.txt')
];

let envPath = null;
for (const p of envPaths) {
  if (fs.existsSync(p)) {
    envPath = p;
    break;
  }
}

if (!envPath) {
  console.error('❌ ไม่พบไฟล์ .env หรือ .env.txt ในโฟลเดอร์นี้');
  process.exit(1);
}

const content = fs.readFileSync(envPath, 'utf8');
const lines = content.split(/\r?\n/);

const envMap = {};
for (const line of lines) {
  const trimmed = line.trim();
  if (trimmed.startsWith('#') || !trimmed.includes('=')) continue;
  const idx = trimmed.indexOf('=');
  const key = trimmed.substring(0, idx).trim();
  const val = trimmed.substring(idx + 1).trim().replace(/^["']|["']$/g, '');
  envMap[key] = val;
}

// Collect all admin definitions
const adminList = [];
for (let i = 1; i <= 10; i++) {
  const email = envMap[`ADMIN_${i}_EMAIL`];
  const password = envMap[`ADMIN_${i}_PASSWORD`];
  const username = envMap[`ADMIN_${i}_USERNAME`] || (email ? email.split('@')[0] : '');
  const name = envMap[`ADMIN_${i}_NAME`] || username;
  if (email && password) {
    adminList.push({ email, password, username, name });
  }
}

if (envMap.ADMIN_PASSWORD) {
  const username = envMap.ADMIN_USERNAME || (envMap.ADMIN_EMAIL ? envMap.ADMIN_EMAIL.split('@')[0] : 'admin');
  const email = envMap.ADMIN_EMAIL || (username.includes('@') ? username : `${username}@veerubber.co.th`);
  const name = envMap.ADMIN_NAME || username;
  if (!adminList.some(a => a.username.toLowerCase() === username.toLowerCase() || a.email.toLowerCase() === email.toLowerCase())) {
    adminList.push({
      email,
      password: envMap.ADMIN_PASSWORD,
      username,
      name
    });
  }
}

if (adminList.length === 0) {
  console.error('❌ ไม่พบข้อมูล ADMIN ในไฟล์ .env');
  process.exit(1);
}

async function hashPassword(password) {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
  const exported = await crypto.subtle.exportKey('raw', key);
  const bufToHex = buf => Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  return bufToHex(salt) + ':' + bufToHex(exported);
}

(async () => {
  console.log('🔄 กำลังเชื่อมต่อและอัปเดตข้อมูล Admin ไปยัง Cloudflare D1...');

  const sqlStatements = [];

  for (const adm of adminList) {
    if (adm.password.includes('ใส่รหัสผ่าน') || adm.password.length < 6) {
      console.warn(`⚠️ ข้าม ${adm.username} (${adm.email}): ยังไม่ได้ระบุรหัสผ่านจริงใน .env (ต้องมีอย่างน้อย 6 ตัวอักษร)`);
      continue;
    }

    const fullHash = await hashPassword(adm.password);
    const safeEmail = adm.email.replace(/'/g, "''");
    const safeUsername = adm.username.replace(/'/g, "''");
    const safeName = adm.name.replace(/'/g, "''");

    sqlStatements.push(`
      INSERT INTO users (id, username, email, password_hash, name, role, status)
      VALUES ('user-' || lower('${safeUsername}'), '${safeUsername}', '${safeEmail}', '${fullHash}', '${safeName}', 'admin', 'approved')
      ON CONFLICT(email) DO UPDATE SET 
        password_hash = '${fullHash}',
        username = '${safeUsername}',
        role = 'admin',
        status = 'approved';
    `);
    console.log(`🔑 บันทึกรหัสผ่าน Admin: ${adm.username} (${adm.email})`);
  }

  if (sqlStatements.length > 0) {
    const tempSql = path.join(__dirname, 'worker', 'temp_sync.sql');
    fs.writeFileSync(tempSql, sqlStatements.join('\n'), 'utf8');

      const wranglerCmd = fs.existsSync(path.join(__dirname, 'worker', 'node_modules', '.bin', 'wrangler.cmd'))
        ? '.\\node_modules\\.bin\\wrangler.cmd'
        : 'npx wrangler';
      execSync(wranglerCmd + ' d1 execute gprocurement-veerubber-db --remote --file="' + tempSql + '"', {
        cwd: path.join(__dirname, 'worker'),
        stdio: 'pipe'
      });
      console.log('✅ อัปเดตรหัสผ่าน Admin ทุกคนลงฐานข้อมูล Cloudflare D1 เรียบร้อยแล้ว!');
    } finally {
      if (fs.existsSync(tempSql)) fs.unlinkSync(tempSql);
    }
  }

  // Update Recovery Key secret if provided
  const recoveryKey = envMap.RECOVERY_KEY;
  if (recoveryKey && !recoveryKey.includes('VEERUBBER-2026-SAFE-RECOVERY')) {
    console.log('🔄 กำลังอัปเดต RECOVERY_KEY ขึ้น Cloudflare Secret...');
    try {
      execSync('npx wrangler secret put RECOVERY_KEY', {
        cwd: path.join(__dirname, 'worker'),
        input: recoveryKey,
        stdio: ['pipe', 'pipe', 'pipe']
      });
      console.log('✅ อัปเดต Master Recovery Key สำเร็จ!');
    } catch (e) {
      console.warn('⚠️ ไม่สามารถอัปเดต RECOVERY_KEY อัตโนมัติได้:', e.message);
    }
  }

  console.log('\n🎉 ซิงค์ข้อมูล Admin เรียบร้อยแล้ว!');
  console.log('🔒 ไฟล์ .env อยู่เฉพาะในเครื่องนี้เท่านั้น ปลอดภัย ไม่ขึ้น GitHub 100%');
})();
