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
   NAVBAR DROPDOWN — fixed + smart alignment + flip logic
   ======================================================= */
(() => {
  const items = document.querySelectorAll(".menu-item");
  if (!items.length) return;

  let openItem = null;

  // Measure at real size (temporarily show invisibly if needed)
  function measureMenu(panel) {
    const wasOpen = panel.classList.contains("is-open");
    if (!wasOpen) {
      panel.classList.add("is-open");
      panel.style.visibility = "hidden";
    }
    const w = Math.max(panel.offsetWidth || 0, 260); // keep minimum feel
    const h = panel.offsetHeight || 0;
    if (!wasOpen) {
      panel.classList.remove("is-open");
      panel.style.visibility = "";
    }
    return { w, h };
  }

  function placeDropdown(item) {
    const btn   = item.querySelector(".menu-trigger");
    const panel = item.querySelector(".dropdown");
    if (!btn || !panel) return;

    const r   = btn.getBoundingClientRect(); // trigger in viewport
    const vw  = document.documentElement.clientWidth;
    const vh  = document.documentElement.clientHeight;
    const GAP = 8;   // spacing from trigger
    const EDGE = 12; // viewport padding

    const { w: panelW, h: panelH } = measureMenu(panel);

    // Prefer end-alignment when trigger is near the right side
    const preferEnd = r.left > vw * 0.6;
    let left = preferEnd ? (r.right - panelW) : r.left;

    // Clamp horizontally to viewport
    left = Math.min(Math.max(EDGE, left), vw - panelW - EDGE);

    // Place below; if not enough room, flip above
    let top = r.bottom + GAP;
    if (top + panelH + EDGE > vh) {
      top = Math.max(EDGE, r.top - panelH - GAP);
    }

    panel.style.left = `${Math.round(left)}px`;
    panel.style.top  = `${Math.round(top)}px`;
  }

  function closeAll() {
    items.forEach((i) => {
      i.classList.remove("open");
      i.querySelector(".menu-trigger")?.setAttribute("aria-expanded", "false");
      const p = i.querySelector(".dropdown");
      if (p) {
        p.classList.remove("is-open");
        p.style.left = "";
        p.style.top  = "";
      }
    });
    openItem = null;
  }

  function open(item) {
    const btn   = item.querySelector(".menu-trigger");
    const panel = item.querySelector(".dropdown");
    if (!btn || !panel) return;

    closeAll();
    item.classList.add("open");
    btn.setAttribute("aria-expanded", "true");

    // Position first using real size, then reveal
    placeDropdown(item);
    panel.classList.add("is-open");
    openItem = item;

    // a11y: focus first control inside the menu
    const first = panel.querySelector("a,button,[tabindex]:not([tabindex='-1'])");
    first?.focus({ preventScroll: true });
  }

  // Toggle on click
  items.forEach((i) => {
    const btn = i.querySelector(".menu-trigger");
    if (!btn) return;
    btn.setAttribute("aria-haspopup", "true");
    btn.setAttribute("aria-expanded", "false");
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      if (openItem === i) closeAll();
      else open(i);
    });
  });

  // Keep aligned while resizing/scrolling/orienting
  ["resize", "scroll", "orientationchange"].forEach((ev) => {
    window.addEventListener(
      ev,
      () => {
        if (openItem) placeDropdown(openItem);
      },
      { passive: true }
    );
  });

  // Click/touch outside to close
  ["click", "touchstart"].forEach((ev) => {
    window.addEventListener(
      ev,
      (e) => {
        if (!e.target.closest(".menu-item")) closeAll();
      },
      { passive: true }
    );
  });

  // Esc to close
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeAll();
  });
})();
