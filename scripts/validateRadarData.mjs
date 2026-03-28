import path from "node:path";

function schemaError(filePath, fieldPath, message) {
  const location = fieldPath ? `${filePath}:${fieldPath}` : filePath;
  return new Error(`${location} ${message}`);
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function expectPlainObject(filePath, fieldPath, value, hint = "must be an object") {
  if (!isPlainObject(value)) {
    throw schemaError(filePath, fieldPath, hint);
  }
}

function expectString(filePath, fieldPath, value) {
  if (typeof value !== "string" || value.trim() === "") {
    throw schemaError(filePath, fieldPath, "must be a non-empty string");
  }
}

function expectBoolean(filePath, fieldPath, value) {
  if (typeof value !== "boolean") {
    throw schemaError(filePath, fieldPath, "must be a boolean");
  }
}

function expectNumber(filePath, fieldPath, value) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw schemaError(filePath, fieldPath, "must be a number");
  }
}

function expectArray(filePath, fieldPath, value) {
  if (!Array.isArray(value)) {
    throw schemaError(filePath, fieldPath, "must be a list");
  }
}

function expectOptionalString(filePath, fieldPath, value) {
  if (value === undefined) {
    return;
  }
  if (typeof value !== "string") {
    throw schemaError(filePath, fieldPath, "must be a string when present");
  }
}

function expectOptionalInteger(filePath, fieldPath, value) {
  if (value === undefined) {
    return;
  }
  if (!Number.isInteger(value)) {
    throw schemaError(filePath, fieldPath, "must be an integer when present");
  }
}

function expectOptionalBoolean(filePath, fieldPath, value) {
  if (value === undefined) {
    return;
  }
  if (typeof value !== "boolean") {
    throw schemaError(filePath, fieldPath, "must be a boolean when present");
  }
}

function listUnknownKeys(value, allowedKeys) {
  return Object.keys(value).filter((key) => !allowedKeys.includes(key));
}

function assertNoUnknownKeys(filePath, fieldPath, value, allowedKeys) {
  const unknownKeys = listUnknownKeys(value, allowedKeys);
  if (unknownKeys.length > 0) {
    throw schemaError(
      filePath,
      fieldPath,
      `contains unknown field${unknownKeys.length > 1 ? "s" : ""}: ${unknownKeys.join(", ")}`,
    );
  }
}

export function validateHomeData(filePath, homeData) {
  expectPlainObject(filePath, "", homeData, "must contain a top-level object");
  assertNoUnknownKeys(filePath, "", homeData, [
    "default_radar",
    "hero",
    "sections",
    "ring_descriptions",
  ]);

  expectString(filePath, "default_radar", homeData.default_radar);

  expectPlainObject(filePath, "hero", homeData.hero);
  assertNoUnknownKeys(filePath, "hero", homeData.hero, ["eyebrow", "title", "lede"]);
  expectString(filePath, "hero.eyebrow", homeData.hero.eyebrow);
  expectString(filePath, "hero.title", homeData.hero.title);
  expectString(filePath, "hero.lede", homeData.hero.lede);

  expectPlainObject(filePath, "sections", homeData.sections);
  assertNoUnknownKeys(filePath, "sections", homeData.sections, ["radar", "rings", "quadrants"]);

  for (const sectionName of ["radar", "rings", "quadrants"]) {
    const sectionPath = `sections.${sectionName}`;
    const section = homeData.sections[sectionName];
    expectPlainObject(filePath, sectionPath, section);
    assertNoUnknownKeys(filePath, sectionPath, section, ["title", "description"]);
    expectString(filePath, `${sectionPath}.title`, section.title);
    expectString(filePath, `${sectionPath}.description`, section.description);
  }

  expectPlainObject(filePath, "ring_descriptions", homeData.ring_descriptions);
  Object.entries(homeData.ring_descriptions).forEach(([key, value]) => {
    expectString(filePath, `ring_descriptions.${key}`, value);
  });
}

