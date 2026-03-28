const quadrantSourceToRendererIndex = [2, 3, 1, 0];
const quadrantRendererToSourceIndex = [3, 2, 0, 1];

export function normalizeRadarData(radar) {
  const ringIndexByKey = new Map();

  radar.rings.forEach((ring, index) => {
    ringIndexByKey.set(ring.key, index);
  });

  const quadrants = quadrantRendererToSourceIndex
    .map((sourceIndex) => radar.quadrants[sourceIndex])
    .filter(Boolean)
    .map(({ name }) => ({ name }));

  const entries = radar.quadrants.flatMap((quadrant, quadrantIndex) =>
    (quadrant.entries || []).map((entry) => {
      const ringIndex = ringIndexByKey.get(entry.ring);

      if (ringIndex === undefined) {
        throw new Error(`Unknown ring key: ${entry.ring}`);
      }

      return {
        label: entry.label,
        desc: entry.desc || "",
        quadrant: quadrantSourceToRendererIndex[quadrantIndex],
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
    quadrants,
    rings: radar.rings.map(({ name, color }) => ({ name, color })),
    print_layout: radar.print_layout,
    links_in_new_tabs: radar.links_in_new_tabs,
    entries,
  };
}
