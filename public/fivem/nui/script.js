// ============================================
// MDT Sagssystem - NUI JavaScript
// ============================================

let sager = [];
let openTabs = [{ id: 'forside', label: 'Sagsarkiv', type: 'sagsarkiv' }];
let activeTabId = 'forside';

// ── NUI Message Handler ──
window.addEventListener('message', (event) => {
  const { action, data } = event.data;

  switch (action) {
    case 'openMDT':
      document.getElementById('mdt-container').classList.remove('hidden');
      break;
    case 'closeMDT':
      document.getElementById('mdt-container').classList.add('hidden');
      break;
    case 'receiveSager':
      sager = data || [];
      renderSagerListe();
      break;
    case 'sagCreated':
    case 'sagUpdated':
    case 'sagDeleted':
      // Data refreshes via receiveSager
      break;
  }
});

// ── Close MDT ──
function closeMDT() {
  document.getElementById('mdt-container').classList.add('hidden');
  fetch('https://mdt-resource/closeMDT', { method: 'POST', body: JSON.stringify({}) });
}

// ── Tab Management ──
function openTab(id, label, type, data) {
  const existing = openTabs.find(t => t.id === id);
  if (existing) {
    activeTabId = id;
    renderTabs();
    renderContent();
    return;
  }
  openTabs.push({ id, label, type, data });
  activeTabId = id;
  renderTabs();
  renderContent();
}

function closeTab(id) {
  if (id === 'forside') return;
  openTabs = openTabs.filter(t => t.id !== id);
  if (activeTabId === id) {
    activeTabId = openTabs[openTabs.length - 1]?.id || 'forside';
  }
  renderTabs();
  renderContent();
}

function renderTabs() {
  const bar = document.getElementById('tabs-bar');
  if (!bar) return;
  bar.innerHTML = openTabs.map(t => `
    <div class="mdt-tab ${t.id === activeTabId ? 'active' : ''}" onclick="openTab('${t.id}','${t.label}','${t.type}')">
      <span>${t.label}</span>
      ${t.id !== 'forside' ? `<span class="close-tab" onclick="event.stopPropagation();closeTab('${t.id}')">✕</span>` : ''}
    </div>
  `).join('');
}

function renderContent() {
  const tab = openTabs.find(t => t.id === activeTabId);
  if (!tab) return;

  const liste = document.getElementById('sager-liste');
  const editor = document.getElementById('sag-editor');

  if (tab.type === 'sagsarkiv') {
    liste.classList.remove('hidden');
    editor.classList.add('hidden');
    renderSagerListe();
  } else if (tab.type === 'sag') {
    liste.classList.add('hidden');
    editor.classList.remove('hidden');
    renderSagEditor(tab.data);
  }
}

