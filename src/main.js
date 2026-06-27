import "./style.css";
import "./lugano-planb-vite-theme/theme.css";
import {
  createPlanBFooter,
  createPlanBHeader,
  createPlanBPageShell,
  createPlanBSiteHeader,
  initializePlanBThemeToggle,
} from "./lugano-planb-vite-theme/index.js";

import { defaultRadarKey, homeContent, radarCollection } from "./generated/radarData.mjs";
import { renderRadar } from "./radar/renderRadar.js";

const ringEmoji = {
  ADOPT: "✅",
  TRIAL: "🧪",
  ASSESS: "🔍",
  HOLD: "⏸️",
};

function ringLabel(name) {
  return `${ringEmoji[name] || ""} ${name}`.trim();
}

const radarByKey = new Map(radarCollection.map((radar) => [radar.key, radar]));

function readThemeVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

const RING_THEME_KEYS = {
  ADOPT: "--planb-color-highlight",
  TRIAL: "--planb-color-neon-cyan",
  ASSESS: "--planb-color-accent",
  HOLD: "--planb-color-neon-violet",
};

function resolveRingColors() {
  return Object.fromEntries(
    Object.entries(RING_THEME_KEYS).map(([ring, prop]) => [ring, readThemeVar(prop)]),
  );
}

function resolveRadarColors() {
  return {
    background: readThemeVar("--planb-color-canvas"),
    panel: readThemeVar("--planb-color-panel"),
    panel_glow_start: readThemeVar("--planb-color-highlight"),
    grid: readThemeVar("--planb-color-text-soft"),
    inactive: readThemeVar("--planb-color-text-soft"),
    text: readThemeVar("--planb-color-text"),
    text_muted: readThemeVar("--planb-color-text-soft"),
    bubble_fill: readThemeVar("--planb-color-panel"),
    bubble_stroke: readThemeVar("--planb-color-accent"),
    highlight: readThemeVar("--planb-color-accent-soft"),
  };
}

function applyThemeToRadarConfig(data) {
  const themeColors = resolveRadarColors();
  const ringColors = resolveRingColors();

  const config = structuredClone(data);
  config.colors = { ...config.colors, ...themeColors };
  config.rings = config.rings.map((ring) => ({
    ...ring,
    color: ringColors[ring.name] || ring.color,
  }));
  return config;
}

function entryLinkAttributes(radar, link) {
  if (!link || link === "#") {
    return "";
  }

  if (!radar.source.links_in_new_tabs) {
    return "";
  }

  return " target=\"_blank\" rel=\"noreferrer\"";
}

function compareEntriesByRing(radar, left, right) {
  const ringIndexByKey = new Map(radar.source.rings.map((ring, index) => [ring.key, index]));
  const leftRingIndex = ringIndexByKey.get(left.ring) ?? Number.MAX_SAFE_INTEGER;
  const rightRingIndex = ringIndexByKey.get(right.ring) ?? Number.MAX_SAFE_INTEGER;

  if (leftRingIndex !== rightRingIndex) {
    return leftRingIndex - rightRingIndex;
  }

  return left.label.localeCompare(right.label);
}

function renderQuadrants(radar) {
  return radar.source.quadrants
    .map((quadrant) => {
      const entries = [...(quadrant.entries || [])]
        .sort((left, right) => compareEntriesByRing(radar, left, right))
        .map((entry) => {
          const ring = radar.source.rings.find((item) => item.key === entry.ring);
          const description = entry.desc || "";
          const meta = [ringLabel(ring.name), description].filter(Boolean).join(" · ");
          return `
            <li class="entry-list__item">
              <a class="entry-list__link" href="${entry.link || "#"}"${entryLinkAttributes(radar, entry.link)}>${entry.label}</a>
              <span class="entry-list__meta">${meta}</span>
            </li>
          `;
        })
        .join("");

      return `
        <article class="planb-card">
          <h3>${quadrant.name}</h3>
          <ul class="entry-list">${entries}</ul>
        </article>
      `;
    })
    .join("");
}

function renderRings(radar) {
  const ringColors = resolveRingColors();
  return radar.source.rings
    .map(
      (ring) => `
        <article class="planb-card">
          <h3 class="ring-card__title" style="--ring-color: ${ringColors[ring.name] || ring.color}">${ringLabel(ring.name)}</h3>
          <p>${homeContent.ring_descriptions[ring.name] || ""}</p>
        </article>
      `,
    )
    .join("");
}

function renderTabs() {
  return radarCollection
    .map(
      (radar) => `
        <button
          class="radar-tab"
          type="button"
          data-radar-key="${radar.key}"
          role="tab"
          aria-selected="false"
        >
          ${radar.label}
        </button>
      `,
    )
    .join("");
}

