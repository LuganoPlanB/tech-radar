import test from "node:test";
import assert from "node:assert/strict";

import { normalizeRadarData } from "../src/radar/normalizeRadarData.mjs";

test("normalizeRadarData maps symbolic quadrant and ring keys to renderer indices", () => {
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
      { key: "languages", name: "Languages" },
      { key: "infra", name: "Infra" },
    ],
    rings: [
      { key: "adopt", name: "Adopt", color: "#0f0" },
      { key: "hold", name: "Hold", color: "#f00" },
    ],
  };

  const quadrantFiles = [
    {
      quadrant: "infra",
      entries: [
        {
          key: "nginx",
          label: "Nginx",
          ring: "hold",
          moved: -1,
          active: true,
          link: "https://nginx.org",
        },
      ],
    },
    {
      quadrant: "languages",
      entries: [
        {
          key: "go",
          label: "Go",
          ring: "adopt",
          moved: 1,
          active: true,
          link: "/entries/go",
        },
      ],
    },
  ];

  const normalized = normalizeRadarData(radar, quadrantFiles);

  assert.equal(normalized.title, "Test Radar");
  assert.deepEqual(normalized.quadrants, [{ name: "Languages" }, { name: "Infra" }]);
  assert.deepEqual(normalized.rings, [
    { name: "Adopt", color: "#0f0" },
    { name: "Hold", color: "#f00" },
  ]);
  assert.deepEqual(normalized.entries, [
    {
      key: "nginx",
      label: "Nginx",
      quadrant: 1,
      ring: 1,
      moved: -1,
      active: true,
      link: "https://nginx.org",
    },
    {
      key: "go",
      label: "Go",
      quadrant: 0,
      ring: 0,
      moved: 1,
      active: true,
      link: "/entries/go",
    },
  ]);
});

test("normalizeRadarData rejects unknown quadrant keys", () => {
  const radar = {
    title: "Test Radar",
    width: 100,
    height: 80,
    colors: { background: "#000", grid: "#111", inactive: "#222" },
    print_layout: true,
    links_in_new_tabs: false,
    quadrants: [{ key: "languages", name: "Languages" }],
    rings: [{ key: "adopt", name: "Adopt", color: "#0f0" }],
  };

  assert.throws(
    () =>
      normalizeRadarData(radar, [
        {
          quadrant: "missing",
          entries: [],
        },
      ]),
    /Unknown quadrant key: missing/,
  );
});

test("normalizeRadarData rejects unknown ring keys", () => {
  const radar = {
    title: "Test Radar",
    width: 100,
    height: 80,
    colors: { background: "#000", grid: "#111", inactive: "#222" },
    print_layout: true,
    links_in_new_tabs: false,
    quadrants: [{ key: "languages", name: "Languages" }],
    rings: [{ key: "adopt", name: "Adopt", color: "#0f0" }],
  };

  assert.throws(
    () =>
      normalizeRadarData(radar, [
        {
          quadrant: "languages",
          entries: [
            {
              key: "go",
              label: "Go",
              ring: "missing",
              moved: 0,
              active: true,
              link: "/entries/go",
            },
          ],
        },
      ]),
    /Unknown ring key: missing/,
  );
});
