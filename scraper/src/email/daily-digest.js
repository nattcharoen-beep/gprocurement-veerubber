/**
 * Daily Digest Email Builder - Vee Rubber G-Procurement Tracker
 * Builds an executive, high-conversion HTML email summarizing daily procurement opportunities.
 * Features:
 *  - Intelligent Highlight Scoring & Tagging (⭐ งานใหม่ที่น่าสนใจ)
 *  - Executive KPI Summary Bar (Total pipeline value, highlight count, category breakdown)
 *  - High-Priority Featured Cards with direct e-GP & Dashboard CTAs
 *  - Categorized Sections: D0 (เปิดรับซอง), B0 (ร่าง TOR), 15 (ราคากลาง), P0 (แผนจัดซื้อ), W0 (ผู้ชนะ)
 *  - 100% Mobile & Desktop Responsive with Vee Rubber corporate branding (#0f2744 / #d32f2f)
 */

// Format numbers as Thai Baht
export function formatBaht(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) return 'ไม่ระบุ';
  return `฿${Number(amount).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatBahtShort(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) return 'ไม่ระบุ';
  const num = Number(amount);
  if (num >= 1000000) {
    return `฿${(num / 1000000).toFixed(2)} ล้าน`;
  } else if (num >= 1000) {
    return `฿${(num / 1000).toFixed(0)} พัน`;
  }
  return `฿${num.toLocaleString('th-TH')}`;
}

// Format Date to Thai locale
export function formatThaiDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export function formatThaiDateShort(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: '2-digit'
  });
}

const TYPE_CONFIG = {
  'D0': { icon: '🔴', label: 'ประกาศเชิญชวน (ยื่นซอง)', color: '#dc2626', bg: '#fee2e2', order: 1 },
  'D1': { icon: '🔴', label: 'ประกาศเชิญชวน (ยื่นซอง)', color: '#dc2626', bg: '#fee2e2', order: 1 },
  'B0': { icon: '🟡', label: 'ร่างประกาศ / ร่าง TOR (วิจารณ์สเปก)', color: '#d97706', bg: '#fef3c7', order: 2 },
  '15': { icon: '🟠', label: 'ตารางราคากลาง / BOQ', color: '#ea580c', bg: '#ffedd5', order: 3 },
  'P0': { icon: '🟢', label: 'แผนการจัดซื้อจัดจ้าง (ล่วงหน้า)', color: '#059669', bg: '#d1fae5', order: 4 },
  'W0': { icon: '✅', label: 'ผลการจัดซื้อจัดจ้าง / ผู้ชนะ', color: '#2563eb', bg: '#dbeafe', order: 5 }
};

/**
 * Normalizes an announcement item from either scraper or database format
 */
export function normalizeItem(item) {
  const title = item.title || item.project_name || 'ไม่มีชื่อโครงการ';
  let announceType = item.announceType || item.announce_type || 'D0';
  if (announceType === 'D1' || announceType === 'IM') announceType = 'D0';
  if (announceType === 'BOQ') announceType = '15';
  if (announceType === 'B1' || announceType === 'B2' || announceType === 'B3') announceType = 'B0';

  const budget = Number(item.budget) || 0;
  const date = item.announce_date || item.announceDate || '';
  const dept = item.department || 'หน่วยงานภาครัฐ';
  const prov = (item.province || '').replace(/^จ(ังหวัด|\.)\s*/, '').trim() || 'ไม่ระบุ';
  const url = item.url || (item.project_id ? `https://process5.gprocurement.go.th/egp-agpc01-web/announcement?keywordSearch=${item.project_id}` : 'https://veerubber-finder.pages.dev');
  const deadline = item.deadline || '';
  const projectId = item.project_id || item.projectId || '';

  return {
    ...item,
    id: item.id || `${projectId}-${announceType}`,
    projectId,
    title,
    announceType,
    budget,
    date,
    dept,
    prov,
    url,
    deadline
  };
}

/**
 * Calculates interest score and generates tags for a project
 */
