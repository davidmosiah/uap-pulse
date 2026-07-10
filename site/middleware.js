// Vercel Edge Middleware — "Markdown for Agents".
// When an agent requests the homepage with `Accept: text/markdown`, serve a
// markdown rendering; browsers (Accept: text/html) fall through to index.html.
export const config = { matcher: "/" };

const MD = `# PURSUE — The Pentagon's Declassified UAP Files

An interactive 3D map and an MCP server over 350 official-government UAP/UFO records spanning 1944-2026: all four U.S. Department of War PURSUE releases plus curated archives from 12 nations. U.S. records are public domain under 17 U.S.C. 105.

## Dataset
- 350 records: 334 U.S. PURSUE files + 16 curated international official cases
- 275 geolocated, 20 off-world (Moon/orbit/cislunar)
- Release 04: 40 files published July 10, 2026
- U.S. agencies: War 171, FBI 87, NASA 40, CIA 21, State 7, DOE 5, other 3
- 189 PDFs, 106 videos, 27 images, 15 audio, 13 international documents

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
