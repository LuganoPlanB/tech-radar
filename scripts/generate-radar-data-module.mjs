import fs from "node:fs";
import path from "node:path";
import { parse } from "yaml";

import { normalizeRadarData } from "../src/radar/normalizeRadarData.mjs";
import { validateHomeData, validateRadarData, validateRadarDirectory } from "./validateRadarData.mjs";

const repoRoot = process.cwd();
const dataDir = path.join(repoRoot, "data");
const radarsDir = path.join(dataDir, "radars");
const outputPath = path.join(repoRoot, "src", "generated", "radarData.mjs");

function readYaml(filePath) {
  return parse(fs.readFileSync(filePath, "utf8"));
}

function listRadarFiles() {
  return fs
    .readdirSync(radarsDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".yml"))
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));
}

export function generateRadarDataModule() {
  const homePath = path.join(dataDir, "home.yml");
  const home = readYaml(homePath);
  const radarFiles = listRadarFiles();

  validateHomeData(homePath, home);
  validateRadarDirectory(homePath, home, radarFiles.map((filename) => path.join(radarsDir, filename)));

  const radarCollection = radarFiles.map((filename) => {
    const radarPath = path.join(radarsDir, filename);
    const radar = readYaml(radarPath);
    const key = path.basename(filename, ".yml");
    validateRadarData(radarPath, radar);

    return {
      key,
      label: radar.label || radar.title,
      source: radar,
      data: normalizeRadarData(radar),
    };
  }).sort((left, right) => {
    if (left.key === home.default_radar) {
      return -1;
    }
    if (right.key === home.default_radar) {
      return 1;
    }
    return left.key.localeCompare(right.key);
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
