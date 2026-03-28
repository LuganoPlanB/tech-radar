import test from "node:test";
import assert from "node:assert/strict";

import { normalizeRadarData } from "../src/radar/normalizeRadarData.mjs";

test("normalizeRadarData maps quadrant order and ring keys to renderer indices", () => {
  const radar = {
    title: "Test Radar",
    width: 100,
    height: 80,
    colors: {
      background: "#000",
      grid: "#111",
      inactive: "#222",
    },
    print_layout: true,
    links_in_new_tabs: true,
    quadrants: [
      {
        name: "Languages",
        entries: [
          {
            label: "Go",
            ring: "adopt",
            moved: 1,
            active: true,
            link: "/entries/go",
          },
        ],
      },
      {
        name: "Infra",
        entries: [
          {
            label: "Nginx",
            ring: "hold",
            moved: -1,
            active: true,
            link: "https://nginx.org",
          },
        ],
      },
    ],
    rings: [
      { key: "adopt", name: "Adopt", color: "#0f0" },
      { key: "hold", name: "Hold", color: "#f00" },
    ],
  };

  const normalized = normalizeRadarData(radar);

  assert.equal(normalized.title, "Test Radar");
  assert.deepEqual(normalized.quadrants, [{ name: "Languages" }, { name: "Infra" }]);
  assert.deepEqual(normalized.rings, [
    { name: "Adopt", color: "#0f0" },
    { name: "Hold", color: "#f00" },
  ]);
  assert.deepEqual(normalized.entries, [
    {
      label: "Go",
      quadrant: 0,
      ring: 0,
      moved: 1,
      active: true,
      link: "/entries/go",
    },
    {
      label: "Nginx",
      quadrant: 1,
      ring: 1,
      moved: -1,
      active: true,
      link: "https://nginx.org",
    },
  ]);
});

test("normalizeRadarData rejects unknown ring keys", () => {
  const radar = {
    title: "Test Radar",
    width: 100,
    height: 80,
    colors: { background: "#000", grid: "#111", inactive: "#222" },
    print_layout: true,
    links_in_new_tabs: false,
    quadrants: [
      {
        name: "Languages",
        entries: [
          {
            label: "Go",
            ring: "missing",
            moved: 0,
            active: true,
            link: "/entries/go",
          },
        ],
      },
    ],
    rings: [{ key: "adopt", name: "Adopt", color: "#0f0" }],
  };

  assert.throws(
    () => normalizeRadarData(radar),
    /Unknown ring key: missing/,
  );
});

test("normalizeRadarData defaults missing moved and active fields", () => {
  const radar = {
    title: "Test Radar",
    width: 100,
    height: 80,
    colors: { background: "#000", grid: "#111", inactive: "#222" },
    print_layout: true,
    links_in_new_tabs: false,
    quadrants: [
      {
        name: "Languages",
        entries: [
          {
            label: "Go",
            ring: "adopt",
            link: "/entries/go",
          },
        ],
      },
    ],
    rings: [{ key: "adopt", name: "Adopt", color: "#0f0" }],
  };

  const normalized = normalizeRadarData(radar);

  assert.deepEqual(normalized.entries, [
    {
      label: "Go",
      quadrant: 0,
      ring: 0,
      moved: 0,
      active: true,
      link: "/entries/go",
    },
  ]);
});
