import { seedData } from "../data.js";
import {
  escapeAttribute,
  escapeHtml,
  formatShortDate,
  paletteStyle,
  readString,
  renderChronicleMedia,
  renderChronicleRichText,
  renderEditorActions,
  renderEditorCard,
  renderEditorWorkspaceHeader,
  renderInputField,
  renderModuleActionIcon,
  renderRichTextareaField,
  renderStatusPills,
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
            ${state.chronicles.map((chronicle) => renderChronicleIndexEntry(chronicle, state)).join("")}
            <button type="button" class="chapter-entry index-entry chapter-entry-create" data-create-chronicle>
              <span class="module-action-icon">${renderModuleActionIcon("create")}</span>
              <span>Nova cronica</span>
            </button>
          </div>
        </aside>
        ${state.ui.editModes.chronicles
          ? renderChronicleEditingStage(current, state)
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

  if (formData.has("imageNote")) {
    chronicle.imageNote = readString(formData, "imageNote");
  }

  if (formData.has("imageAssets")) {
    chronicle.imageAssets = readString(formData, "imageAssets")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  }

  if (formData.has("voiceNotes")) {
    chronicle.voiceNotes = readString(formData, "voiceNotes")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  }

  if (formData.has("characterIds")) {
    chronicle.characterIds = formData.getAll("characterIds").map(String);
  }

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

function renderChronicleIndexEntry(chronicle, state) {
  const isActive = chronicle.id === state.ui.selectedChronicleId;

  return `
    <article
      class="chapter-entry index-entry ${isActive ? "active" : ""}"
      data-chronicle-id="${chronicle.id}"
      tabindex="0"
      role="option"
      aria-selected="${isActive ? "true" : "false"}"
      aria-label="${escapeAttribute(`Obre ${chronicle.chapter}: ${chronicle.title}`)}"
    >
      ${renderStatusPills(getChronicleStatusPills(chronicle, state))}
      <div class="chapter-entry-head">
        <div class="chapter-entry-copy">
          <p>${escapeHtml(chronicle.chapter)} · ${escapeHtml(chronicle.title)}</p>
          <small>${escapeHtml(chronicle.date)}</small>
        </div>
        ${isActive
          ? `
            <button
              type="button"
              class="secondary chronicle-inline-edit"
              data-toggle-edit="chronicles"
              aria-pressed="${state.ui.editModes.chronicles ? "true" : "false"}"
              aria-label="${escapeAttribute(state.ui.editModes.chronicles ? "Tanca edicio de cronica" : "Edita cronica")}"
              title="${escapeAttribute(state.ui.editModes.chronicles ? "Tanca edicio" : "Edita cronica")}"
            >
              <span class="module-action-icon">${renderModuleActionIcon("chronicles")}</span>
            </button>
          `
          : ""}
      </div>
    </article>
  `;
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
        <div class="chapter-body rich-text">${renderChronicleRichText(current?.content || "Encara no hi ha cos de capitol.")}</div>
        <div class="chapter-highlights">
          <p class="eyebrow">Highlights</p>
          <div class="rich-text">${renderChronicleRichText(current?.highlights || "Sense highlights encara.")}</div>
        </div>
        ${renderChronicleMedia(current)}
        <div class="link-list">
          ${renderPlayerNotesPanel()}
        </div>
        ${renderPlayerNotesFab({ inline: true })}
      </article>
    </div>
  `;
}

function renderChronicleEditingStage(current, state) {
  return `
    <div class="chronicle-edit-stage ${state.ui.notesPanelOpen ? "notes-open" : ""}">
      <div class="chronicle-edit-main">
        ${renderChronicleEditor(current, state)}
      </div>
    </div>
  `;
}

function renderChronicleEditor(chronicle, state) {
  const draft = state.ui.drafts.chronicles[chronicle?.id || ""] || {};
  const hasPendingDraft = Object.keys(draft).length > 0;
  const editorStatus = renderEditorStatus(state, "chronicles", chronicle?.id || "", hasPendingDraft);

  return `
    <section class="module-surface editor-workspace editor-workspace-chronicle">
      ${renderEditorWorkspaceHeader(
        "Edicio de cronica",
        chronicle?.title || "Nova cronica",
        "Aquest espai es centra en el relat de la sessio. Els recursos vinculats es mouran al glossari en una fase posterior.",
        [
          chronicle?.chapter || "Sense capitol",
          chronicle?.date ? formatShortDate(chronicle.date) : "Sense data",
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
        </div>
        ${renderEditorActions(
          "Desa cronica",
          `
            <button type="button" class="secondary" data-discard-chronicle-edit>Descarta canvis</button>
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
