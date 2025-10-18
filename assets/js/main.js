/* ===========================================
   UTAR Portal Demo — main.js (single file)
   =========================================== */

"use strict";

/* -----------------------------
   Mock users (front-end only)
   ----------------------------- */
const USERS = {
  "22123456": { name: "Demo Student", password: "password123" },
  // "22111111": { name: "Kelvin Lim", password: "pass123" },
};

/* =============================
   LOGIN PAGE HANDLER
   ============================= */
document.addEventListener("DOMContentLoaded", () => {
  const form   = document.getElementById("login-form");
  if (!form) return; // not on login page

  const idEl   = document.getElementById("id");
  const pwdEl  = document.getElementById("pwd");
  const status = document.getElementById("status");

  const setStatus = (msg, ok = false) => {
    if (!status) return;
    status.textContent = msg;
    status.style.color = ok ? "#0a7a25" : "#d02b2b";
  };

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const id  = (idEl.value  || "").trim();
    const pwd = (pwdEl.value || "").trim();

    if (!id || !pwd) {
      setStatus("Please enter both Student ID and Password.");
      return;
    }

    const user = USERS[id];
    if (user && user.password === pwd) {
      setStatus("Login successful. Redirecting…", true);
      localStorage.setItem(
        "demo_user",
        JSON.stringify({ id, name: user.name || "Student", time: Date.now() })
      );
      setTimeout(() => (window.location.href = "dashboard.html"), 600);
    } else {
      setStatus("Invalid credentials (try ID 22123456 / password123).");
    }
  });

  // Pressing Enter in either field submits
  [idEl, pwdEl].forEach((el) =>
    el?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") form.requestSubmit();
    })
  );

  // Optional: wire the eye button if you removed the inline onclick
  const eyeBtn = form.querySelector(".pwd-toggle");
  if (eyeBtn && !eyeBtn.__wired) {
    eyeBtn.addEventListener("click", () => {
      const show = pwdEl.type === "password";
      pwdEl.type = show ? "text" : "password";
      eyeBtn.setAttribute("aria-label", show ? "Hide password" : "Show password");
      eyeBtn.classList.toggle("visible", show);
      // keep focus on the input for nice UX
      pwdEl.focus({ preventScroll: true });
    });
    eyeBtn.__wired = true;
  }
});

/* =============================
   DASHBOARD PAGE HANDLER
   ============================= */
document.addEventListener("DOMContentLoaded", () => {
  const welcome = document.getElementById("welcome");
  const chipId  = document.getElementById("chipId");
  const logout  = document.getElementById("logout");
  if (!welcome || !chipId) return; // not on dashboard

  const raw = localStorage.getItem("demo_user");
  if (!raw) {
    window.location.replace("index.html");
    return;
  }

  try {
    const data = JSON.parse(raw);
    const name = data?.name || "Student";
    const id   = data?.id   || "";
    welcome.textContent = `Hello, ${name}${id ? ` (${id})` : ""}`;
    chipId.textContent  = id ? `ID: ${id}` : "ID: —";
  } catch {
    localStorage.removeItem("demo_user");
    window.location.replace("index.html");
    return;
  }

  logout?.addEventListener("click", () => {
    localStorage.removeItem("demo_user");
    window.location.replace("index.html");
  });
});

/* =======================================================
   NAVBAR DROPDOWN — portal + true blur + perfect alignment
   ======================================================= */
