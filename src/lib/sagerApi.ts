import type { Sag } from "@/types/police";

const API_BASE = "https://cop-aid-companion-rest.alexanderdahlvork.workers.dev";
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

interface SagRow {
  id: string;
  sagsnummer: string;
  titel: string;
  oprettet: string;
  opdateret: string;
  status: string;
  oprettetAf: string;
  mistaenkte: string;
  involveretBetjente: string;
  involveretBorgere: string;
  koeretoejer: string;
  referencer: string;
  tags: string;
  beviser: string;
  rapport: string;
  noter: string;
  aktivitetslog: string;
}

function rowToSag(row: SagRow): Sag {
  return {
    id: row.id,
    sagsnummer: row.sagsnummer || '',
    titel: row.titel || '',
    oprettet: row.oprettet,
    opdateret: row.opdateret,
    status: (row.status as Sag['status']) || 'aaben',
    oprettetAf: row.oprettetAf || '',
    mistaenkte: JSON.parse(row.mistaenkte || '[]'),
    involveretBetjente: JSON.parse(row.involveretBetjente || '[]'),
    involveretBorgere: JSON.parse(row.involveretBorgere || '[]'),
    koeretoejer: JSON.parse(row.koeretoejer || '[]'),
    referencer: JSON.parse(row.referencer || '[]'),
    tags: JSON.parse(row.tags || '[]'),
    beviser: JSON.parse(row.beviser || '[]'),
    rapport: JSON.parse(row.rapport || '{"haendelsesforloeb":"","konfiskeredeGenstande":[],"magtanvendelse":[]}'),
    noter: JSON.parse(row.noter || '[]'),
    aktivitetslog: JSON.parse(row.aktivitetslog || '[]'),
  };
}

function sagToRow(s: Sag): Record<string, any> {
  return {
    id: s.id,
    sagsnummer: s.sagsnummer,
    titel: s.titel,
    oprettet: s.oprettet,
    opdateret: s.opdateret,
    status: s.status,
    oprettetAf: s.oprettetAf,
    mistaenkte: JSON.stringify(s.mistaenkte),
    involveretBetjente: JSON.stringify(s.involveretBetjente),
    involveretBorgere: JSON.stringify(s.involveretBorgere),
    koeretoejer: JSON.stringify(s.koeretoejer),
    referencer: JSON.stringify(s.referencer),
    tags: JSON.stringify(s.tags),
    beviser: JSON.stringify(s.beviser),
    rapport: JSON.stringify(s.rapport),
    noter: JSON.stringify(s.noter),
    aktivitetslog: JSON.stringify(s.aktivitetslog),
  };
}

export const sagerApi = {
  async getAll(): Promise<Sag[]> {
    try {
      const res = await request<{ results: SagRow[] }>('/rest/sager');
      return res.results.map(rowToSag);
    } catch {
      // Fallback to localStorage if table doesn't exist yet
      const stored = localStorage.getItem('sager');
      return stored ? JSON.parse(stored) : [];
    }
  },
  async create(s: Sag): Promise<void> {
    try {
      await request('/rest/sager', { method: 'POST', body: JSON.stringify(sagToRow(s)) });
    } catch {
      const existing = JSON.parse(localStorage.getItem('sager') || '[]');
      existing.push(s);
      localStorage.setItem('sager', JSON.stringify(existing));
    }
  },
  async update(id: string, data: Sag): Promise<void> {
    try {
      await request(`/rest/sager/${id}`, { method: 'PUT', body: JSON.stringify(sagToRow(data)) });
    } catch {
      const existing: Sag[] = JSON.parse(localStorage.getItem('sager') || '[]');
      const idx = existing.findIndex(s => s.id === id);
      if (idx >= 0) existing[idx] = data;
      localStorage.setItem('sager', JSON.stringify(existing));
    }
  },
  async remove(id: string): Promise<void> {
    try {
      await request(`/rest/sager/${id}`, { method: 'DELETE' });
    } catch {
      const existing: Sag[] = JSON.parse(localStorage.getItem('sager') || '[]');
      localStorage.setItem('sager', JSON.stringify(existing.filter(s => s.id !== id)));
    }
  },
};
