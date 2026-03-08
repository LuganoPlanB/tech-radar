import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const repoRoot = process.cwd();
const sourcePath = path.join(repoRoot, "docs", "index.html");
const dataDir = path.join(repoRoot, "data");
const quadrantsDir = path.join(dataDir, "quadrants");

const quadrantKeys = [
  "languages",
  "infra_hosting",
  "network_security",
  "data_management",
];

const ringKeys = ["adopt", "trial", "assess", "hold"];

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_");
}

function uniqueKey(baseKey, usedKeys) {
  if (!usedKeys.has(baseKey)) {
    usedKeys.add(baseKey);
    return baseKey;
  }

  let suffix = 2;
  while (usedKeys.has(`${baseKey}_${suffix}`)) {
    suffix += 1;
  }

  const key = `${baseKey}_${suffix}`;
  usedKeys.add(key);
  return key;
}

function readLegacyConfig() {
  const html = fs.readFileSync(sourcePath, "utf8");
  const match = html.match(/radar_visualization\((\{[\s\S]*?\})\);/);

  if (!match) {
    throw new Error("Could not locate radar_visualization config in docs/index.html");
  }

  const context = { result: null };
  vm.createContext(context);
  vm.runInContext(`result = ${match[1]}`, context);
  return context.result;
}

function stringifyScalar(value) {
  if (typeof value === "string") {
    return JSON.stringify(value);
  }
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  if (value === null) {
    return "null";
  }
  return String(value);
}

function toYaml(value, indent = 0) {
  const pad = " ".repeat(indent);

  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (item && typeof item === "object") {
          const lines = toYaml(item, indent + 2).split("\n");
          return `${pad}- ${lines[0].trimStart()}\n${lines
            .slice(1)
            .map((line) => `${pad}  ${line.trimStart()}`)
            .join("\n")}`;
        }
        return `${pad}- ${stringifyScalar(item)}`;
      })
      .join("\n");
  }

  if (value && typeof value === "object") {
    return Object.entries(value)
      .map(([key, item]) => {
        if (Array.isArray(item)) {
          return `${pad}${key}:\n${toYaml(item, indent + 2)}`;
        }
        if (item && typeof item === "object") {
          return `${pad}${key}:\n${toYaml(item, indent + 2)}`;
        }
        return `${pad}${key}: ${stringifyScalar(item)}`;
      })
      .join("\n");
  }

  return `${pad}${stringifyScalar(value)}`;
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function writeYaml(filePath, data) {
  fs.writeFileSync(filePath, `${toYaml(data)}\n`, "utf8");
}

function main() {
  const config = readLegacyConfig();
  const usedKeys = new Set();

  ensureDir(quadrantsDir);

  const radarData = {
    title: config.title,
    width: config.width,
    height: config.height,
    colors: config.colors,
    print_layout: config.print_layout,
    links_in_new_tabs: config.links_in_new_tabs,
    quadrants: config.quadrants.map((quadrant, index) => ({
      key: quadrantKeys[index],
      name: quadrant.name,
    })),
    rings: config.rings.map((ring, index) => ({
      key: ringKeys[index],
      name: ring.name,
      color: ring.color,
    })),
  };

  writeYaml(path.join(dataDir, "radar.yml"), radarData);

  config.quadrants.forEach((quadrant, quadrantIndex) => {
    const entries = config.entries
      .filter((entry) => entry.quadrant === quadrantIndex)
      .map((entry) => ({
        key: uniqueKey(slugify(entry.label), usedKeys),
        label: entry.label,
        ring: ringKeys[entry.ring],
        moved: entry.moved,
        active: entry.active,
        link: entry.link,
      }));

    writeYaml(
      path.join(quadrantsDir, `${quadrantKeys[quadrantIndex]}.yml`),
      {
        quadrant: quadrantKeys[quadrantIndex],
        entries,
      },
    );
  });
}

main();
