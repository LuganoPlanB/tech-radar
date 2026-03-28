import "./style.css";

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

function entryLinkAttributes(radar, link) {
  if (!link || link === "#") {
    return "";
  }

  if (!radar.source.radar.links_in_new_tabs) {
    return "";
  }

  return " target=\"_blank\" rel=\"noreferrer\"";
}

function renderQuadrants(radar) {
  return radar.source.quadrants
    .map((quadrantFile) => {
      const quadrant = radar.source.radar.quadrants.find((item) => item.key === quadrantFile.quadrant);
      const entries = quadrantFile.entries
        .map((entry) => {
          const ring = radar.source.radar.rings.find((item) => item.key === entry.ring);
          const moved =
            entry.moved > 0 ? "Moved in" :
            entry.moved < 0 ? "Moved out" :
            "No change";
          return `
            <li class="entry-list__item">
              <a class="entry-list__link" href="${entry.link || "#"}"${entryLinkAttributes(radar, entry.link)}>${entry.label}</a>
              <span class="entry-list__meta">${ringLabel(ring.name)} · ${moved}</span>
            </li>
          `;
        })
        .join("");

      return `
        <section class="quadrant-card">
          <h3>${quadrant.name}</h3>
          <ul class="entry-list">${entries}</ul>
        </section>
      `;
    })
    .join("");
}

function renderRings(radar) {
  return radar.source.radar.rings
    .map(
      (ring) => `
        <article class="ring-card">
          <h3 class="ring-card__title" style="--ring-color: ${ring.color}">${ringLabel(ring.name)}</h3>
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

document.querySelector("#app").innerHTML = `
  <div class="page-shell">
    <header class="hero">
      <div class="hero__overlay"></div>
      <div class="hero__inner">
        <p class="eyebrow">${homeContent.hero.eyebrow}</p>
        <h1>${homeContent.hero.title || radarCollection[0]?.source.radar.title || ""}</h1>
        <p class="lede">${homeContent.hero.lede}</p>
      </div>
    </header>

    <main class="content">
      <section class="radar-panel">
        <div class="section-heading">
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

      <section class="info-grid">
        <div class="section-heading">
          <h2>${homeContent.sections.rings.title}</h2>
          <p>${homeContent.sections.rings.description}</p>
        </div>
        <div class="ring-grid" id="ring-grid"></div>
      </section>

      <section class="info-grid">
        <div class="section-heading">
          <h2>${homeContent.sections.quadrants.title}</h2>
          <p>${homeContent.sections.quadrants.description}</p>
        </div>
        <div class="quadrant-grid" id="quadrant-grid"></div>
      </section>
    </main>
  </div>
`;

const radarSvg = document.querySelector("#radar");
const radarContext = document.querySelector("#radar-context");
const ringGrid = document.querySelector("#ring-grid");
const quadrantGrid = document.querySelector("#quadrant-grid");

function updateQueryString(radarKey) {
  const url = new URL(window.location.href);
  url.searchParams.set("radar", radarKey);
  window.history.replaceState({}, "", url);
}

function renderSelectedRadar(radarKey) {
  const radar = radarByKey.get(radarKey);

  if (!radar) {
    return;
  }

  document.title = `Lugano Plan ₿ ${radar.label}`;
  radarSvg.setAttribute("aria-label", `${radar.label} visualization`);
  radarContext.textContent = radar.source.radar.title;
  ringGrid.innerHTML = renderRings(radar);
  quadrantGrid.innerHTML = renderQuadrants(radar);
  renderRadar(radarSvg, structuredClone(radar.data));

  document.querySelectorAll(".radar-tab").forEach((tab) => {
    const isSelected = tab.dataset.radarKey === radarKey;
    tab.classList.toggle("radar-tab--active", isSelected);
    tab.setAttribute("aria-selected", isSelected ? "true" : "false");
  });

  updateQueryString(radarKey);
}

const initialRadarKey = getInitialRadarKey();
document.querySelectorAll(".radar-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    renderSelectedRadar(tab.dataset.radarKey);
  });
});
renderSelectedRadar(initialRadarKey);
