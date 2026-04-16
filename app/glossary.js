import {
  escapeAttribute,
  escapeHtml,
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
  renderStatusPills,
  renderTextCard,
  renderTextareaField,
  shortText,
} from "./utils.js";

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
  const current = findGlossaryEntry(state.ui.selectedGlossaryId) || entries[0];

  rootEl.innerHTML = `
    <section class="hero-banner module-hero module-hero-glossary">
      <div class="module-hero-copy">
        <p class="eyebrow">Compendi viu</p>
        <h2>Glossari pensat per navegar l'univers</h2>
        <p>
          El llistat filtra ràpid i el detall manté context narratiu: faccions, llocs, entitats i objectes clau sense
          aparença de backoffice.
        </p>
      </div>
      <div class="hero-side-panel">
        <div class="module-inline-actions">
          <button
            type="button"
            class="secondary module-edit-button"
            data-toggle-edit="glossary"
            aria-pressed="${state.ui.editModes.glossary ? "true" : "false"}"
          >
            <span class="module-action-icon">${renderModuleActionIcon("glossary")}</span>
            <span>${state.ui.editModes.glossary ? "Tanca edició" : "Edita entrada"}</span>
          </button>
          <button type="button" class="secondary module-edit-button" data-create-glossary>
            <span class="module-action-icon">${renderModuleActionIcon("create")}</span>
            <span>Nova entrada</span>
          </button>
        </div>
        <div class="hero-stat-grid">
          <div class="hero-stat-card">
            <strong>${state.glossary.length}</strong>
            <span>Entrades totals</span>
          </div>
          <div class="hero-stat-card">
            <strong>${new Set(state.glossary.map((entry) => entry.category)).size}</strong>
            <span>Categories</span>
          </div>
          <div class="hero-stat-card">
            <strong>${entries.length}</strong>
            <span>Visibles ara</span>
          </div>
        </div>
      </div>
    </section>
    <section class="glossary-shell ${state.ui.notesPanelOpen ? "notes-open" : ""}">
      <div class="glossary-top">
        <div>
          <p class="eyebrow">Compendi</p>
          <h3>Glossari de campanya</h3>
        </div>
        <div class="module-toolbar">
          <input
            type="search"
            name="glossarySearch"
            value="${escapeAttribute(state.ui.glossarySearch)}"
            placeholder="Cerca termes del món..."
          />
        </div>
      </div>
      <div class="tab-strip glossary-filters" role="tablist" aria-label="Categories del glossari">
        ${["Totes", ...new Set(state.glossary.map((entry) => entry.category))]
          .map(
            (category) => `
              <button
                type="button"
                class="tab-button ${state.ui.glossaryCategory === category ? "active" : ""}"
                data-glossary-filter="${category}"
                id="glossary-filter-${category.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-").replaceAll(/^-|-$/g, "") || "totes"}"
                role="tab"
                aria-selected="${state.ui.glossaryCategory === category ? "true" : "false"}"
                aria-controls="glossary-results-panel"
                tabindex="${state.ui.glossaryCategory === category ? "0" : "-1"}"
              >
                ${escapeHtml(category)}
              </button>
            `,
          )
          .join("")}
      </div>
      <div
        id="glossary-results-panel"
        class="glossary-grid"
        role="tabpanel"
        aria-labelledby="glossary-filter-${(state.ui.glossaryCategory || "totes").toLowerCase().replaceAll(/[^a-z0-9]+/g, "-").replaceAll(/^-|-$/g, "") || "totes"}"
      >
        <div class="glossary-list">
          ${entries.length
            ? entries.map((entry) => renderGlossaryCard(entry, state.ui.selectedGlossaryId, state)).join("")
            : renderGlossaryEmptyState(state)}
        </div>
        <div class="glossary-detail-wrap">
          ${current ? renderGlossaryDetail(current, state, findCharacter) : renderGlossaryEmptyDetail()}
          ${state.ui.editModes.glossary && current ? renderGlossaryEditor(current, state) : ""}
          ${renderPlayerNotesPanel()}
          ${shouldShowGlossaryReturnFab(current?.id) ? renderGlossaryReturnFab(getViewStateLabel(state.ui.glossaryReturnView)) : ""}
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

function renderGlossaryCard(entry, selectedGlossaryId, state) {
  const statusPills = [];
  const hasPendingDraft = Object.keys(state.ui.drafts.glossary[entry.id] || {}).length > 0;

  if (hasPendingDraft) {
    statusPills.push({ label: "Esborrany", tone: "draft" });
  }

  if (state.ui.editModes.glossary && state.ui.selectedGlossaryId === entry.id) {
    statusPills.push({ label: "En edició", tone: "editing" });
  }

  return `
    <article
      class="glossary-entry ${entry.id === selectedGlossaryId ? "active" : ""}"
      data-glossary-id="${entry.id}"
      tabindex="0"
      role="button"
      aria-label="${escapeAttribute(`Obre l'entrada ${entry.name}`)}"
      style="${paletteStyle(entry.palette)}"
    >
      ${renderStatusPills(statusPills)}
      <p class="eyebrow">${escapeHtml(entry.category)}</p>
      <h3>${escapeHtml(entry.name)}</h3>
      <p>${escapeHtml(shortText(entry.description, 120))}</p>
      <div class="glossary-tags">
        ${(entry.tags || []).map((tag) => `<span class="badge">${escapeHtml(tag)}</span>`).join("")}
      </div>
    </article>
  `;
}

function renderGlossaryEmptyState(state) {
  const hasFilters = Boolean(state.ui.glossarySearch) || state.ui.glossaryCategory !== "Totes";
  return `
    <div class="empty-state empty-state-list">
      <p class="eyebrow">Sense resultats</p>
      <h3>No hi ha entrades visibles</h3>
      <p>${hasFilters
        ? "La cerca o la categoria actual no coincideixen amb cap terme del compendi."
        : "Encara no hi ha cap entrada disponible en aquest conjunt."}</p>
      ${hasFilters
        ? `<button type="button" data-clear-glossary-filters>Neteja filtres</button>`
        : ""}
    </div>
  `;
}

function renderGlossaryEmptyDetail() {
  return `
    <div class="glossary-detail empty-state">
      <p class="eyebrow">Compendi buit</p>
      <h3>Selecciona o crea una entrada</h3>
      <p>Quan hi hagi resultats, el detall es mostrarà aquí amb les relacions de món i les notes.</p>
    </div>
  `;
}

function renderGlossaryDetail(entry, state, findCharacter) {
  return `
    <article class="glossary-detail" style="${paletteStyle(entry.palette)}">
      <div class="glossary-detail-hero">
        <p class="eyebrow">${escapeHtml(entry.category)}</p>
        <h3>${escapeHtml(entry.name)}</h3>
        <div class="rich-text">${renderRichText(entry.description)}</div>
      </div>
      <div class="item-grid">
        ${renderTextCard("Etiquetes", (entry.tags || []).join(", ") || "Sense etiquetes")}
        ${renderTextCard("Notes", entry.notes || "Sense notes", { rich: true })}
        ${renderTextCard("Personatges vinculats", formatCharacterLinks(entry.characterIds, findCharacter))}
        ${renderTextCard("Cròniques vinculades", formatChronicleLinks(entry.chronicleIds, state))}
      </div>
    </article>
  `;
}

function renderGlossaryReturnFab(targetLabel) {
  return `
    <button type="button" class="return-fab" data-return-to-chronicle>
      Torna a ${escapeHtml(targetLabel)}
    </button>
  `;
}

function renderGlossaryEditor(entry, state) {
  const draft = state.ui.drafts.glossary[entry?.id || ""] || {};
  const selectedCharacters = new Set(readDraftArray(draft.characterIds, entry?.characterIds || []));
  const selectedChronicles = new Set(readDraftArray(draft.chronicleIds, entry?.chronicleIds || []));
  const hasPendingDraft = Object.keys(draft).length > 0;
  const editorStatus = renderEditorStatus(state, "glossary", entry?.id || "", hasPendingDraft);

  return `
    <section class="module-surface editor-workspace editor-workspace-glossary">
      ${renderEditorWorkspaceHeader(
        "Edició de glossari",
        entry?.name || "Nova entrada",
        "La fitxa principal queda a l'esquerra i les relacions del món a la dreta. En mòbil tot es reordena en una sola columna clara.",
        [
          entry?.category || "Sense categoria",
          `${(entry?.characterIds || []).length} personatges`,
          `${(entry?.chronicleIds || []).length} cròniques`,
        ],
      )}
      ${editorStatus}
      <form data-form="glossary" class="editor-form">
        <input type="hidden" name="id" value="${escapeAttribute(entry?.id || "")}" />
        <div class="editor-layout editor-layout-glossary">
          ${renderEditorCard(
            "Fitxa base",
            "Nom, categoria i text descriptiu. Aquest bloc defineix el que es veu al detall i a la targeta.",
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
                ${renderRichTextareaField("description", "Descripció", readDraftValue(draft.description, entry?.description || ""), 6)}
                ${renderInputField("tags", "Etiquetes (separades per comes)", readDraftValue(draft.tags, (entry?.tags || []).join(", ")))}
                ${renderRichTextareaField("notes", "Notes", readDraftValue(draft.notes, entry?.notes || ""), 6)}
              </div>
            `,
          )}
          ${renderEditorCard(
            "Vincles del món",
            "Relaciona l'entrada amb personatges i sessions sense perdre el context de l'univers.",
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
                  <span>Cròniques vinculades</span>
                  <p class="editor-field-copy">Això construeix el fil narratiu i facilita tornar a la sessió correcta.</p>
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
        ${renderEditorActions(
          "Desa entrada",
          `
            <button type="button" class="secondary" data-delete-glossary>Esborra entrada</button>
          `,
        )}
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
