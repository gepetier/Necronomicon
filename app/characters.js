import {
  characterTabLabel,
  escapeAttribute,
  escapeHtml,
  paletteStyle,
  plainTextFromRichText,
  readString,
  renderModuleActionIcon,
  renderEditorCard,
  renderEditorWorkspaceHeader,
  renderInputField,
  renderRichText,
  renderRichTextareaField,
  renderStatusPills,
  renderTextCard,
  shortText,
} from "./utils.js";

export function renderCharactersModule({
  state,
  rootEl,
  getSelectedCharacter,
  renderPlayerNotesPanel,
  renderPlayerNotesFab,
}) {
  if (state.ui.showCharacterGrid) {
    rootEl.innerHTML = `
      <section class="module-surface module-surface-characters">
        <div class="module-section-header">
          <div class="module-section-copy">
            <p class="eyebrow">Companyia activa</p>
            <h3>Personatges de campanya</h3>
            <p>Obre una carta o entra directament a l'editor de la fitxa seleccionada.</p>
          </div>
          <div class="module-inline-actions">
            <button type="button" class="secondary module-edit-button" data-open-character-editor>
              <span class="module-action-icon">${renderModuleActionIcon("characters")}</span>
              <span>${state.ui.editModes.characters ? "Continua edició" : "Edita fitxes"}</span>
            </button>
          </div>
        </div>
        <div class="character-grid">
          ${state.characters.map((character) => renderCharacterCard(character, state)).join("")}
        </div>
      </section>
    `;
    return;
  }

  const character = getSelectedCharacter();
  if (!character) {
    state.ui.showCharacterGrid = true;
    renderCharactersModule({ state, rootEl, getSelectedCharacter, renderPlayerNotesPanel, renderPlayerNotesFab });
    return;
  }

  rootEl.innerHTML = `
    <section class="detail-card ${state.ui.notesPanelOpen ? "notes-open" : ""}">
      <div class="detail-header-actions">
        <button id="backToGridButtonInline" type="button" class="secondary" data-back-to-grid>
          Torna a les cartes
        </button>
        <button
          type="button"
          class="secondary module-edit-button"
          data-toggle-edit="characters"
          aria-pressed="${state.ui.editModes.characters ? "true" : "false"}"
        >
          <span class="module-action-icon">${renderModuleActionIcon("characters")}</span>
          <span>${state.ui.editModes.characters ? "Tanca edició" : "Edita fitxa"}</span>
        </button>
      </div>
      <div class="detail-grid">
        <div class="detail-portrait" style="${paletteStyle(character.palette)}">
          ${character.portrait
            ? `<img class="detail-portrait-media" src="${escapeAttribute(character.portrait)}" alt="${escapeAttribute(`Retrat de ${character.name}`)}" loading="lazy" />`
            : ""}
          <div class="detail-portrait-inner">
            <p class="eyebrow">${escapeHtml(character.lineage)} · ${escapeHtml(character.className)}</p>
            <h3>${escapeHtml(character.name)}</h3>
            <p>${escapeHtml(character.title)}</p>
          </div>
        </div>
        <div class="detail-summary">
          <div class="parchment-block">
            <p class="eyebrow">Resum</p>
            <h3>${escapeHtml(character.name)}</h3>
            <div class="rich-text">${renderRichText(character.summary)}</div>
            <div class="card-tags">
              <span class="badge">Nivell ${escapeHtml(String(character.level))}</span>
              <span class="badge">${escapeHtml(character.lineage)}</span>
              <span class="badge">${escapeHtml(character.className)}</span>
            </div>
          </div>
          <div class="section-card">
            <p class="eyebrow">Capacitats ràpides</p>
            <div class="rich-text">${renderRichText(character.quickNotes)}</div>
          </div>
          <div class="tab-strip" role="tablist" aria-label="Seccions del personatge">
            ${["lore", "sheet", "inventory", "history"]
              .map(
                (tab) => `
                  <button
                    type="button"
                    class="tab-button ${state.ui.selectedCharacterTab === tab ? "active" : ""}"
                    data-character-tab="${tab}"
                    id="character-tab-${tab}"
                    role="tab"
                    aria-selected="${state.ui.selectedCharacterTab === tab ? "true" : "false"}"
                    aria-controls="character-tab-panel"
                    tabindex="${state.ui.selectedCharacterTab === tab ? "0" : "-1"}"
                  >
                    ${characterTabLabel(tab)}
                  </button>
                `,
              )
              .join("")}
          </div>
          <div
            id="character-tab-panel"
            class="detail-tab-panel"
            role="tabpanel"
            aria-labelledby="character-tab-${state.ui.selectedCharacterTab}"
          >
            ${renderCharacterTabContent(character, state.ui.selectedCharacterTab)}
          </div>
          ${state.ui.editModes.characters ? renderCharacterEditor(character, state.ui.selectedCharacterTab, state) : ""}
        </div>
      </div>
      ${renderPlayerNotesPanel()}
      ${renderPlayerNotesFab()}
      <div class="editor-actions">
        <button type="button" data-save-character>Desa personatge</button>
      </div>
    </section>
  `;
}

