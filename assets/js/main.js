/* =========================================
   UTAR Portal Demo — main.js (clean build)
   ========================================= */

/* tiny helper */
const $ = (sel, ctx = document) => ctx.querySelector(sel);

/* ---------------------------
   LOGIN PAGE
----------------------------*/
document.addEventListener("DOMContentLoaded", () => {
  const form = $("#login-form");
  if (!form) return; // not on login page

  const idEl = $("#id");
  const pwdEl = $("#pwd");
  const status = $("#status");

  const setStatus = (msg, ok = false) => {
    if (!status) return;
    status.textContent = msg;
    status.style.color = ok ? "#0a7a25" : "#d02b2b";
  };

  const USERS = { "22123456": { name: "Demo Student", password: "password123" } };

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const id = (idEl?.value || "").trim();
    const pwd = (pwdEl?.value || "").trim();
    if (!id || !pwd) return setStatus("Please enter both Student ID and Password.");

    const u = USERS[id];
    if (u && u.password === pwd) {
      setStatus("Login successful. Redirecting…", true);
      localStorage.setItem("demo_user", JSON.stringify({ id, name: u.name || "Student", time: Date.now() }));
      setTimeout(() => (location.href = "dashboard.html"), 600);
    } else {
      setStatus("Invalid credentials (try ID 22123456 / password123).");
    }
  });

  [idEl, pwdEl].forEach((el) =>
    el?.addEventListener("keydown", (e) => e.key === "Enter" && form.requestSubmit())
  );
});

