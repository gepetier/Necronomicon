import {
  activateCampaign as storageActivateCampaign,
  createCampaign as storageCreateCampaign,
  createCloudCampaignPayload as storageCreateCloudCampaignPayload,
  getActiveCampaignMeta as storageGetActiveCampaignMeta,
  getCampaignCatalog as storageGetCampaignCatalog,
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
  renderModuleActionIcon,
  renderRichText,
  readString,
} from "./app/utils.js";
import {
  collectAssetTokensFromState,
  collectEmbeddedDataUrlsFromState,
  inferAssetKindFromMimeType,
  isAssetToken,
  replaceAssetSourcesInState,
} from "./app/assets.js";
import {
  clearAssetStore,
  exportAssetBundle,
  hydrateAssetReferences,
  importAssetBundle,
  storeAssetDataUrl,
  storeAssetFile,
} from "./app/asset-store.js";
import {
  createBackupPayload,
  readBackupAssetBundle,
  readBackupStatePayload,
} from "./app/backup.js";
import {
  canCreateChronicle as permissionsCanCreateChronicle,
  canCreateGlossaryEntry as permissionsCanCreateGlossaryEntry,
  canDeleteChronicle as permissionsCanDeleteChronicle,
  canDeleteGlossaryEntry as permissionsCanDeleteGlossaryEntry,
  canEditAnyCharacter as permissionsCanEditAnyCharacter,
  canEditCharacter as permissionsCanEditCharacter,
  canEditChronicle as permissionsCanEditChronicle,
  canEditGlossaryEntry as permissionsCanEditGlossaryEntry,
  canManageCampaigns as permissionsCanManageCampaigns,
  canManagePermissions as permissionsCanManagePermissions,
  canPublishCampaign as permissionsCanPublishCampaign,
  getUserAccessForCampaign as resolveCampaignUserAccess,
  normalizeAccessShape,
  normalizeRoleId,
  resolveCurrentUserAccess,
} from "./app/permissions.js";
import {
  clearStoredCredential,
  decodeCredential,
  getStoredCredential,
  isCredentialUsable,
  loadCampaignFromCloud,
  loadGoogleIdentity,
  promptGoogleSignIn,
  renderGoogleButton,
  saveCampaignToCloud,
  saveCharacterToCloud,
  saveChronicleToCloud,
  saveGlossaryEntryToCloud,
  storeCredential,
} from "./app/cloud-sync.js";

let state = loadStoredState();
let bookTurnTimer = null;
let saveNoticeTimer = null;
let persistStateTimer = null;
let glossarySearchTimer = null;
let chronicleIndexSearchTimer = null;
let cloudSaveTimer = null;

const referenceSuggestionTimers = new WeakMap();
const richPreviewTimers = new WeakMap();

const saveNoticeEl = document.querySelector("#saveNotice");
const charactersModule = document.querySelector("#charactersModule");
const chroniclesModule = document.querySelector("#chroniclesModule");
const glossaryModule = document.querySelector("#glossaryModule");
const optionsModule = document.querySelector("#optionsModule");
const sidebarContextPanel = document.querySelector("#sidebarContextPanel");
const sidebar = document.querySelector(".sidebar");
const sidebarToggle = document.querySelector("[data-sidebar-toggle]");
const sidebarCampaignSwitcher = document.querySelector("[data-sidebar-campaign-switcher]");
const imageLightbox = document.querySelector("#imageLightbox");
const imageLightboxMedia = document.querySelector("#imageLightboxMedia");
const richMediaPicker = document.querySelector("#richMediaPicker");
const backupImportPicker = document.querySelector("#backupImportPicker");
const authGate = document.querySelector("#authGate");
const googleSignInButton = document.querySelector("#googleSignInButton");
const authStatus = document.querySelector("[data-auth-status]");
const authCampaignSelect = document.querySelector("[data-auth-campaign-select]");

let lastLightboxTrigger = null;
let pendingRichMediaInsert = null;

const IMAGE_OPTIMIZATION_OPTIONS = {
  maxWidth: 1800,
  maxHeight: 1800,
  quality: 0.82,
  mimeType: "image/webp",
};

const runtimeParams = new URLSearchParams(window.location.search);
const authPreviewMode = runtimeParams.has("authPreview");
const qaMode = runtimeParams.has("qaRun") || runtimeParams.has("captureRun");
const AUTH_FEEDBACK = {
  booting: {
    action: "Carregant el client de login i preparant Google Identity.",
    text: "Encenent espelmes...",
  },
  waitingForSignIn: {
    action: "Esperant que l'usuari premi el segell per iniciar sessio.",
    text: "Toca l'abisme...",
  },
  openingSignIn: {
    action: "L'usuari ha premut el segell i s'obre el flux de login.",
    text: "Algú et mira desde l'abisme",
  },
  missingCredential: {
    action: "Google no ha retornat cap credencial despres del login.",
    text: "El poder no t'es atorgat",
  },
  invalidCredential: {
    action: "La credencial rebuda no es pot validar localment.",
    text: "No tens un pacte amb l'antic, encara...",
  },
  restoringSession: {
    action: "S'ha trobat una sessio recordada i s'esta recuperant.",
    text: "L'antic mira dins teu...",
  },
  loadingCampaign: {
    action: "Login acceptat; s'esta carregant la campanya remota.",
    text: "Extraient poder...",
  },
  firstPublish: {
    action: "El JSON remot era buit i es prepara la primera publicacio.",
    text: "Preparant la primera ofrena.",
  },
  campaignReady: {
    action: "La campanya ja esta carregada i es pot obrir la interfície.",
    text: "El llibre s'obre.",
  },
};
const cloudSession = {
  enabled: authPreviewMode || !qaMode,
  ready: qaMode && !authPreviewMode,
  idToken: "",
  user: null,
  status: authPreviewMode ? "" : qaMode ? "Mode QA local" : getAuthFeedbackText("booting"),
  saving: false,
  awaitingServer: false,
  selectingCampaign: false,
  lastSyncAt: "",
  lastError: "",
  pendingInitialPublish: false,
};

const RENDER_PARTS = {
  sidebar: "sidebar",
  notice: "notice",
  characters: "characters",
  chronicles: "chronicles",
  glossary: "glossary",
  options: "options",
  themes: "themes",
  assets: "assets",
};
const FULL_RENDER_PARTS = [
  RENDER_PARTS.sidebar,
  RENDER_PARTS.notice,
  RENDER_PARTS.characters,
  RENDER_PARTS.chronicles,
  RENDER_PARTS.glossary,
  RENDER_PARTS.options,
  RENDER_PARTS.themes,
  RENDER_PARTS.assets,
];

initialize();

function initialize() {
  ensureUiStateShape();
  applyCaptureUserOverride();

  document.addEventListener("click", handleClick);
  document.addEventListener("keydown", handleKeydown);
  document.addEventListener("keyup", handleKeyup);
  document.addEventListener("submit", handleSubmit);
  document.addEventListener("input", handleInput);
  document.addEventListener("change", handleInput);
  window.addEventListener("pagehide", flushPendingPersist);
  sidebarToggle?.addEventListener("pointerenter", openSidebarPreview);
  sidebarToggle?.addEventListener("focus", openSidebarPreview);
  sidebarToggle?.addEventListener("blur", closeSidebarPreviewAfterFocusLeaves);
  sidebar?.addEventListener("pointerleave", closeSidebarPreview);

  render();
  installQaHooks();
  void migrateEmbeddedAssets({ announce: false });
  void initializeCloudSession();
}

function applyCaptureUserOverride() {
  if (!qaMode || !runtimeParams.has("captureUserRole")) {
    return;
  }

  const role = normalizeRoleId(runtimeParams.get("captureUserRole") || "player");
  const email = String(runtimeParams.get("captureUserEmail") || `${role}@preview.local`).toLowerCase();
  const characterIds = role === "player" ? [state.characters[0]?.id].filter(Boolean) : [];
  state.access = normalizeAccessShape({
    ...(state.access || {}),
    users: {
      ...(state.access?.users || {}),
      [email]: {
        role,
        characterIds,
      },
    },
  });
  cloudSession.enabled = true;
  cloudSession.ready = true;
  cloudSession.awaitingServer = false;
  cloudSession.selectingCampaign = false;
  cloudSession.status = "Mode captura amb usuari simulat";
  cloudSession.user = {
    email,
    name: "Usuari captura",
    role,
    permissions: getAccessState().roles[role],
    characterIds,
  };
}

