import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const dataset = JSON.parse(
  await readFile(new URL("../data/sightings.json", import.meta.url), "utf8"),
);
const siteDataset = JSON.parse(
  await readFile(new URL("../site/sightings.json", import.meta.url), "utf8"),
);
const legacyIds = JSON.parse(
  await readFile(new URL("../scripts/legacy_ids.json", import.meta.url), "utf8"),
);

test("bundles all four PURSUE releases plus the curated international cases", () => {
  assert.equal(dataset.meta.us_record_count, 334);
  assert.equal(dataset.meta.record_count, 350);
  assert.equal(dataset.sightings.length, 350);

  const releases = Object.groupBy(dataset.sightings, (item) => item.release);
  assert.equal(releases["Release 3 (2026-06-12)"].length, 72);
  assert.equal(releases["Release 4 (2026-07-10)"].length, 40);
  assert.equal(releases["International (official government archives)"].length, 16);
});

test("includes the featured Los Alamos record with its official source", () => {
  const record = dataset.sightings.find((item) => item.title.includes("Los Alamos Conference"));

  assert.ok(record);
  assert.equal(record.agency, "Department of Energy");
  assert.equal(record.location, "New Mexico");
  assert.equal(record.year, 1949);
  assert.match(record.link, /war\.gov\/medialink\/ufo\/071026\/release_04/i);
});

test("maps the new Release 04 locations and STS-80 off-world images", () => {
  for (const location of ["Eastern United States", "Gulf of America", "South China Sea"]) {
    const record = dataset.sightings.find((item) => item.location === location);
    assert.ok(record, `missing ${location}`);
    assert.equal(typeof record.lat, "number", `${location} latitude`);
    assert.equal(typeof record.lng, "number", `${location} longitude`);
  }

  const sts80 = dataset.sightings.find((item) => item.title.includes("STS-80 Unidentified Object Image 1"));
  assert.ok(sts80);
  assert.equal(sts80.offworld, true);
});

test("geolocates every named place except intentionally ambiguous records", () => {
  const unmapped = dataset.sightings
    .filter((item) => item.location && item.location !== "Various" && !item.offworld && item.lat === null)
    .map((item) => item.location);

  assert.deepEqual([...new Set(unmapped)].sort(), []);
});

test("serves the same dataset from the package and static site", () => {
  assert.deepEqual(siteDataset, dataset);
});

test("preserves every public ID from Releases 01 and 02", () => {
  for (const [title, id] of Object.entries(legacyIds)) {
    const record = dataset.sightings.find((item) => item.title === title);
    assert.ok(record, `missing legacy record: ${title}`);
    assert.equal(record.id, id, title);
  }
});
