import fs from "node:fs";
import path from "node:path";
import { parse } from "yaml";

import { normalizeRadarData } from "../src/radar/normalizeRadarData.mjs";

const repoRoot = process.cwd();
const dataDir = path.join(repoRoot, "data");
const quadrantsDir = path.join(dataDir, "quadrants");
const outputPath = path.join(repoRoot, "src", "generated", "radarData.mjs");

function readYaml(filePath) {
  return parse(fs.readFileSync(filePath, "utf8"));
}

function sortQuadrantFiles(radar, filenames) {
  const order = new Map(radar.quadrants.map((quadrant, index) => [quadrant.key, index]));
  return filenames.sort((left, right) => {
    const leftQuadrant = readYaml(path.join(quadrantsDir, left)).quadrant;
    const rightQuadrant = readYaml(path.join(quadrantsDir, right)).quadrant;
    return order.get(leftQuadrant) - order.get(rightQuadrant);
  });
}

export function generateRadarDataModule() {
  const home = readYaml(path.join(dataDir, "home.yml"));
  const radar = readYaml(path.join(dataDir, "radar.yml"));
  const quadrantFilenames = sortQuadrantFiles(
    radar,
    fs.readdirSync(quadrantsDir).filter((name) => name.endsWith(".yml")),
  );
  const quadrantFiles = quadrantFilenames.map((filename) => readYaml(path.join(quadrantsDir, filename)));
  const normalized = normalizeRadarData(radar, quadrantFiles);

  const moduleSource = [
    `export const homeContent = ${JSON.stringify(home, null, 2)};`,
    `export const radarSource = ${JSON.stringify({ radar, quadrants: quadrantFiles }, null, 2)};`,
    `export const radarData = ${JSON.stringify(normalized, null, 2)};`,
    "",
  ].join("\n");

  fs.writeFileSync(outputPath, moduleSource, "utf8");
}

generateRadarDataModule();
