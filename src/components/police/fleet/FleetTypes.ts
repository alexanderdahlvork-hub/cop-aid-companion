import type { Patrulje, PatrolMember } from "@/lib/api";
import type { Betjent } from "@/types/police";

export type PatrolStatus = Patrulje['status'];

export const statusConfig: Record<PatrolStatus, { label: string; dot: string; bg: string }> = {
  ledig: { label: "Ledig", dot: "bg-emerald-500", bg: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
  i_brug: { label: "I brug", dot: "bg-blue-500", bg: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  optaget: { label: "Optaget", dot: "bg-amber-500", bg: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  ude_af_drift: { label: "Ude af drift", dot: "bg-red-500", bg: "bg-red-500/10 text-red-500 border-red-500/20" },
};

export interface PatrolType {
  id: string;
  label: string;
  prefix: string;
  kategori: string;
  pladser: number;
  requiredUddannelser: string[];
  icon: string;
}

export const PATROL_TYPES: PatrolType[] = [
  { id: "almen", label: "Almen patrulje", prefix: "Bravo", kategori: "Almen patrulje", pladser: 2, requiredUddannelser: ["Betjent"], icon: "car" },
  { id: "motorcykel", label: "Motorcykel enhed", prefix: "Mike", kategori: "Motorcykel", pladser: 1, requiredUddannelser: ["Romeo"], icon: "bike" },
  { id: "civil", label: "Civil enhed", prefix: "Charlie", kategori: "Civil enhed", pladser: 2, requiredUddannelser: ["Civil"], icon: "eye" },
  { id: "k9", label: "K9 enhed", prefix: "Kilo", kategori: "K9", pladser: 2, requiredUddannelser: ["K9"], icon: "dog" },
  { id: "lima", label: "LIMA enhed", prefix: "Lima", kategori: "LIMA", pladser: 4, requiredUddannelser: ["LIMA"], icon: "shield" },
  { id: "srt", label: "SRT enhed", prefix: "Sierra", kategori: "SRT", pladser: 6, requiredUddannelser: ["SRT"], icon: "crosshair" },
  { id: "helikopter", label: "Helikopter", prefix: "Hotel", kategori: "Helikopter", pladser: 2, requiredUddannelser: ["Helikopter"], icon: "plane" },
  { id: "efterforskning", label: "Efterforskning", prefix: "Echo", kategori: "Efterforskning", pladser: 3, requiredUddannelser: ["Efterforskning"], icon: "search" },
  { id: "faerdsel", label: "Færdsel enhed", prefix: "Foxtrot", kategori: "Færdsel", pladser: 2, requiredUddannelser: ["Betjent"], icon: "siren" },
  { id: "lima_a", label: "LIMA-A enhed", prefix: "Alpha", kategori: "LIMA-A", pladser: 4, requiredUddannelser: ["LIMA-A"], icon: "shield" },
];

export const GROUP_ACTIONS = [
  "Eftersættelse", "Ransagning", "Vejspærring", "Demonstration",
  "Anholdelsesoperation", "Overvågning", "Eskorte", "Razzia",
  "Trafikuheld", "Personeftersøgning", "Bevogtning", "Frihedsberøvelse",
];

export interface TaskGroup {
  id: string;
  navn: string;
  radioKanal: string;
  lederId: string;
  lederNavn: string;
  patruljeIds: string[];
  aktion: string;
}

export const STORAGE_KEY = "fleet_patruljer";
export const GROUPS_KEY = "fleet_grupper";

export function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

export function saveToStorage<T>(key: string, data: T) {
  localStorage.setItem(key, JSON.stringify(data));
}
