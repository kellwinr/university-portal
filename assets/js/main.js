// =============================
// UTAR Portal Demo JavaScript
// =============================

// --- Demo user database (for front-end mock login only) ---
const USERS = {
  "22123456": { name: "Demo Student", password: "password123" },
  // Add more users if you like:
  // "22111111": { name: "Kelvin Lim", password: "pass123" },
};

// =============================
// LOGIN PAGE HANDLER
// =============================
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('login-form');
  if (!form) return; // Skip if not on login page

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

    if (!id || !pwd) {
      setStatus('Please enter both Student ID and Password.');
      return;
    }

    const user = USERS[id];
    if (user && user.password === pwd) {
      setStatus('Login successful. Redirecting…', true);

      // Save minimal user profile
      localStorage.setItem('demo_user', JSON.stringify({
        id,
        name: user.name || 'Student',
        time: Date.now(),
      }));

      setTimeout(() => window.location.href = 'dashboard.html', 600);
    } else {
      setStatus('Invalid credentials (try ID 22123456 / password123).');
    }
  });

  // Pressing Enter also triggers login
  [idEl, pwdEl].forEach(el => {
    el?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') form.requestSubmit();
    });
  });
});

// =============================
// DASHBOARD PAGE HANDLER
// =============================
document.addEventListener('DOMContentLoaded', () => {
  const welcome = document.getElementById('welcome');
  const chipId  = document.getElementById('chipId');
  const logout  = document.getElementById('logout');

  // Only runs on dashboard.html
  if (!welcome || !chipId) return;

  const raw = localStorage.getItem('demo_user');
  if (!raw) {
    window.location.replace('index.html');
    return;
  }

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

// =============================
// NAVBAR DROPDOWN MENU HANDLER
// =============================
(function () {
  const items = document.querySelectorAll('.menu-item');
  if (!items.length) return;

  // Toggle open / close
  items.forEach(i => {
    const btn = i.querySelector('.menu-trigger');
    if (!btn) return;

    btn.addEventListener('click', e => {
      e.preventDefault();
      const openNow = i.classList.toggle('open');
      btn.setAttribute('aria-expanded', openNow ? 'true' : 'false');

      // Close others
      items.forEach(o => {
        if (o !== i) {
          o.classList.remove('open');
          const otherBtn = o.querySelector('.menu-trigger');
          if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
        }
      });
    });
  });

  // Close when clicking outside
  window.addEventListener('click', e => {
    if (!e.target.closest('.menu-item')) {
      items.forEach(i => {
        i.classList.remove('open');
        const btn = i.querySelector('.menu-trigger');
        if (btn) btn.setAttribute('aria-expanded', 'false');
      });
    }
  });

  // Close on Esc key
  window.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      items.forEach(i => {
        i.classList.remove('open');
        const btn = i.querySelector('.menu-trigger');
        if (btn) btn.setAttribute('aria-expanded', 'false');
      });
    }
  });
})();
