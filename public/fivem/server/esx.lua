-- ============================================
-- AVLD MDT — ESX detection (auto: Legacy + ældre)
-- ============================================

ESX = nil

local function tryLegacy()
    local ok, obj = pcall(function()
        return exports['es_extended']:getSharedObject()
    end)
    if ok and obj then return obj end
    return nil
end

local function tryOldEvent()
    local obj = nil
    TriggerEvent('esx:getSharedObject', function(o) obj = o end)
    return obj
end

CreateThread(function()
    -- Prøv Legacy først
    if Config.ESXMode == "legacy" or Config.ESXMode == "auto" then
        ESX = tryLegacy()
    end

    -- Fald tilbage til gammel event
    if not ESX and (Config.ESXMode == "old" or Config.ESXMode == "auto") then
        ESX = tryOldEvent()
        local tries = 0
        while not ESX and tries < 20 do
            Wait(250)
            ESX = tryOldEvent()
            tries = tries + 1
        end
    end

    if ESX then
        print(("[AVLD MDT] ESX fundet (%s mode)"):format(Config.ESXMode))
    else
        print("[AVLD MDT] ^1ADVARSEL:^7 ESX kunne ikke findes. Tjek at es_extended er startet før " .. Config.ResourceName)
    end
end)

-- Hjælper: hent xPlayer fra source
function GetXPlayer(src)
    if not ESX then return nil end
    if ESX.GetPlayerFromId then
        return ESX.GetPlayerFromId(src)
    elseif ESX.GetPlayerFromIdentifier then
        local id = GetPlayerIdentifier(src, 0)
        if id then return ESX.GetPlayerFromIdentifier(id) end
    end
    return nil
end

-- Hjælper: hent identifier
function GetIdentifier(src)
    local x = GetXPlayer(src)
    if x and x.identifier then return x.identifier end
    return GetPlayerIdentifier(src, 0)
end
