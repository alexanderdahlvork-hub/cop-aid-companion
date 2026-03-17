-- ============================================
-- AVLD-Systems.dk – MDT Komplet Database
-- Én samlet SQL-fil til ALLE tabeller
-- ============================================

-- ── 1. Rang/Hierarki ──
CREATE TABLE IF NOT EXISTS `rang_order` (
  `id` TEXT PRIMARY KEY,
  `rang` TEXT UNIQUE NOT NULL,
  `position` INTEGER NOT NULL
);

INSERT OR IGNORE INTO `rang_order` (`id`, `rang`, `position`) VALUES
  ('r1', 'Rigspolitichef', 0),
  ('r2', 'Politidirektør', 1),
  ('r3', 'Politimester', 2),
  ('r4', 'Chefpolitiinspektør', 3),
  ('r5', 'Politiinspektør', 4),
  ('r6', 'Vicepolitiinspektør', 5),
  ('r7', 'Politikommissær', 6),
  ('r8', 'Politiassistent', 7),
  ('r9', 'Politibetjent', 8);

-- ── 2. Betjente (Officers) ──
CREATE TABLE IF NOT EXISTS `betjente` (
  `id` TEXT PRIMARY KEY,
  `badgeNr` TEXT UNIQUE NOT NULL,
  `fornavn` TEXT NOT NULL,
  `efternavn` TEXT NOT NULL,
  `rang` TEXT NOT NULL,
  `uddannelser` TEXT DEFAULT '[]',
  `afdeling` TEXT,
  `tilladelser` TEXT DEFAULT '[]',
  `kodeord` TEXT NOT NULL DEFAULT '1234',
  `foersteLogin` INTEGER NOT NULL DEFAULT 1
);

-- ── 3. Fyrede Medarbejdere ──
CREATE TABLE IF NOT EXISTS `fyrede_medarbejdere` (
  `id` TEXT PRIMARY KEY,
  `badgeNr` TEXT NOT NULL,
  `fornavn` TEXT NOT NULL,
  `efternavn` TEXT NOT NULL,
  `rang` TEXT NOT NULL,
  `fyretDato` TEXT NOT NULL,
  `fyretAf` TEXT NOT NULL
);

-- ── 4. Kriminalregister / Personer ──
CREATE TABLE IF NOT EXISTS `personer` (
  `id` TEXT PRIMARY KEY,
  `cpr` TEXT NOT NULL,
  `fornavn` TEXT NOT NULL,
  `efternavn` TEXT NOT NULL,
  `adresse` TEXT NOT NULL,
  `postnr` TEXT NOT NULL,
  `by` TEXT NOT NULL,
  `telefon` TEXT NOT NULL,
  `status` TEXT NOT NULL DEFAULT 'aktiv',
  `noter` TEXT DEFAULT '',
  `oprettet` TEXT NOT NULL
);

-- ── 5. Køretøjsregister ──
CREATE TABLE IF NOT EXISTS `koeretoejer` (
  `id` TEXT PRIMARY KEY,
  `nummerplade` TEXT UNIQUE NOT NULL,
  `maerke` TEXT NOT NULL,
  `model` TEXT NOT NULL,
  `aargang` TEXT NOT NULL,
  `farve` TEXT NOT NULL,
  `status` TEXT NOT NULL DEFAULT 'aktiv',
  `tildelt` TEXT DEFAULT '',
  `sidstService` TEXT,
  `km` INTEGER DEFAULT 0
);

-- ── 6. Bødetakster ──
CREATE TABLE IF NOT EXISTS `boeder` (
  `id` TEXT PRIMARY KEY,
  `paragraf` TEXT NOT NULL,
  `beskrivelse` TEXT NOT NULL,
  `beloeb` INTEGER NOT NULL,
  `kategori` TEXT NOT NULL,
  `klip` INTEGER DEFAULT 0,
  `frakendelse` TEXT DEFAULT '',
  `faengselMaaneder` INTEGER DEFAULT 0,
  `information` TEXT DEFAULT ''
);

-- ── 7. Ejendomsregister ──
CREATE TABLE IF NOT EXISTS `ejendomme` (
  `id` TEXT PRIMARY KEY,
  `adresse` TEXT NOT NULL,
  `postnr` TEXT NOT NULL,
  `by` TEXT NOT NULL,
  `ejer` TEXT NOT NULL,
  `ejerCpr` TEXT NOT NULL,
  `type` TEXT NOT NULL DEFAULT 'villa',
  `vurdering` INTEGER DEFAULT 0,
  `matrikelnr` TEXT DEFAULT '',
  `noter` TEXT DEFAULT '',
  `oprettet` TEXT NOT NULL
);

