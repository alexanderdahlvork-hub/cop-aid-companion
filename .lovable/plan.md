
# Plan: Redesign NSK Bander i mdt.html

## Problem
NSK "Bander"-tabben kalder den samme `renderNSKContent()` som "Tilhørsforhold", så der er ingen dedikeret bande-styring. Brugerens reference-billeder viser et system med:
1. **Oversigt** med bande-kort (navn, trusselsniveau-badge, antal medlemmer, "Se Detaljer"-knap)
2. **Detaljevisning** med trusselsniveau-dropdown, medlemsliste med søgefunktion, bande-statistik, beviser, og informationsfelt

## Ændringer i `public/mdt.html`

### 1. Separer bander og tilhørsforhold routing
- Opdel `renderNSKContent()` så "bander"-tabben kalder en ny `renderNSKBander()` funktion
- "tilhoersforhold"-tabben beholder den eksisterende logik

### 2. Ny `renderNSKBander()` funktion — Oversigt
- Topbar med "NSK Bande Oversigt" header (centreret, mørk baggrund som i billedet)
- "Opret Ny Bande" knap (grøn, med plus-ikon)
- Opret-formular: navn-input + trusselsniveau-dropdown + opret/annuller knapper
- Grid med bande-kort der viser:
  - Bande-navn + trusselsniveau badge (Høj=rød, Middel=gul, Lav=grøn)
  - ID (kort UUID)
  - Antal medlemmer med ikon
  - Trusselsniveau tekst
  - "Se Detaljer" knap + slet-knap

### 3. Ny `renderNSKBandeDetaljer()` — Detaljevisning
Matcher referencebilledet med:
- "Tilbage til oversigt" link
- Centreret header: "[Bande navn] - Detaljer"
- Trusselsniveau-bar med dropdown til at ændre niveau
- **Venstre kolonne**: Medlemmer-sektion med søg-efter-person, liste med "Antal sigtelser" per medlem, fjern-knap
- **Højre kolonne**: Bande Statistik med samlet antal sigtelser og seneste sigtelser
- **Beviser**-sektion: tilføj bevis-formular, liste med beskrivelse/dato/forfatter
- **Information**-sektion: textarea + "Gem Information" knap

### 4. Data-persistering
- Gem bander i localStorage under key `nsk_bander_html`
- Bande-objekt: `{ id, navn, trusselsniveau, medlemmer[], beviser[], information, oprettetAf, oprettetDato }`
- Medlemmer linkes via personerApi (søg efter navn/CPR)

### Teknisk
- Alt implementeres direkte i `public/mdt.html` da det er den fil der renderes i preview via iframe
- Styling matcher det eksisterende mørke tema med `card`, `btn`, `badge` klasser
- Layout matcher referencebillederne præcist
