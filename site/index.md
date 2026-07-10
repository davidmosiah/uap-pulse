# PURSUE — The Pentagon's Declassified UAP Files

An interactive 3D map and an **MCP server** over all four U.S. Department of War **PURSUE releases** (war.gov, May–July 2026): **334 U.S. records**, plus 16 curated official-government cases from 12 nations — **350 records total**, spanning **1944–2026**. U.S. data is public domain under 17 U.S.C. § 105.

## The dataset

- 350 records · 275 geolocated · 20 off-world (Moon / orbit / cislunar)
- Release 04: 40 files published July 10, 2026
- U.S. agencies: War — 171 · FBI — 87 · NASA — 40 · CIA — 21 · State — 7 · DOE — 5 · other — 3
- 189 PDFs · 106 videos · 27 images · 15 audio · 13 international documents
- Hotspots: Western United States (40), CENTCOM (32), Arabian Gulf (12), Northeastern United States (11), Syria (10)

## Query it with your AI agent

Install the open MCP server (no auth):

```
npx -y uap-pulse
```

Tools: `search_sightings`, `search_nearby`, `get_sighting`, `full_text_search`, `notable_cases`, `hotspots`, `stats`, `timeline`, `timeline_data`.

## Links

- Live map: https://uap-pulse.vercel.app
- Source: https://github.com/davidmosiah/uap-pulse
- npm: https://www.npmjs.com/package/uap-pulse
- Raw data (JSON): https://uap-pulse.vercel.app/sightings.json
- For agents: https://uap-pulse.vercel.app/llms.txt
