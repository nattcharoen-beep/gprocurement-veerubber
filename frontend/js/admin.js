// admin.js — VEE RUBBER Member & System Management Controller
let activityAutoRefreshTimer = null;
let currentAdminUser = null;
let allUsersList = [];
let currentFilter = 'all';
let currentSearchQuery = '';
let targetResetUserId = null;

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Role verification: ensure logged-in user is admin
  try {
    const meRes = await api.getMe();
    currentAdminUser = meRes?.data || meRes;
    if (!currentAdminUser || currentAdminUser.role !== 'admin') {
      alert('คุณไม่มีสิทธิ์เข้าถึงหน้านี้ (เฉพาะ Admin ผู้ดูแลระบบ)');
      window.location.href = 'dashboard.html';
      return;
    }
  } catch (err) {
    console.warn('Admin check error:', err);
    window.location.href = 'login.html';
    return;
  }

  // 2. Tab Navigation
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
      
      tab.classList.add('active');
      const tabId = `tab-${tab.dataset.tab}`;
      const targetEl = document.getElementById(tabId);
      if (targetEl) targetEl.classList.remove('hidden');
      
      if (activityAutoRefreshTimer) {
        clearInterval(activityAutoRefreshTimer);
        activityAutoRefreshTimer = null;
      }

      if (tab.dataset.tab === 'users') loadUsers();
      if (tab.dataset.tab === 'activity') {
        loadUserActivity();
        activityAutoRefreshTimer = setInterval(() => {
          if (!document.hidden) loadUserActivity(true);
        }, 30000);
      }
      if (tab.dataset.tab === 'logs') loadLogs();
    });
  });

  // 3. User Filter Pills & Search Bar
  const filterPills = document.querySelectorAll('.filter-pill');
  filterPills.forEach(pill => {
    pill.addEventListener('click', () => {
      filterPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      currentFilter = pill.dataset.filter;
      renderUsersTable();
    });
  });

  const searchInput = document.getElementById('member-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentSearchQuery = e.target.value.toLowerCase().trim();
      renderUsersTable();
    });
  }

  // 4. Modal event listeners
  const btnCancelReset = document.getElementById('btn-cancel-reset');
  const btnConfirmReset = document.getElementById('btn-confirm-reset');
  const modalResetPwd = document.getElementById('modal-reset-pwd');

  if (btnCancelReset) {
    btnCancelReset.addEventListener('click', () => {
      modalResetPwd.classList.add('hidden');
      targetResetUserId = null;
    });
  }

  if (btnConfirmReset) {
    btnConfirmReset.addEventListener('click', async () => {
      const pwdInput = document.getElementById('modal-new-password');
      const newPwd = pwdInput.value.trim();
      if (newPwd.length < 6) {
        alert('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
        return;
      }
      try {
        btnConfirmReset.disabled = true;
        btnConfirmReset.innerText = 'กำลังบันทึก...';
        await api.resetUserPassword(targetResetUserId, newPwd);
        alert('รีเซ็ตรหัสผ่านให้สมาชิกสำเร็จแล้ว!');
        modalResetPwd.classList.add('hidden');
        pwdInput.value = '';
        targetResetUserId = null;
      } catch (err) {
        alert('เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน: ' + err.message);
      } finally {
        btnConfirmReset.disabled = false;
        btnConfirmReset.innerText = 'บันทึกรหัสผ่านใหม่';
      }
    });
  }

  // Refresh buttons
  const btnRefreshActivity = document.getElementById('btn-refresh-activity');
  if (btnRefreshActivity) {
    btnRefreshActivity.addEventListener('click', () => loadUserActivity());
  }

  const btnRefreshLogs = document.getElementById('btn-refresh-logs');
  if (btnRefreshLogs) {
    btnRefreshLogs.addEventListener('click', () => loadLogs());
  }

  // Initial load
  loadUsers();
});

// ==========================================
// 1. Member Data & Rendering Functions
// ==========================================