function handleClick(event) {
  if (event.target.closest("[data-close-image-lightbox]")) {
    closeImageLightbox();
    return;
  }

  const clickedImage = event.target instanceof HTMLImageElement
    ? event.target
    : event.target.closest("img");
  if (
    clickedImage instanceof HTMLImageElement
    && !clickedImage.closest("#imageLightbox")
    && !clickedImage.closest(".chronicle-atlas-card")
  ) {
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

  if (event.target.closest("[data-export-backup]")) {
    if (!canPublishCampaign()) {
      denyPermission("No tens permisos per exportar la campanya completa.");
      return;
    }
    void exportCampaignBackup();
    return;
  }

  if (event.target.closest("[data-import-backup]")) {
    if (!canManageCampaigns()) {
      denyPermission("No tens permisos per importar una campanya completa.");
      return;
    }
    backupImportPicker?.click();
    return;
  }

  if (event.target.closest("[data-cloud-publish]")) {
    if (!canPublishCampaign()) {
      denyPermission("No tens permisos per publicar tota la campanya.");
      return;
    }
    void pushStateToCloud({ target: { type: "campaign" } });
    return;
  }

  if (event.target.closest("[data-cloud-logout]")) {
    clearStoredCredential();
    cloudSession.ready = false;
    cloudSession.idToken = "";
    cloudSession.user = null;
    cloudSession.selectingCampaign = false;
    updateCloudStatus("Sessio tancada. Torna a iniciar sessio per sincronitzar.", { renderOptions: false });
    void initializeCloudSession();
    return;
  }

  const loginCampaignSelect = event.target.closest("[data-select-login-campaign]");
  if (loginCampaignSelect) {
    selectLoginCampaign(loginCampaignSelect.dataset.selectLoginCampaign || "");
    return;
  }

  const campaignSwitch = event.target.closest("[data-switch-campaign]");
  if (campaignSwitch) {
    switchCampaign(campaignSwitch.dataset.switchCampaign || "");
    return;
  }

  if (event.target.closest("[data-auth-logo-login]")) {
    if (authPreviewMode) {
      return;
    }
    updateAuthFeedback("openingSignIn", { renderOptions: false });
    promptGoogleSignIn();
    return;
  }

  if (event.target.closest("[data-sidebar-toggle]")) {
    state.ui.sidebarPinned = !state.ui.sidebarPinned;
    document.body.classList.remove("sidebar-preview");
    persistAndRender([RENDER_PARTS.sidebar]);
    return;
  }

  const moduleLink = event.target.closest("[data-module-link]");
  if (moduleLink) {
    state.ui.currentModule = moduleLink.dataset.moduleLink;
    if (state.ui.currentModule === "chronicles") {
      const hasPendingChronicleWork = hasModuleDrafts("chronicles") || state.ui.editModes.chronicles;
      state.ui.showChronicleLanding = !hasPendingChronicleWork;
    }
    clearChronicleReturn();
    persistAndRender();
    return;
  }

  const editToggle = event.target.closest("[data-toggle-edit]");
  if (editToggle) {
    toggleModuleEdit(editToggle.dataset.toggleEdit || "");
    return;
  }

  if (event.target.closest("[data-open-character-editor]")) {
    const editableCharacter = state.characters.find((character) => canEditCharacter(character));
    if (!editableCharacter) {
      denyPermission("No tens cap fitxa assignada per editar.");
      return;
    }
    if (!canEditCharacter(state.ui.selectedCharacterId)) {
      state.ui.selectedCharacterId = editableCharacter.id;
    }
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
    if (state.ui.glossaryReturnTargetId && state.ui.selectedCharacterId !== state.ui.glossaryReturnTargetId) {
      clearChronicleReturn();
    }
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
    const glossaryId = glossaryEditCard.dataset.editGlossaryCard || "";
    if (!canEditGlossaryEntry(glossaryId)) {
      denyPermission("No tens permisos per editar aquesta entrada del glossari.");
      return;
    }
    openGlossaryEditor(glossaryId);
    return;
  }

  const glossaryDeleteCard = event.target.closest("[data-delete-glossary-card]");
  if (glossaryDeleteCard) {
    const glossaryId = glossaryDeleteCard.dataset.deleteGlossaryCard || "";
    if (!canDeleteGlossaryEntry(findGlossaryEntry(glossaryId))) {
      denyPermission("No tens permisos per esborrar aquesta entrada del glossari.");
      return;
    }
    deleteGlossaryEntryById(glossaryId);
    return;
  }

  if (event.target.closest("[data-open-glossary-image-picker]")) {
    const glossaryId = event.target.closest('form[data-form="glossary"]')?.querySelector('input[name="id"]')?.value || state.ui.selectedGlossaryId;
    if (!canEditGlossaryEntry(glossaryId)) {
      denyPermission("No tens permisos per editar les imatges d'aquesta entrada.");
      return;
    }
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
    if (!canEditGlossaryEntry(glossaryId)) {
      denyPermission("No tens permisos per editar les imatges d'aquesta entrada.");
      return;
    }
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
      if (state.ui.currentModule === "chronicles") {
        state.ui.glossaryReturnView = captureCurrentViewState();
        state.ui.glossaryReturnTargetId = referenceId;
      } else {
        clearChronicleReturn();
      }
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
      clearChronicleReturn();
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
  if (event.target === backupImportPicker && event.target instanceof HTMLInputElement) {
    void importCampaignBackup(event.target);
    return;
  }

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

  if (event.target instanceof HTMLSelectElement && event.target.dataset.sidebarCampaignSwitch !== undefined) {
    switchAccessibleCampaign(event.target.value);
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
    if (!canEditChronicle(readString(formData, "id"))) {
      denyPermission("No tens permisos per desar aquesta cronica.");
      return;
    }
    clearChronicleDraft(readString(formData, "id"));
    saveChronicle(formData);
    return;
  }

  if (form.dataset.form === "glossary") {
    if (!canEditGlossaryEntry(readString(formData, "id"))) {
      denyPermission("No tens permisos per desar aquesta entrada del glossari.");
      return;
    }
    clearGlossaryDraft(readString(formData, "id"));
    saveGlossary(formData);
    return;
  }

  if (form.dataset.form === "player-note") {
    savePlayerNote(formData);
    return;
  }

  if (form.dataset.form === "permissions") {
    savePermissions(formData);
    return;
  }

  if (form.dataset.form === "campaign-create") {
    createCampaign(formData);
  }
}

function render(parts = FULL_RENDER_PARTS) {
  const renderSet = new Set(parts);
  updateAuthGate();

  if (renderSet.has(RENDER_PARTS.sidebar)) {
    updateSidebar();
  }
  if (renderSet.has(RENDER_PARTS.notice)) {
    updateSaveNotice();
  }
  if (renderSet.has(RENDER_PARTS.characters)) {
    renderCharactersModule();
  }
  if (renderSet.has(RENDER_PARTS.chronicles)) {
    renderChroniclesModule();
  }
  if (renderSet.has(RENDER_PARTS.glossary)) {
    renderGlossaryModule();
  }
  if (renderSet.has(RENDER_PARTS.options)) {
    renderOptionsModule();
  }
  if (renderSet.has(RENDER_PARTS.themes)) {
    applyReferenceThemes();
  }
  if (renderSet.has(RENDER_PARTS.assets)) {
    void hydrateAssetReferences(document);
  }
}

async function initializeCloudSession() {
  if (!cloudSession.enabled) {
    updateAuthGate();
    return;
  }

  if (qaMode && runtimeParams.has("captureUserRole")) {
    updateAuthGate();
    return;
  }

  if (authPreviewMode) {
    cloudSession.status = runtimeParams.get("authStatus") || "";
    cloudSession.awaitingServer = runtimeParams.has("authWaiting");
    cloudSession.selectingCampaign = runtimeParams.has("authCampaignSelect");
    if (cloudSession.selectingCampaign) {
      cloudSession.ready = true;
      cloudSession.user = {
        email: "dm@preview.local",
        name: "DM preview",
        role: "superadmin",
        permissions: getAccessState().roles.superadmin,
        characterIds: state.characters.map((character) => character.id),
      };
    }
    renderAuthPreviewButton();
    renderAuthCampaignSelection();
    updateAuthGate();
    return;
  }

  updateAuthFeedback("booting");
  try {
    await loadGoogleIdentity();
    renderGoogleButton(googleSignInButton, (response) => {
      void handleGoogleCredential(response?.credential || "");
    });

    const storedCredential = getStoredCredential();
    if (isCredentialUsable(storedCredential)) {
      await handleGoogleCredential(storedCredential, { silent: true });
      return;
    }

    clearStoredCredential();
    cloudSession.ready = false;
    updateAuthFeedback("waitingForSignIn");
    promptGoogleSignIn();
  } catch (error) {
    cloudSession.ready = false;
    updateCloudStatus(error instanceof Error ? error.message : String(error), { error: true });
  }
}

async function handleGoogleCredential(credential, options = {}) {
  if (!credential) {
    updateAuthFeedback("missingCredential", { error: true });
    return;
  }

  const decoded = decodeCredential(credential);
  if (!decoded?.email) {
    updateAuthFeedback("invalidCredential", { error: true });
    return;
  }

  cloudSession.idToken = credential;
  cloudSession.user = decoded;
  storeCredential(credential);
  updateAuthFeedback(options.silent ? "restoringSession" : "loadingCampaign");
  cloudSession.awaitingServer = true;
  updateAuthGate();

  try {
    const response = await loadCampaignFromCloud(credential);
    const localBeforeCloud = state;
    const localCatalogBeforeCloud = storageGetCampaignCatalog();
    const cloudHasCampaignCatalog = Array.isArray(response.campaign?.campaigns);
    const cloudState = storageMigrateStoredState({
      version: response.version || 0,
      state: response.campaign,
    });
    const shouldPreserveLocalCatalog =
      !cloudHasCampaignCatalog
      && localCatalogBeforeCloud.campaigns.length > 1
      && hasCampaignContent(localBeforeCloud);
    const shouldSeedCloud =
      (isCloudCampaignEmpty(response.campaign) || shouldPreserveLocalCatalog)
      && hasCampaignContent(localBeforeCloud);
    state = shouldSeedCloud
      ? {
        ...localBeforeCloud,
        access: cloudState.access,
      }
      : cloudState;
    cloudSession.user = {
      ...decoded,
      ...(response.user || {}),
    };
    cloudSession.ready = true;
    cloudSession.awaitingServer = false;
    cloudSession.selectingCampaign = true;
    cloudSession.pendingInitialPublish = shouldSeedCloud;
    cloudSession.lastSyncAt = new Date().toISOString();
    cloudSession.lastError = "";
    ensureUiStateShape();
    persistStateImmediately({ skipCloud: true });
    updateAuthFeedback(shouldSeedCloud ? "firstPublish" : "campaignReady");
    prepareCampaignSelectionAfterLogin();
    if (shouldSeedCloud && canPublishCampaign()) {
      await pushStateToCloud({ target: { type: "campaign" } });
      cloudSession.pendingInitialPublish = false;
    }
  } catch (error) {
    clearStoredCredential();
    cloudSession.idToken = "";
    cloudSession.user = null;
    cloudSession.ready = false;
    cloudSession.awaitingServer = false;
    cloudSession.selectingCampaign = false;
    updateCloudStatus(error instanceof Error ? error.message : String(error), { error: true });
  }
}

function isCloudCampaignEmpty(campaign) {
  if (Array.isArray(campaign?.campaigns)) {
    return !campaign.campaigns.some((item) => hasCampaignContent(item?.state));
  }

  return !(
    Array.isArray(campaign?.characters) && campaign.characters.length
    || Array.isArray(campaign?.chronicles) && campaign.chronicles.length
    || Array.isArray(campaign?.glossary) && campaign.glossary.length
  );
}

function hasCampaignContent(candidate) {
  if (Array.isArray(candidate?.campaigns)) {
    return candidate.campaigns.some((item) => hasCampaignContent(item?.state));
  }

  return Boolean(
    Array.isArray(candidate?.characters) && candidate.characters.length
    || Array.isArray(candidate?.chronicles) && candidate.chronicles.length
    || Array.isArray(candidate?.glossary) && candidate.glossary.length
  );
}

function prepareCampaignSelectionAfterLogin() {
  const accessibleCampaigns = getAccessibleCampaignsForCurrentUser();
  if (!accessibleCampaigns.length) {
    cloudSession.selectingCampaign = true;
    cloudSession.status = "No tens cap campanya activa assignada.";
    renderAuthCampaignSelection(accessibleCampaigns);
    updateAuthGate();
    return;
  }

  cloudSession.selectingCampaign = true;
  cloudSession.status = "Tria una campanya per obrir el compendi.";
  renderAuthCampaignSelection(accessibleCampaigns);
  updateAuthGate();
}

function selectLoginCampaign(campaignId) {
  const accessibleCampaigns = getAccessibleCampaignsForCurrentUser();
  const target = accessibleCampaigns.find((campaign) => campaign.id === campaignId);
  if (!target) {
    denyPermission("No tens acces a aquesta campanya.");
    return;
  }

  state = storageActivateCampaign(campaignId, state);
  ensureUiStateShape();
  syncCloudUserWithActiveCampaignAccess();
  cloudSession.selectingCampaign = false;
  cloudSession.ready = true;
  cloudSession.awaitingServer = false;
  cloudSession.status = `Campanya oberta: ${target.name}.`;
  openCharactersAfterLogin();
  persistStateImmediately({ skipCloud: true });
  renderAuthCampaignSelection([]);
  updateAuthGate();
  render();
}

function openCharactersAfterLogin() {
  state.ui.currentModule = "characters";
  state.ui.showCharacterGrid = true;
  state.ui.editModes = {
    ...(state.ui.editModes || {}),
    characters: false,
    chronicles: false,
    glossary: false,
  };
  clearChronicleReturn();
}

function updateAuthGate() {
  if (!authGate) {
    return;
  }

  const shouldShowAuthGate = cloudSession.enabled && (!cloudSession.ready || cloudSession.selectingCampaign);
  authGate.hidden = !shouldShowAuthGate;
  document.body.classList.toggle("auth-required", shouldShowAuthGate);
  document.body.classList.toggle("auth-selecting-campaign", cloudSession.selectingCampaign);
  document.body.classList.toggle(
    "auth-waiting-server",
    shouldShowAuthGate && cloudSession.awaitingServer,
  );
  if (authStatus) {
    authStatus.textContent = cloudSession.status || "";
    authStatus.classList.toggle("error", Boolean(cloudSession.lastError));
  }
}

function renderAuthCampaignSelection(campaigns = getAccessibleCampaignsForCurrentUser()) {
  if (!authCampaignSelect) {
    return;
  }

  if (!cloudSession.selectingCampaign) {
    authCampaignSelect.hidden = true;
    authCampaignSelect.innerHTML = "";
    return;
  }

  authCampaignSelect.hidden = false;
  const campaignRows = campaigns.length
    ? campaigns.map((campaign) => `
      <article class="auth-campaign-card ${campaign.isActive ? "active" : ""}">
        <div class="auth-campaign-card-copy">
          <p class="eyebrow">${campaign.isActive ? "Darrera oberta" : "Campanya activa"}</p>
          <h3>${escapeHtml(campaign.name)}</h3>
          <p>${escapeHtml(campaign.system || "Sistema no especificat")}</p>
          <div class="auth-campaign-badges">
            <span>${escapeHtml(formatRoleLabel(campaign.userAccess.role))}</span>
            <span>${campaign.counts.characters} personatges</span>
            <span>${campaign.counts.chronicles} croniques</span>
          </div>
        </div>
        <button type="button" data-select-login-campaign="${escapeAttribute(campaign.id)}">
          Obre
        </button>
      </article>
    `).join("")
    : `
      <div class="auth-campaign-empty">
        <p class="eyebrow">Sense campanyes</p>
        <h3>No hi ha cap campanya assignada</h3>
        <p>Demana al superadmin o GM que afegeixi el teu correu als permisos d'una campanya.</p>
      </div>
    `;

  authCampaignSelect.innerHTML = `
    <section class="auth-campaign-panel" aria-label="Selector de campanya">
      <div class="auth-campaign-head">
        <p class="eyebrow">Compendis actius</p>
        <h2>Tria campanya</h2>
        <p>${escapeHtml(cloudSession.user?.email || "Usuari connectat")}</p>
      </div>
      <div class="auth-campaign-list">
        ${campaignRows}
      </div>
      <button type="button" class="secondary auth-campaign-logout" data-cloud-logout>
        Tanca sessio
      </button>
    </section>
  `;
}

function getAccessibleCampaignsForCurrentUser() {
  const catalog = getCampaignCatalogForSelection();
  const email = String(cloudSession.user?.email || "").toLowerCase();
  const sessionRole = normalizeRoleId(cloudSession.user?.role || "");
  const sessionIsSuperadmin = sessionRole === "superadmin";

  return catalog.campaigns
    .map((campaign) => ({
      ...campaign,
      userAccess: getUserAccessForCampaign(campaign, email, sessionIsSuperadmin),
    }))
    .filter((campaign) => campaign.userAccess.hasAccess)
    .sort((left, right) => Number(right.isActive) - Number(left.isActive) || left.name.localeCompare(right.name, "ca"));
}

function getCampaignCatalogForSelection() {
  const catalog = storageGetCampaignCatalog();
  if (!authPreviewMode || !cloudSession.selectingCampaign || catalog.campaigns.length > 1) {
    return catalog;
  }

  return {
    ...catalog,
    campaigns: [
      ...catalog.campaigns,
      {
        id: "preview-savage-worlds",
        name: "Savage Worlds",
        system: "Savage Worlds",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: false,
        access: structuredClone(state.access),
        counts: {
          characters: 3,
          chronicles: 2,
          glossary: 12,
        },
      },
    ],
  };
}

function getUserAccessForCampaign(campaign, email, forceSuperadmin = false) {
  return resolveCampaignUserAccess({
    campaign,
    email,
    forceSuperadmin,
    cloudEnabled: cloudSession.enabled,
  });
}

function syncCloudUserWithActiveCampaignAccess() {
  if (!cloudSession.user) {
    return;
  }

  const email = String(cloudSession.user.email || "").toLowerCase();
  const access = getUserAccessForCampaign(
    {
      access: state.access,
      isActive: true,
    },
    email,
    normalizeRoleId(cloudSession.user.role || "") === "superadmin",
  );
  cloudSession.user = {
    ...cloudSession.user,
    role: access.role,
    characterIds: access.characterIds,
    permissions: access.permissions,
  };
}

function formatRoleLabel(roleId) {
  if (roleId === "superadmin") {
    return "Superadmin";
  }
  if (roleId === "gm") {
    return "GM";
  }
  return "Jugador";
}

function renderAuthPreviewButton() {
  if (!googleSignInButton) {
    return;
  }

  googleSignInButton.innerHTML = "";
}

function getAuthFeedbackText(key) {
  if (["openingSignIn", "restoringSession", "loadingCampaign"].includes(key)) {
    return "Obrint el compendi...";
  }
  return AUTH_FEEDBACK[key]?.text || "";
}

function updateAuthFeedback(key, options = {}) {
  updateCloudStatus(getAuthFeedbackText(key), options);
}

function updateCloudStatus(message, options = {}) {
  cloudSession.status = message;
  cloudSession.lastError = options.error ? message : "";
  updateAuthGate();
  if (options.renderOptions !== false) {
    render([RENDER_PARTS.options]);
  }
}

function currentModuleRenderParts() {
  if (state.ui.currentModule === "characters") {
    return [RENDER_PARTS.notice, RENDER_PARTS.characters, RENDER_PARTS.themes, RENDER_PARTS.assets];
  }

  if (state.ui.currentModule === "chronicles") {
    return [RENDER_PARTS.notice, RENDER_PARTS.sidebar, RENDER_PARTS.chronicles, RENDER_PARTS.themes, RENDER_PARTS.assets];
  }

  if (state.ui.currentModule === "glossary") {
    return [RENDER_PARTS.notice, RENDER_PARTS.glossary, RENDER_PARTS.themes, RENDER_PARTS.assets];
  }

  if (state.ui.currentModule === "options") {
    return [RENDER_PARTS.notice, RENDER_PARTS.options, RENDER_PARTS.themes, RENDER_PARTS.assets];
  }

  return [RENDER_PARTS.notice, RENDER_PARTS.glossary, RENDER_PARTS.themes, RENDER_PARTS.assets];
}

function updateSidebar() {
  document.body.classList.toggle("sidebar-pinned", Boolean(state.ui.sidebarPinned));
  if (state.ui.sidebarPinned) {
    document.body.classList.remove("sidebar-preview");
  }
  document.querySelectorAll("[data-sidebar-toggle]").forEach((button) => {
    button.setAttribute("aria-expanded", state.ui.sidebarPinned ? "true" : "false");
    button.classList.toggle("active", Boolean(state.ui.sidebarPinned));
  });

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

  renderSidebarCampaignSwitcher();

  if (!sidebarContextPanel) {
    return;
  }

  if (state.ui.currentModule === "chronicles" && !state.ui.showChronicleLanding) {
    sidebarContextPanel.hidden = false;
    sidebarContextPanel.innerHTML = renderChronicleSidebarView(state, getSelectedChronicle(), {
      canEditChronicle,
      canCreateChronicle: canCreateChronicle(),
    });
    return;
  }

  sidebarContextPanel.hidden = true;
  sidebarContextPanel.innerHTML = "";
}

function renderSidebarCampaignSwitcher() {
  if (!sidebarCampaignSwitcher) {
    return;
  }

  const campaigns = getAccessibleCampaignsForCurrentUser();
  const activeCampaignId = storageGetActiveCampaignMeta().id;
  if (campaigns.length <= 1) {
    sidebarCampaignSwitcher.hidden = true;
    sidebarCampaignSwitcher.innerHTML = "";
    return;
  }

  sidebarCampaignSwitcher.hidden = false;
  const activeCampaign = campaigns.find((campaign) => campaign.id === activeCampaignId)
    || campaigns.find((campaign) => campaign.isActive)
    || campaigns[0];

  sidebarCampaignSwitcher.innerHTML = `
    <label class="sidebar-campaign-switcher">
      <span class="sidebar-campaign-label">Campanya activa</span>
      <select data-sidebar-campaign-switch aria-label="Canvia de campanya">
        ${campaigns.map((campaign) => `
          <option value="${escapeAttribute(campaign.id)}" ${campaign.id === activeCampaignId ? "selected" : ""}>
            ${escapeHtml(campaign.name)}
          </option>
        `).join("")}
      </select>
      <span class="sidebar-campaign-meta">
        ${escapeHtml(activeCampaign.system || "Sistema no especificat")} · ${escapeHtml(formatRoleLabel(activeCampaign.userAccess.role))}
      </span>
    </label>
  `;
}

function updateSaveNotice() {
  if (!saveNoticeEl) {
    return;
  }

  const message = state.ui.saveNotice || "";
  saveNoticeEl.innerHTML = message
    ? `
      ${renderSyncStatusIcon(getCloudSyncState(), getCloudSyncLabel())}
      <span>${escapeHtml(message)}</span>
    `
    : "";
  saveNoticeEl.classList.toggle("visible", Boolean(state.ui.saveNotice));
}

function getCloudSyncState() {
  if (cloudSession.saving || cloudSession.awaitingServer || cloudSession.pendingInitialPublish || cloudSaveTimer !== null) {
    return "syncing";
  }

  if (cloudSession.lastError || (cloudSession.enabled && (!cloudSession.ready || !cloudSession.idToken))) {
    return "unsynced";
  }

  return "synced";
}

function getCloudSyncLabel(syncState = getCloudSyncState()) {
  if (syncState === "syncing") {
    return "Sincronitzant";
  }

  if (syncState === "unsynced") {
    return "Desincronitzat";
  }

  return "Sincronitzat";
}

function renderSyncStatusIcon(syncState = getCloudSyncState(), label = getCloudSyncLabel(syncState)) {
  return `
    <span
      class="sync-status-icon sync-status-${escapeAttribute(syncState)}"
      role="img"
      aria-label="${escapeAttribute(label)}"
      title="${escapeAttribute(label)}"
    ></span>
  `;
}

function renderCharactersModule() {
  renderCharactersView({
    state,
    rootEl: charactersModule,
    getSelectedCharacter,
    getViewStateLabel,
    shouldShowCharacterReturnFab,
    renderPlayerNotesPanel,
    renderPlayerNotesFab,
    canEditCharacter,
    canEditAnyCharacter: canEditAnyCharacter(),
  });
}

function openSidebarPreview() {
  if (!state.ui.sidebarPinned) {
    document.body.classList.add("sidebar-preview");
  }
}

function closeSidebarPreview() {
  if (!state.ui.sidebarPinned) {
    document.body.classList.remove("sidebar-preview");
  }
}

function closeSidebarPreviewAfterFocusLeaves() {
  window.setTimeout(() => {
    if (!sidebar?.contains(document.activeElement)) {
      closeSidebarPreview();
    }
  }, 0);
}

function renderChroniclesModule() {
  renderChroniclesView({
    state,
    rootEl: chroniclesModule,
    getSelectedChronicle,
    renderPlayerNotesPanel,
    renderPlayerNotesFab,
    canEditChronicle,
    canCreateChronicle: canCreateChronicle(),
    canDeleteChronicle: canDeleteChronicle(),
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
    canEditGlossaryEntry,
    canCreateGlossaryEntry: canCreateGlossaryEntry(),
    canDeleteGlossaryEntry,
  });
}

function renderOptionsModule() {
  if (!optionsModule) {
    return;
  }

  const syncState = getCloudSyncState();
  const syncLabel = getCloudSyncLabel(syncState);
  const lastSavedLabel = formatShortDate(state.ui.lastSaved?.at) || "Encara no";
  const lastSyncLabel = formatShortDate(cloudSession.lastSyncAt) || "Encara no";
  const currentUserAccess = getCurrentUserAccess();
  const userLabel = currentUserAccess.email || "No connectat";
  const roleLabel = currentUserAccess.role || "local";
  const permissionsEditable = canManagePermissions();
  const campaignsEditable = canManageCampaigns();
  const publishEnabled = canPublishCampaign();
  const campaignMeta = storageGetActiveCampaignMeta();

  optionsModule.innerHTML = `
    <section class="module-surface options-shell">
      <div class="module-section-header">
        <div class="module-section-copy">
          <p class="eyebrow">Configuracio</p>
          <h3>Opcions de campanya</h3>
          <p>Campanyes disponibles, sincronitzacio de Drive, permisos i eines de manteniment del compendi.</p>
        </div>
      </div>

      <div class="options-grid">
        ${campaignsEditable
          ? renderCampaignManager(campaignMeta)
          : renderCampaignAccessSummary(campaignMeta, currentUserAccess)}

        <article class="section-card options-card">
          <div class="options-card-copy">
            <p class="eyebrow">Google Drive</p>
            <div class="options-sync-heading">
              ${renderSyncStatusIcon(syncState, syncLabel)}
              <h3>Sincronitzacio compartida</h3>
            </div>
            <p>${escapeHtml(cloudSession.status || "Preparat")} Drive sincronitza la campanya activa: ${escapeHtml(campaignMeta.name)}.</p>
          </div>
          <div class="options-stat-list">
            <span class="badge">${escapeHtml(userLabel)}</span>
            <span class="badge">Rol: ${escapeHtml(roleLabel)}</span>
            <span class="badge sync-state-badge">${escapeHtml(syncLabel)}</span>
            <span class="badge">Darrer sync: ${escapeHtml(lastSyncLabel)}</span>
            ${cloudSession.saving ? '<span class="badge">Desant...</span>' : ""}
            ${cloudSession.lastError ? `<span class="badge warning">Error: ${escapeHtml(cloudSession.lastError)}</span>` : ""}
          </div>
          <div class="options-actions">
            ${publishEnabled ? `
              <button type="button" class="secondary" data-cloud-publish>
                <span class="module-action-icon">${renderModuleActionIcon("upload")}</span>
                <span>Publica a Drive</span>
              </button>
            ` : ""}
            <button type="button" class="secondary" data-cloud-logout>
              <span>Tanca sessio</span>
            </button>
          </div>
        </article>

        ${publishEnabled || campaignsEditable ? `
          <article class="section-card options-card">
            <div class="options-card-copy">
              <p class="eyebrow">Copia local</p>
              <h3>JSON de campanya activa</h3>
              <p>Exporta o importa nomes la campanya oberta. El selector de campanyes queda preservat localment.</p>
            </div>
            <div class="options-actions">
              ${publishEnabled ? `
                <button type="button" class="secondary" data-export-backup>
                  <span class="module-action-icon">${renderModuleActionIcon("download")}</span>
                  <span>Exporta JSON</span>
                </button>
              ` : ""}
              ${campaignsEditable ? `
                <button type="button" class="secondary" data-import-backup>
                  <span class="module-action-icon">${renderModuleActionIcon("upload")}</span>
                  <span>Importa JSON</span>
                </button>
              ` : ""}
            </div>
          </article>
        ` : ""}

        <article class="section-card options-card options-status-card">
          <div>
            <p class="eyebrow">Estat</p>
            <h3>${escapeHtml(campaignMeta.name)}</h3>
          </div>
          <div class="options-stat-list">
            <span class="badge">Sistema: ${escapeHtml(campaignMeta.system)}</span>
            <span class="badge">${state.characters.length} personatges</span>
            <span class="badge">${state.chronicles.length} croniques</span>
            <span class="badge">${state.glossary.length} entrades</span>
            <span class="badge">Darrer canvi: ${escapeHtml(lastSavedLabel)}</span>
          </div>
        </article>

        <article class="section-card options-card options-permissions-card">
          <div class="options-card-copy">
            <p class="eyebrow">Permisos</p>
            <h3>${permissionsEditable ? "Rols i usuaris" : "El teu acces"}</h3>
            <p>${permissionsEditable
              ? "Defineix qui pot editar fitxes, croniques, glossari i permisos."
              : "Aquest resum mostra el teu rol dins la campanya oberta. Els permisos els gestiona un superadmin."}</p>
          </div>
          ${permissionsEditable ? renderPermissionsForm(true) : renderAccessSummary(currentUserAccess)}
        </article>
      </div>
    </section>
  `;
}

function renderCampaignManager(activeMeta) {
  const catalog = storageGetCampaignCatalog();
  const campaignRows = catalog.campaigns
    .map((campaign) => `
      <article class="campaign-switch-card ${campaign.isActive ? "active" : ""}">
        <div class="campaign-switch-copy">
          <p class="eyebrow">${campaign.isActive ? "Oberta" : "Disponible"}</p>
          <h4>${escapeHtml(campaign.name)}</h4>
          <p>${escapeHtml(campaign.system)}</p>
          <div class="options-stat-list">
            <span class="badge">${campaign.counts.characters} personatges</span>
            <span class="badge">${campaign.counts.chronicles} croniques</span>
            <span class="badge">${campaign.counts.glossary} glossari</span>
          </div>
        </div>
        <button
          type="button"
          class="secondary"
          data-switch-campaign="${escapeAttribute(campaign.id)}"
          ${campaign.isActive ? "disabled" : ""}
        >
          ${campaign.isActive ? "Activa" : "Obre"}
        </button>
      </article>
    `)
    .join("");

  return `
    <article class="section-card options-card campaign-manager-card">
      <div class="options-card-copy">
        <p class="eyebrow">Campanyes</p>
        <h3>Compendi multi-campanya</h3>
        <p>Campanya activa: ${escapeHtml(activeMeta.name)}. Cada campanya conserva personatges, croniques, glossari, notes i permisos propis.</p>
      </div>

      <div class="campaign-switch-list">
        ${campaignRows}
      </div>

      <form data-form="campaign-create" class="campaign-create-form">
        <label class="field">
          <span>Nom</span>
          <input name="campaignName" maxlength="80" placeholder="Ex. Deadlands: Santa Sang" required />
        </label>
        <label class="field">
          <span>Sistema</span>
          <input name="campaignSystem" maxlength="80" value="Savage Worlds" placeholder="Savage Worlds" />
        </label>
        <button type="submit" class="primary">Crea campanya</button>
      </form>
    </article>
  `;
}

function renderCampaignAccessSummary(activeMeta, currentUserAccess) {
  const accessibleCampaigns = getAccessibleCampaignsForCurrentUser();
  const alternativeCount = Math.max(0, accessibleCampaigns.length - 1);
  return `
    <article class="section-card options-card campaign-access-card">
      <div class="options-card-copy">
        <p class="eyebrow">Campanya</p>
        <h3>${escapeHtml(activeMeta.name)}</h3>
        <p>Estas treballant dins aquesta campanya. Si tens mes campanyes actives, pots canviar-les des del desplegable de la barra lateral.</p>
      </div>
      <div class="options-stat-list">
        <span class="badge">Sistema: ${escapeHtml(activeMeta.system)}</span>
        <span class="badge">Rol: ${escapeHtml(formatRoleLabel(currentUserAccess.role))}</span>
        <span class="badge">${accessibleCampaigns.length} campanyes accessibles</span>
        ${alternativeCount > 0 ? `<span class="badge">${alternativeCount} alternatives a la sidebar</span>` : ""}
      </div>
    </article>
  `;
}

function renderAccessSummary(currentUserAccess) {
  const permissions = currentUserAccess.permissions || {};
  const granted = [
    permissions.editAnyCharacter || permissions.editOwnCharacter ? "Fitxes assignades" : "",
    permissions.editChronicles ? "Totes les croniques" : permissions.editAssignedChronicles ? "Croniques assignades" : "",
    permissions.editGlossary ? "Tot el glossari" : permissions.editAssignedGlossary ? "Glossari assignat" : "",
    permissions.publishCampaign ? "Publicacio de campanya" : "",
  ].filter(Boolean);

  return `
    <div class="access-summary-panel">
      <div class="options-stat-list">
        <span class="badge">${escapeHtml(currentUserAccess.email || "Usuari local")}</span>
        <span class="badge">Rol: ${escapeHtml(formatRoleLabel(currentUserAccess.role))}</span>
        ${currentUserAccess.characterIds?.length
          ? `<span class="badge">${currentUserAccess.characterIds.length} fitxes assignades</span>`
          : ""}
      </div>
      <div class="access-summary-list">
        ${granted.length
          ? granted.map((label) => `<span>${escapeHtml(label)}</span>`).join("")
          : "<span>Lectura de la campanya</span>"}
      </div>
    </div>
  `;
}

function renderPermissionsForm(canManagePermissions) {
  const access = getAccessState();
  const roleRows = Object.entries(access.roles)
    .map(([roleId, permissions]) => `
      <fieldset class="permissions-role">
        <legend>${escapeHtml(roleId)}</legend>
        ${renderPermissionCheckbox(roleId, "editAnyCharacter", "Qualsevol fitxa", permissions.editAnyCharacter, canManagePermissions)}
        ${renderPermissionCheckbox(roleId, "editOwnCharacter", "Fitxa assignada", permissions.editOwnCharacter, canManagePermissions)}
        ${renderPermissionCheckbox(roleId, "editChronicles", "Totes les croniques", permissions.editChronicles, canManagePermissions)}
        ${renderPermissionCheckbox(roleId, "editAssignedChronicles", "Croniques assignades", permissions.editAssignedChronicles, canManagePermissions)}
        ${renderPermissionCheckbox(roleId, "editGlossary", "Tot el glossari", permissions.editGlossary, canManagePermissions)}
        ${renderPermissionCheckbox(roleId, "editAssignedGlossary", "Glossari assignat", permissions.editAssignedGlossary, canManagePermissions)}
        ${renderPermissionCheckbox(roleId, "managePermissions", "Permisos", permissions.managePermissions, canManagePermissions)}
        ${renderPermissionCheckbox(roleId, "manageCampaigns", "Campanyes", permissions.manageCampaigns, canManagePermissions)}
        ${renderPermissionCheckbox(roleId, "publishCampaign", "Publica campanya", permissions.publishCampaign, canManagePermissions)}
      </fieldset>
    `)
    .join("");
  const userEntries = Object.entries(access.users);
  const renderedUsers = [...userEntries, ["", { role: "player", characterIds: [] }]]
    .map(([email, user], index) => renderPermissionUserRow(email, user, index, access, canManagePermissions))
    .join("");

  return `
    <form data-form="permissions" class="permissions-form">
      <div class="permissions-roles">${roleRows}</div>
      <div class="permissions-users">
        <div class="permissions-users-head">
          <span>Correu</span>
          <span>Rol</span>
          <span>Personatges assignats</span>
        </div>
        ${renderedUsers}
      </div>
      <div class="options-actions">
        <button type="submit" class="primary" ${canManagePermissions ? "" : "disabled"}>Desa permisos</button>
      </div>
    </form>
  `;
}

function renderPermissionCheckbox(roleId, permissionId, label, checked, enabled) {
  return `
    <label class="check-row">
      <input
        type="checkbox"
        name="role:${escapeAttribute(roleId)}:${escapeAttribute(permissionId)}"
        ${checked ? "checked" : ""}
        ${enabled ? "" : "disabled"}
      />
      <span>${escapeHtml(label)}</span>
    </label>
  `;
}

function renderPermissionUserRow(email, user, index, access, enabled) {
  const roleOptions = Object.keys(access.roles)
    .map((roleId) => `
      <option value="${escapeAttribute(roleId)}" ${user.role === roleId ? "selected" : ""}>${escapeHtml(roleId)}</option>
    `)
    .join("");
  const characterValue = Array.isArray(user.characterIds) ? user.characterIds.join(", ") : "";

  return `
    <div class="permissions-user-row">
      <input name="userEmail" value="${escapeAttribute(email)}" placeholder="nom@gmail.com" ${enabled ? "" : "disabled"} />
      <select name="userRole" ${enabled ? "" : "disabled"}>${roleOptions}</select>
      <input
        name="userCharacterIds"
        value="${escapeAttribute(characterValue)}"
        placeholder="${escapeAttribute(state.characters.map((character) => character.id).join(", "))}"
        ${enabled ? "" : "disabled"}
      />
      <input type="hidden" name="userRow" value="${index}" />
    </div>
  `;
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
  if (!canEditCharacter(character)) {
    denyPermission("No tens permisos per desar aquesta fitxa.");
    return;
  }

  applyCharacterOverviewDraft(character);
  applyCharacterTabDrafts(character);
  clearCharacterDrafts(character.id);
  state.ui.editModes.characters = false;
  showSaveNotice("Personatge desat", { cloud: true });
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
  if (!canEditChronicle(readString(formData, "id"))) {
    denyPermission("No tens permisos per desar aquesta cronica.");
    return;
  }
  saveChronicleEntry(formData, {
    getSelectedChronicle,
    showSaveNotice: () => {},
  });
  if (state.ui.newChronicleId === state.ui.selectedChronicleId) {
    state.ui.newChronicleId = "";
  }
  state.ui.editModes.chronicles = false;
  showSaveNotice("Cronica desada", { cloud: true });
  void migrateEmbeddedAssets({ announce: false, renderParts: currentModuleRenderParts(), cloud: true });
}

function switchChronicleSelection(nextId, direction = "next") {
  if (!nextId) {
    return;
  }

  if (!resolveChronicleEditBeforeSwitch()) {
    return;
  }

  const isSameChronicle = nextId === state.ui.selectedChronicleId;
  state.ui.selectedChronicleId = nextId;
  state.ui.showChronicleLanding = false;
  persistAndRender();
  if (!isSameChronicle) {
    animateBook(direction);
  }
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
  if (!canEditChronicle(chronicle)) {
    denyPermission("No tens permisos per desar aquesta cronica.");
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
  formData.set(
    "editableByUserEmails",
    draft.editableByUserEmails !== undefined
      ? String(draft.editableByUserEmails)
      : (chronicle.editableByUserEmails || []).join("\n"),
  );
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
  showSaveNotice("Nota desada", { cloud: true });
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
  persistAndRender(FULL_RENDER_PARTS, { cloud: true });
}

function saveGlossary(formData) {
  if (!canEditGlossaryEntry(readString(formData, "id"))) {
    denyPermission("No tens permisos per desar aquesta entrada del glossari.");
    return;
  }
  saveGlossaryEntry(formData, { findGlossaryEntry });
  state.ui.editModes.glossary = false;
  showSaveNotice("Entrada desada", { cloud: true });
  void migrateEmbeddedAssets({ announce: false, renderParts: currentModuleRenderParts(), cloud: true });
}

function savePermissions(formData) {
  if (!canManagePermissions()) {
    window.alert("No tens permisos per modificar permisos.");
    return;
  }

  const currentAccess = getAccessState();
  const roles = Object.fromEntries(
    Object.keys(currentAccess.roles).map((roleId) => [
      roleId,
      {
        editAnyCharacter: formData.has(`role:${roleId}:editAnyCharacter`),
        editOwnCharacter: formData.has(`role:${roleId}:editOwnCharacter`),
        editChronicles: formData.has(`role:${roleId}:editChronicles`),
        editAssignedChronicles: formData.has(`role:${roleId}:editAssignedChronicles`),
        editGlossary: formData.has(`role:${roleId}:editGlossary`),
        editAssignedGlossary: formData.has(`role:${roleId}:editAssignedGlossary`),
        managePermissions: formData.has(`role:${roleId}:managePermissions`),
        manageCampaigns: formData.has(`role:${roleId}:manageCampaigns`),
        publishCampaign: formData.has(`role:${roleId}:publishCampaign`),
      },
    ]),
  );
  const emails = formData.getAll("userEmail").map((value) => String(value || "").trim().toLowerCase());
  const userRoles = formData.getAll("userRole").map((value) => normalizeRoleId(String(value || "player")));
  const userCharacterIds = formData.getAll("userCharacterIds").map((value) => String(value || ""));
  const users = {};

  emails.forEach((email, index) => {
    if (!email) {
      return;
    }
    users[email] = {
      role: roles[userRoles[index]] ? userRoles[index] : "player",
      characterIds: userCharacterIds[index]
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    };
  });

  state.access = { roles, users };
  showSaveNotice("Permisos desats", { cloud: true });
}

function switchCampaign(campaignId) {
  if (!canManageCampaigns()) {
    denyPermission("No tens permisos per canviar de campanya.");
    return;
  }
  if (!campaignId || campaignId === storageGetActiveCampaignMeta().id) {
    return;
  }

  if (!confirmSwitchingCampaign()) {
    return;
  }

  state = storageActivateCampaign(campaignId, state);
  ensureUiStateShape();
  syncCloudUserWithActiveCampaignAccess();
  clearChronicleReturn();
  closeSidebarPreview();
  persistStateImmediately({ cloud: true });
  render();
  showSaveNotice(`Campanya oberta: ${storageGetActiveCampaignMeta().name}`, { cloud: true });
}

function switchAccessibleCampaign(campaignId) {
  const activeCampaignId = storageGetActiveCampaignMeta().id;
  if (!campaignId || campaignId === activeCampaignId) {
    return;
  }

  const target = getAccessibleCampaignsForCurrentUser().find((campaign) => campaign.id === campaignId);
  if (!target) {
    denyPermission("No tens acces a aquesta campanya.");
    render([RENDER_PARTS.sidebar, RENDER_PARTS.notice]);
    return;
  }

  if (!confirmSwitchingCampaign()) {
    render([RENDER_PARTS.sidebar]);
    return;
  }

  state = storageActivateCampaign(campaignId, state);
  ensureUiStateShape();
  syncCloudUserWithActiveCampaignAccess();
  clearChronicleReturn();
  closeSidebarPreview();
  persistStateImmediately({ skipCloud: true });
  render();
  showSaveNotice(`Campanya oberta: ${target.name}`);
}

function createCampaign(formData) {
  if (!canManageCampaigns()) {
    denyPermission("No tens permisos per crear campanyes.");
    return;
  }
  const name = readString(formData, "campaignName");
  const system = readString(formData, "campaignSystem") || "Savage Worlds";

  if (!name) {
    return;
  }

  if (!confirmSwitchingCampaign()) {
    return;
  }

  state = storageCreateCampaign({ name, system }, state);
  ensureUiStateShape();
  syncCloudUserWithActiveCampaignAccess();
  clearChronicleReturn();
  closeSidebarPreview();
  persistStateImmediately({ cloud: true });
  render();
  showSaveNotice(`Campanya creada: ${storageGetActiveCampaignMeta().name}`, { cloud: true });
}

function confirmSwitchingCampaign() {
  const hasPendingWork = ["characters", "chronicles", "glossary"].some((module) => (
    hasModuleDrafts(module) || state.ui.editModes?.[module]
  ));
  if (!hasPendingWork) {
    return true;
  }

  return window.confirm(
    "Hi ha edicio o esborranys oberts. Canviar de campanya descartara aquests canvis no desats. Vols continuar?",
  );
}

function getAccessState() {
  const roles = state.access?.roles && typeof state.access.roles === "object" ? state.access.roles : {};
  const users = state.access?.users && typeof state.access.users === "object" ? state.access.users : {};
  return {
    roles: {
      superadmin: {
        editAnyCharacter: true,
        editOwnCharacter: true,
        editChronicles: true,
        editAssignedChronicles: true,
        editGlossary: true,
        editAssignedGlossary: true,
        managePermissions: true,
        manageCampaigns: true,
        publishCampaign: true,
        ...(roles.superadmin || {}),
      },
      gm: {
        editAnyCharacter: true,
        editOwnCharacter: true,
        editChronicles: true,
        editAssignedChronicles: true,
        editGlossary: true,
        editAssignedGlossary: true,
        managePermissions: false,
        manageCampaigns: false,
        publishCampaign: true,
        ...(roles.gm || roles.dm || {}),
      },
      player: {
        editAnyCharacter: false,
        editOwnCharacter: true,
        editChronicles: false,
        editAssignedChronicles: true,
        editGlossary: false,
        editAssignedGlossary: true,
        managePermissions: false,
        manageCampaigns: false,
        publishCampaign: false,
        ...(roles.player || roles.viewer || {}),
      },
      ...Object.fromEntries(
        Object.entries(roles).filter(([roleId]) => !["superadmin", "gm", "dm", "player", "viewer"].includes(roleId)),
      ),
    },
    users,
  };
}

function getCurrentUserAccess() {
  return resolveCurrentUserAccess({
    cloudEnabled: cloudSession.enabled,
    cloudUser: cloudSession.user,
    access: state.access,
    characters: state.characters,
  });
}

function getCurrentPermissions() {
  return getCurrentUserAccess().permissions || {};
}

function isSuperadmin() {
  return getCurrentUserAccess().role === "superadmin";
}

function canManagePermissions() {
  return permissionsCanManagePermissions(getCurrentUserAccess());
}

function canManageCampaigns() {
  return permissionsCanManageCampaigns(getCurrentUserAccess());
}

function canPublishCampaign() {
  return permissionsCanPublishCampaign(getCurrentUserAccess());
}

function canEditAnyCharacter() {
  return permissionsCanEditAnyCharacter(getCurrentUserAccess());
}

function canEditCharacter(characterOrId) {
  return permissionsCanEditCharacter(getCurrentUserAccess(), characterOrId);
}

function canCreateChronicle() {
  return permissionsCanCreateChronicle(getCurrentUserAccess());
}

function canDeleteChronicle(chronicle = getSelectedChronicle()) {
  return permissionsCanDeleteChronicle(getCurrentUserAccess(), chronicle);
}

function canEditChronicle(chronicleOrId) {
  const chronicle = typeof chronicleOrId === "string"
    ? state.chronicles.find((item) => item.id === chronicleOrId)
    : chronicleOrId;
  return permissionsCanEditChronicle(getCurrentUserAccess(), chronicle);
}

function canCreateGlossaryEntry() {
  return permissionsCanCreateGlossaryEntry(getCurrentUserAccess());
}

function canDeleteGlossaryEntry(entry = findGlossaryEntry(state.ui.selectedGlossaryId)) {
  return permissionsCanDeleteGlossaryEntry(getCurrentUserAccess(), entry);
}

function canEditGlossaryEntry(entryOrId) {
  const entry = typeof entryOrId === "string" ? findGlossaryEntry(entryOrId) : entryOrId;
  return permissionsCanEditGlossaryEntry(getCurrentUserAccess(), entry);
}

function denyPermission(message = "No tens permisos per fer aquesta accio.") {
  window.alert(message);
}

function persistAndRender(parts = FULL_RENDER_PARTS, options = {}) {
  persistStateImmediately({
    ...options,
    skipCloud: shouldSkipCloudSync(options),
  });
  render(parts);
}

function schedulePersistState(delay = 180, options = {}) {
  window.clearTimeout(persistStateTimer);
  persistStateTimer = window.setTimeout(() => {
    persistStateTimer = null;
    storagePersistState(state);
    if (!shouldSkipCloudSync(options)) {
      scheduleCloudSave();
    }
  }, delay);
}

function flushPendingPersist(options = {}) {
  if (persistStateTimer === null) {
    return;
  }

  window.clearTimeout(persistStateTimer);
  persistStateTimer = null;
  storagePersistState(state);
  if (!shouldSkipCloudSync(options)) {
    scheduleCloudSave();
  }
}

function persistStateImmediately(options = {}) {
  flushPendingPersist(options);
  storagePersistState(state);
  if (!shouldSkipCloudSync(options)) {
    scheduleCloudSave();
  }
}

function shouldSkipCloudSync(options = {}) {
  if (Object.prototype.hasOwnProperty.call(options, "skipCloud")) {
    return Boolean(options.skipCloud);
  }

  return options.cloud !== true;
}

function scheduleCloudSave(delay = 900) {
  if (!cloudSession.enabled || !cloudSession.ready || !cloudSession.idToken) {
    return;
  }

  window.clearTimeout(cloudSaveTimer);
  cloudSaveTimer = window.setTimeout(() => {
    cloudSaveTimer = null;
    void pushStateToCloud();
  }, delay);
}

async function pushStateToCloud(options = {}) {
  if (!cloudSession.enabled || !cloudSession.ready || !cloudSession.idToken) {
    return;
  }

  const target = options.target || inferCloudSaveTarget();
  if (!target) {
    return;
  }

  cloudSession.saving = true;
  cloudSession.status = "Desant canvis a Drive...";
  render([RENDER_PARTS.notice, RENDER_PARTS.options]);
  try {
    if (target.type === "campaign") {
      await saveCampaignToCloud(
        cloudSession.idToken,
        storageCreateCloudCampaignPayload(stripTransientUiState(state)),
      );
    } else if (target.type === "character") {
      await saveCharacterToCloud(cloudSession.idToken, target.character);
    } else if (target.type === "chronicle") {
      await saveChronicleToCloud(cloudSession.idToken, target.chronicle);
    } else if (target.type === "glossary") {
      await saveGlossaryEntryToCloud(cloudSession.idToken, target.entry);
    }
    cloudSession.lastSyncAt = new Date().toISOString();
    cloudSession.lastError = "";
    cloudSession.status = "Canvis enviats a Drive.";
  } catch (error) {
    cloudSession.lastError = error instanceof Error ? error.message : String(error);
    cloudSession.status = cloudSession.lastError;
  } finally {
    cloudSession.saving = false;
    render([RENDER_PARTS.notice, RENDER_PARTS.options]);
  }
}

function inferCloudSaveTarget() {
  const user = getCurrentUserAccess();
  const permissions = user.permissions || {};
  if (permissions.publishCampaign || permissions.managePermissions) {
    return { type: "campaign" };
  }

  const character = getSelectedCharacter();
  if (
    character
    && permissions.editOwnCharacter
    && Array.isArray(user.characterIds)
    && user.characterIds.includes(character.id)
  ) {
    return { type: "character", character };
  }

  const chronicle = getSelectedChronicle();
  if (chronicle && canEditChronicle(chronicle)) {
    return { type: "chronicle", chronicle };
  }

  const entry = findGlossaryEntry(state.ui.selectedGlossaryId);
  if (entry && canEditGlossaryEntry(entry)) {
    return { type: "glossary", entry };
  }

  return null;
}

function stripTransientUiState(nextState) {
  const clone = structuredClone(nextState);
  clone.ui = {
    ...(clone.ui || {}),
    saveNotice: "",
    editModes: {
      characters: false,
      chronicles: false,
      glossary: false,
    },
    drafts: {
      characters: { overview: {}, tabs: {} },
      chronicles: {},
      glossary: {},
    },
  };
  return clone;
}

function scheduleGlossarySearchRender(selectionStart = null, selectionEnd = null, delay = 120) {
  window.clearTimeout(glossarySearchTimer);
  glossarySearchTimer = window.setTimeout(() => {
    glossarySearchTimer = null;
    render([RENDER_PARTS.glossary, RENDER_PARTS.themes, RENDER_PARTS.assets]);
    restoreGlossarySearchFocus(selectionStart, selectionEnd);
    schedulePersistState();
  }, delay);
}

function scheduleChronicleIndexSearchRender(delay = 120) {
  window.clearTimeout(chronicleIndexSearchTimer);
  chronicleIndexSearchTimer = window.setTimeout(() => {
    chronicleIndexSearchTimer = null;
    render([RENDER_PARTS.sidebar, RENDER_PARTS.notice, RENDER_PARTS.chronicles, RENDER_PARTS.themes, RENDER_PARTS.assets]);
    schedulePersistState();
  }, delay);
}

function showSaveNotice(message, options = {}) {
  state.ui.saveNotice = message;
  state.ui.lastSaved = {
    module: state.ui.currentModule,
    itemId: getCurrentItemId(),
    at: new Date().toISOString(),
    message,
  };
  window.clearTimeout(saveNoticeTimer);
  persistAndRender(currentModuleRenderParts(), { cloud: options.cloud === true });
  saveNoticeTimer = window.setTimeout(() => {
    state.ui.saveNotice = "";
    render([RENDER_PARTS.notice]);
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
  if (!canCreateChronicle()) {
    denyPermission("No tens permisos per crear croniques.");
    return;
  }
  createChronicleEntry(state);
  state.ui.newChronicleId = state.ui.selectedChronicleId;
  state.ui.chronicleIndexSearch = "";
  state.ui.showChronicleLanding = false;
  clearChronicleDraft(state.ui.selectedChronicleId);
  state.ui.editModes.chronicles = true;
  persistAndRender(FULL_RENDER_PARTS, { cloud: true });
}

function deleteChronicle() {
  if (!canDeleteChronicle()) {
    denyPermission("No tens permisos per esborrar aquesta cronica.");
    return;
  }
  if (!window.confirm("Vols esborrar aquesta crònica? Aquesta acció no es pot desfer.")) {
    return;
  }

  const deletedId = state.ui.selectedChronicleId;
  deleteChronicleEntry(state);
  clearChronicleDraft(deletedId);
  if (state.ui.newChronicleId === deletedId) {
    state.ui.newChronicleId = "";
  }
  persistAndRender(FULL_RENDER_PARTS, { cloud: true });
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
    persistAndRender(FULL_RENDER_PARTS, { cloud: isUnsavedNewChronicle });
  }
}

function createGlossaryEntry() {
  if (!canCreateGlossaryEntry()) {
    denyPermission("No tens permisos per crear entrades del glossari.");
    return;
  }
  createGlossaryItem(state);
  clearGlossaryDraft(state.ui.selectedGlossaryId);
  state.ui.editModes.glossary = true;
  persistAndRender(FULL_RENDER_PARTS, { cloud: true });
}

function deleteGlossaryEntry() {
  if (!canDeleteGlossaryEntry()) {
    denyPermission("No tens permisos per esborrar aquesta entrada del glossari.");
    return;
  }
  if (!window.confirm("Vols esborrar aquesta entrada del glossari? Aquesta acció no es pot desfer.")) {
    return;
  }

  const deletedId = state.ui.selectedGlossaryId;
  deleteGlossaryItem(state);
  clearGlossaryDraft(deletedId);
  persistAndRender(FULL_RENDER_PARTS, { cloud: true });
}

function openGlossaryEditor(glossaryId) {
  if (!glossaryId || !findGlossaryEntry(glossaryId)) {
    return;
  }
  if (!canEditGlossaryEntry(glossaryId)) {
    denyPermission("No tens permisos per editar aquesta entrada del glossari.");
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
  const isOpeningEditMode = !state.ui.editModes[module];
  if (module === "characters" && isOpeningEditMode && !canEditCharacter(state.ui.selectedCharacterId)) {
    denyPermission("No tens permisos per editar aquesta fitxa.");
    return;
  }
  if (module === "chronicles" && isOpeningEditMode && !canEditChronicle(state.ui.selectedChronicleId)) {
    denyPermission("No tens permisos per editar aquesta cronica.");
    return;
  }
  if (module === "glossary" && isOpeningEditMode && !canEditGlossaryEntry(state.ui.selectedGlossaryId)) {
    denyPermission("No tens permisos per editar aquesta entrada del glossari.");
    return;
  }

  state.ui.editModes[module] = !state.ui.editModes[module];

  if (module === "characters" && state.ui.editModes.characters) {
    state.ui.showCharacterGrid = false;
  }

  if (module === "chronicles" && state.ui.editModes.chronicles) {
    state.ui.showChronicleLanding = false;
  }

  persistAndRender();
}

function ensureUiStateShape() {
  const validModules = new Set(["characters", "chronicles", "glossary", "options"]);
  state.ui.currentModule = validModules.has(state.ui.currentModule) ? state.ui.currentModule : "characters";
  state.ui.showChronicleLanding = typeof state.ui.showChronicleLanding === "boolean" ? state.ui.showChronicleLanding : true;
  state.ui.sidebarPinned = typeof state.ui.sidebarPinned === "boolean" ? state.ui.sidebarPinned : false;

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
    if (characterId && !canEditCharacter(characterId)) {
      return;
    }
    if (characterId) {
      state.ui.drafts.characters.overview[characterId] = draft;
    }
  }

  if (form.dataset.form === "character-tab") {
    const characterId = String(draft.id || "");
    const tab = String(draft.tab || "");
    if (characterId && !canEditCharacter(characterId)) {
      return;
    }
    if (characterId && tab) {
      state.ui.drafts.characters.tabs[characterId] = state.ui.drafts.characters.tabs[characterId] || {};
      state.ui.drafts.characters.tabs[characterId][tab] = draft;
    }
  }

  if (form.dataset.form === "chronicle") {
    const chronicleId = String(draft.id || "");
    if (chronicleId && !canEditChronicle(chronicleId)) {
      return;
    }
    if (chronicleId) {
      state.ui.drafts.chronicles[chronicleId] = draft;
    }
  }

  if (form.dataset.form === "glossary") {
    const glossaryId = String(draft.id || "");
    if (glossaryId && !canEditGlossaryEntry(glossaryId)) {
      return;
    }
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
  if (!canEditGlossaryEntry(entry)) {
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
  render([RENDER_PARTS.glossary, RENDER_PARTS.themes, RENDER_PARTS.assets]);
}

async function handleGlossaryImageSelection(input) {
  const form = input.closest('form[data-form="glossary"]');
  const glossaryId = form?.querySelector('input[name="id"]')?.value || input.dataset.glossaryId || "";
  const files = Array.from(input.files || []).filter((file) => file instanceof File);

  if (!glossaryId || !files.length) {
    input.value = "";
    return;
  }
  if (!canEditGlossaryEntry(glossaryId)) {
    denyPermission("No tens permisos per editar les imatges d'aquesta entrada.");
    input.value = "";
    return;
  }

  const assetTokens = (await Promise.all(files.map(async (file) => {
    const optimizedFile = await optimizeImageFile(file);
    return storeAssetFile(optimizedFile);
  }))).filter(Boolean);
  if (assetTokens.length) {
    updateGlossaryDraftImageAssets(glossaryId, (images) => [...images, ...assetTokens]);
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

  const assetToken = await storeAssetFile(file);
  const mediaSource = assetToken || await readFileAsDataUrl(file);
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
  const mimeType = String(
    file?.type
    || (isAssetToken(mediaSource) ? "" : mediaSource.match(/^data:([^;]+)/)?.[1])
    || "",
  ).toLowerCase();
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

async function optimizeImageFile(file, options = IMAGE_OPTIMIZATION_OPTIONS) {
  if (!shouldOptimizeImageFile(file)) {
    return file;
  }

  try {
    const image = await loadImageForOptimization(file);
    const size = getOptimizedImageSize(image.width, image.height, options);
    if (!size.width || !size.height) {
      releaseOptimizedImage(image);
      return file;
    }

    const canvas = document.createElement("canvas");
    canvas.width = size.width;
    canvas.height = size.height;
    const context = canvas.getContext("2d");
    if (!context) {
      releaseOptimizedImage(image);
      return file;
    }

    context.drawImage(image, 0, 0, size.width, size.height);
    releaseOptimizedImage(image);

    const optimizedBlob = await canvasToBlob(canvas, options.mimeType, options.quality);
    if (!optimizedBlob || optimizedBlob.size >= file.size) {
      return file;
    }

    return createOptimizedImageFile(file, optimizedBlob, options.mimeType);
  } catch (error) {
    console.warn("No s'ha pogut optimitzar la imatge seleccionada.", error);
    return file;
  }
}

function shouldOptimizeImageFile(file) {
  const mimeType = String(file?.type || "").toLowerCase();
  return file instanceof File
    && mimeType.startsWith("image/")
    && !["image/gif", "image/svg+xml"].includes(mimeType);
}

async function loadImageForOptimization(file) {
  if ("createImageBitmap" in window) {
    return createImageBitmap(file, { imageOrientation: "from-image" });
  }

  const source = await readFileAsDataUrl(file);
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image), { once: true });
    image.addEventListener("error", () => reject(new Error("La imatge no s'ha pogut carregar.")), { once: true });
    image.src = source;
  });
}

function releaseOptimizedImage(image) {
  if (typeof image?.close === "function") {
    image.close();
  }
}

function getOptimizedImageSize(width, height, options) {
  const maxWidth = Number(options.maxWidth) || width;
  const maxHeight = Number(options.maxHeight) || height;
  const scale = Math.min(1, maxWidth / width, maxHeight / height);
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

function canvasToBlob(canvas, mimeType, quality) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), mimeType, quality);
  });
}

