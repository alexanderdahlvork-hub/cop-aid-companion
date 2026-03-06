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
