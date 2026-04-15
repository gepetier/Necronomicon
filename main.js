import { DATA_VERSION } from "./data.js";
import {
  createPersistedPayload as storageCreatePersistedPayload,
  loadState as loadStoredState,
  migrateStoredState as storageMigrateStoredState,
  persistState as storagePersistState,
} from "./app/storage.js";
import {
  createChronicle as createChronicleEntry,
  deleteChronicle as deleteChronicleEntry,
  renderChroniclesModule as renderChroniclesView,
  saveChronicle as saveChronicleEntry,
} from "./app/chronicles.js";
import {
  renderCharactersModule as renderCharactersView,
  saveCharacterOverview as saveCharacterOverviewEntry,
  saveCharacterTab as saveCharacterTabEntry,
} from "./app/characters.js";
import {
  createGlossaryEntry as createGlossaryItem,
  deleteGlossaryEntry as deleteGlossaryItem,
  renderGlossaryModule as renderGlossaryView,
  saveGlossary as saveGlossaryEntry,
} from "./app/glossary.js";
import {
  escapeAttribute,
  escapeHtml,
  formatShortDate,
  readOptionalString,
  readString,
} from "./app/utils.js";

let state = loadStoredState();
let bookTurnTimer = null;
let saveNoticeTimer = null;

const editModeToggle = document.querySelector("#editModeToggle");
const exportButton = document.querySelector("#exportButton");
const importInput = document.querySelector("#importInput");
const charactersModule = document.querySelector("#charactersModule");
const chroniclesModule = document.querySelector("#chroniclesModule");
const glossaryModule = document.querySelector("#glossaryModule");

initialize();

function initialize() {
  document.addEventListener("click", handleClick);
  document.addEventListener("submit", handleSubmit);
  document.addEventListener("input", handleInput);
  exportButton?.addEventListener("click", exportData);
  importInput?.addEventListener("change", importData);
  editModeToggle?.addEventListener("click", () => {
    state.ui.isEditMode = !state.ui.isEditMode;
    persistAndRender();
  });

  render();
}

