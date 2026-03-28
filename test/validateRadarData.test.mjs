import assert from "node:assert/strict";
import test from "node:test";

import { validateHomeData, validateRadarData, validateRadarDirectory } from "../scripts/validateRadarData.mjs";

test("validateRadarData reports the exact entry field when a ring is unknown", () => {
  assert.throws(
    () =>
      validateRadarData("data/radars/example.yml", {
        label: "Example",
        title: "Example Radar",
        width: 100,
        height: 100,
        colors: {
          background: "#000",
          panel: "#111",
          panel_glow_start: "#222",
          panel_glow_end: "#333",
          grid: "#444",
          inactive: "#555",
          text: "#666",
          text_muted: "#777",
          bubble_fill: "#888",
          bubble_stroke: "#999",
          highlight: "#aaa",
        },
        print_layout: true,
        links_in_new_tabs: false,
        rings: [{ key: "adopt", name: "ADOPT", color: "#fff" }],
        quadrants: [
          { name: "One", entries: [{ label: "Bad", ring: "missing", active: true }] },
          { name: "Two", entries: [] },
          { name: "Three", entries: [] },
          { name: "Four", entries: [] },
        ],
      }),
    /data\/radars\/example\.yml:quadrants\[0\]\.entries\[0\]\.ring references unknown ring "missing"\. Available rings: adopt/,
  );
});

test("validateRadarData reports unknown top-level fields clearly", () => {
  assert.throws(
    () =>
      validateRadarData("data/radars/example.yml", {
        label: "Example",
        title: "Example Radar",
        width: 100,
        height: 100,
        colors: {
          background: "#000",
          panel: "#111",
          panel_glow_start: "#222",
          panel_glow_end: "#333",
          grid: "#444",
          inactive: "#555",
          text: "#666",
          text_muted: "#777",
          bubble_fill: "#888",
          bubble_stroke: "#999",
          highlight: "#aaa",
        },
        print_layout: true,
        links_in_new_tabs: false,
        rings: [{ key: "adopt", name: "ADOPT", color: "#fff" }],
        quadrants: [
          { name: "One", entries: [] },
          { name: "Two", entries: [] },
          { name: "Three", entries: [] },
          { name: "Four", entries: [] },
        ],
        extra: true,
      }),
    /data\/radars\/example\.yml contains unknown field: extra/,
  );
});

test("validateHomeData reports missing default radar references clearly", () => {
  assert.throws(
    () =>
      validateRadarDirectory(
        "data/home.yml",
        {
          default_radar: "missing-radar",
          hero: { eyebrow: "A", title: "B", lede: "C" },
          sections: {
            radar: { title: "A", description: "B" },
            rings: { title: "A", description: "B" },
            quadrants: { title: "A", description: "B" },
          },
          ring_descriptions: { ADOPT: "A" },
        },
        [
          { key: "innovation-radar", data: { active: true } },
          { key: "business-radar", data: { active: true } },
        ],
      ),
    /data\/home\.yml:default_radar references missing radar "missing-radar"\. Available radars: innovation-radar, business-radar/,
  );
});

test("validateRadarData allows moved and active to be omitted", () => {
  assert.doesNotThrow(() =>
    validateRadarData("data/radars/example.yml", {
      label: "Example",
      title: "Example Radar",
      width: 100,
      height: 100,
      colors: {
        background: "#000",
        panel: "#111",
        panel_glow_start: "#222",
        panel_glow_end: "#333",
        grid: "#444",
        inactive: "#555",
        text: "#666",
        text_muted: "#777",
        bubble_fill: "#888",
        bubble_stroke: "#999",
        highlight: "#aaa",
      },
        print_layout: true,
        links_in_new_tabs: false,
        rings: [{ key: "adopt", name: "ADOPT", color: "#fff" }],
      quadrants: [
        { name: "One", entries: [{ label: "Okay", desc: "Description", ring: "adopt" }] },
        { name: "Two", entries: [] },
        { name: "Three", entries: [] },
        { name: "Four", entries: [] },
      ],
    }),
  );
});

test("validateHomeData rejects an inactive default radar", () => {
  assert.throws(
    () =>
      validateRadarDirectory(
        "data/home.yml",
        {
          default_radar: "innovation-radar",
          hero: { eyebrow: "A", title: "B", lede: "C" },
          sections: {
            radar: { title: "A", description: "B" },
            rings: { title: "A", description: "B" },
            quadrants: { title: "A", description: "B" },
          },
          ring_descriptions: { ADOPT: "A" },
        },
        [
          { key: "innovation-radar", data: { active: false } },
          { key: "business-radar", data: { active: true } },
        ],
      ),
    /data\/home\.yml:default_radar references inactive radar "innovation-radar"\. Default radar must stay active/,
  );
});
