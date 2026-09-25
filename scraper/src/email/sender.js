/**
 * Email Sender Module
 * Sends emails using Nodemailer via Gmail SMTP.
 */

import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

function loadEnvIfAvailable() {
  const envCandidates = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), '../.env'),
    path.resolve(process.cwd(), '../../.env')
  ];
  for (const p of envCandidates) {
    if (fs.existsSync(p)) {
      const content = fs.readFileSync(p, 'utf8');
      const lines = content.split(/\r?\n/);
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
        const idx = trimmed.indexOf('=');
        const key = trimmed.substring(0, idx).trim();
        const val = trimmed.substring(idx + 1).trim().replace(/^["']|["']$/g, '');
        if (key && !process.env[key]) {
          process.env[key] = val;
        }
      }
      break;
    }
  }
}

export async function sendDigestEmail(html, recipients, subject) {
  loadEnvIfAvailable();
  const user = (process.env.GMAIL_USER || '').trim();
  const pass = (process.env.GMAIL_APP_PASSWORD || '').replace(/\s+/g, '');

  if (!user || !pass) {
    console.error('[Email Sender] Missing GMAIL_USER or GMAIL_APP_PASSWORD in environment or .env file.');
    return false;
  }

  if (!recipients) {
    console.error('[Email Sender] No recipients specified.');
    return false;
  }

  // Create transporter
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: user,
      pass: pass
    }
  });

  const mailOptions = {
    from: `"Vee Rubber • จัดซื้อจัดจ้างภาครัฐ" <${user}>`, // sender address
    to: recipients, // list of receivers
    subject: subject, // Subject line
    html: html // html body
  };

  try {
    console.log(`[Email Sender] Sending email to: ${recipients}...`);
    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email Sender] Email sent successfully: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`[Email Sender] Error sending email:`, error);
    return false;
  }
}
