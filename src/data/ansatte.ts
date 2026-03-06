import type { Betjent } from "@/types/police";

export const ansatteListe: Betjent[] = [
  { id: "1", badgeNr: "01", fornavn: "Karlo", efternavn: "Leibrandt", rang: "Rigspolitichef", uddannelser: ["Betjent", "Civil", "Romeo", "Helikopter", "LIMA", "LIMA-A"] },
  { id: "2", badgeNr: "D1089", fornavn: "Balder", efternavn: "Sørensen", rang: "Politidirektør", uddannelser: ["Betjent", "Civil", "Romeo"] },
  { id: "3", badgeNr: "Z0999", fornavn: "Klaes", efternavn: "Franc", rang: "Politidirektør", uddannelser: ["Betjent", "Civil"] },
  { id: "4", badgeNr: "X3009", fornavn: "Birk", efternavn: "Gregersen", rang: "Politimester", uddannelser: ["Betjent", "Civil", "LIMA"] },
  { id: "5", badgeNr: "Q3037", fornavn: "Jesper", efternavn: "Brøndum", rang: "Chefpolitiinspektør", uddannelser: ["Betjent", "Civil", "Romeo", "Helikopter"] },
  { id: "6", badgeNr: "X2110", fornavn: "Kalle", efternavn: "Krudt", rang: "Politiinspektør", uddannelser: ["Betjent", "Civil"] },
  { id: "7", badgeNr: "B1412", fornavn: "Claus", efternavn: "Christensen", rang: "Vicepolitiinspektør", uddannelser: ["Betjent", "Civil", "Romeo", "Helikopter", "LIMA", "LIMA-A"] },
];

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
