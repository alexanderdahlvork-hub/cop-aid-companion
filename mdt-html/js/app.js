/**
 * AVLD-Systems.dk – MDT Politi App (Vanilla JS)
 * Alt-i-én applikationslogik
 */

// ── State ──
let currentUser = null;
let isAdmin = false;
let openTabs = [{ id: "forside", label: "Forside", type: "forside" }];
let activeTabId = "forside";

// ── Helpers ──
function $(sel) { return document.querySelector(sel); }
function $$(sel) { return document.querySelectorAll(sel); }
function el(tag, attrs = {}, children = []) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "className") e.className = v;
    else if (k === "onclick") e.addEventListener("click", v);
    else if (k === "innerHTML") e.innerHTML = v;
    else if (k === "textContent") e.textContent = v;
    else if (k === "style") Object.assign(e.style, v);
    else e.setAttribute(k, v);
  }
  for (const c of children) {
    if (typeof c === "string") e.appendChild(document.createTextNode(c));
    else if (c) e.appendChild(c);
  }
  return e;
}
function showToast(msg) {
  const t = el("div", { className: "toast", textContent: msg });
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}
function formatDaDK(n) { return n.toLocaleString("da-DK"); }

// SVG icons as strings
const icons = {
  shield: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
  home: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
  megaphone: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m3 11 18-5v12L3 13v-2z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg>',
  radio: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14"/></svg>',
  users: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  car: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>',
  building: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>',
  alert: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>',
  file: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>',
  folder: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>',
  map: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>',
  badge: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.77 4 4 0 0 1 0 6.76 4 4 0 0 1-4.78 4.77 4 4 0 0 1-6.74 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"/><path d="m9 12 2 2 4-4"/></svg>',
  target: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>',
  crosshair: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="22" x2="18" y1="12" y2="12"/><line x1="6" x2="2" y1="12" y2="12"/><line x1="12" x2="12" y1="2" y2="6"/><line x1="12" x2="12" y1="18" y2="22"/></svg>',
  gauge: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/></svg>',
  heart: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>',
  search: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>',
  plus: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/><path d="M12 5v14"/></svg>',
  x: '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>',
};

// ── Sidebar Config ──
const sidebarSections = [
  { label: "OVERSIGT", items: [
    { id: "forside", label: "Forside", icon: "home" },
    { id: "opslagstavle", label: "Opslagstavle", icon: "megaphone" },
    { id: "kort", label: "Aktiv Patrulje", icon: "radio" },
  ]},
  { label: "DATABASE", items: [
    { id: "kr", label: "Personregister", icon: "users" },
    { id: "koeretoej", label: "Køretøjsregister", icon: "car" },
    { id: "ejendomme", label: "Ejendomsregister", icon: "building" },
    { id: "efterlysninger", label: "Efterlysninger", icon: "alert" },
  ]},
  { label: "SAGER", items: [
    { id: "opret_sag", label: "Opret Sag", icon: "file" },
    { id: "boeder", label: "Bødetakster", icon: "folder" },
    { id: "sagsarkiv", label: "Sagsarkiv", icon: "folder" },
    { id: "fartberegner", label: "Fartberegner", icon: "gauge" },
  ]},
  { label: "FLÅDESTYRING", items: [
    { id: "flaade", label: "Flådestyring", icon: "radio" },
  ]},
];

const afdelinger = [
  { id: "nsk", label: "NSK", icon: "target" },
  { id: "lima", label: "Lima", icon: "shield" },
  { id: "faerdsel", label: "Færdsel", icon: "gauge" },
  { id: "efterforskning", label: "Efterforskning", icon: "folder" },
  { id: "sig", label: "SIG", icon: "crosshair" },
  { id: "remeo", label: "Remeo", icon: "heart" },
];

const tabLabels = {
  forside:"Forside", opslagstavle:"Opslagstavle", kort:"Aktiv Patrulje", kr:"Personregister",
  koeretoej:"Køretøjsregister", ejendomme:"Ejendomsregister", efterlysninger:"Efterlysninger",
  opret_sag:"Opret Sag", boeder:"Bødetakster", sagsarkiv:"Sagsarkiv", flaade:"Flådestyring",
  opret_sag:"Opret Sag", boeder:"Bødetakster", sagsarkiv:"Sagsarkiv", flaade:"Flådestyring", fartberegner:"Fartberegner",
  ansatte:"Ansatte", ansoegninger:"Ansøgninger", profil:"Min Profil",
  nsk:"NSK", lima:"Lima", faerdsel:"Færdsel", efterforskning:"Efterforskning", sig:"SIG", remeo:"Remeo",
};

// ═══════════════════════════════════════════
// ── LOGIN ──
// ═══════════════════════════════════════════
let loginTapCount = 0, loginLastTap = 0;
document.addEventListener("DOMContentLoaded", () => {
  const badgeInput = $("#login-badge");
  const passInput = $("#login-password");
  const loginBtn = $("#login-btn");
  const errorDiv = $("#login-error");
  const matchedDiv = $("#login-matched");
  const logoTap = $("#login-logo-tap");

  let debounceTimer;
  badgeInput.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    if (badgeInput.value.length < 2) { matchedDiv.classList.add("hidden"); return; }
    debounceTimer = setTimeout(async () => {
      try {
        const b = await betjenteApi.getByBadge(badgeInput.value);
        if (b) { matchedDiv.innerHTML = `${b.fornavn} ${b.efternavn}<small class="mono">${b.rang}</small>`; matchedDiv.classList.remove("hidden"); }
        else matchedDiv.classList.add("hidden");
      } catch { matchedDiv.classList.add("hidden"); }
    }, 300);
  });

  logoTap.addEventListener("click", () => {
    const now = Date.now();
    if (now - loginLastTap < 500) { loginTapCount++; if (loginTapCount >= 2) { badgeInput.value = "ADM221"; passInput.value = "OverKommando99"; loginTapCount = 0; } }
    else loginTapCount = 0;
    loginLastTap = now;
  });

  async function doLogin() {
    if (!badgeInput.value || !passInput.value) { errorDiv.textContent = "Udfyld begge felter"; errorDiv.classList.remove("hidden"); return; }
    loginBtn.disabled = true; loginBtn.textContent = "LOGGER IND...";
    try {
      const betjent = await betjenteApi.getByBadge(badgeInput.value);
      if (!betjent) { errorDiv.textContent = "Badge nummer ikke fundet"; errorDiv.classList.remove("hidden"); loginBtn.disabled = false; loginBtn.textContent = "LOG IND"; return; }
      if (passInput.value !== betjent.kodeord) { errorDiv.textContent = "Forkert adgangskode"; errorDiv.classList.remove("hidden"); loginBtn.disabled = false; loginBtn.textContent = "LOG IND"; return; }
      currentUser = betjent;
      isAdmin = betjent.rang === "Administrator";
      errorDiv.classList.add("hidden");
      $("#login-page").classList.add("hidden");
      $("#app").classList.remove("hidden");
      initApp();
    } catch (err) {
      errorDiv.textContent = "Fejl: " + (err.message || "Ukendt"); errorDiv.classList.remove("hidden");
      loginBtn.disabled = false; loginBtn.textContent = "LOG IND";
    }
  }

  loginBtn.addEventListener("click", doLogin);
  passInput.addEventListener("keydown", (e) => { if (e.key === "Enter") doLogin(); });
  badgeInput.addEventListener("keydown", (e) => { if (e.key === "Enter") doLogin(); });
});

// ═══════════════════════════════════════════
// ── INIT APP ──
// ═══════════════════════════════════════════
function initApp() {
  renderSidebar();
  renderTabs();
  renderPage("forside");
  $("#sidebar-username").textContent = `${currentUser.fornavn} ${currentUser.efternavn}`;
  $("#sidebar-userrole").textContent = isAdmin ? "ADMIN" : currentUser.rang;
  $("#top-badge").textContent = `Badge: ${currentUser.badgeNr}`;

  // User popup toggle
  let popupOpen = false;
  $("#sidebar-user-btn").addEventListener("click", () => {
    popupOpen = !popupOpen;
    $("#sidebar-popup").classList.toggle("hidden", !popupOpen);
  });
  document.addEventListener("click", (e) => {
    if (popupOpen && !$("#sidebar-bottom").contains(e.target)) {
      popupOpen = false; $("#sidebar-popup").classList.add("hidden");
    }
  });
}

function handleLogout() {
  currentUser = null; isAdmin = false;
  openTabs = [{ id: "forside", label: "Forside", type: "forside" }];
  activeTabId = "forside";
  $("#app").classList.add("hidden");
  $("#login-page").classList.remove("hidden");
  $("#login-badge").value = ""; $("#login-password").value = "";
  $("#sidebar-popup").classList.add("hidden");
}

// ═══════════════════════════════════════════
// ── SIDEBAR ──
// ═══════════════════════════════════════════
function renderSidebar() {
  const nav = $("#sidebar-nav");
  nav.innerHTML = "";
  sidebarSections.forEach((section, i) => {
    if (i > 0) nav.appendChild(el("div", { className: "sidebar-divider" }));
    nav.appendChild(el("div", { className: "sidebar-section-label mono", textContent: section.label }));
    section.items.forEach(item => {
      const btn = el("button", {
        className: `sidebar-item ${activeTabId === item.id || (item.id === 'opret_sag' && activeTabId.startsWith('sag')) ? "active" : ""}`,
        innerHTML: `${icons[item.icon] || ""} <span>${item.label}</span>`,
        onclick: () => openTab(item.id),
      });
      nav.appendChild(btn);
    });
  });

  // Afdelinger
  const visibleAfd = isAdmin ? afdelinger : afdelinger.filter(a => (currentUser.afdeling || "").toLowerCase().includes(a.id));
  if (visibleAfd.length > 0) {
    nav.appendChild(el("div", { className: "sidebar-divider" }));
    nav.appendChild(el("div", { className: "sidebar-section-label mono", textContent: "AFDELINGER" }));
    visibleAfd.forEach(afd => {
      nav.appendChild(el("button", {
        className: `sidebar-item ${activeTabId === afd.id ? "active" : ""}`,
        innerHTML: `${icons[afd.icon] || ""} <span>${afd.label}</span>`,
        onclick: () => openTab(afd.id),
      }));
    });
  }

  // Bottom links
  const bottom = $("#sidebar-bottom");
  const linksHtml = `
    <button class="sidebar-item ${activeTabId === "ansatte" ? "active" : ""}" onclick="openTab('ansatte')">${icons.badge} <span>Ansatte</span></button>
    <button class="sidebar-item ${activeTabId === "ansoegninger" ? "active" : ""}" onclick="openTab('ansoegninger')">${icons.file} <span>Ansøgninger</span></button>
  `;
  // Insert before user section
  const existing = bottom.querySelector(".sidebar-links");
  if (existing) existing.remove();
  const linksDiv = el("div", { className: "sidebar-links", innerHTML: linksHtml });
  bottom.insertBefore(linksDiv, bottom.firstChild);
}

