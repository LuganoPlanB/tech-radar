import * as d3 from "d3";

// The MIT License (MIT)
// Copyright (c) 2017 Zalando SE

export function renderRadar(svgElement, config) {
  const font_family = "Inter, \"Segoe UI\", Arial, sans-serif";
  const bubble_max_width = 220;
  const ring_emoji = {
    ADOPT: "✅",
    TRIAL: "🧪",
    ASSESS: "🔍",
    HOLD: "⏸️"
  };

  function ring_label(name) {
    return (ring_emoji[name] ? ring_emoji[name] + " " : "") + name;
  }

  // custom random number generator, to make random sequence reproducible
  // source: https://stackoverflow.com/questions/521295
  var seed = 42;
  function random() {
    var x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  }

  function random_between(min, max) {
    return min + random() * (max - min);
  }

  function normal_between(min, max) {
    return min + (random() + random()) * 0.5 * (max - min);
  }

  // radial_min / radial_max are multiples of PI
  const quadrants = [
    { radial_min: 0, radial_max: 0.5, factor_x: 1, factor_y: 1 },
    { radial_min: 0.5, radial_max: 1, factor_x: -1, factor_y: 1 },
    { radial_min: -1, radial_max: -0.5, factor_x: -1, factor_y: -1 },
    { radial_min: -0.5, radial_max: 0, factor_x: 1, factor_y: -1 }
  ];

  const rings = [
    { radius: 130 },
    { radius: 220 },
    { radius: 310 },
    { radius: 400 }
  ];

  const title_offset =
    { x: -675, y: -420 };

  const footer_offset =
    { x: 0, y: 420 };
  const legend_column_gap = 112;

  const legend_offset = [
    { x: 410, y: 190 },
    { x: -570, y: 190 },
    { x: -570, y: -310 },
    { x: 410, y: -310 }
  ];
  const radar_center_x = 600;
  const svg_width = 1260;
  const svg_height = config.height;

  function polar(cartesian) {
    var x = cartesian.x;
    var y = cartesian.y;
    return {
      t: Math.atan2(y, x),
      r: Math.sqrt(x * x + y * y)
    };
  }

  function cartesian(polar) {
    return {
      x: polar.r * Math.cos(polar.t),
      y: polar.r * Math.sin(polar.t)
    };
  }

  function bounded_interval(value, min, max) {
    var low = Math.min(min, max);
    var high = Math.max(min, max);
    return Math.min(Math.max(value, low), high);
  }

  function bounded_ring(polar, r_min, r_max) {
    return {
      t: polar.t,
      r: bounded_interval(polar.r, r_min, r_max)
    };
  }

  function bounded_box(point, min, max) {
    return {
      x: bounded_interval(point.x, min.x, max.x),
      y: bounded_interval(point.y, min.y, max.y)
    };
  }

  function segment(quadrant, ring) {
    var polar_min = {
      t: quadrants[quadrant].radial_min * Math.PI,
      r: ring === 0 ? 30 : rings[ring - 1].radius
    };
    var polar_max = {
      t: quadrants[quadrant].radial_max * Math.PI,
      r: rings[ring].radius
    };
    var cartesian_min = {
      x: 15 * quadrants[quadrant].factor_x,
      y: 15 * quadrants[quadrant].factor_y
    };
    var cartesian_max = {
      x: rings[3].radius * quadrants[quadrant].factor_x,
      y: rings[3].radius * quadrants[quadrant].factor_y
    };
    return {
      clipx: function(d) {
        var c = bounded_box(d, cartesian_min, cartesian_max);
        var p = bounded_ring(polar(c), polar_min.r + 15, polar_max.r - 15);
        d.x = cartesian(p).x; // adjust data too!
        return d.x;
      },
      clipy: function(d) {
        var c = bounded_box(d, cartesian_min, cartesian_max);
        var p = bounded_ring(polar(c), polar_min.r + 15, polar_max.r - 15);
        d.y = cartesian(p).y; // adjust data too!
        return d.y;
      },
      random: function() {
        return cartesian({
          t: random_between(polar_min.t, polar_max.t),
          r: normal_between(polar_min.r, polar_max.r)
        });
      }
    };
  }

  // position each entry randomly in its segment
  for (var i = 0; i < config.entries.length; i++) {
    var entry = config.entries[i];
    entry.segment = segment(entry.quadrant, entry.ring);
    var point = entry.segment.random();
    entry.x = point.x;
    entry.y = point.y;
    entry.color = entry.active || config.print_layout ?
      config.rings[entry.ring].color : config.colors.inactive;
  }

  // partition entries according to segments
  var segmented = new Array(4);
  for (var quadrant = 0; quadrant < 4; quadrant++) {
    segmented[quadrant] = new Array(4);
    for (var ring = 0; ring < 4; ring++) {
      segmented[quadrant][ring] = [];
    }
  }
  for (var entryIndex = 0; entryIndex < config.entries.length; entryIndex++) {
    var currentEntry = config.entries[entryIndex];
    segmented[currentEntry.quadrant][currentEntry.ring].push(currentEntry);
  }

  // assign unique sequential id to each entry
  var id = 1;
  for (var quadrantOrder of [2, 3, 1, 0]) {
    for (var ringIndex = 0; ringIndex < 4; ringIndex++) {
      var entries = segmented[quadrantOrder][ringIndex];
      entries.sort(function(a, b) { return a.label.localeCompare(b.label); });
      for (var sortedIndex = 0; sortedIndex < entries.length; sortedIndex++) {
        entries[sortedIndex].id = "" + id++;
      }
    }
  }

  function translate(x, y) {
    return "translate(" + x + "," + y + ")";
  }

  function viewbox(quadrant) {
    return [
      Math.max(0, quadrants[quadrant].factor_x * 400) - 420,
      Math.max(0, quadrants[quadrant].factor_y * 400) - 420,
      440,
      440
    ].join(" ");
  }

  var svg = d3.select(svgElement)
    .html("")
    .attr("id", config.svg_id)
    .style("background-color", config.colors.background)
    .attr("width", svg_width)
    .attr("height", svg_height);

  var radar = svg.append("g");
  if ("zoomed_quadrant" in config) {
    svg.attr("viewBox", viewbox(config.zoomed_quadrant));
  } else {
    radar.attr("transform", translate(radar_center_x, config.height / 2));
  }

  var grid = radar.append("g");

  var defs = svg.append("defs");
  var headingGradient = defs.append("linearGradient")
    .attr("id", "legendHeadingGradient")
    .attr("x1", "0%")
    .attr("y1", "0%")
    .attr("x2", "100%")
    .attr("y2", "0%");
  headingGradient.append("stop")
    .attr("offset", "0%")
    .attr("stop-color", config.colors.panel_glow_start || "#f7931a");
  headingGradient.append("stop")
    .attr("offset", "100%")
    .attr("stop-color", config.colors.bubble_stroke || "#e15364");

  // background color. Usage `.attr("filter", "url(#solid)")`
  // SOURCE: https://stackoverflow.com/a/31013492/2609980
  var filter = defs.append("filter")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", 1)
    .attr("height", 1)
    .attr("id", "solid");
  filter.append("feFlood")
    .attr("flood-color", config.colors.panel || config.colors.background)
    .attr("flood-opacity", 0.92);
  filter.append("feComposite")
    .attr("in", "SourceGraphic");

  // draw grid lines
  grid.append("line")
    .attr("x1", 0).attr("y1", -400)
    .attr("x2", 0).attr("y2", 400)
    .style("stroke", config.colors.grid)
    .style("stroke-opacity", 0.7)
    .style("stroke-width", 1);
  grid.append("line")
    .attr("x1", -400).attr("y1", 0)
    .attr("x2", 400).attr("y2", 0)
    .style("stroke", config.colors.grid)
    .style("stroke-opacity", 0.7)
    .style("stroke-width", 1);

  // draw rings
  for (var ringLoopIndex = 0; ringLoopIndex < rings.length; ringLoopIndex++) {
    grid.append("circle")
      .attr("cx", 0)
      .attr("cy", 0)
      .attr("r", rings[ringLoopIndex].radius)
      .style("fill", "none")
      .style("stroke", config.colors.grid)
      .style("stroke-width", 1);
    if (config.print_layout) {
      grid.append("text")
        .text(ring_label(config.rings[ringLoopIndex].name))
        .attr("y", -rings[ringLoopIndex].radius + 62)
        .attr("text-anchor", "middle")
        .style("fill", config.rings[ringLoopIndex].color)
        .style("opacity", 0.28)
        .style("font-family", font_family)
        .style("font-size", "42px")
        .style("font-weight", "bold")
        .style("pointer-events", "none")
        .style("user-select", "none");
    }
  }

  function legend_transform(quadrant, ring, index = null) {
    var dx = ring < 2 ? 0 : legend_column_gap;
    var dy = index == null ? -16 : index * 12;
    if (ring % 2 === 1) {
      dy = dy + 36 + segmented[quadrant][ring - 1].length * 12;
    }
    return translate(
      legend_offset[quadrant].x + dx,
      legend_offset[quadrant].y + dy
    );
  }

  // draw title and legend (only in print layout)
  if (config.print_layout) {
    radar.append("text")
      .attr("transform", translate(footer_offset.x, footer_offset.y))
      .text("▲ moved up     ▼ moved down")
      .attr("xml:space", "preserve")
      .attr("text-anchor", "middle")
      .style("font-family", font_family)
      .style("font-size", "10px")
      .style("fill", config.colors.text_muted || config.colors.text || "#fff");

    var legend = radar.append("g");
    for (var quadrantLoop = 0; quadrantLoop < 4; quadrantLoop++) {
      legend.append("text")
        .attr("transform", translate(
          legend_offset[quadrantLoop].x,
          legend_offset[quadrantLoop].y - 45
        ))
        .text(config.quadrants[quadrantLoop].name)
        .style("font-family", font_family)
        .style("font-size", "18px")
        .style("font-weight", "bold")
        .style("fill", "url(#legendHeadingGradient)");
      for (var legendRing = 0; legendRing < 4; legendRing++) {
        legend.append("text")
          .attr("transform", legend_transform(quadrantLoop, legendRing))
          .text(ring_label(config.rings[legendRing].name))
          .style("font-family", font_family)
          .style("font-size", "12px")
          .style("font-weight", "bold")
          .style("fill", config.rings[legendRing].color);
        legend.selectAll(".legend" + quadrantLoop + legendRing)
          .data(segmented[quadrantLoop][legendRing])
          .enter()
            .append("a")
              .attr("href", function(d) {
                return d.link ? d.link : "#";
              })
              .attr("target", function(d) {
                return (d.link && config.links_in_new_tabs) ? "_blank" : null;
              })
            .append("text")
              .attr("transform", function(d, i) { return legend_transform(quadrantLoop, legendRing, i); })
              .attr("class", "legend" + quadrantLoop + legendRing)
              .attr("id", function(d) { return "legendItem" + d.id; })
              .text(function(d) { return d.id + ". " + d.label; })
              .style("font-family", font_family)
              .style("font-size", "11px")
              .style("fill", config.colors.text_muted || config.colors.text || "#fff")
              .on("mouseover", function(d) { showBubble(d); highlightLegendItem(d); })
              .on("mouseout", function(d) { hideBubble(d); unhighlightLegendItem(d); });
      }
    }
  }

  var rink = radar.append("g")
    .attr("id", "rink");

  var bubble = radar.append("g")
    .attr("id", "bubble")
    .attr("x", 0)
    .attr("y", 0)
    .style("opacity", 0)
    .style("pointer-events", "none")
    .style("user-select", "none");
  bubble.append("rect")
    .attr("rx", 4)
    .attr("ry", 4)
    .style("fill", config.colors.bubble_fill || config.colors.panel || "#211d1d")
    .style("stroke", config.colors.bubble_stroke || "#e15364")
    .style("stroke-width", 1);
  bubble.append("text")
    .attr("class", "bubble-title")
    .style("font-family", font_family)
    .style("font-size", "16px")
    .style("font-weight", "bold")
    .style("fill", config.colors.text || "#fff");
  bubble.append("text")
    .attr("class", "bubble-desc")
    .style("font-family", font_family)
    .style("font-size", "13px")
    .style("fill", config.colors.text_muted || config.colors.text || "#fff");
  bubble.append("path")
    .attr("d", "M 0,0 10,0 5,8 z")
    .style("fill", config.colors.bubble_fill || config.colors.panel || "#211d1d");

  function wrapBubbleText(textSelection, text, width, lineHeight) {
    textSelection.text(null);

    if (!text) {
      return [];
    }

    var words = text.split(/\s+/).filter(Boolean);
    var lines = [];
    var line = [];

    for (var wordIndex = 0; wordIndex < words.length; wordIndex++) {
      line.push(words[wordIndex]);
      textSelection.text(line.join(" "));

      if (textSelection.node().getComputedTextLength() > width && line.length > 1) {
        line.pop();
        lines.push(line.join(" "));
        line = [words[wordIndex]];
        textSelection.text(line.join(" "));
      }
    }

    if (line.length > 0) {
      lines.push(line.join(" "));
    }

    textSelection.text(null);
    for (var lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      textSelection.append("tspan")
        .attr("x", 0)
        .attr("dy", lineIndex === 0 ? 0 : lineHeight)
        .text(lines[lineIndex]);
    }

    return lines;
  }

  function showBubble(d) {
    if (d.active || config.print_layout) {
      var bubbleSelection = d3.select("#bubble");
      var title = bubbleSelection.select(".bubble-title")
        .attr("x", 0)
        .attr("y", 0)
        .text(d.label)
        .style("paint-order", "stroke")
        .style("stroke", "rgba(0, 0, 0, 0.55)")
        .style("stroke-width", "3px")
        .style("stroke-linejoin", "round");
      var description = bubbleSelection.select(".bubble-desc")
        .attr("x", 0)
        .attr("y", 22);

      wrapBubbleText(description, d.desc || "", bubble_max_width, 14);

      var titleBox = title.node().getBBox();
      var descBox = description.node().getBBox();
      var hasDescription = descBox.width > 0 && descBox.height > 0;
      var contentWidth = Math.max(titleBox.width, descBox.width);
      var contentHeight = titleBox.height + (hasDescription ? descBox.height + 8 : 0);

      if (hasDescription) {
        description.attr("y", titleBox.height + 8);
      }

      var bbox = {
        width: contentWidth,
        height: contentHeight
      };

      d3.select("#bubble")
        .attr("transform", translate(d.x - bbox.width / 2, d.y - bbox.height - 18))
        .style("opacity", 0.8);
      d3.select("#bubble rect")
        .attr("x", -10)
        .attr("y", -4)
        .attr("width", bbox.width + 20)
        .attr("height", bbox.height + 12);
      d3.select("#bubble path")
        .attr("transform", translate(bbox.width / 2 - 5, bbox.height + 8));
    }
  }

  function hideBubble() {
    d3.select("#bubble")
      .attr("transform", translate(0, 0))
      .style("opacity", 0);
  }

  function highlightLegendItem(d) {
    var legendItem = svgElement.ownerDocument.getElementById("legendItem" + d.id);
    if (legendItem) {
      legendItem.setAttribute("filter", "url(#solid)");
      legendItem.setAttribute("fill", config.colors.highlight || config.colors.text || "#fff");
    }
  }

  function unhighlightLegendItem(d) {
    var legendItem = svgElement.ownerDocument.getElementById("legendItem" + d.id);
    if (legendItem) {
      legendItem.removeAttribute("filter");
      legendItem.removeAttribute("fill");
    }
  }

  var blips = rink.selectAll(".blip")
    .data(config.entries)
    .enter()
      .append("g")
        .attr("class", "blip")
        .attr("transform", function(d, i) { return legend_transform(d.quadrant, d.ring, i); })
        .on("mouseover", function(d) { showBubble(d); highlightLegendItem(d); })
        .on("mouseout", function(d) { hideBubble(d); unhighlightLegendItem(d); });

  blips.each(function(d) {
    var blip = d3.select(this);

    if (d.active && Object.prototype.hasOwnProperty.call(d, "link") && d.link) {
      blip = blip.append("a")
        .attr("xlink:href", d.link);

      if (config.links_in_new_tabs) {
        blip.attr("target", "_blank");
      }
    }

    if (d.moved > 0) {
      blip.append("path")
        .attr("d", "M -11,5 11,5 0,-13 z")
        .style("fill", d.color);
    } else if (d.moved < 0) {
      blip.append("path")
        .attr("d", "M -11,-5 11,-5 0,13 z")
        .style("fill", d.color);
    } else {
      blip.append("circle")
        .attr("r", 9)
        .attr("fill", d.color);
    }

    if (d.active || config.print_layout) {
      var blip_text = config.print_layout ? d.id : d.label.match(/[a-z]/i);
      blip.append("text")
        .text(blip_text)
        .attr("y", 3)
        .attr("text-anchor", "middle")
        .style("fill", config.colors.text || "#fff")
        .style("font-family", font_family)
        .style("font-size", function() { return blip_text.length > 2 ? "8px" : "9px"; })
        .style("pointer-events", "none")
        .style("user-select", "none");
    }
  });

  function ticked() {
    blips.attr("transform", function(d) {
      return translate(d.segment.clipx(d), d.segment.clipy(d));
    });
  }

  d3.forceSimulation()
    .nodes(config.entries)
    .velocityDecay(0.19)
    .force("collision", d3.forceCollide().radius(12).strength(0.85))
    .on("tick", ticked);
}
