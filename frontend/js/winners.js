// winners.js
let winnersPage = 1;
const winnersLimit = 20;
let winnerSearchKeyword = '';
let selectedWinnerGroup = '';
let selectedWinnerYears = '1'; // Default: 1 year
let winnerSearchTimer = null;

function onWinnerSearch(event) {
  clearTimeout(winnerSearchTimer);
  winnerSearchTimer = setTimeout(() => {
    winnerSearchKeyword = document.getElementById('winner-search-input')?.value.trim() || '';
    winnersPage = 1;
    loadWinnerList();
  }, 350);
}

function filterWinnerGroup(group, btn) {
  selectedWinnerGroup = group;
  document.querySelectorAll('#winner-group-filters button').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  winnersPage = 1;
  loadWinnerList();
}

function selectWinnerYears(years, btn) {
  selectedWinnerYears = years;
  document.querySelectorAll('.year-filter-btn').forEach(b => b.classList.remove('active'));
  if (btn) {
    btn.classList.add('active');
  } else {
    document.querySelector(`.year-filter-btn[data-years="${years}"]`)?.classList.add('active');
  }

  const titles = {
    '1': '📊 ข่าวกรองคู่แข่งย้อนหลัง 1 ปี (ปีงบประมาณ 2568 - 2569)',
    '2': '📊 ข่าวกรองคู่แข่งย้อนหลัง 2 ปี (ปีงบประมาณ 2567 - 2569)',
    '5': '📊 ข่าวกรองคู่แข่งย้อนหลัง 5 ปี (ปีงบประมาณ 2563 - 2569)',
    '10': '📊 ข่าวกรองคู่แข่งย้อนหลัง 10 ปี (ปีงบประมาณ 2558 - 2569)',
    'all': '📊 ข่าวกรองคู่แข่งทั้งหมด (ทุกประวัติโครงการในระบบ)'
  };
  const titleEl = document.getElementById('historical-banner-title');
  if (titleEl) titleEl.textContent = titles[years] || '📊 ข่าวกรองคู่แข่ง';

  const indicatorEl = document.getElementById('active-period-indicator');
  if (indicatorEl) {
    const label = years === 'all' ? 'ทุกช่วงปี (ทั้งหมด)' : `${years} ปีย้อนหลัง`;
    indicatorEl.innerHTML = `แสดงข้อมูล: <strong style="color: #003366;">${label}</strong>`;
  }

  const topCardTitle = document.getElementById('top-winners-card-title');
  if (topCardTitle) {
    const periodText = years === 'all' ? 'ตลอดกาล' : `ย้อนหลัง ${years} ปี`;
    topCardTitle.textContent = `🏆 10 อันดับคู่แข่งที่ชนะงานบ่อยที่สุด (${periodText})`;
  }

  winnersPage = 1;
  loadWinners();
}

async function loadWinners() {
  await loadWinnerStats();
  await loadWinnerList();
}

