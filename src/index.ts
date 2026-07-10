#!/usr/bin/env node
/**
 * uap-pulse — MCP server over the Pentagon's declassified UAP files.
 *
 * Data: war.gov/UFO "PURSUE" Releases 1–4 (US Dept. of War, 2026), public domain
 * (17 U.S.C. 105), plus curated official-government records from 12 nations.
 * No scraped third-party databases.
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
  release: string;
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
const MAX_RESULTS = ALL.length;
const VERSION = "0.4.0";
const RELEASE_LABELS = {
  1: "Release 1 (2026-05-08)",
  2: "Release 2 (2026-05-22)",
  3: "Release 3 (2026-06-12)",
  4: "Release 4 (2026-07-10)",
} as const;
const READ_ONLY_TOOL = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
} as const;

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
    release: s.release,
    date: s.date,
    year: s.year,
    era: s.era,
    location: s.location,
    offworld: s.offworld,
    link: s.link,
  };
}

const json = (data: unknown) => ({ content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] });

const server = new McpServer({ name: "uap-pulse", version: VERSION });

server.registerTool(
  "search_sightings",
  {
    title: "Search UAP Sightings",
    description: "Search the declassified PURSUE UAP records by release, free text, agency, file type, year range, or location. Returns matching records in brief form.",
    inputSchema: {
      query: z.string().optional().describe("free text matched against title, description and location"),
      release: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]).optional().describe("PURSUE release number, from 1 through 4"),
      agency: z.string().optional().describe("exact agency name, e.g. 'Department of War', 'FBI', 'NASA', 'Department of State', 'Central Intelligence Agency', 'Department of Energy', 'Office of the Director of National Intelligence'"),
      type: z.enum(["PDF", "VID", "IMG", "AUD", "DOC"]).optional().describe("PDF document, VID video, IMG image, AUD audio, or DOC (international official record)"),
      year_start: z.number().int().optional(),
      year_end: z.number().int().optional(),
      location: z.string().optional().describe("substring match on the incident location, e.g. 'Iraq', 'Moon'"),
      limit: z.number().int().min(1).max(MAX_RESULTS).optional().default(25),
    },
    annotations: READ_ONLY_TOOL,
  },
  async ({ query, release, agency, type, year_start, year_end, location, limit }) => {
    const q = query?.toLowerCase();
    const loc = location?.toLowerCase();
    let res = ALL.filter((s) => {
      if (release && s.release !== RELEASE_LABELS[release]) return false;
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

server.registerTool(
  "search_nearby",
  {
    title: "Search Nearby UAP Sightings",
    description: "Find declassified UAP incidents within a radius (km) of a latitude/longitude. Results are sorted by distance; off-world records are excluded.",
    inputSchema: {
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
      radius_km: z.number().min(1).max(20000).optional().default(1000),
      limit: z.number().int().min(1).max(MAX_RESULTS).optional().default(25),
    },
    annotations: READ_ONLY_TOOL,
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

server.registerTool(
  "get_sighting",
  {
    title: "Get UAP Sighting",
    description: "Get the full record for one UAP file by id, including its release, full description, and direct official source link.",
    inputSchema: { id: z.string().describe("record id, e.g. 'pursue-042'") },
    annotations: READ_ONLY_TOOL,
  },
  async ({ id }) => {
    const s = ALL.find((x) => x.id === id.toLowerCase());
    if (!s) return json({ error: `no record with id '${id}'`, hint: "ids look like 'pursue-001'..'pursue-334' or 'world-001'..." });
    return json(s);
  }
);

server.registerTool(
  "hotspots",
  {
    title: "Rank UAP Hotspots",
    description: "Rank incident locations by how many declassified records mention them.",
    inputSchema: { limit: z.number().int().min(1).max(50).optional().default(10) },
    annotations: READ_ONLY_TOOL,
  },
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

server.registerTool(
  "stats",
  {
    title: "Summarize UAP Dataset",
    description: "Return totals and breakdowns by PURSUE release, agency, file type, and era.",
    inputSchema: {},
    annotations: READ_ONLY_TOOL,
  },
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
      by_release: by("release"),
      by_type: by("type"),
      by_era: by("era"),
      source: DB.meta.source,
      license: DB.meta.license,
    });
  }
);

server.registerTool(
  "timeline",
  {
    title: "Summarize UAP Timeline",
    description: "Count declassified UAP records per decade or year to show how records cluster over time.",
    inputSchema: { granularity: z.enum(["decade", "year"]).optional().default("decade") },
    annotations: READ_ONLY_TOOL,
  },
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

server.registerTool(
  "full_text_search",
  {
    title: "Full-Text Search UAP Records",
    description: "Run a relevance-ranked search across every record's title, location, and description for thematic research.",
    inputSchema: {
      query: z.string().describe("text to search for across all fields"),
      limit: z.number().int().min(1).max(MAX_RESULTS).optional().default(20),
    },
    annotations: READ_ONLY_TOOL,
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

server.registerTool(
  "notable_cases",
  {
    title: "Browse Notable UAP Cases",
    description: "Return curated, historically significant cases with matching official records and context for why each case matters.",
    inputSchema: { key: z.enum(NOTABLE.map((n) => n.key) as [string, ...string[]]).optional().describe("optional: just one case group") },
    annotations: READ_ONLY_TOOL,
  },
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

server.registerTool(
  "timeline_data",
  {
    title: "Get UAP Timeline Map Data",
    description: "Return per-period records with coordinates for building timelines and maps across 1944–2026.",
    inputSchema: { granularity: z.enum(["decade", "year"]).optional().default("decade") },
    annotations: READ_ONLY_TOOL,
  },
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
console.error(`uap-pulse MCP server v${VERSION} running (stdio) — ${ALL.length} official UAP records (US PURSUE Releases 1–4 + 12 nations), 9 tools.`);