export function saveCharacterOverview(formData, { getSelectedCharacter, showSaveNotice }) {
  const character = getSelectedCharacter();
  if (!character) {
    return;
  }

  character.name = readString(formData, "name");
  character.title = readString(formData, "title");
  character.lineage = readString(formData, "lineage");
  character.className = readString(formData, "className");
  character.level = Number(readString(formData, "level")) || 1;
  character.sigil = readString(formData, "sigil").slice(0, 2) || character.sigil;
  character.summary = readString(formData, "summary");
  character.quickNotes = readString(formData, "quickNotes");
  showSaveNotice("Capçalera desada");
}

export function saveCharacterTab(formData, { getSelectedCharacter, showSaveNotice }) {
  const character = getSelectedCharacter();
  if (!character) {
    return;
  }

  const tab = readString(formData, "tab");
  if (tab === "lore") {
    character.lore.origin = readString(formData, "origin");
    character.lore.bonds = readString(formData, "bonds");
    character.lore.secrets = readString(formData, "secrets");
    character.lore.goals = readString(formData, "goals");
    character.lore.wounds = readString(formData, "wounds");
  }

  if (tab === "sheet") {
    character.sheet.ac = readString(formData, "ac");
    character.sheet.hp = readString(formData, "hp");
    character.sheet.proficiency = readString(formData, "proficiency");
    character.sheet.abilities = readString(formData, "abilities");
    character.sheet.features = readString(formData, "features");
  }

  if (tab === "inventory") {
    character.inventory.items = readString(formData, "items");
    character.inventory.currency = readString(formData, "currency");
    character.inventory.artifacts = readString(formData, "artifacts");
    character.inventory.notes = readString(formData, "notes");
  }

  if (tab === "history") {
    character.history = readString(formData, "history");
  }

  showSaveNotice(`Secció ${characterTabLabel(tab).toLowerCase()} desada`);
}

function renderCharacterCard(character, state) {
  const hasOverviewDraft = Object.keys(state.ui.drafts.characters.overview[character.id] || {}).length > 0;
  const hasTabDraft = Object.keys(state.ui.drafts.characters.tabs[character.id] || {}).length > 0;
  const statusPills = [];

  if (hasOverviewDraft || hasTabDraft) {
    statusPills.push({ label: "Esborrany", tone: "draft" });
  }

  if (state.ui.editModes.characters && state.ui.selectedCharacterId === character.id) {
    statusPills.push({ label: "En edició", tone: "editing" });
  }

  return `
    <article
      class="character-card"
      data-character-card="${character.id}"
      tabindex="0"
      role="button"
      aria-label="${escapeAttribute(`Obre la fitxa de ${character.name}`)}"
      style="${paletteStyle(character.palette)}"
    >
      ${renderStatusPills(statusPills)}
      <div class="card-portrait ${character.portrait ? "has-image" : ""}" data-mark="${escapeHtml(character.sigil)}">
        ${character.portrait
          ? `<img class="portrait-media" src="${escapeAttribute(character.portrait)}" alt="${escapeAttribute(`Retrat de ${character.name}`)}" loading="lazy" />`
          : ""}
        <div class="portrait-badge">${escapeHtml(character.sigil)}</div>
      </div>
      <div class="character-card-copy">
        <p class="eyebrow">${escapeHtml(character.lineage)} · ${escapeHtml(character.className)}</p>
        <h3>${escapeHtml(character.name)}</h3>
        <p class="character-card-title">${escapeHtml(character.title)}</p>
        <p class="character-card-summary">${escapeHtml(shortText(plainTextFromRichText(character.summary), 124))}</p>
        <div class="card-tags">
          <span class="badge">Nivell ${escapeHtml(String(character.level))}</span>
          <span class="badge">${escapeHtml(shortText(plainTextFromRichText(character.quickNotes), 42))}</span>
        </div>
      </div>
    </article>
  `;
}