export function scoreAndTagProject(item) {
  let score = 0;
  const tags = [];
  const lowerTitle = item.title.toLowerCase();

  // 1. Budget Score
  if (item.budget >= 10000000) {
    score += 35;
    tags.push({ label: '💎 เมกะโปรเจกต์ 10M+', color: '#7c3aed', bg: '#ede9fe' });
  } else if (item.budget >= 5000000) {
    score += 28;
    tags.push({ label: '💰 งบสูง 5M+', color: '#047857', bg: '#d1fae5' });
  } else if (item.budget >= 1000000) {
    score += 20;
    tags.push({ label: '✨ โครงการ 1M+', color: '#0369a1', bg: '#e0f2fe' });
  } else if (item.budget >= 500000) {
    score += 10;
    tags.push({ label: '🏷️ งบ 500k+', color: '#4b5563', bg: '#f3f4f6' });
  }

  // 1.1 In-Memory BOQ Verified Super Bonus (+50 pts)
  if (item.boq_summary || item.doc_verified) {
    score += 50;
    tags.unshift({ label: '🎯 ตรวจเจอเนื้องานใน BOQ', color: '#ffffff', bg: '#16a34a' });
  }

  // 2. Core Business Specialty Tags for Vee Rubber
  if (lowerTitle.includes('ยางรถยนต์') || lowerTitle.includes('ยางรถเก๋ง') || lowerTitle.includes('ยางรถกระบะ') || lowerTitle.includes('ยางรถตู้')) {
    score += 35;
    tags.push({ label: '🚗 ยางรถยนต์/กระบะ', color: '#1d4ed8', bg: '#dbeafe' });
  }
  if (lowerTitle.includes('ยางรถบรรทุก') || lowerTitle.includes('ยางรถบัส') || lowerTitle.includes('ยางรถขยะ') || lowerTitle.includes('ยางรถน้ำ')) {
    score += 35;
    tags.push({ label: '🚛 ยางรถบรรทุก/บัส', color: '#0369a1', bg: '#e0f2fe' });
  }
  if (lowerTitle.includes('ยางรถจักรยานยนต์') || lowerTitle.includes('ยางมอเตอร์ไซค์') || lowerTitle.includes('ยางสายตรวจ')) {
    score += 30;
    tags.push({ label: '🏍️ ยางมอเตอร์ไซค์/สายตรวจ', color: '#6d28d9', bg: '#ede9fe' });
  }
  if (lowerTitle.includes('ยาง otr') || lowerTitle.includes('ยาง OTR') || lowerTitle.includes('ยางรถแทรกเตอร์') || lowerTitle.includes('ยางรถไถ') || lowerTitle.includes('ยางรถตัก') || lowerTitle.includes('ยางรถยก')) {
    score += 35;
    tags.push({ label: '🚜 ยาง OTR/เครื่องจักร', color: '#15803d', bg: '#dcfce7' });
  }
  if (lowerTitle.includes('ยางใน') || lowerTitle.includes('ยางรองคอด') || lowerTitle.includes('จุ๊บลม')) {
    score += 25;
    tags.push({ label: '🔘 ยางใน/อุปกรณ์ล้อ', color: '#4338ca', bg: '#e0e7ff' });
  }
  if (lowerTitle.includes('ยางเรเดียล') || lowerTitle.includes('ยาง radial') || lowerTitle.includes('เปลี่ยนยาง') || lowerTitle.includes('จัดซื้อยาง')) {
    score += 20;
    tags.push({ label: '🔧 จัดซื้อยางราชการ', color: '#0f766e', bg: '#ccfbf1' });
  }

  // 2.1 Disguised High-Yield Curated Patterns (Learned from employee's daily sent emails)
  if (lowerTitle.includes('สวนสาธารณะ')) {
    score += 25;
    tags.push({ label: '🌳 สวนสาธารณะ (สเปกสนาม/เครื่องเล่นแฝง)', color: '#047857', bg: '#d1fae5' });
  }
  if (lowerTitle.includes('หลังคาโครงเหล็ก') || lowerTitle.includes('โครงสร้างเหล็ก')) {
    score += 25;
    tags.push({ label: '🏗️ โดม/หลังคาโครงเหล็ก (สเปกพื้น PU/สนามแฝง)', color: '#0369a1', bg: '#e0f2fe' });
  }
  if (lowerTitle.includes('ศูนย์นันทนาการ') || lowerTitle.includes('ศูนย์เยาวชน')) {
    score += 30;
    tags.push({ label: '🎯 ศูนย์นันทนาการ/เยาวชน (ลูกค้ารายใหญ่)', color: '#b91c1c', bg: '#fee2e2' });
  }
  if (lowerTitle.includes('ซ่อมแซมพื้น') || lowerTitle.includes('ปรับปรุงพื้น') || lowerTitle.includes('เคลือบพื้น')) {
    score += 25;
    tags.push({ label: '✨ งานซ่อม/เคลือบพื้น', color: '#7c3aed', bg: '#ede9fe' });
  }
  if (lowerTitle.includes('เฉพาะเจาะจง') || item.methodId === '19') {
    score += 15;
    tags.push({ label: '🎯 เฉพาะเจาะจง (งานตรง/ขายของได้ทันที)', color: '#7e22ce', bg: '#f3e8ff' });
  }

  // 3. Stage Score
  if (item.announceType === 'D0') {
    score += 20;
    tags.push({ label: '🔴 เปิดรับซอง', color: '#dc2626', bg: '#fee2e2' });
  } else if (item.announceType === 'B0') {
    score += 15;
    tags.push({ label: '🟡 ดักสเปก TOR', color: '#d97706', bg: '#fef3c7' });
  } else if (item.announceType === '15') {
    score += 10;
    tags.push({ label: '🟠 ตรวจราคากลาง', color: '#ea580c', bg: '#ffedd5' });
  }

  // 4. Province Tag
  if (item.prov && item.prov !== 'ไม่ระบุ') {
    tags.push({ label: `📍 จ.${item.prov}`, color: '#374151', bg: '#f3f4f6' });
  }

  // Determine if it qualifies as top highlight
  const isHighlight = score >= 45 || (item.budget >= 2000000 && score >= 35);

  return { score, tags, isHighlight };
}

