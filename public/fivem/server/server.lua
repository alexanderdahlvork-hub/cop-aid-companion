-- ============================================
-- MDT Sagssystem - Server Side (Lua)
-- ============================================

local function generateId()
    return tostring(GetGameTimer()) .. tostring(math.random(10000, 99999))
end

local function generateSagsnummer()
    return "SAG-" .. tostring(os.time()):sub(-6)
end

-- ── Hent alle sager ──
RegisterNetEvent('mdt:server:getSager')
AddEventHandler('mdt:server:getSager', function()
    local src = source
    exports.oxmysql:execute('SELECT * FROM mdt_sager ORDER BY opdateret DESC', {}, function(sager)
        if not sager then
            TriggerClientEvent('mdt:client:receiveSager', src, {})
            return
        end

        local result = {}
        for _, sag in ipairs(sager) do
            -- Hent relaterede data
            local mistaenkte = exports.oxmysql:executeSync('SELECT * FROM mdt_sag_mistaenkte WHERE sag_id = ?', { sag.id })
            for _, m in ipairs(mistaenkte or {}) do
                m.sigtelser = exports.oxmysql:executeSync('SELECT * FROM mdt_sag_sigtelser WHERE mistaenkt_id = ?', { m.id }) or {}
            end

            local beviser = exports.oxmysql:executeSync('SELECT * FROM mdt_sag_beviser WHERE sag_id = ?', { sag.id })
            local betjente = exports.oxmysql:executeSync('SELECT betjent_id FROM mdt_sag_betjente WHERE sag_id = ?', { sag.id })
            local borgere = exports.oxmysql:executeSync('SELECT * FROM mdt_sag_borgere WHERE sag_id = ?', { sag.id })
            local koeretoejer = exports.oxmysql:executeSync('SELECT * FROM mdt_sag_koeretoejer WHERE sag_id = ?', { sag.id })
            local referencer = exports.oxmysql:executeSync('SELECT * FROM mdt_sag_referencer WHERE sag_id = ?', { sag.id })
            local tags = exports.oxmysql:executeSync('SELECT tag FROM mdt_sag_tags WHERE sag_id = ?', { sag.id })
            local aktivitetslog = exports.oxmysql:executeSync('SELECT * FROM mdt_sag_aktivitetslog WHERE sag_id = ? ORDER BY tidspunkt DESC', { sag.id })
            local noter = exports.oxmysql:executeSync('SELECT * FROM mdt_sag_noter WHERE sag_id = ? ORDER BY oprettet_dato DESC', { sag.id })

            -- Map betjent_ids
            local betjentIds = {}
            for _, b in ipairs(betjente or {}) do
                table.insert(betjentIds, b.betjent_id)
            end

            -- Map tags
            local tagList = {}
            for _, t in ipairs(tags or {}) do
                table.insert(tagList, t.tag)
            end

            table.insert(result, {
                id = sag.id,
                sagsnummer = sag.sagsnummer,
                titel = sag.titel,
                status = sag.status,
                oprettetAf = sag.oprettet_af,
                oprettet = sag.oprettet,
                opdateret = sag.opdateret,
                rapport = {
                    haendelsesforloeb = sag.rapport_haendelsesforloeb or "",
                    konfiskeredeGenstande = json.decode(sag.rapport_konfiskerede or "[]"),
                    magtanvendelse = json.decode(sag.rapport_magtanvendelse or "[]"),
                },
                mistaenkte = mistaenkte or {},
                beviser = beviser or {},
                involveretBetjente = betjentIds,
                involveretBorgere = borgere or {},
                koeretoejer = koeretoejer or {},
                referencer = referencer or {},
                tags = tagList,
                aktivitetslog = aktivitetslog or {},
                noter = noter or {},
            })
        end

        TriggerClientEvent('mdt:client:receiveSager', src, result)
    end)
end)

