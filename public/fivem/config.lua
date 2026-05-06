-- ============================================
-- AVLD Systems MDT - Konfiguration
-- ============================================

Config = {}

-- ── Adgang ──
-- Kun spillere med dette ESX-job kan åbne MDT'en
Config.AllowedJobs = { "police" }

-- Mindste job-grade for at få admin-rettigheder i MDT (0 = alle politifolk)
-- Sættes til fx 4 hvis kun "Politichef" og opefter skal være admin
Config.AdminMinGrade = 4

-- ── Kommando / keybind ──
Config.Command       = "mdt"
Config.KeyMapping    = "F6"   -- Default keybind (kan ændres af spilleren via FiveM-indstillinger)

-- ── Spiller-sync (ESX -> personregister) ──
-- true: Server kører fuld SELECT på ESX users-tabellen ved resource-start og
--       opretter/opdaterer en person-record for hver spiller i mdt_personer.
Config.SyncOnBoot       = true

-- true: Når en spiller logger ind via ESX, oprettes/opdateres deres person-record automatisk.
Config.SyncOnPlayerJoin = true

-- Periodisk re-sync interval i minutter (0 = deaktiveret).
-- Anbefalet 30-60 minutter for store servere.
Config.PeriodicSyncMinutes = 30

-- Hvilken ESX users-tabel kolonne bruges som unik identifier (typisk 'identifier' = license:xxxx)
Config.IdentifierColumn = "identifier"

-- ── ESX detection ──
-- "auto" forsøger først es_extended (Legacy 1.10+) og falder tilbage til 'esx:getSharedObject'
Config.ESXMode = "auto"   -- "auto" | "legacy" | "old"

-- ── Branding ──
Config.ResourceName = "avld_mdt"   -- Skal matche mappenavnet i din resources-folder

-- ── Debug ──
Config.Debug = false
