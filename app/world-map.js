import { escapeAttribute, escapeHtml } from "./utils.js";

const MELEDAR_MAP_IMAGE = new URL("../resources/mapes/meledar-hex-map.png", import.meta.url).href;
const HEX_RADIUS = 74;
const MAP_WIDTH = 1200;
const MAP_HEIGHT = 800;
const HEXES = buildHexGrid();

export function renderWorldMapModule({ state, rootEl, findChronicle, canManageWorldMap = false }) {
  const map = state.worldMap;
  if (!map) {
    rootEl.innerHTML = `<section class="module-surface world-map-empty"><p class="eyebrow">Mapa del món</p><h3>Aquesta campanya encara no té atles.</h3><p>El pilot de Meledar només s'activa per a la campanya de prova.</p></section>`;
    return;
  }

  const records = new Map((map.hexes || []).map((hex) => [`${hex.q}:${hex.r}`, hex]));
  const selected = getSelectedHex(state, records);
  const selectedRecord = records.get(`${selected.q}:${selected.r}`) || null;

  rootEl.innerHTML = `
    <section class="world-map-shell module-surface">
      <header class="world-map-head">
        <div><p class="eyebrow">Mapa del món</p><h3>${escapeHtml(map.title || "Atles de campanya")}</h3><p>${escapeHtml(map.subtitle || "Hexes descoberts durant la campanya.")}</p></div>
        <div class="world-map-legend" aria-label="Llegenda del mapa"><span><i class="world-map-swatch is-hidden"></i>Desconegut</span><span><i class="world-map-swatch is-discovered"></i>Descobert</span><span><i class="world-map-swatch is-visited"></i>Visitat</span></div>
      </header>
      <div class="world-map-layout">
        <div class="world-map-stage" aria-label="Mapa hexagonal de Meledar">
          <img src="${escapeAttribute(MELEDAR_MAP_IMAGE)}" alt="Mapa de fantasia de Meledar amb el Sagnatori al centre" />
          <svg class="world-map-grid" viewBox="0 0 ${MAP_WIDTH} ${MAP_HEIGHT}" role="group" aria-label="Caselles hexagonals de Meledar">${HEXES.map((hex) => renderHex(hex, records.get(`${hex.q}:${hex.r}`), selected)).join("")}</svg>
        </div>
        <aside class="world-map-detail" aria-live="polite">${renderHexDetail(selected, selectedRecord, findChronicle, canManageWorldMap)}</aside>
      </div>
    </section>
  `;
}

function renderHex(hex, record, selected) {
  const status = record?.status || "hidden";
  const isSelected = selected.q === hex.q && selected.r === hex.r;
  const name = record?.name || "Territori desconegut";
  return `<g class="world-map-hex-group ${isSelected ? "is-selected" : ""}" data-map-hex="${escapeAttribute(`${hex.q}:${hex.r}`)}" role="button" tabindex="0" aria-label="${escapeAttribute(`${formatCoordinate(hex)}: ${name}`)}"><polygon class="world-map-hex is-${escapeAttribute(status)}" points="${hex.points}" />${isSelected && status !== "hidden" ? `<text class="world-map-hex-label" x="${hex.x}" y="${hex.y}" aria-hidden="true">${escapeHtml(record.name)}</text>` : ""}</g>`;
}

function renderHexDetail(hex, record, findChronicle, canManageWorldMap) {
  const status = record?.status || "hidden";
  const chronicles = (record?.chronicleIds || []).map((id) => findChronicle(id)).filter(Boolean);
  const controls = canManageWorldMap ? `<div class="world-map-controls" aria-label="Controls de mestre de joc"><span>Estat DM</span>${["hidden", "discovered", "visited"].map((value) => `<button type="button" class="secondary ${status === value ? "is-active" : ""}" data-map-hex-status="${value}" data-map-hex-key="${hex.q}:${hex.r}">${statusLabel(value)}</button>`).join("")}</div>` : "";
  return `
    <p class="eyebrow">${escapeHtml(formatCoordinate(hex))}</p><span class="world-map-status is-${escapeAttribute(status)}">${escapeHtml(statusLabel(status))}</span>
    <h3>${escapeHtml(record?.name || "Territori desconegut")}</h3>
    <p class="world-map-terrain">${escapeHtml(record?.terrain || "Els marges d'aquest hex encara no tenen cap nom als mapes del grup.")}</p>
    <p>${escapeHtml(record?.description || "Encara no hi heu estat. Quan el descobriu, aquest hex conservarà la primera visita i les cròniques relacionades.")}</p>
    ${chronicles.length ? `<div class="world-map-chronicles"><p class="eyebrow">Historial de la campanya</p>${chronicles.map((chronicle) => `<button type="button" data-map-chronicle="${escapeAttribute(chronicle.id)}"><span>${escapeHtml(chronicle.chapter || "Crònica")}</span><strong>${escapeHtml(chronicle.title || "Sense títol")}</strong><small>${escapeHtml(chronicle.date || "Data no registrada")}</small></button>`).join("")}</div>` : ""}${controls}`;
}

function getSelectedHex(state, records) {
  const [q, r] = String(state.ui?.selectedMapHexId || "0:0").split(":").map(Number);
  if (Number.isFinite(q) && Number.isFinite(r) && HEXES.some((hex) => hex.q === q && hex.r === r)) return { q, r };
  const fallback = records.get("0:0") || HEXES[0];
  return { q: fallback.q, r: fallback.r };
}

function buildHexGrid() {
  const hexes = [];
  for (let r = -2; r <= 2; r += 1) for (let q = -3; q <= 3; q += 1) {
    const x = MAP_WIDTH / 2 + Math.sqrt(3) * HEX_RADIUS * (q + r / 2);
    const y = MAP_HEIGHT / 2 + 1.5 * HEX_RADIUS * r;
    const points = Array.from({ length: 6 }, (_, index) => {
      const angle = (Math.PI / 180) * (30 + index * 60);
      return `${(x + HEX_RADIUS * Math.cos(angle)).toFixed(1)},${(y + HEX_RADIUS * Math.sin(angle)).toFixed(1)}`;
    }).join(" ");
    hexes.push({ q, r, x: x.toFixed(1), y: y.toFixed(1), points });
  }
  return hexes;
}

function formatCoordinate(hex) { return `Hex ${hex.q >= 0 ? "+" : ""}${hex.q}, ${hex.r >= 0 ? "+" : ""}${hex.r}`; }
function statusLabel(status) { return ({ hidden: "Desconegut", discovered: "Descobert", visited: "Visitat" })[status] || "Desconegut"; }
