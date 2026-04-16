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
  renderModuleActionIcon,
  renderRichTextareaField,
  renderStatusPills,
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
    <section class="hero-banner module-hero module-hero-chronicles">
      <div class="module-hero-copy">
        <p class="eyebrow">Memoria de campanya</p>
        <h2>Croniques amb ritme de volum ilustrat</h2>
        <p>
          Cada sessio queda presentada com un diptic: resum, cos, highlights i recursos vinculats en una lectura
          mes editorial que de wiki.
        </p>
      </div>
      <div class="hero-side-panel">
        <div class="module-inline-actions">
          <button
            type="button"
            class="secondary module-edit-button"
            data-toggle-edit="chronicles"
            aria-pressed="${state.ui.editModes.chronicles ? "true" : "false"}"
          >
            <span class="module-action-icon">${renderModuleActionIcon("chronicles")}</span>
            <span>${state.ui.editModes.chronicles ? "Tanca edicio" : "Edita cronica"}</span>
          </button>
          <button type="button" class="secondary module-edit-button" data-create-chronicle>
            <span class="module-action-icon">${renderModuleActionIcon("create")}</span>
            <span>Nova cronica</span>
          </button>
        </div>
        <div class="hero-stat-grid">
          <div class="hero-stat-card">
            <strong>${state.chronicles.length}</strong>
            <span>Capitols</span>
          </div>
          <div class="hero-stat-card">
            <strong>${state.chronicles.filter((chronicle) => (chronicle.characterIds || []).length).length}</strong>
            <span>Amb repartiment</span>
          </div>
          <div class="hero-stat-card">
            <strong>${(current?.voiceNotes || []).length}</strong>
            <span>Notes de veu</span>
          </div>
        </div>
      </div>
    </section>
    <section class="book-shell ${state.ui.notesPanelOpen ? "notes-open" : ""} ${state.ui.editModes.chronicles ? "chronicles-editing" : ""}">
      <div class="book-layout">
        <aside class="book-index">
          <div class="module-section-header compact">
            <div class="module-section-copy">
              <p class="eyebrow">Index</p>
              <h3>Capitols de campanya</h3>
            </div>
          </div>
          <div class="chapter-list" role="listbox" aria-label="Capitols de campanya">
            ${state.chronicles
              .map(
                (chronicle) => `
                  <article
                    class="chapter-entry index-entry ${chronicle.id === state.ui.selectedChronicleId ? "active" : ""}"
                    data-chronicle-id="${chronicle.id}"
                    tabindex="0"
                    role="option"
                    aria-selected="${chronicle.id === state.ui.selectedChronicleId ? "true" : "false"}"
                    aria-label="${escapeAttribute(`Obre ${chronicle.chapter}: ${chronicle.title}`)}"
                  >
                    ${renderStatusPills(getChronicleStatusPills(chronicle, state))}
                    <p>${escapeHtml(chronicle.chapter)} · ${escapeHtml(chronicle.title)}</p>
                    <small>${escapeHtml(chronicle.date)}</small>
                  </article>
                `,
              )
              .join("")}
          </div>
        </aside>
        ${state.ui.editModes.chronicles
          ? renderChronicleEditingStage(current, state, renderPlayerNotesPanel, renderPlayerNotesFab)
          : renderChronicleReadSpread(current, primaryImage, renderPlayerNotesPanel, renderPlayerNotesFab)}
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
  showSaveNotice("Cronica desada");
}

