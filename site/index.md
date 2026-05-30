# PURSUE — The Pentagon's Declassified UAP Files

An interactive 3D map and an **MCP server** over the U.S. Department of War's **PURSUE Releases 1 & 2** (war.gov, May 2026): **222 declassified UAP/UFO records** spanning **1944–2026**, across seven U.S. federal agencies (War, FBI, NASA, State, CIA, ODNI, Energy). All data is U.S. public domain (17 U.S.C. § 105) — no scraped third-party data.

## The dataset

- 222 records · 170 geolocated · 15 off-world (Moon / orbit / cislunar)
- War — 131 · FBI — 57 · NASA — 22 · State — 7 · CIA — 1 · ODNI — 1 · DOE — 3
- 122 PDFs · 78 videos · 14 images · 8 audio — each links to the original on war.gov
- Hotspots: CENTCOM (32), Western United States (26), Arabian Gulf (12), Syria (10), Iraq (8)

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
