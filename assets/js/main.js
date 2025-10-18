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
   NAVBAR DROPDOWN — hover intent + portal + true blur
   Stays open while hovering the trigger OR the popup panel.
   ======================================================= */
(() => {
  const items = document.querySelectorAll('.menu-item');
  if (!items.length) return;

  // ---- Portal for the glassy panels (keeps blur and z-order perfect)
  let portal = document.getElementById('menu-portal');
  if (!portal) {
    portal = document.createElement('div');
    portal.id = 'menu-portal';
    document.body.appendChild(portal);
  }

  // Remember original location to restore later
  const origin = new WeakMap();

  function moveToPortal(panel){
    if (!origin.has(panel)) origin.set(panel, { parent: panel.parentNode, next: panel.nextSibling });
    if (panel.parentNode !== portal) portal.appendChild(panel);
  }
  function restore(panel){
    const o = origin.get(panel);
    if (!o) return;
    const { parent, next } = o;
    next ? parent.insertBefore(panel, next) : parent.appendChild(panel);
    origin.delete(panel);
  }

  // Measure at real size without flashing
  function measure(panel){
    const clone = panel.cloneNode(true);
    clone.classList.add('is-open');
    Object.assign(clone.style, {
      position: 'fixed', left: '-9999px', top: '0',
      visibility: 'hidden', pointerEvents: 'none', display: 'block'
    });
    portal.appendChild(clone);
    const rect = clone.getBoundingClientRect();
    portal.removeChild(clone);
    return { w: Math.max(rect.width, 260), h: rect.height };
  }

  let openItem = null;
  let openPanel = null;
  let closeTimer = null;

  function place(item){
    const btn   = item.querySelector('.menu-trigger');
    const panel = item.querySelector('.dropdown');
    if (!btn || !panel) return;

    moveToPortal(panel);
    const { w: pw, h: ph } = measure(panel);
    const r  = btn.getBoundingClientRect();
    const vw = window.innerWidth, vh = window.innerHeight;
    const EDGE = 12, GAP = 8;

    // Align to trigger; clamp to viewport
    let left = Math.min(Math.max(EDGE, r.left), vw - pw - EDGE);
    let top  = r.bottom + GAP;
    if (top + ph + EDGE > vh) top = Math.max(EDGE, r.top - ph - GAP);

    panel.style.left = `${Math.round(left)}px`;
    panel.style.top  = `${Math.round(top)}px`;
  }

  function open(item){
    if (openItem && openItem !== item) hide(openItem);
    const panel = item.querySelector('.dropdown');
    if (!panel) return;
    place(item);
    panel.classList.add('is-open');
    openItem  = item;
    openPanel = panel;
  }

  function hide(item = openItem){
    if (!item) return;
    const panel = item.querySelector('.dropdown');
    item.classList.remove('open');
    if (panel){
      panel.classList.remove('is-open');
      panel.style.left = '';
      panel.style.top  = '';
      restore(panel);
    }
    if (openItem === item) { openItem = null; openPanel = null; }
  }

  // Hover-intent: keep open while either area is hovered
  function wire(item){
    const btn   = item.querySelector('.menu-trigger');
    const panel = item.querySelector('.dropdown');
    if (!btn || !panel) return;

    let overBtn = false;
    let overPanel = false;

    const startClose = () => {
      clearTimeout(closeTimer);
      closeTimer = setTimeout(() => {
        if (!overBtn && !overPanel) hide();
      }, 120); // small grace to cross the GAP
    };
    const cancelClose = () => clearTimeout(closeTimer);

    // Trigger hover
    btn.addEventListener('mouseenter', () => {
      overBtn = true;
      cancelClose();
      open(item);
    });
    btn.addEventListener('mouseleave', () => {
      overBtn = false;
      startClose();
    });

    // Panel hover (note: panel lives in portal, so we listen on panel itself)
    panel.addEventListener('mouseenter', () => {
      overPanel = true;
      cancelClose();
      // ensure positioned (in case of tiny scroll/resize between hops)
      if (openItem === item) place(item);
    });
    panel.addEventListener('mouseleave', () => {
      overPanel = false;
      startClose();
    });

    // Keyboard: open on focus, close when focus leaves both
    btn.addEventListener('focusin', () => { overBtn = true; open(item); });
    btn.addEventListener('focusout', () => { overBtn = false; startClose(); });
    panel.addEventListener('focusin', () => { overPanel = true; cancelClose(); });
    panel.addEventListener('focusout', () => { overPanel = false; startClose(); });
  }

  items.forEach(wire);

  // Reposition while open on resize/orientation
  ['resize','orientationchange'].forEach(ev => {
    window.addEventListener(ev, () => { if (openItem) place(openItem); }, { passive:true });
  });

  // Close on Escape
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') hide(); });
})();
