-- ============================================
-- AVLD MDT — Server main (mysql-async)
-- Sager, sigtelser, beviser, personregister-CRUD
-- ============================================

local function genId()
    return tostring(GetGameTimer()) .. tostring(math.random(10000, 99999))
end

local function genSagsnr()
    return "SAG-" .. tostring(os.time()):sub(-6)
end

-- ────────────────────────────────────────────
-- PERSONREGISTER (mdt:personer:*)
-- ────────────────────────────────────────────

RegisterNetEvent('avld_mdt:personer:getAll')
AddEventHandler('avld_mdt:personer:getAll', function()
    local src = source
    MySQL.Async.fetchAll('SELECT * FROM personer ORDER BY efternavn, fornavn', {}, function(rows)
        TriggerClientEvent('avld_mdt:client:personerData', src, rows or {})
    end)
end)

RegisterNetEvent('avld_mdt:personer:create')
AddEventHandler('avld_mdt:personer:create', function(p)
    local src = source
    MySQL.Async.execute([[
        INSERT INTO personer (id, cpr, fornavn, efternavn, adresse, postnr, by, telefon, status, noter, oprettet, kilde)
        VALUES (@id, @cpr, @fn, @ln, @adr, @pnr, @by, @tlf, @st, @no, @opr, 'manuel')
    ]], {
        ['@id']=p.id or genId(), ['@cpr']=p.cpr or '', ['@fn']=p.fornavn or '',
        ['@ln']=p.efternavn or '', ['@adr']=p.adresse or '', ['@pnr']=p.postnr or '',
        ['@by']=p.by or '', ['@tlf']=p.telefon or '', ['@st']=p.status or 'aktiv',
        ['@no']=p.noter or '', ['@opr']=os.date('%Y-%m-%d %H:%M:%S'),
    }, function() TriggerClientEvent('avld_mdt:client:personerRefresh', src) end)
end)

RegisterNetEvent('avld_mdt:personer:update')
AddEventHandler('avld_mdt:personer:update', function(p)
    local src = source
    if not p or not p.id then return end
    MySQL.Async.execute([[
        UPDATE personer SET cpr=@cpr, fornavn=@fn, efternavn=@ln, adresse=@adr,
            postnr=@pnr, by=@by, telefon=@tlf, status=@st, noter=@no
        WHERE id=@id
    ]], {
        ['@id']=p.id, ['@cpr']=p.cpr or '', ['@fn']=p.fornavn or '',
        ['@ln']=p.efternavn or '', ['@adr']=p.adresse or '', ['@pnr']=p.postnr or '',
        ['@by']=p.by or '', ['@tlf']=p.telefon or '', ['@st']=p.status or 'aktiv',
        ['@no']=p.noter or '',
    }, function() TriggerClientEvent('avld_mdt:client:personerRefresh', src) end)
end)

RegisterNetEvent('avld_mdt:personer:delete')
AddEventHandler('avld_mdt:personer:delete', function(id)
    local src = source
    MySQL.Async.execute('DELETE FROM personer WHERE id=@id', { ['@id']=id }, function()
        TriggerClientEvent('avld_mdt:client:personerRefresh', src)
    end)
end)

-- ────────────────────────────────────────────
-- SAGER
-- ────────────────────────────────────────────

RegisterNetEvent('avld_mdt:sager:getAll')
AddEventHandler('avld_mdt:sager:getAll', function()
    local src = source
    MySQL.Async.fetchAll('SELECT * FROM sager ORDER BY opdateret DESC', {}, function(rows)
        TriggerClientEvent('avld_mdt:client:sagerData', src, rows or {})
    end)
end)

