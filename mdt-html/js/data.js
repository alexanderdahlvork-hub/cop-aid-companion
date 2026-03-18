/**
 * AVLD-Systems.dk – Statisk data (bødetakster, ranger, uddannelser)
 */

const rangOrder = [
  "Rigspolitichef","Politidirektør","Politimester","Chefpolitiinspektør",
  "Politiinspektør","Vicepolitiinspektør","Politikommissær","Politiassistent","Politibetjent"
];

const alleUddannelser = [
  "Grunduddannelse (PG)","Politiets Grundkursus","Efterforskningsuddannelse","Avanceret Efterforskning",
  "Taktisk Indsatsuddannelse","Operativ Ledelse","Strategisk Ledelse","Krisehåndtering",
  "Forhandleruddannelse","Psykologisk Førstehjælp","Kommunikation & Konflikthåndtering",
  "Juridisk Efteruddannelse","Anti-Terror Uddannelse","Narkotikaefterforskningskursus",
  "Cyberkriminalitet & IT-forensik","Sporing & Overvågning","Personsikkerhed","VIP-beskyttelse",
  "Udrykningskørsel","MC-patruljebevis","Hundeførerkursus","Skarpskytteruddannelse",
  "Specialvåben & Taktik","Første-respondent Uddannelse","Brandslukningskursus",
  "Beredskabslederuddannelse","CBRN-uddannelse","Dronefører Certificering","Maritim Indsats",
  "Crowd Control & Demonstrationer"
];

const alleCertifikater = [
  "Våbencertifikat A (Pistol)","Våbencertifikat B (Gevær)","Våbencertifikat C (Specialvåben)",
  "Udrykningscertifikat","MC-certifikat","Blålyskørsel Niveau 1","Blålyskørsel Niveau 2",
  "Førstehjælpscertifikat","Avanceret Førstehjælp","Narkotikatest-certifikat","Alkometer-certifikat",
  "Radarcertifikat","ATK-certifikat (Automatisk Trafikkontrol)","Laserpistol-certifikat",
  "Hundeførercertifikat","Skarpskyttecertifikat","Dykkebevis","Drone-pilotbevis",
  "Sprængstof-certifikat","Taktisk Indsats Certifikat (TIK)","Forhandlercertifikat",
  "IT-forensik Certifikat","CBRN-certifikat","Beredskabsleder Certifikat",
  "Sikkerhedsgodkendelse (Fortrolig)","Sikkerhedsgodkendelse (Hemmelig)"
];

function isAdminRang(rang) { return rang === "Administrator"; }

function getRangIndex(rang) { const i = rangOrder.indexOf(rang); return i === -1 ? 999 : i; }

