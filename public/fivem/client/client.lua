-- ============================================
-- MDT Sagssystem - Client Side (Lua)
-- ============================================

local mdtOpen = false

-- Åbn MDT
RegisterCommand('mdt', function()
    if mdtOpen then return end
    mdtOpen = true
    SetNuiFocus(true, true)
    SendNUIMessage({ action = "openMDT" })
    TriggerServerEvent('mdt:server:getSager')
end, false)

-- Luk MDT
RegisterNUICallback('closeMDT', function(_, cb)
    mdtOpen = false
    SetNuiFocus(false, false)
    cb('ok')
end)

-- ── NUI Callbacks ──

-- Hent sager
RegisterNUICallback('getSager', function(_, cb)
    TriggerServerEvent('mdt:server:getSager')
    cb('ok')
end)

-- Opret sag
RegisterNUICallback('createSag', function(data, cb)
    TriggerServerEvent('mdt:server:createSag', data)
    cb('ok')
end)

-- Opdater sag
RegisterNUICallback('updateSag', function(data, cb)
    TriggerServerEvent('mdt:server:updateSag', data.id, data)
    cb('ok')
end)

-- Slet sag
RegisterNUICallback('deleteSag', function(data, cb)
    TriggerServerEvent('mdt:server:deleteSag', data.id)
    cb('ok')
end)

-- ── Server Events ──

RegisterNetEvent('mdt:client:receiveSager')
AddEventHandler('mdt:client:receiveSager', function(sager)
    SendNUIMessage({ action = "receiveSager", data = sager })
end)

RegisterNetEvent('mdt:client:sagCreated')
AddEventHandler('mdt:client:sagCreated', function(data)
    SendNUIMessage({ action = "sagCreated", data = data })
    -- Refresh listen
    TriggerServerEvent('mdt:server:getSager')
end)

RegisterNetEvent('mdt:client:sagUpdated')
AddEventHandler('mdt:client:sagUpdated', function(sagId)
    SendNUIMessage({ action = "sagUpdated", data = { id = sagId } })
    TriggerServerEvent('mdt:server:getSager')
end)

RegisterNetEvent('mdt:client:sagDeleted')
AddEventHandler('mdt:client:sagDeleted', function(sagId)
    SendNUIMessage({ action = "sagDeleted", data = { id = sagId } })
    TriggerServerEvent('mdt:server:getSager')
end)

-- Luk med ESC
CreateThread(function()
    while true do
        Wait(0)
        if mdtOpen and IsControlJustReleased(0, 322) then -- ESC
            mdtOpen = false
            SetNuiFocus(false, false)
            SendNUIMessage({ action = "closeMDT" })
        end
    end
end)
