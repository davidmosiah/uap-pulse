# Skill: Query declassified Pentagon UAP records (uap-pulse)

Search and map the U.S. Pentagon's declassified UAP/UFO files (PURSUE Release, war.gov, 2026) — 222 public-domain government records spanning 1944–2026.

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
- Source: war.gov PURSUE Releases 1 & 2 — U.S. public domain (17 U.S.C. § 105)
- 222 records · 170 geolocated · agencies: War (131), FBI (57), NASA (22), State (7), CIA (1), ODNI (1), DOE (3)

## Links

- Live map: https://uap-pulse.vercel.app
- GitHub: https://github.com/davidmosiah/uap-pulse
- npm: https://www.npmjs.com/package/uap-pulse
