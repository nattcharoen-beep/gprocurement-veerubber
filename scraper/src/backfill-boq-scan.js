/**
 * Backfill & Deep In-Memory BOQ Scanner
 * Scans 100% of candidate projects in the Cloudflare D1 database.
 * Inspects all attachment templates (buildName3 BOQ/ปร.4, buildName2 TOR/สเปก, buildName1 ประกาศ)
 * Pure in-memory (RAM buffer) with zero-disk footprint.
 */

import fetch from 'node-fetch';
import { scanPdfBuffer } from './in-memory-pdf-parser.js';
import { getEgpSessionToken } from './capsolver.js';

const D1_API_URL = process.env.D1_API_URL || 'https://gprocurement-veerubber.natt-charoen.workers.dev';
const D1_API_KEY = process.env.D1_API_KEY || process.env.API_KEY;
const CAPSOLVER_API_KEY = process.env.CAPSOLVER_API_KEY;

const COMMON_HEADERS = (token) => ({
  'x-announcement-token': token,
  'accept': 'application/json, text/plain, */*',
  'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
});

async function main() {
  console.log('====================================================');
  console.log('🔬 [Backfill BOQ Scanner] 100% Document Inspection');
  console.log('====================================================');

  if (!D1_API_KEY) {
    console.error('❌ Error: D1_API_KEY or API_KEY environment variable is required.');
    process.exit(1);
  }

  // 1. Fetch active announcements from D1
  console.log(`[1/4] Fetching active announcements from ${D1_API_URL}...`);
  const listRes = await fetch(`${D1_API_URL}/api/announcements?limit=200`);
  if (!listRes.ok) {
    throw new Error(`Failed to fetch announcements from Worker: ${listRes.status}`);
  }
  const listJson = await listRes.json();
  const allProjects = listJson.data || [];
  console.log(`  -> Found ${allProjects.length} total active announcements in D1.`);

  // Filter projects that need scanning (or not yet verified)
  const candidates = allProjects.filter(p => !p.doc_verified || !p.boq_summary);
  console.log(`  -> ${candidates.length} projects pending 100% in-memory BOQ scan.`);

  if (candidates.length === 0) {
    console.log('✅ All projects are already verified! Nothing to backfill.');
    return;
  }

  // 2. Obtain e-GP session token
  console.log('\n[2/4] Acquiring e-GP session token...');
  let sessionToken = process.env.EGP_SESSION_TOKEN;
  if (!sessionToken && CAPSOLVER_API_KEY) {
    sessionToken = await getEgpSessionToken(CAPSOLVER_API_KEY);
  } else if (!sessionToken) {
    console.error('❌ Error: Neither EGP_SESSION_TOKEN nor CAPSOLVER_API_KEY is provided in .env');
    process.exit(1);
  }
  console.log('  -> Session token ready.');

  // 3. Scan all projects in memory
  console.log(`\n[3/4] Scanning attachments across ${candidates.length} projects...`);
  const updates = [];
  let scannedCount = 0;
  let matchCount = 0;

  for (const proj of candidates) {
    scannedCount++;
    const cleanPid = (proj.project_id || proj.id || '').replace(/-[A-Za-z0-9]+$/, '');
    const title = proj.project_name || proj.title || '';
    console.log(`\n[${scannedCount}/${candidates.length}] Checking Project: ${cleanPid} - "${title.slice(0, 50)}..."`);

    let boqSummary = null;
    let boqMatches = null;
    let docVerified = 0;

    try {
      const infoRes = await fetch(`https://process5.gprocurement.go.th/egp-approval-service/apv-common/infoProcureDocAnnounZip?projectId=${cleanPid}`, {
        headers: COMMON_HEADERS(sessionToken)
      });

      if (infoRes.ok) {
        const infoJson = await infoRes.json();
        const templateIds = [
          infoJson?.data?.buildName3, // BOQ / บก.01 / ปร.4
          infoJson?.data?.buildName2, // TOR / สเปก
          infoJson?.data?.buildName1, // ประกาศเชิญชวน
          infoJson?.data?.buildName4,
          infoJson?.data?.buildName5
        ].filter(Boolean);

        if (templateIds.length === 0) {
          console.log('    ℹ️ No PDF templates available in e-GP.');
        }

        for (const templateId of templateIds) {
          try {
            const pdfRes = await fetch(`https://process5.gprocurement.go.th/egp-template-service/dant/view-pdf?templateId=${templateId}`, {
              method: 'POST',
              headers: COMMON_HEADERS(sessionToken)
            });

            if (pdfRes.ok) {
              const pdfJson = await pdfRes.json();
              if (pdfJson?.data) {
                const binaryBuf = Buffer.from(pdfJson.data, 'base64');
                const uint8Data = new Uint8Array(binaryBuf);
                const scanRes = await scanPdfBuffer(uint8Data);

                if (scanRes && scanRes.hasMatch) {
                  boqSummary = scanRes.summary;
                  boqMatches = scanRes.snippets;
                  docVerified = 1;
                  matchCount++;
                  console.log(`    🎯 MATCH FOUND! [${scanRes.matchedKeywords.join(', ')}] -> ${boqSummary}`);
                  break; // Found match in this project, stop checking other templates
                }
              }
            }
          } catch (e) {
            console.warn(`    ⚠️ Failed scanning template ${templateId}:`, e.message);
          }
        }
      }
    } catch (err) {
      console.warn(`    ⚠️ Error querying e-GP for ${cleanPid}:`, err.message);
    }

    if (docVerified === 1) {
      updates.push({
        id: proj.id,
        project_id: cleanPid,
        boq_summary: boqSummary,
        boq_matches: boqMatches,
        doc_verified: 1
      });
    }

    // Gentle delay to respect e-GP servers
    await new Promise(r => setTimeout(r, 1200));
  }

  // 4. Batch update D1
  console.log(`\n[4/4] Uploading updates to Cloudflare D1 (${updates.length} matches found)...`);
  if (updates.length > 0) {
    const updateRes = await fetch(`${D1_API_URL}/api/upload/update-boq`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': D1_API_KEY
      },
      body: JSON.stringify(updates)
    });

    if (updateRes.ok) {
      const updateJson = await updateRes.json();
      console.log('  -> ✅ D1 Database updated successfully:', updateJson.data);
    } else {
      console.error(`  -> ❌ Failed to update D1: ${updateRes.status}`, await updateRes.text());
    }
  } else {
    console.log('  -> No new matches to upload.');
  }

  console.log('\n====================================================');
  console.log(`🏁 Scan Complete: Scanned ${scannedCount} projects, Found ${matchCount} verified BOQ matches.`);
  console.log('====================================================');
}

main().catch(err => {
  console.error('Fatal backfill error:', err);
  process.exit(1);
});
