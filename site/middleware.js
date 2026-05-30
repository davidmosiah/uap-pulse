// Vercel Edge Middleware — "Markdown for Agents".
// When an agent requests the homepage with `Accept: text/markdown`, serve a
// markdown rendering; browsers (Accept: text/html) fall through to index.html.
export const config = { matcher: "/" };

const MD = `# PURSUE — The Pentagon's Declassified UAP Files

An interactive 3D map and an MCP server over the U.S. Department of War's PURSUE Release (war.gov, 2026-05-08): 161 declassified UAP/UFO records spanning 1944-2026, across the Department of War, FBI, NASA, and the Department of State. All data is U.S. public domain (17 U.S.C. 105).

## Dataset
- 161 records, 114 geolocated, 10 off-world (Moon/orbit)
- Department of War 82, FBI 57, NASA 15, Department of State 7
- 119 PDFs, 28 videos, 14 images (each links to war.gov)

## Query with your AI agent (no auth)
Install: \`npx -y uap-pulse\`
Tools: search_sightings, search_nearby, get_sighting, full_text_search, notable_cases, hotspots, stats, timeline, timeline_data.

## Links
- Live map: https://uap-pulse.vercel.app
- Source: https://github.com/davidmosiah/uap-pulse
- npm: https://www.npmjs.com/package/uap-pulse
- Data (JSON): https://uap-pulse.vercel.app/sightings.json
- For agents: https://uap-pulse.vercel.app/llms.txt
`;

export default function middleware(request) {
  const accept = request.headers.get("accept") || "";
  if (accept.includes("text/markdown")) {
    return new Response(MD, {
      status: 200,
      headers: {
        "content-type": "text/markdown; charset=utf-8",
        "x-markdown-tokens": String(Math.round(MD.length / 4)),
        "access-control-allow-origin": "*",
      },
    });
  }
  // else: fall through to the static index.html
}
