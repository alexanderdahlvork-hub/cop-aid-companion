import { rangOrder } from "@/data/ansatte";

export const getRangIndex = (rang: string): number => {
  const idx = rangOrder.indexOf(rang);
  return idx === -1 ? 999 : idx;
};

export const isHigherOrEqualRank = (userRang: string, targetRang: string): boolean => {
  return getRangIndex(userRang) <= getRangIndex(targetRang);
};

export const isAdmin = (rang: string): boolean => {
  return rang === "Administrator";
};

export const canAddEducation = (userRang: string): boolean => {
  if (userRang === "Administrator") return true;
  return getRangIndex(userRang) <= 5;
};

export const canCreateOfficer = (userRang: string): boolean => {
  if (userRang === "Administrator") return true;
  return getRangIndex(userRang) <= 6;
};

export const canDeleteOfficer = (userRang: string, targetRang: string, admin: boolean): boolean => {
  if (admin) return true;
  if (targetRang === "Rigspolitichef") return false;
  return getRangIndex(userRang) < getRangIndex(targetRang);
};

export const canEditOfficer = (userRang: string, targetRang: string, admin: boolean): boolean => {
  if (admin) return true;
  if (targetRang === "Rigspolitichef") return false;
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
