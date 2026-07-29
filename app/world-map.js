import { escapeAttribute, escapeHtml } from "./utils.js";

const MELEDAR_MAP_IMAGE = new URL("../resources/mapes/meledar-hex-map.png", import.meta.url).href;
const MELEDAR_UNDERLAY_IMAGE = new URL("../resources/mapes/meledar-cartography-underlay.png", import.meta.url).href;
const HEX_RADIUS = 34;
const MAP_WIDTH = 1200;
const MAP_HEIGHT = 800;
const HEX_NEIGHBOURS = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];
const HEXES = buildHexGrid();
const PARTIAL_HEXES = buildPartialHexes(HEXES);

export function renderWorldMapModule({ state, rootEl, findChronicle, updateHexStatus, canManageMap = false }) {
  const map = state.worldMap;
  const editorOpen = Boolean(state.ui?.worldMapEditorOpen);
  if (!map) {
    rootEl.innerHTML = `
      <section class="world-map-empty">
        <header class="world-map-header">
          <div class="world-map-title"><strong>Atles de campanya</strong><span>Mapa hexagonal</span></div>
          <button type="button" class="world-map-exit" data-module-link="characters"><span>&larr;</span>Tornar</button>
        </header>
        <div class="world-map-empty-card">
          <p class="eyebrow">Mapa no configurat</p>
          <h2>Encara no hi ha cap mapa</h2>
          <p>La campanya pot continuar sense mapa. Quan el vulguis, crea la primera graella hexagonal des d'aqui.</p>
          ${canManageMap ? renderCreateMapForm() : "<p class=\"world-map-empty-note\">Un GM pot crear i administrar el mapa d'aquesta campanya.</p>"}
        </div>
      </section>`;
    return;
  }

  const zoom = clampZoom(state.ui?.worldMapZoom);
  const level = zoom >= 1.8 ? "regional" : "global";
  const records = new Map((map.hexes || []).map((hex) => [`${hex.q}:${hex.r}`, hex]));
  const useMeledarArtwork = map.id === "meledar-hex-pilot";
  const mapImage = String(map.imageSrc || (useMeledarArtwork ? MELEDAR_MAP_IMAGE : ""));

  rootEl.innerHTML = `
    <section class="world-map-shell ${mapImage ? "has-map-art" : "is-generic-map"}" data-world-map-level="${level}">
      <header class="world-map-header">
        <div class="world-map-title"><strong>${escapeHtml(map.title || "Mapa de campanya")}</strong><span>${escapeHtml(map.subtitle || "Atles de campanya")}</span></div>
        <div class="world-map-header-actions">
          ${canManageMap ? `<button type="button" class="world-map-manage-toggle" data-toggle-world-map-editor aria-expanded="${editorOpen}">${editorOpen ? "Tanca gestio" : "Gestiona"}</button>` : ""}
          <button type="button" class="world-map-exit" data-module-link="characters"><span>&larr;</span>Tornar</button>
        </div>
      </header>
      ${canManageMap && editorOpen ? renderMapManager(map) : ""}
      <div class="world-map-viewport" data-world-map-viewport aria-label="${escapeAttribute(map.title || "Mapa de campanya")}" tabindex="0">
        <div class="world-map-canvas" style="--map-zoom:${zoom}">
          ${mapImage ? `<img ${map.imageSrc ? `data-asset-src="${escapeAttribute(map.imageSrc)}"` : ""} src="${escapeAttribute(mapImage)}" alt="${escapeAttribute(map.title || "Mapa de campanya")}" />` : ""}
          <svg class="world-map-grid" viewBox="0 0 ${MAP_WIDTH} ${MAP_HEIGHT}" preserveAspectRatio="xMidYMid slice" role="group" aria-label="Hexagons del mapa">
            <defs>
              <clipPath id="world-map-hidden-clip">${HEXES.filter((hex) => (records.get(`${hex.q}:${hex.r}`)?.status || "hidden") === "hidden").map((hex) => `<polygon points="${hex.points}" />`).join("")}</clipPath>
              <clipPath id="world-map-edge-clip"><rect x="0" y="0" width="${MAP_WIDTH}" height="${MAP_HEIGHT}" /></clipPath>
              <radialGradient id="world-map-discovery-fog" cx="50%" cy="50%" r="72%"><stop offset="0" stop-color="#030200" stop-opacity="0.2" /><stop offset="0.64" stop-color="#030200" stop-opacity="0.42" /><stop offset="1" stop-color="#030200" stop-opacity="0.82" /></radialGradient>
            </defs>
            ${useMeledarArtwork ? `<image class="world-map-hidden-underlay" href="${escapeAttribute(MELEDAR_UNDERLAY_IMAGE)}" width="${MAP_WIDTH}" height="${MAP_HEIGHT}" preserveAspectRatio="xMidYMid slice" clip-path="url(#world-map-hidden-clip)" />` : ""}
            ${HEXES.map((hex) => renderHex(hex, records.get(`${hex.q}:${hex.r}`))).join("")}
            <g clip-path="url(#world-map-edge-clip)">${PARTIAL_HEXES.map((hex) => renderPartialHex(hex, records, useMeledarArtwork)).join("")}</g>
          </svg>
        </div>
      </div>
      <aside class="world-map-inspector" data-world-map-inspector aria-live="polite"></aside>
      <div class="world-map-hud" aria-label="Controls de zoom"><span class="world-map-level">${level === "regional" ? "Regional" : "Global"}</span><div class="world-map-zoom-controls"><button type="button" data-map-zoom="out" aria-label="Allunya el mapa">-</button><span class="world-map-zoom-value">${Math.round(zoom * 100)}%</span><button type="button" data-map-zoom="in" aria-label="Apropa el mapa">+</button></div></div>
    </section>`;
  bindMapInspector(rootEl, records, findChronicle, canManageMap ? updateHexStatus : null);
}

