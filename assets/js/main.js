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

// =======================================================
// NAVBAR DROPDOWN — portal + true blur + hover hold logic
// =======================================================
(() => {
  const items = document.querySelectorAll('.menu-item');
  if (!items.length) return;

  // 1) Portal container (so backdrop-filter blurs the page behind)
  let portal = document.getElementById('menu-portal');
  if (!portal) {
    portal = document.createElement('div');
    portal.id = 'menu-portal';
    document.body.appendChild(portal);
  }

  // State
  let openItem = null;       // <li.menu-item> currently open
  let openPanel = null;      // its .dropdown
  let restore = null;        // { parent, next } to restore panel to DOM
  let hoverTimers = new WeakMap(); // per-item close timers

  // Helpers
  function moveToPortal(panel) {
    const parent = panel.parentNode;
    const next = panel.nextSibling;
    restore = { parent, next };
    portal.appendChild(panel);
  }
  function restorePanel(panel) {
    if (!restore) return;
    const { parent, next } = restore;
    next ? parent.insertBefore(panel, next) : parent.appendChild(panel);
    restore = null;
  }
  function measure(panel) {
    const wasOpen = panel.classList.contains('is-open');
    if (!wasOpen) {
      panel.style.visibility = 'hidden';
      panel.classList.add('is-open');
      document.body.offsetHeight; // reflow
    }
    const w = Math.max(panel.offsetWidth, 260);
    const h = panel.offsetHeight;
    if (!wasOpen) {
      panel.classList.remove('is-open');
      panel.style.visibility = '';
    }
    return { w, h };
  }
  function place(item) {
    const btn = item.querySelector('.menu-trigger');
    const panel = openPanel || item.querySelector('.dropdown');
    if (!btn || !panel) return;

    if (panel.parentNode !== portal) moveToPortal(panel);

    const r  = btn.getBoundingClientRect();
    const vw = document.documentElement.clientWidth;
    const vh = document.documentElement.clientHeight;
    const EDGE = 12;
    const GAP  = 8;

    const { w: pw, h: ph } = measure(panel);

    // end-align if near right
    const preferEnd = r.left > vw * 0.6;
    let left = preferEnd ? (r.right - pw) : r.left;
    left = Math.min(Math.max(EDGE, left), vw - pw - EDGE);

    let top = r.bottom + GAP;
    if (top + ph + EDGE > vh) top = Math.max(EDGE, r.top - ph - GAP);

    panel.style.left = Math.round(left) + 'px';
    panel.style.top  = Math.round(top)  + 'px';
  }
  function cancelCloseTimer(item) {
    const t = hoverTimers.get(item);
    if (t) {
      clearTimeout(t);
      hoverTimers.delete(item);
    }
  }
  function scheduleClose(item) {
    // small delay so moving across tiny gaps doesn’t flicker
    cancelCloseTimer(item);
    const t = setTimeout(() => {
      if (openItem === item) closeAll();
    }, 120);
    hoverTimers.set(item, t);
  }
  function open(item) {
    if (openItem === item) return;

    closeAll();

    const btn   = item.querySelector('.menu-trigger');
    const panel = item.querySelector('.dropdown');
    if (!btn || !panel) return;

    item.classList.add('open');
    btn.setAttribute('aria-expanded','true');
    openItem  = item;
    openPanel = panel;

    place(item);
    panel.classList.add('is-open');
  }
  function closeAll() {
    if (!openItem) return;
    const item = openItem;

    item.classList.remove('open');
    item.querySelector('.menu-trigger')?.setAttribute('aria-expanded','false');

    if (openPanel) {
      openPanel.classList.remove('is-open');
      openPanel.style.left = '';
      openPanel.style.top  = '';
      restorePanel(openPanel);
      openPanel = null;
    }
    cancelCloseTimer(item);
    openItem = null;
  }

  // 2) Hover logic — open on enter of trigger, keep open while over
  //    either the trigger or the panel, close shortly after leaving both.
  items.forEach(item => {
    const btn   = item.querySelector('.menu-trigger');
    const panel = item.querySelector('.dropdown');
    if (!btn || !panel) return;

    // Make the trigger non-toggle (no click needed)
    btn.setAttribute('aria-haspopup','true');
    btn.setAttribute('aria-expanded','false');
    btn.addEventListener('click', e => e.preventDefault());

    // On entering the trigger: open + cancel any pending close
    btn.addEventListener('pointerenter', () => {
      open(item);
      cancelCloseTimer(item);
    });

    // Leaving the trigger: if going *into* the panel, do nothing;
    // otherwise schedule close.
    btn.addEventListener('pointerleave', (e) => {
      const to = e.relatedTarget;
      if (to && panel.contains(to)) return; // into panel
      scheduleClose(item);
    });

    // Keep open while pointer is on the panel
    panel.addEventListener('pointerenter', () => {
      open(item);
      cancelCloseTimer(item);
    });

    // Leaving panel: if going back to trigger, do nothing; else close
    panel.addEventListener('pointerleave', (e) => {
      const to = e.relatedTarget;
      if (to && btn.contains(to)) return; // back to trigger
      scheduleClose(item);
    });
  });

  // Keep aligned on resize/scroll/orientation (panel stays open)
  const realign = () => { if (openItem) place(openItem); };
  window.addEventListener('resize', realign, { passive:true });
  window.addEventListener('scroll', realign, { passive:true });
  window.addEventListener('orientationchange', realign, { passive:true });

  // Optional: Esc to close
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeAll(); });
})();
