const API_BASE = "https://cop-aid-companion-rest.alexanderdahlvork.workers.dev";
// TODO: Erstat med rigtig auth (JWT, session tokens, etc.)
const API_TOKEN = "secret";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${API_TOKEN}`,
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as any).error || res.statusText);
  }
  return res.json();
}

// Generic REST helpers
function getAll<T>(table: string, params?: Record<string, string>): Promise<{ results: T[] }> {
  const qs = params ? "?" + new URLSearchParams(params).toString() : "";
  return request(`/rest/${table}${qs}`);
}

function getById<T>(table: string, id: string): Promise<{ results: T[] }> {
  return request(`/rest/${table}/${id}`);
}

function create<T>(table: string, data: Record<string, any>): Promise<{ message: string; data: T }> {
  return request(`/rest/${table}`, { method: "POST", body: JSON.stringify(data) });
}

function update<T>(table: string, id: string, data: Record<string, any>): Promise<{ message: string; data: T }> {
  return request(`/rest/${table}/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

function remove(table: string, id: string): Promise<{ message: string }> {
  return request(`/rest/${table}/${id}`, { method: "DELETE" });
}

// ── Betjente (Officers) ──
import type { Betjent, FyretMedarbejder, Person, Koeretoej, Boede, Ejendom } from "@/types/police";

interface BetjentRow {
  id: string;
  badgeNr: string;
  fornavn: string;
  efternavn: string;
  rang: string;
  uddannelser: string; // JSON array
  afdeling: string | null;
  tilladelser: string | null; // JSON array
  kodeord: string;
  foersteLogin: number; // 0 or 1
}

function rowToBetjent(row: BetjentRow): Betjent {
  return {
    id: row.id,
    badgeNr: row.badgeNr,
    fornavn: row.fornavn,
    efternavn: row.efternavn,
    rang: row.rang,
    uddannelser: JSON.parse(row.uddannelser || "[]"),
    afdeling: row.afdeling || undefined,
    tilladelser: row.tilladelser ? JSON.parse(row.tilladelser) : undefined,
    kodeord: row.kodeord,
    foersteLogin: row.foersteLogin === 1,
  };
}

function betjentToRow(b: Partial<Betjent> & { id?: string }): Record<string, any> {
  const row: Record<string, any> = {};
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
  return row;
}

export const betjenteApi = {
  async getAll(): Promise<Betjent[]> {
    const res = await getAll<BetjentRow>("betjente");
    return res.results.map(rowToBetjent);
  },
  async getByBadge(badgeNr: string): Promise<Betjent | null> {
    const res = await getAll<BetjentRow>("betjente", { badgeNr });
    return res.results.length > 0 ? rowToBetjent(res.results[0]) : null;
  },
  async create(b: Omit<Betjent, "id"> & { id: string }): Promise<void> {
    await create("betjente", betjentToRow(b));
  },
  async update(id: string, data: Partial<Betjent>): Promise<void> {
    await update("betjente", id, betjentToRow(data));
  },
  async remove(id: string): Promise<void> {
    await remove("betjente", id);
  },
};

// ── Fyrede Medarbejdere ──
export const fyredeApi = {
  async getAll(): Promise<FyretMedarbejder[]> {
    const res = await getAll<FyretMedarbejder>("fyrede_medarbejdere");
    return res.results;
  },
  async create(f: FyretMedarbejder): Promise<void> {
    await create("fyrede_medarbejdere", f);
  },
};

// ── Personer (KR Register) ──
export const personerApi = {
  async getAll(): Promise<Person[]> {
    const res = await getAll<Person>("personer");
    return res.results;
  },
  async create(p: Person): Promise<void> {
    await create("personer", p);
  },
  async update(id: string, data: Partial<Person>): Promise<void> {
    await update("personer", id, data);
  },
  async remove(id: string): Promise<void> {
    await remove("personer", id);
  },
};

// ── Køretøjer ──
export const koeretoejerApi = {
  async getAll(): Promise<Koeretoej[]> {
    const res = await getAll<Koeretoej>("koeretoejer");
    return res.results;
  },
  async create(k: Koeretoej): Promise<void> {
    await create("koeretoejer", k);
  },
  async update(id: string, data: Partial<Koeretoej>): Promise<void> {
    await update("koeretoejer", id, data);
  },
};

// ── Bøder ──
export const boederApi = {
  async getAll(): Promise<Boede[]> {
    const res = await getAll<Boede>("boeder");
    return res.results;
  },
  async create(b: Boede): Promise<void> {
    await create("boeder", b);
  },
  async update(id: string, data: Partial<Boede>): Promise<void> {
    await update("boeder", id, data);
  },
  async remove(id: string): Promise<void> {
    await remove("boeder", id);
  },
};

