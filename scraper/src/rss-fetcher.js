import fetch from 'node-fetch';
import iconv from 'iconv-lite';
import { XMLParser } from 'fast-xml-parser';

/**
 * Sleep utility for rate limiting
 * @param {number} ms 
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Fetch a single RSS feed for a department and announce type
 * @param {string|null} deptId 
 * @param {string} announceType 
 * @param {boolean} useMethodId 
 * @param {number} retryCount 
 */
export async function fetchRSSFeed(deptId = null, announceType, useMethodId = true, retryCount = 0) {
  let url = 'http://process3.gprocurement.go.th/EPROCRssFeedWeb/egpannouncerss.xml?';
  if (deptId) {
    url += `deptId=${deptId}&`;
    if (useMethodId) url += 'methodId=16&';
  }
  url += `anounceType=${announceType}`;
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s fast timeout

    const response = await fetch(url, { 
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
        'Accept': 'application/xml, text/xml, */*'
      }
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return [];
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Convert Windows-874 to UTF-8
    const xmlString = iconv.decode(buffer, 'win874');

    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_"
    });
    
    const parsedData = parser.parse(xmlString);
    
    const items = parsedData?.rss?.channel?.item;
    if (!items) return [];

    // Ensure items is always an array (fast-xml-parser returns object if single item)
    const itemArray = Array.isArray(items) ? items : [items];
    
    return itemArray.map(item => {
      let projId = null;
      if (item.link && item.link.includes('projectId=')) {
        const match = item.link.match(/projectId=([0-9]+)/);
        if (match) projId = match[1];
      } else if (item.description && /^[0-9]{11}/.test(item.description.trim())) {
        projId = item.description.trim().substring(0, 11);
      }

      return {
        id: projId ? `${projId}-${announceType}` : (item.guid || item.link),
        project_id: projId,
        title: item.title,
        department: item.author || (deptId || ''),
        url: item.link,
        description: item.description,
        announceType: announceType,
        announceDate: item.pubDate
      };
    });

  } catch (error) {
    return [];
  }
}

/**
 * Fetch all feeds with high concurrency (20 workers) and progression logging
 * @param {Array<{deptId: string, name: string}>} agencies 
 * @param {Object} announceTypes 
 */
export async function fetchAllFeeds(agencies, announceTypes) {
  let allResults = [];
  const types = Object.keys(announceTypes);
  
  // Fetch Targeted Agencies with concurrency pool (20 workers)
  console.log(`[INFO] Fetching targeted feeds for ${agencies.length} agencies (${types.join(', ')})...`);
  const queue = [];
  for (const agency of agencies) {
    for (const type of types) {
      queue.push({ deptId: agency.deptId, name: agency.name, type });
    }
  }

  const CONCURRENCY = 20;
  let finished = 0;
  const total = queue.length;

  async function worker() {
    while (queue.length > 0) {
      const task = queue.shift();
      if (!task) break;

      try {
        const results = await fetchRSSFeed(task.deptId, task.type);
        if (results.length > 0) {
          allResults.push(...results);
        }
      } catch (e) {}

      finished++;
      if (finished % 200 === 0 || finished === total) {
        console.log(`[PROGRESS] Fetched ${finished}/${total} agency requests (${allResults.length} items collected)`);
      }
      await sleep(20);
    }
  }

  const workers = Array.from({ length: CONCURRENCY }, () => worker());
  await Promise.all(workers);

  console.log(`[INFO] Finished fetching feeds in fast mode. Total raw items: ${allResults.length}`);
  return allResults;
}
