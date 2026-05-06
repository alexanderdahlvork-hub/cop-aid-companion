-- ============================================
-- AVLD MDT — Client (åbner NUI med mdt.html)
-- ============================================

local mdtOpen = false
local userInfo = nil

-- ── Åbn flow: anmod server om adgang ──
local function requestOpen()
    if mdtOpen then return end
    TriggerServerEvent('avld_mdt:server:requestOpen')
end

-- ── Server bekræfter adgang ──
RegisterNetEvent('avld_mdt:client:openGranted')
AddEventHandler('avld_mdt:client:openGranted', function(info)
    userInfo = info
    mdtOpen = true
    SetNuiFocus(true, true)
    SendNUIMessage({
        action = "open",
        user   = info,
    })
end)

-- ── Luk MDT ──
local function closeMDT()
    mdtOpen = false
    SetNuiFocus(false, false)
    SendNUIMessage({ action = "close" })
end

RegisterNUICallback('close', function(_, cb)
    closeMDT()
    cb({ ok = true })
end)

-- ── Kommando + keybind ──
RegisterCommand(Config.Command, requestOpen, false)
RegisterKeyMapping(Config.Command, 'Åbn AVLD MDT', 'keyboard', Config.KeyMapping)

-- ── ESC for at lukke ──
CreateThread(function()
    while true do
        Wait(0)
        if mdtOpen then
            DisableControlAction(0, 1, true)   -- Look LR
            DisableControlAction(0, 2, true)   -- Look UD
            DisableControlAction(0, 142, true) -- Melee
            DisableControlAction(0, 18, true)  -- Enter
            DisableControlAction(0, 322, true) -- ESC
            if IsDisabledControlJustReleased(0, 322) then
                closeMDT()
            end
        else
            Wait(500)
        end
    end
end)

-- ── Generisk DB-bridge: NUI -> client -> server ──
-- NUI sender { event = 'sager:getAll', payload = {...} }
-- Vi videresender til serveren som matchende net-event.
RegisterNUICallback('db', function(data, cb)
    if not data or not data.event then cb({ ok = false }); return end
    TriggerServerEvent('avld_mdt:'..data.event, data.payload)
    cb({ ok = true })
end)

-- ── Server -> NUI ──
local function forward(action)
    return function(...)
        local args = { ... }
        SendNUIMessage({
            action = action,
            payload = args[1],
            extra   = args[2],
        })
    end
end

RegisterNetEvent('avld_mdt:client:personerData',        forward('personer:data'))
RegisterNetEvent('avld_mdt:client:personerRefresh',     forward('personer:refresh'))
RegisterNetEvent('avld_mdt:client:sagerData',           forward('sager:data'))
RegisterNetEvent('avld_mdt:client:sagerRefresh',        forward('sager:refresh'))
RegisterNetEvent('avld_mdt:client:betjenteData',        forward('betjente:data'))
RegisterNetEvent('avld_mdt:client:koeretoejerData',     forward('koeretoejer:data'))
RegisterNetEvent('avld_mdt:client:boederData',          forward('boeder:data'))
RegisterNetEvent('avld_mdt:client:efterlysningerData',  forward('efterlysninger:data'))
RegisterNetEvent('avld_mdt:client:tableData',           forward('table:data'))
