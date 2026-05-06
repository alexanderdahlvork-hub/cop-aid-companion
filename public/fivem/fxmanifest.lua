fx_version 'cerulean'
game 'gta5'
lua54 'yes'

name        'avld_mdt'
description 'AVLD Systems MDT — Komplet politi-tablet til ESX (sager, sigtelser, personregister, flåde, m.m.)'
author      'AVLD Systems'
version     '2.0.0'

-- NUI
ui_page 'nui/index.html'

-- Delt config
shared_scripts {
    'config.lua',
}

-- Client
client_scripts {
    'client/main.lua',
}

-- Server: mysql-async + ESX detection + alle moduler
server_scripts {
    '@mysql-async/lib/MySQL.lua',
    'server/esx.lua',
    'server/sync.lua',
    'server/jobcheck.lua',
    'server/main.lua',
}

-- NUI-filer + hele MDT-app
files {
    'nui/index.html',
    'nui/style.css',
    'nui/script.js',
    'nui/mdt.html',
}

-- Dependencies (advarsel hvis de mangler)
dependencies {
    'mysql-async',
    'es_extended',
}
