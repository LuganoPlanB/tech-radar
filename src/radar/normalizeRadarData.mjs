export function normalizeRadarData(radar, quadrantFiles) {
  const quadrantIndexByKey = new Map();
  const ringIndexByKey = new Map();

  radar.quadrants.forEach((quadrant, index) => {
    quadrantIndexByKey.set(quadrant.key, index);
  });

  radar.rings.forEach((ring, index) => {
    ringIndexByKey.set(ring.key, index);
  });

  const entries = quadrantFiles.flatMap((quadrantFile) => {
    const quadrantIndex = quadrantIndexByKey.get(quadrantFile.quadrant);

    if (quadrantIndex === undefined) {
      throw new Error(`Unknown quadrant key: ${quadrantFile.quadrant}`);
    }

    return quadrantFile.entries.map((entry) => {
      const ringIndex = ringIndexByKey.get(entry.ring);

      if (ringIndex === undefined) {
        throw new Error(`Unknown ring key: ${entry.ring}`);
      }

      return {
        key: entry.key,
        label: entry.label,
        quadrant: quadrantIndex,
        ring: ringIndex,
        active: entry.active,
        link: entry.link,
        moved: entry.moved,
      };
    });
  });

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
