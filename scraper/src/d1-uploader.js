/**
 * D1 Uploader Module
 * Uploads announcements to Cloudflare D1 via the Hono API.
 * Handles field name mapping between scraper output (camelCase) and API format (snake_case).
 */

import { parseWinnerInfo } from './winner-parser.js';

export async function uploadToD1(announcements, apiUrl, apiKey) {
  const endpoint = `${apiUrl}/api/upload/announcements`;
  const CHUNK_SIZE = 50;
  let totalInserted = 0;
  let totalErrors = 0;

  console.log(`[D1 Uploader] Starting upload of ${announcements.length} items in chunks of ${CHUNK_SIZE}...`);

  for (let i = 0; i < announcements.length; i += CHUNK_SIZE) {
    const chunk = announcements.slice(i, i + CHUNK_SIZE);
    
    // Map scraper format → API format (handle both camelCase and snake_case)
    const payload = chunk.map(item => {
      // Parse winner info from description if this is a W0 announcement
      const announceType = item.announceType || item.announce_type;
      let winnerInfo = {};
      if (announceType === 'W0' && item.description) {
        winnerInfo = parseWinnerInfo(item.description, item.budget);
      }

      // product_groups is an array from classifier — take first group or join
      const productGroup = Array.isArray(item.product_groups) 
        ? item.product_groups[0] 
        : (item.product_group || null);

      return {
        id: item.id,
        project_id: item.project_id || item.projectId || null,
        project_name: item.title || item.project_name,
        announce_type: announceType,
        announce_date: item.announceDate || item.announce_date || new Date().toISOString(),
        budget: item.budget || null,
        department: item.department || '',
        province: item.province || null,
        product_group: productGroup,
        url: item.url,
        // Winner fields (from parser or direct)
        winner_name: item.winner_name || winnerInfo.winner_name || null,
        winner_price: item.winner_price || winnerInfo.winner_price || null,
        winner_tax_id: item.winner_tax_id || winnerInfo.winner_tax_id || null,
        discount_percent: item.discount_percent || winnerInfo.discount_percent || null,
        // In-Memory BOQ scanner verification fields
        boq_summary: item.boq_summary || null,
        boq_matches: item.boq_matches || null,
        doc_verified: item.doc_verified || 0,
        // Timeline date fields from e-GP ONLY (no fake deadlines)
        bid_date: item.bid_date || null,
        doc_start_date: item.doc_start_date || null,
        doc_end_date: item.doc_end_date || null,
        bid_time: item.bid_time || null
      };
    });

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[D1 Uploader] Error uploading chunk ${Math.floor(i / CHUNK_SIZE) + 1}: ${response.status} - ${errorText}`);
        totalErrors += chunk.length;
        continue;
      }

      const result = await response.json();
      totalInserted += result.data?.inserted || chunk.length;
      console.log(`[D1 Uploader] Chunk ${Math.floor(i / CHUNK_SIZE) + 1} uploaded: ${result.data?.inserted || chunk.length} items.`);
    } catch (error) {
      console.error(`[D1 Uploader] Exception uploading chunk ${Math.floor(i / CHUNK_SIZE) + 1}:`, error.message);
      totalErrors += chunk.length;
    }
  }

  console.log(`[D1 Uploader] Upload complete. Inserted: ${totalInserted}, Errors: ${totalErrors}`);
  return { inserted: totalInserted, errors: totalErrors };
}

/**
 * Fetches all approved users who opted in to receive daily emails
 */
export async function fetchSubscribers(apiUrl, apiKey) {
  if (!apiUrl || !apiKey) return [];
  try {
    const res = await fetch(`${apiUrl}/api/upload/subscribers`, {
      headers: { 'X-API-Key': apiKey }
    });
    if (!res.ok) return [];
    const json = await res.json();
    return (json.data || []).map(u => u.email).filter(Boolean);
  } catch (err) {
    console.warn('[D1 Uploader] Could not fetch subscribers from Worker:', err.message);
    return [];
  }
}

/**
 * Fallback: Fetches active verified announcements from D1 API
 */
export async function fetchLatestAnnouncements(apiUrl, limit = 60) {
  if (!apiUrl) return [];
  try {
    const res = await fetch(`${apiUrl}/api/announcements?limit=${limit}`);
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch (err) {
    console.warn('[D1 Uploader] Could not fetch latest announcements:', err.message);
    return [];
  }
}

