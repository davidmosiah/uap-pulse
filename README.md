# 🛸 uap-pulse

**An MCP server (and a live map) for the Pentagon's declassified UAP files.**

On **May 8, 2026**, the U.S. Department of War published the first **PURSUE Release** on [war.gov/UFO](https://www.war.gov/UFO/) — **161 declassified UAP/UFO records** spanning **1944–2026**, across four federal agencies (Dept. of War, FBI, NASA, Dept. of State). `uap-pulse` puts that release at your AI agent's fingertips — and on a map.

> **Government records only.** This project uses *only* public-domain U.S. federal records (17 U.S.C. § 105). No scraped third-party databases, no civilian data behind a ToS. Not affiliated with or endorsed by the U.S. government.

🗺️ **Live map:** https://uap-pulse.vercel.app  ·  📦 **npm:** `uap-pulse`

---

## Use it as an MCP server

Your agent can search 161 declassified files by location, agency, era, or type — and pull the direct `war.gov` source link for each.

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
| `search_sightings` | Search by free text, `agency`, `type` (PDF/VID/IMG), `year_start`/`year_end`, or `location`. |
| `search_nearby` | Incidents within a radius (km) of a lat/lng, sorted by distance. |
| `get_sighting` | Full record for one file id (e.g. `pursue-042`) + the `war.gov` link. |
| `hotspots` | The locations with the most declassified records. |
| `stats` | Totals + breakdowns by agency, file type, and era. |
| `timeline` | Records per decade (or year), 1944 → 2026. |

**Example** — *"What UAP files mention the Moon?"* → `search_sightings({ location: "Moon" })` → NASA Gemini/Apollo records with their war.gov links.

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

- **Source:** [war.gov/UFO](https://www.war.gov/UFO/) — PURSUE Release 1 (2026-05-08).
- **License of the data:** Public domain (U.S. federal government work, 17 U.S.C. § 105).
- **Coverage:** 161 records · 114 geolocated · 1944–2026 · agencies: Dept. of War (82), FBI (57), NASA (15), Dept. of State (7).
- Record index mirrored by the community ([vfp2/pursue-ufo-files](https://github.com/vfp2/pursue-ufo-files)); coordinates are representative centroids for each named location, geocoded in [`scripts/build_data.py`](scripts/build_data.py).

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