export function createChronicle(state) {
  const newChronicle = {
    id: `s${Date.now()}`,
    chapter: `Sessio ${state.chronicles.length + 1}`,
    title: "Nova cronica",
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

function renderChronicleReadSpread(current, primaryImage, renderPlayerNotesPanel, renderPlayerNotesFab) {
  return `
    <div class="book-spread">
      <article class="book-page left-page">
        <div class="page-header">
          <p class="eyebrow">${escapeHtml(current?.chapter || "Sessio")}</p>
          <h3>${escapeHtml(current?.title || "Sense cronica")}</h3>
          <span>${escapeHtml(current?.date || "")}</span>
        </div>
        <figure class="book-image-frame">
          ${primaryImage
            ? `<img class="book-image-media" src="${escapeAttribute(primaryImage)}" alt="${escapeAttribute(current?.title || "Imatge de cronica")}" loading="lazy" />`
            : `<div class="book-image" style="${paletteStyle(current?.palette || seedData.chronicles[0].palette)}"></div>`}
        </figure>
        <div class="chapter-summary rich-text">${renderChronicleRichText(current?.summary || "No hi ha resum disponible.")}</div>
        <div class="page-footer">
          <span class="page-number">Pagina esquerra</span>
          <span>${escapeHtml(formatShortDate(current?.date) || current?.date || "")}</span>
        </div>
      </article>
      <article class="book-page right-page">
        <div class="book-controls">
          <button type="button" class="secondary" data-chronicle-nav="prev">Pagina anterior</button>
          <button type="button" data-chronicle-nav="next">Pagina seguent</button>
        </div>
        ${renderPlayerNotesFab()}
        <div class="chapter-body rich-text">${renderChronicleRichText(current?.content || "Encara no hi ha cos de capitol.")}</div>
        <div class="chapter-highlights">
          <p class="eyebrow">Highlights</p>
          <div class="rich-text">${renderChronicleRichText(current?.highlights || "Sense highlights encara.")}</div>
        </div>
        ${renderChronicleMedia(current)}
        <div class="link-list">
          ${renderPlayerNotesPanel()}
        </div>
      </article>
    </div>
  `;
}

function renderChronicleEditingStage(current, state, renderPlayerNotesPanel, renderPlayerNotesFab) {
  return `
    <div class="chronicle-edit-stage ${state.ui.notesPanelOpen ? "notes-open" : ""}">
      <div class="chronicle-edit-main">
        ${renderChronicleEditor(current, state.characters, state)}
      </div>
      <aside class="chronicle-edit-sidebar">
        <div class="section-card chronicle-edit-context">
          <p class="eyebrow">Navegacio</p>
          <h3>${escapeHtml(current?.chapter || "Sense capitol")}</h3>
          <p>${escapeHtml(current?.title || "Nova cronica")}</p>
          <div class="book-controls chronicle-edit-nav">
            <button type="button" class="secondary" data-chronicle-nav="prev">Cronica anterior</button>
            <button type="button" data-chronicle-nav="next">Cronica seguent</button>
          </div>
        </div>
        <div class="section-card chronicle-edit-context">
          <p class="eyebrow">Lectura guardada</p>
          <h3>Resum actual</h3>
          <div class="rich-text">${renderChronicleRichText(current?.summary || "No hi ha resum disponible.")}</div>
        </div>
        <div class="section-card chronicle-edit-context">
          <p class="eyebrow">Highlights</p>
          <div class="rich-text">${renderChronicleRichText(current?.highlights || "Sense highlights encara.")}</div>
        </div>
        ${renderChronicleMedia(current)}
        <div class="chronicle-edit-notes">
          ${renderPlayerNotesFab()}
          ${renderPlayerNotesPanel()}
        </div>
      </aside>
    </div>
  `;
}

function renderChronicleEditor(chronicle, characters, state) {
  const draft = state.ui.drafts.chronicles[chronicle?.id || ""] || {};
  const selected = new Set(readDraftArray(draft.characterIds, chronicle?.characterIds || []));
  const hasPendingDraft = Object.keys(draft).length > 0;
  const editorStatus = renderEditorStatus(state, "chronicles", chronicle?.id || "", hasPendingDraft);

  return `
    <section class="module-surface editor-workspace editor-workspace-chronicle">
      ${renderEditorWorkspaceHeader(
        "Edicio de cronica",
        chronicle?.title || "Nova cronica",
        "El mode edicio prioritza amplada i context. El relat, els recursos i el repartiment es treballen en un canvas propi, sense competir amb el llibre de lectura.",
        [
          chronicle?.chapter || "Sense capitol",
          `${(chronicle?.characterIds || []).length} personatges`,
          `${(chronicle?.voiceNotes || []).length} notes de veu`,
        ],
      )}
      ${editorStatus}
      <form data-form="chronicle" class="editor-form">
        <input type="hidden" name="id" value="${escapeAttribute(chronicle?.id || "")}" />
        <div class="editor-layout editor-layout-chronicle">
          ${renderEditorCard(
            "Portada i relat",
            "El text llarg viu separat del context operatiu per poder escriure amb mes claredat.",
            `
              <div class="editor-grid">
                ${renderInputField("chapter", "Capitol", readDraftValue(draft.chapter, chronicle?.chapter || ""))}
                ${renderInputField("title", "Titol", readDraftValue(draft.title, chronicle?.title || ""))}
                ${renderInputField("date", "Data", readDraftValue(draft.date, chronicle?.date || ""))}
                ${renderRichTextareaField("summary", "Resum principal", readDraftValue(draft.summary, chronicle?.summary || ""), 5)}
                ${renderRichTextareaField("content", "Cos del capitol", readDraftValue(draft.content, chronicle?.content || ""), 10)}
                ${renderRichTextareaField("highlights", "Highlights", readDraftValue(draft.highlights, chronicle?.highlights || ""), 5)}
              </div>
            `,
          )}
          ${renderEditorCard(
            "Escena, recursos i repartiment",
            "Aquesta columna agrupa visuals, audio i personatges implicats sense barrejar-ho amb el relat.",
            `
              <div class="editor-grid">
                ${renderTextareaField("imageNote", "Descripcio visual", readDraftValue(draft.imageNote, chronicle?.imageNote || ""), 4)}
                ${renderTextareaField("imageAssets", "Imatges (una URL o ruta per linia)", readDraftValue(draft.imageAssets, (chronicle?.imageAssets || []).join("\n")), 5)}
                ${renderTextareaField("voiceNotes", "Notes de veu (una URL o ruta per linia)", readDraftValue(draft.voiceNotes, (chronicle?.voiceNotes || []).join("\n")), 5)}
                <div class="field span-2">
                  <span>Personatges implicats</span>
                  <p class="editor-field-copy">Selecciona el repartiment principal sense sortir del context de la sessio.</p>
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
          "Desa cronica",
          `
            <button type="button" class="secondary" data-delete-chronicle>Esborra cronica</button>
          `,
        )}
      </form>
    </section>
  `;
}

function getChronicleStatusPills(chronicle, state) {
  const statusPills = [];
  const hasPendingDraft = Object.keys(state.ui.drafts.chronicles[chronicle.id] || {}).length > 0;

  if (hasPendingDraft) {
    statusPills.push({ label: "Esborrany", tone: "draft" });
  }

  if (state.ui.editModes.chronicles && state.ui.selectedChronicleId === chronicle.id) {
    statusPills.push({ label: "En edicio", tone: "editing" });
  }

  return statusPills;
}

function readDraftValue(draftValue, fallback) {
  return draftValue !== undefined ? draftValue : fallback;
}

function readDraftArray(draftValue, fallback) {
  return Array.isArray(draftValue) ? draftValue : fallback;
}

function renderEditorStatus(state, module, itemId, hasPendingDraft) {
  if (hasPendingDraft) {
    return `<p class="editor-save-state pending">Canvis no desats guardats localment fins que els confirmis.</p>`;
  }

  if (state.ui.lastSaved?.module === module && state.ui.lastSaved?.itemId === itemId && state.ui.lastSaved?.at) {
    return `<p class="editor-save-state">Darrer desat: ${escapeHtml(formatRelativeTime(state.ui.lastSaved.at))}</p>`;
  }

  return "";
}

function formatRelativeTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "fa un moment";
  }

  const diff = Math.max(0, Math.round((Date.now() - date.getTime()) / 1000));
  if (diff < 10) {
    return "fa uns segons";
  }
  if (diff < 60) {
    return `fa ${diff}s`;
  }

  const minutes = Math.round(diff / 60);
  if (minutes < 60) {
    return `fa ${minutes} min`;
  }

  return date.toLocaleTimeString("ca-ES", { hour: "2-digit", minute: "2-digit" });
}