async function loadUsers() {
  const tbody = document.querySelector('#users-table tbody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #64748b;">กำลังโหลดข้อมูลสมาชิก...</td></tr>';

  try {
    const res = await api.getAdminUsers();
    allUsersList = res.data || [];
    
    // Update KPI counts
    const total = allUsersList.length;
    const pending = allUsersList.filter(u => u.status === 'pending').length;
    const approved = allUsersList.filter(u => u.status === 'approved').length;
    const rejected = allUsersList.filter(u => u.status === 'rejected').length;

    const elTotal = document.getElementById('kpi-total-members');
    const elPending = document.getElementById('kpi-pending-members');
    const elApproved = document.getElementById('kpi-approved-members');
    const elRejected = document.getElementById('kpi-rejected-members');

    if (elTotal) elTotal.innerText = total;
    if (elPending) elPending.innerText = pending;
    if (elApproved) elApproved.innerText = approved;
    if (elRejected) elRejected.innerText = rejected;

    renderUsersTable();
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #dc2626;">เกิดข้อผิดพลาด: ${err.message}</td></tr>`;
  }
}

function renderUsersTable() {
  const tbody = document.querySelector('#users-table tbody');
  if (!tbody) return;

  let filtered = allUsersList;

  // Filter by status tab
  if (currentFilter !== 'all') {
    filtered = filtered.filter(u => u.status === currentFilter);
  }

  // Filter by search query
  if (currentSearchQuery) {
    filtered = filtered.filter(u => {
      const uName = (u.name || '').toLowerCase();
      const uUser = (u.username || '').toLowerCase();
      const uEmail = (u.email || '').toLowerCase();
      return uName.includes(currentSearchQuery) || uUser.includes(currentSearchQuery) || uEmail.includes(currentSearchQuery);
    });
  }

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #64748b; padding: 20px;">ไม่พบข้อมูลสมาชิกตามเงื่อนไขที่เลือก</td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map(u => {
    let statusBadge = '';
    if (u.status === 'pending') {
      statusBadge = '<span style="background: #fef3c7; color: #b45309; padding: 3px 8px; border-radius: 4px; font-weight: 600; font-size: 0.8rem; border: 1px solid #fde68a;">⏳ รออนุมัติ</span>';
    } else if (u.status === 'approved') {
      statusBadge = '<span style="background: #dcfce7; color: #15803d; padding: 3px 8px; border-radius: 4px; font-weight: 600; font-size: 0.8rem; border: 1px solid #86efac;">✅ อนุมัติแล้ว</span>';
    } else if (u.status === 'rejected') {
      statusBadge = '<span style="background: #fee2e2; color: #dc2626; padding: 3px 8px; border-radius: 4px; font-weight: 600; font-size: 0.8rem; border: 1px solid #fca5a5;">🚫 ระงับสิทธิ์</span>';
    }

    const isSelf = currentAdminUser && (currentAdminUser.id === u.id || currentAdminUser.email === u.email);
    const displayName = (u.name || u.username || u.email || 'ผู้ใช้').replace(/'/g, "\\'");
    const emailReceiveChecked = u.receive_email ? 'checked' : '';

    // Action buttons based on member status and role
    let actionButtons = '';

    if (u.status === 'pending') {
      actionButtons += `
        <button onclick="approveUser('${u.id}', '${displayName}')" class="btn-action btn-action-approve">✅ อนุมัติ</button>
        <button onclick="rejectUser('${u.id}', '${displayName}')" class="btn-action btn-action-reject">❌ ปฏิเสธ</button>
      `;
    } else if (u.status === 'rejected') {
      actionButtons += `
        <button onclick="approveUser('${u.id}', '${displayName}')" class="btn-action btn-action-approve">ปลดระงับ</button>
      `;
    } else if (u.status === 'approved' && !isSelf) {
      actionButtons += `
        <button onclick="rejectUser('${u.id}', '${displayName}')" class="btn-action btn-action-reject">ระงับสิทธิ์</button>
      `;
    }

    // Role switcher & Password reset
    if (!isSelf) {
      if (u.role === 'admin') {
        actionButtons += `<button onclick="changeRole('${u.id}', 'viewer', '${displayName}')" class="btn-action btn-action-outline" title="ลดสิทธิ์เป็นสมาชิกทั่วไป">ลดเป็น Member</button>`;
      } else {
        actionButtons += `<button onclick="changeRole('${u.id}', 'admin', '${displayName}')" class="btn-action btn-action-outline" style="border-color: #0f2744; color: #0f2744;" title="แต่งตั้งเป็นผู้ดูแลระบบ">ตั้งเป็น Admin</button>`;
      }
      actionButtons += `<button onclick="openResetPasswordModal('${u.id}', '${displayName}')" class="btn-action btn-action-outline" title="รีเซ็ตรหัสผ่าน">🔑 รีเซ็ตรหัส</button>`;
      actionButtons += `<button onclick="deleteUserAccount('${u.id}', '${displayName}')" class="btn-action btn-action-delete" title="ลบบัญชีถาวร">🗑️ ลบ</button>`;
    } else {
      actionButtons += `<span style="font-size: 0.8rem; color: #64748b;">(บัญชีปัจจุบันของคุณ)</span>`;
    }

    const rowBg = u.status === 'pending' ? 'background: #fffbeb;' : '';

    return `
      <tr style="${rowBg}">
        <td>
          <div style="font-weight: 700; color: #0f2744;">${u.username || '-'}</div>
          ${u.name ? `<div style="font-size: 0.8rem; color: #64748b;">${u.name}</div>` : ''}
          ${u.is_online ? '<span class="online-badge online" style="margin-top: 4px;">ออนไลน์ตอนนี้</span>' : ''}
        </td>
        <td>${u.email}</td>
        <td>${statusBadge}</td>
        <td>
          ${u.role === 'admin' 
            ? '<span style="font-weight: 700; color: #0f2744; background: #e0f2fe; padding: 2px 6px; border-radius: 4px; font-size: 0.78rem;">Admin</span>' 
            : '<span style="color: #64748b; font-size: 0.82rem;">Member</span>'}
        </td>
        <td style="text-align: center;">
          <input type="checkbox" ${emailReceiveChecked} onchange="toggleEmail('${u.id}', this.checked, '${displayName}')" style="cursor: pointer;" title="เปิด/ปิดการรับอีเมลสรุปงานประมูล">
        </td>
        <td>
          <div class="btn-group">
            ${actionButtons}
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// ==========================================
// 2. Member Actions (ควบคุมสมาชิก)
// ==========================================

window.approveUser = async function(id, name) {
  const targetLabel = name ? `คุณ "${name}"` : 'ผู้ใช้นี้';
  if (confirm(`ยืนยันการอนุมัติ ${targetLabel} ให้เข้าใช้งานระบบ VEE RUBBER Tracker?`)) {
    try {
      await api.approveUser(id);
      loadUsers();
    } catch (err) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    }
  }
};

window.rejectUser = async function(id, name) {
  const targetLabel = name ? `คุณ "${name}"` : 'ผู้ใช้นี้';
  if (confirm(`ยืนยันการปฏิเสธ / ระงับสิทธิ์การใช้งานของ ${targetLabel}?`)) {
    try {
      await api.rejectUser(id);
      loadUsers();
    } catch (err) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    }
  }
};

window.changeRole = async function(id, newRole, name) {
  const roleName = newRole === 'admin' ? 'Admin (ผู้ดูแลระบบ)' : 'Member (สมาชิกทั่วไป)';
  if (confirm(`ยืนยันการเปลี่ยนสิทธิ์ของคุณ "${name}" เป็น ${roleName}?`)) {
    try {
      await api.changeUserRole(id, newRole);
      loadUsers();
    } catch (err) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    }
  }
};

window.openResetPasswordModal = function(id, name) {
  targetResetUserId = id;
  const label = document.getElementById('modal-reset-user-label');
  if (label) label.innerText = `กำลังตั้งรหัสผ่านใหม่ให้แก่: "${name}"`;
  const modal = document.getElementById('modal-reset-pwd');
  if (modal) modal.classList.remove('hidden');
};

window.toggleEmail = async function(id, checked, name) {
  try {
    await api.toggleUserEmail(id, checked);
    const user = allUsersList.find(u => u.id === id);
    if (user) user.receive_email = checked ? 1 : 0;
  } catch (err) {
    alert('เกิดข้อผิดพลาดในการเปลี่ยนการตั้งค่าอีเมล: ' + err.message);
    loadUsers();
  }
};

window.deleteUserAccount = async function(id, name) {
  if (confirm(`⚠️ ยืนยันการลบบัญชีผู้ใช้ "${name}" ถาวร? ข้อมูลประวัติการใช้งานจะถูกลบทั้งหมดและไม่สามารถกู้คืนได้`)) {
    try {
      await api.deleteUser(id);
      alert(`ลบบัญชี "${name}" ออกจากระบบเรียบร้อยแล้ว`);
      loadUsers();
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการลบผู้ใช้: ' + err.message);
    }
  }
};

// ==========================================
// 3. User Activity & Session Tracking Tab
// ==========================================

async function loadUserActivity(silent = false) {
  const tbody = document.querySelector('#activity-users-table tbody');
  const sessTbody = document.querySelector('#sessions-table tbody');
  
  if (!silent && tbody) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #64748b;">กำลังโหลดสถิติเวลา...</td></tr>';
  }

  try {
    const res = await api.getUserActivity();
    const data = res?.data || {};
    const stats = data.stats || {};
    const users = data.users || [];
    const sessions = data.sessions || [];

    // Summary cards
    const elOnline = document.getElementById('stat-online-users');
    const elTotal = document.getElementById('stat-total-users');
    const elDuration = document.getElementById('stat-total-duration');
    const elSessions = document.getElementById('stat-total-sessions');

    if (elOnline) elOnline.innerText = `${stats.online_users || 0} คน`;
    if (elTotal) elTotal.innerText = `${stats.total_active_users || 0} คน`;
    if (elDuration) {
      const mins = Math.round((stats.total_duration_seconds || 0) / 60);
      elDuration.innerText = mins >= 60 ? `${(mins / 60).toFixed(1)} ชม.` : `${mins} นาที`;
    }
    if (elSessions) elSessions.innerText = `${stats.total_sessions || 0} ครั้ง`;

    // Users Aggregate Table
    if (tbody) {
      if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #64748b;">ยังไม่มีข้อมูลการเข้าใช้งาน</td></tr>';
      } else {
        tbody.innerHTML = users.map(u => {
          const isOnline = u.is_online === 1;
          const mins = Math.round((u.total_duration_seconds || 0) / 60);
          const durationStr = mins >= 60 ? `${(mins / 60).toFixed(1)} ชม.` : `${mins} นาที`;
          
          let lastActiveStr = 'ยังไม่เคยเข้า';
          if (u.last_active_at) {
            try {
              const d = new Date(u.last_active_at);
              lastActiveStr = d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }) + ' ' + d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
            } catch (e) {
              lastActiveStr = u.last_active_at;
            }
          }

          return `
            <tr>
              <td>
                <div style="font-weight: 700; color: #0f2744;">${u.username || u.name || '-'}</div>
                ${u.name ? `<div style="font-size: 0.8rem; color: #64748b;">${u.name}</div>` : ''}
              </td>
              <td>${u.email}</td>
              <td>
                ${isOnline 
                  ? '<span class="online-badge online">ออนไลน์</span>' 
                  : '<span class="online-badge offline">ออฟไลน์</span>'}
              </td>
              <td>${u.session_count || 0} ครั้ง</td>
              <td style="font-weight: 600; color: #0f2744;">${durationStr}</td>
              <td style="font-size: 0.82rem; color: #64748b;">${lastActiveStr}</td>
            </tr>
          `;
        }).join('');
      }
    }

    // Recent Sessions Table
    if (sessTbody) {
      if (sessions.length === 0) {
        sessTbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #64748b;">ยังไม่มีประวัติ Session</td></tr>';
      } else {
        sessTbody.innerHTML = sessions.map(s => {
          const mins = Math.round((s.duration_seconds || 0) / 60);
          const durStr = mins > 0 ? `${mins} นาที` : `${s.duration_seconds || 0} วินาที`;
          
          let startStr = '-';
          if (s.started_at) {
            try {
              const d = new Date(s.started_at);
              startStr = d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }) + ' ' + d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
            } catch (e) {
              startStr = s.started_at;
            }
          }

          return `
            <tr>
              <td><strong>${s.username || s.email}</strong></td>
              <td style="font-size: 0.82rem; color: #64748b;">${s.device_type || 'Desktop'}</td>
              <td style="font-size: 0.82rem;">${startStr}</td>
              <td>${durStr}</td>
              <td style="font-size: 0.82rem; color: #0284c7;">${s.current_page || 'dashboard.html'}</td>
            </tr>
          `;
        }).join('');
      }
    }

  } catch (err) {
    if (!silent && tbody) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #dc2626;">เกิดข้อผิดพลาด: ${err.message}</td></tr>`;
    }
  }
}

