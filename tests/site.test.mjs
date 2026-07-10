import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("highlights Release 04 and removes stale public dataset counts", async () => {
  const files = await Promise.all([
    read("../README.md"),
    read("../package.json"),
    read("../site/index.html"),
    read("../site/index.md"),
    read("../site/llms.txt"),
    read("../site/openapi.json"),
    read("../site/.well-known/mcp-server.json"),
    read("../site/.well-known/mcp/server-card.json"),
    read("../site/.well-known/agent-skills/uap-pulse/SKILL.md"),
    read("../site/.well-known/agent-skills/index.json"),
  ]);

  for (const content of files) {
    assert.doesNotMatch(content, /238 records|238 official|Releases 1 & 2|0\.3\.1/);
    assert.match(content, /Release(?:s)? 1(?:–|-)4|Release 04|release 4/i);
  }

  const html = files[2];
  assert.match(html, /id="latest"/);
  assert.match(html, /RELEASE 04 · 40 FILES/);
  assert.match(html, /s\.release === 'Release 4 \(2026-07-10\)'/);
});
