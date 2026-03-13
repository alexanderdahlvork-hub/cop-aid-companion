-- ============================================
-- MDT Sagssystem - SQL Tabeller
-- ============================================

-- Hovedtabel: Sager
CREATE TABLE IF NOT EXISTS `mdt_sager` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `sagsnummer` VARCHAR(32) NOT NULL UNIQUE,
  `titel` VARCHAR(255) NOT NULL DEFAULT '',
  `status` ENUM('aaben','under_efterforskning','afventer_retten','lukket') NOT NULL DEFAULT 'aaben',
  `oprettet_af` VARCHAR(128) NOT NULL,
  `oprettet` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `opdateret` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `rapport_haendelsesforloeb` TEXT,
  `rapport_konfiskerede` JSON,
  `rapport_magtanvendelse` JSON,
  `rapport_skabelon_type` VARCHAR(64),
  `rapport_skabelon_svar` JSON,
  INDEX `idx_status` (`status`),
  INDEX `idx_sagsnummer` (`sagsnummer`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Mistænkte knyttet til en sag
CREATE TABLE IF NOT EXISTS `mdt_sag_mistaenkte` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `sag_id` VARCHAR(64) NOT NULL,
  `person_id` VARCHAR(64) NOT NULL,
  `person_navn` VARCHAR(128) NOT NULL,
  `person_cpr` VARCHAR(32) NOT NULL,
  `total_boede` INT NOT NULL DEFAULT 0,
  `total_faengsel` INT NOT NULL DEFAULT 0,
  `erkender` TINYINT DEFAULT NULL,       -- NULL=ikke besvaret, 0=nej, 1=ja
  `behandlet` TINYINT NOT NULL DEFAULT 0,
  `tilkendegivelse_afgivet` TINYINT NOT NULL DEFAULT 0,
  `fratag_koerekort` TINYINT NOT NULL DEFAULT 0,
  FOREIGN KEY (`sag_id`) REFERENCES `mdt_sager`(`id`) ON DELETE CASCADE,
  INDEX `idx_sag` (`sag_id`),
  INDEX `idx_person` (`person_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Sigtelser pr. mistænkt
CREATE TABLE IF NOT EXISTS `mdt_sag_sigtelser` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `mistaenkt_id` VARCHAR(64) NOT NULL,
  `sag_id` VARCHAR(64) NOT NULL,
  `boede_id` VARCHAR(64) NOT NULL,
  `paragraf` VARCHAR(64) NOT NULL DEFAULT '',
  `beskrivelse` VARCHAR(255) NOT NULL DEFAULT '',
  `beloeb` INT NOT NULL DEFAULT 0,
  `faengsel_maaneder` INT NOT NULL DEFAULT 0,
  FOREIGN KEY (`mistaenkt_id`) REFERENCES `mdt_sag_mistaenkte`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`sag_id`) REFERENCES `mdt_sager`(`id`) ON DELETE CASCADE,
  INDEX `idx_mistaenkt` (`mistaenkt_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Beviser
CREATE TABLE IF NOT EXISTS `mdt_sag_beviser` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `sag_id` VARCHAR(64) NOT NULL,
  `type` ENUM('billede','tekst') NOT NULL DEFAULT 'tekst',
  `billed_url` TEXT,
  `beskrivelse` TEXT NOT NULL,
  `timestamp` VARCHAR(32),
  `oprettet_af` VARCHAR(128) NOT NULL,
  `oprettet_dato` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`sag_id`) REFERENCES `mdt_sager`(`id`) ON DELETE CASCADE,
  INDEX `idx_sag` (`sag_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Involverede betjente
CREATE TABLE IF NOT EXISTS `mdt_sag_betjente` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `sag_id` VARCHAR(64) NOT NULL,
  `betjent_id` VARCHAR(64) NOT NULL,
  FOREIGN KEY (`sag_id`) REFERENCES `mdt_sager`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `uk_sag_betjent` (`sag_id`, `betjent_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Involverede borgere
CREATE TABLE IF NOT EXISTS `mdt_sag_borgere` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `sag_id` VARCHAR(64) NOT NULL,
  `person_id` VARCHAR(64) NOT NULL,
  `navn` VARCHAR(128) NOT NULL,
  `cpr` VARCHAR(32) NOT NULL,
  `rolle` VARCHAR(32) NOT NULL DEFAULT 'Anden',
  FOREIGN KEY (`sag_id`) REFERENCES `mdt_sager`(`id`) ON DELETE CASCADE,
  INDEX `idx_sag` (`sag_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Køretøjer
CREATE TABLE IF NOT EXISTS `mdt_sag_koeretoejer` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `sag_id` VARCHAR(64) NOT NULL,
  `nummerplade` VARCHAR(16) NOT NULL,
  `beskrivelse` VARCHAR(255) DEFAULT '',
  FOREIGN KEY (`sag_id`) REFERENCES `mdt_sager`(`id`) ON DELETE CASCADE,
  INDEX `idx_sag` (`sag_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Referencer
CREATE TABLE IF NOT EXISTS `mdt_sag_referencer` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `sag_id` VARCHAR(64) NOT NULL,
  `titel` VARCHAR(255) NOT NULL,
  `url` TEXT,
  `beskrivelse` TEXT,
  FOREIGN KEY (`sag_id`) REFERENCES `mdt_sager`(`id`) ON DELETE CASCADE,
  INDEX `idx_sag` (`sag_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tags
CREATE TABLE IF NOT EXISTS `mdt_sag_tags` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `sag_id` VARCHAR(64) NOT NULL,
  `tag` VARCHAR(64) NOT NULL,
  FOREIGN KEY (`sag_id`) REFERENCES `mdt_sager`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `uk_sag_tag` (`sag_id`, `tag`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Aktivitetslog
CREATE TABLE IF NOT EXISTS `mdt_sag_aktivitetslog` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `sag_id` VARCHAR(64) NOT NULL,
  `type` VARCHAR(32) NOT NULL,
  `beskrivelse` TEXT NOT NULL,
  `bruger` VARCHAR(128) NOT NULL,
  `tidspunkt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`sag_id`) REFERENCES `mdt_sager`(`id`) ON DELETE CASCADE,
  INDEX `idx_sag` (`sag_id`),
  INDEX `idx_tidspunkt` (`tidspunkt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Betjent noter
CREATE TABLE IF NOT EXISTS `mdt_sag_noter` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `sag_id` VARCHAR(64) NOT NULL,
  `tekst` TEXT NOT NULL,
  `oprettet_af` VARCHAR(128) NOT NULL,
  `oprettet_dato` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`sag_id`) REFERENCES `mdt_sager`(`id`) ON DELETE CASCADE,
  INDEX `idx_sag` (`sag_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