// ═══════════════════════════════════════════
// ── TAB MANAGEMENT ──
// ═══════════════════════════════════════════
function openTab(type, data) {
  if (type === "opret_sag") type = "sag";

  if (type === "sag") {
    const id = `sag-${data?.sagId || Date.now()}`;
    if (!openTabs.find(t => t.id === id)) {
      openTabs.push({ id, label: data?.label || "Ny Sag", type: "sag", data });
    }
    activeTabId = id;
  } else {
    const existing = openTabs.find(t => t.type === type);
    if (existing) { activeTabId = existing.id; }
    else { openTabs.push({ id: type, label: tabLabels[type] || type, type }); activeTabId = type; }
  }
  renderTabs();
  renderSidebar();
  renderPage(activeTabId);
}

function closeTab(id) {
  if (id === "forside") return;
  const idx = openTabs.findIndex(t => t.id === id);
  openTabs = openTabs.filter(t => t.id !== id);
  if (activeTabId === id) {
    activeTabId = openTabs[Math.min(idx, openTabs.length - 1)]?.id || "forside";
  }
  renderTabs();
  renderSidebar();
  renderPage(activeTabId);
}

function renderTabs() {
  const bar = $("#tabs-bar");
  bar.innerHTML = "";
  openTabs.forEach(tab => {
    const btn = el("button", {
      className: `tab-btn ${tab.id === activeTabId ? "active" : ""}`,
      onclick: () => { activeTabId = tab.id; renderTabs(); renderSidebar(); renderPage(tab.id); },
    }, [document.createTextNode(tab.label)]);
    if (tab.id !== "forside") {
      const closeBtn = el("button", { className: "tab-close", innerHTML: icons.x, onclick: (e) => { e.stopPropagation(); closeTab(tab.id); } });
      btn.appendChild(closeBtn);
    }
    bar.appendChild(btn);
  });
}

// ═══════════════════════════════════════════
// ── PAGE RENDERING ──
// ═══════════════════════════════════════════
function renderPage(tabId) {
  const area = $("#content-area");
  area.innerHTML = "";
  const tab = openTabs.find(t => t.id === tabId);
  if (!tab) return;

  switch (tab.type) {
    case "forside": renderDashboard(area); break;
    case "opslagstavle": renderOpslagstavle(area); break;
    case "kr": renderPersonregister(area); break;
    case "koeretoej": renderKoeretoejsregister(area); break;
    case "ejendomme": renderEjendomsregister(area); break;
    case "efterlysninger": renderEfterlysninger(area); break;
    case "sag": renderSagEditor(area, tab.data); break;
    case "boeder": renderBodetakster(area); break;
    case "sagsarkiv": renderSagsarkiv(area); break;
    case "flaade": renderFlaade(area); break;
    case "ansatte": renderAnsatte(area); break;
    case "profil": renderProfil(area); break;
    case "kort": renderKort(area); break;
    case "ansoegninger": renderAnsoegninger(area); break;
    case "nsk": renderNSK(area); break;
    case "lima": case "faerdsel": case "efterforskning": case "sig": case "remeo":
      renderAfdeling(area, tab.type); break;
    default: area.innerHTML = `<div class="loading-center"><p>Siden "${tab.label}" kommer snart</p></div>`;
  }
}

// ═══════════════════════════════════════════
// ── DASHBOARD ──
// ═══════════════════════════════════════════
async function renderDashboard(container) {
  const now = new Date();
  const dagNavn = ["Søndag","Mandag","Tirsdag","Onsdag","Torsdag","Fredag","Lørdag"];
  const maaned = ["jan","feb","mar","apr","maj","jun","jul","aug","sep","okt","nov","dec"];

  container.innerHTML = `
    <div class="card" style="position:relative;overflow:hidden">
      <div style="position:absolute;top:0;left:0;width:3px;height:100%;background:var(--primary);border-radius:12px 0 0 12px"></div>
      <h1 style="font-size:16px;font-weight:700;color:var(--fg);padding-left:8px">Velkommen, ${currentUser.fornavn}</h1>
      <p class="mono" style="font-size:12px;color:var(--muted-fg);padding-left:8px;margin-top:4px">${dagNavn[now.getDay()]} d. ${now.getDate()}. ${maaned[now.getMonth()]} — Badge: ${currentUser.badgeNr}</p>
    </div>
    <div class="grid grid-3 mt-3" id="dash-stats"></div>
    <div class="card mt-3"><h3 style="font-size:14px;font-weight:600;margin-bottom:8px">Seneste Aktivitet</h3><p style="font-size:12px;color:var(--muted-fg);font-style:italic">Ingen aktivitet i denne session.</p></div>
  `;

  try {
    const [personer, betjente] = await Promise.all([personerApi.getAll(), betjenteApi.getAll()]);
    const efterlyste = personer.filter(p => p.status === "eftersøgt").length;
    const statsDiv = $("#dash-stats");
    statsDiv.innerHTML = `
      <div class="stat-card" onclick="openTab('efterlysninger')" style="cursor:pointer"><div class="accent-bar" style="background:var(--warning)"></div><div class="stat-value mono" style="color:var(--warning)">${efterlyste}</div><div class="stat-label">Efterlyste personer</div></div>
      <div class="stat-card"><div class="accent-bar" style="background:var(--primary)"></div><div class="stat-value mono">${betjente.length}</div><div class="stat-label">Registrerede betjente</div></div>
      <div class="stat-card"><div class="accent-bar" style="background:var(--success)"></div><div class="stat-value mono">${personer.length}</div><div class="stat-label">Personer i registeret</div></div>
    `;
  } catch (err) { console.error(err); }
}

// ═══════════════════════════════════════════
// ── OPSLAGSTAVLE ──
// ═══════════════════════════════════════════
async function renderOpslagstavle(container) {
  container.innerHTML = '<div class="loading-center"><div class="spinner"></div><span>Indlæser opslag...</span></div>';
  try {
    const opslag = await opslagApi.getAll();
    const canManage = isAdmin || currentUser.rang === "Rigspolitichef";
    const katColors = { info: "badge-primary", rekruttering: "badge-success", advarsel: "badge-destructive", nyhed: "badge-warning" };
    const katLabels = { info: "Information", rekruttering: "Rekruttering", advarsel: "Advarsel", nyhed: "Nyhed" };

    let html = `<div class="flex items-center justify-between mb-3"><div class="flex items-center gap-3">${icons.megaphone}<h1 style="font-size:18px;font-weight:700">Opslagstavle</h1><span style="font-size:12px;color:var(--muted-fg)">${opslag.length} opslag</span></div>`;
    if (canManage) html += `<button class="btn btn-primary btn-sm" onclick="showOpslagForm()">${icons.plus} Nyt opslag</button>`;
    html += `</div><div id="opslag-form-area"></div><div id="opslag-list">`;

    (opslag.length > 0 ? opslag : []).forEach(o => {
      html += `<div class="card mb-2" style="padding:20px"><div class="flex items-center gap-2 mb-2"><span class="badge ${katColors[o.kategori] || 'badge-muted'}">${katLabels[o.kategori] || o.kategori}</span></div><h3 style="font-size:14px;font-weight:700;margin-bottom:8px">${o.titel}</h3><p style="font-size:13px;color:rgba(212,218,228,.8);white-space:pre-line;line-height:1.6">${o.indhold}</p><div class="flex items-center gap-3 mt-3" style="border-top:1px solid var(--border);padding-top:8px;font-size:11px;color:var(--muted-fg)"><span>👤 ${o.forfatterNavn}</span><span>📅 ${o.oprettetDato}</span></div></div>`;
    });
    if (opslag.length === 0) html += '<div class="loading-center" style="min-height:200px"><p>Ingen opslag endnu</p></div>';
    html += '</div>';
    container.innerHTML = html;
  } catch (err) { container.innerHTML = `<p style="color:var(--destructive)">Fejl: ${err.message}</p>`; }
}

window.showOpslagForm = function() {
  const area = document.getElementById("opslag-form-area");
  area.innerHTML = `<div class="card mb-3"><h3 style="font-size:14px;font-weight:600;margin-bottom:12px">Opret nyt opslag</h3><div class="label">Titel</div><input class="input mb-2" id="opslag-titel" placeholder="Overskrift..."><div class="label">Kategori</div><select class="select w-full mb-2" id="opslag-kat"><option value="info">Information</option><option value="rekruttering">Rekruttering</option><option value="advarsel">Advarsel</option><option value="nyhed">Nyhed</option></select><div class="label">Indhold</div><textarea class="textarea mb-2" id="opslag-indhold" rows="4" placeholder="Skriv indhold..."></textarea><div class="flex gap-2"><button class="btn btn-primary" onclick="submitOpslag()">Opret</button><button class="btn btn-outline" onclick="document.getElementById('opslag-form-area').innerHTML=''">Annuller</button></div></div>`;
};
window.submitOpslag = async function() {
  const titel = document.getElementById("opslag-titel").value;
  const indhold = document.getElementById("opslag-indhold").value;
  const kategori = document.getElementById("opslag-kat").value;
  if (!titel || !indhold) { showToast("Udfyld titel og indhold"); return; }
  const o = { id: `op_${Date.now()}`, titel, indhold, kategori, forfatterNavn: `${currentUser.fornavn} ${currentUser.efternavn}`, forfatterBadge: currentUser.badgeNr, oprettetDato: new Date().toISOString().split("T")[0] };
  await opslagApi.create(o);
  showToast("Opslag oprettet");
  renderPage(activeTabId);
};