// ── Sager Liste ──
function renderSagerListe() {
  const container = document.getElementById('sager-liste');
  if (!container) return;

  const statusLabels = { aaben: 'Åben', under_efterforskning: 'Efterforskning', afventer_retten: 'Afventer retten', lukket: 'Lukket' };
  const statusClasses = { aaben: 'badge-success', under_efterforskning: 'badge-primary', afventer_retten: 'badge-warning', lukket: 'badge-muted' };

  container.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
      <div>
        <h2 style="font-size:16px;font-weight:700">Sagsarkiv</h2>
        <p style="font-size:12px;color:#64748b">${sager.length} sager i alt</p>
      </div>
      <button class="mdt-btn mdt-btn-primary" onclick="openNewSag()">+ Opret ny sag</button>
    </div>
    <input class="mdt-input" placeholder="Søg sagsnummer, titel..." style="margin-bottom:12px;max-width:400px" oninput="filterSager(this.value)" />
    <div id="sager-grid">
      ${sager.map(s => `
        <div class="section-card" style="cursor:pointer;margin-bottom:8px" onclick="openSag('${s.id}')">
          <div style="display:flex;align-items:center;gap:8px">
            <span style="font-size:11px;font-family:monospace;color:#64748b">${s.sagsnummer}</span>
            <span class="badge ${statusClasses[s.status] || 'badge-muted'}">${statusLabels[s.status] || s.status}</span>
          </div>
          <p style="font-size:13px;font-weight:500;margin-top:4px">${s.titel || 'Uden titel'}</p>
          <div style="display:flex;gap:12px;margin-top:4px;font-size:10px;color:#64748b">
            <span>${(s.mistaenkte || []).length} mistænkte</span>
            <span>${s.oprettetAf || ''}</span>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function openSag(id) {
  const sag = sager.find(s => s.id === id);
  if (!sag) return;
  openTab('sag-' + id, sag.titel || sag.sagsnummer, 'sag', sag);
}

function openNewSag() {
  openTab('sag-new-' + Date.now(), 'Ny Sag', 'sag', null);
}

// ── Sag Editor (placeholder – fuld editor er i React MDT) ──
function renderSagEditor(sagData) {
  const container = document.getElementById('sag-editor');
  if (!container) return;

  const isNew = !sagData;
  container.innerHTML = `
    <div style="margin-bottom:12px">
      <h2 style="font-size:16px;font-weight:700">${isNew ? 'Opret Sag' : 'Rediger Sag'}</h2>
      ${!isNew ? `<p style="font-size:11px;color:#64748b;font-family:monospace">${sagData.sagsnummer}</p>` : ''}
    </div>

    <div class="summary-grid">
      <div class="summary-card">
        <div class="icon" style="background:rgba(59,130,246,0.1);color:#60a5fa">👤</div>
        <div><div class="label">Mistænkte</div><div class="value">${isNew ? 0 : (sagData.mistaenkte || []).length}</div></div>
      </div>
      <div class="summary-card">
        <div class="icon" style="background:rgba(234,179,8,0.1);color:#facc15">⚖</div>
        <div><div class="label">Sigtelser</div><div class="value">${isNew ? 0 : countSigtelser(sagData)}</div></div>
      </div>
      <div class="summary-card">
        <div class="icon" style="background:rgba(234,179,8,0.1);color:#facc15">💰</div>
        <div><div class="label">Samlet bøde</div><div class="value">${isNew ? '0 kr' : calcTotalBoede(sagData) + ' kr'}</div></div>
      </div>
      <div class="summary-card">
        <div class="icon" style="background:rgba(239,68,68,0.1);color:#f87171">🔒</div>
        <div><div class="label">Fængsel</div><div class="value">${isNew ? '0 md.' : calcTotalFaengsel(sagData) + ' md.'}</div></div>
      </div>
    </div>

    <div class="section-card">
      <div class="card-header">Sagstitel</div>
      <input class="mdt-input" value="${isNew ? '' : (sagData.titel || '')}" placeholder="Skriv en titel..." />
    </div>

    <div class="section-card">
      <div class="card-header">Rapport</div>
      <textarea class="mdt-textarea">${isNew ? '' : (sagData.rapport?.haendelsesforloeb || '')}</textarea>
    </div>

    <p style="font-size:10px;color:#475569;text-align:center;margin-top:24px">
      Fuld editor med alle funktioner er tilgængelig i React MDT-applikationen.
    </p>
  `;
}

function countSigtelser(sag) {
  return (sag.mistaenkte || []).reduce((sum, m) => sum + (m.sigtelser || []).length, 0);
}
function calcTotalBoede(sag) {
  return (sag.mistaenkte || []).reduce((sum, m) => sum + (m.sigtelser || []).reduce((s, si) => s + (si.beloeb || 0), 0), 0).toLocaleString('da-DK');
}
function calcTotalFaengsel(sag) {
  return (sag.mistaenkte || []).reduce((sum, m) => sum + (m.sigtelser || []).reduce((s, si) => s + (si.faengselMaaneder || si.faengsel_maaneder || 0), 0), 0);
}

// ── NUI Communication ──
function nuiPost(endpoint, data) {
  return fetch(`https://mdt-resource/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data || {}),
  });
}

// ── Init ──
renderTabs();
renderContent();
