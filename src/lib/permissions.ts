import { rangOrder } from "@/data/ansatte";

// Hidden admin code - validated server-side only, never exposed in UI
const ADMIN_CODE = "RPCHEF-2024-ADMIN";

export const validateAdminCode = (code: string): boolean => {
  return code === ADMIN_CODE;
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
  return getRangIndex(userRang) <= 5; // Vicepolitiinspektør or higher
};

// Politikommissær (index 6) and above can create officers
export const canCreateOfficer = (userRang: string): boolean => {
  return getRangIndex(userRang) <= 6; // Politikommissær or higher
};

// Only admin (Rigspolitichef with admin code verified) can edit Rigspolitichef
export const canEditRigspolitichef = (isAdmin: boolean): boolean => {
  return isAdmin;
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