function createOptimizedImageFile(originalFile, blob, mimeType) {
  const extension = getImageExtension(mimeType);
  const optimizedName = replaceFileExtension(originalFile.name || "imatge", extension);
  return new File([blob], optimizedName, {
    type: blob.type || mimeType,
    lastModified: Date.now(),
  });
}

function getImageExtension(mimeType) {
  if (mimeType === "image/jpeg") {
    return "jpg";
  }

  if (mimeType === "image/png") {
    return "png";
  }

  return "webp";
}

function replaceFileExtension(fileName, extension) {
  const cleanExtension = extension.replace(/^\./, "");
  return fileName.includes(".")
    ? fileName.replace(/\.[^.]+$/, `.${cleanExtension}`)
    : `${fileName}.${cleanExtension}`;
}

function readFileAsDataUrl(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(typeof reader.result === "string" ? reader.result : ""));
    reader.addEventListener("error", () => resolve(""));
    reader.readAsDataURL(file);
  });
}

async function migrateEmbeddedAssets(options = {}) {
  const dataUrls = collectEmbeddedDataUrlsFromState(state);
  if (!dataUrls.length) {
    return false;
  }

  const replacements = new Map();
  for (const dataUrl of dataUrls) {
    if (replacements.has(dataUrl)) {
      continue;
    }

    const mimeType = dataUrl.match(/^data:([^;]+)/)?.[1] || "";
    const token = await storeAssetDataUrl(dataUrl, {
      kind: inferAssetKindFromMimeType(mimeType),
      mimeType,
    });
    if (token) {
      replacements.set(dataUrl, token);
    }
  }

  if (!replacements.size) {
    return false;
  }

  const migrated = replaceAssetSourcesInState(state, (source) => replacements.get(source) || source);
  if (!migrated.changed) {
    return false;
  }

  state = migrated.state;
  ensureUiStateShape();
  persistStateImmediately({ cloud: options.cloud === true });
  render(options.renderParts || FULL_RENDER_PARTS);

  if (options.announce) {
    showSaveNotice(options.message || "Assets localitzats fora del desat principal", { cloud: options.cloud === true });
  }

  return true;
}