function getInitialRadarKey() {
  const params = new URLSearchParams(window.location.search);
  const requestedKey = params.get("radar");

  if (requestedKey && radarByKey.has(requestedKey)) {
    return requestedKey;
  }

  if (radarByKey.has(defaultRadarKey)) {
    return defaultRadarKey;
  }

  return radarCollection[0]?.key || "";
}

const shell = createPlanBPageShell({
  siteHeader: createPlanBSiteHeader({
    brand: "Lugano Plan ₿",
    navItems: [
      { label: "Radar", href: "/tech-radar/" },
      { label: "Network", href: "https://planb.network" },
    ],
    action: { label: "GitHub", href: "https://github.com/dyne/tech-radar" },
  }),
  header: createPlanBHeader({
    eyebrow: homeContent.hero.eyebrow,
    title: homeContent.hero.title || radarCollection[0]?.source.title || "",
    lede: homeContent.hero.lede,
  }),
  mainContent: `
    <section class="planb-panel">
      <div class="planb-section-heading">
        <h2>${homeContent.sections.rings.title}</h2>
        <p>${homeContent.sections.rings.description}</p>
      </div>
      <div class="ring-grid" id="ring-grid"></div>
    </section>

    <section class="planb-panel">
      <div class="planb-section-heading">
        <h2>${homeContent.sections.radar.title}</h2>
        <p>${homeContent.sections.radar.description}</p>
      </div>
      <div class="radar-tabs" role="tablist" aria-label="Radar selection">
        ${renderTabs()}
      </div>
      <p class="radar-context" id="radar-context"></p>
      <div class="radar-stage">
        <svg id="radar" aria-label="Technology radar"></svg>
      </div>
    </section>

    <section class="planb-panel">
      <div class="planb-section-heading">
        <h2>${homeContent.sections.quadrants.title}</h2>
        <p>${homeContent.sections.quadrants.description}</p>
      </div>
      <div class="quadrant-grid" id="quadrant-grid"></div>
    </section>
  `,
  footer: createPlanBFooter({
    brand: "Lugano Plan ₿",
    summary: "Technology radar for the Plan B ecosystem — tracking tools, languages, infrastructure, and data practices across civic technology projects.",
    groups: [
      {
        title: "Explore",
        links: [
          { label: "Radar", href: "/tech-radar/" },
          { label: "GitHub", href: "https://github.com/dyne/tech-radar" },
        ],
      },
      {
        title: "Plan B",
        links: [
          { label: "Network", href: "https://planb.network" },
          { label: "Lugano Plan B", href: "https://lugano.planb.network" },
        ],
      },
    ],
    meta: "Open source technology radar. Built with D3 and Vite.",
  }),
});

document.querySelector("#app").replaceChildren(shell);

if (!localStorage.getItem("planb-color-scheme")) {
  localStorage.setItem("planb-color-scheme", "light");
}
initializePlanBThemeToggle();

const main = shell.querySelector("main");
const radarSvg = main.querySelector("#radar");
const radarContext = main.querySelector("#radar-context");
const ringGrid = main.querySelector("#ring-grid");
const quadrantGrid = main.querySelector("#quadrant-grid");

function updateQueryString(radarKey) {
  const url = new URL(window.location.href);
  url.searchParams.set("radar", radarKey);
  window.history.replaceState({}, "", url);
}

let currentRadarKey = null;

function renderSelectedRadar(radarKey) {
  const radar = radarByKey.get(radarKey);

  if (!radar) {
    return;
  }

  currentRadarKey = radarKey;
  document.title = `Lugano Plan ₿ ${radar.label}`;
  radarSvg.setAttribute("aria-label", `${radar.label} visualization`);
  radarContext.textContent = radar.source.title;
  ringGrid.innerHTML = renderRings(radar);
  quadrantGrid.innerHTML = renderQuadrants(radar);
  renderRadar(radarSvg, applyThemeToRadarConfig(radar.data));

  main.querySelectorAll(".radar-tab").forEach((tab) => {
    const isSelected = tab.dataset.radarKey === radarKey;
    tab.classList.toggle("radar-tab--active", isSelected);
    tab.setAttribute("aria-selected", isSelected ? "true" : "false");
  });

  updateQueryString(radarKey);
}

new MutationObserver(() => {
  if (currentRadarKey) {
    renderSelectedRadar(currentRadarKey);
  }
}).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

const initialRadarKey = getInitialRadarKey();
main.querySelectorAll(".radar-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    renderSelectedRadar(tab.dataset.radarKey);
  });
});
renderSelectedRadar(initialRadarKey);
