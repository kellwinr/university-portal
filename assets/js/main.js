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
   NAVBAR DROPDOWN — hover only + true blur + perfect alignment
   ======================================================= */
(() => {
  const items = document.querySelectorAll('.menu-item');
  if (!items.length) return;

  // --- Create a portal for clean z-layering ---
  let portal = document.getElementById('menu-portal');
  if (!portal) {
    portal = document.createElement('div');
    portal.id = 'menu-portal';
    document.body.appendChild(portal);
  }

  const origin = new WeakMap(); // track where each dropdown came from

  // Measure size invisibly without ghosting
  function measure(panel) {
    const clone = panel.cloneNode(true);
    clone.classList.add('is-open');
    Object.assign(clone.style, {
      position: 'fixed',
      left: '-9999px',
      top: '0',
      visibility: 'hidden',
      pointerEvents: 'none',
      display: 'block',
    });
    portal.appendChild(clone);
    const rect = clone.getBoundingClientRect();
    portal.removeChild(clone);
    return { w: Math.max(rect.width, 260), h: rect.height };
  }

  function moveToPortal(panel) {
    if (!origin.has(panel)) {
      origin.set(panel, { parent: panel.parentNode, next: panel.nextSibling });
    }
    if (panel.parentNode !== portal) portal.appendChild(panel);
  }

  function restore(panel) {
    const info = origin.get(panel);
    if (!info) return;
    const { parent, next } = info;
    next ? parent.insertBefore(panel, next) : parent.appendChild(panel);
    origin.delete(panel);
  }

  function placeDropdown(item) {
    const btn = item.querySelector('.menu-trigger');
    const panel = item.querySelector('.dropdown');
    if (!btn || !panel) return;

    moveToPortal(panel);

    const r = btn.getBoundingClientRect();
    const { w: pw, h: ph } = measure(panel);
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const EDGE = 12;
    const GAP = 8;

    // left alignment, clamp edges
    let left = Math.min(Math.max(EDGE, r.left), vw - pw - EDGE);
    let top = r.bottom + GAP;
    if (top + ph + EDGE > vh) top = Math.max(EDGE, r.top - ph - GAP);

    panel.style.left = `${left}px`;
    panel.style.top = `${top}px`;
  }

  // --- Hover behaviour ---
  items.forEach(item => {
    const btn = item.querySelector('.menu-trigger');
    const panel = item.querySelector('.dropdown');
    if (!btn || !panel) return;

    item.addEventListener('mouseenter', () => {
      placeDropdown(item);
      panel.classList.add('is-open');
    });

    item.addEventListener('mouseleave', () => {
      panel.classList.remove('is-open');
      restore(panel);
    });
  });

  // Keep alignment on resize/orientation change
  ['resize', 'orientationchange'].forEach(ev => {
    window.addEventListener(ev, () => {
      const open = document.querySelector('.dropdown.is-open');
      const item = open ? [...items].find(i => i.contains(open)) : null;
      if (item) placeDropdown(item);
    }, { passive: true });
  });
})();
