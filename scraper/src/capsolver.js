/**
 * CapSolver Cloudflare Turnstile Resolution Service for e-GP v5
 * Automates 100% cloud-based bypass of Cloudflare Turnstile on process5.gprocurement.go.th.
 * Obtains authenticated x-announcement-token for precision harvesting.
 */

import fetch from 'node-fetch';

const EGP_PORTAL_URL = 'https://process5.gprocurement.go.th/egp-agpc01-web/announcement';
const EGP_TURNSTILE_SITEKEY = '0x4AAAAAABuINxkTjFy-_hpH';
const EGP_VALIDATE_ENDPOINT = 'https://process5.gprocurement.go.th/egp-oann10-service/pb/a-egp-allt-project/api/v1/cfturnstile/validate';

/**
 * Solve Cloudflare Turnstile via CapSolver API and return e-GP session token
 * @param {string} apiKey CapSolver API Key
 * @returns {Promise<string>} x-announcement-token
 */
export async function getEgpSessionToken(apiKey) {
  if (!apiKey) {
    throw new Error('CapSolver API Key is missing. Please set CAPSOLVER_API_KEY in .env or GitHub Secrets.');
  }

  const cookieJar = {};
  function updateCookies(res) {
    const list = res.headers.raw ? res.headers.raw()['set-cookie'] : [res.headers.get('set-cookie')];
    if (list) {
      for (const c of list) {
        if (!c) continue;
        const part = c.split(';')[0].trim();
        const eq = part.indexOf('=');
        if (eq !== -1) {
          cookieJar[part.slice(0, eq).trim()] = part.slice(eq + 1).trim();
        }
      }
    }
  }
  function getCookieString() {
    return Object.entries(cookieJar).map(([k, v]) => `${k}=${v}`).join('; ');
  }

  // 1. Establish WAF session cookie by pre-fetching announcement portal
  try {
    const portalRes = await fetch(EGP_PORTAL_URL, {
      headers: {
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
      }
    });
    updateCookies(portalRes);
  } catch (e) {
    console.warn('[CapSolver] Portal pre-fetch cookie warning:', e.message);
  }

  console.log('[CapSolver] Requesting Cloudflare Turnstile solution for e-GP v5...');

  // 2. Create Task
  const createRes = await fetch('https://api.capsolver.com/createTask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      clientKey: apiKey,
      task: {
        type: 'AntiTurnstileTaskProxyLess',
        websiteURL: EGP_PORTAL_URL,
        websiteKey: EGP_TURNSTILE_SITEKEY
      }
    })
  });

  const createJson = await createRes.json();
  if (createJson.errorId !== 0 || !createJson.taskId) {
    throw new Error(`CapSolver createTask error: ${createJson.errorDescription || JSON.stringify(createJson)}`);
  }

  const taskId = createJson.taskId;
  console.log(`[CapSolver] Task created: ${taskId}. Waiting for solution...`);

  // 3. Poll Task Result
  let turnstileToken = null;
  const maxRetries = 25; // 50 seconds max
  for (let i = 1; i <= maxRetries; i++) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    const resultRes = await fetch('https://api.capsolver.com/getTaskResult', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientKey: apiKey,
        taskId: taskId
      })
    });
    const resultJson = await resultRes.json();
    if (resultJson.status === 'ready') {
      turnstileToken = resultJson.solution?.token;
      console.log(`[CapSolver] Turnstile solved successfully in ~${i * 2}s!`);
      break;
    }
    if (resultJson.status === 'failed') {
      throw new Error(`CapSolver solving failed: ${resultJson.errorDescription || 'Unknown error'}`);
    }
  }

  if (!turnstileToken) {
    throw new Error('[CapSolver] Timed out waiting for Turnstile resolution.');
  }

  // 4. Exchange Turnstile Token for e-GP x-announcement-token
  console.log('[CapSolver] Exchanging Turnstile token with e-GP backend verification...');
  const validateUrl = `${EGP_VALIDATE_ENDPOINT}/${encodeURIComponent(turnstileToken)}`;
  const validateRes = await fetch(validateUrl, {
    headers: {
      'accept': 'application/json, text/plain, */*',
      'referer': EGP_PORTAL_URL,
      'noToken': 'noToken',
      'noDataProfile': 'noDataProfile',
      'Content-Type': 'application/json',
      ...(getCookieString() ? { 'cookie': getCookieString() } : {}),
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
    }
  });

  if (!validateRes.ok) {
    throw new Error(`e-GP validation endpoint failed with status ${validateRes.status}`);
  }

  const validateJson = await validateRes.json();
  console.log('[CapSolver] e-GP validate response:', JSON.stringify(validateJson).slice(0, 250));
  const sessionToken = validateJson.data;

  if (!sessionToken) {
    throw new Error(`e-GP returned empty announcementToken: ${JSON.stringify(validateJson)}`);
  }

  // Update session cookies with validate response
  updateCookies(validateRes);

  console.log('[CapSolver] ✅ Successfully acquired authenticated e-GP session token!');
  return { token: sessionToken, cookies: getCookieString() };
}