// ==========================================
// 4. Harvester Logs Tab
// ==========================================

async function loadLogs() {
  const tbody = document.querySelector('#logs-table tbody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #64748b;">กำลังโหลดบันทึกการทำงาน...</td></tr>';

  try {
    const res = await api.getAdminLogs();
    const logs = res.data || [];

    if (logs.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #64748b;">ยังไม่มีประวัติการรันสแกน e-GP</td></tr>';
      return;
    }

    tbody.innerHTML = logs.map(l => {
      let statusColor = '#15803d';
      if (l.status === 'failed' || l.status === 'error') statusColor = '#dc2626';

      let runDateStr = l.run_date;
      try {
        const d = new Date(l.run_date);
        runDateStr = d.toLocaleDateString('th-TH') + ' ' + d.toLocaleTimeString('th-TH');
      } catch (e) {}

      return `
        <tr>
          <td>${runDateStr}</td>
          <td><span style="color: ${statusColor}; font-weight: 600;">${l.status || 'success'}</span></td>
          <td>${l.items_fetched || 0} รายการ</td>
          <td style="font-size: 0.82rem; color: #64748b;">${l.errors || 'ทำงานเสร็จสมบูรณ์'}</td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #dc2626;">เกิดข้อผิดพลาด: ${err.message}</td></tr>`;
  }
}