-- ── 8. Sigtelser ──
CREATE TABLE IF NOT EXISTS `sigtelser` (
  `id` TEXT PRIMARY KEY,
  `personId` TEXT NOT NULL,
  `personNavn` TEXT NOT NULL,
  `personCpr` TEXT NOT NULL,
  `dato` TEXT NOT NULL,
  `sigtelseBoeder` TEXT DEFAULT '[]',
  `totalBoede` INTEGER DEFAULT 0,
  `faengselMaaneder` INTEGER DEFAULT 0,
  `fratagKoerekort` INTEGER DEFAULT 0,
  `erkender` INTEGER,
  `involveretBetjente` TEXT DEFAULT '[]',
  `rapport` TEXT DEFAULT '{}',
  `skabelonType` TEXT DEFAULT '',
  `sagsStatus` TEXT DEFAULT 'aaben'
);

-- ── 9. Sager (Cases) ──
CREATE TABLE IF NOT EXISTS `sager` (
  `id` TEXT PRIMARY KEY,
  `sagsnummer` TEXT NOT NULL,
  `titel` TEXT NOT NULL DEFAULT '',
  `oprettet` TEXT NOT NULL,
  `opdateret` TEXT NOT NULL,
  `status` TEXT NOT NULL DEFAULT 'aaben',
  `oprettetAf` TEXT NOT NULL,
  `mistaenkte` TEXT DEFAULT '[]',
  `involveretBetjente` TEXT DEFAULT '[]',
  `involveretBorgere` TEXT DEFAULT '[]',
  `koeretoejer` TEXT DEFAULT '[]',
  `referencer` TEXT DEFAULT '[]',
  `tags` TEXT DEFAULT '[]',
  `beviser` TEXT DEFAULT '[]',
  `rapport` TEXT DEFAULT '{"haendelsesforloeb":"","konfiskeredeGenstande":[],"magtanvendelse":[]}',
  `noter` TEXT DEFAULT '[]',
  `aktivitetslog` TEXT DEFAULT '[]'
);

-- ── 10. Efterlysninger (Wanted) ──
CREATE TABLE IF NOT EXISTS `efterlysninger` (
  `id` TEXT PRIMARY KEY,
  `personId` TEXT NOT NULL,
  `personNavn` TEXT NOT NULL,
  `personCpr` TEXT NOT NULL,
  `begrundelse` TEXT NOT NULL DEFAULT '',
  `sigtelseBoeder` TEXT DEFAULT '[]',
  `totalBoede` INTEGER DEFAULT 0,
  `totalFaengsel` INTEGER DEFAULT 0,
  `oprettetAf` TEXT NOT NULL,
  `oprettetDato` TEXT NOT NULL,
  `aktiv` INTEGER NOT NULL DEFAULT 1
);

-- ── 11. Opslagstavle (Bulletin Board) ──
CREATE TABLE IF NOT EXISTS `opslag` (
  `id` TEXT PRIMARY KEY,
  `titel` TEXT NOT NULL,
  `indhold` TEXT NOT NULL DEFAULT '',
  `kategori` TEXT NOT NULL DEFAULT 'info',
  `forfatterNavn` TEXT NOT NULL,
  `forfatterBadge` TEXT NOT NULL,
  `oprettetDato` TEXT NOT NULL,
  `redigeretDato` TEXT
);

-- ── 12. NSK Tilhørsforhold (Gang Affiliations) ──
CREATE TABLE IF NOT EXISTS `nsk_tilhoersforhold` (
  `id` TEXT PRIMARY KEY,
  `personNavn` TEXT NOT NULL,
  `personCpr` TEXT NOT NULL,
  `bande` TEXT NOT NULL,
  `rolle` TEXT NOT NULL DEFAULT '',
  `status` TEXT NOT NULL DEFAULT 'aktiv',
  `noter` TEXT DEFAULT '',
  `tilfojetAf` TEXT NOT NULL,
  `tilfojetDato` TEXT NOT NULL
);

-- ── 13. Afdelingsindhold (Department Content) ──
CREATE TABLE IF NOT EXISTS `afdelingsindhold` (
  `id` TEXT PRIMARY KEY,
  `afdelingId` TEXT NOT NULL,
  `titel` TEXT NOT NULL,
  `indhold` TEXT NOT NULL DEFAULT '',
  `type` TEXT NOT NULL DEFAULT 'info',
  `pinned` INTEGER NOT NULL DEFAULT 0,
  `oprettetAf` TEXT NOT NULL,
  `oprettetDato` TEXT NOT NULL,
  `opdateretDato` TEXT
);

-- ── 14. Afdelings-tabs (Department Custom Tabs) ──
CREATE TABLE IF NOT EXISTS `afdelingstabs` (
  `id` TEXT PRIMARY KEY,
  `afdelingId` TEXT NOT NULL,
  `tabId` TEXT NOT NULL,
  `label` TEXT NOT NULL,
  `position` INTEGER NOT NULL DEFAULT 0,
  UNIQUE(`afdelingId`, `tabId`)
);

