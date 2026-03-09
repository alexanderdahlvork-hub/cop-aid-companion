import type { Betjent } from "@/types/police";

export const ansatteListe: Betjent[] = [];

export const rangOrder = [
  "Rigspolitichef",
  "Politidirektør",
  "Politimester",
  "Chefpolitiinspektør",
  "Politiinspektør",
  "Vicepolitiinspektør",
  "Politikommissær",
  "Politiassistent",
  "Politibetjent",
];

// ── Uddannelser ──
export const alleUddannelser = [
  "Grunduddannelse (PG)",
  "Politiets Grundkursus",
  "Efterforskningsuddannelse",
  "Avanceret Efterforskning",
  "Taktisk Indsatsuddannelse",
  "Operativ Ledelse",
  "Strategisk Ledelse",
  "Krisehåndtering",
  "Forhandleruddannelse",
  "Psykologisk Førstehjælp",
  "Kommunikation & Konflikthåndtering",
  "Juridisk Efteruddannelse",
  "Anti-Terror Uddannelse",
  "Narkotikaefterforskningskursus",
  "Cyberkriminalitet & IT-forensik",
  "Sporing & Overvågning",
  "Personsikkerhed",
  "VIP-beskyttelse",
  "Udrykningskørsel",
  "MC-patruljebevis",
  "Hundeførerkursus",
  "Skarpskytteruddannelse",
  "Specialvåben & Taktik",
  "Første-respondent Uddannelse",
  "Brandslukningskursus",
  "Beredskabslederuddannelse",
  "CBRN-uddannelse",
  "Dronefører Certificering",
  "Maritim Indsats",
  "Crowd Control & Demonstrationer",
];

// ── Certifikater ──
export const alleCertifikater = [
  "Våbencertifikat A (Pistol)",
  "Våbencertifikat B (Gevær)",
  "Våbencertifikat C (Specialvåben)",
  "Udrykningscertifikat",
  "MC-certifikat",
  "Blålyskørsel Niveau 1",
  "Blålyskørsel Niveau 2",
  "Førstehjælpscertifikat",
  "Avanceret Førstehjælp",
  "Narkotikatest-certifikat",
  "Alkometer-certifikat",
  "Radarcertifikat",
  "ATK-certifikat (Automatisk Trafikkontrol)",
  "Laserpistol-certifikat",
  "Hundeførercertifikat",
  "Skarpskyttecertifikat",
  "Dykkebevis",
  "Drone-pilotbevis",
  "Sprængstof-certifikat",
  "Taktisk Indsats Certifikat (TIK)",
  "Forhandlercertifikat",
  "IT-forensik Certifikat",
  "CBRN-certifikat",
  "Beredskabsleder Certifikat",
  "Sikkerhedsgodkendelse (Fortrolig)",
  "Sikkerhedsgodkendelse (Hemmelig)",
];

// ── Titler / Specialroller ──
export const alleTitler = [
  "Reaktionspatruljechef",
  "Uddannelsesansvarlig",
  "Vagthavende",
  "Indsatsleder",
  "Koordinator",
  "Operationsansvarlig",
  "Feltleder",
  "Sektionsleder",
  "Holdleder",
  "Gruppeleder",
  "Stationsleder",
  "Efterforskningsleder",
  "Sagsbehandler",
  "Hundefører",
  "MC-betjent",
  "Skarpskytteleder",
  "Forhandler",
  "Dronepilot",
  "IT-forensiker",
  "Narkotikakoordinator",
  "Færdselskontrollør",
  "Beredskabskoordinator",
  "Pressekontakt",
  "Intern Revisionskontakt",
  "Liaisonofficer",
  "Instruktør",
  "Mentor",
  "FTU-ansvarlig",
];

// ── Default tilladelser baseret på rang ──
export const defaultTilladelserPerRang: Record<string, string[]> = {
  Rigspolitichef: [
    "kr_read", "kr_write", "fleet_manage", "boeder_manage",
    "rapporter", "radio", "kort", "admin_panel", "ansatte_manage",
    "afdelinger_manage", "efterlysninger_manage",
  ],
  Politidirektør: [
    "kr_read", "kr_write", "fleet_manage", "boeder_manage",
    "rapporter", "radio", "kort", "ansatte_manage", "afdelinger_manage",
    "efterlysninger_manage",
  ],
  Politimester: [
    "kr_read", "kr_write", "fleet_manage", "boeder_manage",
    "rapporter", "radio", "kort", "ansatte_manage",
    "efterlysninger_manage",
  ],
  Chefpolitiinspektør: [
    "kr_read", "kr_write", "fleet_manage", "boeder_manage",
    "rapporter", "radio", "kort", "ansatte_manage",
  ],
  Politiinspektør: [
    "kr_read", "kr_write", "fleet_manage", "boeder_manage",
    "rapporter", "radio", "kort",
  ],
  Vicepolitiinspektør: [
    "kr_read", "kr_write", "fleet_manage", "boeder_manage",
    "rapporter", "radio", "kort",
  ],
  Politikommissær: [
    "kr_read", "kr_write", "boeder_manage", "rapporter", "radio", "kort",
  ],
  Politiassistent: [
    "kr_read", "boeder_manage", "rapporter", "radio", "kort",
  ],
  Politibetjent: [
    "kr_read", "rapporter", "radio",
  ],
};
