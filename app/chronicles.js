import { seedData } from "../data.js";
import {
  escapeAttribute,
  escapeHtml,
  formatShortDate,
  paletteStyle,
  readString,
  renderChronicleMedia,
  renderChronicleRichText,
  renderChoiceGrid,
  renderEditorActions,
  renderEditorCard,
  renderEditorWorkspaceHeader,
  renderInputField,
  renderReferenceTextareaField,
  renderTextareaField,
} from "./utils.js";

export function renderChroniclesModule({
  state,
  rootEl,
  getSelectedChronicle,
  renderPlayerNotesPanel,
  renderPlayerNotesFab,
}) {
  const current = getSelectedChronicle();
  const primaryImage = current?.imageAssets?.[0] || "";

  rootEl.innerHTML = `
    <section class="book-shell ${state.ui.notesPanelOpen ? "notes-open" : ""}">
      <div class="book-layout">
        <aside class="book-index">
          <div>
            <p class="eyebrow">Índex</p>
            <h3>Capítols de campanya</h3>
          </div>
          <div class="chapter-list">
            ${state.chronicles
              .map(
                (chronicle) => `
                  <article
                    class="chapter-entry ${chronicle.id === state.ui.selectedChronicleId ? "active" : ""}"
                    data-chronicle-id="${chronicle.id}"
                  >
                    <p>${escapeHtml(chronicle.chapter)} · ${escapeHtml(chronicle.title)}</p>
                    <small>${escapeHtml(chronicle.date)}</small>
                  </article>
                `,
              )
              .join("")}
          </div>
        </aside>
        <div class="book-spread ${state.ui.notesPanelOpen ? "notes-open" : ""}">
          <article class="book-page">
            <div class="page-header">
              <p class="eyebrow">${escapeHtml(current?.chapter || "Sessió")}</p>
              <h3>${escapeHtml(current?.title || "Sense crònica")}</h3>
              <span>${escapeHtml(current?.date || "")}</span>
            </div>
            <figure class="book-image-frame">
              ${primaryImage
                ? `<img class="book-image-media" src="${escapeAttribute(primaryImage)}" alt="${escapeAttribute(current?.title || "Imatge de crònica")}" loading="lazy" />`
                : `<div class="book-image" style="${paletteStyle(current?.palette || seedData.chronicles[0].palette)}"></div>`}
            </figure>
            <div class="chapter-summary">${renderChronicleRichText(current?.summary || "No hi ha resum disponible.")}</div>
            <div class="page-footer">
              <span class="page-number">Pàgina esquerra</span>
              <span>${escapeHtml(formatShortDate(current?.date) || current?.date || "")}</span>
            </div>
          </article>
          <article class="book-page">
            <div class="book-controls">
              <button type="button" class="secondary" data-chronicle-nav="prev">Pàgina anterior</button>
              <button type="button" data-chronicle-nav="next">Pàgina següent</button>
            </div>
            ${state.ui.isEditMode ? renderChronicleEditorV2(current, state.characters) : ""}
            ${renderPlayerNotesFab()}
            <div class="chapter-body">${renderChronicleRichText(current?.content || "Encara no hi ha cos de capítol.")}</div>
            <div class="chapter-highlights">
              <p class="eyebrow">Highlights</p>
              <p>${escapeHtml(current?.highlights || "Sense highlights encara.")}</p>
            </div>
            ${renderChronicleMedia(current)}
            <div class="link-list">
              ${renderPlayerNotesPanel()}
            </div>
          </article>
        </div>
      </div>
    </section>
  `;
}

export function saveChronicle(formData, { getSelectedChronicle, showSaveNotice }) {
  const chronicle = getSelectedChronicle();
  if (!chronicle) {
    return;
  }

  chronicle.chapter = readString(formData, "chapter");
  chronicle.title = readString(formData, "title");
  chronicle.date = readString(formData, "date");
  chronicle.summary = readString(formData, "summary");
  chronicle.content = readString(formData, "content");
  chronicle.highlights = readString(formData, "highlights");
  chronicle.imageNote = readString(formData, "imageNote");
  chronicle.imageAssets = readString(formData, "imageAssets")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  chronicle.voiceNotes = readString(formData, "voiceNotes")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  chronicle.characterIds = formData.getAll("characterIds").map(String);
  showSaveNotice("Crònica desada");
}

