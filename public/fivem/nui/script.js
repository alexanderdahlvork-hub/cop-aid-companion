// ============================================
// AVLD MDT — NUI bridge
// Indlejrer mdt.html i en iframe og bridger
// beskeder mellem FiveM client og MDT-app.
// ============================================

const root  = document.getElementById('mdt-root');
const frame = document.getElementById('mdt-frame');

let currentUser = null;

// ── Vis/skjul + send brugerinfo til MDT'en ──
function openMDT(user) {
  currentUser = user || null;
  root.classList.remove('hidden');
  // Send brugerinfo til iframe så den kan auto-logge ind
  postToMDT({ type: 'AVLD_MDT_USER', user: currentUser });
}

function closeMDT() {
  root.classList.add('hidden');
  fetch(`https://${GetParentResourceName?.() || 'avld_mdt'}/close`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  }).catch(() => {});
}

function postToMDT(msg) {
  try {
    frame.contentWindow.postMessage(msg, '*');
  } catch (e) {
    console.warn('[AVLD MDT] kunne ikke sende til iframe:', e);
  }
}

// ── Beskeder fra FiveM client.lua ──
window.addEventListener('message', (event) => {
  const data = event.data || {};

  // Fra client.lua
  if (data.action === 'open') {
    openMDT(data.user);
    return;
  }
  if (data.action === 'close') {
    closeMDT();
    return;
  }

  // Server-data forwardet til MDT'en
  if (data.action && data.action.includes(':')) {
    postToMDT({
      type: 'AVLD_MDT_SERVER_DATA',
      action: data.action,
      payload: data.payload,
      extra: data.extra,
    });
    return;
  }

  // Beskeder fra MDT'en (iframe) -> kald client/server
  if (data.type === 'AVLD_MDT_DB') {
    fetch(`https://${GetParentResourceName?.() || 'avld_mdt'}/db`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: data.event, payload: data.payload }),
    }).catch(() => {});
    return;
  }

  if (data.type === 'AVLD_MDT_CLOSE') {
    closeMDT();
    return;
  }
});

// ── Når iframe er færdig med at loade, bed om bruger igen ──
frame.addEventListener('load', () => {
  if (currentUser) {
    setTimeout(() => postToMDT({ type: 'AVLD_MDT_USER', user: currentUser }), 200);
  }
});