export function clampWorldMapZoom(value) { return clampZoom(value); }

function renderCreateMapForm() {
  return `<form class="world-map-create-form" data-form="world-map-create"><label><span>Nom del mapa</span><input name="title" maxlength="80" value="Mapa de campanya" required /></label><label><span>Subtitol</span><input name="subtitle" maxlength="120" placeholder="Atles de la campanya" /></label><button type="submit" class="primary">Crea mapa hexagonal</button></form>`;
}

function renderMapManager(map) {
  const discovered = (map.hexes || []).filter((hex) => hex.status === "discovered").length;
  const visited = (map.hexes || []).filter((hex) => hex.status === "visited").length;
  return `<aside class="world-map-manager" aria-label="Gestio del mapa"><form data-form="world-map-settings"><label><span>Nom</span><input name="title" maxlength="80" value="${escapeAttribute(map.title || "")}" required /></label><label><span>Subtitol</span><input name="subtitle" maxlength="120" value="${escapeAttribute(map.subtitle || "")}" /></label><button type="submit" class="secondary">Desa titol</button></form><div class="world-map-manager-status"><span>${discovered} descoberts</span><span>${visited} visitats</span></div><p>Doble clic o doble toc sobre un hex per alternar: ocult, descobert i visitat.</p><div class="world-map-manager-actions"><button type="button" class="secondary" data-reset-world-map-hexes>Reinicia hexes</button><button type="button" class="danger" data-delete-world-map>Esborra mapa</button></div></aside>`;
}

function renderHex(hex, record) {
  const status = record?.status || "hidden";
  const name = record?.name || "Territori desconegut";
  return `<g class="world-map-hex-group" data-map-hex="${escapeAttribute(`${hex.q}:${hex.r}`)}" tabindex="0" role="img" aria-label="${escapeAttribute(`${formatCoordinate(hex)}: ${name}`)}"><polygon class="world-map-hex is-${escapeAttribute(status)}" points="${hex.points}" /></g>`;
}

function renderPartialHex(hex, records, useMeledarArtwork) {
  if (!useMeledarArtwork) return "";
  const fullyRevealed = hex.adjacentKeys.length > 0 && hex.adjacentKeys.every((key) => ["discovered", "visited"].includes(records.get(key)?.status || "hidden"));
  return fullyRevealed ? `<g class="world-map-partial-hex" aria-hidden="true"><polygon points="${hex.points}" /></g>` : "";
}