function handleClick(event) {
  const moduleLink = event.target.closest("[data-module-link]");
  if (moduleLink) {
    state.ui.currentModule = moduleLink.dataset.moduleLink;
    if (state.ui.currentModule === "characters") {
      state.ui.showCharacterGrid = true;
    }
    state.ui.glossaryReturnView = null;
    state.ui.glossaryReturnTargetId = "";
    persistAndRender();
    return;
  }

  if (event.target.closest("[data-back-to-grid]")) {
    state.ui.showCharacterGrid = true;
    persistAndRender();
    return;
  }

  const characterCard = event.target.closest("[data-character-card]");
  if (characterCard) {
    state.ui.selectedCharacterId = characterCard.dataset.characterCard;
    state.ui.showCharacterGrid = false;
    persistAndRender();
    return;
  }

  const characterTab = event.target.closest("[data-character-tab]");
  if (characterTab) {
    state.ui.selectedCharacterTab = characterTab.dataset.characterTab;
    persistAndRender();
    return;
  }

  const chronicleSelect = event.target.closest("[data-chronicle-id]");
  if (chronicleSelect) {
    state.ui.selectedChronicleId = chronicleSelect.dataset.chronicleId;
    persistAndRender();
    animateBook("next");
    return;
  }

  const chronicleNav = event.target.closest("[data-chronicle-nav]");
  if (chronicleNav) {
    const direction = chronicleNav.dataset.chronicleNav;
    const nextId = getAdjacentChronicleId(direction);
    if (nextId) {
      state.ui.selectedChronicleId = nextId;
      persistAndRender();
      animateBook(direction);
    }
    return;
  }

  const glossaryFilter = event.target.closest("[data-glossary-filter]");
  if (glossaryFilter) {
    state.ui.glossaryCategory = glossaryFilter.dataset.glossaryFilter;
    persistAndRender();
    return;
  }

  const glossarySelect = event.target.closest("[data-glossary-id]");
  if (glossarySelect) {
    state.ui.selectedGlossaryId = glossarySelect.dataset.glossaryId;
    if (state.ui.glossaryReturnTargetId && state.ui.selectedGlossaryId !== state.ui.glossaryReturnTargetId) {
      state.ui.glossaryReturnView = null;
      state.ui.glossaryReturnTargetId = "";
    }
    persistAndRender();
    return;
  }

  const glossaryJump = event.target.closest("[data-glossary-jump]");
  if (glossaryJump) {
    const glossaryId = glossaryJump.dataset.glossaryJump;
    if (glossaryId && findGlossaryEntry(glossaryId)) {
      if (state.ui.currentModule === "chronicles") {
        state.ui.glossaryReturnView = captureCurrentViewState();
        state.ui.glossaryReturnTargetId = glossaryId;
      } else {
        state.ui.glossaryReturnView = null;
        state.ui.glossaryReturnTargetId = "";
      }
      state.ui.currentModule = "glossary";
      state.ui.selectedGlossaryId = glossaryId;
      persistAndRender();
    }
    return;
  }

  if (event.target.closest("[data-return-to-chronicle]")) {
    if (state.ui.glossaryReturnView) {
      restoreViewState(state.ui.glossaryReturnView);
      state.ui.glossaryReturnView = null;
      state.ui.glossaryReturnTargetId = "";
      persistAndRender();
    }
    return;
  }

  const suggestionButton = event.target.closest("[data-insert-glossary-ref]");
  if (suggestionButton) {
    const textarea = document.querySelector(`#${suggestionButton.dataset.inputId}`);
    if (textarea instanceof HTMLTextAreaElement) {
      insertGlossaryReference(
        textarea,
        suggestionButton.dataset.insertGlossaryRef || "",
        suggestionButton.dataset.glossaryLabel || "",
      );
    }
    return;
  }

  if (event.target.closest("[data-create-chronicle]")) {
    createChronicle();
    return;
  }

  if (event.target.closest("[data-delete-chronicle]")) {
    deleteChronicle();
    return;
  }

  if (event.target.closest("[data-create-glossary]")) {
    createGlossaryEntry();
    return;
  }

  if (event.target.closest("[data-delete-glossary]")) {
    deleteGlossaryEntry();
    return;
  }

  if (event.target.closest("[data-toggle-notes]")) {
    state.ui.notesPanelOpen = !state.ui.notesPanelOpen;
    render();
    return;
  }

  if (event.target.closest("[data-close-notes]")) {
    state.ui.notesPanelOpen = false;
    render();
    return;
  }

  const deleteNoteButton = event.target.closest("[data-delete-player-note]");
  if (deleteNoteButton) {
    deletePlayerNote(deleteNoteButton.dataset.deletePlayerNote || "");
  }
}

function handleInput(event) {
  if (event.target.name === "glossarySearch") {
    state.ui.glossarySearch = event.target.value.trim();
    renderGlossaryModule();
  }

  if (event.target instanceof HTMLTextAreaElement && event.target.dataset.refInput === "glossary") {
    renderReferenceSuggestions(event.target);
  }
}

function handleSubmit(event) {
  const form = event.target;
  if (!(form instanceof HTMLFormElement)) {
    return;
  }

  event.preventDefault();

  if (form.dataset.form === "character-overview") {
    saveCharacterOverview(new FormData(form));
  }

  if (form.dataset.form === "character-tab") {
    saveCharacterTab(new FormData(form));
  }

  if (form.dataset.form === "chronicle") {
    saveChronicle(new FormData(form));
  }

  if (form.dataset.form === "glossary") {
    saveGlossary(new FormData(form));
  }

  if (form.dataset.form === "player-note") {
    savePlayerNote(new FormData(form));
  }
}

function render() {
  updateHeader();
  updateSidebar();
  renderCharactersModule();
  renderChroniclesModule();
  renderGlossaryModule();
}

function updateHeader() {
  if (editModeToggle) {
    editModeToggle.textContent = state.ui.isEditMode ? "Tanca edició" : "Mode edició";
  }
}

function updateSidebar() {
  document.querySelectorAll("[data-module-link]").forEach((button) => {
    button.classList.toggle("active", button.dataset.moduleLink === state.ui.currentModule);
  });

  document.querySelectorAll(".module-view").forEach((view) => {
    view.classList.remove("active");
  });

  if (state.ui.currentModule === "characters") {
    charactersModule.classList.add("active");
  }
  if (state.ui.currentModule === "chronicles") {
    chroniclesModule.classList.add("active");
  }
  if (state.ui.currentModule === "glossary") {
    glossaryModule.classList.add("active");
  }
}

