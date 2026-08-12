import assert from "node:assert/strict";
import test from "node:test";
import { createServer } from "../dist/index.js";
import { listenHttpV2 } from "../dist/http-v2.js";

const initBody = {
  jsonrpc: "2.0",
  id: 1,
  method: "initialize",
  params: {
    protocolVersion: "2025-03-26",
    capabilities: {},
    clientInfo: { name: "http-v2-test", version: "0" }
  }
};

test("v2 stateless HTTP: dual listen, health, sessionless initialize", async () => {
  const first = await listenHttpV2({
    name: "uap-pulse",
    version: "test",
    createServer,
    host: "127.0.0.1",
    port: 0
  });
  const second = await listenHttpV2({
    name: "uap-pulse",
    version: "test",
    createServer,
    host: "127.0.0.1",
    port: 0
  });
  try {
    for (const { url } of [first, second]) {
      const health = await (await fetch(`${url}/health`)).json();
      assert.equal(health.ok, true);
      assert.equal(health.name, "uap-pulse");
      const mcpRes = await fetch(`${url}/mcp`, {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
        body: JSON.stringify(initBody)
      });
      const text = await mcpRes.text();
      assert.equal(mcpRes.headers.get("mcp-session-id"), null);
      assert.match(text, /"jsonrpc"\s*:\s*"2\.0"/);
      assert.doesNotMatch(text, /<html/i);
    }
  } finally {
    await first.close();
    await second.close();
  }
});
