export interface Person {
  id: string;
  cpr: string;
  fornavn: string;
  efternavn: string;
  adresse: string;
  postnr: string;
  by: string;
  telefon: string;
  status: 'aktiv' | 'eftersøgt' | 'anholdt' | 'sigtet';
  noter: string;
  oprettet: string;
}

export interface Koeretoej {
  id: string;
  nummerplade: string;
  maerke: string;
  model: string;
  aargang: string;
  farve: string;
  status: 'aktiv' | 'i_brug' | 'vedligehold' | 'ude_af_drift' | 'eftersøgt';
  tildelt: string;
  sidstService: string;
  km: number;
}

export interface Betjent {
  id: string;
  badgeNr: string;
  fornavn: string;
  efternavn: string;
  rang: string;
  uddannelser: string[];
  certifikater?: string[];
  titler?: string[];
  afdeling?: string;
  tilladelser?: string[];
  kodeord: string;
  foersteLogin: boolean;
  profilBillede?: string;
  antalSager?: number;
}

export interface Boede {
  id: string;
  paragraf: string;
  beskrivelse: string;
  beloeb: number;
  kategori: string;
  klip?: number;
  frakendelse?: 'Betinget' | 'Ubetinget' | '';
  faengselMaaneder?: number;
  information?: string;
}

export interface BoedKategori {
  navn: string;
  boeder: Boede[];
}

export interface Ejendom {
  id: string;
  adresse: string;
  postnr: string;
  by: string;
  ejer: string;
  ejerCpr: string;
  type: 'villa' | 'lejlighed' | 'erhverv' | 'grund';
  vurdering: number;
  matrikelnr: string;
  noter: string;
  oprettet: string;
}

export interface FyretMedarbejder {
  id: string;
  badgeNr: string;
  fornavn: string;
  efternavn: string;
  rang: string;
  fyretDato: string;
  fyretAf: string;
}

export type SagsStatus = 'aaben' | 'under_efterforskning' | 'afventer_retten' | 'lukket';

export interface Sigtelse {
  id: string;
  personId: string;
  personNavn: string;
  personCpr: string;
  dato: string;
  sigtelseBoeder: SigtelseBoede[];
  totalBoede: number;
  faengselMaaneder: number;
  fratagKoerekort: boolean;
  erkender: boolean | null;
  involveretBetjente: string[];
  rapport: SigtelseRapport;
  skabelonType?: string;
  sagsStatus: SagsStatus;
}

export interface SigtelseBoede {
  boedeId: string;
  paragraf: string;
  beskrivelse: string;
  beloeb: number;
  faengselMaaneder: number;
}

export interface SigtelseRapport {
  haendelsesforloeb: string;
  konfiskeredeGenstande: string;
  magtanvendelse: string;
  skabelonSvar?: Record<string, string>;
}

export interface RapportSkabelon {
  id: string;
  navn: string;
  spoergsmaal: string[];
}

// ── Enhanced Sag (Case) System ──

export interface SagNote {
  id: string;
  tekst: string;
  oprettetAf: string;
  oprettetDato: string;
}

export interface SagAktivitet {
  id: string;
  type: 'oprettet' | 'opdateret' | 'mistaenkt_tilfojet' | 'mistaenkt_fjernet' | 'betjent_tilfojet' | 'bevis_tilfojet' | 'sigtelse_tilfojet' | 'status_aendret' | 'note_tilfojet' | 'andet';
  beskrivelse: string;
  bruger: string;
  tidspunkt: string;
}

export interface Sag {
  id: string;
  sagsnummer: string;
  titel: string;
  oprettet: string;
  opdateret: string;
  status: SagsStatus;
  oprettetAf: string;
  mistaenkte: SagMistaenkt[];
  involveretBetjente: string[];
  involveretBorgere: SagBorger[];
  koeretoejer: SagKoeretoej[];
  referencer: SagReference[];
  tags: string[];
  beviser: SagBevis[];
  rapport: SagRapport;
  noter: SagNote[];
  aktivitetslog: SagAktivitet[];
}

export interface SagMistaenkt {
  id: string;
  personId: string;
  personNavn: string;
  personCpr: string;
  sigtelser: SigtelseBoede[];
  totalBoede: number;
  totalFaengsel: number;
  erkender: boolean | null;
  behandlet: boolean;
  tilkendegivelseAfgivet: boolean;
  fratagKoerekort: boolean;
}

export interface SagBorger {
  id: string;
  personId: string;
  navn: string;
  cpr: string;
  rolle: string;
}

export interface SagKoeretoej {
  id: string;
  nummerplade: string;
  beskrivelse: string;
}

export interface SagReference {
  id: string;
  titel: string;
  url?: string;
  beskrivelse?: string;
}

export interface SagBevis {
  id: string;
  type: 'billede' | 'tekst';
  billedUrl?: string;
  beskrivelse: string;
  timestamp?: string;
  oprettetAf: string;
  oprettetDato: string;
}

export interface SagRapport {
  haendelsesforloeb: string;
  konfiskeredeGenstande: string[];
  magtanvendelse: string[];
  skabelonType?: string;
  skabelonSvar?: Record<string, string>;
}

export interface OpenTab {
  id: string;
  label: string;
  icon?: string;
  type: string;
  data?: any;
}
