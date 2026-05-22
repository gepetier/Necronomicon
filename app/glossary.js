import {
  escapeAttribute,
  escapeHtml,
  getGlossaryCategoryTheme,
  paletteStyle,
  readString,
  renderChoiceGrid,
  renderEditorActions,
  renderEditorCard,
  renderEditorWorkspaceHeader,
  renderInputField,
  renderModuleActionIcon,
  renderRichText,
  renderRichTextareaField,
  renderTextCard,
} from "./utils.js";
import { isAssetToken } from "./assets.js";

export function renderGlossaryModule({
  state,
  rootEl,
  getFilteredGlossaryEntries,
  findGlossaryEntry,
  findCharacter,
  renderPlayerNotesPanel,
  shouldShowGlossaryReturnFab,
  getViewStateLabel,
}) {
  const entries = getFilteredGlossaryEntries();
  const current = entries.find((entry) => entry.id === state.ui.selectedGlossaryId) || entries[0] || null;
  const categories = getGlossaryCategories(state.glossary);
  const activeFilterCount = getActiveFilterCount(state);
  const returnLabel = shouldShowGlossaryReturnFab(current?.id) ? getViewStateLabel(state.ui.glossaryReturnView) : "";

  rootEl.innerHTML = `
    <section class="glossary-shell ${state.ui.notesPanelOpen ? "notes-open" : ""}">
      <div class="glossary-layout ${state.ui.editModes.glossary && current ? "glossary-layout-editing" : ""}">
        <aside class="glossary-nav-panel module-surface">
          <section class="glossary-search-panel">
            <div>
              <p class="eyebrow">Busca directa</p>
              <h3>Troba termes sense sortir del flux</h3>
            </div>
            <label class="glossary-search-field">
              <span class="sr-only">Cerca al glossari</span>
              <input
                type="search"
                name="glossarySearch"
                value="${escapeAttribute(state.ui.glossarySearch)}"
                placeholder="Nom, categoria, etiqueta o concepte..."
              />
            </label>
            <div class="glossary-active-filters">
              <span class="badge">${activeFilterCount ? `${activeFilterCount} filtres actius` : "Sense filtres actius"}</span>
              ${activeFilterCount
                ? `<button type="button" class="secondary" data-clear-glossary-filters>Neteja navegacio</button>`
                : ""}
            </div>
            <button type="button" class="secondary glossary-create-button" data-create-glossary>
              <span class="module-action-icon">${renderModuleActionIcon("create")}</span>
              <span>Nova entrada</span>
            </button>
          </section>

          <section class="glossary-nav-section">
            <div class="glossary-nav-section-head">
              <div>
                <p class="eyebrow">Menu principal</p>
                <h3>Categories</h3>
              </div>
            </div>
            <div class="glossary-filters glossary-menu-list" role="tablist" aria-label="Categories del glossari">
              ${renderGlossaryCategoryMenu(state, categories)}
            </div>
          </section>

          <section class="glossary-nav-section">
            <div class="glossary-nav-section-head">
              <div>
                <p class="eyebrow">Submenu</p>
                <h3>Sessions</h3>
              </div>
            </div>
            <div class="glossary-session-list" role="group" aria-label="Filtre per sessions del glossari">
              ${renderGlossaryChronicleMenu(state, state.chronicles)}
            </div>
          </section>

          <section class="glossary-nav-section glossary-nav-section-overview">
            <div class="glossary-nav-section-head">
              <div>
                <p class="eyebrow">Vista actual</p>
                <h3>${escapeHtml(renderScopeTitle(state))}</h3>
              </div>
            </div>
            <p class="glossary-nav-copy">${escapeHtml(renderScopeCopy(state, entries.length))}</p>
          </section>
        </aside>

        <section
          id="glossary-results-panel"
          class="glossary-results-panel module-surface"
          role="tabpanel"
          aria-labelledby="glossary-filter-${buildGlossarySlug(state.ui.glossaryCategory || "totes")}"
        >
          <div class="glossary-results-head">
            <div>
              <p class="eyebrow">Resultats visibles</p>
              <h3>${entries.length ? `${entries.length} termes` : "Cap terme visible"}</h3>
            </div>
            <p class="glossary-results-copy">${escapeHtml(renderResultsCopy(state, entries.length))}</p>
          </div>
          <div class="glossary-list">
            ${entries.length
              ? entries.map((entry) => renderGlossaryCard(entry, state.ui.selectedGlossaryId, state)).join("")
              : renderGlossaryEmptyState(state)}
          </div>
        </section>

        <div class="glossary-detail-wrap">
          ${current ? renderGlossaryDetail(current, state, findCharacter, returnLabel) : renderGlossaryEmptyDetail()}
          ${state.ui.editModes.glossary && current ? renderGlossaryEditor(current, state) : ""}
          ${renderPlayerNotesPanel()}
        </div>
      </div>
    </section>
  `;
}

