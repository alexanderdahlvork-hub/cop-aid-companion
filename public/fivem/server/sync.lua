-- ============================================
-- AVLD MDT — Personregister sync (ESX users -> mdt personer)
-- ============================================

local function dbg(...)
    if Config.Debug then print("[AVLD MDT][sync]", ...) end
end

local function genId()
    return ("p_%d_%d"):format(os.time(), math.random(100000, 999999))
end

local function nowDate()
    return os.date("%Y-%m-%d %H:%M:%S")
end

-- Forsøger at hente fornavn/efternavn fra et ESX users-row.
-- Understøtter både Legacy (firstname/lastname kolonner) og ældre (charinfo JSON).
local function extractName(row)
    if row.firstname and row.firstname ~= "" then
        return row.firstname, (row.lastname or "")
    end
    -- Charinfo JSON?
    if row.charinfo and type(row.charinfo) == "string" then
        local ok, ci = pcall(json.decode, row.charinfo)
        if ok and ci then
            return ci.firstname or "", ci.lastname or ""
        end
    end
    -- Fald tilbage til 'name' kolonne
    if row.name and row.name ~= "" then
        local fn, ln = row.name:match("^(%S+)%s+(.+)$")
        return fn or row.name, ln or ""
    end
    return "Ukendt", ""
end

local function extractPhone(row)
    if row.phone_number and row.phone_number ~= "" then return tostring(row.phone_number) end
    if row.phoneNumber and row.phoneNumber ~= "" then return tostring(row.phoneNumber) end
    return ""
end

local function extractCpr(row, identifier)
    -- Prøv typiske kolonner
    if row.cpr and row.cpr ~= "" then return tostring(row.cpr) end
    if row.dateofbirth and row.dateofbirth ~= "" then
        return tostring(row.dateofbirth):gsub("-", ""):sub(1,8)
    end
    -- Generér deterministisk fra identifier som fallback
    local hash = 0
    for i = 1, #identifier do
        hash = (hash * 31 + identifier:byte(i)) % 1000000
    end
    return string.format("%06d-%04d", hash, math.random(1000, 9999))
end

-- ── Upsert én spiller ──
local function upsertPerson(identifier, fornavn, efternavn, telefon, cpr, kilde, cb)
    if not identifier or identifier == "" then if cb then cb(false) end return end

    MySQL.Async.fetchAll('SELECT id FROM personer WHERE esx_identifier = @id LIMIT 1', {
        ['@id'] = identifier,
    }, function(rows)
        if rows and rows[1] then
            -- Opdater
            MySQL.Async.execute([[
                UPDATE personer
                SET fornavn = @fn, efternavn = @ln, telefon = @tlf,
                    sidst_synced = @ts, kilde = @kilde
                WHERE esx_identifier = @id
            ]], {
                ['@fn'] = fornavn, ['@ln'] = efternavn, ['@tlf'] = telefon,
                ['@ts'] = nowDate(), ['@kilde'] = kilde, ['@id'] = identifier,
            }, function() if cb then cb("opdateret") end end)
        else
            -- Opret
            MySQL.Async.execute([[
                INSERT INTO personer
                    (id, cpr, fornavn, efternavn, adresse, postnr, by, telefon, status, noter, oprettet,
                     esx_identifier, kilde, sidst_synced)
                VALUES
                    (@id, @cpr, @fn, @ln, '', '', '', @tlf, 'aktiv', '', @opr,
                     @eid, @kilde, @ts)
            ]], {
                ['@id']  = genId(),
                ['@cpr'] = cpr,
                ['@fn']  = fornavn,
                ['@ln']  = efternavn,
                ['@tlf'] = telefon,
                ['@opr'] = nowDate(),
                ['@eid'] = identifier,
                ['@kilde'] = kilde,
                ['@ts']  = nowDate(),
            }, function() if cb then cb("oprettet") end end)
        end
    end)
end