function renderCharactersModule() {
  renderCharactersView({
    state,
    rootEl: charactersModule,
    getSelectedCharacter,
  });
}

function renderChroniclesModule() {
  renderChroniclesView({
    state,
    rootEl: chroniclesModule,
    getSelectedChronicle,
    renderPlayerNotesPanel,
    renderPlayerNotesFab,
  });
}

function renderGlossaryModule() {
  renderGlossaryView({
    state,
    rootEl: glossaryModule,
    getFilteredGlossaryEntries,
    findGlossaryEntry,
    findCharacter,
    renderPlayerNotesPanel,
    shouldShowGlossaryReturnFab,
    getViewStateLabel,
  });
}

function renderPlayerNotesPanel() {
  const context = getCurrentPlayerNoteContext();
  if (!context) {
    return "";
  }

  const notes = context.item.playerNotes || [];
  return `
    <aside class="notes-panel ${state.ui.notesPanelOpen ? "open" : ""}">
      <div class="notes-panel-header">
        <div>
          <p class="eyebrow">${escapeHtml(context.buttonLabel)}</p>
          <h3>${escapeHtml(context.title)}</h3>
          <p class="notes-panel-context">${escapeHtml(context.contextLabel)}</p>
        </div>
        <button type="button" class="secondary" data-close-notes>Tanca</button>
      </div>
      <form data-form="player-note" class="notes-panel-form">
        <label class="field">
          <span>Autor</span>
          <input name="author" maxlength="60" placeholder="Qui escriu la nota?" />
        </label>
        <label class="field">
          <span>Nota</span>
          <textarea name="text" rows="4" placeholder="Afegeix una nota de jugador..."></textarea>
        </label>
        <button type="submit">Desa nota</button>
      </form>
      <div class="notes-panel-list">
        ${notes.length
          ? notes
              .map(
                (note) => `
                  <article class="section-card player-note-card">
                    <div class="player-note-meta">
                      <strong>${escapeHtml(note.author)}</strong>
                      <span>${escapeHtml(note.createdAt || "")}</span>
                    </div>
                    <p>${escapeHtml(note.text)}</p>
                    <button
                      type="button"
                      class="secondary"
                      data-delete-player-note="${escapeAttribute(note.id)}"
                    >
                      Esborra nota
                    </button>
                  </article>
                `,
              )
              .join("")
          : `<article class="section-card"><p>${escapeHtml(context.emptyMessage)}</p></article>`}
      </div>
    </aside>
  `;
}

function renderPlayerNotesFab() {
  const context = getCurrentPlayerNoteContext();
  if (!context) {
    return "";
  }

  return `
    <button
      type="button"
      class="notes-fab"
      data-toggle-notes
      title="${escapeAttribute(context.buttonLabel)}"
      aria-label="${escapeAttribute(context.buttonLabel)}"
    >
      Notes
    </button>
  `;
}

function saveCharacterOverview(formData) {
  saveCharacterOverviewEntry(formData, { getSelectedCharacter, showSaveNotice });
}

function saveCharacterTab(formData) {
  saveCharacterTabEntry(formData, { getSelectedCharacter, showSaveNotice });
}

function saveChronicle(formData) {
  saveChronicleEntry(formData, { getSelectedChronicle, showSaveNotice });
}

function savePlayerNote(formData) {
  const context = getCurrentPlayerNoteContext();
  if (!context) {
    return;
  }

  const author = readString(formData, "author");
  const text = readString(formData, "text");
  if (!author || !text) {
    return;
  }

  context.item.playerNotes = context.item.playerNotes || [];
  context.item.playerNotes.unshift({
    id: `pn-${Date.now()}`,
    author,
    createdAt: formatShortDate(new Date()),
    text,
  });
  state.ui.notesPanelOpen = true;
  showSaveNotice("Nota desada");
}

function deletePlayerNote(noteId) {
  const context = getCurrentPlayerNoteContext();
  if (!context || !noteId) {
    return;
  }
  context.item.playerNotes = (context.item.playerNotes || []).filter((note) => note.id !== noteId);
  state.ui.notesPanelOpen = true;
  persistAndRender();
}

