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

  [idEl, pwdEl].forEach(el =>
    el?.addEventListener('keydown', e => { if (e.key === 'Enter') form.requestSubmit(); })
  );
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
// NAVBAR DROPDOWN (glassy, fixed, viewport-aware)
// =======================
(() => {
  const items = document.querySelectorAll('.menu-item');
  if (!items.length) return;

  let openItem = null;

  function placeDropdown(item){
    const btn   = item.querySelector('.menu-trigger');
    const panel = item.querySelector('.dropdown');
    if (!btn || !panel) return;

    const r = btn.getBoundingClientRect();
    const gap     = 8;
    const margin  = 12;
    const scrollX = window.scrollX || document.documentElement.scrollLeft || 0;
    const scrollY = window.scrollY || document.documentElement.scrollTop  || 0;
    const vw      = document.documentElement.clientWidth;

    // Use a deterministic width so clamping works while hidden
    const targetWidth = Math.max(240, Math.round(r.width));
    panel.style.width = `${targetWidth}px`;   // <-- explicit width

    // Left align under trigger, clamped to viewport
    let left = Math.round(r.left + scrollX);
    const maxLeft = scrollX + vw - targetWidth - margin;
    if (left > maxLeft) left = maxLeft;
    if (left < scrollX + margin) left = scrollX + margin;

    panel.style.left = `${left}px`;
    panel.style.top  = `${Math.round(r.bottom + scrollY + gap)}px`;
  }

  function closeAll(){
    items.forEach(i => {
      i.classList.remove('open');
      i.querySelector('.menu-trigger')?.setAttribute('aria-expanded','false');
      const p = i.querySelector('.dropdown');
      if (p){
        p.classList.remove('is-open');
        p.style.left = '';
        p.style.top  = '';
        p.style.width = '';
      }
    });
    openItem = null;
  }

  function open(item){
    const btn   = item.querySelector('.menu-trigger');
    const panel = item.querySelector('.dropdown');
    if (!btn || !panel) return;

    closeAll();
    item.classList.add('open');
    btn.setAttribute('aria-expanded','true');

    // Position first (with known width), then reveal
    placeDropdown(item);
    panel.classList.add('is-open');
    openItem = item;

    // a11y: focus first interactive
    const first = panel.querySelector('a,button,[tabindex]:not([tabindex="-1"])');
    first?.focus({ preventScroll: true });
  }

  // Toggle on click/touch
  items.forEach(i => {
    const btn = i.querySelector('.menu-trigger');
    if (!btn) return;
    btn.setAttribute('aria-haspopup','true');
    btn.setAttribute('aria-expanded','false');
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if (openItem === i) closeAll();
      else open(i);
    }, { passive:false });
  });

  // Keep aligned while scrolling/resizing/orientation change
  ['scroll','resize','orientationchange'].forEach(ev => {
    window.addEventListener(ev, () => { if (openItem) placeDropdown(openItem); }, { passive:true });
  });

  // Dismiss on outside click/touch
  ['click','touchstart'].forEach(ev => {
    window.addEventListener(ev, (e) => {
      if (!e.target.closest('.menu-item')) closeAll();
    }, { passive:true });
  });

  // Esc to close
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeAll(); });
})();