const standardBoeder = [
  // Færdselsloven
  {id:"1",kategori:"Færdselsloven",paragraf:"FL. §4, stk. 1",beskrivelse:"Kørsel frem mod rødt lyssignal",beloeb:2500,klip:1,frakendelse:"",faengselMaaneder:0,information:""},
  {id:"2",kategori:"Færdselsloven",paragraf:"FL. §4, stk. 1",beskrivelse:"Kørsel mod kørselsretning",beloeb:2500,klip:1,frakendelse:"",faengselMaaneder:0,information:""},
  {id:"3",kategori:"Færdselsloven",paragraf:"FL. §4, stk. 1",beskrivelse:"Færdselstavle eller pile ikke respekteret",beloeb:1500,klip:0,frakendelse:"",faengselMaaneder:0,information:""},
  {id:"4",kategori:"Færdselsloven",paragraf:"FL. §4, stk. 1",beskrivelse:"Overskredet spærrelinie ved overhaling",beloeb:2000,klip:1,frakendelse:"",faengselMaaneder:0,information:""},
  {id:"5",kategori:"Færdselsloven",paragraf:"FL. §41",beskrivelse:"Hasarderet kørsel",beloeb:5000,klip:1,frakendelse:"",faengselMaaneder:0,information:""},
  {id:"6",kategori:"Færdselsloven",paragraf:"FL. §41 Stk. 2",beskrivelse:"Uansvarlig kørsel",beloeb:10000,klip:3,frakendelse:"Betinget",faengselMaaneder:0,information:""},
  {id:"7",kategori:"Færdselsloven",paragraf:"FL. §53/ §54",beskrivelse:"Kørsel i påvirket tilstand",beloeb:15000,klip:0,frakendelse:"Ubetinget",faengselMaaneder:0,information:"§53 = Alkohol // §54 = EUF."},
  {id:"8",kategori:"Færdselsloven",paragraf:"FL. §56",beskrivelse:"Kørsel uden førerret 1. gang",beloeb:5000,klip:0,frakendelse:"",faengselMaaneder:0,information:""},
  {id:"9",kategori:"Færdselsloven",paragraf:"FL. §55 a",beskrivelse:"Benyttet håndholdt mobiltelefon under kørsel",beloeb:1500,klip:1,frakendelse:"",faengselMaaneder:0,information:""},
  {id:"10",kategori:"Færdselsloven",paragraf:"FL §38",beskrivelse:"Unødig støj/røg m.v. (burnout)",beloeb:1000,klip:0,frakendelse:"",faengselMaaneder:0,information:""},
  // Straffeloven
  {id:"20",kategori:"Straffeloven",paragraf:"SL. §119",beskrivelse:"Overfald på embedsmand",beloeb:20000,klip:0,frakendelse:"",faengselMaaneder:15,information:"Borger overfalder embedsmand i funktion."},
  {id:"21",kategori:"Straffeloven",paragraf:"SL. §237",beskrivelse:"Mord",beloeb:40000,klip:0,frakendelse:"",faengselMaaneder:40,information:"Borger dræber en anden."},
  {id:"22",kategori:"Straffeloven",paragraf:"SL. §244",beskrivelse:"Overfald",beloeb:15000,klip:0,frakendelse:"",faengselMaaneder:10,information:"Borger overfalder en anden."},
  {id:"23",kategori:"Straffeloven",paragraf:"SL. §266",beskrivelse:"Trusler",beloeb:7500,klip:0,frakendelse:"",faengselMaaneder:5,information:"Borger truer en anden."},
  {id:"24",kategori:"Straffeloven",paragraf:"SL. §288",beskrivelse:"Bankrøveri",beloeb:100000,klip:0,frakendelse:"",faengselMaaneder:50,information:""},
  {id:"25",kategori:"Straffeloven",paragraf:"SL. §124",beskrivelse:"Flugt fra politiet",beloeb:25000,klip:0,frakendelse:"",faengselMaaneder:20,information:""},
  {id:"26",kategori:"Straffeloven",paragraf:"SL. §264",beskrivelse:"Ulovlig indtrængen",beloeb:10000,klip:0,frakendelse:"",faengselMaaneder:5,information:""},
  // Euforiserende stoffer
  {id:"30",kategori:"Euforiserende stoffer",paragraf:"",beskrivelse:"Besiddelse af Kokain",beloeb:650,klip:0,frakendelse:"",faengselMaaneder:10,information:""},
  {id:"31",kategori:"Euforiserende stoffer",paragraf:"",beskrivelse:"Besiddelse af Heroin",beloeb:600,klip:0,frakendelse:"",faengselMaaneder:10,information:""},
  {id:"32",kategori:"Euforiserende stoffer",paragraf:"",beskrivelse:"Besiddelse af Hash",beloeb:125,klip:0,frakendelse:"",faengselMaaneder:0,information:""},
  // Våben
  {id:"40",kategori:"Våben & Knivlov",paragraf:"VL. §1",beskrivelse:"Besiddelse af Pistol",beloeb:100000,klip:0,frakendelse:"",faengselMaaneder:25,information:""},
  {id:"41",kategori:"Våben & Knivlov",paragraf:"VL. §1",beskrivelse:"Besiddelse af Assault Rifle",beloeb:500000,klip:0,frakendelse:"",faengselMaaneder:55,information:""},
  {id:"42",kategori:"Våben & Knivlov",paragraf:"VL. §1",beskrivelse:"Besiddelse af Stikvåben",beloeb:5000,klip:0,frakendelse:"",faengselMaaneder:5,information:"Knive, økser osv."},
  // Ordensbekendtgørelsen
  {id:"50",kategori:"Ordensbekendtgørelsen",paragraf:"OB. §3",beskrivelse:"Nægter at efterkomme politiets anvisninger",beloeb:15000,klip:0,frakendelse:"",faengselMaaneder:0,information:""},
  {id:"51",kategori:"Ordensbekendtgørelsen",paragraf:"OB. §3",beskrivelse:"Gadeuorden",beloeb:7500,klip:0,frakendelse:"",faengselMaaneder:0,information:""},
];
