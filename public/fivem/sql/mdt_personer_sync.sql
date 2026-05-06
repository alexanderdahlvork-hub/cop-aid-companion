-- ============================================
-- AVLD MDT — Personregister sync schema
-- Kører ovenpå mdt_komplet.sql
-- ============================================

-- Udvid `personer` med ESX-koblinger (sikkert idempotent)
ALTER TABLE `personer`
    ADD COLUMN IF NOT EXISTS `esx_identifier` VARCHAR(64) NULL,
    ADD COLUMN IF NOT EXISTS `kilde`          VARCHAR(32) NOT NULL DEFAULT 'manuel',
    ADD COLUMN IF NOT EXISTS `sidst_synced`   DATETIME NULL;

CREATE UNIQUE INDEX IF NOT EXISTS `idx_personer_esx_identifier`
    ON `personer` (`esx_identifier`);

CREATE INDEX IF NOT EXISTS `idx_personer_cpr` ON `personer` (`cpr`);

-- Sync-log (valgfri — bruges til debug/audit)
CREATE TABLE IF NOT EXISTS `mdt_sync_log` (
    `id`         INT AUTO_INCREMENT PRIMARY KEY,
    `tidspunkt`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `kilde`      VARCHAR(32) NOT NULL,        -- 'boot' | 'join' | 'periodic' | 'manual'
    `oprettet`   INT NOT NULL DEFAULT 0,
    `opdateret`  INT NOT NULL DEFAULT 0,
    `fejl`       INT NOT NULL DEFAULT 0,
    `note`       TEXT NULL
) ENGINE=InnoDB;