// ── Ejendomme ──
export const ejendommeApi = {
  async getAll(): Promise<Ejendom[]> {
    const res = await getAll<Ejendom>("ejendomme");
    return res.results;
  },
  async create(e: Ejendom): Promise<void> {
    await create("ejendomme", e);
  },
  async update(id: string, data: Partial<Ejendom>): Promise<void> {
    await update("ejendomme", id, data);
  },
  async remove(id: string): Promise<void> {
    await remove("ejendomme", id);
  },
};

// ── Sigtelser ──
interface SigtelseRow {
  id: string;
  personId: string;
  personNavn: string;
  personCpr: string;
  dato: string;
  sigtelseBoeder: string; // JSON
  totalBoede: number;
  faengselMaaneder: number;
  fratagKoerekort: number; // 0 or 1
  erkender: number | null; // 0, 1, or null
  involveretBetjente: string; // JSON
  rapport: string; // JSON
  skabelonType?: string;
  sagsStatus?: string;
}

import type { Sigtelse } from "@/types/police";

function rowToSigtelse(row: SigtelseRow): Sigtelse {
  return {
    id: row.id,
    personId: row.personId,
    personNavn: row.personNavn,
    personCpr: row.personCpr,
    dato: row.dato,
    sigtelseBoeder: JSON.parse(row.sigtelseBoeder || "[]"),
    totalBoede: row.totalBoede,
    faengselMaaneder: row.faengselMaaneder,
    fratagKoerekort: row.fratagKoerekort === 1,
    erkender: row.erkender === null ? null : row.erkender === 1,
    involveretBetjente: JSON.parse(row.involveretBetjente || "[]"),
    rapport: JSON.parse(row.rapport || "{}"),
    skabelonType: row.skabelonType,
    sagsStatus: (row.sagsStatus as Sigtelse['sagsStatus']) || 'aaben',
  };
}

function sigtelseToRow(s: Sigtelse): Record<string, any> {
  return {
    id: s.id,
    personId: s.personId,
    personNavn: s.personNavn,
    personCpr: s.personCpr,
    dato: s.dato,
    sigtelseBoeder: JSON.stringify(s.sigtelseBoeder),
    totalBoede: s.totalBoede,
    faengselMaaneder: s.faengselMaaneder,
    fratagKoerekort: s.fratagKoerekort ? 1 : 0,
    erkender: s.erkender === null ? null : s.erkender ? 1 : 0,
    involveretBetjente: JSON.stringify(s.involveretBetjente),
    rapport: JSON.stringify(s.rapport),
    skabelonType: s.skabelonType || "",
    sagsStatus: s.sagsStatus || "aaben",
  };
}

export const sigtelserApi = {
  async getAll(): Promise<Sigtelse[]> {
    const res = await getAll<SigtelseRow>("sigtelser");
    return res.results.map(rowToSigtelse);
  },
  async getByPerson(personId: string): Promise<Sigtelse[]> {
    const res = await getAll<SigtelseRow>("sigtelser", { personId });
    return res.results.map(rowToSigtelse);
  },
  async create(s: Sigtelse): Promise<void> {
    await create("sigtelser", sigtelseToRow(s));
  },
  async update(id: string, data: Partial<Sigtelse>): Promise<void> {
    const row: Record<string, any> = {};
    if (data.rapport !== undefined) row.rapport = JSON.stringify(data.rapport);
    if (data.erkender !== undefined) row.erkender = data.erkender === null ? null : data.erkender ? 1 : 0;
    if (data.fratagKoerekort !== undefined) row.fratagKoerekort = data.fratagKoerekort ? 1 : 0;
    if (data.sagsStatus !== undefined) row.sagsStatus = data.sagsStatus;
    await update("sigtelser", id, row);
  },
  async remove(id: string): Promise<void> {
    await remove("sigtelser", id);
  },
};

// ── Rang Order ──
export const rangApi = {
  async getAll(): Promise<{ id: string; rang: string; position: number }[]> {
    const res = await getAll<{ id: string; rang: string; position: number }>("rang_order", { sort_by: "position", order: "ASC" });
    return res.results;
  },
  async create(rang: string, position: number): Promise<void> {
    await create("rang_order", { id: String(Date.now()), rang, position });
  },
  async remove(id: string): Promise<void> {
    await remove("rang_order", id);
  },
};