// ═══════════════════════════════════════════
// ── PERSONREGISTER ──
// ═══════════════════════════════════════════
async function renderPersonregister(container) {
  container.innerHTML = '<div class="loading-center"><div class="spinner"></div><span>Indlæser personer...</span></div>';
  try {
    const [personer, sigtelser] = await Promise.all([personerApi.getAll(), sigtelserApi.getAll()]);
    const statusDots = { aktiv: "dot-success", eftersøgt: "dot-warning", anholdt: "dot-destructive", sigtet: "dot-primary" };
    const statusLabels = { aktiv: "Aktiv", eftersøgt: "Eftersøgt", anholdt: "Anholdt", sigtet: "Sigtet" };

    let html = `<div class="split-layout" style="height:calc(100vh - 140px)"><div class="split-left"><div style="padding:12px;border-bottom:1px solid var(--border)" class="flex gap-2"><div style="position:relative;flex:1"><input class="input" id="kr-search" placeholder="Søg navn eller CPR..." style="padding-left:32px">${icons.search.replace('width="14"','width="14" style="position:absolute;left:8px;top:8px;color:var(--muted-fg)"')}</div><button class="btn btn-primary btn-sm" onclick="showPersonForm()">+</button></div><div id="kr-list" style="flex:1;overflow-y:auto">`;

    personer.forEach(p => {
      const pSig = sigtelser.filter(s => s.personId === p.id);
      html += `<div class="list-item" onclick="selectPerson('${p.id}')"><div class="dot ${statusDots[p.status] || 'dot-success'}"></div><div class="list-item-content"><div class="list-item-title">${p.fornavn} ${p.efternavn}</div><div class="list-item-sub mono">${p.cpr}</div></div>${pSig.length > 0 ? `<span style="font-size:9px;color:var(--muted-fg)">${pSig.length}</span>` : ""}</div>`;
    });
    if (personer.length === 0) html += '<p style="text-align:center;padding:32px;font-size:12px;color:var(--muted-fg)">Ingen personer</p>';
    html += `</div></div><div class="split-right" id="kr-detail"><div class="loading-center" style="min-height:200px"><p>Vælg en person fra listen</p></div></div></div>`;
    container.innerHTML = html;

    // Search filter
    document.getElementById("kr-search").addEventListener("input", (e) => {
      const q = e.target.value.toLowerCase();
      document.querySelectorAll("#kr-list .list-item").forEach((item, i) => {
        const p = personer[i];
        const match = `${p.fornavn} ${p.efternavn} ${p.cpr}`.toLowerCase().includes(q);
        item.style.display = match ? "" : "none";
      });
    });

    // Store for detail view
    window._krPersoner = personer;
    window._krSigtelser = sigtelser;
  } catch (err) { container.innerHTML = `<p style="color:var(--destructive)">Fejl: ${err.message}</p>`; }
}

window.selectPerson = function(id) {
  const p = window._krPersoner.find(pp => pp.id === id);
  if (!p) return;
  const sigtelser = (window._krSigtelser || []).filter(s => s.personId === id);
  const statusLabels = { aktiv: "Aktiv", eftersøgt: "Eftersøgt", anholdt: "Anholdt", sigtet: "Sigtet" };
  const statusColors = { aktiv: "badge-success", eftersøgt: "badge-warning", anholdt: "badge-destructive", sigtet: "badge-primary" };

  const detail = document.getElementById("kr-detail");
  let html = `<div class="flex items-center justify-between mb-3"><div class="flex items-center gap-3"><div class="list-item-avatar" style="width:48px;height:48px;border-radius:12px;background:rgba(59,130,246,.1);color:var(--primary);font-size:16px">${p.fornavn[0]}${p.efternavn[0]}</div><div><h2 style="font-size:18px;font-weight:600">${p.fornavn} ${p.efternavn}</h2><span class="mono" style="font-size:12px;color:var(--muted-fg)">${p.cpr}</span></div></div><span class="badge ${statusColors[p.status]}">${statusLabels[p.status]}</span></div>`;

  if (p.status === "eftersøgt") {
    html += `<div class="alert-banner alert-warning mb-3">${icons.alert} Denne person er aktivt eftersøgt</div>`;
  }

  html += `<div class="grid grid-3 mb-3"><div class="card card-sm"><div class="info-label" style="font-size:10px;color:var(--muted-fg)">Adresse</div><div style="font-size:13px">${p.adresse || "—"}</div><div style="font-size:11px;color:var(--muted-fg)">${p.postnr || ""} ${p.by || ""}</div></div><div class="card card-sm"><div class="info-label" style="font-size:10px;color:var(--muted-fg)">Telefon</div><div style="font-size:13px">${p.telefon || "—"}</div></div><div class="card card-sm"><div class="info-label" style="font-size:10px;color:var(--muted-fg)">Sigtelser</div><div style="font-size:18px;font-weight:700" class="mono">${sigtelser.length}</div></div></div>`;

  if (sigtelser.length > 0) {
    html += `<div class="card mb-3"><h3 style="font-size:14px;font-weight:600;margin-bottom:12px">Sigtelser</h3>`;
    sigtelser.forEach(s => {
      html += `<div style="padding:8px 12px;border:1px solid var(--border);border-radius:8px;margin-bottom:6px"><div class="flex items-center justify-between"><span style="font-size:12px">${s.personNavn} — ${s.dato}</span><span class="badge badge-warning mono">${formatDaDK(s.totalBoede)} kr</span></div>`;
      s.sigtelseBoeder.forEach(b => { html += `<div style="font-size:11px;color:var(--muted-fg);margin-top:4px">${b.paragraf} — ${b.beskrivelse}</div>`; });
      html += `</div>`;
    });
    html += `</div>`;
  }

  if (p.noter) { html += `<div class="card"><div class="label">Noter</div><p style="font-size:13px;white-space:pre-wrap">${p.noter}</p></div>`; }
  detail.innerHTML = html;
};

window.showPersonForm = function() {
  const overlay = el("div", { className: "dialog-overlay", onclick: (e) => { if (e.target === overlay) overlay.remove(); } });
  overlay.innerHTML = `<div class="dialog"><div class="dialog-title">Opret person</div><div class="grid grid-2 gap-2 mb-2"><div><div class="label">Fornavn</div><input class="input" id="np-fornavn"></div><div><div class="label">Efternavn</div><input class="input" id="np-efternavn"></div></div><div class="label">CPR</div><input class="input mb-2" id="np-cpr" placeholder="DDMMÅÅ-XXXX"><div class="label">Adresse</div><input class="input mb-2" id="np-adresse"><div class="grid grid-2 gap-2 mb-2"><div><div class="label">Postnr</div><input class="input" id="np-postnr"></div><div><div class="label">By</div><input class="input" id="np-by"></div></div><div class="label">Telefon</div><input class="input mb-2" id="np-telefon"><div class="label">Noter</div><textarea class="textarea mb-2" id="np-noter" rows="2"></textarea><div class="flex gap-2"><button class="btn btn-primary" id="np-submit">Opret</button><button class="btn btn-outline" onclick="this.closest('.dialog-overlay').remove()">Annuller</button></div></div>`;
  document.body.appendChild(overlay);
  document.getElementById("np-submit").addEventListener("click", async () => {
    const person = { id: Date.now().toString(), cpr: document.getElementById("np-cpr").value, fornavn: document.getElementById("np-fornavn").value, efternavn: document.getElementById("np-efternavn").value, adresse: document.getElementById("np-adresse").value, postnr: document.getElementById("np-postnr").value, by: document.getElementById("np-by").value, telefon: document.getElementById("np-telefon").value, status: "aktiv", noter: document.getElementById("np-noter").value, oprettet: new Date().toISOString().split("T")[0] };
    try { await personerApi.create(person); showToast("Person oprettet"); overlay.remove(); renderPage(activeTabId); } catch (e) { showToast("Fejl: " + e.message); }
  });
};

// ═══════════════════════════════════════════
// ── KØRETØJSREGISTER ──
// ═══════════════════════════════════════════
async function renderKoeretoejsregister(container) {
  container.innerHTML = '<div class="loading-center"><div class="spinner"></div><span>Indlæser køretøjer...</span></div>';
  try {
    const koeretoejer = await koeretoejerApi.getAll();
    const statusLabels = { aktiv: "Aktiv", eftersøgt: "Eftersøgt", i_brug: "I brug", vedligehold: "Vedligehold", ude_af_drift: "Ude af drift" };
    const statusColors = { aktiv: "badge-success", eftersøgt: "badge-destructive", i_brug: "badge-primary", vedligehold: "badge-warning", ude_af_drift: "badge-muted" };

    let html = `<div class="flex items-center justify-between mb-3"><div style="position:relative;max-width:400px;flex:1"><input class="input" id="kt-search" placeholder="Søg nummerplade, mærke, model..." style="padding-left:32px">${icons.search.replace('width="14"','width="14" style="position:absolute;left:8px;top:8px;color:var(--muted-fg)"')}</div><button class="btn btn-primary" onclick="showKoeretoejForm()">${icons.plus} Registrer køretøj</button></div>`;
    html += `<div class="flex gap-3 mb-3"><div class="stat-card card-sm"><div class="stat-label">Total</div><div class="stat-value mono" style="font-size:18px">${koeretoejer.length}</div></div><div class="stat-card card-sm"><div class="stat-label">Eftersøgte</div><div class="stat-value mono" style="font-size:18px;color:var(--destructive)">${koeretoejer.filter(k => k.status === "eftersøgt").length}</div></div></div>`;

    html += `<div class="card" style="padding:0;overflow:hidden"><div class="table-header" style="grid-template-columns:1fr 1.5fr 1fr 0.7fr 0.8fr"><span>Nummerplade</span><span>Mærke / Model</span><span>Farve</span><span>Årgang</span><span>Status</span></div>`;
    koeretoejer.forEach(k => {
      html += `<div class="table-row" style="grid-template-columns:1fr 1.5fr 1fr 0.7fr 0.8fr"><span class="mono" style="font-weight:600">${k.nummerplade}</span><span>${k.maerke} ${k.model}</span><span style="color:var(--muted-fg)">${k.farve}</span><span style="color:var(--muted-fg)">${k.aargang}</span><span class="badge ${statusColors[k.status] || 'badge-muted'}">${statusLabels[k.status] || k.status}</span></div>`;
    });
    if (koeretoejer.length === 0) html += '<div class="loading-center" style="min-height:100px"><p>Ingen køretøjer</p></div>';
    html += '</div>';
    container.innerHTML = html;

    document.getElementById("kt-search").addEventListener("input", (e) => {
      const q = e.target.value.toLowerCase();
      document.querySelectorAll(".table-row").forEach((row, i) => {
        const k = koeretoejer[i];
        row.style.display = `${k.nummerplade} ${k.maerke} ${k.model} ${k.farve}`.toLowerCase().includes(q) ? "" : "none";
      });
    });
  } catch (err) { container.innerHTML = `<p style="color:var(--destructive)">Fejl: ${err.message}</p>`; }
}