export function saveGlossary(formData, { findGlossaryEntry }) {
  const entry = findGlossaryEntry(readString(formData, "id"));
  if (!entry) {
    return;
  }

  entry.name = readString(formData, "name");
  entry.category = readString(formData, "category");
  entry.description = readString(formData, "description");
  entry.tags = readString(formData, "tags")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
  entry.notes = readString(formData, "notes");
  entry.latestStatus = readString(formData, "latestStatus");
  entry.lastSeenChronicleId = readString(formData, "lastSeenChronicleId");
  entry.imageAssets = readString(formData, "imageAssets")
    .split(/\r?\n/)
    .map((source) => source.trim())
    .filter(Boolean);
  entry.characterIds = formData.getAll("characterIds").map(String);
  entry.chronicleIds = formData.getAll("chronicleIds").map(String);
}

export function createGlossaryEntry(state) {
  const entry = {
    id: `g${Date.now()}`,
    name: "Nova entrada",
    category: "Llocs",
    description: "",
    tags: [],
    notes: "",
    latestStatus: "",
    lastSeenChronicleId: "",
    imageAssets: [],
    playerNotes: [],
    characterIds: [],
    chronicleIds: [],
    palette: ["#54616a", "#c6a26a"],
  };
  state.glossary.unshift(entry);
  state.ui.selectedGlossaryId = entry.id;
}

export function deleteGlossaryEntry(state) {
  if (state.glossary.length <= 1) {
    return;
  }

  state.glossary = state.glossary.filter((entry) => entry.id !== state.ui.selectedGlossaryId);
  state.ui.selectedGlossaryId = state.glossary[0].id;
}

function renderGlossaryCategoryMenu(state, categories) {
  const categoryItems = ["Totes", ...categories];
  return categoryItems
    .map((category) => {
      const count = countEntriesForCategory(state, category);
      const isActive = state.ui.glossaryCategory === category;
      return `
        <button
          type="button"
          class="glossary-menu-item ${isActive ? "active" : ""}"
          data-glossary-filter="${escapeAttribute(category)}"
          data-reference-theme="${getGlossaryCategoryTheme(category)}"
          id="glossary-filter-${buildGlossarySlug(category)}"
          role="tab"
          aria-selected="${isActive ? "true" : "false"}"
          aria-controls="glossary-results-panel"
          tabindex="${isActive ? "0" : "-1"}"
        >
          <span>${escapeHtml(category)}</span>
          <strong>${count}</strong>
        </button>
      `;
    })
    .join("");
}

function renderGlossaryChronicleMenu(state, chronicles) {
  return chronicles
    .map((chronicle) => {
      const count = countEntriesForChronicle(state, chronicle.id);
      const isActive = (state.ui.glossaryChronicleIds || []).includes(chronicle.id);
      return `
        <label class="glossary-session-item ${isActive ? "active" : ""}">
          <input
            type="checkbox"
            data-glossary-session="${escapeAttribute(chronicle.id)}"
            ${isActive ? "checked" : ""}
          />
          <span class="glossary-session-copy">
            <strong>${escapeHtml(chronicle.chapter)}</strong>
            <small>${escapeHtml(chronicle.title)}</small>
          </span>
          <span class="glossary-session-count">${count}</span>
        </label>
      `;
    })
    .join("");
}

