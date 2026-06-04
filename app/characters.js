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

const SAVAGE_ATTRIBUTE_DEFINITIONS = [
  { key: "agilitat", label: "Agilitat" },
  { key: "astucia", label: "Astucia" },
  { key: "esperit", label: "Esperit" },
  { key: "forca", label: "Forca" },
  { key: "vigor", label: "Vigor" },
];

const SAVAGE_CONCEPTS = {
  bennies: {
    title: "Bennies",
    summary: "Fitxes de sort. Normalment serveixen per repetir tirades, resistir dany o activar opcions concretes.",
    tip: "A taula han de pujar i baixar ràpid; per això són clicables.",
  },
  shaken: {
    title: "Atordit / Shaken",
    summary: "Estat de pressió o impacte. El personatge ha de recuperar-se abans d'actuar amb normalitat.",
    tip: "Marca'l quan algú queda sacsejat però no necessàriament ferit.",
  },
  wounds: {
    title: "Ferides",
    summary: "Dany persistent. Cada ferida penalitza les tirades de tret i fa el personatge més vulnerable.",
    tip: "Tres ferides és el límit habitual abans que la situació sigui crítica.",
  },
  fatigue: {
    title: "Fatiga",
    summary: "Esgotament, fred, set, verí o pressió continuada. Penalitza com les ferides però té una pista pròpia.",
    tip: "Dues fatigues deixen el personatge en molt mal estat.",
  },
  pace: {
    title: "Pas / Pace",
    summary: "Moviment base en combat tàctic. Serveix per saber quantes polzades o caselles pot moure el personatge.",
    tip: "Les ferides poden reduir-lo segons situació i regles aplicades.",
  },
  parry: {
    title: "Parada",
    summary: "Número objectiu per impactar el personatge en combat cos a cos.",
    tip: "Pensa-hi com la defensa melee, no com una armadura.",
  },
  toughness: {
    title: "Duresa",
    summary: "Llindar que el dany ha de superar per sacsejar o ferir el personatge.",
    tip: "La xifra entre parèntesi sol representar armadura o protecció.",
  },
  trait: {
    title: "Trait",
    summary: "Atribut o habilitat expressat com a dau: d4, d6, d8, d10 o d12.",
    tip: "En una tirada de jugador normalment també hi entra el Wild Die.",
  },
  wildDie: {
    title: "Wild Die",
    summary: "Dau extra dels protagonistes. Es tira junt amb el dau de tret i es conserva el millor resultat.",
    tip: "És una de les coses que separa Wild Cards d'extres.",
  },
  raise: {
    title: "Raise",
    summary: "Resultat que supera l'objectiu per 4 o més. Normalment millora l'efecte.",
    tip: "És el motiu pel qual veure el número objectiu importa.",
  },
  penalty: {
    title: "Penalitzacio",
    summary: "Modificador negatiu que surt de ferides i fatiga. La fitxa el calcula i l'aplica a habilitats i accions.",
    tip: "Si el marcador canvia, els valors efectius canvien sols.",
  },
  armor: {
    title: "Armadura",
    summary: "Proteccio equipada que suma a la duresa o a altres defenses si la linia ho indica.",
    tip: "Marca quina armadura portes i la fitxa recalcula el nucli.",
  },
  equipped: {
    title: "Equip actiu",
    summary: "Objectes preparats ara mateix. Les armadures actives sumen estadistiques i les armes actives pugen a accions.",
    tip: "Serveix per canviar de configuracio sense reescriure la fitxa.",
  },
  damage: {
    title: "Dany",
    summary: "Expressio de dany o efecte de l'arma. La fitxa la conserva i la destaca al bloc d'accions.",
    tip: "No tira daus: nomes deixa la dada clara i connectada amb l'arma.",
  },
  range: {
    title: "Rang",
    summary: "Distancia operativa de l'arma o accio quan esta escrita a les notes.",
    tip: "Es detecta automaticament si la linia conte 'Rang 12/24/48'.",
  },
};
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
        <div class="detail-portrait ${character.portrait ? "has-image" : "no-image"}" style="${paletteStyle(character.palette)}">
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
            ${renderCharacterTabContent(character, state.ui.selectedCharacterTab, state)}
          </div>
          ${state.ui.editModes.characters && canEditCurrentCharacter ? renderCharacterEditor(character, state.ui.selectedCharacterTab, state) : ""}
        </div>
      </div>
      ${renderPlayerNotesPanel()}
      ${isSavageWorldsCampaign(state) ? renderPlayerNotesFab({ inline: true }) : renderPlayerNotesFab()}
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

