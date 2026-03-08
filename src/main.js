import "./style.css";

import { radarData, radarSource } from "./generated/radarData.mjs";
import { renderRadar } from "./radar/renderRadar.js";

const ringDescriptions = {
  ADOPT: "Technologies we trust broadly and recommend for serious use.",
  TRIAL: "Technologies that already showed value in real work and merit wider use.",
  ASSESS: "Promising technologies worth further research, prototyping, and validation.",
  HOLD: "Technologies we would avoid for new work unless there is a strong reason.",
};

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
              <span class="entry-list__meta">${ring.name} · ${moved}</span>
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
          <h3 class="ring-card__title" style="--ring-color: ${ring.color}">${ring.name}</h3>
          <p>${ringDescriptions[ring.name]}</p>
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
        <p class="eyebrow">Static radar generated from YAML content</p>
        <h1>${radarSource.radar.title}</h1>
        <p class="lede">
          The radar content now lives in structured YAML files and is rendered into a static Vite site.
          The chart stays D3-based, but the content model is finally maintainable.
        </p>
      </div>
    </header>

    <main class="content">
      <section class="radar-panel">
        <div class="section-heading">
          <h2>Technology Landscape</h2>
          <p>The radar below is rendered from <code>data/radar.yml</code> and per-quadrant YAML files.</p>
        </div>
        <div class="radar-stage">
          <svg id="radar" aria-label="Technology radar"></svg>
        </div>
      </section>

      <section class="info-grid">
        <div class="section-heading">
          <h2>Ring Semantics</h2>
          <p>The semantic model is now explicit in the content layer instead of being embedded inside one HTML file.</p>
        </div>
        <div class="ring-grid">
          ${renderRings()}
        </div>
      </section>

      <section class="info-grid">
        <div class="section-heading">
          <h2>Quadrant Sources</h2>
          <p>Each quadrant is maintained independently, which keeps edits reviewable and reduces merge conflicts.</p>
        </div>
        <div class="quadrant-grid">
          ${renderQuadrants()}
        </div>
      </section>
    </main>
  </div>
`;

renderRadar(document.querySelector("#radar"), structuredClone(radarData));