/* Password eye (delegated, works everywhere) */
document.addEventListener(
  "click",
  (e) => {
    const btn = e.target.closest(".pwd-toggle");
    if (!btn) return;
    const wrap = btn.closest(".pwd-wrap");
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

/* ---------------------------
   DASHBOARD PAGE (all logic in one pass)
----------------------------*/
document.addEventListener("DOMContentLoaded", () => {
  /* If not on dashboard, bail early */
  const dashRoot = document.querySelector(".glass");
  if (!dashRoot) return;

  /* greet + id */
  const welcome = $("#welcome");
  const chipId = $("#chipId");
  const logout = $("#logout");

  const raw = localStorage.getItem("demo_user");
  if (!raw) return (location.href = "index.html");

  try {
    const data = JSON.parse(raw);
    const name = data?.name || "Student";
    const id = data?.id || "";
    if (welcome) welcome.textContent = `Hello, ${name}${id ? ` (${id})` : ""}`;
    if (chipId) chipId.textContent = id ? `ID: ${id}` : "ID: —";
  } catch {
    localStorage.removeItem("demo_user");
    return (location.href = "index.html");
  }

  logout?.addEventListener("click", () => {
    localStorage.removeItem("demo_user");
    location.href = "index.html";
  });

  /* ---------- Header portal dropdowns ---------- */
  (function initHeaderMenus() {
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

    const moveToPortal = (panel) => {
      const parent = panel.parentNode;
      const next = panel.nextSibling;
      restore = { parent, next };
      portal.appendChild(panel);
    };
    const restorePanel = (panel) => {
      if (!restore) return;
      const { parent, next } = restore;
      next ? parent.insertBefore(panel, next) : parent.appendChild(panel);
      restore = null;
    };
    const measure = (panel) => {
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
    };
    const place = (item) => {
      const btn = item.querySelector(".menu-trigger");
      const panel = openPanel || item.querySelector(".dropdown");
      if (!btn || !panel) return;

      if (panel.parentNode !== portal) moveToPortal(panel);

      const r = btn.getBoundingClientRect();
      const vw = document.documentElement.clientWidth;
      const vh = document.documentElement.clientHeight;
      const EDGE = 12,
        GAP = 8;
      const { w: pw, h: ph } = measure(panel);

      const preferEnd = r.left > vw * 0.6;
      let left = preferEnd ? r.right - pw : r.left;
      left = Math.min(Math.max(EDGE, left), vw - pw - EDGE);

      let top = r.bottom + GAP;
      if (top + ph + EDGE > vh) top = Math.max(EDGE, r.top - ph - GAP);

      panel.style.left = Math.round(left) + "px";
      panel.style.top = Math.round(top) + "px";
    };
    const cancelCloseTimer = (item) => {
      const t = hoverTimers.get(item);
      if (t) {
        clearTimeout(t);
        hoverTimers.delete(item);
      }
    };
    const scheduleClose = (item) => {
      cancelCloseTimer(item);
      const t = setTimeout(() => {
        if (openItem === item) closeAll();
      }, 120);
      hoverTimers.set(item, t);
    };
    const open = (item) => {
      if (openItem === item) return;
      closeAll();

      const btn = item.querySelector(".menu-trigger");
      const panel = item.querySelector(".dropdown");
      if (!btn || !panel) return;

      item.classList.add("open");
      btn.setAttribute("aria-expanded", "true");
      openItem = item;
      openPanel = panel;

      place(item);
      panel.classList.add("is-open");
    };
    const closeAll = () => {
      if (!openItem) return;
      const item = openItem;

      item.classList.remove("open");
      item.querySelector(".menu-trigger")?.setAttribute("aria-expanded", "false");

      if (openPanel) {
        openPanel.classList.remove("is-open");
        openPanel.style.left = "";
        openPanel.style.top = "";
        restorePanel(openPanel);
        openPanel = null;
      }
      cancelCloseTimer(item);
      openItem = null;
    };

    items.forEach((item) => {
      const btn = item.querySelector(".menu-trigger");
      const panel = item.querySelector(".dropdown");
      if (!btn || !panel) return;

      btn.setAttribute("aria-haspopup", "true");
      btn.setAttribute("aria-expanded", "false");
      btn.addEventListener("click", (e) => e.preventDefault());

      const onEnter = () => {
        open(item);
        cancelCloseTimer(item);
      };
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
      btn.addEventListener(
        "touchstart",
        (e) => {
          open(item);
          cancelCloseTimer(item);
          e.preventDefault();
        },
        { passive: false }
      );
    });

    const realign = () => openItem && place(openItem);
    window.addEventListener("resize", realign, { passive: true });
    window.addEventListener("scroll", realign, { passive: true });
    window.addEventListener("orientationchange", realign, { passive: true });
    window.addEventListener("keydown", (e) => e.key === "Escape" && closeAll());
  })();

  /* Uniform dropdown width */
  (function setUniformMenuWidth() {
    const panels = Array.from(document.querySelectorAll(".dropdown"));
    if (!panels.length) return;

    requestAnimationFrame(() => {
      let maxW = 260;
      panels.forEach((p) => {
        const parent = p.parentNode;
        const next = p.nextSibling;
        const prev = {
          pos: p.style.position,
          vis: p.style.visibility,
          disp: p.style.display,
          left: p.style.left,
          top: p.style.top,
        };
        document.body.appendChild(p);
        p.style.position = "absolute";
        p.style.visibility = "hidden";
        p.style.display = "block";
        p.style.left = "-9999px";
        p.style.top = "-9999px";
        maxW = Math.max(maxW, Math.ceil(p.scrollWidth) + 1);
        p.style.position = prev.pos;
        p.style.visibility = prev.vis;
        p.style.display = prev.disp;
        p.style.left = prev.left;
        p.style.top = prev.top;
        next ? parent.insertBefore(p, next) : parent.appendChild(p);
      });
      maxW = Math.min(Math.max(260, maxW), 300);
      document.documentElement.style.setProperty("--menuW", `${maxW}px`);
    });

    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => setUniformMenuWidth());
    let t;
    window.addEventListener(
      "resize",
      () => {
        clearTimeout(t);
        t = setTimeout(setUniformMenuWidth, 150);
      },
      { passive: true }
    );
  })();

  /* ---------- Account dropdown (click) ---------- */
  (function accountMenu() {
    const btn = document.getElementById("acctBtn");
    const menu = document.getElementById("acctMenu");
    if (!btn || !menu) return;
    const toggle = (open) => {
      const o = open ?? !menu.classList.contains("is-open");
      menu.classList.toggle("is-open", o);
      btn.setAttribute("aria-expanded", String(o));
    };
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      toggle();
    });
    document.addEventListener("click", (e) => {
      if (e.target === btn || btn.contains(e.target) || menu.contains(e.target)) return;
      toggle(false);
    });
  })();

  /* ---------- Demo datasets ---------- */
  const DATA = {
    subjects: [
      { code: "UCCD2513", name: "Data Structures", units: 3, wble: "#" },
      { code: "UCCD2223", name: "Web Engineering", units: 3, wble: "#" },
      { code: "UCCD2123", name: "Discrete Mathematics", units: 3, wble: "#" },
    ],
    exams: [
      { when: "2025-10-28T09:00:00", course: "UCCD2513 Data Structures", venue: "KB A-201" },
      { when: "2025-10-31T14:00:00", course: "UCCD2223 Web Engineering", venue: "KB C-105" },
      { when: "2025-11-04T09:00:00", course: "UCCD2123 Discrete Math", venue: "KB Hall" },
    ],
    announcements: [
      { date: "2025-10-21", text: "Add/Drop closes this Friday (5pm). Please confirm your subjects." },
      { date: "2025-10-25", text: "Career Fair next week at KB Hall. Register via Student Affairs." },
      { date: "2025-10-28", text: "WBLE maintenance Tue 1–2am — short downtime expected." },
    ],
    nextClass: {
      name: "UCCD2223 Web Engineering (Lab)",
      start: (() => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        d.setHours(9, 0, 0, 0);
        return d;
      })(),
      location: "KB Lab 3-12",
      lecturer: "Dr. Lee Wei Jun",
      semester: "Y2 • S1",
      weekNow: 7,
      weekTotal: 14,
    },
    fees: { balance: 0.0, lastInvoice: "2025-09-10" },
  };

  const fmtRM = (n) => `RM ${n.toFixed(2)}`;
  const fmtDateShort = (iso) =>
    new Date(iso).toLocaleDateString(undefined, { month: "short", day: "2-digit" });
  const startsIn = (date) => {
    const diff = date - new Date();
    if (diff <= 0) return "now";
    const mins = Math.round(diff / 60000);
    if (mins < 60) return `${mins} min`;
    const hrs = Math.round(mins / 60);
    if (hrs < 24) return `${hrs} hr`;
    const days = Math.round(hrs / 24);
    return `${days} day${days > 1 ? "s" : ""}`;
  };

  /* helpers to target cards by title and clear placeholders */
  const findCard = (titleStartsWith) =>
    [...document.querySelectorAll(".card")].find((c) =>
      c.querySelector("h2")?.textContent.trim().toLowerCase().startsWith(titleStartsWith.toLowerCase())
    );
  const resetCardKeepTitle = (card) => {
    const h2 = card.querySelector("h2");
    if (!h2) return;
    let n = h2.nextSibling;
    while (n) {
      const next = n.nextSibling;
      card.removeChild(n);
      n = next;
    }
  };

  /* Quick Access: keep links and left-align them */
  (() => {
    const card = findCard("Quick Access");
    if (!card) return;
    const anchors = [...card.querySelectorAll("a")].map((a) => ({
      href: a.getAttribute("href") || "#",
      text: (a.textContent || "").trim() || "Link",
    }));
    resetCardKeepTitle(card);
    const wrap = document.createElement("div");
    wrap.className = "links";
    wrap.style.textAlign = "left";
    wrap.innerHTML = anchors.map((a) => `<a href="${a.href}">${a.text}</a>`).join("");
    card.appendChild(wrap);
  })();

  /* Current Subjects */
  (() => {
    const card = findCard("Current Subjects");
    if (!card) return;
    resetCardKeepTitle(card);
    const table = document.createElement("table");
    table.className = "table";
    table.innerHTML = `
      <thead><tr><th>Code</th><th>Subject</th><th>Units</th><th>WBLE</th></tr></thead>
      <tbody>${DATA.subjects
        .map(
          (s) =>
            `<tr><td>${s.code}</td><td>${s.name}</td><td>${s.units}</td><td><a href="${s.wble}" target="_blank" rel="noopener">Open</a></td></tr>`
        )
        .join("")}</tbody>`;
    card.appendChild(table);
  })();

  /* University Announcements */
  (() => {
    const card = findCard("University Announcements");
    if (!card) return;
    resetCardKeepTitle(card);
    const ul = document.createElement("ul");
    ul.style.margin = "0";
    ul.style.paddingLeft = "0";
    ul.innerHTML = DATA.announcements
      .map(
        (a) =>
          `<li style="list-style:none; padding:8px 0; border-bottom:1px solid #efeff2">
             <span style="color:#6e6e73; font-size:12px">${a.date}</span><br>
             <strong style="font-weight:600">${a.text}</strong>
           </li>`
      )
      .join("");
    card.appendChild(ul);
  })();

  /* Next Class & Semester (single, no duplicates) */
  (() => {
    const card = findCard("Next Class");
    if (!card) return;
    resetCardKeepTitle(card);
    const kv = document.createElement("div");
    kv.className = "kv";
    const nc = DATA.nextClass;
    kv.innerHTML = `
      <div><span>Next class</span><strong>${nc.name}</strong></div>
      <div><span>Starts in</span><strong>${startsIn(nc.start)}</strong></div>
      <div><span>Location</span><strong>${nc.location}</strong></div>
      <div><span>Lecturer</span><strong>${nc.lecturer}</strong></div>
      <div><span>Semester</span><strong>${nc.semester}</strong></div>
      <div><span>Progress</span><strong>${nc.weekNow} / ${nc.weekTotal} weeks</strong></div>
    `;
    card.appendChild(kv);
  })();

  /* Upcoming Exams */
  (() => {
    const card = findCard("Upcoming Exams");
    if (!card) return;
    resetCardKeepTitle(card);
    const table = document.createElement("table");
    table.className = "table";
    const upcoming = DATA.exams
      .filter((e) => new Date(e.when) >= new Date())
      .sort((a, b) => new Date(a.when) - new Date(b.when))
      .slice(0, 3);
    table.innerHTML = `
      <thead><tr><th>Date</th><th>Course</th><th>Venue</th></tr></thead>
      <tbody>${upcoming
        .map((e) => `<tr><td>${fmtDateShort(e.when)}</td><td>${e.course}</td><td>${e.venue}</td></tr>`)
        .join("")}</tbody>`;
    card.appendChild(table);
  })();

  /* Fees & Payments */
  (() => {
    const card = findCard("Fees & Payments");
    if (!card) return;
    resetCardKeepTitle(card);
    const kv = document.createElement("div");
    kv.className = "kv";
    kv.innerHTML = `
      <div><span>Outstanding Balance</span><strong>${fmtRM(DATA.fees.balance)}</strong></div>
      <div><span>Last Invoice</span><strong>${DATA.fees.lastInvoice}</strong></div>
    `;
    card.appendChild(kv);
  })();
});