function renderGlossaryCard(entry, selectedGlossaryId, state) {
  const isActive = entry.id === selectedGlossaryId;

  return `
    <article
      class="glossary-entry ${isActive ? "active" : ""}"
      data-glossary-id="${entry.id}"
      tabindex="0"
      role="button"
      aria-label="${escapeAttribute(`Obre l'entrada ${entry.name}`)}"
      style="${paletteStyle(entry.palette)}"
    >
      <div class="glossary-entry-head">
        <h3>${escapeHtml(entry.name)}</h3>
        ${
          isActive
            ? `
        <div class="glossary-entry-actions">
          <button
            type="button"
            class="secondary glossary-entry-action"
            data-edit-glossary-card="${escapeAttribute(entry.id)}"
            aria-label="${escapeAttribute(`Edita l'entrada ${entry.name}`)}"
            title="${escapeAttribute(`Edita ${entry.name}`)}"
          >
            ${renderGlossaryActionIcon("edit")}
            <span class="sr-only">Edita</span>
          </button>
          <button
            type="button"
            class="secondary glossary-entry-action"
            data-delete-glossary-card="${escapeAttribute(entry.id)}"
            aria-label="${escapeAttribute(`Esborra l'entrada ${entry.name}`)}"
            title="${escapeAttribute(`Esborra ${entry.name}`)}"
          >
            ${renderGlossaryActionIcon("delete")}
            <span class="sr-only">Esborra</span>
          </button>
        </div>`
            : ""
        }
      </div>
    </article>
  `;
}

function renderGlossaryEmptyState(state) {
  const hasFilters = getActiveFilterCount(state) > 0;
  return `
    <div class="empty-state empty-state-list">
      <p class="eyebrow">Sense resultats</p>
      <h3>No hi ha entrades visibles</h3>
      <p>${hasFilters
        ? "La combinacio de cerca, categoria i sessions no retorna cap terme."
        : "Encara no hi ha cap entrada disponible en aquest conjunt."}</p>
      ${hasFilters
        ? `<button type="button" data-clear-glossary-filters>Neteja navegacio</button>`
        : ""}
    </div>
  `;
}

function renderGlossaryEmptyDetail() {
  return `
    <div class="glossary-detail empty-state">
      <p class="eyebrow">Compendi buit</p>
      <h3>Selecciona o crea una entrada</h3>
      <p>Quan hi hagi resultats, el detall apareixera aqui amb context, relacions i notes de joc.</p>
    </div>
  `;
}

function renderGlossaryDetail(entry, state, findCharacter, returnLabel = "") {
  const images = (entry.imageAssets || []).filter(Boolean);
  const coverImage = images[0] || "";
  const extraImages = images.slice(1);
  const briefDescription = getGlossaryBriefDescription(entry);

  return `
    <article
      class="glossary-detail"
      data-glossary-detail="${escapeAttribute(entry.id)}"
      tabindex="-1"
      style="${paletteStyle(entry.palette)}"
    >
      ${returnLabel ? renderGlossaryReturnChip(returnLabel) : ""}
      <div class="glossary-detail-hero">
        <div class="glossary-cover">
          <figure class="glossary-cover-media">
            ${coverImage
              ? `<img ${renderGlossaryAssetAttribute("src", coverImage)} alt="${escapeAttribute(entry.name)}" loading="lazy" />`
              : renderGlossaryCoverPlaceholder(entry)}
          </figure>
          <div class="glossary-cover-copy">
            <p class="eyebrow">${escapeHtml(entry.category)}</p>
            <h3>${escapeHtml(entry.name)}</h3>
            <p>${escapeHtml(briefDescription)}</p>
          </div>
        </div>
      </div>
      <section class="glossary-detail-body">
        <p class="eyebrow">Text detallat</p>
        <div class="rich-text">${renderRichText(entry.description)}</div>
      </section>
      <details class="glossary-detail-more">
        <summary>Detalls</summary>
        <div class="glossary-detail-more-content">
          ${renderGlossaryLatestPanel(entry, state)}
          <div class="glossary-detail-tags">
            ${(entry.tags || []).length
              ? entry.tags.map((tag) => `<span class="badge">${escapeHtml(tag)}</span>`).join("")
              : '<span class="badge">Sense etiquetes</span>'}
          </div>
          ${extraImages.length ? renderGlossaryExtraImages(extraImages, entry) : ""}
          <div class="item-grid glossary-detail-grid">
            ${renderTextCard("Notes de context", entry.notes || "Sense notes", { rich: true })}
            ${renderTextCard("Personatges vinculats", formatCharacterLinks(entry.characterIds, findCharacter))}
            ${renderTextCard("Croniques vinculades", formatChronicleLinks(entry.chronicleIds, state))}
            ${renderTextCard("Mapa de relacions", renderRelationshipSummary(entry), { rich: true })}
          </div>
        </div>
      </details>
    </article>
  `;
}

function renderGlossaryCoverPlaceholder(entry) {
  const initial = (entry.name || entry.category || "?").trim().slice(0, 1).toUpperCase() || "?";

  return `
    <div class="glossary-cover-placeholder" aria-hidden="true">
      <span>${escapeHtml(initial)}</span>
    </div>
  `;
}

function renderGlossaryExtraImages(images, entry) {
  return `
    <div class="glossary-media-grid">
      ${images
        .map(
          (source, index) => `
            <figure class="glossary-media-frame">
              <img ${renderGlossaryAssetAttribute("src", source)} alt="${escapeAttribute(`${entry.name} ${index + 2}`)}" loading="lazy" />
            </figure>
          `,
        )
        .join("")}
    </div>
  `;
}

function getGlossaryBriefDescription(entry) {
  const text = getPlainGlossaryText(entry.description || entry.latestStatus || entry.notes || "");
  if (!text) {
    return "Entrada pendent de resum breu.";
  }

  const sentenceEnd = text.search(/[.!?](\s|$)/);
  const candidate = sentenceEnd >= 80 && sentenceEnd <= 220
    ? text.slice(0, sentenceEnd + 1)
    : text.slice(0, 220);

  return candidate.length < text.length ? `${candidate.trim().replace(/[,:;]+$/, "")}...` : candidate.trim();
}

function getPlainGlossaryText(value) {
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

function renderRelationshipSummary(entry) {
  return [
    `Etiquetes: ${(entry.tags || []).length || 0}`,
    `Personatges: ${(entry.characterIds || []).length || 0}`,
    `Croniques: ${(entry.chronicleIds || []).length || 0}`,
  ].join("\n");
}

function renderGlossaryLatestPanel(entry, state) {
  const lastChronicle = getGlossaryLastChronicle(entry, state);
  const latestStatus = entry.latestStatus || entry.notes || entry.description || "Sense novetats registrades encara.";
  const lastSeenLabel = entry.category === "Llocs" ? "Ultima vegada visitat a" : "Ultima vegada vist a";
  const lastSeenValue = lastChronicle ? `${lastChronicle.chapter} · ${lastChronicle.title}` : "Sense sessio registrada";

  return `
    <aside class="glossary-latest-panel">
      <p class="eyebrow">Situacio actual</p>
      <div class="glossary-latest-copy rich-text">${renderRichText(latestStatus)}</div>
      <p class="glossary-latest-chronicle">
        <strong>${escapeHtml(lastSeenLabel)}:</strong> ${escapeHtml(lastSeenValue)}
      </p>
    </aside>
  `;
}

function renderGlossaryReturnChip(targetLabel) {
  return `
    <button
      type="button"
      class="secondary glossary-return-chip"
      data-return-to-chronicle
      aria-label="${escapeAttribute(`Torna a ${targetLabel}`)}"
      title="${escapeAttribute(`Torna a ${targetLabel}`)}"
    >
      <span class="glossary-return-chip-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" focusable="false">
          <path d="M10.2 5.2a.75.75 0 0 1 0 1.06L5.46 11H19a.75.75 0 0 1 0 1.5H5.46l4.74 4.74a.75.75 0 1 1-1.06 1.06l-6.02-6.02a.75.75 0 0 1 0-1.06L9.14 5.2a.75.75 0 0 1 1.06 0Z" fill="currentColor"/>
        </svg>
      </span>
      <span>Torna a la cronica</span>
    </button>
  `;
}

function renderGlossaryEditor(entry, state) {
  const draft = state.ui.drafts.glossary[entry?.id || ""] || {};
  const selectedCharacters = new Set(readDraftArray(draft.characterIds, entry?.characterIds || []));
  const selectedChronicles = new Set(readDraftArray(draft.chronicleIds, entry?.chronicleIds || []));
  const selectedLastSeenChronicleId = readDraftValue(
    draft.lastSeenChronicleId,
    entry?.lastSeenChronicleId || getGlossaryLastChronicle(entry, state)?.id || "",
  );
  const hasPendingDraft = Object.keys(draft).length > 0;
  const editorStatus = renderEditorStatus(state, "glossary", entry?.id || "", hasPendingDraft);

  return `
    <section class="module-surface editor-workspace editor-workspace-glossary">
      ${renderEditorWorkspaceHeader(
        "Edicio de glossari",
        entry?.name || "Nova entrada",
        "La fitxa base i els vincles narratius queden separats per reduir soroll i accelerar el desat.",
        [
          entry?.category || "Sense categoria",
          `${(entry?.characterIds || []).length} personatges`,
          `${(entry?.chronicleIds || []).length} croniques`,
        ],
      )}
      ${editorStatus}
      <form data-form="glossary" class="editor-form">
        <input type="hidden" name="id" value="${escapeAttribute(entry?.id || "")}" />
        <div class="editor-layout editor-layout-glossary">
          ${renderEditorCard(
            "Fitxa base",
            "Nom, categoria i text descriptiu. Aquest bloc defineix el que es veu al detall i a la navegacio.",
            `
              <div class="editor-grid">
                ${renderInputField("name", "Nom", readDraftValue(draft.name, entry?.name || ""))}
                <label class="field">
                  <span>Categoria</span>
                  <select name="category">
                    ${["Llocs", "Religió", "Antagonistes", "Entitats", "Faccions", "Objectes", "Monstres", "Races", "Altres"]
                      .map(
                        (category) => `
                          <option value="${category}" ${readDraftValue(draft.category, entry?.category || "") === category ? "selected" : ""}>
                            ${category}
                          </option>
                        `,
                      )
                      .join("")}
                  </select>
                </label>
                ${renderRichTextareaField("description", "Descripcio", readDraftValue(draft.description, entry?.description || ""), 6)}
                ${renderInputField("tags", "Etiquetes (separades per comes)", readDraftValue(draft.tags, (entry?.tags || []).join(", ")))}
                ${renderRichTextareaField("notes", "Notes", readDraftValue(draft.notes, entry?.notes || ""), 6)}
                ${renderRichTextareaField(
                  "latestStatus",
                  "Ultima informacio rellevant",
                  readDraftValue(draft.latestStatus, entry?.latestStatus || ""),
                  4,
                  {
                    help: "Resumeix l'estat actual de l'element: mort, desaparegut, controlat, visitat, perdut, etc.",
                  },
                )}
                <label class="field">
                  <span>Ultima sessio vista o visitada</span>
                  <select name="lastSeenChronicleId">
                    <option value="">Sense sessio</option>
                    ${state.chronicles
                      .map(
                        (chronicle) => `
                          <option value="${escapeAttribute(chronicle.id)}" ${selectedLastSeenChronicleId === chronicle.id ? "selected" : ""}>
                            ${escapeHtml(`${chronicle.chapter} · ${chronicle.title}`)}
                          </option>
                        `,
                      )
                      .join("")}
                  </select>
                </label>
                <label class="field span-2">
                  <span>Imatges</span>
                  ${renderGlossaryImagePicker(entry, draft)}
                  <textarea name="imageAssets" hidden>${escapeHtml(readDraftValue(draft.imageAssets, (entry?.imageAssets || []).join("\n")))}</textarea>
                  <small class="field-help">Selecciona una o mes imatges des del teu equip. Quedaran guardades dins l'entrada.</small>
                </label>
              </div>
            `,
          )}
          ${renderEditorCard(
            "Vincles del mon",
            "Relaciona l'entrada amb personatges i sessions sense perdre la lectura de context.",
            `
              <div class="editor-stack">
                <div class="field">
                  <span>Personatges vinculats</span>
                  <p class="editor-field-copy">Ideal per faccions, objectes clau o ubicacions rellevants.</p>
                  ${renderChoiceGrid(
                    "characterIds",
                    state.characters,
                    selectedCharacters,
                    (character) => character.id,
                    (character) => character.name,
                    (character) => `${character.lineage} · ${character.className}`,
                  )}
                </div>
                <div class="field">
                  <span>Croniques vinculades</span>
                  <p class="editor-field-copy">Aixo construeix el fil narratiu i facilita tornar a la sessio correcta.</p>
                  ${renderChoiceGrid(
                    "chronicleIds",
                    state.chronicles,
                    selectedChronicles,
                    (chronicle) => chronicle.id,
                    (chronicle) => `${chronicle.chapter} · ${chronicle.title}`,
                    (chronicle) => chronicle.date || "Sense data",
                  )}
                </div>
              </div>
            `,
          )}
        </div>
        ${renderEditorActions("Desa entrada")}
      </form>
    </section>
  `;
}

function formatCharacterLinks(ids, findCharacter) {
  return ids.map((id) => findCharacter(id)?.name).filter(Boolean).join(", ") || "Sense lligams";
}

function formatChronicleLinks(ids, state) {
  return ids
    .map((id) => state.chronicles.find((chronicle) => chronicle.id === id))
    .filter(Boolean)
    .map((chronicle) => `${chronicle.chapter} · ${chronicle.title}`)
    .join(", ") || "Sense lligams";
}

function renderGlossaryImagePicker(entry, draft) {
  const images = readDraftLines(draft.imageAssets, entry?.imageAssets || []);

  return `
    <div class="glossary-image-picker">
      <input
        type="file"
        accept="image/*"
        multiple
        data-glossary-image-picker
        data-glossary-id="${escapeAttribute(entry?.id || "")}"
        class="glossary-image-picker-input"
      />
      <button type="button" class="secondary" data-open-glossary-image-picker>
        <span class="module-action-icon">${renderModuleActionIcon("create")}</span>
        <span>Afegeix imatge</span>
      </button>
      ${images.length
        ? `
          <div class="glossary-editor-media-grid">
            ${images
              .map(
                (source, index) => `
                  <figure class="glossary-editor-media-frame">
                    <img ${renderGlossaryAssetAttribute("src", source)} alt="${escapeAttribute(`${entry?.name || "Imatge"} ${index + 1}`)}" loading="lazy" />
                    <button
                      type="button"
                      class="secondary glossary-editor-media-remove"
                      data-glossary-id="${escapeAttribute(entry?.id || "")}"
                      data-remove-glossary-image="${index}"
                      aria-label="${escapeAttribute(`Elimina la imatge ${index + 1}`)}"
                      title="${escapeAttribute(`Elimina la imatge ${index + 1}`)}"
                    >
                      ${renderGlossaryActionIcon("delete")}
                    </button>
                  </figure>
                `,
              )
              .join("")}
          </div>
        `
        : '<p class="glossary-image-picker-empty">Encara no hi ha cap imatge vinculada a aquesta entrada.</p>'}
    </div>
  `;
}

function getGlossaryLastChronicle(entry, state) {
  const explicitChronicleId = entry?.lastSeenChronicleId || "";
  if (explicitChronicleId) {
    return state.chronicles.find((chronicle) => chronicle.id === explicitChronicleId) || null;
  }

  const chronicleIds = new Set(entry?.chronicleIds || []);
  const matchingChronicles = state.chronicles.filter((chronicle) => chronicleIds.has(chronicle.id));
  return matchingChronicles.at(-1) || null;
}

function renderGlossaryActionIcon(type) {
  if (type === "edit") {
    return `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M4 15.75V20h4.25L18.8 9.45l-4.25-4.25L4 15.75Zm13.85-8.4a1 1 0 0 0 0-1.4l-1.8-1.8a1 1 0 0 0-1.4 0l-1.4 1.4l4.25 4.25l1.35-1.45Z" fill="currentColor"/>
      </svg>
    `;
  }

  return `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M9 4.75h6l.45 1.5H19v1.5h-1.1l-.8 11.1a2.1 2.1 0 0 1-2.09 1.95H9a2.1 2.1 0 0 1-2.09-1.95l-.8-11.1H5v-1.5h3.55L9 4.75Zm1.6 4.1v8.1h1.5v-8.1Zm3.3 0v8.1h1.5v-8.1Z" fill="currentColor"/>
    </svg>
  `;
}

function renderScopeTitle(state) {
  const sessionScopeLabel = getGlossarySessionScopeLabel(state);

  if (state.ui.glossarySearch) {
    return `Cerca: ${state.ui.glossarySearch}`;
  }

  if (state.ui.glossaryCategory !== "Totes" && sessionScopeLabel) {
    return `${state.ui.glossaryCategory} · ${sessionScopeLabel}`;
  }

  if (state.ui.glossaryCategory !== "Totes") {
    return state.ui.glossaryCategory;
  }

  if (sessionScopeLabel) {
    return sessionScopeLabel;
  }

  return "Vista general";
}

function renderScopeCopy(state, visibleCount) {
  const sessionScopeLabel = getGlossarySessionScopeLabel(state);

  if (!visibleCount) {
    return "Canvia la navegacio o neteja filtres per recuperar termes del compendi.";
  }

  if (state.ui.glossarySearch) {
    return `Mostrant ${visibleCount} resultats relacionats amb la cerca activa.`;
  }

  if (state.ui.glossaryCategory !== "Totes") {
    if (sessionScopeLabel) {
      return `Mostrant ${visibleCount} entrades de ${state.ui.glossaryCategory} referenciades a ${sessionScopeLabel}.`;
    }
    return `Mostrant ${visibleCount} entrades dins la categoria ${state.ui.glossaryCategory}.`;
  }

  if (sessionScopeLabel) {
    return `Mostrant ${visibleCount} entrades referenciades a ${sessionScopeLabel}.`;
  }

  return `Mostrant ${visibleCount} entrades disponibles per explorar.`;
}

function renderResultsCopy(state, visibleCount) {
  if (!visibleCount) {
    return "No hi ha resultats per aquesta combinacio de navegacio.";
  }

  if (state.ui.glossarySearch) {
    return "La llista prioriza els termes que millor encaixen amb la cerca actual.";
  }

  return "Selecciona una entrada per obrir el detall complet i mantenir la lectura en context.";
}

function getActiveFilterCount(state) {
  return Number(Boolean(state.ui.glossarySearch.trim()))
    + Number(state.ui.glossaryCategory !== "Totes")
    + Number((state.ui.glossaryChronicleIds || []).length);
}

function getGlossaryCategories(entries) {
  return [...new Set(entries.map((entry) => entry.category))].sort((left, right) => left.localeCompare(right, "ca"));
}

function countEntriesForCategory(state, category) {
  return state.glossary.filter((entry) => {
    const matchesCategory = category === "Totes" || entry.category === category;
    return matchesCategory && matchesGlossaryFiltersForMenu(entry, state, { ignoreCategory: true });
  }).length;
}

function countEntriesForChronicle(state, chronicleId) {
  return state.glossary.filter((entry) => {
    const matchesChronicle = (entry.chronicleIds || []).includes(chronicleId);
    return matchesChronicle && matchesGlossaryFiltersForMenu(entry, state, { ignoreChronicle: true });
  }).length;
}

function matchesGlossaryFiltersForMenu(entry, state, options = {}) {
  const search = normalizeGlossaryToken(state.ui.glossarySearch);
  const matchesCategory = options.ignoreCategory
    || state.ui.glossaryCategory === "Totes"
    || entry.category === state.ui.glossaryCategory;
  const activeChronicleIds = state.ui.glossaryChronicleIds || [];
  const matchesChronicle = options.ignoreChronicle
    || !activeChronicleIds.length
    || activeChronicleIds.some((chronicleId) => (entry.chronicleIds || []).includes(chronicleId));
  const matchesSearch = !search
    || normalizeGlossaryToken(entry.name).includes(search)
    || normalizeGlossaryToken(entry.category).includes(search)
    || normalizeGlossaryToken(entry.description).includes(search)
    || (entry.tags || []).some((tag) => normalizeGlossaryToken(tag).includes(search));

  return matchesCategory && matchesChronicle && matchesSearch;
}

function getGlossarySessionScopeLabel(state) {
  const activeChronicleIds = state.ui.glossaryChronicleIds || [];
  if (!activeChronicleIds.length) {
    return "";
  }

  if (activeChronicleIds.length === 1) {
    const chronicle = state.chronicles.find((item) => item.id === activeChronicleIds[0]);
    return chronicle?.chapter || "la sessio seleccionada";
  }

  return `${activeChronicleIds.length} sessions seleccionades`;
}

function normalizeGlossaryToken(value) {
  return String(value || "")
    .normalize("NFD")
    .replaceAll(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

function buildGlossarySlug(value) {
  return String(value || "totes")
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/^-|-$/g, "") || "totes";
}

function readDraftValue(draftValue, fallback) {
  return draftValue !== undefined ? draftValue : fallback;
}

function readDraftArray(draftValue, fallback) {
  return Array.isArray(draftValue) ? draftValue : fallback;
}

function readDraftLines(draftValue, fallback) {
  if (Array.isArray(draftValue)) {
    return draftValue.map((value) => String(value || "").trim()).filter(Boolean);
  }

  if (typeof draftValue === "string") {
    return draftValue
      .split(/\r?\n/)
      .map((value) => value.trim())
      .filter(Boolean);
  }

  return Array.isArray(fallback) ? fallback : [];
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

function renderGlossaryAssetAttribute(attribute, source) {
  if (isAssetToken(source)) {
    return `data-asset-${attribute}="${escapeAttribute(source)}"`;
  }

  return `${attribute}="${escapeAttribute(source)}"`;
}
