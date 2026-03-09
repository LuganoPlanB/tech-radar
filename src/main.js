import "./style.css";

import { homeContent, radarData, radarSource } from "./generated/radarData.mjs";
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

function renderQuadrants() {
  return radarSource.quadrants
    .map((quadrantFile) => {
      const quadrant = radarSource.radar.quadrants.find((item) => item.key === quadrantFile.quadrant);
      const entries = quadrantFile.entries
        .map((entry) => {
          const ring = radarSource.radar.rings.find((item) => item.key === entry.ring);
          const moved =
            entry.moved > 0 ? "Moved in" :
            entry.moved < 0 ? "Moved out" :
            "No change";
          return `
            <li class="entry-list__item">
              <a class="entry-list__link" href="${entry.link || "#"}">${entry.label}</a>
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

function renderRings() {
  return radarSource.radar.rings
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

document.querySelector("#app").innerHTML = `
  <div class="page-shell">
    <header class="hero">
      <div class="hero__overlay"></div>
      <div class="hero__inner">
        <p class="eyebrow">${homeContent.hero.eyebrow}</p>
        <h1>${homeContent.hero.title || radarSource.radar.title}</h1>
        <p class="lede">${homeContent.hero.lede}</p>
      </div>
    </header>

    <main class="content">
      <section class="radar-panel">
        <div class="section-heading">
          <h2>${homeContent.sections.radar.title}</h2>
          <p>${homeContent.sections.radar.description}</p>
        </div>
        <div class="radar-stage">
          <svg id="radar" aria-label="Technology radar"></svg>
        </div>
      </section>

      <section class="info-grid">
        <div class="section-heading">
          <h2>${homeContent.sections.rings.title}</h2>
          <p>${homeContent.sections.rings.description}</p>
        </div>
        <div class="ring-grid">
          ${renderRings()}
        </div>
      </section>

      <section class="info-grid">
        <div class="section-heading">
          <h2>${homeContent.sections.quadrants.title}</h2>
          <p>${homeContent.sections.quadrants.description}</p>
        </div>
        <div class="quadrant-grid">
          ${renderQuadrants()}
        </div>
      </section>
    </main>
  </div>
`;

renderRadar(document.querySelector("#radar"), structuredClone(radarData));
