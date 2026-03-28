import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

import { generateRadarDataModule } from "../scripts/generate-radar-data-module.mjs";

test("generateRadarDataModule exports the configured radar collection", async () => {
  generateRadarDataModule();

  const generatedPath = path.join(process.cwd(), "src", "generated", "radarData.mjs");
  const generatedModule = await import(`${pathToFileURL(generatedPath).href}?t=${Date.now()}`);

  assert.equal(generatedModule.defaultRadarKey, "innovation-radar");
  assert.deepEqual(
    generatedModule.radarCollection.map((radar) => radar.key),
    ["innovation-radar", "business-radar", "development-radar"],
  );
  assert.deepEqual(
    generatedModule.radarCollection.map((radar) => radar.label),
    ["Innovation Radar", "Business Radar", "Development Radar"],
  );
  assert.ok(generatedModule.radarCollection.every((radar) => radar.source.quadrants.length === 4));
  assert.ok(generatedModule.radarCollection.every((radar) => radar.data.quadrants.length === 4));
  assert.ok(generatedModule.radarCollection.every((radar) => !("key" in radar.source.quadrants[0])));
  assert.ok(generatedModule.radarCollection.every((radar) => typeof radar.source.label === "string"));
});