window.showKoeretoejForm = function() {
  const overlay = el("div", { className: "dialog-overlay", onclick: (e) => { if (e.target === overlay) overlay.remove(); } });
  overlay.innerHTML = `<div class="dialog"><div class="dialog-title">Registrer køretøj</div><div class="grid grid-2 gap-2 mb-2"><div><div class="label">Nummerplade *</div><input class="input" id="nk-plade"></div><div><div class="label">Mærke *</div><input class="input" id="nk-maerke"></div></div><div class="grid grid-2 gap-2 mb-2"><div><div class="label">Model *</div><input class="input" id="nk-model"></div><div><div class="label">Årgang</div><input class="input" id="nk-aargang"></div></div><div class="grid grid-2 gap-2 mb-2"><div><div class="label">Farve</div><input class="input" id="nk-farve"></div><div><div class="label">Status</div><select class="select w-full" id="nk-status"><option value="aktiv">Aktiv</option><option value="eftersøgt">Eftersøgt</option></select></div></div><div class="label">Ejer</div><input class="input mb-2" id="nk-ejer" placeholder="Navn eller CPR"><div class="flex gap-2"><button class="btn btn-primary" id="nk-submit">Registrer</button><button class="btn btn-outline" onclick="this.closest('.dialog-overlay').remove()">Annuller</button></div></div>`;
  document.body.appendChild(overlay);
  document.getElementById("nk-submit").addEventListener("click", async () => {
    const k = { id: Date.now().toString(), nummerplade: document.getElementById("nk-plade").value.toUpperCase(), maerke: document.getElementById("nk-maerke").value, model: document.getElementById("nk-model").value, aargang: document.getElementById("nk-aargang").value, farve: document.getElementById("nk-farve").value, status: document.getElementById("nk-status").value, tildelt: document.getElementById("nk-ejer").value, sidstService: "", km: 0 };
    if (!k.nummerplade || !k.maerke || !k.model) { showToast("Udfyld påkrævede felter"); return; }
    try { await koeretoejerApi.create(k); showToast("Køretøj registreret"); overlay.remove(); renderPage(activeTabId); } catch (e) { showToast("Fejl: " + e.message); }
  });
};

// ═══════════════════════════════════════════
// ── EJENDOMSREGISTER ──
// ═══════════════════════════════════════════
async function renderEjendomsregister(container) {
  container.innerHTML = '<div class="loading-center"><div class="spinner"></div><span>Indlæser ejendomme...</span></div>';
  try {
    const ejendomme = await ejendommeApi.getAll();
    let html = `<div class="flex items-center gap-2 mb-3"><div style="position:relative;flex:1;max-width:400px"><input class="input" id="ej-search" placeholder="Søg adresse, ejer..." style="padding-left:32px">${icons.search.replace('width="14"','width="14" style="position:absolute;left:8px;top:8px;color:var(--muted-fg)"')}</div><button class="btn btn-primary btn-sm" onclick="showEjendomForm()">${icons.plus} Opret</button></div>`;
    html += `<div id="ej-list">`;
    ejendomme.forEach(e => {
      html += `<div class="card card-sm mb-2" style="cursor:pointer"><div class="flex items-center gap-3"><div class="list-item-avatar" style="background:var(--muted);color:var(--muted-fg)">${icons.building}</div><div class="flex-1"><div style="font-size:13px;font-weight:500">${e.adresse}</div><div style="font-size:11px;color:var(--muted-fg)">${e.postnr} ${e.by} · ${e.ejer}</div></div><span class="badge badge-muted">${e.type}</span></div></div>`;
    });
    if (ejendomme.length === 0) html += '<div class="loading-center" style="min-height:200px"><p>Ingen ejendomme registreret</p></div>';
    html += '</div>';
    container.innerHTML = html;
  } catch (err) { container.innerHTML = `<p style="color:var(--destructive)">Fejl: ${err.message}</p>`; }
}

window.showEjendomForm = function() {
  const overlay = el("div", { className: "dialog-overlay", onclick: (e) => { if (e.target === overlay) overlay.remove(); } });
  overlay.innerHTML = `<div class="dialog"><div class="dialog-title">Opret ejendom</div><div class="label">Adresse</div><input class="input mb-2" id="ne-adresse"><div class="grid grid-2 gap-2 mb-2"><div><div class="label">Postnr</div><input class="input" id="ne-postnr"></div><div><div class="label">By</div><input class="input" id="ne-by"></div></div><div class="grid grid-2 gap-2 mb-2"><div><div class="label">Ejer</div><input class="input" id="ne-ejer"></div><div><div class="label">Ejer CPR</div><input class="input" id="ne-ejercpr"></div></div><div class="grid grid-2 gap-2 mb-2"><div><div class="label">Matrikelnr</div><input class="input" id="ne-matrikel"></div><div><div class="label">Type</div><select class="select w-full" id="ne-type"><option value="villa">Villa</option><option value="lejlighed">Lejlighed</option><option value="erhverv">Erhverv</option><option value="grund">Grund</option></select></div></div><div class="flex gap-2"><button class="btn btn-primary" id="ne-submit">Opret</button><button class="btn btn-outline" onclick="this.closest('.dialog-overlay').remove()">Annuller</button></div></div>`;
  document.body.appendChild(overlay);
  document.getElementById("ne-submit").addEventListener("click", async () => {
    const e = { id: Date.now().toString(), adresse: document.getElementById("ne-adresse").value, postnr: document.getElementById("ne-postnr").value, by: document.getElementById("ne-by").value, ejer: document.getElementById("ne-ejer").value, ejerCpr: document.getElementById("ne-ejercpr").value, type: document.getElementById("ne-type").value, vurdering: 0, matrikelnr: document.getElementById("ne-matrikel").value, noter: "", oprettet: new Date().toISOString().split("T")[0] };
    try { await ejendommeApi.create(e); showToast("Ejendom oprettet"); overlay.remove(); renderPage(activeTabId); } catch (er) { showToast("Fejl: " + er.message); }
  });
};

// ═══════════════════════════════════════════
// ── EFTERLYSNINGER ──
// ═══════════════════════════════════════════
async function renderEfterlysninger(container) {
  container.innerHTML = '<div class="loading-center"><div class="spinner"></div><span>Indlæser efterlysninger...</span></div>';
  try {
    const [personer, koeretoejer] = await Promise.all([personerApi.getAll(), koeretoejerApi.getAll()]);
    const efterlystePersoner = personer.filter(p => p.status === "eftersøgt");
    const efterlysteKt = koeretoejer.filter(k => k.status === "eftersøgt");

    let html = `<div class="flex gap-2 mb-3"><button class="btn ${true ? 'btn-primary' : 'btn-outline'}" id="eft-tab-personer">${icons.alert} Efterlyste Personer <span class="badge badge-warning" style="margin-left:4px">${efterlystePersoner.length}</span></button><button class="btn btn-outline" id="eft-tab-kt">${icons.car} Efterlyste Køretøjer <span class="badge badge-warning" style="margin-left:4px">${efterlysteKt.length}</span></button></div>`;
    html += '<div id="eft-content">';

    // Persons
    html += '<div id="eft-personer">';
    efterlystePersoner.forEach(p => {
      html += `<div class="card card-sm mb-2" style="border-left:3px solid var(--warning)"><div class="flex items-center gap-3"><div class="list-item-avatar" style="background:rgba(224,100,42,.2);color:var(--warning)">${icons.alert}</div><div class="flex-1"><div style="font-size:13px;font-weight:500">${p.fornavn} ${p.efternavn}</div><div class="mono" style="font-size:11px;color:var(--muted-fg)">${p.cpr}</div></div><span class="badge badge-warning">Eftersøgt</span></div></div>`;
    });
    if (efterlystePersoner.length === 0) html += '<div class="loading-center" style="min-height:150px"><p>Ingen efterlyste personer</p></div>';
    html += '</div>';

    // Vehicles (hidden)
    html += '<div id="eft-koeretoejer" class="hidden">';
    efterlysteKt.forEach(k => {
      html += `<div class="card card-sm mb-2" style="border-left:3px solid var(--warning)"><div class="flex items-center gap-3"><div class="list-item-avatar" style="background:rgba(224,100,42,.2);color:var(--warning)">${icons.car}</div><div class="flex-1"><div style="font-size:13px;font-weight:500" class="mono">${k.nummerplade}</div><div style="font-size:11px;color:var(--muted-fg)">${k.maerke} ${k.model} — ${k.farve}</div></div><span class="badge badge-warning">Eftersøgt</span></div></div>`;
    });
    if (efterlysteKt.length === 0) html += '<div class="loading-center" style="min-height:150px"><p>Ingen efterlyste køretøjer</p></div>';
    html += '</div></div>';
    container.innerHTML = html;

    document.getElementById("eft-tab-personer").addEventListener("click", () => { document.getElementById("eft-personer").classList.remove("hidden"); document.getElementById("eft-koeretoejer").classList.add("hidden"); });
    document.getElementById("eft-tab-kt").addEventListener("click", () => { document.getElementById("eft-personer").classList.add("hidden"); document.getElementById("eft-koeretoejer").classList.remove("hidden"); });
  } catch (err) { container.innerHTML = `<p style="color:var(--destructive)">Fejl: ${err.message}</p>`; }
}

// ═══════════════════════════════════════════
// ── BØDETAKSTER ──
// ═══════════════════════════════════════════
function renderBodetakster(container) {
  const kategorier = {};
  standardBoeder.forEach(b => { if (!kategorier[b.kategori]) kategorier[b.kategori] = []; kategorier[b.kategori].push(b); });

  let html = `<div style="position:relative;margin-bottom:16px"><input class="input" id="boede-search" placeholder="Søg paragraf eller sigtelse..." style="padding-left:32px">${icons.search.replace('width="14"','width="14" style="position:absolute;left:8px;top:8px;color:var(--muted-fg)"')}</div><div id="boede-list">`;

  for (const [kat, boeder] of Object.entries(kategorier)) {
    html += `<div class="card mb-2" style="padding:0;overflow:hidden"><div class="accordion-header" onclick="this.nextElementSibling.classList.toggle('open')"><div class="flex items-center gap-2"><span style="font-size:14px;font-weight:600">${kat}</span><span class="badge badge-muted">${boeder.length}</span></div><span style="color:var(--muted-fg)">▼</span></div><div class="accordion-body">`;
    boeder.forEach(b => {
      html += `<div style="padding:12px 16px;border-top:1px solid rgba(42,47,58,.5)"><div class="flex items-center justify-between"><div class="flex-1"><span style="font-size:13px;font-weight:500">${b.paragraf ? `<span style="color:var(--muted-fg)">${b.paragraf}</span> — ` : ""}${b.beskrivelse}</span>${b.information ? `<p style="font-size:11px;color:var(--muted-fg);margin-top:2px">${b.information}</p>` : ""}</div><div class="flex items-center gap-2 shrink-0">${b.klip ? `<span class="badge badge-primary">${b.klip} klip</span>` : ""}${b.frakendelse ? `<span class="badge ${b.frakendelse === "Ubetinget" ? "badge-destructive" : "badge-warning"}">${b.frakendelse}</span>` : ""}${b.faengselMaaneder ? `<span class="badge badge-destructive">${b.faengselMaaneder} md.</span>` : ""}<span class="mono" style="font-weight:600;color:var(--warning);min-width:80px;text-align:right">${formatDaDK(b.beloeb)} kr</span></div></div></div>`;
    });
    html += '</div></div>';
  }
  html += '</div>';
  container.innerHTML = html;

  document.getElementById("boede-search").addEventListener("input", (e) => {
    const q = e.target.value.toLowerCase();
    document.querySelectorAll("#boede-list .accordion-body > div").forEach(row => {
      row.style.display = row.textContent.toLowerCase().includes(q) ? "" : "none";
    });
  });
}