(() => {
  const items = document.querySelectorAll('.menu-item');
  if (!items.length) return;

  // ----- Portal (once) -----
  let portal = document.getElementById('menu-portal');
  if (!portal) {
    portal = document.createElement('div');
    portal.id = 'menu-portal';
    portal.setAttribute('aria-hidden', 'true');
    document.body.appendChild(portal);
  }

  // Track original parent/position so we can restore safely
  const origin = new WeakMap(); // panel -> {parent, next}

  // Off-screen, non-interactive measurement (no flicker)
  function measure(panel) {
    const ghost = panel.cloneNode(true);
    ghost.classList.add('is-open');            // ensure display:block from CSS
    Object.assign(ghost.style, {
      position: 'fixed',
      left: '-10000px',
      top: '0',
      visibility: 'hidden',
      pointerEvents: 'none',
    });
    portal.appendChild(ghost);
    const w = Math.max(ghost.offsetWidth, 260);
    const h = ghost.offsetHeight;
    ghost.remove();
    return { w, h };
  }

  function moveToPortal(panel) {
    if (!origin.has(panel)) {
      origin.set(panel, { parent: panel.parentNode, next: panel.nextSibling });
    }
    if (panel.parentNode !== portal) portal.appendChild(panel);
  }

  function restorePanel(panel) {
    const info = origin.get(panel);
    if (!info) return;
    const { parent, next } = info;
    next ? parent.insertBefore(panel, next) : parent.appendChild(panel);
    origin.delete(panel);
  }

  let openItem = null;
  let openPanel = null;

  function placeDropdown(item) {
    const btn   = item.querySelector('.menu-trigger');
    const panel = openPanel || item.querySelector('.dropdown');
    if (!btn || !panel) return;

    moveToPortal(panel);

    const r  = btn.getBoundingClientRect();
    const vw = document.documentElement.clientWidth;
    const vh = document.documentElement.clientHeight;
    const EDGE = 12;
    const GAP  = 8;

    const { w: pw, h: ph } = measure(panel);

    // Prefer end alignment if the button is right-weighted
    const preferEnd = r.left > vw * 0.6;
    let left = preferEnd ? (r.right - pw) : r.left;

    // clamp horizontally
    left = Math.max(EDGE, Math.min(left, vw - pw - EDGE));

    // below by default; flip up if needed
    let top = r.bottom + GAP;
    if (top + ph + EDGE > vh) top = Math.max(EDGE, r.top - ph - GAP);

    panel.style.left = Math.round(left) + 'px';
    panel.style.top  = Math.round(top)  + 'px';
  }

  function closeAll() {
    items.forEach(i => {
      i.classList.remove('open');
      i.querySelector('.menu-trigger')?.setAttribute('aria-expanded', 'false');
      const p = i.querySelector('.dropdown');
      if (p) {
        p.classList.remove('is-open');     // CSS sets display:none immediately
        p.style.left = '';
        p.style.top  = '';
        restorePanel(p);
      }
    });
    openItem = null;
    openPanel = null;
  }

  function open(item) {
    const btn   = item.querySelector('.menu-trigger');
    const panel = item.querySelector('.dropdown');
    if (!btn || !panel) return;

    // If clicking the already-open item, just close
    if (openItem === item) { closeAll(); return; }

    closeAll();

    openItem  = item;
    openPanel = panel;

    item.classList.add('open');
    btn.setAttribute('aria-expanded', 'true');

    // Position first, then reveal (prevents jump)
    placeDropdown(item);
    // Let styles apply before we toggle open for smoother animation
    requestAnimationFrame(() => {
      panel.classList.add('is-open');
      const first = panel.querySelector('a,button,[tabindex]:not([tabindex="-1"])');
      first?.focus({ preventScroll: true });
    });
  }

  // Toggle on click
  items.forEach(i => {
    const btn = i.querySelector('.menu-trigger');
    if (!btn) return;
    btn.setAttribute('aria-haspopup', 'true');
    btn.setAttribute('aria-expanded', 'false');
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      open(i);
    });
  });

  // Keep aligned on resize/scroll/orientation
  ['resize', 'scroll', 'orientationchange'].forEach(ev => {
    window.addEventListener(ev, () => {
      if (openItem) requestAnimationFrame(() => placeDropdown(openItem));
    }, { passive: true });
  });

  // Close on outside pointerdown (fires before click, avoids “bounce open”)
  window.addEventListener('pointerdown', (e) => {
    if (openItem) {
      const insideTrigger = e.target.closest('.menu-item');
      const insidePanel   = e.target.closest('.dropdown');
      if (!insideTrigger && !insidePanel) closeAll();
    }
  }, { passive: true });

  // Esc to close
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeAll(); });
})();