function bindMapInspector(rootEl, records, findChronicle, updateHexStatus) {
  const inspector = rootEl.querySelector("[data-world-map-inspector]");
  if (!inspector) return;
  const showHex = (target) => { const key = String(target.dataset.mapHex || ""); inspector.innerHTML = renderHexInspector(records.get(key), key, findChronicle, Boolean(updateHexStatus)); inspector.classList.add("is-active"); };
  const hideHex = () => { inspector.classList.remove("is-active"); inspector.innerHTML = ""; };
  rootEl.querySelectorAll("[data-map-hex]").forEach((hex) => {
    hex.addEventListener("pointerenter", () => showHex(hex));
    hex.addEventListener("focus", () => showHex(hex));
    hex.addEventListener("pointerleave", (event) => { if (event.pointerType !== "touch") hideHex(); });
    hex.addEventListener("pointerdown", (event) => { if (event.pointerType === "touch") showHex(hex); });
    hex.addEventListener("click", () => showHex(hex));
    if (updateHexStatus) hex.addEventListener("dblclick", () => updateHexStatus(String(hex.dataset.mapHex || "")));
    hex.addEventListener("blur", hideHex);
  });
}

function renderHexInspector(record, coordinate, findChronicle, canManageMap) {
  const status = record?.status || "hidden";
  const actionHint = canManageMap ? "Doble clic per canviar l'estat" : "";
  if (!record || status === "hidden") return `<span class="world-map-inspector-mark">?</span><div class="world-map-inspector-copy"><span class="world-map-inspector-kicker">${escapeHtml(coordinate)}</span><strong>Territori desconegut</strong><p>Encara no s'ha explorat aquesta regio.</p><small>${actionHint}</small></div>`;
  const chronicles = (record.chronicleIds || []).map((id) => findChronicle(id)).filter(Boolean);
  const chronicleText = chronicles.map((chronicle) => chronicle.chapter || chronicle.title).filter(Boolean).join(" - ");
  const statusLabel = status === "visited" ? "Visitat" : "Descobert";
  return `<span class="world-map-inspector-mark">${status === "visited" ? "*" : "o"}</span><div class="world-map-inspector-copy"><span class="world-map-inspector-kicker">${escapeHtml(statusLabel)} - ${escapeHtml(record.terrain || coordinate)}</span><strong>${escapeHtml(record.name || "Territori descobert")}</strong><p>${escapeHtml(record.description || "Sense anotacions.")}</p><small>${chronicleText ? escapeHtml(chronicleText) : actionHint}</small></div>`;
}

function buildHexGrid() { const hexes = []; for (let r = -12; r <= 12; r += 1) for (let q = -16; q <= 16; q += 1) { const hex = createHex(q, r); if (hex.vertices.every((point) => point.x >= 0 && point.x <= MAP_WIDTH && point.y >= 0 && point.y <= MAP_HEIGHT)) hexes.push(hex); } return hexes; }
function buildPartialHexes(hexes) { const complete = new Map(hexes.map((hex) => [`${hex.q}:${hex.r}`, hex])); const candidates = new Map(); for (const hex of hexes) for (const [qOffset, rOffset] of HEX_NEIGHBOURS) { const q = hex.q + qOffset; const r = hex.r + rOffset; const key = `${q}:${r}`; if (!complete.has(key) && !candidates.has(key)) candidates.set(key, createHex(q, r)); } return [...candidates.values()].filter((hex) => intersectsMap(hex.vertices)).map((hex) => ({ ...hex, adjacentKeys: HEX_NEIGHBOURS.map(([qOffset, rOffset]) => complete.get(`${hex.q + qOffset}:${hex.r + rOffset}`)).filter(Boolean).map((neighbour) => `${neighbour.q}:${neighbour.r}`) })); }
function createHex(q, r) { const x = MAP_WIDTH / 2 + Math.sqrt(3) * HEX_RADIUS * (q + r / 2); const y = MAP_HEIGHT / 2 + 1.5 * HEX_RADIUS * r; const vertices = Array.from({ length: 6 }, (_, index) => { const angle = (Math.PI / 180) * (30 + index * 60); return { x: x + HEX_RADIUS * Math.cos(angle), y: y + HEX_RADIUS * Math.sin(angle) }; }); return { q, r, x, y, vertices, points: formatPoints(vertices) }; }
function formatPoints(points) { return points.map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(" "); }
function intersectsMap(vertices) { return vertices.some((point) => point.x >= 0 && point.x <= MAP_WIDTH && point.y >= 0 && point.y <= MAP_HEIGHT); }
function clampZoom(value) { return Math.min(3.2, Math.max(1, Math.round((Number(value) || 1) * 10) / 10)); }
function formatCoordinate(hex) { return `Hex ${hex.q >= 0 ? "+" : ""}${hex.q}, ${hex.r >= 0 ? "+" : ""}${hex.r}`; }