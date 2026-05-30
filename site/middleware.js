// Vercel Edge Middleware — "Markdown for Agents".
// When an agent requests the homepage with `Accept: text/markdown`, serve a
// markdown rendering; browsers (Accept: text/html) fall through to index.html.
export const config = { matcher: "/" };

const MD = `# PURSUE — The Pentagon's Declassified UAP Files

An interactive 3D map and an MCP server over the U.S. Department of War's PURSUE Releases 1 & 2 (war.gov, May 2026): 238 declassified UAP/UFO records spanning 1944-2026, across seven U.S. federal agencies (War, FBI, NASA, State, CIA, ODNI, Energy). All data is U.S. public domain (17 U.S.C. 105).

## Dataset
- 238 records, 186 geolocated, 15 off-world (Moon/orbit/cislunar)
- War 131, FBI 57, NASA 22, State 7, CIA 1, ODNI 1, DOE 3
- 122 PDFs, 78 videos, 14 images, 8 audio (each links to war.gov)

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