// ═══════════════════════════════════════════
// ── SAGSARKIV ──
// ═══════════════════════════════════════════
async function renderSagsarkiv(container) {
  container.innerHTML = '<div class="loading-center"><div class="spinner"></div><span>Indlæser sager...</span></div>';
  try {
    const sager = await sagerApi.getAll();
    const statusLabels = { aaben: "Åben", under_efterforskning: "Under efterforskning", afventer_retten: "Afventer retten", lukket: "Lukket" };
    const statusColors = { aaben: "badge-success", under_efterforskning: "badge-primary", afventer_retten: "badge-warning", lukket: "badge-muted" };

    let html = `<div class="flex items-center justify-between mb-3"><h1 style="font-size:18px;font-weight:700">Sagsarkiv</h1><button class="btn btn-primary" onclick="openTab('opret_sag')">${icons.plus} Ny sag</button></div>`;
    sager.forEach(s => {
      html += `<div class="card card-sm mb-2" style="cursor:pointer" onclick="openTab('sag',{sagId:'${s.id}',label:'${(s.titel || s.sagsnummer).replace(/'/g, "\\'")}'})"><div class="flex items-center justify-between"><div><div style="font-size:13px;font-weight:600">${s.titel || "Unavngivet sag"}</div><div class="mono" style="font-size:10px;color:var(--muted-fg)">${s.sagsnummer} · ${s.oprettetAf} · ${new Date(s.oprettet).toLocaleDateString("da-DK")}</div></div><div class="flex items-center gap-2"><span class="badge ${statusColors[s.status] || 'badge-muted'}">${statusLabels[s.status] || s.status}</span><span style="font-size:11px;color:var(--muted-fg)">${s.mistaenkte.length} mistænkte</span></div></div></div>`;
    });
    if (sager.length === 0) html += '<div class="loading-center" style="min-height:200px"><p>Ingen sager oprettet</p></div>';
    container.innerHTML = html;
  } catch (err) { container.innerHTML = `<p style="color:var(--destructive)">Fejl: ${err.message}</p>`; }
}

// ═══════════════════════════════════════════
// ── SAG EDITOR ──
// ═══════════════════════════════════════════
async function renderSagEditor(container, data) {
  container.innerHTML = '<div class="loading-center"><div class="spinner"></div><span>Indlæser...</span></div>';
  try {
    const [personer, betjente, koeretoejer] = await Promise.all([personerApi.getAll(), betjenteApi.getAll(), koeretoejerApi.getAll()]);
    let sag, isExisting = false;
    if (data?.sagId) {
      const allSager = await sagerApi.getAll();
      sag = allSager.find(s => s.id === data.sagId);
      if (sag) isExisting = true;
    }
    if (!sag) {
      sag = { id: Date.now().toString(), sagsnummer: `SAG-${Date.now().toString().slice(-6)}`, titel: "", oprettet: new Date().toISOString(), opdateret: new Date().toISOString(), status: "aaben", oprettetAf: `${currentUser.fornavn} ${currentUser.efternavn}`, mistaenkte: [], involveretBetjente: [], involveretBorgere: [], koeretoejer: [], referencer: [], tags: [], beviser: [], rapport: { haendelsesforloeb: "", konfiskeredeGenstande: [], magtanvendelse: [] }, noter: [], aktivitetslog: [] };
    }
    window._currentSag = sag;
    window._sagExisting = isExisting;

    let html = `<div style="max-width:900px"><div class="flex items-center justify-between mb-3"><div class="flex items-center gap-3"><div class="list-item-avatar" style="width:40px;height:40px;border-radius:8px;background:rgba(59,130,246,.1);color:var(--primary)">${icons.file}</div><div><h1 style="font-size:18px;font-weight:700">${isExisting ? "Rediger Sag" : "Opret Sag"}</h1><p class="mono" style="font-size:11px;color:var(--muted-fg)">${sag.sagsnummer}</p></div></div><div class="flex gap-2"><select class="select" id="sag-status"><option value="aaben" ${sag.status==="aaben"?"selected":""}>Åben</option><option value="under_efterforskning" ${sag.status==="under_efterforskning"?"selected":""}>Under efterforskning</option><option value="afventer_retten" ${sag.status==="afventer_retten"?"selected":""}>Afventer retten</option><option value="lukket" ${sag.status==="lukket"?"selected":""}>Lukket</option></select><button class="btn btn-primary" onclick="saveSag()">${isExisting ? "Gem ændringer" : "Opret sag"}</button></div></div>`;

    html += `<div class="card mb-3"><div class="label">Sagstitel</div><input class="input mb-2" id="sag-titel" value="${sag.titel}" placeholder="Skriv en titel..."><div class="label">Hændelsesforløb</div><textarea class="textarea" id="sag-rapport" rows="5" placeholder="Beskriv hændelsesforløbet...">${sag.rapport.haendelsesforloeb}</textarea></div>`;

    // Mistænkte
    html += `<div class="card mb-3"><h3 style="font-size:14px;font-weight:600;margin-bottom:12px">${icons.alert} Mistænkte (${sag.mistaenkte.length})</h3><div id="sag-mistaenkte">`;
    sag.mistaenkte.forEach(m => {
      html += `<div class="card card-sm mb-2" style="border-left:2px solid var(--warning)"><div class="flex items-center justify-between"><div><span style="font-size:12px;font-weight:500">${m.personNavn}</span> <span class="mono" style="font-size:10px;color:var(--muted-fg)">${m.personCpr}</span></div><span style="font-size:10px;color:var(--muted-fg)">${m.sigtelser.length} sigtelser</span></div></div>`;
    });
    html += `</div><div style="margin-top:8px"><input class="input" id="sag-person-search" placeholder="Søg person at tilføje..."></div><div id="sag-person-results" style="max-height:150px;overflow-y:auto;margin-top:4px"></div></div>`;

    // Noter
    html += `<div class="card mb-3"><h3 style="font-size:14px;font-weight:600;margin-bottom:12px">Noter</h3>`;
    sag.noter.forEach(n => { html += `<div style="padding:8px;background:var(--muted);border-radius:8px;margin-bottom:6px;font-size:12px"><p>${n.tekst}</p><div style="font-size:10px;color:var(--muted-fg);margin-top:4px">${n.oprettetAf} — ${new Date(n.oprettetDato).toLocaleDateString("da-DK")}</div></div>`; });
    html += `<div class="flex gap-2 mt-2"><input class="input flex-1" id="sag-note-input" placeholder="Tilføj note..."><button class="btn btn-outline btn-sm" onclick="addSagNote()">Tilføj</button></div></div>`;

    html += '</div>';
    container.innerHTML = html;

    // Person search
    const searchInput = document.getElementById("sag-person-search");
    searchInput.addEventListener("input", () => {
      const q = searchInput.value.toLowerCase();
      const results = document.getElementById("sag-person-results");
      if (q.length < 2) { results.innerHTML = ""; return; }
      const matches = personer.filter(p => `${p.fornavn} ${p.efternavn} ${p.cpr}`.toLowerCase().includes(q)).slice(0, 10);
      results.innerHTML = matches.map(p => `<div class="list-item" style="padding:6px 8px;cursor:pointer" onclick="addMistaenkt('${p.id}')"><span style="font-size:12px">${p.fornavn} ${p.efternavn}</span> <span class="mono" style="font-size:10px;color:var(--muted-fg)">${p.cpr}</span></div>`).join("");
    });
    window._sagPersoner = personer;
  } catch (err) { container.innerHTML = `<p style="color:var(--destructive)">Fejl: ${err.message}</p>`; }
}

window.addMistaenkt = function(personId) {
  const p = window._sagPersoner.find(pp => pp.id === personId);
  if (!p) return;
  const sag = window._currentSag;
  if (sag.mistaenkte.find(m => m.personId === personId)) { showToast("Allerede tilføjet"); return; }
  sag.mistaenkte.push({ id: Date.now().toString(), personId: p.id, personNavn: `${p.fornavn} ${p.efternavn}`, personCpr: p.cpr, sigtelser: [], totalBoede: 0, totalFaengsel: 0, erkender: null, behandlet: false, tilkendegivelseAfgivet: false, fratagKoerekort: false });
  renderPage(activeTabId);
};

window.addSagNote = function() {
  const input = document.getElementById("sag-note-input");
  if (!input.value.trim()) return;
  window._currentSag.noter.push({ id: Date.now().toString(), tekst: input.value, oprettetAf: `${currentUser.fornavn} ${currentUser.efternavn}`, oprettetDato: new Date().toISOString() });
  input.value = "";
  renderPage(activeTabId);
};

window.saveSag = async function() {
  const sag = window._currentSag;
  sag.titel = document.getElementById("sag-titel").value;
  sag.status = document.getElementById("sag-status").value;
  sag.rapport.haendelsesforloeb = document.getElementById("sag-rapport").value;
  sag.opdateret = new Date().toISOString();
  try {
    if (window._sagExisting) await sagerApi.update(sag.id, sag);
    else { await sagerApi.create(sag); window._sagExisting = true; }
    showToast(window._sagExisting ? "Sag opdateret" : "Sag oprettet");
    // Update tab label
    const tab = openTabs.find(t => t.id === activeTabId);
    if (tab) tab.label = sag.titel || sag.sagsnummer;
    renderTabs();
  } catch (e) { showToast("Fejl: " + e.message); }
};

// ═══════════════════════════════════════════
// ── FLÅDESTYRING (simplified) ──
// ═══════════════════════════════════════════
async function renderFlaade(container) {
  container.innerHTML = '<div class="loading-center"><div class="spinner"></div><span>Indlæser patruljer...</span></div>';
  try {
    const patrols = await patruljerApi.getAll().catch(() => []);
    let html = `<div class="flex items-center justify-between mb-3"><h2 style="font-size:16px;font-weight:600">Patrulje Skema</h2><div class="flex gap-2"><span class="badge badge-primary">Bemandede: ${patrols.filter(p => p.medlemmer.length > 0).length}</span><span class="badge badge-success">Ledige: ${patrols.filter(p => p.status === "ledig").length}</span></div></div>`;
    const statusColors = { ledig: "badge-success", i_brug: "badge-primary", optaget: "badge-warning", ude_af_drift: "badge-destructive" };
    const statusLabels = { ledig: "Ledig", i_brug: "I brug", optaget: "Optaget", ude_af_drift: "Ude af drift" };
    patrols.forEach(p => {
      html += `<div class="card card-sm mb-2"><div class="flex items-center justify-between"><div><span style="font-size:13px;font-weight:600">${p.navn}</span> <span class="badge ${statusColors[p.status]}">${statusLabels[p.status]}</span></div><span style="font-size:11px;color:var(--muted-fg)">${p.medlemmer.length}/${p.pladser} pladser</span></div>`;
      if (p.medlemmer.length > 0) { html += `<div style="margin-top:6px;font-size:11px;color:var(--muted-fg)">`; p.medlemmer.forEach(m => { html += `<span style="margin-right:12px">🛡️ ${m.navn} (${m.badgeNr})</span>`; }); html += '</div>'; }
      html += '</div>';
    });
    if (patrols.length === 0) html += '<div class="loading-center" style="min-height:200px"><p>Ingen patruljer oprettet</p></div>';
    container.innerHTML = html;
  } catch (err) { container.innerHTML = `<p style="color:var(--destructive)">Fejl: ${err.message}</p>`; }
}

