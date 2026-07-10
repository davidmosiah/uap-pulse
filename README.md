# 🛸 uap-pulse

**An MCP server (and a live map) for the Pentagon's declassified UAP files.**

On **July 10, 2026**, the U.S. Department of War published **PURSUE Release 04** on [war.gov/UFO](https://www.war.gov/UFO/). `uap-pulse` now bundles all four releases: **334 U.S. records**, plus 16 curated official-government cases from 12 nations — **350 records total**, spanning **1944–2026**.

> **Official sources only.** U.S. PURSUE records are public domain under 17 U.S.C. § 105. The international layer links to official national archives; rights remain with each originating source. No scraped civilian databases. Not affiliated with or endorsed by any government.

🗺️ **Live map:** https://uap-pulse.vercel.app  ·  📦 **npm:** `uap-pulse`

---

## Use it as an MCP server

Your agent can search all 350 records by release, location, agency, era, or type — and pull the direct official source link for each.

**Claude Desktop / any MCP client** — add to your config:

```json
{
  "mcpServers": {
    "uap-pulse": { "command": "npx", "args": ["-y", "uap-pulse"] }
  }
}
```

That's it — no API key, no auth, no cost. The data ships with the package.

### Tools

| Tool | What it does |
|------|--------------|
| `search_sightings` | Search by `release` (1–4), free text, agency, type, year range, or location. |
| `search_nearby` | Incidents within a radius (km) of a lat/lng, sorted by distance. |
| `get_sighting` | Full record for one file id (e.g. `pursue-042`) + the `war.gov` link. |
| `full_text_search` | Relevance-ranked search across titles, locations, and descriptions. |
| `notable_cases` | Curated historically significant groups with source records. |
| `hotspots` | The locations with the most declassified records. |
| `stats` | Totals + breakdowns by release, agency, file type, and era. |
| `timeline` | Records per decade (or year), 1944 → 2026. |
| `timeline_data` | Per-period records with coordinates for maps and animation. |

**Example** — *"What UAP files mention the Moon?"* → `search_sightings({ location: "Moon" })` → NASA Gemini/Apollo records with their war.gov links.

**Latest release** — `search_sightings({ release: 4, limit: 100 })` → all 40 files released on July 10, including the 1949 Los Alamos conference transcript, Project Sign records, new sensor videos, and STS-80 images.

---

## The live map

A 3D globe of every geolocatable record — points pulse where the sightings cluster, colored by agency, filterable by era (WWII Foo Fighters → the Navy Era). Click a hotspot to read the files and open them on `war.gov`. Off-world records (Moon, orbit) get their own panel.

Run it locally:

```bash
cd site && python3 -m http.server 8080   # then open http://localhost:8080
```

Or deploy the `site/` folder to Vercel (static, no build step).

---

## Data

- **Source:** [war.gov/UFO](https://www.war.gov/UFO/) — PURSUE Releases 1–4 (2026-05-08 through 2026-07-10).
- **License of the data:** Public domain (U.S. federal government work, 17 U.S.C. § 105).
- **Coverage:** 350 records · 275 geolocated · 20 off-world · 1944–2026. U.S. records by agency: War (171), FBI (87), NASA (40), CIA (21), State (7), DOE (5), ODNI (1), Intelligence Community Agency (1), U.S. Government (1).
- The official `war.gov` CSV is mirrored locally for reproducible builds; coordinates are representative centroids for named locations, maintained in [`scripts/build_data.py`](scripts/build_data.py).

Rebuild the dataset: `npm run data` (or `python3 scripts/build_data.py`).

---

## Develop

```bash
npm install
npm run build      # tsc -> dist/
npm start          # run the MCP server over stdio
```

## License

Code: **MIT** © David Mosiah ([@delx369](https://x.com/delx369)). Data: U.S. public domain.
