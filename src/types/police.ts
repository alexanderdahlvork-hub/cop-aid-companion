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
