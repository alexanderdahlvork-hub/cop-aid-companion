const API_BASE = "https://cop-aid-companion-rest.alexanderdahlvork.workers.dev";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
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
import type { Betjent, FyretMedarbejder, Person, Koeretoej, Boede } from "@/types/police";

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