async function loadWinnerStats() {
  try {
    const params = {};
    if (selectedWinnerYears) params.years = selectedWinnerYears;
    const res = await api.getWinnerStats(params);
    const statsData = res.data || {};
    const topCompanies = statsData.topCompanies || [];
    
    const tbody = document.querySelector('#top-winners-table tbody');
    if (!tbody) return;

    if (topCompanies.length === 0) {
      tbody.innerHTML = '<tr><td colspan="3" class="text-center">ไม่พบข้อมูล</td></tr>';
      return;
    }

    tbody.innerHTML = topCompanies.map((s, rankIdx) => {
      const isVeeRubber = (s.winner_name || '').includes('วีรับเบอร์') || (s.winner_name || '').includes('วี รับเบอร์') || (s.winner_name || '').includes('VEE RUBBER');
      const rowBg = isVeeRubber ? 'background: #fefce8;' : '';
      const nameTag = isVeeRubber 
        ? `<span style="background: #fef08a; color: #854d0e; font-weight: 800; font-size: 0.78rem; padding: 2px 8px; border-radius: 4px; border: 1px solid #facc15; margin-left: 6px;">⭐ บริษัทเรา</span>` 
        : '';
      return `
        <tr style="${rowBg}">
          <td><strong>${s.winner_name || 'ไม่ระบุ'}</strong>${nameTag}</td>
          <td><span style="background: ${isVeeRubber ? '#fef08a' : '#e0f2fe'}; color: ${isVeeRubber ? '#854d0e' : '#0284c7'}; font-weight: 700; padding: 2px 8px; border-radius: 6px;">${s.win_count || 0} โครงการ</span></td>
          <td><strong style="color: ${isVeeRubber ? '#854d0e' : '#003366'}; font-size: ${isVeeRubber ? '1.05rem' : '1rem'};">${formatMoney(s.total_value)}</strong></td>
        </tr>
      `;
    }).join('');

    // Group discount stats
    const groupStats = statsData.groupStats || [];
    const discountContainer = document.getElementById('group-discount-stats');
    if (discountContainer && groupStats.length > 0) {
      discountContainer.innerHTML = groupStats.map(g => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 7px 0; border-bottom: 1px solid #eee;">
          <span><strong>${groupLabels[g.product_group] || g.product_group}</strong></span>
          <span><strong style="color: #16a34a; font-size: 1.05rem;">ลดเฉลี่ย ${g.avg_discount ? g.avg_discount.toFixed(1) : 0}%</strong> <span style="color: #64748b;">(${g.project_count} โครงการ)</span></span>
        </div>
      `).join('');
    }
  } catch (err) {
    console.error('Error loading winner stats:', err);
  }
}

async function loadWinnerList(append = false) {
  const container = document.getElementById('winners-list');
  const btn = document.getElementById('btn-load-more-winners');
  if (!container) return;

  if (!append) container.innerHTML = '<div class="text-center">กำลังโหลด...</div>';

  try {
    const params = {
      page: winnersPage,
      limit: winnersLimit
    };
    if (selectedWinnerYears) params.years = selectedWinnerYears;
    if (winnerSearchKeyword) params.search = winnerSearchKeyword;
    if (selectedWinnerGroup) params.group = selectedWinnerGroup;

    const res = await api.getWinners(params);
    if (res.pagination && typeof res.pagination.total !== 'undefined') {
      const el = document.getElementById('total-historical-winners-count');
      if (el && !winnerSearchKeyword && !selectedWinnerGroup) {
        el.textContent = `${res.pagination.total} โครงการ`;
      }
    }

    const hiddenIds = JSON.parse(localStorage.getItem('veerubber_hidden_projects') || '[]');
    const items = (res.data || []).filter(it => {
      const pid = it.project_id || it.id || '';
      if (hiddenIds.includes(pid)) return false;
      const isVeeRubber = (it.winner_name || '').includes('วีรับเบอร์');
      // Never exclude Vee Rubber's own won projects!
      if (!isVeeRubber && typeof isExcluded === 'function' && isExcluded(it.project_name)) return false;
      return true;
    });
    
    const startIdx = append ? container.querySelectorAll('.announcement-card').length : 0;
    let html = items.map((item, idx) => {
      const itemIndex = startIdx + idx + 1;
      const groupClass = `group-${item.product_group}`;
      const discount = item.budget && item.winner_price 
        ? (((item.budget - item.winner_price) / item.budget) * 100).toFixed(2) + '%'
        : (item.discount_percent ? item.discount_percent.toFixed(2) + '%' : '-');

      const projId = item.project_id || item.id || '';
      const egpDirectUrl = (window.getEgpPortalUrl ? window.getEgpPortalUrl(item) : `https://process5.gprocurement.go.th/egp-agpc01-web/announcement?keywordSearch=${encodeURIComponent(projId)}`);

      // Derive fiscal year badge from project ID (e.g. 68... -> 2568, 63... -> 2563)
      const cleanMatch = projId.match(/(?:W0_)?(\d{2})\d{7,11}/);
      let yearBadge = '';
      if (cleanMatch && cleanMatch[1]) {
        const beYear = '25' + cleanMatch[1];
        yearBadge = `<span style="background: #e2e8f0; color: #1e293b; font-weight: 700; font-size: 0.8rem; padding: 2px 8px; border-radius: 4px; border: 1px solid #cbd5e1; display: inline-flex; align-items: center; gap: 3px;">📅 ปีงบ ${beYear}</span>`;
      }

      const provName = (item.province || '').trim();
      let provBadge = '';
      if (provName && provName !== 'ไม่ระบุ' && provName !== 'null') {
        const displayProv = (provName.startsWith('จังหวัด') || provName === 'กรุงเทพมหานคร' || provName.startsWith('จ.'))
          ? provName
          : `จ.${provName}`;
        provBadge = `<span style="background: #e0f2fe; color: #0284c7; font-weight: 700; font-size: 0.88rem; padding: 2px 10px; border-radius: 6px; border: 1px solid #bae6fd; display: inline-flex; align-items: center; gap: 3px; margin-left: 6px;">📍 ${displayProv}</span>`;
      }

      const reg = window.getRegionInfo ? window.getRegionInfo(provName) : null;
      let regBadge = '';
      if (reg) {
        regBadge = `<span style="background: ${reg.bg}; color: ${reg.color}; border: 1px solid ${reg.border}; font-weight: 700; font-size: 0.82rem; padding: 2px 8px; border-radius: 6px; display: inline-flex; align-items: center; gap: 3px; margin-left: 6px;">${reg.icon} ${reg.name}</span>`;
      }

      if (window.projectDataStore) {
        window.projectDataStore.set(item.id, item);
      }

      const isVeeRubber = (item.winner_name || '').includes('วีรับเบอร์');
      const cardBorder = isVeeRubber 
        ? 'border: 1.5px solid #facc15; background: #fffdf5; box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);' 
        : 'border: 1px solid #e2e8f0; background: #ffffff; box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);';
      const veeRubberBadge = isVeeRubber 
        ? `<span style="background: #fef08a; color: #854d0e; font-weight: 800; font-size: 0.85rem; padding: 2px 10px; border-radius: 6px; border: 1px solid #facc15; display: inline-flex; align-items: center; gap: 4px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">⭐ ผลงานวีรับเบอร์ (บริษัทเรา)</span>` 
        : '';

      const winnerBoxHtml = isVeeRubber
        ? `<div style="margin: 10px 0; background: #fef9c3; border: 1px solid #fde047; padding: 10px 14px; border-radius: 8px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
             <div><strong>ผู้ชนะ: </strong> <span style="color: #854d0e; font-weight: 800; font-size: 1.15rem;">🏆 ${item.winner_name}</span></div>
             <span style="background: #eab308; color: #ffffff; font-weight: 800; font-size: 0.82rem; padding: 3px 12px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">⭐ งานที่เราชนะ</span>
           </div>`
        : `<div style="margin: 10px 0; background: #eef6ff; padding: 10px; border-radius: 6px;">
             <strong>ผู้ชนะ: </strong> <span style="color: var(--primary-color, #003366); font-weight: bold; font-size: 1.05rem;">${item.winner_name || 'ไม่ระบุ'}</span>
           </div>`;

      return `
        <div class="announcement-card" data-project-id="${item.id}" style="${cardBorder}">
          <div class="announcement-meta" style="margin-bottom: 6px;">
            <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
              <span style="background: ${isVeeRubber ? '#854d0e' : '#003366'}; color: #ffffff; font-weight: 700; font-size: 0.82rem; padding: 2px 8px; border-radius: 4px; letter-spacing: 0.5px; box-shadow: 0 1px 2px rgba(0,0,0,0.1);">#${itemIndex}</span>
              ${yearBadge}
              <span class="badge type-w0">${typeLabels['W0'] || '✅ ผู้ชนะ'}</span>
              ${item.product_group ? `<span class="badge group-${item.product_group}">${groupLabels[item.product_group] || item.product_group}</span>` : ''}
              ${veeRubberBadge}
            </div>
            <div style="font-size: 0.88rem; color: #555;">
              📅 ประกาศเมื่อ: <strong style="color: #003366;">${formatDate(item.announce_date)}</strong>
            </div>
          </div>

          <div class="project-id-box" style="display: flex; align-items: center; justify-content: space-between; background: ${isVeeRubber ? '#fffbeb' : '#f8fafc'}; border: 1px solid ${isVeeRubber ? '#fde68a' : '#cbd5e1'}; border-radius: 6px; padding: 6px 12px; margin: 8px 0;">
            <div>
              <span style="color: #64748b; font-size: 0.85rem;">ลำดับ: <strong style="color: #003366;">#${itemIndex}</strong> | เลขที่โครงการ:</span>
              <strong style="font-family: monospace; font-size: 0.95rem; color: #003366; margin-left: 6px;">${projId}</strong>
            </div>
            <button class="btn btn-outline btn-copy" onclick="copyText('${projId}', this)" style="padding: 4px 10px; font-size: 0.82rem; cursor: pointer; border: 1px solid #0066cc; color: #0066cc; border-radius: 4px; background: #ffffff;" title="คัดลอกเลขที่โครงการ">📋 คัดลอกเลขที่</button>
          </div>

          <h3 style="margin: 8px 0;"><a href="detail.html?id=${encodeURIComponent(item.id)}" style="color: inherit; text-decoration: none;">${item.project_name || 'ไม่มีชื่อโครงการ'}</a></h3>
          
          <div style="font-size: 1.02rem; color: #1e293b; display: flex; align-items: center; flex-wrap: wrap; gap: 4px; margin: 8px 0;">
            <span style="font-size: 1.15rem;">🏢</span>
            <strong style="color: #0f172a; font-size: 1.05rem;">${item.department || '-'}</strong>
            ${regBadge}
            ${provBadge}
          </div>

          ${winnerBoxHtml}

          <div class="announcement-meta">
            <div>งบประมาณ: <strong>${formatMoney(item.budget)}</strong></div>
            <div><strong style="color: var(--success, #28a745);">ราคาชนะ: ${formatMoney(item.winner_price)}</strong> (ลด <span style="color: #dc3545; font-weight: bold;">${discount}</span>)</div>
          </div>

          <div class="announcement-actions" style="margin-top: 12px; display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
            <button onclick="openBiddingSimulator('${item.id}')" class="btn" style="padding: 6px 14px; font-size: 0.88rem; background: #ea580c; color: white; border: none; font-weight: 700; border-radius: 6px; box-shadow: 0 1px 2px rgba(0,0,0,0.1);" title="จำลองว่าถ้าเราเคาะงานนี้ จะได้กำไรเท่าไหร่">🧮 จำลองราคาเคาะ</button>
            <a href="detail.html?id=${encodeURIComponent(item.id)}" class="btn btn-primary" style="padding: 6px 14px; font-size: 0.88rem;">ดูรายละเอียด</a>
            <a href="${egpDirectUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary" onclick="return window.openEgpWithCopy ? window.openEgpWithCopy('${projId}', event) : true" style="padding: 6px 14px; font-size: 0.88rem;" title="กดคัดลอกเลขที่โครงการ แล้วเปิด e-GP เพื่อวางค้นหา (Ctrl+V)">เปิดค้นหาใน e-GP 🔗</a>
            <button onclick="hideProject('${projId}', this)" class="btn btn-outline" style="padding: 6px 12px; font-size: 0.82rem; color: #94a3b8; border-color: #cbd5e1; margin-left: auto;" title="ซ่อนงานที่ไม่เกี่ยวข้องกับเรา">🚫 ซ่อนงานนี้</button>
          </div>
        </div>
      `;
    }).join('');

    if (append) {
      const temp = document.createElement('div');
      temp.innerHTML = html;
      while(temp.firstChild) container.appendChild(temp.firstChild);
    } else {
      container.innerHTML = html || '<div class="text-center">ไม่พบข้อมูล</div>';
    }

    if (items.length === winnersLimit) {
      btn.classList.remove('hidden');
      btn.onclick = () => {
        winnersPage++;
        loadWinnerList(true);
      };
    } else {
      btn.classList.add('hidden');
    }

  } catch (err) {
    if (!append) container.innerHTML = `<div class="error-msg">เกิดข้อผิดพลาด: ${err.message}</div>`;
  }
}

function filterVeeRubberOnly(btn) {
  const input = document.getElementById('winner-search-input');
  if (input) {
    if (winnerSearchKeyword === 'วีรับเบอร์') {
      input.value = '';
      winnerSearchKeyword = '';
      if (btn) {
        btn.style.background = '#fef08a';
        btn.style.color = '#854d0e';
      }
    } else {
      input.value = 'วีรับเบอร์';
      winnerSearchKeyword = 'วีรับเบอร์';
      if (btn) {
        btn.style.background = '#eab308';
        btn.style.color = '#ffffff';
      }
    }
    winnersPage = 1;
    loadWinners();
    input.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}




