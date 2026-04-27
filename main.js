import {
  loadState as loadStoredState,
  migrateStoredState as storageMigrateStoredState,
  persistState as storagePersistState,
} from "./app/storage.js";
import {
  createChronicle as createChronicleEntry,
  deleteChronicle as deleteChronicleEntry,
  renderChroniclesModule as renderChroniclesView,
  renderChronicleSidebarPanel as renderChronicleSidebarView,
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
  getGlossaryCategoryTheme,
  readOptionalString,
  renderRichText,
  readString,
} from "./app/utils.js";

let state = loadStoredState();
let bookTurnTimer = null;
let saveNoticeTimer = null;
let persistStateTimer = null;
let glossarySearchTimer = null;
let chronicleIndexSearchTimer = null;

const referenceSuggestionTimers = new WeakMap();
const richPreviewTimers = new WeakMap();

const saveNoticeEl = document.querySelector("#saveNotice");
const charactersModule = document.querySelector("#charactersModule");
const chroniclesModule = document.querySelector("#chroniclesModule");
const glossaryModule = document.querySelector("#glossaryModule");
const sidebarContextPanel = document.querySelector("#sidebarContextPanel");
const imageLightbox = document.querySelector("#imageLightbox");
const imageLightboxMedia = document.querySelector("#imageLightboxMedia");
const richMediaPicker = document.querySelector("#richMediaPicker");

let lastLightboxTrigger = null;
let pendingRichMediaInsert = null;

initialize();

function initialize() {
  ensureUiStateShape();

  document.addEventListener("click", handleClick);
  document.addEventListener("keydown", handleKeydown);
  document.addEventListener("keyup", handleKeyup);
  document.addEventListener("submit", handleSubmit);
  document.addEventListener("input", handleInput);
  document.addEventListener("change", handleInput);
  window.addEventListener("pagehide", flushPendingPersist);

  render();
}

