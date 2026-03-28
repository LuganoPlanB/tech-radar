import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const repoRoot = process.cwd();
const sourcePath = path.join(repoRoot, "docs", "index.html");
const dataDir = path.join(repoRoot, "data");
const radarsDir = path.join(dataDir, "radars");
const defaultRadarKey = "innovation-radar";
const defaultRadarPath = path.join(radarsDir, `${defaultRadarKey}.yml`);

const ringKeys = ["adopt", "trial", "assess", "hold"];

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
  const homePath = path.join(dataDir, "home.yml");
  const existingHome = fs.existsSync(homePath) ? readYaml(homePath) : {};

  ensureDir(radarsDir);

  writeYaml(homePath, {
    ...existingHome,
    default_radar: defaultRadarKey,
  });

  const radarData = {
    active: true,
    label: "Innovation Radar",
    title: config.title,
    width: config.width,
    height: config.height,
    colors: config.colors,
    print_layout: config.print_layout,
    links_in_new_tabs: config.links_in_new_tabs,
    rings: config.rings.map((ring, index) => ({
      key: ringKeys[index],
      name: ring.name,
      color: ring.color,
    })),
    quadrants: config.quadrants.map((quadrant, quadrantIndex) => ({
      name: quadrant.name,
      entries: config.entries
        .filter((entry) => entry.quadrant === quadrantIndex)
        .map((entry) => ({
          label: entry.label,
          ring: ringKeys[entry.ring],
          moved: entry.moved,
          active: entry.active,
          link: entry.link,
        })),
    })),
  };

  writeYaml(defaultRadarPath, radarData);
}

main();