export function validateRadarData(filePath, radarData) {
  expectPlainObject(filePath, "", radarData, "must contain a top-level object");
  assertNoUnknownKeys(filePath, "", radarData, [
    "label",
    "title",
    "width",
    "height",
    "colors",
    "print_layout",
    "links_in_new_tabs",
    "rings",
    "quadrants",
  ]);

  expectString(filePath, "label", radarData.label);
  expectString(filePath, "title", radarData.title);
  expectNumber(filePath, "width", radarData.width);
  expectNumber(filePath, "height", radarData.height);
  expectBoolean(filePath, "print_layout", radarData.print_layout);
  expectBoolean(filePath, "links_in_new_tabs", radarData.links_in_new_tabs);

  expectPlainObject(filePath, "colors", radarData.colors);
  const colorKeys = [
    "background",
    "panel",
    "panel_glow_start",
    "panel_glow_end",
    "grid",
    "inactive",
    "text",
    "text_muted",
    "bubble_fill",
    "bubble_stroke",
    "highlight",
  ];
  assertNoUnknownKeys(filePath, "colors", radarData.colors, colorKeys);
  colorKeys.forEach((colorKey) => {
    expectString(filePath, `colors.${colorKey}`, radarData.colors[colorKey]);
  });

  expectArray(filePath, "rings", radarData.rings);
  if (radarData.rings.length === 0) {
    throw schemaError(filePath, "rings", "must include at least one ring");
  }

  const ringKeys = new Set();
  radarData.rings.forEach((ring, index) => {
    const ringPath = `rings[${index}]`;
    expectPlainObject(filePath, ringPath, ring);
    assertNoUnknownKeys(filePath, ringPath, ring, ["key", "name", "color"]);
    expectString(filePath, `${ringPath}.key`, ring.key);
    expectString(filePath, `${ringPath}.name`, ring.name);
    expectString(filePath, `${ringPath}.color`, ring.color);
    if (ringKeys.has(ring.key)) {
      throw schemaError(filePath, `${ringPath}.key`, `duplicates ring key "${ring.key}"`);
    }
    ringKeys.add(ring.key);
  });

  expectArray(filePath, "quadrants", radarData.quadrants);
  if (radarData.quadrants.length !== 4) {
    throw schemaError(filePath, "quadrants", "must contain exactly 4 quadrants");
  }

  radarData.quadrants.forEach((quadrant, quadrantIndex) => {
    const quadrantPath = `quadrants[${quadrantIndex}]`;
    expectPlainObject(filePath, quadrantPath, quadrant);
    assertNoUnknownKeys(filePath, quadrantPath, quadrant, ["name", "entries"]);
    expectString(filePath, `${quadrantPath}.name`, quadrant.name);
    expectArray(filePath, `${quadrantPath}.entries`, quadrant.entries);

    quadrant.entries.forEach((entry, entryIndex) => {
      const entryPath = `${quadrantPath}.entries[${entryIndex}]`;
      expectPlainObject(filePath, entryPath, entry);
      assertNoUnknownKeys(filePath, entryPath, entry, ["label", "ring", "moved", "active", "link"]);
      expectString(filePath, `${entryPath}.label`, entry.label);
      expectString(filePath, `${entryPath}.ring`, entry.ring);
      expectOptionalBoolean(filePath, `${entryPath}.active`, entry.active);
      expectOptionalInteger(filePath, `${entryPath}.moved`, entry.moved);
      expectOptionalString(filePath, `${entryPath}.link`, entry.link);

      if (!ringKeys.has(entry.ring)) {
        const availableRingKeys = [...ringKeys].join(", ");
        throw schemaError(
          filePath,
          `${entryPath}.ring`,
          `references unknown ring "${entry.ring}". Available rings: ${availableRingKeys}`,
        );
      }
    });
  });
}

export function validateRadarDirectory(homePath, homeData, radarFiles) {
  const radarKeys = radarFiles.map((filePath) => path.basename(filePath, ".yml"));
  if (radarKeys.length === 0) {
    throw schemaError(homePath, "default_radar", "requires at least one radar file under data/radars/");
  }

  if (!radarKeys.includes(homeData.default_radar)) {
    throw schemaError(
      homePath,
      "default_radar",
      `references missing radar "${homeData.default_radar}". Available radars: ${radarKeys.join(", ")}`,
    );
  }
}
