import assert from "node:assert/strict";
import test from "node:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

test("queries and summarizes the latest PURSUE release over MCP", async () => {
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [new URL("../dist/index.js", import.meta.url).pathname],
    stderr: "pipe",
  });
  const client = new Client({ name: "uap-pulse-test", version: "1.0.0" });

  await client.connect(transport);
  try {
    const { tools } = await client.listTools();
    const searchTool = tools.find((tool) => tool.name === "search_sightings");
    assert.ok(searchTool);
    assert.ok(searchTool.inputSchema.properties.release);

    const searchResponse = await client.callTool({
      name: "search_sightings",
      arguments: { release: 4, limit: 100 },
    });
    const search = JSON.parse(searchResponse.content[0].text);
    assert.equal(search.total_matches, 40);
    assert.equal(search.returned, 40);
    assert.ok(search.sightings.every((item) => item.release === "Release 4 (2026-07-10)"));

    const statsResponse = await client.callTool({ name: "stats", arguments: {} });
    const stats = JSON.parse(statsResponse.content[0].text);
    assert.equal(stats.total_records, 350);
    assert.equal(stats.by_release["Release 4 (2026-07-10)"], 40);
  } finally {
    await client.close();
  }
});
