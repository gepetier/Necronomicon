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

const ABILITY_DEFINITIONS = [
  { key: "for", source: "For", label: "Força", shortLabel: "FOR", skills: ["Atletisme"] },
  { key: "des", source: "Des", label: "Destresa", shortLabel: "DES", skills: ["Acrobàcies", "Joc de mans", "Sigil"] },
  { key: "con", source: "Con", label: "Constitució", shortLabel: "CON", skills: [] },
  { key: "int", source: "Int", label: "Intel·ligència", shortLabel: "INT", skills: ["Arcà", "Història", "Investigació", "Natura", "Religió"] },
  { key: "sav", source: "Sav", label: "Saviesa", shortLabel: "SAV", skills: ["Percepció", "Perspicàcia", "Supervivència", "Medicina", "Tracte amb animals"] },
  { key: "car", source: "Car", label: "Carisma", shortLabel: "CAR", skills: ["Engany", "Intimidació", "Interpretació", "Persuasió"] },
];

export function renderCharactersModule({
  state,
  rootEl,
  getSelectedCharacter,
  getViewStateLabel,
  shouldShowCharacterReturnFab,
  renderPlayerNotesPanel,
  renderPlayerNotesFab,
  canEditCharacter = () => true,
  canEditAnyCharacter = true,
}) {
  if (state.ui.showCharacterGrid) {
    const editableCharacters = state.characters.filter((character) => canEditCharacter(character));
    rootEl.innerHTML = `
      <section class="module-surface module-surface-characters">
        <div class="module-section-header">
          <div class="module-section-copy">
            <p class="eyebrow">Companyia activa</p>
            <h3>Personatges de campanya</h3>
            <p>Obre una carta o entra directament a l'editor de la fitxa seleccionada.</p>
          </div>
          ${editableCharacters.length ? `<div class="module-inline-actions">
            <button type="button" class="secondary module-edit-button" data-open-character-editor>
              <span class="module-action-icon">${renderModuleActionIcon("characters")}</span>
              <span>${state.ui.editModes.characters ? "Continua edició" : canEditAnyCharacter ? "Edita fitxes" : "Edita la teva fitxa"}</span>
            </button>
          </div>` : ""}
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
    renderCharactersModule({
      state,
      rootEl,
      getSelectedCharacter,
      getViewStateLabel,
      shouldShowCharacterReturnFab,
      renderPlayerNotesPanel,
      renderPlayerNotesFab,
      canEditCharacter,
      canEditAnyCharacter,
    });
    return;
  }
  const returnLabel = shouldShowCharacterReturnFab?.(character.id) ? getViewStateLabel?.(state.ui.glossaryReturnView) : "";
  const canEditCurrentCharacter = canEditCharacter(character);

  rootEl.innerHTML = `
    <section class="detail-card ${state.ui.notesPanelOpen ? "notes-open" : ""}">
      ${returnLabel ? renderCharacterReturnChip(returnLabel) : ""}
      <div class="detail-header-actions">
        <button id="backToGridButtonInline" type="button" class="secondary" data-back-to-grid>
          Torna a les cartes
        </button>
        ${canEditCurrentCharacter ? `<button
          type="button"
          class="secondary module-edit-button"
          data-toggle-edit="characters"
          aria-pressed="${state.ui.editModes.characters ? "true" : "false"}"
        >
          <span class="module-action-icon">${renderModuleActionIcon("characters")}</span>
          <span>${state.ui.editModes.characters ? "Tanca edició" : "Edita fitxa"}</span>
        </button>` : ""}
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
          ${state.ui.editModes.characters && canEditCurrentCharacter ? renderCharacterEditor(character, state.ui.selectedCharacterTab, state) : ""}
        </div>
      </div>
      ${renderPlayerNotesPanel()}
      ${renderPlayerNotesFab()}
      ${state.ui.editModes.characters && canEditCurrentCharacter ? `<div class="editor-actions">
        <button type="button" data-save-character>Desa personatge</button>
      </div>` : ""}
    </section>
  `;
}

function renderCharacterReturnChip(targetLabel) {
  return `
    <button
      type="button"
      class="secondary glossary-return-chip character-return-chip"
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
    return renderDndSheetTab(character);
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

function renderDndSheetTab(character) {
  const abilities = parseAbilityScores(character.sheet.abilities);
  const dexterityMod = getAbilityModifier(abilities.des);
  const wisdomMod = getAbilityModifier(abilities.sav);
  const spellcasting = resolveSpellcasting(character, abilities);

  return `
    <article class="dnd-sheet" aria-label="${escapeAttribute(`Fitxa D&D de ${character.name}`)}">
      <header class="dnd-sheet-header">
        <div>
          <p class="eyebrow">Fitxa de personatge</p>
          <h3>${escapeHtml(character.name)}</h3>
        </div>
        <div class="dnd-sheet-identity">
          <span>${escapeHtml(character.className)}</span>
          <span>Nivell ${escapeHtml(String(character.level))}</span>
          <span>${escapeHtml(character.lineage)}</span>
        </div>
      </header>

      <div class="dnd-sheet-grid">
        <section class="dnd-ability-column" aria-label="Puntuacions d'atribut">
          ${ABILITY_DEFINITIONS.map((ability) => renderAbilityScoreBox(ability, abilities[ability.key])).join("")}
        </section>

        <section class="dnd-panel dnd-saving-panel">
          <h4>Tirades de salvació</h4>
          <div class="dnd-save-list">
            ${ABILITY_DEFINITIONS.map((ability) => renderCheckLine(ability.label, getAbilityModifier(abilities[ability.key]))).join("")}
          </div>
          <div class="dnd-passive">
            <strong>${escapeHtml(String(10 + wisdomMod))}</strong>
            <span>Percepció passiva</span>
          </div>
          <h4>Habilitats</h4>
          <div class="dnd-skill-list">
            ${ABILITY_DEFINITIONS.flatMap((ability) => ability.skills.map((skill) => renderCheckLine(skill, getAbilityModifier(abilities[ability.key]), ability.shortLabel))).join("")}
          </div>
        </section>

        <section class="dnd-panel dnd-combat-panel">
          <div class="dnd-combat-stats">
            ${renderCombatStat("CA", character.sheet.ac, "Classe d'armadura")}
            ${renderCombatStat("Inic.", formatModifier(dexterityMod), "Iniciativa")}
            ${renderCombatStat("Vel.", "30", "Peus")}
          </div>
          <div class="dnd-hit-points">
            <span>Punts de vida màxims</span>
            <strong>${escapeHtml(character.sheet.hp)}</strong>
          </div>
          <div class="dnd-resource-grid">
            <div>
              <span>Daus de cop</span>
              <strong>${escapeHtml(`${character.level}d8`)}</strong>
            </div>
            <div>
              <span>Proficiència</span>
              <strong>${escapeHtml(character.sheet.proficiency)}</strong>
            </div>
          </div>
          <div class="dnd-death-saves" aria-label="Salvacions contra mort">
            <span>Salvacions contra mort</span>
            <div><strong>Èxits</strong><i></i><i></i><i></i></div>
            <div><strong>Fallades</strong><i></i><i></i><i></i></div>
          </div>
        </section>

        <section class="dnd-panel dnd-attacks-panel">
          <h4>Atacs i conjurs</h4>
          <div class="dnd-attack-table">
            <div><span>Nom</span><span>Bonif.</span><span>Dany / tipus</span></div>
            ${renderAttackRow(character)}
            ${spellcasting ? renderSpellAttackRow(spellcasting) : ""}
          </div>
          <h4>Trets i capacitats</h4>
          <div class="rich-text dnd-lined-text">${renderRichText(character.sheet.features)}</div>
        </section>

        <section class="dnd-panel dnd-equipment-panel">
          <h4>Equipament</h4>
          <div class="rich-text dnd-lined-text">${renderRichText(character.inventory.items)}</div>
          <div class="dnd-currency">${escapeHtml(character.inventory.currency || "Sense moneda registrada")}</div>
        </section>

        ${spellcasting ? `
          <section class="dnd-panel dnd-spell-panel">
            <h4>Conjuració</h4>
            <div class="dnd-resource-grid">
              <div>
                <span>Atribut</span>
                <strong>${escapeHtml(spellcasting.label)}</strong>
              </div>
              <div>
                <span>CD salvació</span>
                <strong>${escapeHtml(String(spellcasting.saveDc))}</strong>
              </div>
              <div>
                <span>Atac de conjur</span>
                <strong>${escapeHtml(formatModifier(spellcasting.attackBonus))}</strong>
              </div>
            </div>
          </section>
        ` : ""}
      </div>
    </article>
  `;
}

function renderAbilityScoreBox(ability, score) {
  const modifier = getAbilityModifier(score);
  return `
    <div class="dnd-ability-score">
      <span>${escapeHtml(ability.shortLabel)}</span>
      <strong>${escapeHtml(formatModifier(modifier))}</strong>
      <em>${escapeHtml(String(score || 10))}</em>
    </div>
  `;
}

function renderCombatStat(label, value, helper) {
  return `
    <div class="dnd-combat-stat">
      <strong>${escapeHtml(String(value || "-"))}</strong>
      <span>${escapeHtml(label)}</span>
      <small>${escapeHtml(helper)}</small>
    </div>
  `;
}

function renderCheckLine(label, modifier, suffix = "") {
  return `
    <div class="dnd-check-line">
      <i aria-hidden="true"></i>
      <strong>${escapeHtml(formatModifier(modifier))}</strong>
      <span>${escapeHtml(label)}</span>
      ${suffix ? `<em>${escapeHtml(suffix)}</em>` : ""}
    </div>
  `;
}

function renderAttackRow(character) {
  const abilities = parseAbilityScores(character.sheet.abilities);
  const strengthMod = getAbilityModifier(abilities.for);
  const dexterityMod = getAbilityModifier(abilities.des);
  const attackMod = Math.max(strengthMod, dexterityMod);
  const proficiency = parseSignedNumber(character.sheet.proficiency);
  const attackName = character.className.toLowerCase().includes("mag") ? "Bastó / daga" : "Arma principal";
  return `
    <div>
      <strong>${escapeHtml(attackName)}</strong>
      <strong>${escapeHtml(formatModifier(attackMod + proficiency))}</strong>
      <span>1d8 ${escapeHtml(formatModifier(attackMod))}</span>
    </div>
  `;
}

function renderSpellAttackRow(spellcasting) {
  return `
    <div>
      <strong>Conjur ofensiu</strong>
      <strong>${escapeHtml(formatModifier(spellcasting.attackBonus))}</strong>
      <span>Segons conjur</span>
    </div>
  `;
}

function parseAbilityScores(value) {
  const scores = {};
  ABILITY_DEFINITIONS.forEach((ability) => {
    const pattern = new RegExp(`${ability.source}\\s*(\\d+)`, "i");
    const match = String(value || "").match(pattern);
    scores[ability.key] = match ? Number(match[1]) : 10;
  });
  return scores;
}

function getAbilityModifier(score) {
  return Math.floor(((Number(score) || 10) - 10) / 2);
}

function formatModifier(value) {
  const number = Number(value) || 0;
  return number >= 0 ? `+${number}` : String(number);
}

function parseSignedNumber(value) {
  const match = String(value || "").match(/[+-]?\d+/);
  return match ? Number(match[0]) : 0;
}

function resolveSpellcasting(character, abilities) {
  const className = String(character.className || "").toLowerCase();
  const spellAbilityKey = className.includes("bard") || className.includes("palad")
    ? "car"
    : className.includes("mag")
      ? "int"
      : className.includes("clerg") || className.includes("druid") || className.includes("explor")
        ? "sav"
        : "";
  if (!spellAbilityKey) {
    return null;
  }

  const ability = ABILITY_DEFINITIONS.find((item) => item.key === spellAbilityKey);
  const abilityMod = getAbilityModifier(abilities[spellAbilityKey]);
  const proficiency = parseSignedNumber(character.sheet.proficiency);
  return {
    label: ability?.shortLabel || spellAbilityKey.toUpperCase(),
    saveDc: 8 + proficiency + abilityMod,
    attackBonus: proficiency + abilityMod,
  };
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
