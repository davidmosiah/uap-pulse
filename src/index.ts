#!/usr/bin/env node
/**
 * uap-pulse — MCP server over the Pentagon's declassified UAP files.
 *
 * Data: war.gov/UFO "PURSUE" Release 1 (US Dept. of War, 2026-05-08), public domain
 * (17 U.S.C. 105). 161 records across the Dept. of War, FBI, NASA, and Dept. of State,
 * spanning 1944–2026. No scraped third-party data — government records only.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

type Sighting = {
  id: string;
  title: string;
  agency: string;
  agency_color: string;
  type: string;
  date: string | null;
  year: number | null;
  era: string;
  location: string | null;
  lat: number | null;
  lng: number | null;
  offworld: boolean;
  description: string;
  link: string | null;
};

const dataPath = fileURLToPath(new URL("../data/sightings.json", import.meta.url));
const DB = JSON.parse(readFileSync(dataPath, "utf8")) as {
  meta: Record<string, unknown>;
  sightings: Sighting[];
};
const ALL = DB.sightings;

function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s)));
}

function brief(s: Sighting) {
  return {
    id: s.id,
    title: s.title,
    agency: s.agency,
    type: s.type,
    date: s.date,
    year: s.year,
    era: s.era,
    location: s.location,
    offworld: s.offworld,
    link: s.link,
  };
}

const json = (data: unknown) => ({ content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] });

const server = new McpServer({ name: "uap-pulse", version: "0.3.0" });

server.tool(
  "search_sightings",
  "Search the declassified PURSUE UAP records by free text, agency, file type, year range, or location. Returns matching records (brief form).",
  {
    query: z.string().optional().describe("free text matched against title, description and location"),
    agency: z.string().optional().describe("exact agency name, e.g. 'Department of War', 'FBI', 'NASA', 'Department of State', 'Central Intelligence Agency', 'Department of Energy', 'Office of the Director of National Intelligence'"),
    type: z.enum(["PDF", "VID", "IMG", "AUD"]).optional().describe("PDF document, VID video, IMG image, or AUD audio"),
    year_start: z.number().int().optional(),
    year_end: z.number().int().optional(),
    location: z.string().optional().describe("substring match on the incident location, e.g. 'Iraq', 'Moon'"),
    limit: z.number().int().min(1).max(222).optional().default(25),
  },
  async ({ query, agency, type, year_start, year_end, location, limit }) => {
    const q = query?.toLowerCase();
    const loc = location?.toLowerCase();
    let res = ALL.filter((s) => {
      if (agency && s.agency !== agency) return false;
      if (type && s.type !== type) return false;
      if (year_start && (s.year ?? -Infinity) < year_start) return false;
      if (year_end && (s.year ?? Infinity) > year_end) return false;
      if (loc && !(s.location ?? "").toLowerCase().includes(loc)) return false;
      if (q && !(`${s.title} ${s.description} ${s.location ?? ""}`.toLowerCase().includes(q))) return false;
      return true;
    });
    const total = res.length;
    res = res.slice(0, limit);
    return json({ total_matches: total, returned: res.length, sightings: res.map(brief) });
  }
);

server.tool(
  "search_nearby",
  "Find declassified UAP incidents within a radius (km) of a latitude/longitude. Sorted by distance. Off-world records (Moon, orbit) are excluded.",
  {
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    radius_km: z.number().min(1).max(20000).optional().default(1000),
    limit: z.number().int().min(1).max(222).optional().default(25),
  },
  async ({ latitude, longitude, radius_km, limit }) => {
    const hits = ALL.filter((s) => s.lat != null && s.lng != null && !s.offworld)
      .map((s) => ({ s, distance_km: haversineKm(latitude, longitude, s.lat as number, s.lng as number) }))
      .filter((h) => h.distance_km <= radius_km)
      .sort((a, b) => a.distance_km - b.distance_km)
      .slice(0, limit)
      .map((h) => ({ ...brief(h.s), distance_km: h.distance_km, lat: h.s.lat, lng: h.s.lng }));
    return json({ center: { latitude, longitude }, radius_km, returned: hits.length, sightings: hits });
  }
);

server.tool(
  "get_sighting",
  "Get the full record for one UAP file by id (e.g. 'pursue-042'), including the full description and the direct war.gov source link.",
  { id: z.string().describe("record id, e.g. 'pursue-042'") },
  async ({ id }) => {
    const s = ALL.find((x) => x.id === id.toLowerCase());
    if (!s) return json({ error: `no record with id '${id}'`, hint: "ids look like 'pursue-001'..'pursue-222'" });
    return json(s);
  }
);

server.tool(
  "hotspots",
  "Rank the incident locations by how many declassified records mention them (the UAP hotspots).",
  { limit: z.number().int().min(1).max(50).optional().default(10) },
  async ({ limit }) => {
    const counts = new Map<string, { count: number; lat: number | null; lng: number | null; offworld: boolean }>();
    for (const s of ALL) {
      if (!s.location) continue;
      const cur = counts.get(s.location) ?? { count: 0, lat: s.lat, lng: s.lng, offworld: s.offworld };
      cur.count++;
      counts.set(s.location, cur);
    }
    const ranked = [...counts.entries()]
      .map(([location, v]) => ({ location, ...v }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
    return json({ hotspots: ranked });
  }
);

server.tool(
  "stats",
  "Summary statistics for the PURSUE release: totals and breakdowns by agency, file type, and era.",
  {},
  async () => {
    const by = (key: keyof Sighting) => {
      const m: Record<string, number> = {};
      for (const s of ALL) {
        const k = String(s[key] ?? "Unknown");
        m[k] = (m[k] ?? 0) + 1;
      }
      return m;
    };
    const years = ALL.map((s) => s.year).filter((y): y is number => y != null);
    return json({
      total_records: ALL.length,
      with_coordinates: ALL.filter((s) => s.lat != null).length,
      off_world: ALL.filter((s) => s.offworld).length,
      year_range: years.length ? { earliest: Math.min(...years), latest: Math.max(...years) } : null,
      by_agency: by("agency"),
      by_type: by("type"),
      by_era: by("era"),
      source: DB.meta.source,
      license: DB.meta.license,
    });
  }
);

server.tool(
  "timeline",
  "Count declassified UAP records per decade (or per year), to see how sightings cluster over time (1944–2026).",
  { granularity: z.enum(["decade", "year"]).optional().default("decade") },
  async ({ granularity }) => {
    const buckets: Record<string, number> = {};
    for (const s of ALL) {
      if (s.year == null) continue;
      const key = granularity === "year" ? String(s.year) : `${Math.floor(s.year / 10) * 10}s`;
      buckets[key] = (buckets[key] ?? 0) + 1;
    }
    const timeline = Object.entries(buckets)
      .map(([period, count]) => ({ period, count }))
      .sort((a, b) => a.period.localeCompare(b.period));
    return json({ granularity, timeline });
  }
);

server.tool(
  "full_text_search",
  "Relevance-ranked free-text search across every record's title, location and description. Use this for thematic digs ('FLIR', 'orb', 'triangular', 'heat source', 'radar').",
  {
    query: z.string().describe("text to search for across all fields"),
    limit: z.number().int().min(1).max(222).optional().default(20),
  },
  async ({ query, limit }) => {
    const q = query.toLowerCase();
    const scored = ALL.map((s) => {
      let score = 0;
      if ((s.title ?? "").toLowerCase().includes(q)) score += 3;
      if ((s.location ?? "").toLowerCase().includes(q)) score += 2;
      if ((s.description ?? "").toLowerCase().includes(q)) score += 1;
      return { s, score };
    }).filter((x) => x.score > 0).sort((a, b) => b.score - a.score).slice(0, limit);
    return json({
      query,
      total_matches: scored.length,
      results: scored.map(({ s, score }) => {
        const d = (s.description ?? "");
        const i = d.toLowerCase().indexOf(q);
        const snippet = i >= 0 ? d.slice(Math.max(0, i - 60), i + 100) : d.slice(0, 140);
        return { ...brief(s), relevance: score, snippet: snippet.trim() };
      }),
    });
  }
);

const NOTABLE: { key: string; label: string; why: string; match: (s: Sighting) => boolean }[] = [
  { key: "foo-fighters", label: "WWII 'Foo Fighters' (1944–45)", why: "Allied aircrews over Europe reported glowing orbs tailing their planes; the SHAEF files are the earliest records in the release.", match: (s) => /foo|shaef|1944|1945|german_armamen/i.test(`${s.title} ${s.description}`) || (s.year != null && s.year <= 1945) },
  { key: "gemini-7", label: "Gemini 7 (NASA, 1965)", why: "Astronaut transcript + audio describing objects in orbit — one of the off-world records.", match: (s) => /gemini/i.test(`${s.title} ${s.description}`) },
  { key: "apollo", label: "Apollo crew debriefings (NASA)", why: "Apollo 11/12/17 crew debriefings and a photograph of a triangular formation in the lunar sky.", match: (s) => /apollo/i.test(`${s.title} ${s.description}`) },
  { key: "maury-island", label: "Maury Island (FBI, 1947)", why: "Early FBI investigation with claimed physical-evidence photographs.", match: (s) => /maury\s*island/i.test(`${s.title} ${s.description}`) },
  { key: "presidential-1963", label: "1963 presidential UAP memo (State Dept.)", why: "A 1963 memo to the President referencing 'the space alien race question'.", match: (s) => /1963|space alien|presidential/i.test(`${s.title} ${s.description}`) },
  { key: "fbi-62hq", label: "FBI case file 62-HQ-83894 (1947–73)", why: "The FBI's long-running UFO case file: investigative records and eyewitness testimony.", match: (s) => /62-hq-83894|83894/i.test(`${s.title} ${s.description}`) },
  { key: "navy-era", label: "Navy era — Gulf/Syria/Iraq ops (2022–26)", why: "Recent military encounters with IR/FLIR footage from the Arabian Gulf, Syria and Iraq — the modern Tic-Tac-style cases.", match: (s) => (s.year != null && s.year >= 2016) },
];

server.tool(
  "notable_cases",
  "Return curated, historically significant cases from the release (Foo Fighters, Gemini 7, Apollo, Maury Island, the 1963 presidential memo, the FBI case file, the Navy era) — each with the matching records and why it matters.",
  { key: z.enum(NOTABLE.map((n) => n.key) as [string, ...string[]]).optional().describe("optional: just one case group") },
  async ({ key }) => {
    const groups = (key ? NOTABLE.filter((n) => n.key === key) : NOTABLE).map((n) => ({
      key: n.key,
      label: n.label,
      why: n.why,
      records: ALL.filter(n.match).slice(0, 8).map(brief),
    })).filter((g) => g.records.length > 0);
    return json({ notable_cases: groups });
  }
);

server.tool(
  "timeline_data",
  "Per-period records WITH coordinates — for building animated timelines / maps that play through 1944→2026.",
  { granularity: z.enum(["decade", "year"]).optional().default("decade") },
  async ({ granularity }) => {
    const buckets = new Map<string, Sighting[]>();
    for (const s of ALL) {
      if (s.year == null) continue;
      const key = granularity === "year" ? String(s.year) : `${Math.floor(s.year / 10) * 10}s`;
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key)!.push(s);
    }
    const periods = [...buckets.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([period, arr]) => ({
      period,
      count: arr.length,
      records: arr.map((s) => ({ id: s.id, year: s.year, agency: s.agency, type: s.type, location: s.location, lat: s.lat, lng: s.lng, offworld: s.offworld })),
    }));
    return json({ granularity, periods });
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("uap-pulse MCP server v0.2 running (stdio) — 222 declassified PURSUE records (Releases 1+2), 9 tools.");
