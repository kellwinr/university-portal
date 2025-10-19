// =============================
// UTAR Portal Demo JavaScript
// =============================

// --- Demo user database (front-end mock only) ---
const USERS = {
  "22123456": { name: "Demo Student", password: "password123" },
  // "22111111": { name: "Kelvin Lim", password: "pass123" },
};

// A tiny helper to know where we are
const $ = (sel, ctx = document) => ctx.querySelector(sel);

// =============================
// LOGIN PAGE HANDLER
// =============================
document.addEventListener("DOMContentLoaded", () => {
  const form  = $("#login-form");
  if (!form) return; // not on login page

  const idEl   = $("#id");
  const pwdEl  = $("#pwd");
  const status = $("#status");

  const setStatus = (msg, ok = false) => {
    if (!status) return;
    status.textContent = msg;
    status.style.color = ok ? "#0a7a25" : "#d02b2b";
  };

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const id  = (idEl?.value  || "").trim();
    const pwd = (pwdEl?.value || "").trim();

    if (!id || !pwd) return setStatus("Please enter both Student ID and Password.");

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

  [idEl, pwdEl].forEach((el) =>
    el?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") form.requestSubmit();
    })
  );
});

// Password eye toggle — single, global, and reliable
document.addEventListener(
  "click",
  (e) => {
    const btn = e.target.closest(".pwd-toggle");
    if (!btn) return;

    const wrap  = btn.closest(".pwd-wrap");
    const input = wrap && wrap.querySelector("input");
    if (!input) return;

    const show = input.type === "password";
    input.type = show ? "text" : "password";
    btn.classList.toggle("visible", show);
    btn.setAttribute("aria-label", show ? "Hide password" : "Show password");
    input.focus({ preventScroll: true });
  },
  { passive: true }
);

// =============================
// DASHBOARD PAGE HANDLER
// =============================
document.addEventListener("DOMContentLoaded", () => {
  const welcome = $("#welcome");
  const chipId  = $("#chipId");
  const logout  = $("#logout");
  if (!welcome || !chipId) return; // not on dashboard

  const raw = localStorage.getItem("demo_user");
  if (!raw) return window.location.replace("index.html");

  try {
    const data = JSON.parse(raw);
    const name = data?.name || "Student";
    const id   = data?.id   || "";
    welcome.textContent = `Hello, ${name}${id ? ` (${id})` : ""}`;
    chipId.textContent  = id ? `ID: ${id}` : "ID: —";
  } catch {
    localStorage.removeItem("demo_user");
    window.location.replace("index.html");
  }

  logout?.addEventListener("click", () => {
    localStorage.removeItem("demo_user");
    window.location.replace("index.html");
  });
});

// -------------------------------------------------------
// Uniform dropdown width (dashboard only)
// -------------------------------------------------------
function setUniformMenuWidth() {
  const panels = Array.from(document.querySelectorAll(".dropdown"));
  if (!panels.length) return;

  requestAnimationFrame(() => {
    let maxW = 260;

    panels.forEach((p) => {
      const parent = p.parentNode;
      const next   = p.nextSibling;

      const prev = {
        pos: p.style.position,
        vis: p.style.visibility,
        disp: p.style.display,
        left: p.style.left,
        top:  p.style.top,
      };

      document.body.appendChild(p);
      p.style.position = "absolute";
      p.style.visibility = "hidden";
      p.style.display = "block";
      p.style.left = "-9999px";
      p.style.top  = "-9999px";

      maxW = Math.max(maxW, Math.ceil(p.scrollWidth) + 1);

      p.style.position  = prev.pos;
      p.style.visibility = prev.vis;
      p.style.display   = prev.disp;
      p.style.left      = prev.left;
      p.style.top       = prev.top;

      next ? parent.insertBefore(p, next) : parent.appendChild(p);
    });

    maxW = Math.min(Math.max(260, maxW), 300);
    document.documentElement.style.setProperty("--menuW", `${maxW}px`);
  });
}

document.addEventListener("DOMContentLoaded", setUniformMenuWidth);
window.addEventListener("load", setUniformMenuWidth, { passive: true });
if (document.fonts && document.fonts.ready) document.fonts.ready.then(setUniformMenuWidth);
let _mwTimer;
window.addEventListener(
  "resize",
  () => {
    clearTimeout(_mwTimer);
    _mwTimer = setTimeout(setUniformMenuWidth, 150);
  },
  { passive: true }
);

