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
  status: 'aktiv' | 'i_brug' | 'vedligehold' | 'ude_af_drift';
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
  afdeling?: string;
  tilladelser?: string[];
  kodeord: string;
  foersteLogin: boolean;
}

export interface Boede {
  id: string;
  paragraf: string;
  beskrivelse: string;
  beloeb: number;
  kategori: string;
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
  id: string;
  badgeNr: string;
  fornavn: string;
  efternavn: string;
  rang: string;
  fyretDato: string;
  fyretAf: string;
}