-- ── Opret sag ──
RegisterNetEvent('mdt:server:createSag')
AddEventHandler('mdt:server:createSag', function(data)
    local src = source
    local sagId = generateId()
    local sagsnummer = generateSagsnummer()

    exports.oxmysql:execute([[
        INSERT INTO mdt_sager (id, sagsnummer, titel, status, oprettet_af, rapport_haendelsesforloeb, rapport_konfiskerede, rapport_magtanvendelse)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ]], {
        sagId, sagsnummer, data.titel or '', data.status or 'aaben', data.oprettetAf or '',
        data.rapport and data.rapport.haendelsesforloeb or '',
        json.encode(data.rapport and data.rapport.konfiskeredeGenstande or {}),
        json.encode(data.rapport and data.rapport.magtanvendelse or {}),
    })

    -- Mistænkte + sigtelser
    if data.mistaenkte then
        for _, m in ipairs(data.mistaenkte) do
            local mId = generateId()
            exports.oxmysql:execute([[
                INSERT INTO mdt_sag_mistaenkte (id, sag_id, person_id, person_navn, person_cpr, total_boede, total_faengsel, erkender, behandlet, tilkendegivelse_afgivet, fratag_koerekort)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ]], { mId, sagId, m.personId, m.personNavn, m.personCpr, m.totalBoede or 0, m.totalFaengsel or 0,
                  m.erkender, m.behandlet and 1 or 0, m.tilkendegivelseAfgivet and 1 or 0, m.fratagKoerekort and 1 or 0 })

            if m.sigtelser then
                for _, s in ipairs(m.sigtelser) do
                    exports.oxmysql:execute([[
                        INSERT INTO mdt_sag_sigtelser (id, mistaenkt_id, sag_id, boede_id, paragraf, beskrivelse, beloeb, faengsel_maaneder)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    ]], { generateId(), mId, sagId, s.boedeId, s.paragraf or '', s.beskrivelse or '', s.beloeb or 0, s.faengselMaaneder or 0 })
                end
            end
        end
    end

    -- Betjente
    if data.involveretBetjente then
        for _, bId in ipairs(data.involveretBetjente) do
            exports.oxmysql:execute('INSERT INTO mdt_sag_betjente (id, sag_id, betjent_id) VALUES (?, ?, ?)', { generateId(), sagId, bId })
        end
    end

    -- Borgere
    if data.involveretBorgere then
        for _, b in ipairs(data.involveretBorgere) do
            exports.oxmysql:execute('INSERT INTO mdt_sag_borgere (id, sag_id, person_id, navn, cpr, rolle) VALUES (?, ?, ?, ?, ?, ?)',
                { generateId(), sagId, b.personId, b.navn, b.cpr, b.rolle })
        end
    end

    -- Køretøjer
    if data.koeretoejer then
        for _, k in ipairs(data.koeretoejer) do
            exports.oxmysql:execute('INSERT INTO mdt_sag_koeretoejer (id, sag_id, nummerplade, beskrivelse) VALUES (?, ?, ?, ?)',
                { generateId(), sagId, k.nummerplade, k.beskrivelse or '' })
        end
    end

    -- Referencer
    if data.referencer then
        for _, r in ipairs(data.referencer) do
            exports.oxmysql:execute('INSERT INTO mdt_sag_referencer (id, sag_id, titel, url, beskrivelse) VALUES (?, ?, ?, ?, ?)',
                { generateId(), sagId, r.titel, r.url or '', r.beskrivelse or '' })
        end
    end

    -- Tags
    if data.tags then
        for _, tag in ipairs(data.tags) do
            exports.oxmysql:execute('INSERT INTO mdt_sag_tags (id, sag_id, tag) VALUES (?, ?, ?)', { generateId(), sagId, tag })
        end
    end

    -- Beviser
    if data.beviser then
        for _, b in ipairs(data.beviser) do
            exports.oxmysql:execute([[
                INSERT INTO mdt_sag_beviser (id, sag_id, type, billed_url, beskrivelse, timestamp, oprettet_af)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ]], { generateId(), sagId, b.type, b.billedUrl or '', b.beskrivelse, b.timestamp or '', b.oprettetAf })
        end
    end

    -- Noter
    if data.noter then
        for _, n in ipairs(data.noter) do
            exports.oxmysql:execute('INSERT INTO mdt_sag_noter (id, sag_id, tekst, oprettet_af) VALUES (?, ?, ?, ?)',
                { generateId(), sagId, n.tekst, n.oprettetAf })
        end
    end

    -- Aktivitetslog
    exports.oxmysql:execute([[
        INSERT INTO mdt_sag_aktivitetslog (id, sag_id, type, beskrivelse, bruger)
        VALUES (?, ?, 'oprettet', 'Sag oprettet', ?)
    ]], { generateId(), sagId, data.oprettetAf or '' })

    TriggerClientEvent('mdt:client:sagCreated', src, { id = sagId, sagsnummer = sagsnummer })
end)