// =======================================================
// NAVBAR DROPDOWN — portal + blur + hover logic (dashboard)
// =======================================================
(() => {
  const items = document.querySelectorAll(".menu-item");
  if (!items.length) return;

  let portal = document.getElementById("menu-portal");
  if (!portal) {
    portal = document.createElement("div");
    portal.id = "menu-portal";
    document.body.appendChild(portal);
  }

  let openItem = null;
  let openPanel = null;
  let restore = null;
  const hoverTimers = new WeakMap();

  function moveToPortal(panel) {
    const parent = panel.parentNode;
    const next   = panel.nextSibling;
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
    const wasOpen = panel.classList.contains("is-open");
    if (!wasOpen) {
      panel.style.visibility = "hidden";
      panel.classList.add("is-open");
      document.body.offsetHeight;
    }
    const w = Math.max(panel.offsetWidth, 260);
    const h = panel.offsetHeight;
    if (!wasOpen) {
      panel.classList.remove("is-open");
      panel.style.visibility = "";
    }
    return { w, h };
  }
  function place(item) {
    const btn   = item.querySelector(".menu-trigger");
    const panel = openPanel || item.querySelector(".dropdown");
    if (!btn || !panel) return;

    if (panel.parentNode !== portal) moveToPortal(panel);

    const r  = btn.getBoundingClientRect();
    const vw = document.documentElement.clientWidth;
    const vh = document.documentElement.clientHeight;
    const EDGE = 12, GAP = 8;
    const { w: pw, h: ph } = measure(panel);

    const preferEnd = r.left > vw * 0.6;
    let left = preferEnd ? r.right - pw : r.left;
    left = Math.min(Math.max(EDGE, left), vw - pw - EDGE);

    let top = r.bottom + GAP;
    if (top + ph + EDGE > vh) top = Math.max(EDGE, r.top - ph - GAP);

    panel.style.left = Math.round(left) + "px";
    panel.style.top  = Math.round(top)  + "px";
  }
  function cancelCloseTimer(item) {
    const t = hoverTimers.get(item);
    if (t) { clearTimeout(t); hoverTimers.delete(item); }
  }
  function scheduleClose(item) {
    cancelCloseTimer(item);
    const t = setTimeout(() => { if (openItem === item) closeAll(); }, 120);
    hoverTimers.set(item, t);
  }
  function open(item) {
    if (openItem === item) return;
    closeAll();

    const btn   = item.querySelector(".menu-trigger");
    const panel = item.querySelector(".dropdown");
    if (!btn || !panel) return;

    item.classList.add("open");
    btn.setAttribute("aria-expanded", "true");
    openItem  = item;
    openPanel = panel;

    place(item);
    panel.classList.add("is-open");
  }
  function closeAll() {
    if (!openItem) return;
    const item = openItem;

    item.classList.remove("open");
    item.querySelector(".menu-trigger")?.setAttribute("aria-expanded", "false");

    if (openPanel) {
      openPanel.classList.remove("is-open");
      openPanel.style.left = "";
      openPanel.style.top  = "";
      restorePanel(openPanel);
      openPanel = null;
    }
    cancelCloseTimer(item);
    openItem = null;
  }

  items.forEach((item) => {
    const btn   = item.querySelector(".menu-trigger");
    const panel = item.querySelector(".dropdown");
    if (!btn || !panel) return;

    btn.setAttribute("aria-haspopup", "true");
    btn.setAttribute("aria-expanded", "false");
    btn.addEventListener("click", (e) => e.preventDefault());

    const onEnter = () => { open(item); cancelCloseTimer(item); };
    const onLeaveFromBtn = (e) => {
      const to = e.relatedTarget;
      if (to && panel.contains(to)) return;
      scheduleClose(item);
    };
    const onLeaveFromPanel = (e) => {
      const to = e.relatedTarget;
      if (to && btn.contains(to)) return;
      scheduleClose(item);
    };

    btn.addEventListener("pointerenter", onEnter);
    panel.addEventListener("pointerenter", onEnter);
    btn.addEventListener("mouseleave", onLeaveFromBtn);
    panel.addEventListener("mouseleave", onLeaveFromPanel);
    btn.addEventListener("touchstart", (e) => { open(item); cancelCloseTimer(item); e.preventDefault(); }, { passive: false });
  });

  const realign = () => { if (openItem) place(openItem); };
  window.addEventListener("resize", realign, { passive: true });
  window.addEventListener("scroll", realign, { passive: true });
  window.addEventListener("orientationchange", realign, { passive: true });
  window.addEventListener("keydown", (e) => { if (e.key === "Escape") closeAll(); });
})();
