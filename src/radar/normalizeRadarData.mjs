export function normalizeRadarData(radar) {
  const ringIndexByKey = new Map();

  radar.rings.forEach((ring, index) => {
    ringIndexByKey.set(ring.key, index);
  });

  const entries = radar.quadrants.flatMap((quadrant, quadrantIndex) =>
    (quadrant.entries || []).map((entry) => {
      const ringIndex = ringIndexByKey.get(entry.ring);

      if (ringIndex === undefined) {
        throw new Error(`Unknown ring key: ${entry.ring}`);
      }

      return {
        label: entry.label,
        desc: entry.desc || "",
        quadrant: quadrantIndex,
        ring: ringIndex,
        active: entry.active ?? true,
        link: entry.link,
        moved: entry.moved ?? 0,
      };
    }),
  );

  return {
    svg_id: "radar",
    width: radar.width,
    height: radar.height,
    colors: radar.colors,
    title: radar.title,
    quadrants: radar.quadrants.map(({ name }) => ({ name })),
    rings: radar.rings.map(({ name, color }) => ({ name, color })),
    print_layout: radar.print_layout,
    links_in_new_tabs: radar.links_in_new_tabs,
    entries,
  };
}