function saveGlossary(formData) {
  saveGlossaryEntry(formData, { findGlossaryEntry });
  persistAndRender();
}

function exportData() {
  const data = JSON.stringify(storageCreatePersistedPayload(state), null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `compendi-campanya-v${DATA_VERSION}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function importData(event) {
  if (!importInput) {
    return;
  }
  const [file] = event.target.files || [];
  if (!file) {
    return;
  }

  const reader = new FileReader();
  reader.addEventListener("load", () => {
    try {
      state = storageMigrateStoredState(JSON.parse(reader.result));
      persistAndRender();
    } catch {
      window.alert("El fitxer importat no és compatible amb el compendi.");
    }
  });
  reader.readAsText(file);
  importInput.value = "";
}

function persistAndRender() {
  storagePersistState(state);
  render();
}

function showSaveNotice(message) {
  state.ui.saveNotice = message;
  window.clearTimeout(saveNoticeTimer);
  persistAndRender();
  saveNoticeTimer = window.setTimeout(() => {
    state.ui.saveNotice = "";
    persistAndRender();
  }, 1800);
}

function createChronicle() {
  createChronicleEntry(state);
  persistAndRender();
}

function deleteChronicle() {
  deleteChronicleEntry(state);
  persistAndRender();
}

function createGlossaryEntry() {
  createGlossaryItem(state);
  persistAndRender();
}

function deleteGlossaryEntry() {
  deleteGlossaryItem(state);
  persistAndRender();
}

function getSelectedCharacter() {
  return findCharacter(state.ui.selectedCharacterId);
}

function getSelectedChronicle() {
  return state.chronicles.find((chronicle) => chronicle.id === state.ui.selectedChronicleId) || state.chronicles[0];
}

function captureCurrentViewState() {
  return {
    currentModule: state.ui.currentModule,
    selectedCharacterId: state.ui.selectedCharacterId,
    selectedCharacterTab: state.ui.selectedCharacterTab,
    showCharacterGrid: state.ui.showCharacterGrid,
    selectedChronicleId: state.ui.selectedChronicleId,
    selectedGlossaryId: state.ui.selectedGlossaryId,
  };
}

function restoreViewState(view) {
  if (!view || typeof view !== "object") {
    return;
  }

  state.ui.currentModule = view.currentModule || "characters";
  state.ui.selectedCharacterId = view.selectedCharacterId || state.ui.selectedCharacterId;
  state.ui.selectedCharacterTab = view.selectedCharacterTab || state.ui.selectedCharacterTab;
  state.ui.showCharacterGrid = typeof view.showCharacterGrid === "boolean" ? view.showCharacterGrid : state.ui.showCharacterGrid;
  state.ui.selectedChronicleId = view.selectedChronicleId || state.ui.selectedChronicleId;
  state.ui.selectedGlossaryId = view.selectedGlossaryId || state.ui.selectedGlossaryId;
}

function getViewStateLabel(view) {
  if (!view || typeof view !== "object") {
    return "la vista anterior";
  }

  if (view.currentModule === "chronicles") {
    const chronicle = state.chronicles.find((item) => item.id === view.selectedChronicleId);
    return chronicle ? `${chronicle.chapter} · ${chronicle.title}` : "la crònica anterior";
  }

  if (view.currentModule === "characters") {
    if (view.showCharacterGrid) {
      return "personatges";
    }
    const character = state.characters.find((item) => item.id === view.selectedCharacterId);
    return character ? character.name : "la fitxa de personatge";
  }

  if (view.currentModule === "glossary") {
    const entry = state.glossary.find((item) => item.id === view.selectedGlossaryId);
    return entry ? entry.name : "el glossari";
  }

  return "la vista anterior";
}

function shouldShowGlossaryReturnFab(currentEntryId) {
  return Boolean(
    state.ui.currentModule === "glossary"
      && state.ui.glossaryReturnView?.currentModule === "chronicles"
      && state.ui.glossaryReturnTargetId
      && currentEntryId === state.ui.glossaryReturnTargetId,
  );
}

function getCurrentPlayerNoteContext() {
  if (state.ui.currentModule === "chronicles") {
    const chronicle = getSelectedChronicle();
    if (!chronicle) {
      return null;
    }

    return {
      item: chronicle,
      title: chronicle.title || chronicle.chapter || "Crònica",
      contextLabel: chronicle.chapter || "Crònica activa",
      buttonLabel: "Notes de jugadors",
      emptyMessage: "Encara no hi ha notes de jugadors per aquesta crònica.",
    };
  }

  if (state.ui.currentModule === "glossary") {
    const entry = findGlossaryEntry(state.ui.selectedGlossaryId);
    if (!entry) {
      return null;
    }

    return {
      item: entry,
      title: entry.name || "Entrada del glossari",
      contextLabel: entry.category || "Glossari actiu",
      buttonLabel: "Notes de jugadors",
      emptyMessage: "Encara no hi ha notes de jugadors per aquesta entrada.",
    };
  }

  return null;
}

function getAdjacentChronicleId(direction) {
  const index = state.chronicles.findIndex((chronicle) => chronicle.id === state.ui.selectedChronicleId);
  if (index === -1) {
    return "";
  }
  const offset = direction === "prev" ? -1 : 1;
  return state.chronicles[index + offset]?.id || "";
}

function getFilteredGlossaryEntries() {
  const search = state.ui.glossarySearch.toLowerCase();
  return state.glossary.filter((entry) => {
    const matchesCategory = state.ui.glossaryCategory === "Totes" || entry.category === state.ui.glossaryCategory;
    const matchesSearch = !search
      || entry.name.toLowerCase().includes(search)
      || entry.description.toLowerCase().includes(search)
      || entry.tags.some((tag) => tag.toLowerCase().includes(search));
    return matchesCategory && matchesSearch;
  });
}

function animateBook(direction = "next") {
  const spread = document.querySelector(".book-spread");
  if (!spread) {
    return;
  }

  spread.dataset.turnDirection = direction;
  spread.classList.add("is-turning");
  window.clearTimeout(bookTurnTimer);
  bookTurnTimer = window.setTimeout(() => {
    spread.classList.remove("is-turning");
  }, 350);
}

function findCharacter(id) {
  return state.characters.find((character) => character.id === id);
}

function findGlossaryEntry(id) {
  return state.glossary.find((entry) => entry.id === id);
}

function renderReferenceSuggestions(textarea) {
  const targetId = textarea.dataset.suggestionTarget;
  const container = targetId ? document.querySelector(`#${targetId}`) : null;
  if (!(container instanceof HTMLElement)) {
    return;
  }

  const token = getCurrentToken(textarea);
  if (!token) {
    container.innerHTML = "";
    return;
  }

  const matches = state.glossary
    .filter((entry) => entry.name.toLowerCase().includes(token.toLowerCase()))
    .slice(0, 6);
  if (!matches.length) {
    container.innerHTML = "";
    return;
  }

  container.innerHTML = matches
    .map(
      (entry) => `
        <button
          type="button"
          class="suggestion-chip"
          data-insert-glossary-ref="${entry.id}"
          data-glossary-label="${escapeAttribute(entry.name)}"
          data-input-id="${escapeAttribute(textarea.id)}"
        >
          ${escapeHtml(entry.name)} · ${escapeHtml(entry.category)}
        </button>
      `,
    )
    .join("");
}

function getCurrentToken(textarea) {
  const cursor = textarea.selectionStart || 0;
  const before = textarea.value.slice(0, cursor);
  const match = before.match(/([\p{L}0-9'’-]{2,})$/u);
  return match ? match[1] : "";
}

function insertGlossaryReference(textarea, glossaryId, glossaryName) {
  const cursor = textarea.selectionStart || 0;
  const before = textarea.value.slice(0, cursor);
  const after = textarea.value.slice(cursor);
  const match = before.match(/([\p{L}0-9'’-]{2,})$/u);
  if (!match) {
    return;
  }

  const replacement = `[[${glossaryId}|${glossaryName}]]`;
  const nextValue = `${before.slice(0, before.length - match[1].length)}${replacement}${after}`;
  textarea.value = nextValue;
  const nextCursor = before.slice(0, before.length - match[1].length).length + replacement.length;
  textarea.selectionStart = nextCursor;
  textarea.selectionEnd = nextCursor;
  textarea.dispatchEvent(new Event("input", { bubbles: true }));
}