-- ── 15. Ansøgninger – Skabeloner ──
CREATE TABLE IF NOT EXISTS `ansoegning_skabeloner` (
  `id` TEXT PRIMARY KEY,
  `titel` TEXT NOT NULL,
  `kategori` TEXT NOT NULL DEFAULT 'uddannelse',
  `beskrivelse` TEXT NOT NULL DEFAULT '',
  `spoergsmaal` TEXT DEFAULT '[]',
  `aktiv` INTEGER NOT NULL DEFAULT 1,
  `oprettetAf` TEXT NOT NULL
);

-- ── 16. Ansøgninger – Indsendelser ──
CREATE TABLE IF NOT EXISTS `ansoegning_indsendelser` (
  `id` TEXT PRIMARY KEY,
  `skabelonId` TEXT NOT NULL,
  `skabelonTitel` TEXT NOT NULL,
  `ansoegerNavn` TEXT NOT NULL,
  `ansoegerBadge` TEXT NOT NULL,
  `svar` TEXT DEFAULT '{}',
  `status` TEXT NOT NULL DEFAULT 'afventer',
  `dato` TEXT NOT NULL,
  `behandletAf` TEXT,
  `kommentar` TEXT
);

-- ── 17. Patruljer (Fleet) ──
CREATE TABLE IF NOT EXISTS `patruljer` (
  `id` TEXT PRIMARY KEY,
  `navn` TEXT NOT NULL,
  `kategori` TEXT NOT NULL,
  `pladser` INTEGER NOT NULL DEFAULT 2,
  `medlemmer` TEXT DEFAULT '[]',
  `status` TEXT NOT NULL DEFAULT 'ledig',
  `bemaerkning` TEXT DEFAULT ''
);

INSERT OR IGNORE INTO `patruljer` (`id`, `navn`, `kategori`, `pladser`) VALUES
  ('lima-01', 'Lima 01', 'Lima', 2),
  ('foxtrot-11', 'Foxtrot 11', 'Foxtrot', 2),
  ('bravo-21', 'Bravo 21', 'Bravo', 2),
  ('bravo-22', 'Bravo 22', 'Bravo', 2),
  ('bravo-23', 'Bravo 23', 'Bravo', 2),
  ('bravo-24', 'Bravo 24', 'Bravo', 2),
  ('bravo-25', 'Bravo 25', 'Bravo', 2),
  ('bravo-26', 'Bravo 26', 'Bravo', 2),
  ('bravo-27', 'Bravo 27', 'Bravo', 2),
  ('bravo-28', 'Bravo 28', 'Bravo', 2),
  ('bravo-29', 'Bravo 29', 'Bravo', 2),
  ('bravo-30', 'Bravo 30', 'Bravo', 2),
  ('bravo-31', 'Bravo 31', 'Bravo', 2),
  ('bravo-32', 'Bravo 32', 'Bravo', 2),
  ('bravo-33', 'Bravo 33', 'Bravo', 2),
  ('bravo-34', 'Bravo 34', 'Bravo', 2),
  ('bravo-35', 'Bravo 35', 'Bravo', 2),
  ('bravo-36', 'Bravo 36', 'Bravo', 2),
  ('bravo-37', 'Bravo 37', 'Bravo', 2),
  ('bravo-38', 'Bravo 38', 'Bravo', 2),
  ('bravo-39', 'Bravo 39', 'Bravo', 2),
  ('bravo-40', 'Bravo 40', 'Bravo', 2),
  ('mike-20', 'Mike 20', 'Mike', 1),
  ('mike-43', 'Mike 43', 'Mike', 1),
  ('mike-44', 'Mike 44', 'Mike', 1),
  ('mike-45', 'Mike 45', 'Mike', 1),
  ('mike-46', 'Mike 46', 'Mike', 1),
  ('romeo-13', 'Romeo 13', 'Romeo', 2),
  ('mk-20', 'Mike Kilo 20', 'Mike Kilo', 3),
  ('mk-35', 'Mike Kilo 35', 'Mike Kilo', 3),
  ('kilo-16', 'Kilo 16', 'Kilo', 2),
  ('kilo-17', 'Kilo 17', 'Kilo', 2),
  ('kilo-18', 'Kilo 18', 'Kilo', 2),
  ('s-1', 'S 1', 'Stab', 4),
  ('s-2', 'S 2', 'Stab', 4);

-- ── 18. Opgaver (Dispatch) ──
CREATE TABLE IF NOT EXISTS `opgaver` (
  `id` TEXT PRIMARY KEY,
  `typeId` TEXT NOT NULL,
  `typeNavn` TEXT NOT NULL,
  `prioritet` TEXT NOT NULL DEFAULT 'medium',
  `adresse` TEXT NOT NULL,
  `beskrivelse` TEXT DEFAULT '',
  `tildeltPatruljer` TEXT DEFAULT '[]',
  `oprettet` TEXT NOT NULL,
  `status` TEXT NOT NULL DEFAULT 'aktiv'
);

-- ============================================
-- AVLD-Systems.dk – Komplet MDT Database
-- 18 tabeller – alt linket op
-- ============================================
