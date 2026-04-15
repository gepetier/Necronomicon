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
      <div class="tab-strip glossary-filters">
        ${["Totes", ...new Set(state.glossary.map((entry) => entry.category))]
          .map(
            (category) => `
              <button
                type="button"
                class="tab-button ${state.ui.glossaryCategory === category ? "active" : ""}"
                data-glossary-filter="${category}"
              >
                ${escapeHtml(category)}
              </button>
            `,
          )
          .join("")}
      </div>
      <div class="glossary-grid">
        <div class="glossary-list">
          ${entries.map((entry) => renderGlossaryCard(entry, state.ui.selectedGlossaryId)).join("")}
        </div>
        <div class="glossary-detail-wrap">
          ${current ? renderGlossaryDetail(current, state, findCharacter) : `<div class="glossary-detail"><p>No hi ha entrades.</p></div>`}
          ${state.ui.isEditMode ? renderGlossaryEditorV2(current, state) : ""}
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

function renderGlossaryCard(entry, selectedGlossaryId) {
  return `
    <article
      class="glossary-entry ${entry.id === selectedGlossaryId ? "active" : ""}"
      data-glossary-id="${entry.id}"
      style="${paletteStyle(entry.palette)}"
    >
      <p class="eyebrow">${escapeHtml(entry.category)}</p>
      <h3>${escapeHtml(entry.name)}</h3>
      <p>${escapeHtml(shortText(entry.description, 120))}</p>
      <div class="glossary-tags">
        ${(entry.tags || []).map((tag) => `<span class="badge">${escapeHtml(tag)}</span>`).join("")}
      </div>
    </article>
  `;
}

function renderGlossaryDetail(entry, state, findCharacter) {
  return `
    <article class="glossary-detail" style="${paletteStyle(entry.palette)}">
      <div class="glossary-detail-hero">
        <p class="eyebrow">${escapeHtml(entry.category)}</p>
        <h3>${escapeHtml(entry.name)}</h3>
        <p>${escapeHtml(entry.description)}</p>
      </div>
      <div class="item-grid">
        ${renderTextCard("Etiquetes", (entry.tags || []).join(", ") || "Sense etiquetes")}
        ${renderTextCard("Notes", entry.notes || "Sense notes")}
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

function renderGlossaryEditorV2(entry, state) {
  const selectedCharacters = new Set(entry?.characterIds || []);
  const selectedChronicles = new Set(entry?.chronicleIds || []);
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
      <form data-form="glossary" class="editor-form">
        <input type="hidden" name="id" value="${escapeAttribute(entry?.id || "")}" />
        <div class="editor-layout editor-layout-glossary">
          ${renderEditorCard(
            "Fitxa base",
            "Nom, categoria i text descriptiu. Aquest bloc defineix el que es veu al detall i a la targeta.",
            `
              <div class="editor-grid">
                ${renderInputField("name", "Nom", entry?.name || "")}
                <label class="field">
                  <span>Categoria</span>
                  <select name="category">
                    ${["Llocs", "Religió", "Antagonistes", "Entitats", "Faccions", "Objectes", "Monstres", "Races", "Altres"]
                      .map(
                        (category) => `
                          <option value="${category}" ${entry?.category === category ? "selected" : ""}>
                            ${category}
                          </option>
                        `,
                      )
                      .join("")}
                  </select>
                </label>
                ${renderTextareaField("description", "Descripció", entry?.description || "", 5)}
                ${renderInputField("tags", "Etiquetes (separades per comes)", (entry?.tags || []).join(", "))}
                ${renderTextareaField("notes", "Notes", entry?.notes || "", 5)}
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
