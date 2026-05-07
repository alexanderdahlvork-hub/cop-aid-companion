-- ============================================
-- AVLD MDT — Personregister sync schema
-- Kører ovenpå mdt_komplet.sql
-- Dedup + konflikt-håndtering for sync
-- ============================================

-- Udvid `personer` med ESX-koblinger (sikkert idempotent)
ALTER TABLE `personer`
    ADD COLUMN IF NOT EXISTS `esx_identifier` VARCHAR(64) NULL,
    ADD COLUMN IF NOT EXISTS `kilde`          VARCHAR(32) NOT NULL DEFAULT 'manuel',
    ADD COLUMN IF NOT EXISTS `sidst_synced`   DATETIME NULL;

-- ── Dedup-oprydning FØR vi sætter unique-constraints ──

-- 1) Fjern duplikerede esx_identifier — behold ældste record
DELETE p1 FROM `personer` p1
INNER JOIN `personer` p2
    ON p1.esx_identifier = p2.esx_identifier
   AND p1.esx_identifier IS NOT NULL
   AND p1.esx_identifier <> ''
   AND p1.oprettet > p2.oprettet;

-- 2) Fjern duplikerede CPR — behold ældste record
DELETE p1 FROM `personer` p1
INNER JOIN `personer` p2
    ON p1.cpr = p2.cpr
   AND p1.cpr IS NOT NULL
   AND p1.cpr <> ''
   AND p1.oprettet > p2.oprettet;

-- ── Unique constraints (forhindrer fremtidige dubletter) ──
CREATE UNIQUE INDEX IF NOT EXISTS `idx_personer_esx_identifier`
    ON `personer` (`esx_identifier`);

CREATE UNIQUE INDEX IF NOT EXISTS `idx_personer_cpr_unique`
    ON `personer` (`cpr`);

-- Sync-log (valgfri — bruges til debug/audit)
CREATE TABLE IF NOT EXISTS `mdt_sync_log` (
    `id`         INT AUTO_INCREMENT PRIMARY KEY,
    `tidspunkt`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `kilde`      VARCHAR(32) NOT NULL,        -- 'boot' | 'join' | 'periodic' | 'manual'
    `oprettet`   INT NOT NULL DEFAULT 0,
    `opdateret`  INT NOT NULL DEFAULT 0,
    `fejl`       INT NOT NULL DEFAULT 0,
    `flettet`    INT NOT NULL DEFAULT 0,
    `note`       TEXT NULL
) ENGINE=InnoDB;

-- Sikre at flettet-kolonnen findes selv ved upgrade
ALTER TABLE `mdt_sync_log`
    ADD COLUMN IF NOT EXISTS `flettet` INT NOT NULL DEFAULT 0;
