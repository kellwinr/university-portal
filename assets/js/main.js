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

// ---------- Simple account dropdown ----------
document.addEventListener('DOMContentLoaded', () => {
  const btn   = document.getElementById('acctBtn');
  const menu  = document.getElementById('acctMenu');
  if (!btn || !menu) return;

  const toggle = (open) => {
    const o = (open ?? !menu.classList.contains('is-open'));
    menu.classList.toggle('is-open', o);
    btn.setAttribute('aria-expanded', String(o));
  };

  btn.addEventListener('click', (e) => { e.preventDefault(); toggle(); });
  document.addEventListener('click', (e) => {
    if (e.target === btn || btn.contains(e.target) || menu.contains(e.target)) return;
    toggle(false);
  });
});

// ---------- Demo content population ----------
document.addEventListener('DOMContentLoaded', () => {
  // Subjects
  const st = document.querySelector('#subjectsTable tbody');
  if (st){
    const subjects = [
      { code:'UCCD2513', name:'Data Structures', units:3, wble:'Open' },
      { code:'UCCD2223', name:'Web Engineering', units:3, wble:'Open' },
      { code:'UCCD2123', name:'Discrete Math',  units:3, wble:'Open' },
    ];
    st.innerHTML = subjects.map(s => `<tr><td>${s.code}</td><td>${s.name}</td><td>${s.units}</td><td>${s.wble}</td></tr>`).join('');
  }

  // Next class (fake)
  const nc = { name:'UCCD2513 Tutorial', startsIn:'1h 40m', week: '7' };
  const byId = id => document.getElementById(id);
  byId('nc-name') && (byId('nc-name').textContent = nc.name);
  byId('nc-in')   && (byId('nc-in').textContent   = nc.startsIn);
  byId('wk')      && (byId('wk').textContent      = `${nc.week} / 14 weeks`);

  // Fees/messages (fake)
  byId('bal') && (byId('bal').textContent = 'RM 0.00');
  byId('inv') && (byId('inv').textContent = '—');
  byId('msg-count') && (byId('msg-count').textContent = '2');

  // Notification badge clear
  document.querySelector('.icon-btn.bell')?.addEventListener('click', () => {
    const b = document.getElementById('notifBadge'); if (b) b.textContent = '';
  });
});

document.addEventListener('DOMContentLoaded', () => {
  // ----- Current Subjects -----
  const subjBody = document.querySelector('#subjectsTable tbody') 
                || document.querySelector('[data-demo="subjects-body"]');
  if (subjBody){
    const subjects = [
      { code:'UCCD2513', name:'Data Structures', units:3, wble:'Open' },
      { code:'UCCD2223', name:'Web Engineering', units:3, wble:'Open' },
      { code:'UCCD2123', name:'Discrete Math',  units:3, wble:'Open' },
    ];
    subjBody.innerHTML = subjects.map(s =>
      `<tr><td>${s.code}</td><td>${s.name}</td><td>${s.units}</td><td>${s.wble}</td></tr>`
    ).join('');
  }

  // ----- Upcoming Exams -----
  const examBody = document.querySelector('#examTable tbody')
                 || document.querySelector('[data-demo="exams-body"]');
  if (examBody){
    const exams = [
      { date:'28 Oct, 9:00', course:'UCCD2513 Data Structures', venue:'KB A-201' },
      { date:'31 Oct, 2:00', course:'UCCD2223 Web Engineering', venue:'KB C-105' },
      { date:'04 Nov, 9:00', course:'UCCD2123 Discrete Math',   venue:'KB Hall' },
    ];
    examBody.innerHTML = exams.map(e =>
      `<tr><td>${e.date}</td><td>${e.course}</td><td>${e.venue}</td></tr>`
    ).join('');
  }

  // ----- Next Class & Semester -----
  const ncName = document.getElementById('nc-name');
  const ncIn   = document.getElementById('nc-in');
  const wk     = document.getElementById('wk');
  if (ncName && ncIn && wk){
    const next = { name:'UCCD2513 Tutorial', startsIn:'1h 40m', week:'7' };
    ncName.textContent = next.name;
    ncIn.textContent   = next.startsIn;
    wk.textContent     = `${next.week} / 14 weeks`;
  }

  // ----- Fees & Payments -----
  const bal = document.getElementById('bal');
  const inv = document.getElementById('inv');
  if (bal && inv){
    bal.textContent = 'RM 0.00';
    inv.textContent = '—';
  }

  // ----- Messages (Mailmaster) -----
  const msgCount = document.getElementById('msg-count');
  if (msgCount) msgCount.textContent = '2';
});

