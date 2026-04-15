import {
  characterTabLabel,
  escapeAttribute,
  escapeHtml,
  paletteStyle,
  readString,
  renderEditorActions,
  renderEditorCard,
  renderEditorWorkspaceHeader,
  renderInputField,
  renderTextCard,
  renderTextareaField,
  shortText,
} from "./utils.js";

export function renderCharactersModule({ state, rootEl, getSelectedCharacter }) {
  if (state.ui.showCharacterGrid) {
    rootEl.innerHTML = `
      <section class="module-surface">
        <div class="character-grid">
          ${state.characters.map(renderCharacterCard).join("")}
        </div>
      </section>
    `;
    return;
  }

  const character = getSelectedCharacter();
  if (!character) {
    state.ui.showCharacterGrid = true;
    renderCharactersModule({ state, rootEl, getSelectedCharacter });
    return;
  }

  rootEl.innerHTML = `
    <section class="detail-card">
      <div class="detail-header-actions">
        <button id="backToGridButtonInline" type="button" class="secondary" data-back-to-grid>
          Torna a les cartes
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
            <p>${escapeHtml(character.summary)}</p>
            <div class="card-tags">
              <span class="badge">Nivell ${escapeHtml(String(character.level))}</span>
              <span class="badge">${escapeHtml(character.lineage)}</span>
              <span class="badge">${escapeHtml(character.className)}</span>
            </div>
          </div>
          <div class="section-card">
            <p class="eyebrow">Capacitats ràpides</p>
            <p>${escapeHtml(character.quickNotes)}</p>
          </div>
          <div class="tab-strip">
            ${["lore", "sheet", "inventory", "history"]
              .map(
                (tab) => `
                  <button
                    type="button"
                    class="tab-button ${state.ui.selectedCharacterTab === tab ? "active" : ""}"
                    data-character-tab="${tab}"
                  >
                    ${characterTabLabel(tab)}
                  </button>
                `,
              )
              .join("")}
          </div>
          ${renderCharacterTabContent(character, state.ui.selectedCharacterTab)}
          ${state.ui.isEditMode ? renderCharacterEditorV2(character, state.ui.selectedCharacterTab) : ""}
        </div>
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

function renderCharacterCard(character) {
  return `
    <article
      class="character-card"
      data-character-card="${character.id}"
      style="${paletteStyle(character.palette)}"
    >
      <div class="card-portrait ${character.portrait ? "has-image" : ""}" data-mark="${escapeHtml(character.sigil)}">
        ${character.portrait
          ? `<img class="portrait-media" src="${escapeAttribute(character.portrait)}" alt="${escapeAttribute(`Retrat de ${character.name}`)}" loading="lazy" />`
          : ""}
        <div class="portrait-badge">${escapeHtml(character.sigil)}</div>
      </div>
      <p class="eyebrow">${escapeHtml(character.lineage)} · ${escapeHtml(character.className)}</p>
      <h3>${escapeHtml(character.name)}</h3>
      <p>${escapeHtml(character.title)}</p>
      <div class="card-tags">
        <span class="badge">Nivell ${escapeHtml(String(character.level))}</span>
        <span class="badge">${escapeHtml(shortText(character.quickNotes, 42))}</span>
      </div>
    </article>
  `;
}

function renderCharacterTabContent(character, tab) {
  if (tab === "lore") {
    return `
      ${renderTextCard("Origen", character.lore.origin)}
      ${renderTextCard("Vincles", character.lore.bonds)}
      ${renderTextCard("Secrets", character.lore.secrets)}
      ${renderTextCard("Objectius", character.lore.goals)}
      ${renderTextCard("Ferides", character.lore.wounds)}
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
        <p><strong>Atributs:</strong> ${escapeHtml(character.sheet.abilities)}</p>
        <p><strong>Trets:</strong> ${escapeHtml(character.sheet.features)}</p>
      </article>
    `;
  }

  if (tab === "inventory") {
    return `
      ${renderTextCard("Objectes", character.inventory.items)}
      ${renderTextCard("Moneda", character.inventory.currency)}
      ${renderTextCard("Artefactes", character.inventory.artifacts)}
      ${renderTextCard("Notes", character.inventory.notes)}
    `;
  }

  return `
    <article class="section-card">
      <p class="eyebrow">Història personal</p>
      <p>${escapeHtml(character.history)}</p>
    </article>
  `;
}

function renderCharacterTabEditor(character, tab) {
  if (tab === "lore") {
    return `
      ${renderTextareaField("origin", "Origen", character.lore.origin)}
      ${renderTextareaField("bonds", "Vincles", character.lore.bonds)}
      ${renderTextareaField("secrets", "Secrets", character.lore.secrets)}
      ${renderTextareaField("goals", "Objectius", character.lore.goals)}
      ${renderTextareaField("wounds", "Ferides", character.lore.wounds)}
    `;
  }

  if (tab === "sheet") {
    return `
      ${renderInputField("ac", "CA", character.sheet.ac)}
      ${renderInputField("hp", "HP", character.sheet.hp)}
      ${renderInputField("proficiency", "Proficiència", character.sheet.proficiency)}
      ${renderTextareaField("abilities", "Atributs", character.sheet.abilities)}
      ${renderTextareaField("features", "Capacitats i trets", character.sheet.features)}
    `;
  }

  if (tab === "inventory") {
    return `
      ${renderTextareaField("items", "Objectes", character.inventory.items)}
      ${renderInputField("currency", "Moneda", character.inventory.currency)}
      ${renderTextareaField("artifacts", "Artefactes", character.inventory.artifacts)}
      ${renderTextareaField("notes", "Notes", character.inventory.notes)}
    `;
  }

  return renderTextareaField("history", "Història personal", character.history);
}

function renderCharacterEditorV2(character, tab) {
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
                  <input name="name" value="${escapeAttribute(character.name)}" />
                </label>
                <label class="field">
                  <span>Títol</span>
                  <input name="title" value="${escapeAttribute(character.title)}" />
                </label>
                <label class="field">
                  <span>Llinatge / raça</span>
                  <input name="lineage" value="${escapeAttribute(character.lineage)}" />
                </label>
                <label class="field">
                  <span>Classe</span>
                  <input name="className" value="${escapeAttribute(character.className)}" />
                </label>
                <label class="field">
                  <span>Nivell</span>
                  <input name="level" type="number" min="1" max="20" value="${escapeAttribute(String(character.level))}" />
                </label>
                <label class="field">
                  <span>Sigil</span>
                  <input name="sigil" maxlength="2" value="${escapeAttribute(character.sigil)}" />
                </label>
                <label class="field span-2">
                  <span>Resum curt</span>
                  <textarea name="summary" rows="4">${escapeHtml(character.summary)}</textarea>
                </label>
                <label class="field span-2">
                  <span>Capacitats ràpides</span>
                  <textarea name="quickNotes" rows="4">${escapeHtml(character.quickNotes)}</textarea>
                </label>
              </div>
              ${renderEditorActions("Desa capçalera")}
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
                ${renderCharacterTabEditor(character, tab)}
              </div>
              ${renderEditorActions(`Desa ${characterTabLabel(tab).toLowerCase()}`)}
            </form>
          `,
        )}
      </div>
    </section>
  `;
}
