/**
 * AVLD-Systems.dk – MDT REST API Layer
 * Kommunikerer med Cloudflare Workers D1 database
 */

const API_BASE = "https://cop-aid-companion-rest.alexanderdahlvork.workers.dev";
const API_TOKEN = "secret";

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${API_TOKEN}`,
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

function getAll(table, params) {
  const qs = params ? "?" + new URLSearchParams(params).toString() : "";
  return request(`/rest/${table}${qs}`);
}
function getById(table, id) { return request(`/rest/${table}/${id}`); }
function create(table, data) { return request(`/rest/${table}`, { method: "POST", body: JSON.stringify(data) }); }
function update(table, id, data) { return request(`/rest/${table}/${id}`, { method: "PUT", body: JSON.stringify(data) }); }
function remove(table, id) { return request(`/rest/${table}/${id}`, { method: "DELETE" }); }

// ── Betjente ──
function rowToBetjent(row) {
  return {
    id: row.id, badgeNr: row.badgeNr, fornavn: row.fornavn, efternavn: row.efternavn,
    rang: row.rang, uddannelser: JSON.parse(row.uddannelser || "[]"),
    afdeling: row.afdeling || "", tilladelser: row.tilladelser ? JSON.parse(row.tilladelser) : [],
    kodeord: row.kodeord, foersteLogin: row.foersteLogin === 1,
    profilBillede: row.profilBillede || "",
  };
}
function betjentToRow(b) {
  const row = {};
  if (b.id !== undefined) row.id = b.id;
  if (b.badgeNr !== undefined) row.badgeNr = b.badgeNr;
  if (b.fornavn !== undefined) row.fornavn = b.fornavn;
  if (b.efternavn !== undefined) row.efternavn = b.efternavn;
  if (b.rang !== undefined) row.rang = b.rang;
  if (b.uddannelser !== undefined) row.uddannelser = JSON.stringify(b.uddannelser);
  if (b.afdeling !== undefined) row.afdeling = b.afdeling;
  if (b.tilladelser !== undefined) row.tilladelser = JSON.stringify(b.tilladelser);
  if (b.kodeord !== undefined) row.kodeord = b.kodeord;
  if (b.foersteLogin !== undefined) row.foersteLogin = b.foersteLogin ? 1 : 0;
  if (b.profilBillede !== undefined) row.profilBillede = b.profilBillede;
  return row;
}

const betjenteApi = {
  async getAll() { const r = await getAll("betjente"); return r.results.map(rowToBetjent); },
  async getByBadge(badgeNr) { const r = await getAll("betjente", { badgeNr }); return r.results.length > 0 ? rowToBetjent(r.results[0]) : null; },
  async create(b) { await create("betjente", betjentToRow(b)); },
  async update(id, data) { await update("betjente", id, betjentToRow(data)); },
  async remove(id) { await remove("betjente", id); },
};

// ── Fyrede ──
const fyredeApi = {
  async getAll() { const r = await getAll("fyrede_medarbejdere"); return r.results; },
  async create(f) { await create("fyrede_medarbejdere", f); },
};

// ── Personer ──
const personerApi = {
  async getAll() { const r = await getAll("personer"); return r.results; },
  async create(p) { await create("personer", p); },
  async update(id, data) { await update("personer", id, data); },
  async remove(id) { await remove("personer", id); },
};

// ── Køretøjer ──
const koeretoejerApi = {
  async getAll() { const r = await getAll("koeretoejer"); return r.results; },
  async create(k) { await create("koeretoejer", k); },
  async update(id, data) { await update("koeretoejer", id, data); },
};

// ── Bøder ──
const boederApi = {
  async getAll() { const r = await getAll("boeder"); return r.results; },
  async create(b) { await create("boeder", b); },
  async update(id, data) { await update("boeder", id, data); },
  async remove(id) { await remove("boeder", id); },
};

// ── Ejendomme ──
const ejendommeApi = {
  async getAll() { const r = await getAll("ejendomme"); return r.results; },
  async create(e) { await create("ejendomme", e); },
  async update(id, data) { await update("ejendomme", id, data); },
  async remove(id) { await remove("ejendomme", id); },
};

// ── Sigtelser ──
function rowToSigtelse(row) {
  return {
    id: row.id, personId: row.personId, personNavn: row.personNavn, personCpr: row.personCpr,
    dato: row.dato, sigtelseBoeder: JSON.parse(row.sigtelseBoeder || "[]"),
    totalBoede: row.totalBoede, faengselMaaneder: row.faengselMaaneder,
    fratagKoerekort: row.fratagKoerekort === 1,
    erkender: row.erkender === null ? null : row.erkender === 1,
    involveretBetjente: JSON.parse(row.involveretBetjente || "[]"),
    rapport: JSON.parse(row.rapport || "{}"),
    skabelonType: row.skabelonType, sagsStatus: row.sagsStatus || "aaben",
  };
}
function sigtelseToRow(s) {
  return {
    id: s.id, personId: s.personId, personNavn: s.personNavn, personCpr: s.personCpr,
    dato: s.dato, sigtelseBoeder: JSON.stringify(s.sigtelseBoeder),
    totalBoede: s.totalBoede, faengselMaaneder: s.faengselMaaneder,
    fratagKoerekort: s.fratagKoerekort ? 1 : 0,
    erkender: s.erkender === null ? null : s.erkender ? 1 : 0,
    involveretBetjente: JSON.stringify(s.involveretBetjente),
    rapport: JSON.stringify(s.rapport), skabelonType: s.skabelonType || "", sagsStatus: s.sagsStatus || "aaben",
  };
}
const sigtelserApi = {
  async getAll() { try { const r = await getAll("sigtelser"); return r.results.map(rowToSigtelse); } catch { return []; } },
  async getByPerson(personId) { const r = await getAll("sigtelser", { personId }); return r.results.map(rowToSigtelse); },
  async create(s) { await create("sigtelser", sigtelseToRow(s)); },
  async update(id, data) {
    const row = {};
    if (data.rapport !== undefined) row.rapport = JSON.stringify(data.rapport);
    if (data.erkender !== undefined) row.erkender = data.erkender === null ? null : data.erkender ? 1 : 0;
    if (data.sagsStatus !== undefined) row.sagsStatus = data.sagsStatus;
    await update("sigtelser", id, row);
  },
  async remove(id) { await remove("sigtelser", id); },
};

// ── Sager ──
function rowToSag(row) {
  return {
    id: row.id, sagsnummer: row.sagsnummer || "", titel: row.titel || "",
    oprettet: row.oprettet, opdateret: row.opdateret,
    status: row.status || "aaben", oprettetAf: row.oprettetAf || "",
    mistaenkte: JSON.parse(row.mistaenkte || "[]"),
    involveretBetjente: JSON.parse(row.involveretBetjente || "[]"),
    involveretBorgere: JSON.parse(row.involveretBorgere || "[]"),
    koeretoejer: JSON.parse(row.koeretoejer || "[]"),
    referencer: JSON.parse(row.referencer || "[]"),
    tags: JSON.parse(row.tags || "[]"),
    beviser: JSON.parse(row.beviser || "[]"),
    rapport: JSON.parse(row.rapport || '{"haendelsesforloeb":"","konfiskeredeGenstande":[],"magtanvendelse":[]}'),
    noter: JSON.parse(row.noter || "[]"),
    aktivitetslog: JSON.parse(row.aktivitetslog || "[]"),
  };
}
function sagToRow(s) {
  return {
    id: s.id, sagsnummer: s.sagsnummer, titel: s.titel,
    oprettet: s.oprettet, opdateret: s.opdateret, status: s.status, oprettetAf: s.oprettetAf,
    mistaenkte: JSON.stringify(s.mistaenkte), involveretBetjente: JSON.stringify(s.involveretBetjente),
    involveretBorgere: JSON.stringify(s.involveretBorgere), koeretoejer: JSON.stringify(s.koeretoejer),
    referencer: JSON.stringify(s.referencer), tags: JSON.stringify(s.tags),
    beviser: JSON.stringify(s.beviser), rapport: JSON.stringify(s.rapport),
    noter: JSON.stringify(s.noter), aktivitetslog: JSON.stringify(s.aktivitetslog),
  };
}
const sagerApi = {
  async getAll() { try { const r = await getAll("sager"); return r.results.map(rowToSag); } catch { const s = localStorage.getItem("sager"); return s ? JSON.parse(s) : []; } },
  async create(s) { try { await create("sager", sagToRow(s)); } catch { const e = JSON.parse(localStorage.getItem("sager") || "[]"); e.push(s); localStorage.setItem("sager", JSON.stringify(e)); } },
  async update(id, data) { try { await update("sager", id, sagToRow(data)); } catch { const e = JSON.parse(localStorage.getItem("sager") || "[]"); const i = e.findIndex(s => s.id === id); if (i >= 0) e[i] = data; localStorage.setItem("sager", JSON.stringify(e)); } },
  async remove(id) { try { await remove("sager", id); } catch { const e = JSON.parse(localStorage.getItem("sager") || "[]"); localStorage.setItem("sager", JSON.stringify(e.filter(s => s.id !== id))); } },
};

// ── Opslag ──
const opslagApi = {
  async getAll() { try { const r = await getAll("opslag"); return r.results; } catch { const s = localStorage.getItem("opslagstavle_opslag"); return s ? JSON.parse(s) : []; } },
  async create(o) { try { await create("opslag", o); } catch {} },
  async update(id, data) { try { await update("opslag", id, data); } catch {} },
  async remove(id) { try { await remove("opslag", id); } catch {} },
};

// ── Tilhørsforhold ──
const tilhoersforholdApi = {
  async getAll() { try { const r = await getAll("nsk_tilhoersforhold"); return r.results; } catch { const s = localStorage.getItem("nsk_netvaerk"); return s ? JSON.parse(s) : []; } },
  async create(t) { try { await create("nsk_tilhoersforhold", t); } catch {} },
  async update(id, data) { try { await update("nsk_tilhoersforhold", id, data); } catch {} },
  async remove(id) { try { await remove("nsk_tilhoersforhold", id); } catch {} },
};

// ── Efterlysninger ──
const efterlysningerApi = {
  async getAll() { try { const r = await getAll("efterlysninger"); return r.results; } catch { return []; } },
  async create(e) { try { await create("efterlysninger", e); } catch {} },
  async update(id, data) { try { await update("efterlysninger", id, data); } catch {} },
  async remove(id) { try { await remove("efterlysninger", id); } catch {} },
};

// ── Afdelingsindhold ──
const afdelingsIndholdApi = {
  async getAll(afdelingId) { try { const p = afdelingId ? { afdelingId } : undefined; const r = await getAll("afdelingsindhold", p); return r.results; } catch { return []; } },
  async create(a) { try { await create("afdelingsindhold", a); } catch {} },
  async update(id, data) { try { await update("afdelingsindhold", id, data); } catch {} },
  async remove(id) { try { await remove("afdelingsindhold", id); } catch {} },
};

// ── Ansøgninger ──
const ansoeningerApi = {
  async getAll() { try { const r = await getAll("ansoegning_indsendelser"); return r.results; } catch { const s = localStorage.getItem("ansoegninger_indsendelser"); return s ? JSON.parse(s) : []; } },
  async create(a) { try { await create("ansoegning_indsendelser", a); } catch {} },
  async update(id, data) { try { await update("ansoegning_indsendelser", id, data); } catch {} },
  async remove(id) { try { await remove("ansoegning_indsendelser", id); } catch {} },
};

// ── Patruljer ──
function rowToPatrulje(row) {
  return { id: row.id, navn: row.navn, kategori: row.kategori, pladser: row.pladser, medlemmer: JSON.parse(row.medlemmer || "[]"), status: row.status || "ledig", bemaerkning: row.bemaerkning || "" };
}
function patruljeToRow(p) {
  const row = {};
  if (p.id !== undefined) row.id = p.id;
  if (p.navn !== undefined) row.navn = p.navn;
  if (p.kategori !== undefined) row.kategori = p.kategori;
  if (p.pladser !== undefined) row.pladser = p.pladser;
  if (p.medlemmer !== undefined) row.medlemmer = JSON.stringify(p.medlemmer);
  if (p.status !== undefined) row.status = p.status;
  if (p.bemaerkning !== undefined) row.bemaerkning = p.bemaerkning;
  return row;
}
const patruljerApi = {
  async getAll() { const r = await getAll("patruljer"); return r.results.map(rowToPatrulje); },
  async create(p) { await create("patruljer", patruljeToRow(p)); },
  async update(id, data) { await update("patruljer", id, patruljeToRow(data)); },
  async remove(id) { await remove("patruljer", id); },
};

// ── Rang ──
const rangApi = {
  async getAll() { try { const r = await getAll("rang_order", { sort_by: "position", order: "ASC" }); return r.results; } catch { return []; } },
  async create(rang, position) { await create("rang_order", { id: String(Date.now()), rang, position }); },
  async remove(id) { await remove("rang_order", id); },
};
