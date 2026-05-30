# Skill: Query declassified Pentagon UAP records (uap-pulse)

Search and map the U.S. Pentagon's declassified UAP/UFO files (PURSUE Release, war.gov, 2026) — 161 public-domain government records spanning 1944–2026.

## Install (MCP server, no auth)

```
npx -y uap-pulse
```

Add to any MCP client:

```json
{ "mcpServers": { "uap-pulse": { "command": "npx", "args": ["-y", "uap-pulse"] } } }
```

## Tools

- `search_sightings(query?, agency?, type?, year_start?, year_end?, location?, limit?)`
- `search_nearby(latitude, longitude, radius_km?, limit?)`
- `get_sighting(id)` — full record + war.gov source link
- `full_text_search(query, limit?)` — relevance-ranked
- `notable_cases(key?)` — curated historic cases
- `hotspots(limit?)`, `stats()`, `timeline(granularity?)`, `timeline_data(granularity?)`

## Data

- Raw JSON (CORS-open): https://uap-pulse.vercel.app/sightings.json
- Source: war.gov PURSUE Release 1 — U.S. public domain (17 U.S.C. § 105)
- 161 records · 114 geolocated · agencies: Dept. of War (82), FBI (57), NASA (15), State (7)

## Links

- Live map: https://uap-pulse.vercel.app
- GitHub: https://github.com/davidmosiah/uap-pulse
- npm: https://www.npmjs.com/package/uap-pulse
