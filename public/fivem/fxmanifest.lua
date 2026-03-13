fx_version 'cerulean'
game 'gta5'

name 'mdt-sagssystem'
description 'MDT Sagssystem med sager, sigtelser, beviser og aktivitetslog'
version '1.0.0'

ui_page 'nui/index.html'

client_scripts {
    'client/client.lua',
}

server_scripts {
    '@oxmysql/lib/MySQL.lua',
    'server/server.lua',
}

files {
    'nui/index.html',
    'nui/style.css',
    'nui/script.js',
}