async function exportCampaignBackup() {
  const payload = await createCurrentBackupPayload();
  downloadTextFile(
    `necronomicon-backup-${new Date().toISOString().slice(0, 10)}.json`,
    `${JSON.stringify(payload, null, 2)}\n`,
    "application/json",
  );
  showSaveNotice("Backup exportat");
}

async function importCampaignBackup(input) {
  const file = Array.from(input.files || []).find((item) => item instanceof File) || null;
  input.value = "";

  if (!file) {
    return;
  }

  if (!window.confirm("Vols substituir la campanya actual per la copia importada?")) {
    return;
  }

  try {
    const rawPayload = JSON.parse(await file.text());
    await restoreBackupPayload(rawPayload);
  } catch {
    window.alert("No s'ha pogut importar el fitxer JSON seleccionat.");
  }
}

async function createCurrentBackupPayload() {
  await migrateEmbeddedAssets({ announce: false });
  const assetBundle = await exportAssetBundle(collectAssetTokensFromState(state));
  return createBackupPayload(state, assetBundle);
}

async function restoreBackupPayload(rawPayload) {
  const nextState = storageMigrateStoredState(readBackupStatePayload(rawPayload));

  await clearAssetStore();
  const assetBundle = readBackupAssetBundle(rawPayload);
  if (assetBundle.length) {
    await importAssetBundle(assetBundle);
  }

  state = nextState;
  ensureUiStateShape();
  await migrateEmbeddedAssets({ announce: false });
  persistStateImmediately({ cloud: true });
  render();
  showSaveNotice("Backup importat", { cloud: true });
}

