import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";
import { parse } from "yaml";

import { generateRadarDataModule } from "../scripts/generate-radar-data-module.mjs";

test("generateRadarDataModule exports the configured radar collection", async () => {
  generateRadarDataModule();

  const generatedPath = path.join(process.cwd(), "src", "generated", "radarData.mjs");
  const generatedModule = await import(`${pathToFileURL(generatedPath).href}?t=${Date.now()}`);
  const radarsDir = path.join(process.cwd(), "data", "radars");
  const activeRadars = fs.readdirSync(radarsDir)
    .filter((name) => name.endsWith(".yml"))
    .map((name) => ({
      key: path.basename(name, ".yml"),
      data: parse(fs.readFileSync(path.join(radarsDir, name), "utf8")),
    }))
    .filter((radar) => radar.data.active !== false)
    .sort((left, right) => {
      if (left.key === "innovation-radar") {
        return -1;
      }
      if (right.key === "innovation-radar") {
        return 1;
      }
      return left.key.localeCompare(right.key);
    });

  assert.equal(generatedModule.defaultRadarKey, "innovation-radar");
  assert.deepEqual(
    generatedModule.radarCollection.map((radar) => radar.key),
    activeRadars.map((radar) => radar.key),
  );
  assert.deepEqual(
    generatedModule.radarCollection.map((radar) => radar.label),
    activeRadars.map((radar) => radar.data.label),
  );
  assert.ok(generatedModule.radarCollection.every((radar) => radar.source.quadrants.length === 4));
  assert.ok(generatedModule.radarCollection.every((radar) => radar.data.quadrants.length === 4));
  assert.ok(generatedModule.radarCollection.every((radar) => !("key" in radar.source.quadrants[0])));
  assert.ok(generatedModule.radarCollection.every((radar) => typeof radar.source.label === "string"));
  assert.ok(generatedModule.radarCollection.every((radar) => radar.source.active !== false));
});