function handleClick(event) {
  if (event.target.closest("[data-close-image-lightbox]")) {
    closeImageLightbox();
    return;
  }

  const clickedImage = event.target instanceof HTMLImageElement
    ? event.target
    : event.target.closest("img");
  if (clickedImage instanceof HTMLImageElement && !clickedImage.closest("#imageLightbox")) {
    event.preventDefault();
    event.stopPropagation();
    openImageLightbox(clickedImage);
    return;
  }

  const suggestionButton = event.target.closest("[data-insert-reference], [data-insert-glossary-ref], [data-insert-media]");
  const referenceTextarea = event.target.closest("textarea[data-ref-input='glossary']");
  if (!suggestionButton && !referenceTextarea) {
    clearAllReferenceSuggestions();
  }

  if (referenceTextarea instanceof HTMLTextAreaElement) {
    requestAnimationFrame(() => {
      renderReferenceSuggestions(referenceTextarea);
    });
  }

  const moduleLink = event.target.closest("[data-module-link]");
  if (moduleLink) {
    state.ui.currentModule = moduleLink.dataset.moduleLink;
    state.ui.glossaryReturnView = null;
    state.ui.glossaryReturnTargetId = "";
    persistAndRender();
    return;
  }

  const editToggle = event.target.closest("[data-toggle-edit]");
  if (editToggle) {
    toggleModuleEdit(editToggle.dataset.toggleEdit || "");
    return;
  }

  if (event.target.closest("[data-open-character-editor]")) {
    state.ui.currentModule = "characters";
    state.ui.showCharacterGrid = false;
    state.ui.editModes.characters = true;
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
    switchChronicleSelection(chronicleSelect.dataset.chronicleId || "", "next");
    return;
  }

  const chronicleNav = event.target.closest("[data-chronicle-nav]");
  if (chronicleNav) {
    const direction = chronicleNav.dataset.chronicleNav;
    const nextId = getAdjacentChronicleId(direction);
    if (nextId) {
      switchChronicleSelection(nextId, direction);
    }
    return;
  }

  const glossaryFilter = event.target.closest("[data-glossary-filter]");
  if (glossaryFilter) {
    state.ui.glossaryCategory = glossaryFilter.dataset.glossaryFilter;
    persistAndRender();
    return;
  }

  if (event.target.closest("[data-clear-glossary-filters]")) {
    state.ui.glossarySearch = "";
    state.ui.glossaryCategory = "Totes";
    state.ui.glossaryChronicleIds = [];
    persistAndRender();
    return;
  }

  if (event.target.closest("[data-clear-chronicle-search]")) {
    state.ui.chronicleIndexSearch = "";
    persistAndRender();
    return;
  }

  const glossaryEditCard = event.target.closest("[data-edit-glossary-card]");
  if (glossaryEditCard) {
    openGlossaryEditor(glossaryEditCard.dataset.editGlossaryCard || "");
    return;
  }

  const glossaryDeleteCard = event.target.closest("[data-delete-glossary-card]");
  if (glossaryDeleteCard) {
    deleteGlossaryEntryById(glossaryDeleteCard.dataset.deleteGlossaryCard || "");
    return;
  }

  if (event.target.closest("[data-open-glossary-image-picker]")) {
    const form = event.target.closest('form[data-form="glossary"]');
    const picker = form?.querySelector("[data-glossary-image-picker]");
    if (picker instanceof HTMLInputElement) {
      picker.click();
    }
    return;
  }

  const glossaryRemoveImage = event.target.closest("[data-remove-glossary-image]");
  if (glossaryRemoveImage) {
    const glossaryId = glossaryRemoveImage.dataset.glossaryId || "";
    const imageIndex = Number.parseInt(glossaryRemoveImage.dataset.removeGlossaryImage || "-1", 10);
    if (glossaryId && Number.isInteger(imageIndex) && imageIndex >= 0) {
      updateGlossaryDraftImageAssets(glossaryId, (images) => images.filter((_, index) => index !== imageIndex));
    }
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

  const referenceJump = event.target.closest("[data-reference-jump], [data-glossary-jump]");
  if (referenceJump) {
    const referenceId = referenceJump.dataset.referenceJump || referenceJump.dataset.glossaryJump || "";
    const glossaryEntry = referenceId ? findGlossaryEntry(referenceId) : null;
    if (glossaryEntry) {
      if (state.ui.currentModule === "chronicles") {
        state.ui.glossaryReturnView = captureCurrentViewState();
        state.ui.glossaryReturnTargetId = referenceId;
        if (!doesGlossaryEntryMatchCurrentFilters(glossaryEntry)) {
          state.ui.glossarySearch = "";
          state.ui.glossaryCategory = "Totes";
          state.ui.glossaryChronicleIds = [];
        }
      } else {
        state.ui.glossaryReturnView = null;
        state.ui.glossaryReturnTargetId = "";
      }
      state.ui.currentModule = "glossary";
      state.ui.selectedGlossaryId = referenceId;
      persistAndRender();
      revealGlossaryEntry(referenceId);
      return;
    }

    const character = referenceId ? findCharacter(referenceId) : null;
    if (character) {
      state.ui.glossaryReturnView = null;
      state.ui.glossaryReturnTargetId = "";
      state.ui.currentModule = "characters";
      state.ui.selectedCharacterId = referenceId;
      state.ui.showCharacterGrid = false;
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

  if (suggestionButton) {
    const textarea = document.querySelector(`#${suggestionButton.dataset.inputId}`);
    if (textarea instanceof HTMLTextAreaElement) {
      if (suggestionButton.dataset.insertMedia === "true") {
        openRichMediaPicker({
          textareaId: textarea.id,
          referenceLabel: suggestionButton.dataset.referenceLabel || "",
          referenceStart: suggestionButton.dataset.referenceStart || "",
          referenceEnd: suggestionButton.dataset.referenceEnd || "",
        });
        return;
      }

      insertReference(
        textarea,
        suggestionButton.dataset.insertReference || suggestionButton.dataset.insertGlossaryRef || "",
        suggestionButton.dataset.referenceLabel || "",
        suggestionButton.dataset.referenceStart || "",
        suggestionButton.dataset.referenceEnd || "",
      );
    }
    return;
  }

  const richActionButton = event.target.closest("[data-rich-action]");
  if (richActionButton) {
    const textarea = document.querySelector(`#${richActionButton.dataset.inputId}`);
    if (textarea instanceof HTMLTextAreaElement) {
      applyRichFormatting(textarea, richActionButton.dataset.richAction || "");
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

  if (event.target.closest("[data-discard-chronicle-edit]")) {
    discardChronicleChanges();
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

  if (event.target.closest("[data-save-character]")) {
    saveCharacterEdits();
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

function handleKeydown(event) {
  if (event.defaultPrevented) {
    return;
  }

  if (event.key === "Escape" && isImageLightboxOpen()) {
    event.preventDefault();
    closeImageLightbox();
    return;
  }

  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }

  if (target.closest("input, textarea, select, button")) {
    if (handleCompositeNavigation(event, target)) {
      return;
    }

    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    if (target.closest("button")) {
      return;
    }
  } else if (handleCompositeNavigation(event, target)) {
    return;
  } else if (event.key !== "Enter" && event.key !== " ") {
    return;
  }

  const actionableCard = target.closest("[data-character-card], [data-chronicle-id], [data-glossary-id]");
  if (!actionableCard) {
    return;
  }

  event.preventDefault();
  actionableCard.click();
}

function handleCompositeNavigation(event, target) {
  const navigationGroups = [
    {
      itemSelector: "[data-module-link]",
      containerSelector: ".module-nav",
      previousKeys: ["ArrowLeft"],
      nextKeys: ["ArrowRight"],
      activateOnMove: true,
    },
    {
      itemSelector: "[data-character-tab]",
      containerSelector: ".tab-strip",
      previousKeys: ["ArrowLeft"],
      nextKeys: ["ArrowRight"],
      activateOnMove: true,
    },
    {
      itemSelector: "[data-glossary-filter]",
      containerSelector: ".glossary-filters",
      previousKeys: ["ArrowLeft"],
      nextKeys: ["ArrowRight"],
      activateOnMove: true,
    },
    {
      itemSelector: "[data-chronicle-id]",
      containerSelector: ".chapter-list",
      previousKeys: ["ArrowUp"],
      nextKeys: ["ArrowDown"],
      activateOnMove: true,
    },
  ];

  for (const group of navigationGroups) {
    const currentItem = target.closest(group.itemSelector);
    if (!currentItem) {
      continue;
    }

    const container = currentItem.closest(group.containerSelector);
    if (!container) {
      return false;
    }

    const items = Array.from(container.querySelectorAll(group.itemSelector));
    const currentIndex = items.indexOf(currentItem);
    if (currentIndex === -1) {
      return false;
    }

    let nextIndex = -1;
    if (group.previousKeys.includes(event.key)) {
      nextIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
    } else if (group.nextKeys.includes(event.key)) {
      nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = items.length - 1;
    } else {
      return false;
    }

    const nextItem = items[nextIndex];
    if (!(nextItem instanceof HTMLElement)) {
      return false;
    }

    event.preventDefault();
    const focusSelector = buildFocusSelector(nextItem);
    nextItem.focus();
    nextItem.scrollIntoView({ block: "nearest", inline: "nearest" });

    if (group.activateOnMove) {
      nextItem.click();
      if (focusSelector) {
        requestAnimationFrame(() => {
          const refreshedItem = document.querySelector(focusSelector);
          if (refreshedItem instanceof HTMLElement) {
            refreshedItem.focus();
          }
        });
      }
    }

    return true;
  }

  return false;
}

function buildFocusSelector(element) {
  if (element.id) {
    return `#${CSS.escape(element.id)}`;
  }

  if (element.dataset.moduleLink) {
    return `[data-module-link="${element.dataset.moduleLink}"]`;
  }

  if (element.dataset.characterTab) {
    return `[data-character-tab="${element.dataset.characterTab}"]`;
  }

  if (element.dataset.glossaryFilter) {
    return `[data-glossary-filter="${element.dataset.glossaryFilter}"]`;
  }

  if (element.dataset.chronicleId) {
    return `[data-chronicle-id="${element.dataset.chronicleId}"]`;
  }

  return "";
}

function handleInput(event) {
  if (event.target?.name === "chronicleIndexSearch") {
    state.ui.chronicleIndexSearch = event.target.value.trim();
    scheduleChronicleIndexSearchRender();
    return;
  }

  if (event.target?.name === "glossarySearch") {
    const searchInput = event.target instanceof HTMLInputElement ? event.target : null;
    const selectionStart = searchInput?.selectionStart ?? null;
    const selectionEnd = searchInput?.selectionEnd ?? null;

    state.ui.glossarySearch = searchInput?.value || "";
    scheduleGlossarySearchRender(selectionStart, selectionEnd);
    return;
  }

  if (event.target instanceof HTMLInputElement && event.target.dataset.glossarySession) {
    const chronicleId = event.target.dataset.glossarySession;
    const activeChronicleIds = new Set(state.ui.glossaryChronicleIds || []);
    if (event.target.checked) {
      activeChronicleIds.add(chronicleId);
    } else {
      activeChronicleIds.delete(chronicleId);
    }
    state.ui.glossaryChronicleIds = [...activeChronicleIds];
    persistAndRender();
    return;
  }

  if (event.target instanceof HTMLInputElement && event.target.dataset.glossaryImagePicker !== undefined) {
    void handleGlossaryImageSelection(event.target);
    return;
  }

  if (event.target instanceof HTMLInputElement && event.target.dataset.richMediaPicker !== undefined) {
    void handleRichMediaSelection(event.target);
    return;
  }

  if (event.target instanceof HTMLTextAreaElement && event.target.dataset.refInput === "glossary") {
    scheduleReferenceSuggestions(event.target);
  }

  if (event.target instanceof HTMLTextAreaElement && event.target.dataset.richInput === "true") {
    scheduleRichPreview(event.target);
  }

  const form = event.target instanceof HTMLElement ? event.target.closest("form[data-form]") : null;
  if (form instanceof HTMLFormElement) {
    updateDraftFromForm(form);
  }
}

function handleKeyup(event) {
  const target = event.target;
  if (!(target instanceof HTMLTextAreaElement) || target.dataset.refInput !== "glossary") {
    return;
  }

  if (event.ctrlKey || event.metaKey || event.altKey) {
    return;
  }

  scheduleReferenceSuggestions(target);
}

function handleSubmit(event) {
  const form = event.target;
  if (!(form instanceof HTMLFormElement)) {
    return;
  }

  event.preventDefault();

  const formData = new FormData(form);

  if (form.dataset.form === "character-overview") {
    updateDraftFromForm(form);
    return;
  }

  if (form.dataset.form === "character-tab") {
    updateDraftFromForm(form);
    return;
  }

  if (form.dataset.form === "chronicle") {
    clearChronicleDraft(readString(formData, "id"));
    saveChronicle(formData);
    return;
  }

  if (form.dataset.form === "glossary") {
    clearGlossaryDraft(readString(formData, "id"));
    saveGlossary(formData);
    return;
  }

  if (form.dataset.form === "player-note") {
    savePlayerNote(formData);
  }
}

function render() {
  updateSidebar();
  updateSaveNotice();
  renderCharactersModule();
  renderChroniclesModule();
  renderGlossaryModule();
  applyReferenceThemes();
}

function updateSidebar() {
  document.querySelectorAll("[data-module-link]").forEach((button) => {
    const module = button.dataset.moduleLink || "";
    const isActive = module === state.ui.currentModule;
    button.classList.toggle("active", isActive);
    button.dataset.draftPending = hasModuleDrafts(module) ? "true" : "false";
    button.setAttribute("aria-selected", isActive ? "true" : "false");
    button.setAttribute("tabindex", isActive ? "0" : "-1");
  });

  document.querySelectorAll(".module-view").forEach((view) => {
    const isActive = view.id === `${state.ui.currentModule}Module`;
    view.classList.toggle("active", isActive);
    view.hidden = !isActive;
  });

  if (!sidebarContextPanel) {
    return;
  }

  if (state.ui.currentModule === "chronicles") {
    sidebarContextPanel.hidden = false;
    sidebarContextPanel.innerHTML = renderChronicleSidebarView(state, getSelectedChronicle());
    return;
  }

  sidebarContextPanel.hidden = true;
  sidebarContextPanel.innerHTML = "";
}

function updateSaveNotice() {
  if (!saveNoticeEl) {
    return;
  }

  saveNoticeEl.textContent = state.ui.saveNotice || "";
  saveNoticeEl.classList.toggle("visible", Boolean(state.ui.saveNotice));
}

function renderCharactersModule() {
  renderCharactersView({
    state,
    rootEl: charactersModule,
    getSelectedCharacter,
    renderPlayerNotesPanel,
    renderPlayerNotesFab,
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
  const entries = getFilteredGlossaryEntries();
  syncGlossarySelection(entries);

  renderGlossaryView({
    state,
    rootEl: glossaryModule,
    getFilteredGlossaryEntries: () => entries,
    findGlossaryEntry,
    findCharacter,
    renderPlayerNotesPanel,
    shouldShowGlossaryReturnFab,
    getViewStateLabel,
  });
}

function restoreGlossarySearchFocus(selectionStart, selectionEnd) {
  const applyFocus = () => {
    const searchInput = document.querySelector('input[name="glossarySearch"]');
    if (!(searchInput instanceof HTMLInputElement)) {
      return;
    }

    searchInput.focus({ preventScroll: true });
    if (selectionStart === null || selectionEnd === null) {
      return;
    }

    searchInput.setSelectionRange(
      Math.min(selectionStart, searchInput.value.length),
      Math.min(selectionEnd, searchInput.value.length),
    );
  };

  applyFocus();
  requestAnimationFrame(applyFocus);
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

function renderPlayerNotesFab(options = {}) {
  const context = getCurrentPlayerNoteContext();
  if (!context) {
    return "";
  }

  const className = options.inline ? "notes-fab notes-fab-inline" : "notes-fab";

  return `
    <button
      type="button"
      class="${className}"
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

function saveCharacterEdits() {
  const character = getSelectedCharacter();
  if (!character) {
    return;
  }

  applyCharacterOverviewDraft(character);
  applyCharacterTabDrafts(character);
  clearCharacterDrafts(character.id);
  state.ui.editModes.characters = false;
  showSaveNotice("Personatge desat");
}

function applyCharacterOverviewDraft(character) {
  const draft = state.ui.drafts.characters.overview[character.id] || {};
  const formData = new FormData();
  formData.set("id", character.id);
  formData.set("name", draft.name !== undefined ? String(draft.name) : character.name || "");
  formData.set("title", draft.title !== undefined ? String(draft.title) : character.title || "");
  formData.set("lineage", draft.lineage !== undefined ? String(draft.lineage) : character.lineage || "");
  formData.set("className", draft.className !== undefined ? String(draft.className) : character.className || "");
  formData.set("level", draft.level !== undefined ? String(draft.level) : String(character.level || 1));
  formData.set("sigil", draft.sigil !== undefined ? String(draft.sigil) : character.sigil || "");
  formData.set("summary", draft.summary !== undefined ? String(draft.summary) : character.summary || "");
  formData.set("quickNotes", draft.quickNotes !== undefined ? String(draft.quickNotes) : character.quickNotes || "");

  saveCharacterOverviewEntry(formData, {
    getSelectedCharacter: () => character,
    showSaveNotice: () => {},
  });
}

function applyCharacterTabDrafts(character) {
  const tabDrafts = state.ui.drafts.characters.tabs[character.id] || {};

  ["lore", "sheet", "inventory", "history"].forEach((tab) => {
    const draft = tabDrafts[tab] || {};
    const formData = new FormData();
    formData.set("id", character.id);
    formData.set("tab", tab);

    if (tab === "lore") {
      formData.set("origin", draft.origin !== undefined ? String(draft.origin) : character.lore.origin || "");
      formData.set("bonds", draft.bonds !== undefined ? String(draft.bonds) : character.lore.bonds || "");
      formData.set("secrets", draft.secrets !== undefined ? String(draft.secrets) : character.lore.secrets || "");
      formData.set("goals", draft.goals !== undefined ? String(draft.goals) : character.lore.goals || "");
      formData.set("wounds", draft.wounds !== undefined ? String(draft.wounds) : character.lore.wounds || "");
    }

    if (tab === "sheet") {
      formData.set("ac", draft.ac !== undefined ? String(draft.ac) : character.sheet.ac || "");
      formData.set("hp", draft.hp !== undefined ? String(draft.hp) : character.sheet.hp || "");
      formData.set("proficiency", draft.proficiency !== undefined ? String(draft.proficiency) : character.sheet.proficiency || "");
      formData.set("abilities", draft.abilities !== undefined ? String(draft.abilities) : character.sheet.abilities || "");
      formData.set("features", draft.features !== undefined ? String(draft.features) : character.sheet.features || "");
    }

    if (tab === "inventory") {
      formData.set("items", draft.items !== undefined ? String(draft.items) : character.inventory.items || "");
      formData.set("currency", draft.currency !== undefined ? String(draft.currency) : character.inventory.currency || "");
      formData.set("artifacts", draft.artifacts !== undefined ? String(draft.artifacts) : character.inventory.artifacts || "");
      formData.set("notes", draft.notes !== undefined ? String(draft.notes) : character.inventory.notes || "");
    }

    if (tab === "history") {
      formData.set("history", draft.history !== undefined ? String(draft.history) : character.history || "");
    }

    saveCharacterTabEntry(formData, {
      getSelectedCharacter: () => character,
      showSaveNotice: () => {},
    });
  });
}

function saveChronicle(formData) {
  saveChronicleEntry(formData, {
    getSelectedChronicle,
    showSaveNotice: () => {},
  });
  if (state.ui.newChronicleId === state.ui.selectedChronicleId) {
    state.ui.newChronicleId = "";
  }
  state.ui.editModes.chronicles = false;
  showSaveNotice("Cronica desada");
}

function switchChronicleSelection(nextId, direction = "next") {
  if (!nextId || nextId === state.ui.selectedChronicleId) {
    return;
  }

  if (!resolveChronicleEditBeforeSwitch()) {
    return;
  }

  state.ui.selectedChronicleId = nextId;
  persistAndRender();
  animateBook(direction);
}

function resolveChronicleEditBeforeSwitch() {
  if (!state.ui.editModes.chronicles) {
    return true;
  }

  const currentId = state.ui.selectedChronicleId;
  const hasPendingDraft = Boolean(Object.keys(state.ui.drafts.chronicles[currentId] || {}).length);

  if (hasPendingDraft) {
    const shouldSave = window.confirm(
      "Hi ha canvis pendents en aquesta cronica. Prem D'acord per desar-los i continuar o Cancel·la per descartar-los i continuar.",
    );

    if (shouldSave) {
      saveChronicleDraft(currentId);
    } else {
      discardChronicleChanges({ persist: false });
    }
  } else {
    state.ui.editModes.chronicles = false;
  }

  return true;
}

function saveChronicleDraft(chronicleId) {
  const chronicle = state.chronicles.find((item) => item.id === chronicleId);
  const draft = state.ui.drafts.chronicles[chronicleId];
  if (!chronicle || !draft) {
    state.ui.editModes.chronicles = false;
    return;
  }

  const formData = new FormData();
  formData.set("id", chronicle.id);
  formData.set("chapter", draft.chapter !== undefined ? String(draft.chapter) : chronicle.chapter || "");
  formData.set("title", draft.title !== undefined ? String(draft.title) : chronicle.title || "");
  formData.set("date", draft.date !== undefined ? String(draft.date) : chronicle.date || "");
  formData.set("summary", draft.summary !== undefined ? String(draft.summary) : chronicle.summary || "");
  formData.set("content", draft.content !== undefined ? String(draft.content) : chronicle.content || "");
  formData.set("highlights", draft.highlights !== undefined ? String(draft.highlights) : chronicle.highlights || "");
  formData.set("imageNote", draft.imageNote !== undefined ? String(draft.imageNote) : chronicle.imageNote || "");
  formData.set(
    "imageAssets",
    draft.imageAssets !== undefined
      ? (Array.isArray(draft.imageAssets) ? draft.imageAssets.join("\n") : String(draft.imageAssets))
      : (chronicle.imageAssets || []).join("\n"),
  );
  formData.set(
    "voiceNotes",
    draft.voiceNotes !== undefined
      ? (Array.isArray(draft.voiceNotes) ? draft.voiceNotes.join("\n") : String(draft.voiceNotes))
      : (chronicle.voiceNotes || []).join("\n"),
  );

  const selectedCharacterIds = Array.isArray(draft.characterIds)
    ? draft.characterIds
    : (chronicle.characterIds || []);
  selectedCharacterIds.forEach((characterId) => formData.append("characterIds", String(characterId)));

  clearChronicleDraft(chronicleId);
  saveChronicle(formData);
  state.ui.editModes.chronicles = false;
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

  if (!window.confirm("Vols esborrar aquesta nota de jugador?")) {
    return;
  }

  context.item.playerNotes = (context.item.playerNotes || []).filter((note) => note.id !== noteId);
  state.ui.notesPanelOpen = true;
  persistAndRender();
}

function saveGlossary(formData) {
  saveGlossaryEntry(formData, { findGlossaryEntry });
  state.ui.editModes.glossary = false;
  showSaveNotice("Entrada desada");
}

function persistAndRender() {
  persistStateImmediately();
  render();
}

function schedulePersistState(delay = 180) {
  window.clearTimeout(persistStateTimer);
  persistStateTimer = window.setTimeout(() => {
    persistStateTimer = null;
    storagePersistState(state);
  }, delay);
}

function flushPendingPersist() {
  if (persistStateTimer === null) {
    return;
  }

  window.clearTimeout(persistStateTimer);
  persistStateTimer = null;
  storagePersistState(state);
}

function persistStateImmediately() {
  flushPendingPersist();
  storagePersistState(state);
}

function scheduleGlossarySearchRender(selectionStart = null, selectionEnd = null, delay = 120) {
  window.clearTimeout(glossarySearchTimer);
  glossarySearchTimer = window.setTimeout(() => {
    glossarySearchTimer = null;
    renderGlossaryModule();
    restoreGlossarySearchFocus(selectionStart, selectionEnd);
    schedulePersistState();
  }, delay);
}

function scheduleChronicleIndexSearchRender(delay = 120) {
  window.clearTimeout(chronicleIndexSearchTimer);
  chronicleIndexSearchTimer = window.setTimeout(() => {
    chronicleIndexSearchTimer = null;
    render();
    schedulePersistState();
  }, delay);
}

function showSaveNotice(message) {
  state.ui.saveNotice = message;
  state.ui.lastSaved = {
    module: state.ui.currentModule,
    itemId: getCurrentItemId(),
    at: new Date().toISOString(),
    message,
  };
  window.clearTimeout(saveNoticeTimer);
  persistAndRender();
  saveNoticeTimer = window.setTimeout(() => {
    state.ui.saveNotice = "";
    persistAndRender();
  }, 1800);
}

function openImageLightbox(image) {
  const source = image.currentSrc || image.src;
  if (!source || !imageLightbox || !imageLightboxMedia) {
    return;
  }

  lastLightboxTrigger = image;
  imageLightboxMedia.src = source;
  imageLightboxMedia.alt = image.alt || "";
  imageLightbox.hidden = false;
  document.body.classList.add("lightbox-open");
  const closeButton = imageLightbox.querySelector(".image-lightbox-close");
  if (closeButton instanceof HTMLButtonElement) {
    closeButton.focus();
  }
}

function closeImageLightbox() {
  if (!imageLightbox || !imageLightboxMedia || imageLightbox.hidden) {
    return;
  }

  imageLightbox.hidden = true;
  imageLightboxMedia.removeAttribute("src");
  imageLightboxMedia.alt = "";
  document.body.classList.remove("lightbox-open");

  if (lastLightboxTrigger instanceof HTMLElement) {
    lastLightboxTrigger.focus?.();
  }
  lastLightboxTrigger = null;
}

function isImageLightboxOpen() {
  return Boolean(imageLightbox && !imageLightbox.hidden);
}

function createChronicle() {
  createChronicleEntry(state);
  state.ui.newChronicleId = state.ui.selectedChronicleId;
  state.ui.chronicleIndexSearch = "";
  clearChronicleDraft(state.ui.selectedChronicleId);
  state.ui.editModes.chronicles = true;
  persistAndRender();
}

function deleteChronicle() {
  if (!window.confirm("Vols esborrar aquesta crònica? Aquesta acció no es pot desfer.")) {
    return;
  }

  const deletedId = state.ui.selectedChronicleId;
  deleteChronicleEntry(state);
  clearChronicleDraft(deletedId);
  if (state.ui.newChronicleId === deletedId) {
    state.ui.newChronicleId = "";
  }
  persistAndRender();
}

function discardChronicleChanges(options = {}) {
  const chronicleId = state.ui.selectedChronicleId;
  const isUnsavedNewChronicle = chronicleId && state.ui.newChronicleId === chronicleId;
  const shouldPersist = options.persist !== false;

  clearChronicleDraft(chronicleId);
  state.ui.editModes.chronicles = false;

  if (isUnsavedNewChronicle) {
    deleteChronicleEntry(state);
    state.ui.newChronicleId = "";
  }

  if (shouldPersist) {
    persistAndRender();
  }
}

function createGlossaryEntry() {
  createGlossaryItem(state);
  clearGlossaryDraft(state.ui.selectedGlossaryId);
  state.ui.editModes.glossary = true;
  persistAndRender();
}

function deleteGlossaryEntry() {
  if (!window.confirm("Vols esborrar aquesta entrada del glossari? Aquesta acció no es pot desfer.")) {
    return;
  }

  const deletedId = state.ui.selectedGlossaryId;
  deleteGlossaryItem(state);
  clearGlossaryDraft(deletedId);
  persistAndRender();
}

function openGlossaryEditor(glossaryId) {
  if (!glossaryId || !findGlossaryEntry(glossaryId)) {
    return;
  }

  state.ui.selectedGlossaryId = glossaryId;
  state.ui.editModes.glossary = true;
  persistAndRender();
}

function deleteGlossaryEntryById(glossaryId) {
  if (!glossaryId || !findGlossaryEntry(glossaryId)) {
    return;
  }

  state.ui.selectedGlossaryId = glossaryId;
  deleteGlossaryEntry();
}

function toggleModuleEdit(module) {
  if (!module || !Object.prototype.hasOwnProperty.call(state.ui.editModes, module)) {
    return;
  }

  state.ui.editModes[module] = !state.ui.editModes[module];

  if (module === "characters" && state.ui.editModes.characters) {
    state.ui.showCharacterGrid = false;
  }

  persistAndRender();
}

function ensureUiStateShape() {
  state.ui.editModes = {
    characters: false,
    chronicles: false,
    glossary: false,
    ...(state.ui.editModes || {}),
  };

  state.ui.drafts = {
    characters: {
      overview: {},
      tabs: {},
      ...(state.ui.drafts?.characters || {}),
    },
    chronicles: {
      ...(state.ui.drafts?.chronicles || {}),
    },
    glossary: {
      ...(state.ui.drafts?.glossary || {}),
    },
  };

  state.ui.lastSaved = {
    module: "",
    itemId: "",
    at: "",
    message: "",
    ...(state.ui.lastSaved || {}),
  };

  state.ui.glossaryCategory = typeof state.ui.glossaryCategory === "string" ? state.ui.glossaryCategory : "Totes";
  const validChronicleIds = new Set(state.chronicles.map((chronicle) => chronicle.id));
  state.ui.glossaryChronicleIds = Array.isArray(state.ui.glossaryChronicleIds)
    ? state.ui.glossaryChronicleIds.map(String).filter((id) => validChronicleIds.has(id))
    : [];
  state.ui.glossarySearch = typeof state.ui.glossarySearch === "string" ? state.ui.glossarySearch : "";
  state.ui.newChronicleId = typeof state.ui.newChronicleId === "string" ? state.ui.newChronicleId : "";
  state.ui.chronicleIndexSearch = typeof state.ui.chronicleIndexSearch === "string" ? state.ui.chronicleIndexSearch : "";
}

function updateDraftFromForm(form) {
  const draft = serializeFormDraft(form);

  if (form.dataset.form === "character-overview") {
    const characterId = String(draft.id || "");
    if (characterId) {
      state.ui.drafts.characters.overview[characterId] = draft;
    }
  }

  if (form.dataset.form === "character-tab") {
    const characterId = String(draft.id || "");
    const tab = String(draft.tab || "");
    if (characterId && tab) {
      state.ui.drafts.characters.tabs[characterId] = state.ui.drafts.characters.tabs[characterId] || {};
      state.ui.drafts.characters.tabs[characterId][tab] = draft;
    }
  }

  if (form.dataset.form === "chronicle") {
    const chronicleId = String(draft.id || "");
    if (chronicleId) {
      state.ui.drafts.chronicles[chronicleId] = draft;
    }
  }

  if (form.dataset.form === "glossary") {
    const glossaryId = String(draft.id || "");
    if (glossaryId) {
      state.ui.drafts.glossary[glossaryId] = draft;
    }
  }

  schedulePersistState();
}

function serializeFormDraft(form) {
  const draft = {};
  const checkboxGroups = new Map();

  Array.from(form.elements).forEach((element) => {
    if (
      !(element instanceof HTMLInputElement)
      && !(element instanceof HTMLTextAreaElement)
      && !(element instanceof HTMLSelectElement)
    ) {
      return;
    }

    if (!element.name || element.disabled) {
      return;
    }

    if (element instanceof HTMLInputElement && ["submit", "button", "file"].includes(element.type)) {
      return;
    }

    if (element instanceof HTMLInputElement && element.type === "checkbox") {
      const values = checkboxGroups.get(element.name) || [];
      if (element.checked) {
        values.push(element.value);
      }
      checkboxGroups.set(element.name, values);
      return;
    }

    if (element instanceof HTMLInputElement && element.type === "radio") {
      if (element.checked) {
        draft[element.name] = element.value;
      }
      return;
    }

    draft[element.name] = element.value;
  });

  checkboxGroups.forEach((values, name) => {
    draft[name] = values;
  });

  return draft;
}

function clearCharacterOverviewDraft(characterId) {
  if (characterId) {
    delete state.ui.drafts.characters.overview[characterId];
  }
}

function clearCharacterDrafts(characterId) {
  if (!characterId) {
    return;
  }

  clearCharacterOverviewDraft(characterId);
  delete state.ui.drafts.characters.tabs[characterId];
}

function clearCharacterTabDraft(characterId, tab) {
  if (!characterId || !tab) {
    return;
  }

  const tabDrafts = state.ui.drafts.characters.tabs[characterId];
  if (!tabDrafts) {
    return;
  }

  delete tabDrafts[tab];
  if (!Object.keys(tabDrafts).length) {
    delete state.ui.drafts.characters.tabs[characterId];
  }
}

function clearChronicleDraft(chronicleId) {
  if (chronicleId) {
    delete state.ui.drafts.chronicles[chronicleId];
  }
}

function clearGlossaryDraft(glossaryId) {
  if (glossaryId) {
    delete state.ui.drafts.glossary[glossaryId];
  }
}

function updateGlossaryDraftImageAssets(glossaryId, updater) {
  const entry = findGlossaryEntry(glossaryId);
  if (!entry || typeof updater !== "function") {
    return;
  }

  const draft = state.ui.drafts.glossary[glossaryId] || {};
  const currentImages = normalizeGlossaryDraftImageAssets(draft.imageAssets, entry.imageAssets || []);
  const nextImages = updater([...currentImages]).map((image) => String(image || "").trim()).filter(Boolean);

  state.ui.drafts.glossary[glossaryId] = {
    ...draft,
    imageAssets: nextImages.join("\n"),
  };

  schedulePersistState();
  renderGlossaryModule();
}

async function handleGlossaryImageSelection(input) {
  const form = input.closest('form[data-form="glossary"]');
  const glossaryId = form?.querySelector('input[name="id"]')?.value || input.dataset.glossaryId || "";
  const files = Array.from(input.files || []).filter((file) => file instanceof File);

  if (!glossaryId || !files.length) {
    input.value = "";
    return;
  }

  const imageDataUrls = (await Promise.all(files.map(readFileAsDataUrl))).filter(Boolean);
  if (imageDataUrls.length) {
    updateGlossaryDraftImageAssets(glossaryId, (images) => [...images, ...imageDataUrls]);
  }

  input.value = "";
}

function openRichMediaPicker(insertContext) {
  if (!richMediaPicker) {
    return;
  }

  pendingRichMediaInsert = insertContext;
  richMediaPicker.click();
}

async function handleRichMediaSelection(input) {
  const file = Array.from(input.files || []).find((item) => item instanceof File) || null;
  const pendingInsert = pendingRichMediaInsert;

  pendingRichMediaInsert = null;
  input.value = "";

  if (!file || !pendingInsert?.textareaId) {
    return;
  }

  const textarea = document.querySelector(`#${pendingInsert.textareaId}`);
  if (!(textarea instanceof HTMLTextAreaElement)) {
    return;
  }

  const mediaSource = await readFileAsDataUrl(file);
  if (!mediaSource) {
    return;
  }

  insertMediaReference(
    textarea,
    resolveMediaKind(file, mediaSource),
    mediaSource,
    pendingInsert.referenceLabel || "",
    pendingInsert.referenceStart || "",
    pendingInsert.referenceEnd || "",
    file.name || "",
  );
}

function insertMediaReference(textarea, mediaKind, mediaSource, referenceLabel, referenceStart, referenceEnd, fileName) {
  const referenceContext = resolveReferenceInsertContext(
    textarea,
    referenceLabel,
    referenceStart,
    referenceEnd,
  );
  if (!referenceContext) {
    return;
  }

  const label = sanitizeMediaLabel(referenceContext.label || fileName || "Multimedia");
  const mediaToken = `{{media:${mediaKind}|${label}|${mediaSource}}}`;
  const prefix = referenceContext.start > 0 && textarea.value[referenceContext.start - 1] !== "\n" ? "\n" : "";
  const suffix = referenceContext.end < textarea.value.length && textarea.value[referenceContext.end] !== "\n" ? "\n" : "";
  const mediaReplacement = `${prefix}${mediaToken}${suffix}`;
  const nextValue = `${textarea.value.slice(0, referenceContext.start)}${mediaReplacement}${textarea.value.slice(referenceContext.end)}`;
  textarea.value = nextValue;
  const nextCursor = referenceContext.start + mediaReplacement.length;
  textarea.focus();
  textarea.selectionStart = nextCursor;
  textarea.selectionEnd = nextCursor;
  clearAllReferenceSuggestions();
  textarea.dispatchEvent(new Event("input", { bubbles: true }));
}

function resolveMediaKind(file, mediaSource) {
  const mimeType = String(file?.type || mediaSource.match(/^data:([^;]+)/)?.[1] || "").toLowerCase();
  if (mimeType.startsWith("image/")) {
    return "image";
  }
  if (mimeType.startsWith("audio/")) {
    return "audio";
  }
  if (mimeType.startsWith("video/")) {
    return "video";
  }
  return "file";
}

function sanitizeMediaLabel(value) {
  return String(value || "Multimedia")
    .replaceAll(/[|{}]/g, " ")
    .replaceAll(/\s+/g, " ")
    .trim() || "Multimedia";
}

function normalizeGlossaryDraftImageAssets(draftValue, fallback) {
  if (Array.isArray(draftValue)) {
    return draftValue.map((value) => String(value || "").trim()).filter(Boolean);
  }

  if (typeof draftValue === "string") {
    return draftValue
      .split(/\r?\n/)
      .map((value) => value.trim())
      .filter(Boolean);
  }

  return Array.isArray(fallback)
    ? fallback.map((value) => String(value || "").trim()).filter(Boolean)
    : [];
}

function readFileAsDataUrl(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(typeof reader.result === "string" ? reader.result : ""));
    reader.addEventListener("error", () => resolve(""));
    reader.readAsDataURL(file);
  });
}

function hasModuleDrafts(module) {
  if (module === "characters") {
    return Boolean(
      Object.keys(state.ui.drafts.characters.overview || {}).length
      || Object.keys(state.ui.drafts.characters.tabs || {}).length
    );
  }

  if (module === "chronicles") {
    return Boolean(Object.keys(state.ui.drafts.chronicles || {}).length);
  }

  if (module === "glossary") {
    return Boolean(Object.keys(state.ui.drafts.glossary || {}).length);
  }

  return false;
}

function getSelectedCharacter() {
  return findCharacter(state.ui.selectedCharacterId);
}

function getSelectedChronicle() {
  return state.chronicles.find((chronicle) => chronicle.id === state.ui.selectedChronicleId) || state.chronicles[0];
}

function getCurrentItemId() {
  if (state.ui.currentModule === "characters") {
    return state.ui.selectedCharacterId;
  }

  if (state.ui.currentModule === "chronicles") {
    return state.ui.selectedChronicleId;
  }

  if (state.ui.currentModule === "glossary") {
    return state.ui.selectedGlossaryId;
  }

  return "";
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
  if (state.ui.currentModule === "characters") {
    const character = getSelectedCharacter();
    if (!character || state.ui.showCharacterGrid) {
      return null;
    }

    return {
      item: character,
      title: character.name || "Personatge",
      contextLabel: `${character.lineage || "Companyia"} · ${character.className || "Fitxa activa"}`,
      buttonLabel: "Notes de jugadors",
      emptyMessage: "Encara no hi ha notes de jugadors per aquest personatge.",
    };
  }

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
  const search = normalizeGlossarySearchValue(state.ui.glossarySearch);
  return state.glossary.filter((entry) => {
    return doesGlossaryEntryMatchCurrentFilters(entry, search);
  });
}

function doesGlossaryEntryMatchCurrentFilters(entry, normalizedSearch = normalizeGlossarySearchValue(state.ui.glossarySearch)) {
  if (!entry) {
    return false;
  }

  const matchesCategory = state.ui.glossaryCategory === "Totes" || entry.category === state.ui.glossaryCategory;
  const activeChronicleIds = state.ui.glossaryChronicleIds || [];
  const matchesChronicle = !activeChronicleIds.length
    || activeChronicleIds.some((chronicleId) => (entry.chronicleIds || []).includes(chronicleId));
  const matchesSearch = !normalizedSearch
    || normalizeGlossarySearchValue(entry.name).includes(normalizedSearch)
    || normalizeGlossarySearchValue(entry.category).includes(normalizedSearch)
    || normalizeGlossarySearchValue(entry.description).includes(normalizedSearch)
    || (entry.tags || []).some((tag) => normalizeGlossarySearchValue(tag).includes(normalizedSearch));

  return matchesCategory && matchesChronicle && matchesSearch;
}

function normalizeGlossarySearchValue(value) {
  return String(value || "")
    .normalize("NFD")
    .replaceAll(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

function syncGlossarySelection(entries = getFilteredGlossaryEntries()) {
  if (!entries.length) {
    return;
  }

  const hasVisibleSelection = entries.some((entry) => entry.id === state.ui.selectedGlossaryId);
  if (!hasVisibleSelection) {
    state.ui.selectedGlossaryId = entries[0].id;
  }
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

function revealGlossaryEntry(glossaryId) {
  if (!glossaryId) {
    return;
  }

  requestAnimationFrame(() => {
    const escapedId = CSS.escape(glossaryId);
    const detail = document.querySelector(`[data-glossary-detail="${escapedId}"]`);
    const card = document.querySelector(`[data-glossary-id="${escapedId}"]`);
    const target = detail instanceof HTMLElement ? detail : card;

    if (!(target instanceof HTMLElement)) {
      return;
    }

    target.scrollIntoView({ block: "start", inline: "nearest" });
    if (typeof target.focus === "function") {
      target.focus({ preventScroll: true });
    }
  });
}

function renderReferenceSuggestions(textarea) {
  const targetId = textarea.dataset.suggestionTarget;
  const container = targetId ? document.querySelector(`#${targetId}`) : null;
  if (!(container instanceof HTMLElement)) {
    return;
  }

  const selectedReference = getSelectedReferenceContext(textarea);
  const referenceContext = getReferenceContext(textarea);
  if (!referenceContext || (referenceContext.token.length < 2 && !selectedReference)) {
    container.innerHTML = "";
    return;
  }

  const matches = referenceContext.token.length >= 2
    ? getReferenceMatches(referenceContext.token)
    : [];

  if (!matches.length && !selectedReference) {
    container.innerHTML = "";
    return;
  }

  const matchButtons = matches.map(
    (entry) => `
        <button
          type="button"
          class="suggestion-chip"
          data-insert-reference="${entry.id}"
          data-reference-theme="${getGlossaryCategoryTheme(entry.category)}"
          data-reference-label="${escapeAttribute(referenceContext.label)}"
          data-reference-start="${referenceContext.start}"
          data-reference-end="${referenceContext.end}"
          data-input-id="${escapeAttribute(textarea.id)}"
        >
          <span class="suggestion-chip-title">${escapeHtml(entry.name)}</span>
          <span class="suggestion-chip-meta">${escapeHtml(entry.category)}</span>
        </button>
      `,
  );

  if (selectedReference) {
    matchButtons.push(`
      <button
        type="button"
        class="suggestion-chip suggestion-chip-media"
        data-insert-media="true"
        data-reference-theme="all"
        data-reference-label="${escapeAttribute(referenceContext.label)}"
        data-reference-start="${referenceContext.start}"
        data-reference-end="${referenceContext.end}"
        data-input-id="${escapeAttribute(textarea.id)}"
      >
        <span class="suggestion-chip-title">
          <span class="suggestion-chip-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" focusable="false">
              <path d="M4.5 6.25A1.75 1.75 0 0 1 6.25 4.5h11.5A1.75 1.75 0 0 1 19.5 6.25v11.5a1.75 1.75 0 0 1-1.75 1.75H6.25A1.75 1.75 0 0 1 4.5 17.75Zm2.5 1.5a1.25 1.25 0 1 0 0 2.5a1.25 1.25 0 0 0 0-2.5Zm9.75 8.75l-3.2-4.2a.75.75 0 0 0-1.17-.02l-1.9 2.38l-1.02-1.18a.75.75 0 0 0-1.13.01L6.5 16.5Z" fill="currentColor"/>
              <path d="M16.75 5.25h2v2h-2Zm0 3h2v2h-2Z" fill="currentColor"/>
            </svg>
          </span>
          Multimedia
        </span>
        <span class="suggestion-chip-meta">Afegeix imatge, audio, video o fitxer</span>
      </button>
    `);
  }

  container.innerHTML = matchButtons.join("");
}

function scheduleReferenceSuggestions(textarea, delay = 90) {
  scheduleTextareaTask(textarea, referenceSuggestionTimers, renderReferenceSuggestions, delay);
}

function getReferenceMatches(token) {
  const normalizedToken = normalizeReferenceToken(token);
  return getReferenceEntries()
    .map((entry) => ({
      ...entry,
      score: getReferenceMatchScore(entry.name, normalizedToken),
    }))
    .filter((item) => item.score !== null)
    .sort(
      (left, right) =>
        left.score - right.score
        || getReferenceTargetPriority(left.targetType) - getReferenceTargetPriority(right.targetType)
        || left.name.localeCompare(right.name, "ca"),
    )
    .slice(0, 6)
    .map(({ score, ...entry }) => entry);
}

function getReferenceEntries() {
  return [
    ...state.characters.map((character) => ({
      id: character.id,
      name: character.name,
      category: "Personatge",
      targetType: "character",
    })),
    ...state.glossary.map((entry) => ({
      id: entry.id,
      name: entry.name,
      category: entry.category,
      targetType: "glossary",
    })),
  ];
}

function getReferenceTargetPriority(targetType) {
  return targetType === "character" ? 0 : 1;
}

function getReferenceMatchScore(name, token) {
  const normalizedName = normalizeReferenceToken(name);
  if (!normalizedName.includes(token)) {
    return null;
  }

  if (normalizedName.startsWith(token)) {
    return 0;
  }

  if (normalizedName.split(/\s+/).some((part) => part.startsWith(token))) {
    return 1;
  }

  return 2;
}

function normalizeReferenceToken(value) {
  return String(value || "")
    .normalize("NFD")
    .replaceAll(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

function getActiveToken(textarea) {
  const source = textarea.value;
  if (!source) {
    return null;
  }

  const cursor = textarea.selectionStart || 0;
  const index = resolveTokenIndex(source, cursor);
  if (index < 0) {
    return null;
  }

  let start = index;
  let end = index + 1;
  while (start > 0 && isReferenceTokenChar(source[start - 1])) {
    start -= 1;
  }
  while (end < source.length && isReferenceTokenChar(source[end])) {
    end += 1;
  }

  const token = source.slice(start, end).trim();
  return token ? { token, start, end } : null;
}

function getReferenceContext(textarea) {
  const selectedReference = getSelectedReferenceContext(textarea);
  if (selectedReference) {
    return selectedReference;
  }

  const activeToken = getActiveToken(textarea);
  return activeToken ? { ...activeToken, label: activeToken.token } : null;
}

function getSelectedReferenceContext(textarea) {
  const start = textarea.selectionStart ?? 0;
  const end = textarea.selectionEnd ?? 0;
  if (start === end) {
    return null;
  }

  const label = textarea.value.slice(start, end);
  const token = label.trim();
  if (!token || !/[\p{L}0-9]/u.test(token)) {
    return null;
  }

  return { token, label, start, end };
}

function resolveTokenIndex(source, cursor) {
  if (cursor < source.length && isReferenceTokenChar(source[cursor])) {
    return cursor;
  }

  if (cursor > 0 && isReferenceTokenChar(source[cursor - 1])) {
    return cursor - 1;
  }

  return -1;
}

function isReferenceTokenChar(character) {
  return /[\p{L}0-9'’-]/u.test(character || "");
}

function getCurrentToken(textarea) {
  return getActiveToken(textarea)?.token || "";
  const match = before.match(/([\p{L}0-9'’-]{2,})$/u);
}

function insertReference(textarea, referenceId, referenceLabel, referenceStart, referenceEnd) {
  const referenceContext = resolveReferenceInsertContext(
    textarea,
    referenceLabel,
    referenceStart,
    referenceEnd,
  );
  if (!referenceContext) {
    return;
  }

  const referenceReplacement = `[[${referenceId}|${referenceContext.label}]]`;
  const nextReferenceValue = `${textarea.value.slice(0, referenceContext.start)}${referenceReplacement}${textarea.value.slice(referenceContext.end)}`;
  textarea.value = nextReferenceValue;
  const nextReferenceCursor = referenceContext.start + referenceReplacement.length;
  textarea.focus();
  textarea.selectionStart = nextReferenceCursor;
  textarea.selectionEnd = nextReferenceCursor;
  clearAllReferenceSuggestions();
  textarea.dispatchEvent(new Event("input", { bubbles: true }));
}

function resolveReferenceInsertContext(textarea, referenceLabel, referenceStart, referenceEnd) {
  const start = Number.parseInt(String(referenceStart), 10);
  const end = Number.parseInt(String(referenceEnd), 10);
  if (Number.isInteger(start) && Number.isInteger(end) && start >= 0 && end >= start && end <= textarea.value.length) {
    const label = referenceLabel || textarea.value.slice(start, end);
    return label ? { label, start, end } : null;
  }

  return getReferenceContext(textarea);
}

function clearAllReferenceSuggestions() {
  document.querySelectorAll(".reference-suggestions").forEach((container) => {
    if (container instanceof HTMLElement) {
      container.innerHTML = "";
    }
  });
}

function updateRichPreview(textarea) {
  const previewId = textarea.dataset.richPreviewTarget;
  const preview = previewId ? document.querySelector(`#${previewId}`) : null;
  if (!(preview instanceof HTMLElement)) {
    return;
  }

  preview.innerHTML = renderRichText(textarea.value);
  applyReferenceThemes(preview);
}

function scheduleRichPreview(textarea, delay = 120) {
  scheduleTextareaTask(textarea, richPreviewTimers, updateRichPreview, delay);
}

function applyReferenceThemes(scope = document) {
  if (!scope || typeof scope.querySelectorAll !== "function") {
    return;
  }

  scope.querySelectorAll("[data-reference-jump]").forEach((referenceButton) => {
    if (!(referenceButton instanceof HTMLElement)) {
      return;
    }

    const referenceId = referenceButton.dataset.referenceJump || "";
    const referenceCategory = getReferenceCategory(referenceId);
    referenceButton.dataset.referenceTheme = getGlossaryCategoryTheme(referenceCategory);
  });
}

function getReferenceCategory(referenceId) {
  const glossaryEntry = referenceId ? findGlossaryEntry(referenceId) : null;
  if (glossaryEntry?.category) {
    return glossaryEntry.category;
  }

  const character = referenceId ? findCharacter(referenceId) : null;
  if (character) {
    return "Personatge";
  }

  return "";
}

function scheduleTextareaTask(textarea, timerStore, callback, delay) {
  const previousTimer = timerStore.get(textarea);
  if (previousTimer) {
    window.clearTimeout(previousTimer);
  }

  const nextTimer = window.setTimeout(() => {
    timerStore.delete(textarea);
    callback(textarea);
  }, delay);

  timerStore.set(textarea, nextTimer);
}

function applyRichFormatting(textarea, action) {
  if (action === "bold") {
    wrapSelection(textarea, "**", "**", "text en negreta");
    return;
  }

  if (action === "italic") {
    wrapSelection(textarea, "*", "*", "text en cursiva");
    return;
  }

  if (action === "heading") {
    prefixSelectedLines(textarea, "## ", "Subtítol");
    return;
  }

  if (action === "list") {
    prefixSelectedLines(textarea, "- ", "Element de llista");
    return;
  }

  if (action === "quote") {
    prefixSelectedLines(textarea, "> ", "Destacat o cita");
    return;
  }

  if (action === "divider") {
    insertAtCursor(textarea, "\n---\n");
  }
}

function wrapSelection(textarea, before, after, placeholder) {
  const start = textarea.selectionStart || 0;
  const end = textarea.selectionEnd || 0;
  const selection = textarea.value.slice(start, end) || placeholder;
  const nextValue = `${textarea.value.slice(0, start)}${before}${selection}${after}${textarea.value.slice(end)}`;
  textarea.value = nextValue;
  textarea.focus();

  const selectionStart = start + before.length;
  const selectionEnd = selectionStart + selection.length;
  textarea.selectionStart = selectionStart;
  textarea.selectionEnd = selectionEnd;
  textarea.dispatchEvent(new Event("input", { bubbles: true }));
}

function prefixSelectedLines(textarea, prefix, placeholder) {
  const start = textarea.selectionStart || 0;
  const end = textarea.selectionEnd || 0;
  const lineStart = textarea.value.lastIndexOf("\n", Math.max(0, start - 1)) + 1;
  const nextBreak = textarea.value.indexOf("\n", end);
  const lineEnd = nextBreak === -1 ? textarea.value.length : nextBreak;
  const selection = textarea.value.slice(lineStart, lineEnd);
  const lines = (selection || placeholder).split("\n");
  const prefixed = lines.map((line) => `${prefix}${line}`).join("\n");
  textarea.value = `${textarea.value.slice(0, lineStart)}${prefixed}${textarea.value.slice(lineEnd)}`;
  textarea.focus();
  textarea.selectionStart = lineStart;
  textarea.selectionEnd = lineStart + prefixed.length;
  textarea.dispatchEvent(new Event("input", { bubbles: true }));
}

function insertAtCursor(textarea, text) {
  const start = textarea.selectionStart || 0;
  const end = textarea.selectionEnd || 0;
  const nextValue = `${textarea.value.slice(0, start)}${text}${textarea.value.slice(end)}`;
  textarea.value = nextValue;
  const cursor = start + text.length;
  textarea.focus();
  textarea.selectionStart = cursor;
  textarea.selectionEnd = cursor;
  textarea.dispatchEvent(new Event("input", { bubbles: true }));
}
