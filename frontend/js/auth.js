// auth.js
document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('token');
  const path = (window.location.pathname || '').toLowerCase();

  const isPublicPage = path.includes('login') || path.includes('register') || path === '/' || path.endsWith('index.html');

  if (!token) {
    if (!isPublicPage) {
      window.location.href = 'login.html';
    }
    return;
  }

  if (token) {
    try {
      const res = await api.getMe();
      const user = res?.data || res;
      if (user && user.status === 'pending' && !path.includes('pending')) {
        window.location.href = 'pending.html';
        return;
      }
      if (user && user.status === 'approved' && (isPublicPage || path.includes('pending'))) {
        window.location.href = 'dashboard.html';
        return;
      }

      // Update UI with user info if available
      const userInfoEl = document.getElementById('user-info');
      if (userInfoEl && user && user.name) {
        userInfoEl.textContent = `${user.name} (${user.role || 'user'})`;
      }

      const adminLink = document.getElementById('admin-link');
      if (adminLink && user && user.role !== 'admin') {
        adminLink.style.display = 'none';
      }

      const v2AdminNav = document.getElementById('v2-admin-nav-item');
      if (v2AdminNav && user) {
        v2AdminNav.style.display = user.role === 'admin' ? 'flex' : 'none';
      }
      const v2AdminBtn = document.getElementById('v2-user-admin-btn');
      if (v2AdminBtn && user) {
        v2AdminBtn.style.display = user.role === 'admin' ? 'inline-flex' : 'none';
      }

      // Initialize session tracking & heartbeat for active users
      if (!isPublicPage) {
        initSessionTracker();
      }

    } catch (err) {
      console.warn('Auth check error:', err);
      if (!isPublicPage) {
        localStorage.removeItem('token');
        window.location.href = 'login.html';
      }
    }
  }
});

async function initSessionTracker() {
  let sessionId = sessionStorage.getItem('active_session_id');
  const pageName = window.location.pathname.split('/').pop() || 'dashboard.html';

  if (!sessionId) {
    try {
      const res = await api.startSession(pageName);
      if (res?.data?.sessionId) {
        sessionId = res.data.sessionId;
        sessionStorage.setItem('active_session_id', sessionId);
      }
    } catch (e) {
      console.warn('[Tracker] Failed to start session:', e);
    }
  }

  if (sessionId) {
    // Heartbeat every 45s
    setInterval(() => {
      if (!document.hidden) {
        api.sendHeartbeat(sessionId, pageName).catch(() => {});
      }
    }, 45000);

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        api.sendHeartbeat(sessionId, pageName).catch(() => {});
      }
    });

    window.addEventListener('beforeunload', () => {
      api.endSession(sessionId);
    });
  }
}

function logout() {
  const sessionId = sessionStorage.getItem('active_session_id');
  if (sessionId) {
    api.endSession(sessionId);
    sessionStorage.removeItem('active_session_id');
  }
  localStorage.removeItem('token');
  window.location.href = 'login.html';
}
