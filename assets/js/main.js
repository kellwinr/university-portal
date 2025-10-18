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
    const id  = (idEl?.value  || '').trim();
    const pwd = (pwdEl?.value || '').trim();

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

  // Optional: password-eye toggle (works only if the button exists)
  const toggleBtn = document.querySelector('.pwd-toggle');
  if (toggleBtn && pwdEl) {
    toggleBtn.addEventListener('click', () => {
      const isText = pwdEl.type === 'text';
      pwdEl.type = isText ? 'password' : 'text';
      toggleBtn.classList.toggle('visible', !isText);
      pwdEl.focus({ preventScroll: true });
    });
  }
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

// -------------------------------------------------------
// Uniform dropdown width — computes max menu width once
// and sets CSS variable --menuW. Re-runs on load/fonts/resize.
// -------------------------------------------------------
function setUniformMenuWidth() {
  const panels = Array.from(document.querySelectorAll('.dropdown'));
  if (!panels.length) return;

  requestAnimationFrame(() => {
    let maxW = 260;

    panels.forEach(p => {
      // remember original DOM position
      const parent = p.parentNode;
      const next = p.nextSibling;

      // stash current inline styles we’re about to change
      const prev = {
        pos: p.style.position,
        vis: p.style.visibility,
        disp: p.style.display,
        left: p.style.left,
        top: p.style.top,
      };

      // move to body and make measurable without flashing
      document.body.appendChild(p);
      p.style.position = 'absolute';
      p.style.visibility = 'hidden';
      p.style.display = 'block';
      p.style.left = '-9999px';
      p.style.top = '-9999px';

      // measure
      maxW = Math.max(maxW, Math.ceil(p.scrollWidth) + 1);

      // restore inline styles
      p.style.position = prev.pos;
      p.style.visibility = prev.vis;
      p.style.display = prev.disp;
      p.style.left = prev.left;
      p.style.top = prev.top;

      // restore original DOM position
      if (next) parent.insertBefore(p, next);
      else parent.appendChild(p);
    });

    // clamp and set once for all menus
    maxW = Math.min(Math.max(260, maxW), 420);
    document.documentElement.style.setProperty('--menuW', `${maxW}px`);
  });
}

// initial + after load + after fonts + debounced resize
document.addEventListener('DOMContentLoaded', setUniformMenuWidth);
window.addEventListener('load', setUniformMenuWidth, { passive: true });
if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(setUniformMenuWidth);
}
let _mwTimer;
window.addEventListener('resize', () => {
  clearTimeout(_mwTimer);
  _mwTimer = setTimeout(setUniformMenuWidth, 150);
}, { passive: true });

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
  const hoverTimers = new WeakMap(); // per-item close timers

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

    const onEnter = () => { open(item); cancelCloseTimer(item); };
    const onLeaveFromBtn = (e) => {
      const to = e.relatedTarget;
      if (to && panel.contains(to)) return; // into panel
      scheduleClose(item);
    };
    const onLeaveFromPanel = (e) => {
      const to = e.relatedTarget;
      if (to && btn.contains(to)) return; // back to trigger
      scheduleClose(item);
    };

    // Pointer events (modern)
    btn.addEventListener('pointerenter', onEnter);
    panel.addEventListener('pointerenter', onEnter);

    // Mouse fallback (makes Safari/older browsers happy)
    btn.addEventListener('mouseleave', onLeaveFromBtn);
    panel.addEventListener('mouseleave', onLeaveFromPanel);

    // Optional: touch open (tap to peek)
    btn.addEventListener('touchstart', (e) => {
      open(item);
      cancelCloseTimer(item);
      e.preventDefault();
    }, { passive: false });
  });

  // Keep aligned on resize/scroll/orientation (panel stays open)
  const realign = () => { if (openItem) place(openItem); };
  window.addEventListener('resize', realign, { passive:true });
  window.addEventListener('scroll', realign, { passive:true });
  window.addEventListener('orientationchange', realign, { passive:true });

  // Optional: Esc to close
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeAll(); });
})();