-- ── Opdater sag ──
RegisterNetEvent('mdt:server:updateSag')
AddEventHandler('mdt:server:updateSag', function(sagId, data)
    local src = source

    exports.oxmysql:execute([[
        UPDATE mdt_sager SET titel = ?, status = ?, rapport_haendelsesforloeb = ?,
        rapport_konfiskerede = ?, rapport_magtanvendelse = ?
        WHERE id = ?
    ]], {
        data.titel or '', data.status or 'aaben',
        data.rapport and data.rapport.haendelsesforloeb or '',
        json.encode(data.rapport and data.rapport.konfiskeredeGenstande or {}),
        json.encode(data.rapport and data.rapport.magtanvendelse or {}),
        sagId,
    })

    -- Nulstil og genopret relationer
    exports.oxmysql:execute('DELETE FROM mdt_sag_mistaenkte WHERE sag_id = ?', { sagId })
    exports.oxmysql:execute('DELETE FROM mdt_sag_betjente WHERE sag_id = ?', { sagId })
    exports.oxmysql:execute('DELETE FROM mdt_sag_borgere WHERE sag_id = ?', { sagId })
    exports.oxmysql:execute('DELETE FROM mdt_sag_koeretoejer WHERE sag_id = ?', { sagId })
    exports.oxmysql:execute('DELETE FROM mdt_sag_referencer WHERE sag_id = ?', { sagId })
    exports.oxmysql:execute('DELETE FROM mdt_sag_tags WHERE sag_id = ?', { sagId })
    exports.oxmysql:execute('DELETE FROM mdt_sag_beviser WHERE sag_id = ?', { sagId })
    exports.oxmysql:execute('DELETE FROM mdt_sag_noter WHERE sag_id = ?', { sagId })

    -- Re-insert (same logic as create)
    if data.mistaenkte then
        for _, m in ipairs(data.mistaenkte) do
            local mId = generateId()
            exports.oxmysql:execute([[
                INSERT INTO mdt_sag_mistaenkte (id, sag_id, person_id, person_navn, person_cpr, total_boede, total_faengsel, erkender, behandlet, tilkendegivelse_afgivet, fratag_koerekort)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ]], { mId, sagId, m.personId, m.personNavn, m.personCpr, m.totalBoede or 0, m.totalFaengsel or 0,
                  m.erkender, m.behandlet and 1 or 0, m.tilkendegivelseAfgivet and 1 or 0, m.fratagKoerekort and 1 or 0 })
            if m.sigtelser then
                for _, s in ipairs(m.sigtelser) do
                    exports.oxmysql:execute([[
                        INSERT INTO mdt_sag_sigtelser (id, mistaenkt_id, sag_id, boede_id, paragraf, beskrivelse, beloeb, faengsel_maaneder)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    ]], { generateId(), mId, sagId, s.boedeId, s.paragraf or '', s.beskrivelse or '', s.beloeb or 0, s.faengselMaaneder or 0 })
                end
            end
        end
    end

    if data.involveretBetjente then
        for _, bId in ipairs(data.involveretBetjente) do
            exports.oxmysql:execute('INSERT INTO mdt_sag_betjente (id, sag_id, betjent_id) VALUES (?, ?, ?)', { generateId(), sagId, bId })
        end
    end
    if data.involveretBorgere then
        for _, b in ipairs(data.involveretBorgere) do
            exports.oxmysql:execute('INSERT INTO mdt_sag_borgere (id, sag_id, person_id, navn, cpr, rolle) VALUES (?, ?, ?, ?, ?, ?)',
                { generateId(), sagId, b.personId, b.navn, b.cpr, b.rolle })
        end
    end
    if data.koeretoejer then
        for _, k in ipairs(data.koeretoejer) do
            exports.oxmysql:execute('INSERT INTO mdt_sag_koeretoejer (id, sag_id, nummerplade, beskrivelse) VALUES (?, ?, ?, ?)',
                { generateId(), sagId, k.nummerplade, k.beskrivelse or '' })
        end
    end
    if data.referencer then
        for _, r in ipairs(data.referencer) do
            exports.oxmysql:execute('INSERT INTO mdt_sag_referencer (id, sag_id, titel, url, beskrivelse) VALUES (?, ?, ?, ?, ?)',
                { generateId(), sagId, r.titel, r.url or '', r.beskrivelse or '' })
        end
    end
    if data.tags then
        for _, tag in ipairs(data.tags) do
            exports.oxmysql:execute('INSERT INTO mdt_sag_tags (id, sag_id, tag) VALUES (?, ?, ?)', { generateId(), sagId, tag })
        end
    end
    if data.beviser then
        for _, b in ipairs(data.beviser) do
            exports.oxmysql:execute([[
                INSERT INTO mdt_sag_beviser (id, sag_id, type, billed_url, beskrivelse, timestamp, oprettet_af)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ]], { generateId(), sagId, b.type, b.billedUrl or '', b.beskrivelse, b.timestamp or '', b.oprettetAf })
        end
    end
    if data.noter then
        for _, n in ipairs(data.noter) do
            exports.oxmysql:execute('INSERT INTO mdt_sag_noter (id, sag_id, tekst, oprettet_af) VALUES (?, ?, ?, ?)',
                { generateId(), sagId, n.tekst, n.oprettetAf })
        end
    end

    -- Log opdatering
    exports.oxmysql:execute([[
        INSERT INTO mdt_sag_aktivitetslog (id, sag_id, type, beskrivelse, bruger)
        VALUES (?, ?, 'opdateret', 'Sag opdateret', ?)
    ]], { generateId(), sagId, data.oprettetAf or '' })

    TriggerClientEvent('mdt:client:sagUpdated', src, sagId)
end)

-- ── Slet sag ──
RegisterNetEvent('mdt:server:deleteSag')
AddEventHandler('mdt:server:deleteSag', function(sagId)
    local src = source
    exports.oxmysql:execute('DELETE FROM mdt_sager WHERE id = ?', { sagId })
    TriggerClientEvent('mdt:client:sagDeleted', src, sagId)
end)
