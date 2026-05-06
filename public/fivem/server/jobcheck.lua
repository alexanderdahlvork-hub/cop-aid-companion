-- ============================================
-- AVLD MDT — Adgangskontrol (ESX job)
-- ============================================

local function isAllowedJob(jobName)
    for _, j in ipairs(Config.AllowedJobs) do
        if j == jobName then return true end
    end
    return false
end

-- Kaldes af client før MDT'en åbnes
RegisterNetEvent('avld_mdt:server:requestOpen')
AddEventHandler('avld_mdt:server:requestOpen', function()
    local src = source
    local x = GetXPlayer(src)
    if not x then
        TriggerClientEvent('chat:addMessage', src, {
            args = {"^1[MDT]", "ESX kunne ikke findes på serveren."},
        })
        return
    end

    local jobName = x.job and x.job.name or "unknown"
    if not isAllowedJob(jobName) then
        TriggerClientEvent('chat:addMessage', src, {
            args = {"^1[MDT]", "Du har ikke adgang til MDT'en (job: "..jobName..")"},
        })
        return
    end

    -- Send brugerinfo til client/NUI
    local grade   = (x.job and x.job.grade) or 0
    local isAdmin = grade >= (Config.AdminMinGrade or 999)

    TriggerClientEvent('avld_mdt:client:openGranted', src, {
        identifier = x.identifier,
        fornavn    = (x.get and x.get('firstName')) or (x.variables and x.variables.firstName) or "Betjent",
        efternavn  = (x.get and x.get('lastName'))  or (x.variables and x.variables.lastName)  or "",
        job        = jobName,
        grade      = grade,
        gradeLabel = (x.job and x.job.grade_label) or "",
        isAdmin    = isAdmin,
    })
end)