RegisterNetEvent('avld_mdt:sager:save')
AddEventHandler('avld_mdt:sager:save', function(sag)
    local src = source
    if not sag then return end
    sag.id         = sag.id or genId()
    sag.sagsnummer = sag.sagsnummer or genSagsnr()

    -- Tjek om sagen findes
    MySQL.Async.fetchScalar('SELECT id FROM sager WHERE id=@id', { ['@id']=sag.id }, function(existing)
        if existing then
            MySQL.Async.execute([[
                UPDATE sager SET titel=@t, status=@s, opdateret=@up
                WHERE id=@id
            ]], {
                ['@id']=sag.id, ['@t']=sag.titel or '',
                ['@s']=sag.status or 'aaben',
                ['@up']=os.date('%Y-%m-%d %H:%M:%S'),
            }, function() TriggerClientEvent('avld_mdt:client:sagerRefresh', src) end)
        else
            MySQL.Async.execute([[
                INSERT INTO sager (id, sagsnummer, titel, status, oprettet_af, oprettet, opdateret)
                VALUES (@id, @nr, @t, @s, @oa, @opr, @up)
            ]], {
                ['@id']=sag.id, ['@nr']=sag.sagsnummer, ['@t']=sag.titel or '',
                ['@s']=sag.status or 'aaben', ['@oa']=sag.oprettetAf or '',
                ['@opr']=os.date('%Y-%m-%d %H:%M:%S'),
                ['@up']=os.date('%Y-%m-%d %H:%M:%S'),
            }, function() TriggerClientEvent('avld_mdt:client:sagerRefresh', src) end)
        end
    end)
end)

RegisterNetEvent('avld_mdt:sager:delete')
AddEventHandler('avld_mdt:sager:delete', function(id)
    local src = source
    MySQL.Async.execute('DELETE FROM sager WHERE id=@id', { ['@id']=id }, function()
        TriggerClientEvent('avld_mdt:client:sagerRefresh', src)
    end)
end)

-- ────────────────────────────────────────────
-- BETJENTE
-- ────────────────────────────────────────────

RegisterNetEvent('avld_mdt:betjente:getAll')
AddEventHandler('avld_mdt:betjente:getAll', function()
    local src = source
    MySQL.Async.fetchAll('SELECT * FROM betjente ORDER BY efternavn, fornavn', {}, function(rows)
        TriggerClientEvent('avld_mdt:client:betjenteData', src, rows or {})
    end)
end)

-- ────────────────────────────────────────────
-- KØRETØJER
-- ────────────────────────────────────────────

RegisterNetEvent('avld_mdt:koeretoejer:getAll')
AddEventHandler('avld_mdt:koeretoejer:getAll', function()
    local src = source
    MySQL.Async.fetchAll('SELECT * FROM koeretoejer ORDER BY nummerplade', {}, function(rows)
        TriggerClientEvent('avld_mdt:client:koeretoejerData', src, rows or {})
    end)
end)

-- ────────────────────────────────────────────
-- BØDETAKSTER
-- ────────────────────────────────────────────

RegisterNetEvent('avld_mdt:boeder:getAll')
AddEventHandler('avld_mdt:boeder:getAll', function()
    local src = source
    MySQL.Async.fetchAll('SELECT * FROM boeder ORDER BY paragraf', {}, function(rows)
        TriggerClientEvent('avld_mdt:client:boederData', src, rows or {})
    end)
end)

-- ────────────────────────────────────────────
-- EFTERLYSNINGER
-- ────────────────────────────────────────────

RegisterNetEvent('avld_mdt:efterlysninger:getAll')
AddEventHandler('avld_mdt:efterlysninger:getAll', function()
    local src = source
    MySQL.Async.fetchAll('SELECT * FROM efterlysninger ORDER BY oprettet DESC', {}, function(rows)
        TriggerClientEvent('avld_mdt:client:efterlysningerData', src, rows or {})
    end)
end)

-- ────────────────────────────────────────────
-- Generisk passthrough for resterende moduler
-- (opslag, ejendomme, sigtelser, NSK, m.m.)
-- ────────────────────────────────────────────

local SAFE_TABLES = {
    opslag = true, ejendomme = true, sigtelser = true,
    nsk_tilhoersforhold = true, afdelingsindhold = true, afdelingstabs = true,
    ansoegning_skabeloner = true, ansoegning_indsendelser = true,
    patruljer = true, opgaver = true, fyrede_medarbejdere = true,
    rang_order = true,
}

RegisterNetEvent('avld_mdt:db:fetchAll')
AddEventHandler('avld_mdt:db:fetchAll', function(table)
    local src = source
    if not SAFE_TABLES[table] then return end
    MySQL.Async.fetchAll('SELECT * FROM `'..table..'`', {}, function(rows)
        TriggerClientEvent('avld_mdt:client:tableData', src, table, rows or {})
    end)
end)

print("[AVLD MDT] Server main loaded — Personer, Sager, Betjente, Køretøjer, Bøder, Efterlysninger")
