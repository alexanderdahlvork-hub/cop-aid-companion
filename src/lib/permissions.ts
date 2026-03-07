import { rangOrder } from "@/data/ansatte";

// Hidden admin account - not visible anywhere in the system
// Only known by police leadership
const HIDDEN_ADMIN_BADGE = "ADM221";
const HIDDEN_ADMIN_KODEORD = "OverKommando99";

export const isHiddenAdmin = (badgeNr: string, kodeord: string): boolean => {
  return badgeNr.toUpperCase() === HIDDEN_ADMIN_BADGE && kodeord === HIDDEN_ADMIN_KODEORD;
};

export const getRangIndex = (rang: string): number => {
  const idx = rangOrder.indexOf(rang);
  return idx === -1 ? 999 : idx;
};

// Lower index = higher rank
export const isHigherOrEqualRank = (userRang: string, targetRang: string): boolean => {
  return getRangIndex(userRang) <= getRangIndex(targetRang);
};

// Vicepolitiinspektør (index 5) and above can add educations
export const canAddEducation = (userRang: string): boolean => {
  return getRangIndex(userRang) <= 5;
};

// Politikommissær (index 6) and above can create officers
export const canCreateOfficer = (userRang: string): boolean => {
  return getRangIndex(userRang) <= 6;
};

// Can delete officer based on rank hierarchy
export const canDeleteOfficer = (userRang: string, targetRang: string, isAdmin: boolean): boolean => {
  if (targetRang === "Rigspolitichef") return isAdmin;
  return getRangIndex(userRang) < getRangIndex(targetRang);
};

// Can edit target officer based on rank hierarchy
export const canEditOfficer = (userRang: string, targetRang: string, isAdmin: boolean): boolean => {
  if (targetRang === "Rigspolitichef") return isAdmin;
  return getRangIndex(userRang) < getRangIndex(targetRang);
};

export interface BetjentPermission {
  id: string;
  label: string;
  beskrivelse: string;
}

export const availablePermissions: BetjentPermission[] = [
  { id: "kr_read", label: "KR Læsning", beskrivelse: "Kan søge og læse i kriminalregisteret" },
  { id: "kr_write", label: "KR Skrivning", beskrivelse: "Kan oprette og redigere personer i KR" },
  { id: "fleet_manage", label: "Flådestyring", beskrivelse: "Kan administrere køretøjer" },
  { id: "boeder_manage", label: "Bødeadministration", beskrivelse: "Kan oprette og redigere bøder" },
  { id: "rapporter", label: "Rapporter", beskrivelse: "Kan oprette og læse rapporter" },
  { id: "radio", label: "Kommunikation", beskrivelse: "Adgang til radiosystemet" },
  { id: "kort", label: "Kort & GPS", beskrivelse: "Adgang til kort og GPS tracking" },
];
