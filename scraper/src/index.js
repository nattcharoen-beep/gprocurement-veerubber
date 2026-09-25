/**
 * GProcurement Finder - Main Orchestrator
 * Runs the Precision & Lifecycle 2-Pass Harvester for e-GP v5.
 * Delivers automated daily intelligence digest to natt.charoen@gmail.com.
 */

import { harvestEGP5 } from './harvest-egp5.js';
import { buildDigestHTML } from './email/daily-digest.js';
import { sendDigestEmail } from './email/sender.js';
import { fetchSubscribers, fetchLatestAnnouncements } from './d1-uploader.js';

// Logger helper with timestamp
const log = (msg) => console.log(`[${new Date().toISOString()}] ${msg}`);
const logError = (msg) => console.error(`[${new Date().toISOString()}] [ERROR] ${msg}`);

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

async function main() {
  loadEnvIfAvailable();
  log('Starting Vee Rubber GProcurement Tracker Daily Job...');

  // 1. Load config from env vars
  const D1_API_URL = process.env.D1_API_URL || 'https://gprocurement-veerubber.natt-charoen.workers.dev';
  const D1_API_KEY = process.env.D1_API_KEY;
  const envRecipients = process.env.GMAIL_RECIPIENTS || '';

  // 2. Resolve recipient list (Default + Subscribers)
  const DEFAULT_RECIPIENTS = [
    'admin@veerubber.co.th'
  ];
  const recipientSet = new Set(DEFAULT_RECIPIENTS);
  
  if (envRecipients) {
    envRecipients.split(',').map(e => e.trim()).filter(Boolean).forEach(email => recipientSet.add(email));
  }

  // Also query registered subscribers from D1 database if API key is present
  if (D1_API_KEY) {
    try {
      const dbSubscribers = await fetchSubscribers(D1_API_URL, D1_API_KEY);
      dbSubscribers.forEach(email => recipientSet.add(email.trim()));
      log(`Subscribers loaded from D1: ${dbSubscribers.join(', ')}`);
    } catch (err) {
      log(`Note: Unable to load D1 subscribers (${err.message}). Using configured list.`);
    }
  }

  const finalRecipients = Array.from(recipientSet);
  log(`Resolved Email Recipients (${finalRecipients.length}): ${finalRecipients.join(', ')}`);

  try {
    // 3. Harvest with 2-Pass Verification Engine
    let activeProjects = [];
    try {
      log('Running 2-Pass Precision Harvester on e-GP...');
      activeProjects = await harvestEGP5(D1_API_URL, D1_API_KEY, { maxPages: 10, lookbackDays: 7 });
      log(`Harvest completed: ${activeProjects.length} 100% active, unbid projects found.`);
    } catch (harvestErr) {
      logError(`Harvester encountered an issue: ${harvestErr.message}`);
    }

    // 4. Fallback if harvester produced 0 items: fetch latest verified projects from D1
    if (activeProjects.length === 0) {
      log('Fetching latest active verified projects from D1 database API as fallback...');
      activeProjects = await fetchLatestAnnouncements(D1_API_URL, 60);
      log(`Fetched ${activeProjects.length} verified projects from D1 database.`);
    }

    // 5. Send daily digest email
    if (activeProjects.length > 0) {
      log('Building high-interest daily digest HTML...');
      const dateStr = new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
      const subject = `📋 สรุปงานจัดซื้อจัดจ้างประจำวัน — ${dateStr}`;

      for (const recipient of finalRecipients) {
        log(`Generating personalized digest for ${recipient}...`);
        const html = buildDigestHTML(activeProjects, { recipient });
        const success = await sendDigestEmail(html, recipient, subject);
        if (success) {
          log(`✅ Daily digest successfully sent to ${recipient}`);
        } else {
          logError(`❌ Failed to send daily digest to ${recipient}`);
        }
      }
    } else {
      log('No active projects found to generate digest.');
    }

    log('=== JOB SUMMARY ===');
    log(`Total Active Projects: ${activeProjects.length}`);
    log(`Recipients Targeted: ${finalRecipients.join(', ')}`);
    log('Job completed successfully.');
  } catch (error) {
    logError(`An unexpected error occurred: ${error.stack || error.message}`);
    process.exit(1);
  }
}

main();

