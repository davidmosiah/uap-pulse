# PURSUE — The Pentagon's Declassified UAP Files

An interactive 3D map and an **MCP server** over the U.S. Department of War's **PURSUE Release** (war.gov, 8 May 2026): **161 declassified UAP/UFO records** spanning **1944–2026**, across the Department of War, FBI, NASA, and the Department of State. All data is U.S. public domain (17 U.S.C. § 105) — no scraped third-party data.

## The dataset

- 161 records · 114 geolocated · 10 off-world (Moon / orbit)
- Department of War — 82 · FBI — 57 · NASA — 15 · Department of State — 7
- 119 PDFs · 28 videos · 14 images — each links to the original on war.gov
- Hotspots: Western United States (25), Syria (12), Iraq (8), Moon (8), Arabian Gulf (7)

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