// ═══════════════════════════════════════════
// ── ANSATTE ──
// ═══════════════════════════════════════════
async function renderAnsatte(container) {
  container.innerHTML = '<div class="loading-center"><div class="spinner"></div><span>Indlæser ansatte...</span></div>';
  try {
    const ansatte = await betjenteApi.getAll();
    const grouped = rangOrder.map(rang => ({ rang, members: ansatte.filter(a => a.rang === rang) }));

    let html = `<div class="flex items-center justify-between mb-3"><h1 style="font-size:18px;font-weight:700">Ansatte</h1><button class="btn btn-primary btn-sm" onclick="showAnsatForm()">+ Opret betjent</button></div>`;
    grouped.forEach(g => {
      html += `<div class="card mb-2" style="padding:0;overflow:hidden"><div class="accordion-header"><span style="font-size:14px;font-weight:600">${g.rang}</span><span style="font-size:11px;color:var(--muted-fg)">${g.members.length}</span></div>`;
      g.members.forEach(b => {
        html += `<div class="list-item" style="padding-left:16px"><span style="font-size:12px">${b.badgeNr} — ${b.fornavn} ${b.efternavn}</span></div>`;
      });
      if (g.members.length === 0) html += '<div style="padding:8px 16px;font-size:12px;color:var(--muted-fg);font-style:italic">Ingen ansatte</div>';
      html += '</div>';
    });
    container.innerHTML = html;
  } catch (err) { container.innerHTML = `<p style="color:var(--destructive)">Fejl: ${err.message}</p>`; }
}

window.showAnsatForm = function() {
  const overlay = el("div", { className: "dialog-overlay", onclick: (e) => { if (e.target === overlay) overlay.remove(); } });
  let rangoptions = rangOrder.map(r => `<option value="${r}">${r}</option>`).join("");
  overlay.innerHTML = `<div class="dialog"><div class="dialog-title">Opret ny betjent</div><div class="grid grid-2 gap-2 mb-2"><div><div class="label">Badge nummer</div><input class="input" id="na-badge"></div><div><div class="label">Stilling</div><select class="select w-full" id="na-rang">${rangoptions}</select></div></div><div class="grid grid-2 gap-2 mb-2"><div><div class="label">Fornavn</div><input class="input" id="na-fornavn"></div><div><div class="label">Efternavn</div><input class="input" id="na-efternavn"></div></div><p style="font-size:11px;color:var(--muted-fg);margin-bottom:12px">Standardkodeord: 1234</p><div class="flex gap-2"><button class="btn btn-primary" id="na-submit">Opret</button><button class="btn btn-outline" onclick="this.closest('.dialog-overlay').remove()">Annuller</button></div></div>`;
  document.body.appendChild(overlay);
  document.getElementById("na-submit").addEventListener("click", async () => {
    const b = { id: String(Date.now()), badgeNr: document.getElementById("na-badge").value, fornavn: document.getElementById("na-fornavn").value, efternavn: document.getElementById("na-efternavn").value, rang: document.getElementById("na-rang").value, uddannelser: [], tilladelser: [], kodeord: "1234", foersteLogin: true };
    if (!b.badgeNr || !b.fornavn || !b.efternavn) { showToast("Udfyld alle felter"); return; }
    try { await betjenteApi.create(b); showToast("Betjent oprettet"); overlay.remove(); renderPage(activeTabId); } catch (e) { showToast("Fejl: " + e.message); }
  });
};

// ═══════════════════════════════════════════
// ── PROFIL ──
// ═══════════════════════════════════════════
function renderProfil(container) {
  const u = currentUser;
  container.innerHTML = `<div style="max-width:600px"><div class="card mb-3"><div class="flex items-center gap-4"><div class="list-item-avatar" style="width:64px;height:64px;border-radius:16px;background:rgba(59,130,246,.1);color:var(--primary);font-size:24px">${u.profilBillede ? `<img src="${u.profilBillede}" style="width:100%;height:100%;object-fit:cover;border-radius:16px">` : `${u.fornavn[0]}${u.efternavn[0]}`}</div><div><h2 style="font-size:20px;font-weight:700">${u.fornavn} ${u.efternavn}</h2><p class="mono" style="font-size:12px;color:var(--muted-fg)">Badge: ${u.badgeNr} · ${isAdmin ? "Administrator" : u.rang}</p></div></div></div><div class="card mb-3"><h3 style="font-size:14px;font-weight:600;margin-bottom:12px">Uddannelser</h3>${u.uddannelser.length > 0 ? u.uddannelser.map(udd => `<div style="font-size:12px;color:var(--fg);margin-bottom:4px">— ${udd}</div>`).join("") : '<p style="font-size:12px;color:var(--muted-fg);font-style:italic">Ingen uddannelser</p>'}</div><div class="card"><h3 style="font-size:14px;font-weight:600;margin-bottom:12px">Skift kodeord</h3><div class="label">Nuværende kodeord</div><input class="input mb-2" type="password" id="prof-old"><div class="label">Nyt kodeord</div><input class="input mb-2" type="password" id="prof-new"><div class="label">Bekræft nyt kodeord</div><input class="input mb-2" type="password" id="prof-confirm"><div id="prof-error" style="color:var(--destructive);font-size:11px;margin-bottom:8px"></div><button class="btn btn-primary" onclick="changePassword()">Skift kodeord</button></div></div>`;
}

window.changePassword = async function() {
  const oldP = document.getElementById("prof-old").value;
  const newP = document.getElementById("prof-new").value;
  const confP = document.getElementById("prof-confirm").value;
  const errDiv = document.getElementById("prof-error");
  if (oldP !== currentUser.kodeord) { errDiv.textContent = "Forkert nuværende kodeord"; return; }
  if (newP.length < 4) { errDiv.textContent = "Min. 4 tegn"; return; }
  if (newP !== confP) { errDiv.textContent = "Kodeord matcher ikke"; return; }
  try {
    await betjenteApi.update(currentUser.id, { kodeord: newP });
    currentUser.kodeord = newP;
    showToast("Kodeord ændret");
    errDiv.textContent = "";
  } catch (e) { errDiv.textContent = "Fejl: " + e.message; }
};

// ═══════════════════════════════════════════
// ── AKTIV PATRULJE / KORT ──
// ═══════════════════════════════════════════
async function renderKort(container) {
  container.innerHTML = '<div class="loading-center"><div class="spinner"></div><span>Indlæser patruljer...</span></div>';
  try {
    const [patruljer, betjente] = await Promise.all([patruljerApi.getAll().catch(() => []), betjenteApi.getAll()]);
    const statusColors = { ledig: "dot-success", i_brug: "dot-primary", optaget: "dot-warning", ude_af_drift: "dot-destructive" };
    const statusLabels = { ledig: "Ledig", i_brug: "I brug", optaget: "Optaget", ude_af_drift: "Ude af drift" };

    let html = `<div class="flex items-center justify-between mb-3"><div class="flex items-center gap-3">${icons.radio}<h1 style="font-size:18px;font-weight:700">Aktive Patruljer</h1></div><div class="flex gap-2"><button class="btn btn-primary btn-sm" onclick="showPatruljeForm()">${icons.plus} Opret patrulje</button></div></div>`;

    // Stats
    html += `<div class="grid grid-4 mb-3"><div class="stat-card"><div class="accent-bar" style="background:var(--primary)"></div><div class="stat-value mono">${patruljer.length}</div><div class="stat-label">Total patruljer</div></div><div class="stat-card"><div class="accent-bar" style="background:var(--success)"></div><div class="stat-value mono" style="color:var(--success)">${patruljer.filter(p => p.status === "ledig").length}</div><div class="stat-label">Ledige</div></div><div class="stat-card"><div class="accent-bar" style="background:var(--primary)"></div><div class="stat-value mono" style="color:var(--primary)">${patruljer.filter(p => p.status === "i_brug").length}</div><div class="stat-label">I brug</div></div><div class="stat-card"><div class="accent-bar" style="background:var(--warning)"></div><div class="stat-value mono" style="color:var(--warning)">${patruljer.filter(p => p.status === "optaget").length}</div><div class="stat-label">Optaget</div></div></div>`;

    // Patrol list
    patruljer.forEach(p => {
      html += `<div class="card card-sm mb-2"><div class="flex items-center justify-between"><div class="flex items-center gap-3"><div class="dot ${statusColors[p.status] || 'dot-success'}"></div><span style="font-size:14px;font-weight:600">${p.navn}</span><span class="badge badge-muted">${p.kategori || "Standard"}</span></div><div class="flex items-center gap-3"><span style="font-size:11px;color:var(--muted-fg)">${p.medlemmer.length}/${p.pladser} pladser</span><select class="select" style="height:28px;font-size:10px" onchange="updatePatruljeStatus('${p.id}',this.value)"><option value="ledig" ${p.status==="ledig"?"selected":""}>Ledig</option><option value="i_brug" ${p.status==="i_brug"?"selected":""}>I brug</option><option value="optaget" ${p.status==="optaget"?"selected":""}>Optaget</option><option value="ude_af_drift" ${p.status==="ude_af_drift"?"selected":""}>Ude af drift</option></select><button class="btn btn-ghost btn-sm" onclick="joinPatrulje('${p.id}')">Tilmeld mig</button><button class="btn btn-ghost btn-sm" style="color:var(--destructive)" onclick="leavePatrulje('${p.id}')">Forlad</button></div></div>`;
      if (p.medlemmer.length > 0) {
        html += '<div style="margin-top:8px;display:flex;flex-wrap:wrap;gap:6px">';
        p.medlemmer.forEach(m => { html += `<span class="badge badge-primary">🛡️ ${m.navn} (${m.badgeNr})</span>`; });
        html += '</div>';
      }
      if (p.bemaerkning) html += `<div style="margin-top:6px;font-size:11px;color:var(--muted-fg);font-style:italic">📝 ${p.bemaerkning}</div>`;
      html += '</div>';
    });
    if (patruljer.length === 0) html += '<div class="loading-center" style="min-height:200px"><p>Ingen patruljer oprettet</p></div>';
    container.innerHTML = html;
    window._kortPatruljer = patruljer;
  } catch (err) { container.innerHTML = `<p style="color:var(--destructive)">Fejl: ${err.message}</p>`; }
}