function downloadTextFile(fileName, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 0);
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

function installQaHooks() {
  const params = new URLSearchParams(window.location.search);
  if (!params.has("qaRun")) {
    return;
  }

  window.__NECRONOMICON_QA__ = {
    exportBackupPayload: () => createCurrentBackupPayload(),
    importBackupPayload: (payload) => restoreBackupPayload(payload),
    storeAssetDataUrl: (dataUrl, options = {}) => storeAssetDataUrl(dataUrl, options),
    storeAssetTextFile: (content, options = {}) => storeAssetFile(
      new File(
        [content],
        options.name || "qa-asset.txt",
        { type: options.mimeType || "application/octet-stream" },
      ),
    ),
  };
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
    showChronicleLanding: state.ui.showChronicleLanding,
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
  state.ui.showChronicleLanding = typeof view.showChronicleLanding === "boolean" ? view.showChronicleLanding : state.ui.showChronicleLanding;
  state.ui.selectedGlossaryId = view.selectedGlossaryId || state.ui.selectedGlossaryId;
}

function clearChronicleReturn() {
  state.ui.glossaryReturnView = null;
  state.ui.glossaryReturnTargetId = "";
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

function shouldShowCharacterReturnFab(currentCharacterId) {
  return Boolean(
    state.ui.currentModule === "characters"
      && !state.ui.showCharacterGrid
      && state.ui.glossaryReturnView?.currentModule === "chronicles"
      && state.ui.glossaryReturnTargetId
      && currentCharacterId === state.ui.glossaryReturnTargetId,
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
    applyChronicleReferenceTooltip(referenceButton, referenceId);
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

function applyChronicleReferenceTooltip(referenceButton, referenceId) {
  referenceButton.querySelector(".glossary-reference-tooltip")?.remove();
  delete referenceButton.dataset.referenceTooltip;

  if (!referenceButton.closest("#chroniclesModule")) {
    return;
  }

  const entry = referenceId ? findGlossaryEntry(referenceId) : null;
  if (!entry) {
    return;
  }

  referenceButton.dataset.referenceTooltip = "glossary";
  referenceButton.append(createGlossaryReferenceTooltip(entry));
}

function createGlossaryReferenceTooltip(entry) {
  const tooltip = document.createElement("span");
  tooltip.className = "glossary-reference-tooltip";
  tooltip.setAttribute("aria-hidden", "true");

  const media = document.createElement("span");
  media.className = "glossary-reference-tooltip-media";
  const imageSource = (entry.imageAssets || []).find(Boolean) || "";
  if (imageSource) {
    const image = document.createElement("img");
    if (isAssetToken(imageSource)) {
      image.dataset.assetSrc = imageSource;
    } else {
      image.src = imageSource;
    }
    image.alt = "";
    image.loading = "lazy";
    media.append(image);
  } else {
    const placeholder = document.createElement("span");
    placeholder.className = "glossary-reference-tooltip-placeholder";
    placeholder.textContent = (entry.name || entry.category || "?").trim().slice(0, 1).toUpperCase() || "?";
    media.append(placeholder);
  }

  const copy = document.createElement("span");
  copy.className = "glossary-reference-tooltip-copy";
  copy.innerHTML = `
    <span class="glossary-reference-tooltip-kicker">${escapeHtml(entry.category || "Glossari")}</span>
    <strong>${escapeHtml(entry.name || "Entrada del glossari")}</strong>
    <span>${escapeHtml(getGlossaryTooltipDescription(entry))}</span>
  `;

  tooltip.append(media, copy);
  return tooltip;
}

function getGlossaryTooltipDescription(entry) {
  const text = getPlainReferenceText(entry.description || entry.latestStatus || entry.notes || "");
  if (!text) {
    return "Sense descripcio breu.";
  }

  const sentenceEnd = text.search(/[.!?](\s|$)/);
  const candidate = sentenceEnd >= 50 && sentenceEnd <= 170
    ? text.slice(0, sentenceEnd + 1)
    : text.slice(0, 170);

  return candidate.length < text.length ? `${candidate.trim().replace(/[,:;]+$/, "")}...` : candidate.trim();
}

function getPlainReferenceText(value) {
  return String(value || "")
    .replace(/\{\{media:(image|audio|video|file)\|([^|{}]+)\|([^{}]+)\}\}/g, "$2")
    .replace(/\[\[([a-zA-Z0-9-_]+)\|([^\]]+)\]\]/g, "$2")
    .replace(/^#{1,3}\s+/gm, "")
    .replace(/^>\s+/gm, "")
    .replace(/^[-*]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
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
