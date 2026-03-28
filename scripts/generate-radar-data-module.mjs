import fs from "node:fs";
import path from "node:path";
import { parse } from "yaml";

import { normalizeRadarData } from "../src/radar/normalizeRadarData.mjs";

const repoRoot = process.cwd();
const dataDir = path.join(repoRoot, "data");
const radarsDir = path.join(dataDir, "radars");
const outputPath = path.join(repoRoot, "src", "generated", "radarData.mjs");

function readYaml(filePath) {
  return parse(fs.readFileSync(filePath, "utf8"));
}

function sortQuadrantFiles(radar, quadrantDir, filenames) {
  const order = new Map(radar.quadrants.map((quadrant, index) => [quadrant.key, index]));
  return filenames.sort((left, right) => {
    const leftQuadrant = readYaml(path.join(quadrantDir, left)).quadrant;
    const rightQuadrant = readYaml(path.join(quadrantDir, right)).quadrant;
    return order.get(leftQuadrant) - order.get(rightQuadrant);
  });
}

function listRadarConfigs(home) {
  const configuredRadars = home.radars;

  if (Array.isArray(configuredRadars) && configuredRadars.length > 0) {
    return configuredRadars;
  }

  return fs
    .readdirSync(radarsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => ({
      key: entry.name,
      label: entry.name,
    }))
    .sort((left, right) => left.key.localeCompare(right.key));
}

export function generateRadarDataModule() {
  const home = readYaml(path.join(dataDir, "home.yml"));
  const radarCollection = listRadarConfigs(home).map((radarConfig) => {
    const radarDir = path.join(radarsDir, radarConfig.key);
    const radar = readYaml(path.join(radarDir, "radar.yml"));
    const quadrantsDir = path.join(radarDir, "quadrants");
    const quadrantFilenames = sortQuadrantFiles(
      radar,
      quadrantsDir,
      fs.readdirSync(quadrantsDir).filter((name) => name.endsWith(".yml")),
    );
    const quadrantFiles = quadrantFilenames.map((filename) => readYaml(path.join(quadrantsDir, filename)));

    return {
      key: radarConfig.key,
      label: radarConfig.label || radar.title,
      source: {
        radar,
        quadrants: quadrantFiles,
      },
      data: normalizeRadarData(radar, quadrantFiles),
    };
  });
  const defaultRadarKey =
    radarCollection.find((radar) => radar.key === home.default_radar)?.key ||
    radarCollection[0]?.key ||
    "";

  const moduleSource = [
    `export const homeContent = ${JSON.stringify(home, null, 2)};`,
    `export const defaultRadarKey = ${JSON.stringify(defaultRadarKey)};`,
    `export const radarCollection = ${JSON.stringify(radarCollection, null, 2)};`,
    "",
  ].join("\n");

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, moduleSource, "utf8");
}

generateRadarDataModule();