window.showPatruljeForm = function() {
  const overlay = el("div", { className: "dialog-overlay", onclick: (e) => { if (e.target === overlay) overlay.remove(); } });
  overlay.innerHTML = `<div class="dialog"><div class="dialog-title">Opret patrulje</div><div class="label">Navn</div><input class="input mb-2" id="np2-navn" placeholder="F.eks. Patrulje Alpha"><div class="grid grid-2 gap-2 mb-2"><div><div class="label">Kategori</div><select class="select w-full" id="np2-kat"><option value="bil">Bil</option><option value="mc">MC</option><option value="fod">Fod</option><option value="civil">Civil</option></select></div><div><div class="label">Antal pladser</div><input class="input" id="np2-pladser" type="number" value="4" min="1"></div></div><div class="label">Bemærkning</div><textarea class="textarea mb-2" id="np2-bem" rows="2"></textarea><div class="flex gap-2"><button class="btn btn-primary" id="np2-submit">Opret</button><button class="btn btn-outline" onclick="this.closest('.dialog-overlay').remove()">Annuller</button></div></div>`;
  document.body.appendChild(overlay);
  document.getElementById("np2-submit").addEventListener("click", async () => {
    const p = { id: Date.now().toString(), navn: document.getElementById("np2-navn").value, kategori: document.getElementById("np2-kat").value, pladser: parseInt(document.getElementById("np2-pladser").value) || 4, medlemmer: [], status: "ledig", bemaerkning: document.getElementById("np2-bem").value };
    if (!p.navn) { showToast("Udfyld navn"); return; }
    try { await patruljerApi.create(p); showToast("Patrulje oprettet"); overlay.remove(); renderPage(activeTabId); } catch (e) { showToast("Fejl: " + e.message); }
  });
};

window.joinPatrulje = async function(patruljeId) {
  try {
    const patruljer = window._kortPatruljer || await patruljerApi.getAll();
    const p = patruljer.find(pp => pp.id === patruljeId);
    if (!p) return;
    if (p.medlemmer.find(m => m.badgeNr === currentUser.badgeNr)) { showToast("Du er allerede tilmeldt"); return; }
    if (p.medlemmer.length >= p.pladser) { showToast("Patruljen er fuld"); return; }
    p.medlemmer.push({ badgeNr: currentUser.badgeNr, navn: `${currentUser.fornavn} ${currentUser.efternavn}` });
    await patruljerApi.update(patruljeId, p);
    showToast("Tilmeldt patrulje");
    renderPage(activeTabId);
  } catch (e) { showToast("Fejl: " + e.message); }
};

window.leavePatrulje = async function(patruljeId) {
  try {
    const patruljer = window._kortPatruljer || await patruljerApi.getAll();
    const p = patruljer.find(pp => pp.id === patruljeId);
    if (!p) return;
    p.medlemmer = p.medlemmer.filter(m => m.badgeNr !== currentUser.badgeNr);
    await patruljerApi.update(patruljeId, p);
    showToast("Forladt patrulje");
    renderPage(activeTabId);
  } catch (e) { showToast("Fejl: " + e.message); }
};

window.updatePatruljeStatus = async function(patruljeId, status) {
  try {
    const patruljer = window._kortPatruljer || await patruljerApi.getAll();
    const p = patruljer.find(pp => pp.id === patruljeId);
    if (!p) return;
    p.status = status;
    await patruljerApi.update(patruljeId, p);
    showToast("Status opdateret");
  } catch (e) { showToast("Fejl: " + e.message); }
};

// ═══════════════════════════════════════════
// ── ANSØGNINGER ──
// ═══════════════════════════════════════════
async function renderAnsoegninger(container) {
  container.innerHTML = '<div class="loading-center"><div class="spinner"></div><span>Indlæser ansøgninger...</span></div>';
  try {
    const [ansoegninger, betjente] = await Promise.all([ansoeningerApi.getAll(), betjenteApi.getAll()]);
    const canManage = isAdmin;

    let html = `<div class="flex items-center justify-between mb-3"><div class="flex items-center gap-3">${icons.file}<h1 style="font-size:18px;font-weight:700">Ansøgninger</h1><span style="font-size:12px;color:var(--muted-fg)">${ansoegninger.length} ansøgninger</span></div><button class="btn btn-primary btn-sm" onclick="showAnsoegningForm()">${icons.plus} Indsend ansøgning</button></div>`;

    // Filter tabs
    html += `<div class="flex gap-2 mb-3"><button class="btn btn-primary btn-sm" onclick="filterAnsoegninger('alle')">Alle</button><button class="btn btn-outline btn-sm" onclick="filterAnsoegninger('afventer')">Afventer</button><button class="btn btn-outline btn-sm" onclick="filterAnsoegninger('godkendt')">Godkendt</button><button class="btn btn-outline btn-sm" onclick="filterAnsoegninger('afvist')">Afvist</button></div>`;

    html += '<div id="ansoeg-list">';
    const statusColors = { afventer: "badge-warning", godkendt: "badge-success", afvist: "badge-destructive" };
    const statusLabels = { afventer: "Afventer", godkendt: "Godkendt", afvist: "Afvist" };

    ansoegninger.forEach(a => {
      html += `<div class="card card-sm mb-2 ansoeg-item" data-status="${a.status || 'afventer'}"><div class="flex items-center justify-between"><div class="flex-1"><div class="flex items-center gap-2"><span style="font-size:13px;font-weight:600">${a.titel || a.type || "Ansøgning"}</span><span class="badge ${statusColors[a.status] || 'badge-warning'}">${statusLabels[a.status] || 'Afventer'}</span></div><div style="font-size:11px;color:var(--muted-fg);margin-top:4px">${a.ansoegerNavn || "Ukendt"} · ${a.oprettetDato || "—"}</div>${a.begrundelse ? `<p style="font-size:12px;color:var(--fg);margin-top:6px;white-space:pre-line">${a.begrundelse}</p>` : ""}</div>`;
      if (canManage && (a.status === "afventer" || !a.status)) {
        html += `<div class="flex gap-2 shrink-0"><button class="btn btn-sm" style="background:var(--success);color:#fff" onclick="behandlAnsoegning('${a.id}','godkendt')">Godkend</button><button class="btn btn-sm btn-destructive" onclick="behandlAnsoegning('${a.id}','afvist')">Afvis</button></div>`;
      }
      html += '</div></div>';
    });
    if (ansoegninger.length === 0) html += '<div class="loading-center" style="min-height:200px"><p>Ingen ansøgninger</p></div>';
    html += '</div>';
    container.innerHTML = html;
    window._ansoegninger = ansoegninger;
  } catch (err) { container.innerHTML = `<p style="color:var(--destructive)">Fejl: ${err.message}</p>`; }
}

window.filterAnsoegninger = function(filter) {
  document.querySelectorAll(".ansoeg-item").forEach(item => {
    item.style.display = (filter === "alle" || item.dataset.status === filter) ? "" : "none";
  });
};

window.showAnsoegningForm = function() {
  const afdelingOptions = afdelinger.map(a => `<option value="${a.label}">${a.label}</option>`).join("");
  const overlay = el("div", { className: "dialog-overlay", onclick: (e) => { if (e.target === overlay) overlay.remove(); } });
  overlay.innerHTML = `<div class="dialog"><div class="dialog-title">Indsend ansøgning</div><div class="label">Type</div><select class="select w-full mb-2" id="ans-type"><option value="Afdelingsansøgning">Afdelingsansøgning</option><option value="Uddannelse">Uddannelse</option><option value="Forfremmelse">Forfremmelse</option><option value="Andet">Andet</option></select><div class="label">Afdeling / Emne</div><select class="select w-full mb-2" id="ans-afdeling"><option value="">Vælg...</option>${afdelingOptions}</select><div class="label">Begrundelse</div><textarea class="textarea mb-2" id="ans-begrundelse" rows="4" placeholder="Forklar din ansøgning..."></textarea><div class="flex gap-2"><button class="btn btn-primary" id="ans-submit">Indsend</button><button class="btn btn-outline" onclick="this.closest('.dialog-overlay').remove()">Annuller</button></div></div>`;
  document.body.appendChild(overlay);
  document.getElementById("ans-submit").addEventListener("click", async () => {
    const a = { id: Date.now().toString(), type: document.getElementById("ans-type").value, titel: document.getElementById("ans-type").value + (document.getElementById("ans-afdeling").value ? ": " + document.getElementById("ans-afdeling").value : ""), afdeling: document.getElementById("ans-afdeling").value, begrundelse: document.getElementById("ans-begrundelse").value, ansoegerNavn: `${currentUser.fornavn} ${currentUser.efternavn}`, ansoegerBadge: currentUser.badgeNr, oprettetDato: new Date().toISOString().split("T")[0], status: "afventer" };
    if (!a.begrundelse) { showToast("Udfyld begrundelse"); return; }
    try { await ansoeningerApi.create(a); showToast("Ansøgning indsendt"); overlay.remove(); renderPage(activeTabId); } catch (e) { showToast("Fejl: " + e.message); }
  });
};

window.behandlAnsoegning = async function(id, status) {
  try {
    await ansoeningerApi.update(id, { status, behandletAf: `${currentUser.fornavn} ${currentUser.efternavn}`, behandletDato: new Date().toISOString().split("T")[0] });
    showToast(status === "godkendt" ? "Ansøgning godkendt" : "Ansøgning afvist");
    renderPage(activeTabId);
  } catch (e) { showToast("Fejl: " + e.message); }
};

