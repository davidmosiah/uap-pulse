# auth.md — uap-pulse

**Agent audience:** any AI agent or MCP client. **No authentication is required — this service is fully public and open.**

- **MCP server:** runs locally over stdio via `npx -y uap-pulse`. No API key, no OAuth, no registration.
- **Data endpoint:** `https://uap-pulse.vercel.app/sightings.json` is openly readable (CORS `*`), no credentials.
- **Data license:** U.S. public domain (17 U.S.C. § 105). Free to read, query, and redistribute.

There are no protected resources, so there is no OAuth authorization server, token endpoint, or agent registration flow to discover. Agents may use everything immediately and anonymously.

Contact: https://github.com/davidmosiah/uap-pulse
