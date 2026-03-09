import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { parseDocument } from "yaml";

const repoRoot = process.cwd();
const dataDir = path.join(repoRoot, "data");

function listYamlFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      return listYamlFiles(fullPath);
    }
    return entry.name.endsWith(".yml") ? [fullPath] : [];
  });
}

test("all YAML files under data/ are well formed", () => {
  const files = listYamlFiles(dataDir);

  assert.ok(files.length > 0, "Expected at least one YAML file under data/");

  files.forEach((filePath) => {
    const source = fs.readFileSync(filePath, "utf8");
    const document = parseDocument(source);

    assert.equal(
      document.errors.length,
      0,
      `YAML parse errors in ${path.relative(repoRoot, filePath)}: ${document.errors.join("; ")}`,
    );
  });
});