function isSavageWorldsCampaign(state) {
  return String(state?.meta?.system || "").toLowerCase().includes("savage");
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

function renderCharacterTabContent(character, tab, state) {
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
    return isSavageWorldsCampaign(state) ? renderSavageWorldsSheetTab(character) : renderDndSheetTab(character);
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

function renderSavageWorldsSheetTab(character) {
  const sheetData = parseSavageSheetData(character.sheet.abilities);
  const savageState = normalizeSavageState(character.sheet.savageState, character.sheet.proficiency);
  const equipment = parseSavageEquipment(character.inventory.items, sheetData.skills, character.sheet.savageLoadout);
  const derived = calculateSavageDerivedStats(character, sheetData, savageState, equipment);
  const attacks = equipment.weapons.some((weapon) => weapon.equipped)
    ? equipment.weapons.filter((weapon) => weapon.equipped)
    : equipment.weapons;
  return `
    <article class="dnd-sheet savage-sheet" aria-label="${escapeAttribute(`Fitxa Savage Worlds de ${character.name}`)}">
      <header class="dnd-sheet-header savage-sheet-header">
        <div>
          <p class="eyebrow">Fitxa Savage Worlds</p>
          <h3>${escapeHtml(character.name)}</h3>
        </div>
        <div class="dnd-sheet-identity">
          <span>${escapeHtml(character.className)}</span>
          <span>Avenc ${escapeHtml(String(character.level))}</span>
          <span>${escapeHtml(character.lineage)}</span>
        </div>
      </header>

      <section class="savage-play-strip" aria-label="Estat viu de taula">
        ${renderSavageCounter("Bennies", "bennies", savageState.bennies, 0, 9, "Fitxes disponibles")}
        ${renderSavageToggle("Atordit", "shaken", savageState.shaken, "Shaken")}
        ${renderSavageCounter("Ferides", "wounds", savageState.wounds, 0, 3, "-1 per ferida")}
        ${renderSavageCounter("Fatiga", "fatigue", savageState.fatigue, 0, 2, "-1 per fatiga")}
        ${renderSavageStaticStat("Penal.", "penalty", derived.penaltyLabel, "Ferides + fatiga")}
        ${renderSavageStaticStat("Pas", "pace", derived.pace, "Moviment")}
      </section>

      <div class="dnd-sheet-grid savage-sheet-grid">
        <section class="dnd-ability-column savage-attribute-column" aria-label="Atributs Savage Worlds">
          ${SAVAGE_ATTRIBUTE_DEFINITIONS.map((attribute) => renderSavageTraitBox(attribute.label, sheetData.attributes[attribute.key] || "d4", derived.penalty)).join("")}
        </section>

        <section class="dnd-panel savage-core-panel">
          <h4>Nucli de combat ${renderSavageConceptHint("armor")}</h4>
          <div class="dnd-combat-stats">
            ${renderSavageCombatStat("Parada", "parry", derived.parry.total, derived.parry.helper)}
            ${renderSavageCombatStat("Duresa", "toughness", derived.toughness.total, derived.toughness.helper)}
            ${renderSavageCombatStat("Pas", "pace", derived.pace, "Moviment")}
          </div>
          <div class="dnd-hit-points">
            <span>Estat ${renderSavageConceptHint("penalty")}</span>
            <strong>${escapeHtml(formatSavageStatus(savageState))}</strong>
          </div>
          <div class="savage-derived-breakdown">
            <span>Base</span>
            <strong>Parada ${escapeHtml(String(derived.parry.base))} · Duresa ${escapeHtml(String(derived.toughness.base))}</strong>
            <small>${escapeHtml(derived.toughness.armorBonus ? `Armadura +${derived.toughness.armorBonus}` : "Sense armadura activa")}</small>
          </div>
          <div class="dnd-death-saves" aria-label="Ferides i fatiga">
            <span>Marcadors</span>
            <div><strong>Ferides</strong>${renderSavageDots(savageState.wounds, 3)}</div>
            <div><strong>Fatiga</strong>${renderSavageDots(savageState.fatigue, 2)}</div>
          </div>
        </section>

        <section class="dnd-panel savage-skills-panel">
          <h4>Habilitats ${renderSavageConceptHint("trait")} ${renderSavageConceptHint("penalty")}</h4>
          <div class="savage-trait-list">
            ${sheetData.skills.length
              ? sheetData.skills.map((skill) => renderSavageTraitLine(skill.name, skill.die, derived.penalty)).join("")
              : `<p class="empty-state">Afegeix habilitats a Atributs amb format "Disparar d8, Notar d6".</p>`}
          </div>
        </section>

        <section class="dnd-panel savage-attacks-panel">
          <h4>Armes i accions ${renderSavageConceptHint("damage")} ${renderSavageConceptHint("range")}</h4>
          <div class="savage-attack-list">
            ${attacks.length
              ? attacks.map((attack) => renderSavageAttackCard(attack, derived.penalty)).join("")
              : `<p class="empty-state">Afegeix armes a Equipament amb format "Rifle | Disparar d8 | 2d6 | Rang 12/24/48".</p>`}
          </div>
        </section>

        <section class="dnd-panel savage-loadout-panel">
          <h4>Equip intel·ligent ${renderSavageConceptHint("equipped")}</h4>
          ${renderSavageLoadout(equipment)}
        </section>

        <section class="dnd-panel savage-features-panel">
          <h4>Avantatges i complicacions</h4>
          ${renderSavageFeatures(character.sheet.features)}
        </section>

        <section class="dnd-panel dnd-equipment-panel">
          <h4>Equipament</h4>
          <div class="rich-text dnd-lined-text">${renderRichText(character.inventory.items)}</div>
          <div class="dnd-currency">${escapeHtml(character.inventory.currency || "Sense recursos registrats")}</div>
        </section>
      </div>
    </article>
  `;
}

function renderSavageTraitBox(label, die, penalty = 0) {
  return `
    <div class="dnd-ability-score savage-trait-box">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(die)}</strong>
      <em>${escapeHtml(formatSavageEffectiveTrait(die, penalty))}</em>
    </div>
  `;
}

function renderSavageTraitLine(label, die, penalty = 0) {
  return `
    <div class="dnd-check-line savage-trait-line">
      <i aria-hidden="true"></i>
      <strong>${escapeHtml(die)}</strong>
      <span>${escapeHtml(label)}</span>
      <small>${escapeHtml(formatSavageEffectiveTrait(die, penalty))}</small>
    </div>
  `;
}

function renderSavageCounter(label, key, value, min, max, helper) {
  return `
    <div class="savage-live-control" data-savage-control="${escapeAttribute(key)}">
      <span>${escapeHtml(label)} ${renderSavageConceptHint(key)}</span>
      <strong>${escapeHtml(String(value))}</strong>
      <small>${escapeHtml(helper)}</small>
      <div class="savage-live-buttons">
        <button type="button" class="secondary" data-savage-state="${escapeAttribute(key)}" data-savage-delta="-1" ${value <= min ? "disabled" : ""}>-</button>
        <button type="button" class="secondary" data-savage-state="${escapeAttribute(key)}" data-savage-delta="1" ${value >= max ? "disabled" : ""}>+</button>
      </div>
    </div>
  `;
}

function renderSavageToggle(label, key, active, helper) {
  return `
    <div class="savage-live-control ${active ? "active" : ""}" data-savage-control="${escapeAttribute(key)}">
      <span>${escapeHtml(label)} ${renderSavageConceptHint(key)}</span>
      <strong>${active ? "Si" : "No"}</strong>
      <small>${escapeHtml(helper)}</small>
      <button type="button" class="secondary" data-savage-state="${escapeAttribute(key)}" data-savage-toggle="true">
        ${active ? "Neteja" : "Marca"}
      </button>
    </div>
  `;
}

function renderSavageStaticStat(label, key, value, helper) {
  return `
    <div class="savage-live-control static">
      <span>${escapeHtml(label)} ${renderSavageConceptHint(key)}</span>
      <strong>${escapeHtml(String(value))}</strong>
      <small>${escapeHtml(helper)}</small>
    </div>
  `;
}

function renderSavageCombatStat(label, conceptKey, value, helper) {
  return `
    <div class="dnd-combat-stat">
      <strong>${escapeHtml(String(value || "-"))}</strong>
      <span>${escapeHtml(label)} ${renderSavageConceptHint(conceptKey)}</span>
      <small>${escapeHtml(helper)}</small>
    </div>
  `;
}

function renderSavageConceptHint(key) {
  const concept = SAVAGE_CONCEPTS[key];
  if (!concept) {
    return "";
  }

  return `
    <span class="savage-concept" tabindex="0" role="button" aria-expanded="false" aria-label="${escapeAttribute(`${concept.title}: ${concept.summary}`)}">
      <span class="savage-concept-tooltip" role="tooltip">
        <strong>${escapeHtml(concept.title)}</strong>
        <span>${escapeHtml(concept.summary)}</span>
        <em>${escapeHtml(concept.tip)}</em>
      </span>
    </span>
  `;
}

function renderSavageDots(activeCount, maxCount) {
  return Array.from({ length: maxCount }, (_, index) => `<i class="${index < activeCount ? "active" : ""}"></i>`).join("");
}

function formatSavageStatus(savageState) {
  const parts = [];
  if (savageState.shaken) {
    parts.push("Atordit");
  }
  if (savageState.wounds > 0) {
    parts.push(`${savageState.wounds} ferida${savageState.wounds === 1 ? "" : "es"}`);
  }
  if (savageState.fatigue > 0) {
    parts.push(`${savageState.fatigue} fatiga`);
  }
  return parts.length ? parts.join(" / ") : "Sa";
}

function renderSavageAttackCard(attack, penalty = 0) {
  return `
    <article class="savage-attack-card ${attack.equipped ? "equipped" : ""}">
      <strong>${escapeHtml(attack.name)}</strong>
      <span>${escapeHtml(formatSavageAttackTrait(attack.trait, penalty))}</span>
      <span>${escapeHtml(attack.damage || "Dany pendent")}</span>
      <small>${escapeHtml([attack.range, attack.notes].filter(Boolean).join(" · ") || "Sense notes")}</small>
    </article>
  `;
}

function renderSavageLoadout(equipment) {
  const armorMarkup = equipment.armors.length
    ? equipment.armors.map((item) => renderSavageLoadoutItem(item, "armor")).join("")
    : `<p class="empty-state">Afegeix armadures amb format "Abric reforcat | Armadura +2 | equipada | notes".</p>`;
  const weaponMarkup = equipment.weapons.length
    ? equipment.weapons.map((item) => renderSavageLoadoutItem(item, "weapon")).join("")
    : `<p class="empty-state">Afegeix armes amb format "Rifle | Disparar d8 | 2d6 | Rang 12/24/48".</p>`;
  const gearMarkup = equipment.gear.length
    ? `<ul class="savage-gear-list">${equipment.gear.map((item) => `<li>${escapeHtml(item.name)}</li>`).join("")}</ul>`
    : `<p class="empty-state">Sense equip menor detectat.</p>`;

  return `
    <div class="savage-loadout-grid">
      <section>
        <h5>Armadures</h5>
        ${armorMarkup}
      </section>
      <section>
        <h5>Armes preparades</h5>
        ${weaponMarkup}
      </section>
      <section class="savage-gear-column">
        <h5>Altres objectes</h5>
        ${gearMarkup}
      </section>
    </div>
  `;
}

function renderSavageLoadoutItem(item, slot) {
  const stats = slot === "armor"
    ? [
        item.armorBonus ? `Duresa +${item.armorBonus}` : "",
        item.parryBonus ? `Parada +${item.parryBonus}` : "",
        item.pacePenalty ? `Pas ${item.pacePenalty}` : "",
      ].filter(Boolean).join(" · ") || "Sense bonus detectat"
    : [item.trait, item.damage, item.range].filter(Boolean).join(" · ") || "Stats pendents";

  return `
    <article class="savage-loadout-item ${item.equipped ? "equipped" : ""}">
      <div>
        <strong>${escapeHtml(item.name)}</strong>
        <span>${escapeHtml(stats)}</span>
        <small>${escapeHtml(item.notes || "Sense notes")}</small>
      </div>
      <button
        type="button"
        class="secondary"
        data-savage-equip="${escapeAttribute(item.id)}"
        data-savage-equip-slot="${escapeAttribute(slot)}"
        data-savage-equipped="${item.equipped ? "true" : "false"}"
      >
        ${item.equipped ? "Equipat" : "Equipa"}
      </button>
    </article>
  `;
}

function renderSavageFeatures(value) {
  const groups = parseSavageFeatures(value);
  return `
    <div class="savage-feature-grid">
      <section>
        <h5>Avantatges</h5>
        ${renderSavageFeatureList(groups.edges)}
      </section>
      <section>
        <h5>Complicacions</h5>
        ${renderSavageFeatureList(groups.hindrances)}
      </section>
      <section class="savage-feature-notes">
        <h5>Notes</h5>
        <div class="rich-text dnd-lined-text">${renderRichText(groups.notes || "Sense notes addicionals.")}</div>
      </section>
    </div>
  `;
}

function renderSavageFeatureList(items) {
  return items.length
    ? `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
    : `<p class="empty-state">Sense dades.</p>`;
}

function parseSavageSheetData(value) {
  const attributes = {};
  const skills = [];
  const attributeKeysByName = new Map(
    SAVAGE_ATTRIBUTE_DEFINITIONS.flatMap((attribute) => [
      [normalizeTraitName(attribute.label), attribute.key],
      [attribute.key, attribute.key],
    ]),
  );

  String(value || "")
    .split(/[,\n;]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .forEach((item) => {
      const match = item.match(/^(.+?)\s+(d(?:4|6|8|10|12)(?:\+\d+)?)$/i);
      if (!match) {
        return;
      }
      const name = match[1].trim();
      const die = match[2].toLowerCase();
      const attributeKey = attributeKeysByName.get(normalizeTraitName(name));
      if (attributeKey) {
        attributes[attributeKey] = die;
      } else {
        skills.push({ name, die });
      }
    });

  return { attributes, skills };
}

function normalizeSavageState(candidate, fallbackBennies) {
  const source = candidate && typeof candidate === "object" ? candidate : {};
  const defaultBennies = parseSignedNumber(fallbackBennies) || 3;
  return {
    bennies: clampNumber(source.bennies, 0, 9, defaultBennies),
    wounds: clampNumber(source.wounds, 0, 3, 0),
    fatigue: clampNumber(source.fatigue, 0, 2, 0),
    shaken: Boolean(source.shaken),
  };
}

function clampNumber(value, min, max, fallback) {
  const number = Number.isFinite(Number(value)) ? Number(value) : fallback;
  return Math.min(max, Math.max(min, Math.trunc(number)));
}

function parseSavagePace(value) {
  const match = String(value || "").match(/\b(?:pas|pace)\s+(\d+)/i);
  return match ? match[1] : "6";
}

function calculateSavageDerivedStats(character, sheetData, savageState, equipment) {
  const rawParry = parseSavageNumberWithArmor(character.sheet.ac);
  const rawToughness = parseSavageNumberWithArmor(character.sheet.hp);
  const armorBonus = equipment.armors
    .filter((armor) => armor.equipped)
    .reduce((total, armor) => total + armor.armorBonus, 0);
  const parryBonus = equipment.armors
    .filter((armor) => armor.equipped)
    .reduce((total, armor) => total + armor.parryBonus, 0);
  const pacePenalty = equipment.armors
    .filter((armor) => armor.equipped)
    .reduce((total, armor) => total + armor.pacePenalty, 0);
  const penalty = Math.max(0, savageState.wounds + savageState.fatigue);
  const paceBase = Number(parseSavagePace(character.sheet.abilities)) || 6;

  return {
    penalty,
    penaltyLabel: penalty ? `-${penalty}` : "0",
    pace: Math.max(0, paceBase + pacePenalty),
    parry: {
      base: rawParry.base,
      total: rawParry.base + parryBonus,
      helper: parryBonus ? `Base ${rawParry.base} + equip ${parryBonus}` : "Base sense bonus actiu",
    },
    toughness: {
      base: rawToughness.base,
      armorBonus: armorBonus || rawToughness.inlineArmor,
      total: rawToughness.base + armorBonus + (!equipment.armors.length ? rawToughness.inlineArmor : 0),
      helper: armorBonus
        ? `Base ${rawToughness.base} + armadura ${armorBonus}`
        : rawToughness.inlineArmor
          ? `Base ${rawToughness.base} + armadura manual ${rawToughness.inlineArmor}`
          : "Base sense armadura activa",
    },
  };
}

function parseSavageNumberWithArmor(value) {
  const text = String(value || "");
  const main = Number((text.match(/\d+/) || ["0"])[0]);
  const inlineArmor = Number((text.match(/\((\d+)\)/) || [null, "0"])[1]);
  return {
    base: Math.max(0, main - inlineArmor),
    inlineArmor,
  };
}

function formatSavageEffectiveTrait(die, penalty) {
  return penalty > 0 ? `${die}-${penalty}` : "Dau";
}

function formatSavageAttackTrait(trait, penalty) {
  if (!trait) {
    return penalty > 0 ? `Trait pendent -${penalty}` : "Trait pendent";
  }
  return penalty > 0 ? `${trait}-${penalty}` : trait;
}

function parseSavageEquipment(value, skills, loadout) {
  const explicitLoadout = loadout && typeof loadout === "object";
  const equippedWeaponIds = new Set(Array.isArray(loadout?.equippedWeaponIds) ? loadout.equippedWeaponIds : []);
  const equippedArmorIds = new Set(Array.isArray(loadout?.equippedArmorIds) ? loadout.equippedArmorIds : []);
  const skillByName = new Map(skills.map((skill) => [normalizeTraitName(skill.name), skill.die]));
  const result = { weapons: [], armors: [], gear: [] };

  String(value || "")
    .split("\n")
    .flatMap((line) => splitSavageInventoryLine(line))
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line, index) => {
      const parts = line.split("|").map((part) => part.trim()).filter(Boolean);
      const normalized = normalizeTraitName(line);
      const id = buildSavageEquipmentId(line, index);
      const isEquippedByText = /\b(equipada|equipat|equipped|activa|actiu|preparada|preparat)\b/i.test(line);

      if (isSavageArmorLine(line, parts)) {
        const armor = parseSavageArmorLine(line, parts, id);
        armor.equipped = explicitLoadout ? equippedArmorIds.has(id) : isEquippedByText;
        result.armors.push(armor);
        return;
      }

      if (isSavageWeaponLine(line, parts)) {
        const weapon = parseSavageWeaponLine(line, parts, id, skillByName);
        weapon.equipped = explicitLoadout ? equippedWeaponIds.has(id) : (isEquippedByText || result.weapons.length < 2);
        result.weapons.push(weapon);
        return;
      }

      result.gear.push({
        id,
        name: line.replace(/,$/, ""),
        notes: normalized.includes("municio") || normalized.includes("bala") ? "Consumible" : "",
      });
    });

  return result;
}

function splitSavageInventoryLine(line) {
  if (String(line || "").includes("|")) {
    return [line];
  }
  return String(line || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildSavageEquipmentId(line, index) {
  const slug = normalizeTraitName(line)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 42) || "item";
  return `${slug}-${index}`;
}

function isSavageWeaponLine(line, parts) {
  return parts.length >= 3 || /\b(rifle|revolver|revolv|pistola|escopeta|ganivet|arma|arc|espasa|destral|llanca|fusell)\b/i.test(line);
}

function isSavageArmorLine(line, parts) {
  const text = normalizeTraitName(line);
  return text.includes("armadura")
    || text.includes("armor")
    || text.includes("proteccio")
    || text.includes("abric reforcat")
    || text.includes("jaqueta reforcada")
    || text.includes("escut")
    || parts.some((part) => /parada\s*[+-]\d+|duresa\s*[+-]\d+|armadura\s*[+-]\d+/i.test(part));
}

function parseSavageWeaponLine(line, parts, id, skillByName) {
  if (parts.length >= 2) {
    const notes = parts.slice(3).join(" | ");
    return {
      id,
      name: parts[0],
      trait: parts[1],
      damage: parts[2] || "",
      range: extractSavageRange(notes),
      notes: notes.replace(/\bRang\s+[\d/]+\b/i, "").trim(),
      equipped: false,
    };
  }

  const normalizedLine = normalizeTraitName(line);
  const trait = normalizedLine.includes("ganivet") || normalizedLine.includes("espasa") || normalizedLine.includes("destral")
    ? `Atletisme ${skillByName.get("atletisme") || ""}`.trim()
    : `Disparar ${skillByName.get("disparar") || ""}`.trim();
  return {
    id,
    name: line.replace(/,$/, ""),
    trait,
    damage: "",
    range: "",
    notes: "Completa dany/rang a Equipament.",
    equipped: false,
  };
}

function parseSavageArmorLine(line, parts, id) {
  const bonusText = parts.slice(1).join(" | ") || line;
  return {
    id,
    name: parts[0] || line,
    armorBonus: Math.max(0, parseSavageNamedBonus(bonusText, ["armadura", "armor", "duresa", "toughness"], { allowFallback: true })),
    parryBonus: Math.max(0, parseSavageNamedBonus(bonusText, ["parada", "parry"])),
    pacePenalty: Math.min(0, parseSavageNamedBonus(bonusText, ["pas", "pace", "moviment"])),
    notes: parts.slice(2).filter((part) => !/\b(equipada|equipat|equipped|activa|actiu)\b/i.test(part)).join(" | "),
    equipped: false,
  };
}

function parseSavageNamedBonus(text, names, options = {}) {
  const source = String(text || "");
  for (const name of names) {
    const match = source.match(new RegExp(`${name}\\s*([+-]?\\d+)`, "i"));
    if (match) {
      return Number(match[1]) || 0;
    }
  }
  if (!options.allowFallback) {
    return 0;
  }
  const fallback = source.match(/[+-]\d+/);
  return fallback ? Number(fallback[0]) : 0;
}

function extractSavageRange(value) {
  const match = String(value || "").match(/\bRang\s+([\d/]+)\b/i);
  return match ? `Rang ${match[1]}` : "";
}

function parseSavageAttacks(value, skills) {
  const skillByName = new Map(skills.map((skill) => [normalizeTraitName(skill.name), skill.die]));
  return String(value || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => /rifle|revolver|rev[oò]lver|pistola|escopeta|ganivet|arma|arc|espasa/i.test(line))
    .map((line) => {
      const parts = line.split("|").map((part) => part.trim()).filter(Boolean);
      if (parts.length >= 2) {
        return {
          name: parts[0],
          trait: parts[1],
          damage: parts[2] || "",
          notes: parts.slice(3).join(" | "),
        };
      }

      const normalizedLine = normalizeTraitName(line);
      const trait = normalizedLine.includes("ganivet") || normalizedLine.includes("espasa")
        ? `Atletisme ${skillByName.get("atletisme") || ""}`.trim()
        : `Disparar ${skillByName.get("disparar") || ""}`.trim();
      return {
        name: line.replace(/,$/, ""),
        trait,
        damage: "",
        notes: "Completa dany/rang a Equipament.",
      };
    });
}

function parseSavageFeatures(value) {
  const result = { edges: [], hindrances: [], notes: "" };
  String(value || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line) => {
      const [label, content] = line.split(/:\s+/, 2);
      const normalized = normalizeTraitName(label);
      const values = String(content || "").split(",").map((item) => item.trim()).filter(Boolean);
      if (normalized.includes("avantatge")) {
        result.edges.push(...values);
      } else if (normalized.includes("complicacion") || normalized.includes("complicacio")) {
        result.hindrances.push(...values);
      } else {
        result.notes = result.notes ? `${result.notes}\n${line}` : line;
      }
    });
  return result;
}

function normalizeTraitName(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function stripSavageLabel(value, label) {
  return String(value || "")
    .replace(new RegExp(`^\\s*${label}\\s*`, "i"), "")
    .trim() || "-";
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
                ${renderCharacterTabEditor(character, tab, tabDraft, state)}
              </div>
            </form>
          `,
        )}
      </div>
    </section>
  `;
}

function renderCharacterTabEditor(character, tab, draft, state) {
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
    if (isSavageWorldsCampaign(state)) {
      return `
        ${renderInputField("ac", "Parada", readDraftValue(draft.ac, character.sheet.ac))}
        ${renderInputField("hp", "Duresa", readDraftValue(draft.hp, character.sheet.hp))}
        ${renderInputField("proficiency", "Bennies", readDraftValue(draft.proficiency, character.sheet.proficiency))}
        ${renderRichTextareaField("abilities", "Atributs i habilitats", readDraftValue(draft.abilities, character.sheet.abilities), 5)}
        ${renderRichTextareaField("features", "Avantatges, complicacions i trets", readDraftValue(draft.features, character.sheet.features), 5)}
      `;
    }

    return `
      ${renderInputField("ac", "CA", readDraftValue(draft.ac, character.sheet.ac))}
      ${renderInputField("hp", "HP", readDraftValue(draft.hp, character.sheet.hp))}
      ${renderInputField("proficiency", "Proficiència", readDraftValue(draft.proficiency, character.sheet.proficiency))}
      ${renderRichTextareaField("abilities", "Atributs", readDraftValue(draft.abilities, character.sheet.abilities), 4)}
      ${renderRichTextareaField("features", "Capacitats i trets", readDraftValue(draft.features, character.sheet.features), 4)}
    `;
  }

  if (tab === "inventory") {
    if (isSavageWorldsCampaign(state)) {
      return `
        <p class="field-help savage-editor-help">
          Formats intel·ligents: arma com "Rifle | Disparar d8 | 2d6 | Rang 12/24/48"; armadura com "Abric reforcat | Armadura +2 | equipada | impermeable"; escut com "Escut | Parada +1 | equipada".
        </p>
        ${renderRichTextareaField("items", "Equip, armes i armadures", readDraftValue(draft.items, character.inventory.items), 7)}
        ${renderInputField("currency", "Moneda", readDraftValue(draft.currency, character.inventory.currency))}
        ${renderRichTextareaField("artifacts", "Artefactes", readDraftValue(draft.artifacts, character.inventory.artifacts), 4)}
        ${renderRichTextareaField("notes", "Notes", readDraftValue(draft.notes, character.inventory.notes), 4)}
      `;
    }

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