// ═══════════════════════════════════════════
// ── NSK — TILHØRSFORHOLD ──
// ═══════════════════════════════════════════
async function renderNSK(container) {
  container.innerHTML = '<div class="loading-center"><div class="spinner"></div><span>Indlæser tilhørsforhold...</span></div>';
  try {
    const [tilhoersforhold, personer] = await Promise.all([tilhoersforholdApi.getAll(), personerApi.getAll()]);

    let html = `<div class="flex items-center justify-between mb-3"><div class="flex items-center gap-3">${icons.target}<h1 style="font-size:18px;font-weight:700">NSK — Tilhørsforhold</h1><span style="font-size:12px;color:var(--muted-fg)">${tilhoersforhold.length} registreringer</span></div><button class="btn btn-primary btn-sm" onclick="showTilhoersforholdForm()">${icons.plus} Tilføj tilhørsforhold</button></div>`;

    // Group by bande
    const bander = {};
    tilhoersforhold.forEach(t => {
      if (!bander[t.bande]) bander[t.bande] = [];
      bander[t.bande].push(t);
    });

    for (const [bande, members] of Object.entries(bander)) {
      html += `<div class="card mb-2" style="padding:0;overflow:hidden;border-left:3px solid var(--destructive)"><div class="accordion-header" onclick="this.nextElementSibling.classList.toggle('open')"><div class="flex items-center gap-2"><span style="font-size:14px;font-weight:600">${bande}</span><span class="badge badge-destructive">${members.length} medlemmer</span></div><span style="color:var(--muted-fg)">▼</span></div><div class="accordion-body">`;
      members.forEach(m => {
        const person = personer.find(p => p.cpr === m.personCpr);
        html += `<div style="padding:10px 16px;border-top:1px solid rgba(42,47,58,.5)"><div class="flex items-center justify-between"><div><span style="font-size:13px;font-weight:500">${m.personNavn || (person ? person.fornavn + " " + person.efternavn : "Ukendt")}</span> <span class="mono" style="font-size:10px;color:var(--muted-fg)">${m.personCpr}</span></div><div class="flex items-center gap-2"><span class="badge badge-muted">${m.rolle || "Medlem"}</span><span class="badge ${m.status === "aktiv" ? "badge-success" : "badge-muted"}">${m.status || "aktiv"}</span>`;
        if (isAdmin) html += `<button class="btn btn-ghost btn-sm" style="color:var(--destructive)" onclick="deleteTilhoersforhold('${m.id}')">✕</button>`;
        html += `</div></div></div>`;
      });
      html += '</div></div>';
    }
    if (Object.keys(bander).length === 0) html += '<div class="loading-center" style="min-height:200px"><p>Ingen tilhørsforhold registreret</p></div>';

    // Also show generic afdeling content
    html += `<div class="card mt-3"><h3 style="font-size:14px;font-weight:600;margin-bottom:12px">Afdelingsopslag</h3><div id="nsk-afd-content"></div></div>`;

    container.innerHTML = html;
    window._nskPersoner = personer;

    // Load afdeling content
    try {
      const indhold = await afdelingsIndholdApi.getAll("nsk");
      const afdDiv = document.getElementById("nsk-afd-content");
      if (indhold.length === 0) { afdDiv.innerHTML = '<p style="font-size:12px;color:var(--muted-fg)">Ingen opslag</p>'; }
      else indhold.forEach(item => { afdDiv.innerHTML += `<div class="card card-sm mb-2"><span class="badge badge-muted">${item.type}</span> <span style="font-size:12px;font-weight:600">${item.titel}</span><p style="font-size:12px;color:var(--muted-fg);margin-top:4px;white-space:pre-wrap">${item.indhold}</p></div>`; });
    } catch {}
  } catch (err) { container.innerHTML = `<p style="color:var(--destructive)">Fejl: ${err.message}</p>`; }
}

window.showTilhoersforholdForm = function() {
  const overlay = el("div", { className: "dialog-overlay", onclick: (e) => { if (e.target === overlay) overlay.remove(); } });
  overlay.innerHTML = `<div class="dialog"><div class="dialog-title">Tilføj tilhørsforhold</div><div class="label">Søg person (CPR eller navn)</div><input class="input mb-2" id="th-search" placeholder="Søg..."><div id="th-person-results" style="max-height:120px;overflow-y:auto;margin-bottom:8px"></div><div id="th-selected" style="font-size:12px;color:var(--success);margin-bottom:8px"></div><div class="label">Gruppering / Bande</div><input class="input mb-2" id="th-bande" placeholder="Navn på gruppering..."><div class="grid grid-2 gap-2 mb-2"><div><div class="label">Rolle</div><select class="select w-full" id="th-rolle"><option value="Medlem">Medlem</option><option value="Leder">Leder</option><option value="Prospect">Prospect</option><option value="Associeret">Associeret</option></select></div><div><div class="label">Status</div><select class="select w-full" id="th-status"><option value="aktiv">Aktiv</option><option value="inaktiv">Inaktiv</option><option value="tidligere">Tidligere</option></select></div></div><div class="flex gap-2"><button class="btn btn-primary" id="th-submit">Tilføj</button><button class="btn btn-outline" onclick="this.closest('.dialog-overlay').remove()">Annuller</button></div></div>`;
  document.body.appendChild(overlay);

  let selectedPerson = null;
  document.getElementById("th-search").addEventListener("input", (e) => {
    const q = e.target.value.toLowerCase();
    const results = document.getElementById("th-person-results");
    if (q.length < 2) { results.innerHTML = ""; return; }
    const matches = (window._nskPersoner || []).filter(p => `${p.fornavn} ${p.efternavn} ${p.cpr}`.toLowerCase().includes(q)).slice(0, 8);
    results.innerHTML = matches.map(p => `<div class="list-item" style="padding:4px 8px;cursor:pointer" data-id="${p.id}" data-cpr="${p.cpr}" data-navn="${p.fornavn} ${p.efternavn}"><span style="font-size:12px">${p.fornavn} ${p.efternavn}</span> <span class="mono" style="font-size:10px;color:var(--muted-fg)">${p.cpr}</span></div>`).join("");
    results.querySelectorAll(".list-item").forEach(item => {
      item.addEventListener("click", () => {
        selectedPerson = { id: item.dataset.id, cpr: item.dataset.cpr, navn: item.dataset.navn };
        document.getElementById("th-selected").textContent = "Valgt: " + selectedPerson.navn + " (" + selectedPerson.cpr + ")";
        results.innerHTML = "";
        document.getElementById("th-search").value = selectedPerson.navn;
      });
    });
  });

  document.getElementById("th-submit").addEventListener("click", async () => {
    if (!selectedPerson) { showToast("Vælg en person"); return; }
    const bande = document.getElementById("th-bande").value;
    if (!bande) { showToast("Udfyld gruppering"); return; }
    const t = { id: Date.now().toString(), personId: selectedPerson.id, personCpr: selectedPerson.cpr, personNavn: selectedPerson.navn, bande, rolle: document.getElementById("th-rolle").value, status: document.getElementById("th-status").value, oprettetAf: `${currentUser.fornavn} ${currentUser.efternavn}`, oprettetDato: new Date().toISOString().split("T")[0] };
    try { await tilhoersforholdApi.create(t); showToast("Tilhørsforhold tilføjet"); overlay.remove(); renderPage(activeTabId); } catch (e) { showToast("Fejl: " + e.message); }
  });
};

window.deleteTilhoersforhold = async function(id) {
  if (!confirm("Slet dette tilhørsforhold?")) return;
  try { await tilhoersforholdApi.remove(id); showToast("Slettet"); renderPage(activeTabId); } catch (e) { showToast("Fejl: " + e.message); }
};

// ═══════════════════════════════════════════
// ── AFDELINGER (generisk) ──
// ═══════════════════════════════════════════
async function renderAfdeling(container, afdId) {
  const titler = { lima: "Lima — Aktionsstyrken", faerdsel: "Færdsel — Færdselsafdelingen", efterforskning: "Efterforskning", sig: "SIG — Særlig Indsatsgruppe", remeo: "Remeo" };
  container.innerHTML = `<div class="loading-center"><div class="spinner"></div><span>Indlæser...</span></div>`;

  try {
    const indhold = await afdelingsIndholdApi.getAll(afdId);
    const canManage = isAdmin;

    let html = `<div class="flex items-center justify-between mb-3"><div class="flex items-center gap-3">${icons.shield}<h1 style="font-size:18px;font-weight:700">${titler[afdId] || afdId}</h1><span style="font-size:12px;color:var(--muted-fg)">${indhold.length} opslag</span></div>`;
    if (canManage) html += `<button class="btn btn-primary btn-sm" onclick="showAfdelingsIndholdForm('${afdId}')">${icons.plus} Tilføj indhold</button>`;
    html += '</div>';

    indhold.forEach(item => {
      html += `<div class="card card-sm mb-2"><div class="flex items-center justify-between mb-1"><div class="flex items-center gap-2"><span class="badge badge-muted">${item.type || "info"}</span><span style="font-size:12px;font-weight:600">${item.titel}</span></div>`;
      if (canManage) html += `<button class="btn btn-ghost btn-sm" style="color:var(--destructive)" onclick="deleteAfdelingsIndhold('${item.id}')">✕</button>`;
      html += `</div><p style="font-size:12px;color:var(--muted-fg);white-space:pre-wrap">${item.indhold}</p><div style="font-size:9px;color:var(--muted-fg);margin-top:6px">${item.oprettetAf || "—"} — ${item.oprettetDato ? new Date(item.oprettetDato).toLocaleDateString("da-DK") : "—"}</div></div>`;
    });
    if (indhold.length === 0) html += '<div class="loading-center" style="min-height:200px"><p>Ingen indhold endnu</p></div>';
    container.innerHTML = html;
  } catch (err) { container.innerHTML = `<div class="card"><div class="flex items-center gap-3 mb-3">${icons.shield}<h1 style="font-size:18px;font-weight:700">${titler[afdId] || afdId}</h1></div><p style="font-size:12px;color:var(--muted-fg)">Kunne ikke indlæse indhold</p></div>`; }
}

window.showAfdelingsIndholdForm = function(afdId) {
  const overlay = el("div", { className: "dialog-overlay", onclick: (e) => { if (e.target === overlay) overlay.remove(); } });
  overlay.innerHTML = `<div class="dialog"><div class="dialog-title">Tilføj afdelingsindhold</div><div class="label">Titel</div><input class="input mb-2" id="ai-titel" placeholder="Overskrift..."><div class="label">Type</div><select class="select w-full mb-2" id="ai-type"><option value="info">Information</option><option value="taktisk">Taktisk plan</option><option value="vagtplan">Vagtplan</option><option value="udstyr">Udstyr</option><option value="nyhed">Nyhed</option></select><div class="label">Indhold</div><textarea class="textarea mb-2" id="ai-indhold" rows="4" placeholder="Skriv indhold..."></textarea><div class="flex gap-2"><button class="btn btn-primary" id="ai-submit">Tilføj</button><button class="btn btn-outline" onclick="this.closest('.dialog-overlay').remove()">Annuller</button></div></div>`;
  document.body.appendChild(overlay);
  document.getElementById("ai-submit").addEventListener("click", async () => {
    const item = { id: Date.now().toString(), afdelingId: afdId, titel: document.getElementById("ai-titel").value, type: document.getElementById("ai-type").value, indhold: document.getElementById("ai-indhold").value, oprettetAf: `${currentUser.fornavn} ${currentUser.efternavn}`, oprettetDato: new Date().toISOString() };
    if (!item.titel || !item.indhold) { showToast("Udfyld titel og indhold"); return; }
    try { await afdelingsIndholdApi.create(item); showToast("Indhold tilføjet"); overlay.remove(); renderPage(activeTabId); } catch (e) { showToast("Fejl: " + e.message); }
  });
};

window.deleteAfdelingsIndhold = async function(id) {
  if (!confirm("Slet dette indhold?")) return;
  try { await afdelingsIndholdApi.remove(id); showToast("Slettet"); renderPage(activeTabId); } catch (e) { showToast("Fejl: " + e.message); }
};