function renderCharacterTabContent(character, tab) {
  if (tab === "lore") {
    return `
      ${renderTextCard("Origen", character.lore.origin, { rich: true })}
      ${renderTextCard("Vincles", character.lore.bonds, { rich: true })}
      ${renderTextCard("Secrets", character.lore.secrets, { rich: true })}
      ${renderTextCard("Objectius", character.lore.goals, { rich: true })}
      ${renderTextCard("Ferides", character.lore.wounds, { rich: true })}
    `;
  }

  if (tab === "sheet") {
    return `
      <article class="section-card">
        <p class="eyebrow">Fitxa ràpida</p>
        <div class="stats-row">
          <div class="stat-chip"><span>CA</span><strong>${escapeHtml(character.sheet.ac)}</strong></div>
          <div class="stat-chip"><span>HP</span><strong>${escapeHtml(character.sheet.hp)}</strong></div>
          <div class="stat-chip"><span>Proficiència</span><strong>${escapeHtml(character.sheet.proficiency)}</strong></div>
        </div>
        <div class="rich-text"><p><strong>Atributs:</strong></p>${renderRichText(character.sheet.abilities)}</div>
        <div class="rich-text"><p><strong>Trets:</strong></p>${renderRichText(character.sheet.features)}</div>
      </article>
    `;
  }

  if (tab === "inventory") {
    return `
      ${renderTextCard("Objectes", character.inventory.items, { rich: true })}
      ${renderTextCard("Moneda", character.inventory.currency)}
      ${renderTextCard("Artefactes", character.inventory.artifacts, { rich: true })}
      ${renderTextCard("Notes", character.inventory.notes, { rich: true })}
    `;
  }

  return `
    <article class="section-card">
      <p class="eyebrow">Història personal</p>
      <div class="rich-text">${renderRichText(character.history)}</div>
    </article>
  `;
}