-- ── Fuld sync af ESX users-tabellen ──
function SyncAllPlayersFromDB(kilde, doneCb)
    kilde = kilde or "manual"
    dbg("Starter fuld sync (kilde="..kilde..")")

    MySQL.Async.fetchAll('SELECT * FROM users', {}, function(rows)
        if not rows then
            print("[AVLD MDT][sync] ^1Kunne ikke læse users-tabellen^7")
            if doneCb then doneCb(0, 0, 1) end
            return
        end

        local oprettet, opdateret, fejl = 0, 0, 0
        local total = #rows
        local processed = 0

        if total == 0 then
            print("[AVLD MDT][sync] users-tabellen er tom")
            if doneCb then doneCb(0, 0, 0) end
            return
        end

        for _, row in ipairs(rows) do
            local identifier = row[Config.IdentifierColumn] or row.identifier
            if identifier and identifier ~= "" then
                local fn, ln  = extractName(row)
                local telefon = extractPhone(row)
                local cpr     = extractCpr(row, identifier)

                upsertPerson(identifier, fn, ln, telefon, cpr, kilde, function(result)
                    if result == "oprettet" then oprettet = oprettet + 1
                    elseif result == "opdateret" then opdateret = opdateret + 1
                    else fejl = fejl + 1 end

                    processed = processed + 1
                    if processed >= total then
                        MySQL.Async.execute([[
                            INSERT INTO mdt_sync_log (kilde, oprettet, opdateret, fejl, note)
                            VALUES (@k, @o, @u, @f, @n)
                        ]], {
                            ['@k'] = kilde, ['@o'] = oprettet, ['@u'] = opdateret,
                            ['@f'] = fejl, ['@n'] = ('Sync %d spillere'):format(total),
                        })
                        print(("[AVLD MDT][sync] Færdig: %d oprettet, %d opdateret, %d fejl (kilde=%s)"):format(
                            oprettet, opdateret, fejl, kilde))
                        if doneCb then doneCb(oprettet, opdateret, fejl) end
                    end
                end)
            else
                processed = processed + 1
                fejl = fejl + 1
            end
        end
    end)
end

-- ── Sync enkelt spiller (on-join) ──
function SyncSinglePlayer(src, kilde)
    kilde = kilde or "join"
    local identifier = GetIdentifier(src)
    if not identifier then return end

    MySQL.Async.fetchAll('SELECT * FROM users WHERE '..Config.IdentifierColumn..' = @id LIMIT 1', {
        ['@id'] = identifier,
    }, function(rows)
        if not rows or not rows[1] then
            dbg("Kunne ikke finde spiller "..identifier.." i users-tabellen")
            return
        end
        local row = rows[1]
        local fn, ln  = extractName(row)
        local telefon = extractPhone(row)
        local cpr     = extractCpr(row, identifier)

        upsertPerson(identifier, fn, ln, telefon, cpr, kilde, function(result)
            dbg(("Spiller %s %s synced (%s)"):format(fn, ln, result or "ok"))
        end)
    end)
end

-- ── Triggers ──

-- Boot-sync når resource starter (vent på DB)
AddEventHandler('onResourceStart', function(res)
    if res ~= GetCurrentResourceName() then return end
    if not Config.SyncOnBoot then return end

    SetTimeout(5000, function()
        SyncAllPlayersFromDB("boot")
    end)
end)

-- Sync ved spiller-login
AddEventHandler('esx:playerLoaded', function(playerId, xPlayer)
    if not Config.SyncOnPlayerJoin then return end
    SyncSinglePlayer(playerId, "join")
end)

-- Periodisk sync
CreateThread(function()
    if Config.PeriodicSyncMinutes <= 0 then return end
    while true do
        Wait(Config.PeriodicSyncMinutes * 60 * 1000)
        SyncAllPlayersFromDB("periodic")
    end
end)

-- ── Manuel kommando: /mdtsync ──
RegisterCommand('mdtsync', function(source, args)
    if source ~= 0 then
        local x = GetXPlayer(source)
        if not x or not x.getGroup or x.getGroup() ~= "admin" and x.getGroup() ~= "superadmin" then
            return
        end
    end
    print("[AVLD MDT] Manuel sync startet...")
    SyncAllPlayersFromDB("manual", function(o, u, f)
        if source ~= 0 then
            TriggerClientEvent('chat:addMessage', source, {
                args = {"^2[MDT]", ("Sync færdig: %d oprettet, %d opdateret, %d fejl"):format(o, u, f)},
            })
        end
    end)
end, true)