export function createChronicle(state) {
  const newChronicle = {
    id: `s${Date.now()}`,
    chapter: `Sessió ${state.chronicles.length + 1}`,
    title: "Nova crònica",
    date: "",
    summary: "",
    content: "",
    highlights: "",
    imageNote: "",
    imageAssets: [],
    playerNotes: [],
    voiceNotes: [],
    characterIds: [],
    palette: ["#64483d", "#c8a86d"],
  };
  state.chronicles.push(newChronicle);
  state.ui.selectedChronicleId = newChronicle.id;
}

export function deleteChronicle(state) {
  if (state.chronicles.length <= 1) {
    return;
  }
  state.chronicles = state.chronicles.filter((chronicle) => chronicle.id !== state.ui.selectedChronicleId);
  state.ui.selectedChronicleId = state.chronicles[0].id;
}

function renderChronicleEditorV2(chronicle, characters) {
  const selected = new Set(chronicle?.characterIds || []);
  return `
    <section class="module-surface editor-workspace editor-workspace-chronicle">
      ${renderEditorWorkspaceHeader(
        "Edició de crònica",
        chronicle?.title || "Nova crònica",
        "Per a escriptori 14:9 el relat i els recursos queden separats. En mòbil, el formulari s'apila per blocs i manté les accions a mà.",
        [
          chronicle?.chapter || "Sense capítol",
          `${(chronicle?.characterIds || []).length} personatges`,
          `${(chronicle?.voiceNotes || []).length} notes de veu`,
        ],
      )}
      <form data-form="chronicle" class="editor-form">
        <input type="hidden" name="id" value="${escapeAttribute(chronicle?.id || "")}" />
        <div class="editor-layout editor-layout-chronicle">
          ${renderEditorCard(
            "Portada i relat",
            "El text llarg viu separat del context operatiu per poder escriure amb més claredat.",
            `
              <div class="editor-grid">
                ${renderInputField("chapter", "Capítol", chronicle?.chapter || "")}
                ${renderInputField("title", "Títol", chronicle?.title || "")}
                ${renderInputField("date", "Data", chronicle?.date || "")}
                ${renderReferenceTextareaField("summary", "Resum principal", chronicle?.summary || "", 4)}
                ${renderReferenceTextareaField("content", "Cos del capítol", chronicle?.content || "", 10)}
                ${renderReferenceTextareaField("highlights", "Highlights", chronicle?.highlights || "", 4)}
              </div>
            `,
          )}
          ${renderEditorCard(
            "Escena, recursos i repartiment",
            "Aquesta columna agrupa visuals, àudio i personatges implicats sense barrejar-ho amb el relat.",
            `
              <div class="editor-grid">
                ${renderTextareaField("imageNote", "Descripció visual", chronicle?.imageNote || "", 4)}
                ${renderTextareaField("imageAssets", "Imatges (una URL o ruta per línia)", (chronicle?.imageAssets || []).join("\n"), 5)}
                ${renderTextareaField("voiceNotes", "Notes de veu (una URL o ruta per línia)", (chronicle?.voiceNotes || []).join("\n"), 5)}
                <div class="field span-2">
                  <span>Personatges implicats</span>
                  <p class="editor-field-copy">Selecciona el repartiment principal sense sortir del context de la sessió.</p>
                  ${renderChoiceGrid(
                    "characterIds",
                    characters,
                    selected,
                    (character) => character.id,
                    (character) => character.name,
                    (character) => `${character.lineage} · ${character.className}`,
                  )}
                </div>
              </div>
            `,
          )}
        </div>
        ${renderEditorActions(
          "Desa crònica",
          `
            <button type="button" class="secondary" data-delete-chronicle>Esborra crònica</button>
          `,
        )}
      </form>
    </section>
  `;
}