function renderCharacterEditor(character, tab, state) {
  const overviewDraft = state.ui.drafts.characters.overview[character.id] || {};
  const tabDraft = state.ui.drafts.characters.tabs[character.id]?.[tab] || {};
  const hasPendingDraft = Object.keys(overviewDraft).length > 0 || Object.keys(tabDraft).length > 0;
  const editorStatus = renderEditorStatus(state, "characters", character.id, hasPendingDraft);

  return `
    <section class="module-surface editor-workspace editor-workspace-character">
      ${renderEditorWorkspaceHeader(
        "Edició de personatge",
        character.name,
        "La capçalera controla la carta i el resum. La segona columna segueix la pestanya oberta per reduir scroll i soroll visual.",
        [
          `Nivell ${character.level}`,
          `${character.lineage} · ${character.className}`,
          `Pestanya ${characterTabLabel(tab)}`,
        ],
      )}
      ${editorStatus}
      <div class="editor-layout editor-layout-character">
        ${renderEditorCard(
          "Capçalera i identitat",
          "Aquesta part defineix la primera impressió del personatge al compendi.",
          `
            <form data-form="character-overview" class="editor-form">
              <input type="hidden" name="id" value="${character.id}" />
              <div class="editor-grid">
                <label class="field">
                  <span>Nom</span>
                  <input name="name" value="${escapeAttribute(readDraftValue(overviewDraft.name, character.name))}" />
                </label>
                <label class="field">
                  <span>Títol</span>
                  <input name="title" value="${escapeAttribute(readDraftValue(overviewDraft.title, character.title))}" />
                </label>
                <label class="field">
                  <span>Llinatge / raça</span>
                  <input name="lineage" value="${escapeAttribute(readDraftValue(overviewDraft.lineage, character.lineage))}" />
                </label>
                <label class="field">
                  <span>Classe</span>
                  <input name="className" value="${escapeAttribute(readDraftValue(overviewDraft.className, character.className))}" />
                </label>
                <label class="field">
                  <span>Nivell</span>
                  <input
                    name="level"
                    type="number"
                    min="1"
                    max="20"
                    value="${escapeAttribute(readDraftValue(overviewDraft.level, String(character.level)))}"
                  />
                </label>
                <label class="field">
                  <span>Sigil</span>
                  <input name="sigil" maxlength="2" value="${escapeAttribute(readDraftValue(overviewDraft.sigil, character.sigil))}" />
                </label>
                ${renderRichTextareaField("summary", "Resum curt", readDraftValue(overviewDraft.summary, character.summary), 4)}
                ${renderRichTextareaField("quickNotes", "Capacitats ràpides", readDraftValue(overviewDraft.quickNotes, character.quickNotes), 4)}
              </div>
            </form>
          `,
        )}
        ${renderEditorCard(
          `Pestanya activa: ${characterTabLabel(tab)}`,
          "Només edites el fragment que estàs consultant. La resta del personatge queda fora del focus.",
          `
            <form data-form="character-tab" class="editor-form">
              <input type="hidden" name="id" value="${character.id}" />
              <input type="hidden" name="tab" value="${tab}" />
              <div class="editor-grid">
                ${renderCharacterTabEditor(character, tab, tabDraft)}
              </div>
            </form>
          `,
        )}
      </div>
    </section>
  `;
}

function renderCharacterTabEditor(character, tab, draft) {
  if (tab === "lore") {
    return `
      ${renderRichTextareaField("origin", "Origen", readDraftValue(draft.origin, character.lore.origin), 4)}
      ${renderRichTextareaField("bonds", "Vincles", readDraftValue(draft.bonds, character.lore.bonds), 4)}
      ${renderRichTextareaField("secrets", "Secrets", readDraftValue(draft.secrets, character.lore.secrets), 4)}
      ${renderRichTextareaField("goals", "Objectius", readDraftValue(draft.goals, character.lore.goals), 4)}
      ${renderRichTextareaField("wounds", "Ferides", readDraftValue(draft.wounds, character.lore.wounds), 4)}
    `;
  }

  if (tab === "sheet") {
    return `
      ${renderInputField("ac", "CA", readDraftValue(draft.ac, character.sheet.ac))}
      ${renderInputField("hp", "HP", readDraftValue(draft.hp, character.sheet.hp))}
      ${renderInputField("proficiency", "Proficiència", readDraftValue(draft.proficiency, character.sheet.proficiency))}
      ${renderRichTextareaField("abilities", "Atributs", readDraftValue(draft.abilities, character.sheet.abilities), 4)}
      ${renderRichTextareaField("features", "Capacitats i trets", readDraftValue(draft.features, character.sheet.features), 4)}
    `;
  }

  if (tab === "inventory") {
    return `
      ${renderRichTextareaField("items", "Objectes", readDraftValue(draft.items, character.inventory.items), 4)}
      ${renderInputField("currency", "Moneda", readDraftValue(draft.currency, character.inventory.currency))}
      ${renderRichTextareaField("artifacts", "Artefactes", readDraftValue(draft.artifacts, character.inventory.artifacts), 4)}
      ${renderRichTextareaField("notes", "Notes", readDraftValue(draft.notes, character.inventory.notes), 4)}
    `;
  }

  return renderRichTextareaField("history", "Història personal", readDraftValue(draft.history, character.history), 6);
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