// ---------- Demo content for the dashboard ----------
document.addEventListener('DOMContentLoaded', () => {
  // Only run on the dashboard page
  const subjectsTbody = document.querySelector('#subjectsTable tbody');
  const examsTbody    = document.querySelector('#examTable tbody');
  const annList       = document.getElementById('annList');
  const ncName        = document.getElementById('nc-name');
  const ncWhen        = document.getElementById('nc-when');
  const ncWhere       = document.getElementById('nc-where');
  const ncLect        = document.getElementById('nc-lect');
  const sem           = document.getElementById('sem');
  const progressText  = document.getElementById('progressText');
  const feeBal        = document.getElementById('fee-balance');
  const feeLast       = document.getElementById('fee-last');
  const mailLink      = document.getElementById('mailLink');

  // If none of these exist, not on dashboard
  if (
    !subjectsTbody && !examsTbody && !annList &&
    !ncName && !feeBal
  ) return;

  // --- Mock datasets (adjust freely) ---
  const SUBJECTS = [
    { code: 'UCCD2513', name: 'Data Structures', units: 3, wble: 'https://wble.utar.edu.my/course/uccd2513' },
    { code: 'UCCD2223', name: 'Web Engineering', units: 3, wble: 'https://wble.utar.edu.my/course/uccd2223' },
    { code: 'UCCD2123', name: 'Discrete Mathematics', units: 3, wble: 'https://wble.utar.edu.my/course/uccd2123' },
  ];

  const EXAMS = [
    { when: '2025-10-28T09:00:00', course: 'UCCD2513 Data Structures', venue: 'KB A-201' },
    { when: '2025-10-31T14:00:00', course: 'UCCD2223 Web Engineering', venue: 'KB C-105' },
    { when: '2025-11-04T09:00:00', course: 'UCCD2123 Discrete Math',   venue: 'KB Hall'  },
  ];

  const ANNOUNCEMENTS = [
    { date: '2025-10-21', text: 'Add/Drop closes this Friday (5pm). Please confirm your subjects.' },
    { date: '2025-10-25', text: 'Career Fair next week at KB Hall. Register via Student Affairs.' },
    { date: '2025-10-28', text: 'WBLE maintenance, Tue 1–2am — short downtime expected.' },
  ];

  const NEXT_CLASS = {
    name: 'UCCD2223 Web Engineering (Lab)',
    start: (function () { // next weekday 09:00
      const d = new Date();
      let day = d.getDay(); // 0 Sun … 6 Sat
      // choose next Mon/Tue/Thu quickly:
      const offsets = { 1:1, 2:1, 3:1, 4:1, 5:3, 6:2, 0:1 }; // rough progression
      const add = offsets[day] ?? 1;
      d.setDate(d.getDate() + add);
      d.setHours(9,0,0,0);
      return d.toISOString();
    })(),
    location: 'KB Lab 3-12',
    lecturer: 'Dr. Lee Wei Jun',
    semester: 'Y2 • S1',
    weekNow: 7,
    weekTotal: 14,
  };

  const FEES = { balance: 0.00, lastInvoice: '2025-09-10' };
  const MAIL_COUNT = 3;

  // --- Helpers ---
  const fmtRM   = (n) => `RM ${n.toFixed(2)}`;
  const fmtDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleString(undefined, { year:'numeric', month:'short', day:'2-digit', hour:'2-digit', minute:'2-digit' });
  };
  const fmtDateShort = (iso) => (new Date(iso)).toLocaleDateString(undefined, { month:'short', day:'2-digit' });

  // --- Render: subjects ---
  if (subjectsTbody) {
    subjectsTbody.innerHTML = SUBJECTS.map(s => `
      <tr>
        <td>${s.code}</td>
        <td>${s.name}</td>
        <td>${s.units}</td>
        <td><a href="${s.wble}" target="_blank" rel="noopener">Open</a></td>
      </tr>
    `).join('');
  }

  // --- Render: exams ---
  if (examsTbody) {
    const upcoming = EXAMS
      .filter(e => new Date(e.when) >= new Date())
      .sort((a,b) => new Date(a.when) - new Date(b.when));
    examsTbody.innerHTML = upcoming.slice(0,3).map(e => `
      <tr>
        <td>${fmtDateShort(e.when)}</td>
        <td>${e.course}</td>
        <td>${e.venue}</td>
      </tr>
    `).join('');
  }

  // --- Render: announcements ---
  if (annList) {
    annList.innerHTML = ANNOUNCEMENTS.map(a => `
      <li style="list-style:none; padding:8px 0; border-bottom:1px solid #efeff2">
        <span style="color:#6e6e73; font-size:12px">${a.date}</span><br>
        <strong style="font-weight:600">${a.text}</strong>
      </li>
    `).join('');
  }

  // --- Render: next class ---
  if (ncName && ncWhen && ncWhere && ncLect && sem && progressText) {
    ncName.textContent = NEXT_CLASS.name;
    ncWhen.textContent = (() => {
      const start = new Date(NEXT_CLASS.start);
      const now = new Date();
      const diffMs = start - now;
      if (diffMs <= 0) return 'now';
      const mins = Math.round(diffMs / 60000);
      if (mins < 60) return `${mins} min`;
      const hrs = Math.round(mins / 60);
      const days = Math.floor(hrs / 24);
      return days >= 1 ? `${days} day${days>1?'s':''}` : `${hrs} hr`;
    })();
    ncWhere.textContent = NEXT_CLASS.location;
    ncLect.textContent  = NEXT_CLASS.lecturer;
    sem.textContent     = NEXT_CLASS.semester;
    progressText.textContent = `${NEXT_CLASS.weekNow} / ${NEXT_CLASS.weekTotal} weeks`;
  }

  // --- Render: fees ---
  if (feeBal && feeLast) {
    feeBal.textContent  = fmtRM(FEES.balance);
    feeLast.textContent = FEES.lastInvoice;
  }

  // --- Mailmaster link count (optional) ---
  if (mailLink) {
    mailLink.textContent = `Open Mailmaster (${MAIL_COUNT} new) →`;
    mailLink.href = '#';
  }
});
