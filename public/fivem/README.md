# AVLD Systems MDT — FiveM ESX Resource

Komplet politi-tablet til **ESX**-servere med automatisk import af alle spillere til personregistret via serverens database.

## Funktioner

- **Hele MDT-tabletten** (sager, sigtelser, beviser, personregister, køretøjs­register, ejendomsregister, efterlysninger, flåde, opslagstavle, ansøgninger, NSK m.m.)
- **Auto-detect ESX** (Legacy 1.10+ og ældre `esx:getSharedObject`)
- **mysql-async** som database-bibliotek
- **Auto-sync af spillere → personregister**:
  - Fuld sync ved resource-start
  - Live sync når spiller logger ind
  - Periodisk re-sync hver X minutter
  - Manuel kommando `/mdtsync`
- **Adgangskontrol**: kun ESX-job `police` kan åbne tabletten
- **Keybind F6** (kan ændres af spilleren via FiveM-indstillinger)

## Installation

1. **Kopier mappen** til `resources/[avld]/avld_mdt`
2. **Importér database-skemaer** i denne rækkefølge:
   ```sql
   SOURCE sql/mdt_komplet.sql;
   SOURCE sql/mdt_sager.sql;
   SOURCE sql/mdt_personer_sync.sql;
   ```
3. **Start resource** i `server.cfg` — sørg for at den starter EFTER `mysql-async` og `es_extended`:
   ```
   ensure mysql-async
   ensure es_extended
   ensure avld_mdt
   ```
4. **Konfigurer** `config.lua` efter behov:
   - `Config.AllowedJobs` — hvilke ESX-jobs har adgang
   - `Config.AdminMinGrade` — min. grade for admin i MDT
   - `Config.PeriodicSyncMinutes` — hvor ofte spillere re-synces
   - `Config.IdentifierColumn` — typisk `identifier` (license:xxxx)

## Brug

| Kommando / handling | Hvad sker der |
|--------------------|---------------|
| `/mdt` eller **F6** | Åbner tabletten (kun politi) |
| `ESC` (i tablet) | Lukker tabletten |
| `/mdtsync` (admin) | Manuel re-sync af alle spillere fra `users` |

## Person-sync — hvordan virker det?

Resource'en læser hele ESX `users`-tabellen og opretter en `personer`-record for hver spiller med:

- `esx_identifier` ← `users.identifier`
- `fornavn` / `efternavn` ← `users.firstname`/`lastname` ELLER fra `charinfo` JSON
- `telefon` ← `users.phone_number`
- `cpr` ← `users.dateofbirth` (eller deterministisk hash hvis tom)
- `kilde` ← `'boot' | 'join' | 'periodic' | 'manual'`

Findes spilleren allerede (matcher på `esx_identifier`), opdateres deres data — der oprettes ikke duplikater.

Sync-aktivitet logges i `mdt_sync_log` for audit.

## Filstruktur

```
avld_mdt/
├── fxmanifest.lua
├── config.lua
├── client/
│   └── main.lua          (NUI toggle, keybind, bridge)
├── server/
│   ├── esx.lua           (ESX auto-detect)
│   ├── jobcheck.lua      (police-adgang)
│   ├── sync.lua          (users → personer auto-sync)
│   └── main.lua          (CRUD: personer, sager, betjente, m.m.)
├── nui/
│   ├── index.html        (NUI wrapper)
│   ├── style.css
│   ├── script.js         (postMessage-bridge)
│   └── mdt.html          (hele MDT-applikationen)
└── sql/
    ├── mdt_komplet.sql
    ├── mdt_sager.sql
    └── mdt_personer_sync.sql
```

## Fejlfinding

- **"ESX kunne ikke findes"** → tjek at `es_extended` starter før `avld_mdt` i `server.cfg`
- **Personregister er tomt** → kør `/mdtsync` som admin og tjek konsol-output
- **MDT åbner ikke** → tjek at din spiller har `job = 'police'` i ESX
- **Database-fejl ved sync** → tjek at `Config.IdentifierColumn` matcher din `users`-tabel (default `identifier`)

---

**AVLD Systems** — version 2.0.0