// ── Patruljer (Fleet) ──
export interface PatrolMember {
  badgeNr: string;
  navn: string;
}

interface PatruljeRow {
  id: string;
  navn: string;
  kategori: string;
  pladser: number;
  medlemmer: string; // JSON
  status: string;
  bemaerkning: string;
}

export interface Patrulje {
  id: string;
  navn: string;
  kategori: string;
  pladser: number;
  medlemmer: PatrolMember[];
  status: 'ledig' | 'i_brug' | 'optaget' | 'ude_af_drift';
  bemærkning: string;
}

function rowToPatrulje(row: PatruljeRow): Patrulje {
  return {
    id: row.id,
    navn: row.navn,
    kategori: row.kategori,
    pladser: row.pladser,
    medlemmer: JSON.parse(row.medlemmer || '[]'),
    status: (row.status || 'ledig') as Patrulje['status'],
    bemærkning: row.bemaerkning || '',
  };
}

function patruljeToRow(p: Partial<Patrulje> & { id?: string }): Record<string, any> {
  const row: Record<string, any> = {};
  if (p.id !== undefined) row.id = p.id;
  if (p.navn !== undefined) row.navn = p.navn;
  if (p.kategori !== undefined) row.kategori = p.kategori;
  if (p.pladser !== undefined) row.pladser = p.pladser;
  if (p.medlemmer !== undefined) row.medlemmer = JSON.stringify(p.medlemmer);
  if (p.status !== undefined) row.status = p.status;
  if (p.bemærkning !== undefined) row.bemaerkning = p.bemærkning;
  return row;
}

export const patruljerApi = {
  async getAll(): Promise<Patrulje[]> {
    const res = await getAll<PatruljeRow>("patruljer");
    return res.results.map(rowToPatrulje);
  },
  async create(p: Patrulje): Promise<void> {
    await create("patruljer", patruljeToRow(p));
  },
  async update(id: string, data: Partial<Patrulje>): Promise<void> {
    await update("patruljer", id, patruljeToRow(data));
  },
  async remove(id: string): Promise<void> {
    await remove("patruljer", id);
  },
};

// ── Opgaver (Dispatch) ──
interface OpgaveRow {
  id: string;
  typeId: string;
  typeNavn: string;
  prioritet: string;
  adresse: string;
  beskrivelse: string;
  tildeltPatruljer: string; // JSON
  oprettet: string;
  status: string;
}

export interface OpgaveDB {
  id: string;
  typeId: string;
  typeNavn: string;
  prioritet: string;
  adresse: string;
  beskrivelse: string;
  tildeltPatruljer: string[];
  oprettet: string;
  status: 'aktiv' | 'undervejs' | 'afsluttet';
}

function rowToOpgave(row: OpgaveRow): OpgaveDB {
  return {
    id: row.id,
    typeId: row.typeId,
    typeNavn: row.typeNavn,
    prioritet: row.prioritet,
    adresse: row.adresse,
    beskrivelse: row.beskrivelse || '',
    tildeltPatruljer: JSON.parse(row.tildeltPatruljer || '[]'),
    oprettet: row.oprettet,
    status: (row.status || 'aktiv') as OpgaveDB['status'],
  };
}

function opgaveToRow(o: OpgaveDB): Record<string, any> {
  return {
    id: o.id,
    typeId: o.typeId,
    typeNavn: o.typeNavn,
    prioritet: o.prioritet,
    adresse: o.adresse,
    beskrivelse: o.beskrivelse,
    tildeltPatruljer: JSON.stringify(o.tildeltPatruljer),
    oprettet: o.oprettet,
    status: o.status,
  };
}

export const opgaverApi = {
  async getAll(): Promise<OpgaveDB[]> {
    const res = await getAll<OpgaveRow>("opgaver");
    return res.results.map(rowToOpgave);
  },
  async create(o: OpgaveDB): Promise<void> {
    await create("opgaver", opgaveToRow(o));
  },
  async update(id: string, data: Partial<OpgaveDB>): Promise<void> {
    const row: Record<string, any> = {};
    if (data.status !== undefined) row.status = data.status;
    if (data.tildeltPatruljer !== undefined) row.tildeltPatruljer = JSON.stringify(data.tildeltPatruljer);
    if (data.adresse !== undefined) row.adresse = data.adresse;
    if (data.beskrivelse !== undefined) row.beskrivelse = data.beskrivelse;
    await update("opgaver", id, row);
  },
  async remove(id: string): Promise<void> {
    await remove("opgaver", id);
  },
};
