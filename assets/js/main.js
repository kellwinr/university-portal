// =============================
// UTAR Portal Demo JavaScript
// =============================

// --- Demo user database (front-end mock only) ---
const USERS = {
  "22123456": { name: "Demo Student", password: "password123" },
  // "22111111": { name: "Kelvin Lim", password: "pass123" },
};

// =============================
// LOGIN PAGE HANDLER
// =============================
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('login-form');
  if (!form) return; // not on login page

  const idEl   = document.getElementById('id');
  const pwdEl  = document.getElementById('pwd');
  const status = document.getElementById('status');

  const setStatus = (msg, ok = false) => {
    if (!status) return;
    status.textContent = msg;
    status.style.color = ok ? '#0a7a25' : '#d02b2b';
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const id  = (idEl.value  || '').trim();
    const pwd = (pwdEl.value || '').trim();

    if (!id || !pwd) return setStatus('Please enter both Student ID and Password.');

    const user = USERS[id];
    if (user && user.password === pwd) {
      setStatus('Login successful. Redirecting…', true);
      localStorage.setItem('demo_user', JSON.stringify({ id, name: user.name || 'Student', time: Date.now() }));
      setTimeout(() => (window.location.href = 'dashboard.html'), 600);
    } else {
      setStatus('Invalid credentials (try ID 22123456 / password123).');
    }
  });

  [idEl, pwdEl].forEach(el => el?.addEventListener('keydown', e => {
    if (e.key === 'Enter') form.requestSubmit();
  }));
});

// =============================
// DASHBOARD PAGE HANDLER
// =============================
document.addEventListener('DOMContentLoaded', () => {
  const welcome = document.getElementById('welcome');
  const chipId  = document.getElementById('chipId');
  const logout  = document.getElementById('logout');
  if (!welcome || !chipId) return; // not on dashboard

  const raw = localStorage.getItem('demo_user');
  if (!raw) return window.location.replace('index.html');

  try {
    const data = JSON.parse(raw);
    const name = data?.name || 'Student';
    const id   = data?.id   || '';
    welcome.textContent = `Hello, ${name}${id ? ` (${id})` : ''}`;
    chipId.textContent  = id ? `ID: ${id}` : 'ID: —';
  } catch {
    localStorage.removeItem('demo_user');
    window.location.replace('index.html');
  }

  logout?.addEventListener('click', () => {
    localStorage.removeItem('demo_user');
    window.location.replace('index.html');
  });
});

// =======================
// NAVBAR DROPDOWN (CSS-positioned, anchored)
// =======================
(() => {
  const items = document.querySelectorAll('.menu-item');
  if (!items.length) return;

  function closeAll() {
    items.forEach(i => {
      i.classList.remove('open');
      i.querySelector('.menu-trigger')?.setAttribute('aria-expanded', 'false');
      const panel = i.querySelector('.dropdown');
      if (panel) {
        panel.style.left = '';
        panel.style.top = '';
      }
    });
  }

  items.forEach(i => {
    const btn = i.querySelector('.menu-trigger');
    if (!btn) return;

    btn.setAttribute('aria-haspopup', 'true');
    btn.setAttribute('aria-expanded', 'false');

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if (i.classList.contains('open')) {
        i.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
      } else {
        closeAll();
        i.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });

  // Close dropdown on outside click or Escape key
  window.addEventListener('click', (e) => {
    if (!e.target.closest('.menu-item')) closeAll();
  });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAll();
  });
})();