export function buildDigestHTML(announcements, options = {}) {
  const recipientEmail = options.recipient || process.env.GMAIL_RECIPIENTS || process.env.ADMIN_EMAIL || 'admin@veerubber.co.th';
  const today = formatThaiDate(new Date().toISOString());
  const portalUrl = 'https://veerubber-finder.pages.dev';

  // Normalize and score all items
  const normalized = (announcements || []).map(normalizeItem);
  const scoredItems = normalized.map(item => ({
    ...item,
    meta: scoreAndTagProject(item)
  }));

  // Sort by interest score descending
  scoredItems.sort((a, b) => b.meta.score - a.meta.score);

  // Separate highlights (Top 5-8 items with high interest score)
  const highlights = scoredItems.filter(x => x.meta.isHighlight).slice(0, 8);
  const highlightIds = new Set(highlights.map(x => x.id));

  // Compute Summary KPIs
  const totalCount = scoredItems.length;
  const totalBudget = scoredItems.reduce((sum, x) => sum + (x.budget || 0), 0);
  const d0Count = scoredItems.filter(x => x.announceType === 'D0').length;
  const b0Count = scoredItems.filter(x => x.announceType === 'B0').length;
  const p0Count = scoredItems.filter(x => x.announceType === 'P0').length;
  const boqCount = scoredItems.filter(x => x.announceType === '15').length;

  // Group by type for the full list
  const grouped = {};
  for (const item of scoredItems) {
    const t = item.announceType;
    if (!grouped[t]) grouped[t] = [];
    grouped[t].push(item);
  }

  const sortedTypes = ['D0', 'B0', '15', 'P0', 'W0'].filter(t => grouped[t] && grouped[t].length > 0);

  return `
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>สรุปงานจัดซื้อจัดจ้างภาครัฐ — วีรับเบอร์ (VEE RUBBER)</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Anuphan', Tahoma, sans-serif;
      line-height: 1.5;
      color: #1e293b;
      background-color: #f1f5f9;
      margin: 0;
      padding: 16px;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      max-width: 760px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
      border: 1px solid #e2e8f0;
    }
    /* Header */
    .header {
      background: linear-gradient(135deg, #002244 0%, #003366 50%, #004d99 100%);
      color: #ffffff;
      padding: 28px 24px 22px;
      text-align: center;
    }
    .brand-badge {
      display: inline-block;
      background: rgba(255, 255, 255, 0.15);
      border: 1px solid rgba(255, 255, 255, 0.3);
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 1px;
      text-transform: uppercase;
      margin-bottom: 8px;
    }
    .header h1 {
      margin: 6px 0 4px 0;
      font-size: 22px;
      font-weight: 800;
      letter-spacing: -0.5px;
    }
    .header .subtitle {
      font-size: 14px;
      opacity: 0.9;
      color: #cbd5e1;
    }
    /* KPI Bar */
    .kpi-container {
      display: table;
      width: 100%;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
      table-layout: fixed;
    }
    .kpi-box {
      display: table-cell;
      padding: 14px 8px;
      text-align: center;
      border-right: 1px solid #e2e8f0;
    }
    .kpi-box:last-child {
      border-right: none;
    }
    .kpi-val {
      font-size: 18px;
      font-weight: 800;
      color: #003366;
      line-height: 1.2;
    }
    .kpi-val.highlight {
      color: #059669;
    }
    .kpi-label {
      font-size: 11px;
      font-weight: 600;
      color: #64748b;
      margin-top: 3px;
    }
    /* Main Content */
    .content {
      padding: 24px 20px;
    }
    /* Section Titles */
    .section-header {
      margin: 28px 0 16px 0;
      padding-bottom: 8px;
      border-bottom: 2px solid #003366;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .section-header h2 {
      margin: 0;
      font-size: 17px;
      font-weight: 700;
      color: #003366;
    }
    .section-badge {
      background: #003366;
      color: #ffffff;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 700;
    }
    /* Highlight Cards */
    .highlight-card {
      background: #ffffff;
      border: 1.5px solid #0284c7;
      border-left: 6px solid #0284c7;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 14px;
      box-shadow: 0 2px 8px rgba(2, 132, 199, 0.08);
      position: relative;
    }
    .highlight-card.super {
      border-color: #f59e0b;
      border-left-color: #f59e0b;
      background: linear-gradient(to right, #fffbeb, #ffffff 40%);
      box-shadow: 0 3px 10px rgba(245, 158, 11, 0.12);
    }
    .card-title {
      font-size: 15px;
      font-weight: 700;
      color: #0f172a;
      line-height: 1.45;
      margin: 0 0 8px 0;
    }
    .card-title a {
      color: #0f172a;
      text-decoration: none;
    }
    .card-title a:hover {
      color: #003366;
      text-decoration: underline;
    }
    .tags-row {
      margin-bottom: 10px;
    }
    .tag {
      display: inline-block;
      font-size: 11px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 4px;
      margin-right: 4px;
      margin-bottom: 4px;
    }
    .card-meta {
      font-size: 13px;
      color: #475569;
      margin-bottom: 4px;
    }
    .card-meta strong {
      color: #1e293b;
    }
    .budget-tag {
      font-size: 16px;
      font-weight: 800;
      color: #059669;
      margin: 6px 0;
    }
    .card-actions {
      margin-top: 12px;
      padding-top: 10px;
      border-top: 1px dashed #e2e8f0;
    }
    .btn {
      display: inline-block;
      padding: 6px 14px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      text-decoration: none;
      margin-right: 6px;
    }
    .btn-egp {
      background: #003366;
      color: #ffffff !important;
    }
    .btn-portal {
      background: #f1f5f9;
      color: #003366 !important;
      border: 1px solid #cbd5e1;
    }
    /* Standard Item */
    .standard-item {
      background: #f8fafc;
      border-left: 4px solid #94a3b8;
      border-radius: 0 6px 6px 0;
      padding: 12px 14px;
      margin-bottom: 10px;
    }
    .standard-title {
      font-size: 14px;
      font-weight: 600;
      color: #1e293b;
      margin: 0 0 6px 0;
      line-height: 1.4;
    }
    /* Winner items */
    .winner-box {
      background: #f0fdf4;
      border-left: 4px solid #22c55e;
      padding: 10px 12px;
      border-radius: 0 6px 6px 0;
      margin-top: 6px;
      font-size: 13px;
    }
    /* Footer */
    .footer {
      background: #0f172a;
      color: #94a3b8;
      padding: 24px 20px;
      text-align: center;
      font-size: 12px;
      line-height: 1.6;
    }
    .footer a {
      color: #38bdf8;
      text-decoration: none;
      font-weight: 600;
    }
    .footer strong {
      color: #e2e8f0;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <!-- Header -->
    <div class="header">
      <div class="brand-badge">🚗 วีรับเบอร์ (VEE RUBBER) • PROCUREMENT TRACKER</div>
      <h1>📋 สรุปงานจัดซื้อจัดจ้างภาครัฐ</h1>
      <div class="subtitle">ประจำวันที่ ${today} • ระบบสแกนและคัดกรองอัตโนมัติ e-GP</div>
    </div>

    <!-- KPI Summary Bar -->
    <div class="kpi-container">
      <div class="kpi-box">
        <div class="kpi-val highlight">${highlights.length}</div>
        <div class="kpi-label">⭐ งานไฮไลท์เด่น</div>
      </div>
      <div class="kpi-box">
        <div class="kpi-val">${d0Count}</div>
        <div class="kpi-label">🔴 เปิดรับซอง</div>
      </div>
      <div class="kpi-box">
        <div class="kpi-val">${b0Count}</div>
        <div class="kpi-label">🟡 ร่าง TOR</div>
      </div>
      <div class="kpi-box">
        <div class="kpi-val" style="color: #0284c7;">${formatBahtShort(totalBudget)}</div>
        <div class="kpi-label">💰 งบรวม (${totalCount} งาน)</div>
      </div>
    </div>

    <div class="content">
      <!-- TOP HIGHLIGHTS SECTION -->
      <div class="section-header" style="border-color: #f59e0b; margin-top: 10px;">
        <h2 style="color: #b45309;">⭐ โครงการใหม่ที่น่าสนใจเป็นพิเศษ (Recommended Highlights)</h2>
        <span class="section-badge" style="background: #f59e0b; color: #78350f;">${highlights.length} โครงการคัดสรร</span>
      </div>

      ${highlights.length === 0 ? `
        <div style="text-align: center; padding: 24px; color: #64748b; background: #f8fafc; border-radius: 8px;">
          ยังไม่พบโครงการที่มีงบประมาณขนาดใหญ่หรือตรงสเปกพิเศษในรอบนี้ ระบบจะสแกนและแจ้งเตือนใหม่อัตโนมัติทุกวัน
        </div>
      ` : highlights.map((item, idx) => `
        <div class="highlight-card ${item.meta.score >= 55 ? 'super' : ''}" style="${(item.boq_summary || item.doc_verified) ? 'border: 2px solid #16a34a; border-left: 6px solid #16a34a; background: linear-gradient(180deg, #ffffff 0%, #fafffc 100%);' : ''}">
          ${(item.boq_summary || item.doc_verified) ? `
            <div style="margin-bottom: 10px;">
              <div style="background: linear-gradient(135deg, #15803d 0%, #16a34a 100%); color: #ffffff; font-weight: 800; font-size: 13px; padding: 6px 14px; border-radius: 6px; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 2px 6px rgba(22, 163, 74, 0.3); border: 1px solid #86efac;">
                <span style="font-size: 15px;">🎯</span> ตรวจเจอเนื้องานใน BOQ
                <span style="background: rgba(255, 255, 255, 0.25); color: #ffffff; font-size: 11px; padding: 2px 6px; border-radius: 10px; margin-left: 4px;">สเปกตรงสาย 100%</span>
              </div>
            </div>
          ` : ''}
          <div class="tags-row">
            ${item.meta.score >= 55 ? '<span class="tag" style="background: #fef3c7; color: #b45309; border: 1px solid #fcd34d;">🔥 แนะนำอันดับ 1</span>' : ''}
            ${item.meta.tags.map(t => `<span class="tag" style="background: ${t.bg}; color: ${t.color};">${t.label}</span>`).join('')}
          </div>
          
          <h3 class="card-title">
            <a href="${item.url}" target="_blank">${idx + 1}. ${item.title}</a>
          </h3>

          <div class="budget-tag">
            ${formatBaht(item.budget)}
          </div>

          <div class="card-meta">
            <strong>🏢 หน่วยงาน:</strong> ${item.dept} &nbsp;•&nbsp; <strong>📍 จังหวัด:</strong> ${item.prov}
          </div>

          ${(item.boq_summary || item.boq_matches || item.doc_verified) ? (() => {
            let kw = '';
            if (item.boq_matches) {
              try {
                const mList = typeof item.boq_matches === 'string' ? JSON.parse(item.boq_matches) : item.boq_matches;
                if (Array.isArray(mList) && mList.length > 0 && mList[0].keyword) kw = mList[0].keyword;
              } catch (e) {}
            }
            if (!kw && item.boq_summary) {
              const m = item.boq_summary.match(/พบสเปก\s*["“]([^"”]+)["”]/i);
              if (m && m[1]) kw = m[1];
            }
            if (!kw) {
              if (item.product_group === 'passenger_car_tires') kw = 'ยางรถยนต์ & กระบะ';
              else if (item.product_group === 'truck_bus_tires') kw = 'ยางรถบรรทุก & บัส';
              else if (item.product_group === 'motorcycle_tires') kw = 'ยางจักรยานยนต์ & สายตรวจ';
              else if (item.product_group === 'otr_heavy_machinery') kw = 'ยาง OTR & เครื่องจักร';
              else if (item.product_group === 'bicycle_specialty_tires') kw = 'ยางจักรยาน & วีลแชร์';
              else if (item.product_group === 'tube_accessories') kw = 'ยางใน & อุปกรณ์';
              else kw = 'จัดซื้อยางราชการ';
            }
            return `
              <div style="background: #f0fdf4; border: 1.5px solid #86efac; border-left: 5px solid #16a34a; border-radius: 6px; padding: 10px 14px; margin: 10px 0; font-size: 14px; color: #14532d;">
                <span style="font-weight: 800; color: #166534;">🎯 ตรวจพบ Keyword =</span>
                <span style="background: #16a34a; color: #ffffff; padding: 2px 10px; border-radius: 4px; font-weight: 900; font-size: 15px; margin-left: 4px;">${kw}</span>
              </div>
            `;
          })() : ''}

          ${item.bid_date ? `
            <div class="card-meta" style="color: #dc2626; font-weight: 600;">
              ⏳ กำหนดยื่นซอง: ${formatThaiDate(item.bid_date)}
            </div>
          ` : item.deadline && item.deadline !== 'ยังไม่กำหนด' ? `
            <div class="card-meta" style="color: #b45309; font-weight: 600;">
              ⏳ กำหนดส่งซอง (ประมาณการ): ${formatThaiDate(item.deadline)}
            </div>
          ` : item.date ? `
            <div class="card-meta">
              📅 วันที่ประกาศ: ${formatThaiDate(item.date)}
            </div>
          ` : ''}

          <div class="card-actions">
            <a href="${item.url}" target="_blank" class="btn btn-egp">
              🔗 เปิดเอกสารบน e-GP &rarr;
            </a>
            <a href="${portalUrl}" target="_blank" class="btn btn-portal">
              📱 ดูในระบบ Vee Rubber
            </a>
          </div>
        </div>
      `).join('')}

      <!-- ALL CATEGORIZED OPPORTUNITIES -->
      ${sortedTypes.map(type => {
        const conf = TYPE_CONFIG[type] || { icon: '📄', label: `รหัส ${type}`, color: '#003366', bg: '#f1f5f9' };
        const items = grouped[type] || [];
        return `
          <div class="section-header" style="border-color: ${conf.color};">
            <h2 style="color: ${conf.color};">${conf.icon} ${conf.label}</h2>
            <span class="section-badge" style="background: ${conf.color};">${items.length} รายการ</span>
          </div>

          ${items.slice(0, 15).map((item, i) => `
            <div class="standard-item" style="border-left-color: ${(item.boq_summary || item.doc_verified) ? '#16a34a' : conf.color}; ${(item.boq_summary || item.doc_verified) ? 'background: #f0fdf4; border: 1.5px solid #86efac; border-left: 5px solid #16a34a;' : ''}">
              ${(item.boq_summary || item.doc_verified) ? `
                <div style="margin-bottom: 6px;">
                  <span style="background: #16a34a; color: #ffffff; font-size: 11px; font-weight: 800; padding: 3px 8px; border-radius: 4px; display: inline-flex; align-items: center; gap: 4px;">
                    🎯 ตรวจเจอเนื้องานใน BOQ (สเปกตรง 100%)
                  </span>
                </div>
              ` : ''}
              <h4 class="standard-title">
                <a href="${item.url}" target="_blank" style="color: inherit; text-decoration: none;">
                  ${i + 1}. ${item.title}
                </a>
              </h4>
              <div style="font-size: 13px; color: #475569; display: flex; flex-wrap: wrap; gap: 12px; align-items: center;">
                <div><strong>งบประมาณ:</strong> <span style="color: #059669; font-weight: 700;">${formatBaht(item.budget)}</span></div>
                <div><strong>หน่วยงาน:</strong> ${item.dept} (${item.prov})</div>
                ${item.deadline && item.deadline !== 'ยังไม่กำหนด' ? `<div><strong>ปิดรับ:</strong> ${formatThaiDateShort(item.deadline)}</div>` : ''}
                <div><a href="${item.url}" target="_blank" style="color: #003366; font-weight: 600; text-decoration: none;">🔗 e-GP</a></div>
              </div>

              ${item.boq_summary ? `
                <div style="margin-top: 8px; font-size: 12px; color: #14532d; background: #dcfce7; padding: 6px 10px; border-radius: 4px; border: 1px solid #86efac; font-weight: 600;">
                  🎯 <strong>ตรวจเจอเนื้องานใน BOQ:</strong> ${item.boq_summary}
                </div>
              ` : ''}

              ${type === 'W0' ? `
                <div class="winner-box">
                  <div><strong>ผู้ชนะ:</strong> ${item.winner_name || 'ไม่ระบุ'}</div>
                  <div><strong>ราคาชนะ:</strong> ${formatBaht(item.winner_price)} ${item.discount_percent ? `(ลด ${item.discount_percent.toFixed(2)}%)` : ''}</div>
                </div>
              ` : ''}
            </div>
          `).join('')}

          ${items.length > 15 ? `
            <div style="text-align: center; padding: 8px; font-size: 13px;">
              <a href="${portalUrl}" style="color: #003366; font-weight: 600;">
                + ดูอีก ${items.length - 15} รายการในหมวดนี้บนระบบ Vee Rubber Tracker &rarr;
              </a>
            </div>
          ` : ''}
        `;
      }).join('')}

    </div>

    <!-- Footer -->
    <div class="footer">
      <p style="margin-bottom: 6px;">
        อีเมลสรุปข้อมูลอัตโนมัตินี้ส่งถึง <strong>${recipientEmail}</strong> ทุกวันเวลา 07:00 น.
      </p>
      <p style="margin-bottom: 12px;">
        รวบรวมและคัดกรองข้อมูลตรงจากระบบ e-GP กรมบัญชีกลาง สำหรับ บริษัท วีรับเบอร์ คอร์ปอเรชั่น จำกัด (Vee Rubber)
      </p>
      <p style="margin: 0;">
        <a href="${portalUrl}" target="_blank">🌐 เปิดเข้าระบบ Vee Rubber G-Procurement Tracker</a>
      </p>
    </div>
  </div>
</body>
</html>
  `;
}


