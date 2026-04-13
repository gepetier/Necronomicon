const STORAGE_KEY = "campaign-compendium-v2";

const seedData = {
  characters: [
    {
      id: "iria",
      name: "Iria Vellbronze",
      title: "La que recorda els noms prohibits",
      lineage: "Tiefling",
      className: "Bruixa",
      level: 5,
      summary:
        "Arxivera errant que conserva veritats incòmodes abans que el poder les torni cendra.",
      quickNotes: "Pacte antic, domini de coneixement ocult, lectura de segells i rituals breus.",
      lore: {
        origin: "Va créixer entre registres cremats i va aprendre massa aviat que la història també és una arma.",
        bonds: "Selvar Tann és la seva mentora; el grup és la primera família escollida que no intenta usar-la.",
        secrets: "La seva patrona li demana noms reals de persones que ningú no hauria de recordar.",
        goals: "Recuperar una memòria robada de la seva família i descobrir qui manipula els arxius del regne.",
        wounds: "Té pànic a perdre records o a convertir-se en eina d'una altra voluntat.",
      },
      sheet: {
        ac: "14",
        hp: "32",
        proficiency: "+3",
        abilities: "For 8, Des 14, Con 13, Int 16, Sav 12, Car 18",
        features: "Eldritch Blast, Detect Magic, invocacions de lectura, ritus de tinta viva.",
      },
      inventory: {
        items: "Llibreta d'obsidiana\nSegell de cendra\nTòtem de llautó",
        currency: "87 po",
        artifacts: "Pàgina impossible, clau d'arxiu ennegrida",
        notes: "Sempre anota noms, pactes i inconsistències en els registres que troba.",
      },
      history:
        "A la campanya ha estat el cervell del grup: obre portes, llegeix símbols i força les converses difícils quan tothom callaria.",
      sigil: "I",
      palette: ["#6d3a32", "#b8894f"],
    },
    {
      id: "darian",
      name: "Darian Thorne",
      title: "Escut del darrer jurament",
      lineage: "Humà",
      className: "Paladí",
      level: 5,
      summary:
        "Cavaller exiliat que encara creu en la llum, però ja no en les institucions que la proclamen.",
      quickNotes: "Frontliner, protector, aura moral, cops decisius quan algú creua una línia.",
      lore: {
        origin: "Va abandonar l'orde quan va descobrir que alguns dels seus miracles tapaven crims polítics.",
        bonds: "Protegeix el grup com si fos un jurament viu i manté una tensió constant amb Rhun.",
        secrets: "Conserva una relíquia sagrada que el seu orde considera robada.",
        goals: "Trobar una forma de servir el seu ideal sense tornar a servir el sistema que el va trair.",
        wounds: "Quan fracassa algú sota la seva protecció, reviu tots els errors del seu passat.",
      },
      sheet: {
        ac: "18",
        hp: "44",
        proficiency: "+3",
        abilities: "For 16, Des 10, Con 15, Int 10, Sav 12, Car 16",
        features: "Divine Smite, Lay on Hands, Sentit diví, aura de coratge.",
      },
      inventory: {
        items: "Espasa de jurament\nEscut amb sol partit\nArmadura polida",
        currency: "42 po",
        artifacts: "Relíquia de Sant Aeron",
        notes: "Tot objecte sagrat l'obliga a decidir si servirà la fe o la veritat.",
      },
      history:
        "És el mur del grup i la seva consciència més visible. Sovint és qui converteix una pista en una decisió moral.",
      sigil: "D",
      palette: ["#3d2f50", "#d2a248"],
    },
    {
      id: "mira",
      name: "Mira de l'Esbarzer",
      title: "Fletxa de la boira roja",
      lineage: "Elfa",
      className: "Exploradora",
      level: 5,
      summary:
        "Caçadora de fronteres que coneix millor els rastres que les lleis, i que no oblida mai una cara hostil.",
      quickNotes: "Exploració, rastreig, emboscades, lectura de terreny i monsters.",
      lore: {
        origin: "Ve d'una comunitat fronterera destruïda després d'un pacte fallit entre nobles i caçadors.",
        bonds: "Es fia d'Iria per la veritat i de Darian per l'honor, però protegeix sobretot la gent corrent.",
        secrets: "Coneix rutes amagades que podrien obrir la porta a faccions equivocades.",
        goals: "Caçar la bèstia i els homes que van convertir la seva terra en territori maleït.",
        wounds: "La immobilitza veure pobles abandonats o nens que encara confien en autoritats inútils.",
      },
      sheet: {
        ac: "15",
        hp: "36",
        proficiency: "+3",
        abilities: "For 11, Des 18, Con 13, Int 12, Sav 15, Car 10",
        features: "Hunter's Mark, Favored Foe, exploració experta, tir precís.",
      },
      inventory: {
        items: "Arc llarg de corn\nCapa de boira\nGanivet corbat",
        currency: "59 po",
        artifacts: "Mapa incomplet del bosc negre",
        notes: "Marca camins segurs i trampes amb codis que només ella entén del tot.",
      },
      history:
        "Sovint és la primera a veure el perill i l'última a confiar. Les seves decisions han salvat el grup fora del combat una vegada rere l'altra.",
      sigil: "M",
      palette: ["#325043", "#8fa85f"],
    },
    {
      id: "tobin",
      name: "Tobin Fendrel",
      title: "El riure sota set panys",
      lineage: "Halfling",
      className: "Brivall",
      level: 5,
      summary:
        "Ment ràpida i mans lleugeres que converteix panys, rumors i tavernes en vies d'entrada al cor del misteri.",
      quickNotes: "Infiltració, eines de lladre, contacte social, improvisació brillant.",
      lore: {
        origin: "Va créixer entre carrers i escenaris, aprenent que els relats més útils sempre són a mig camí entre la broma i la mentida.",
        bonds: "Sap fer riure Mira quan ningú més pot i treu Darian del seu dramatisme quan convé.",
        secrets: "Un antic gremi encara creu que li deu un encàrrec que mai no va completar.",
        goals: "Esborrar definitivament el seu deute i trobar el tresor que li van prometre de jove.",
        wounds: "La pobresa i la dependència li fan més por que qualsevol monstre del camí.",
      },
      sheet: {
        ac: "16",
        hp: "34",
        proficiency: "+3",
        abilities: "For 9, Des 17, Con 12, Int 14, Sav 11, Car 15",
        features: "Sneak Attack, Cunning Action, eines de lladre, disfressa improvisada.",
      },
      inventory: {
        items: "Joc de ganzúes\nDaus carregats\nDaga de màniga",
        currency: "71 po",
        artifacts: "Moneda partida del vell gremi",
        notes: "Porta sempre petites utilitats amagades en costures impossibles.",
      },
      history:
        "Ha obert portes literals i figurades. Quan el grup queda encallat, gairebé sempre és Tobin qui troba la via lateral.",
      sigil: "T",
      palette: ["#7b4d2d", "#d59d56"],
    },
  ],
  chronicles: [
    {
      id: "s1",
      chapter: "Sessió 1",
      title: "Cendra al Port Gris",
      date: "03/02/2026",
      summary:
        "El grup es coneix durant una inspecció fallida al port i descobreix un carregament amb segells alterats.",
      content:
        "Durant la nit, els protagonistes connecten pistes entre molls i magatzems. [[port-gris|Port Gris]] apareix com a eix de la trama i els [[custodis|Custodis de Cendra]] deixen la seva primera empremta.",
      highlights:
        "Primera aliança. Aparició del símbol de cendra. Iria troba una llista de noms esborrats.",
      imageNote: "Moll nocturn, fanals, boira densa i segells cremats sobre fusta humida.",
      imageAssets: [],
      voiceNotes: [],
      characterIds: ["iria", "darian", "mira", "tobin"],
      palette: ["#6f2d21", "#d5b06b"],
    },
    {
      id: "s2",
      chapter: "Sessió 2",
      title: "La torre que no figurava al mapa",
      date: "17/02/2026",
      summary:
        "Seguint un registre incomplet, el grup arriba a una torre abandonada on troba correspondència entre nobles i Custodis.",
      content:
        "La torre oculta confirma que hi ha correspondència secreta entre cases nobles i els [[custodis|Custodis de Cendra]]. La ruta secundària de fugida apunta cap als [[esbarzers-rogencs|Esbarzers Rogencs]].",
      highlights:
        "Darian protegeix un testimoni. Mira detecta una ruta de fugida. Tobin obre la cambra secreta.",
      imageNote: "Torre de pedra mullada, arxius ocults i llum d'espelma contra parets plenes d'humitat.",
      imageAssets: [],
      voiceNotes: [],
      characterIds: ["darian", "mira", "tobin"],
      palette: ["#39455f", "#bca073"],
    },
    {
      id: "s3",
      chapter: "Sessió 3",
      title: "El setè llibre respira",
      date: "01/03/2026",
      summary:
        "Iria confirma que el llibre maleït encara circula. El grup fa un pacte tàcit de no deixar-lo caure en mans dels Custodis.",
      content:
        "A l'arxiu vell del [[port-gris|Port Gris]], Iria confirma que el setè llibre no va ser destruït. La sessió tanca amb un jurament per avançar abans que els [[custodis|Custodis de Cendra]].",
      highlights:
        "Nou enemic definitiu. Mites que resulten ser certs. El grup tria la veritat per sobre de la seguretat.",
      imageNote: "Llibre ennegrit sobre altar antic, pols d'or a l'aire i ombres llargues de biblioteca.",
      imageAssets: [],
      voiceNotes: [],
      characterIds: ["iria", "darian"],
      palette: ["#55335a", "#cf9d68"],
    },
  ],
  glossary: [
    {
      id: "port-gris",
      name: "Port Gris",
      category: "Ubicacions",
      description:
        "Ciutat portuària coberta de boira, amb arxius mercantils contaminats per censures polítiques.",
      tags: ["port", "comerç", "custodis"],
      notes: "Lloc d'origen de moltes pistes i primer punt d'unió del grup.",
      characterIds: ["iria", "tobin"],
      chronicleIds: ["s1"],
      palette: ["#45545f", "#b79063"],
    },
    {
      id: "custodis",
      name: "Custodis de Cendra",
      category: "Faccions",
      description:
        "Orde dedicada a reescriure, destruir o encapsular informació considerada perillosa per a l'estabilitat del regne.",
      tags: ["orde", "secret", "arxius"],
      notes: "Principals antagonistes intel·lectuals de la campanya.",
      characterIds: ["iria", "darian"],
      chronicleIds: ["s2", "s3"],
      palette: ["#6f2d21", "#d5b06b"],
    },
    {
      id: "esbarzers-rogencs",
      name: "Esbarzers Rogencs",
      category: "Monstres",
      description:
        "Flora agressiva i semi-conscient que devora camins sencers quan s'alimenta de sang i juraments trencats.",
      tags: ["bosc", "plaga", "maleïció"],
      notes: "Mira els associa amb la destrucció de la seva terra fronterera.",
      characterIds: ["mira"],
      chronicleIds: ["s2"],
      palette: ["#3f5a3d", "#bd9557"],
    },
  ],
  ui: {
    currentModule: "characters",
    selectedCharacterId: "iria",
    selectedCharacterTab: "lore",
    showCharacterGrid: true,
    selectedChronicleId: "s1",
    glossaryCategory: "Totes",
    glossarySearch: "",
    selectedGlossaryId: "port-gris",
    isEditMode: false,
    glossaryReturnChronicleId: "",
  },
};

let state = loadState();
let bookTurnTimer = null;

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
    if (state.ui.currentModule !== "glossary") {
      state.ui.glossaryReturnChronicleId = "";
    }
    persistAndRender();
    return;
  }

  if (event.target.closest("[data-back-to-grid]")) {
    state.ui.showCharacterGrid = true;
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
    persistAndRender();
    return;
  }

  const glossaryJump = event.target.closest("[data-glossary-jump]");
  if (glossaryJump) {
    const glossaryId = glossaryJump.dataset.glossaryJump;
    if (glossaryId && findGlossaryEntry(glossaryId)) {
      state.ui.currentModule = "glossary";
      state.ui.selectedGlossaryId = glossaryId;
      persistAndRender();
    }
    return;
  }

  const suggestionButton = event.target.closest("[data-insert-glossary-ref]");
  if (suggestionButton) {
    const textarea = document.querySelector(`#${suggestionButton.dataset.inputId}`);
    if (textarea instanceof HTMLTextAreaElement) {
      insertGlossaryReference(textarea, suggestionButton.dataset.insertGlossaryRef || "", suggestionButton.dataset.glossaryLabel || "");
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
  if (state.ui.showCharacterGrid) {
    charactersModule.innerHTML = `
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
    renderCharactersModule();
    return;
  }

  charactersModule.innerHTML = `
    <section class="detail-card">
      <div class="detail-header-actions">
        <button id="backToGridButtonInline" type="button" class="secondary" data-back-to-grid>
          Torna a les cartes
        </button>
      </div>
      <div class="detail-grid">
        <div class="detail-portrait" style="${paletteStyle(character.palette)}">
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
          ${renderCharacterTabContent(character)}
          ${state.ui.isEditMode ? renderCharacterEditor(character) : ""}
        </div>
      </div>
    </section>
  `;
}

function renderCharacterCard(character) {
  return `
    <article
      class="character-card"
      data-character-card="${character.id}"
      style="${paletteStyle(character.palette)}"
    >
      <div class="card-portrait" data-mark="${escapeHtml(character.sigil)}">
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

function renderCharacterTabContent(character) {
  if (state.ui.selectedCharacterTab === "lore") {
    return `
      <div class="item-grid">
        ${renderTextCard("Origen", character.lore.origin)}
        ${renderTextCard("Vincles", character.lore.bonds)}
        ${renderTextCard("Secrets", character.lore.secrets)}
        ${renderTextCard("Objectius", character.lore.goals)}
        ${renderTextCard("Ferides", character.lore.wounds)}
      </div>
    `;
  }

  if (state.ui.selectedCharacterTab === "sheet") {
    return `
      <div class="parchment-block">
        <div class="stats-row">
          <div class="stat-chip">CA<strong>${escapeHtml(character.sheet.ac)}</strong></div>
          <div class="stat-chip">HP<strong>${escapeHtml(character.sheet.hp)}</strong></div>
          <div class="stat-chip">Prof.<strong>${escapeHtml(character.sheet.proficiency)}</strong></div>
        </div>
      </div>
      <div class="item-grid">
        ${renderTextCard("Atributs", character.sheet.abilities)}
        ${renderTextCard("Capacitats i trets", character.sheet.features)}
      </div>
    `;
  }

  if (state.ui.selectedCharacterTab === "inventory") {
    return `
      <div class="item-grid">
        ${renderTextCard("Objectes", character.inventory.items)}
        ${renderTextCard("Moneda", character.inventory.currency)}
        ${renderTextCard("Artefactes", character.inventory.artifacts)}
        ${renderTextCard("Notes", character.inventory.notes)}
      </div>
    `;
  }

  return `
    <div class="parchment-block">
      <p class="eyebrow">Història personal</p>
      <p>${escapeHtml(character.history)}</p>
    </div>
  `;
}

function renderCharacterEditor(character) {
  const tab = state.ui.selectedCharacterTab;
  return `
    <section class="module-surface">
      <p class="eyebrow">Editar ${escapeHtml(character.name)}</p>
      <form data-form="character-overview" class="editor-grid">
        <input type="hidden" name="id" value="${character.id}" />
        <label class="field">
          <span>Nom</span>
          <input name="name" value="${escapeAttribute(character.name)}" />
        </label>
        <label class="field">
          <span>Títol</span>
          <input name="title" value="${escapeAttribute(character.title)}" />
        </label>
        <label class="field">
          <span>Poble / raça</span>
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
          <textarea name="summary" rows="3">${escapeHtml(character.summary)}</textarea>
        </label>
        <label class="field span-2">
          <span>Capacitats ràpides</span>
          <textarea name="quickNotes" rows="3">${escapeHtml(character.quickNotes)}</textarea>
        </label>
        <button type="submit">Desa capçalera</button>
      </form>
      <form data-form="character-tab" class="editor-grid">
        <input type="hidden" name="id" value="${character.id}" />
        <input type="hidden" name="tab" value="${tab}" />
        ${renderCharacterTabEditor(character, tab)}
        <button type="submit">Desa ${characterTabLabel(tab).toLowerCase()}</button>
      </form>
    </section>
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
      ${renderInputField("proficiency", "Proficència", character.sheet.proficiency)}
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

function renderChroniclesModule() {
  const current = getSelectedChronicle();
  const relatedCharacters = current
    ? current.characterIds.map((id) => findCharacter(id)?.name).filter(Boolean)
    : [];
  const primaryImage = current?.imageAssets?.[0] || "";

  chroniclesModule.innerHTML = `
    <section class="book-shell">
      <div class="book-layout">
        <aside class="book-index">
          <div class="parchment-block">
            <p class="eyebrow">Índex</p>
            <h3>Capítols de campanya</h3>
          </div>
          ${state.chronicles
            .map(
              (chronicle) => `
                <button
                  type="button"
                  class="index-entry ${chronicle.id === state.ui.selectedChronicleId ? "active" : ""}"
                  data-chronicle-id="${chronicle.id}"
                >
                  ${escapeHtml(chronicle.chapter)} · ${escapeHtml(chronicle.title)}
                </button>
              `,
            )
            .join("")}
        </aside>
        <div>
          <div id="bookSpread" class="book-spread">
            <div class="page-turn-sheet" aria-hidden="true"></div>
            <article class="book-page left-page" style="${paletteStyle(current?.palette || seedData.chronicles[0].palette)}">
              <p class="eyebrow">${escapeHtml(current?.chapter || "Sessió")}</p>
              <h3>${escapeHtml(current?.title || "Sense crònica")}</h3>
              <p>${escapeHtml(current?.date || "")}</p>
              ${
                primaryImage
                  ? `<img class="book-image-media" src="${escapeAttribute(primaryImage)}" alt="${escapeAttribute(current?.title || "Imatge de crònica")}" loading="lazy" />`
                  : `<div class="book-image" style="${paletteStyle(current?.palette || seedData.chronicles[0].palette)}"></div>`
              }
              <div class="chapter-summary">${renderChronicleRichText(current?.summary || "No hi ha resum disponible.")}</div>
              <div class="chapter-body">${renderChronicleRichText(current?.content || "")}</div>
              <span class="page-number">Pàgina esquerra</span>
            </article>
            <article class="book-page right-page">
              <p class="eyebrow">Notes de capítol</p>
              <h3>Escenes i personatges</h3>
              <div class="chronicle-notes">
                ${renderTextCard("Highlights", current?.highlights || "", { rich: true })}
                ${renderTextCard("Imatge evocadora", current?.imageNote || "")}
                ${renderTextCard("Personatges implicats", relatedCharacters.join(", ") || "Sense personatges vinculats")}
                ${renderChronicleMedia(current)}
              </div>
              <span class="page-number">Pàgina dreta</span>
            </article>
          </div>
          <div class="book-controls">
            <button type="button" class="secondary" data-chronicle-nav="prev">Pàgina anterior</button>
            <button type="button" data-chronicle-nav="next">Pàgina següent</button>
          </div>
          ${state.ui.isEditMode ? renderChronicleEditor(current) : ""}
        </div>
      </div>
    </section>
  `;
}

function renderChronicleEditor(chronicle) {
  const selected = new Set(chronicle?.characterIds || []);
  return `
    <section class="module-surface">
      <p class="eyebrow">Editar crònica</p>
      <form data-form="chronicle" class="editor-grid">
        <input type="hidden" name="id" value="${escapeAttribute(chronicle?.id || "")}" />
        ${renderInputField("chapter", "Capítol", chronicle?.chapter || "")}
        ${renderInputField("title", "Títol", chronicle?.title || "")}
        ${renderInputField("date", "Data", chronicle?.date || "")}
        ${renderReferenceTextareaField("summary", "Resum principal", chronicle?.summary || "")}
        ${renderReferenceTextareaField("content", "Cos del capítol", chronicle?.content || "", 8)}
        ${renderReferenceTextareaField("highlights", "Highlights", chronicle?.highlights || "")}
        ${renderTextareaField("imageNote", "Descripció visual", chronicle?.imageNote || "")}
        ${renderTextareaField("imageAssets", "Imatges (una URL o ruta per línia)", (chronicle?.imageAssets || []).join("\n"))}
        ${renderTextareaField("voiceNotes", "Notes de veu (una URL o ruta per línia)", (chronicle?.voiceNotes || []).join("\n"))}
        <div class="field span-2">
          <span>Personatges implicats</span>
          <div class="link-list">
            ${state.characters
              .map(
                (character) => `
                  <label>
                    <input
                      type="checkbox"
                      name="characterIds"
                      value="${character.id}"
                      ${selected.has(character.id) ? "checked" : ""}
                    />
                    ${escapeHtml(character.name)}
                  </label>
                `,
              )
              .join("")}
          </div>
        </div>
        <button type="submit">Desa crònica</button>
        <button type="button" class="secondary" data-create-chronicle>Nova crònica</button>
        <button type="button" class="secondary" data-delete-chronicle>Esborra crònica</button>
      </form>
    </section>
  `;
}

function renderGlossaryModule() {
  const categories = ["Totes", "Ubicacions", "Races", "Monstres", "Faccions", "Objectes"];
  const entries = getFilteredGlossaryEntries();
  const current = entries.find((entry) => entry.id === state.ui.selectedGlossaryId) || entries[0];

  if (current && current.id !== state.ui.selectedGlossaryId) {
    state.ui.selectedGlossaryId = current.id;
  }

  glossaryModule.innerHTML = `
    <section class="glossary-shell">
      <div class="glossary-top">
        <div class="parchment-block">
          <p class="eyebrow">Filtres</p>
          <div class="field">
            <span>Cerca</span>
            <input
              name="glossarySearch"
              type="search"
              placeholder="Cerca termes del món..."
              value="${escapeAttribute(state.ui.glossarySearch)}"
            />
          </div>
          <div class="category-filter">
            ${categories
              .map(
                (category) => `
                  <button
                    type="button"
                    class="filter-chip ${state.ui.glossaryCategory === category ? "active" : ""}"
                    data-glossary-filter="${category}"
                  >
                    ${escapeHtml(category)}
                  </button>
                `,
              )
              .join("")}
          </div>
        </div>
        <div class="glossary-detail">
          ${state.ui.glossaryReturnChronicleId ? renderGlossaryBackLink() : ""}
          ${current ? renderGlossaryDetail(current) : `<div class="empty-state">No hi ha entrades al glossari.</div>`}
        </div>
      </div>
      <div class="glossary-grid">
        ${
          entries.length
            ? entries.map(renderGlossaryCard).join("")
            : `<div class="empty-state">Cap entrada coincideix amb la cerca actual.</div>`
        }
      </div>
      ${state.ui.isEditMode ? renderGlossaryEditor(current) : ""}
    </section>
  `;
}

function renderGlossaryBackLink() {
  const chronicle = state.chronicles.find((item) => item.id === state.ui.glossaryReturnChronicleId);
  const label = chronicle
    ? `${chronicle.chapter} · ${chronicle.title}`
    : "la crònica d'origen";
  return `
    <div class="section-card glossary-return">
      <p class="eyebrow">Navegació ràpida</p>
      <button type="button" class="secondary" data-return-to-chronicle>
        Volver a ${escapeHtml(label)}
      </button>
    </div>
  `;
}

function renderGlossaryCard(entry) {
  return `
    <article
      class="glossary-entry ${entry.id === state.ui.selectedGlossaryId ? "active" : ""}"
      data-glossary-id="${entry.id}"
      style="${paletteStyle(entry.palette)}"
    >
      <p class="eyebrow">${escapeHtml(entry.category)}</p>
      <h3>${escapeHtml(entry.name)}</h3>
      <p>${escapeHtml(shortText(entry.description, 120))}</p>
      <div class="card-tags">
        ${entry.tags.map((tag) => `<span class="badge">${escapeHtml(tag)}</span>`).join("")}
      </div>
    </article>
  `;
}

function renderGlossaryDetail(entry) {
  return `
    <div class="parchment-block">
      <p class="eyebrow">${escapeHtml(entry.category)}</p>
      <h3>${escapeHtml(entry.name)}</h3>
      <div class="glossary-hero" style="${paletteStyle(entry.palette)}"></div>
      <p>${escapeHtml(entry.description)}</p>
      ${renderTextCard("Etiquetes", entry.tags.join(", "))}
      ${renderTextCard("Notes", entry.notes)}
      ${renderTextCard("Personatges vinculats", formatCharacterLinks(entry.characterIds))}
      ${renderTextCard("Cròniques vinculades", formatChronicleLinks(entry.chronicleIds))}
    </div>
  `;
}

function renderGlossaryEditor(entry) {
  const selectedCharacters = new Set(entry?.characterIds || []);
  const selectedChronicles = new Set(entry?.chronicleIds || []);
  return `
    <section class="module-surface">
      <p class="eyebrow">Editar entrada de glossari</p>
      <form data-form="glossary" class="editor-grid">
        <input type="hidden" name="id" value="${escapeAttribute(entry?.id || "")}" />
        ${renderInputField("name", "Nom", entry?.name || "")}
        <label class="field">
          <span>Categoria</span>
          <select name="category">
            ${["Ubicacions", "Races", "Monstres", "Faccions", "Objectes"]
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
        ${renderTextareaField("description", "Descripció", entry?.description || "")}
        ${renderInputField("tags", "Etiquetes (separades per comes)", (entry?.tags || []).join(", "))}
        ${renderTextareaField("notes", "Notes", entry?.notes || "")}
        <div class="field span-2">
          <span>Personatges vinculats</span>
          <div class="link-list">
            ${state.characters
              .map(
                (character) => `
                  <label>
                    <input
                      type="checkbox"
                      name="characterIds"
                      value="${character.id}"
                      ${selectedCharacters.has(character.id) ? "checked" : ""}
                    />
                    ${escapeHtml(character.name)}
                  </label>
                `,
              )
              .join("")}
          </div>
        </div>
        <div class="field span-2">
          <span>Cròniques vinculades</span>
          <div class="link-list">
            ${state.chronicles
              .map(
                (chronicle) => `
                  <label>
                    <input
                      type="checkbox"
                      name="chronicleIds"
                      value="${chronicle.id}"
                      ${selectedChronicles.has(chronicle.id) ? "checked" : ""}
                    />
                    ${escapeHtml(chronicle.chapter)} · ${escapeHtml(chronicle.title)}
                  </label>
                `,
              )
              .join("")}
          </div>
        </div>
        <button type="submit">Desa entrada</button>
        <button type="button" class="secondary" data-create-glossary>Nova entrada</button>
        <button type="button" class="secondary" data-delete-glossary>Esborra entrada</button>
      </form>
    </section>
  `;
}

function saveCharacterOverview(formData) {
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
  persistAndRender();
}

function saveCharacterTab(formData) {
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

  persistAndRender();
}

function saveChronicle(formData) {
  const chronicle = getSelectedChronicle();
  if (!chronicle) {
    return;
  }

  chronicle.chapter = readString(formData, "chapter");
  chronicle.title = readString(formData, "title");
  chronicle.date = readString(formData, "date");
  chronicle.summary = readString(formData, "summary");
  chronicle.content = readString(formData, "content");
  chronicle.highlights = readString(formData, "highlights");
  chronicle.imageNote = readString(formData, "imageNote");
  chronicle.imageAssets = splitLines(readString(formData, "imageAssets"));
  chronicle.voiceNotes = splitLines(readString(formData, "voiceNotes"));
  chronicle.characterIds = formData.getAll("characterIds").map(String);
  persistAndRender();
}

function saveGlossary(formData) {
  const entry = findGlossaryEntry(readString(formData, "id"));
  if (!entry) {
    return;
  }

  entry.name = readString(formData, "name");
  entry.category = readString(formData, "category");
  entry.description = readString(formData, "description");
  entry.tags = splitTags(readString(formData, "tags"));
  entry.notes = readString(formData, "notes");
  entry.characterIds = formData.getAll("characterIds").map(String);
  entry.chronicleIds = formData.getAll("chronicleIds").map(String);
  persistAndRender();
}

function exportData() {
  const data = JSON.stringify(state, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "compendi-campanya.json";
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
      state = sanitizeState(JSON.parse(reader.result));
      persistAndRender();
    } catch {
      window.alert("El fitxer importat no és compatible amb el compendi.");
    }
  });
  reader.readAsText(file);
  importInput.value = "";
}

function persistAndRender() {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  render();
}

function loadState() {
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    return structuredClone(seedData);
  }

  try {
    return sanitizeState(JSON.parse(saved));
  } catch {
    return structuredClone(seedData);
  }
}

function sanitizeState(candidate) {
  const safe = structuredClone(seedData);
  if (!candidate || typeof candidate !== "object") {
    return safe;
  }

  safe.characters = Array.isArray(candidate.characters) && candidate.characters.length
    ? candidate.characters.map((character, index) => sanitizeCharacter(character, seedData.characters[index] || seedData.characters[0]))
    : safe.characters;
  safe.chronicles = Array.isArray(candidate.chronicles) && candidate.chronicles.length
    ? candidate.chronicles.map((chronicle, index) => sanitizeChronicle(chronicle, seedData.chronicles[index] || seedData.chronicles[0]))
    : safe.chronicles;
  safe.glossary = Array.isArray(candidate.glossary) && candidate.glossary.length
    ? candidate.glossary.map((entry, index) => sanitizeGlossary(entry, seedData.glossary[index] || seedData.glossary[0]))
    : safe.glossary;
  safe.ui = {
    ...safe.ui,
    ...candidate.ui,
  };

  if (!safe.characters.some((character) => character.id === safe.ui.selectedCharacterId)) {
    safe.ui.selectedCharacterId = safe.characters[0]?.id || "";
  }
  if (!safe.chronicles.some((chronicle) => chronicle.id === safe.ui.selectedChronicleId)) {
    safe.ui.selectedChronicleId = safe.chronicles[0]?.id || "";
  }
  if (!safe.glossary.some((entry) => entry.id === safe.ui.selectedGlossaryId)) {
    safe.ui.selectedGlossaryId = safe.glossary[0]?.id || "";
  }

  return safe;
}

function sanitizeCharacter(character, fallback) {
  return {
    ...structuredClone(fallback),
    ...character,
    lore: { ...structuredClone(fallback).lore, ...(character?.lore || {}) },
    sheet: { ...structuredClone(fallback).sheet, ...(character?.sheet || {}) },
    inventory: { ...structuredClone(fallback).inventory, ...(character?.inventory || {}) },
    palette: Array.isArray(character?.palette) ? character.palette : fallback.palette,
  };
}

function sanitizeChronicle(chronicle, fallback) {
  return {
    ...structuredClone(fallback),
    ...chronicle,
    characterIds: Array.isArray(chronicle?.characterIds) ? chronicle.characterIds : fallback.characterIds,
    imageAssets: Array.isArray(chronicle?.imageAssets) ? chronicle.imageAssets : splitLines(chronicle?.imageAssets || fallback.imageAssets?.join("\n") || ""),
    voiceNotes: Array.isArray(chronicle?.voiceNotes) ? chronicle.voiceNotes : splitLines(chronicle?.voiceNotes || fallback.voiceNotes?.join("\n") || ""),
    palette: Array.isArray(chronicle?.palette) ? chronicle.palette : fallback.palette,
  };
}

function sanitizeGlossary(entry, fallback) {
  return {
    ...structuredClone(fallback),
    ...entry,
    tags: Array.isArray(entry?.tags) ? entry.tags : splitTags(entry?.tags || fallback.tags.join(", ")),
    characterIds: Array.isArray(entry?.characterIds) ? entry.characterIds : fallback.characterIds,
    chronicleIds: Array.isArray(entry?.chronicleIds) ? entry.chronicleIds : fallback.chronicleIds,
    palette: Array.isArray(entry?.palette) ? entry.palette : fallback.palette,
  };
}

function createChronicle() {
  const newChronicle = {
    id: `s${Date.now()}`,
    chapter: `Sessió ${state.chronicles.length + 1}`,
    title: "Nova crònica",
    date: "",
    summary: "",
    content: "",
    highlights: "",
    imageNote: "",
    imageAssets: [],
    voiceNotes: [],
    characterIds: [],
    palette: ["#64483d", "#c8a86d"],
  };
  state.chronicles.push(newChronicle);
  state.ui.selectedChronicleId = newChronicle.id;
  persistAndRender();
}

function deleteChronicle() {
  if (state.chronicles.length <= 1) {
    return;
  }
  state.chronicles = state.chronicles.filter((chronicle) => chronicle.id !== state.ui.selectedChronicleId);
  state.ui.selectedChronicleId = state.chronicles[0].id;
  persistAndRender();
}

function createGlossaryEntry() {
  const entry = {
    id: `g${Date.now()}`,
    name: "Nova entrada",
    category: "Ubicacions",
    description: "",
    tags: [],
    notes: "",
    characterIds: [],
    chronicleIds: [],
    palette: ["#54616a", "#c6a26a"],
  };
  state.glossary.unshift(entry);
  state.ui.selectedGlossaryId = entry.id;
  persistAndRender();
}

function deleteGlossaryEntry() {
  if (state.glossary.length <= 1) {
    return;
  }
  state.glossary = state.glossary.filter((entry) => entry.id !== state.ui.selectedGlossaryId);
  state.ui.selectedGlossaryId = state.glossary[0].id;
  persistAndRender();
}

function getSelectedCharacter() {
  return findCharacter(state.ui.selectedCharacterId);
}

function getSelectedChronicle() {
  return state.chronicles.find((chronicle) => chronicle.id === state.ui.selectedChronicleId) || state.chronicles[0];
}

function getAdjacentChronicleId(direction) {
  const index = state.chronicles.findIndex((chronicle) => chronicle.id === state.ui.selectedChronicleId);
  if (index === -1) {
    return state.chronicles[0]?.id || null;
  }

  if (direction === "prev") {
    return state.chronicles[index - 1]?.id || state.chronicles[index]?.id;
  }

  return state.chronicles[index + 1]?.id || state.chronicles[index]?.id;
}

function getFilteredGlossaryEntries() {
  const search = state.ui.glossarySearch.toLowerCase();
  return state.glossary.filter((entry) => {
    const matchesCategory =
      state.ui.glossaryCategory === "Totes" || entry.category === state.ui.glossaryCategory;
    const haystack = `${entry.name} ${entry.description} ${entry.tags.join(" ")} ${entry.notes}`.toLowerCase();
    const matchesSearch = !search || haystack.includes(search);
    return matchesCategory && matchesSearch;
  });
}

function animateBook(direction = "next") {
  const spread = document.querySelector("#bookSpread");
  if (!spread) {
    return;
  }
  spread.classList.remove("turn-next", "turn-prev");
  spread.classList.add("turning", direction === "prev" ? "turn-prev" : "turn-next");
  window.clearTimeout(bookTurnTimer);
  bookTurnTimer = window.setTimeout(() => {
    spread.classList.remove("turning", "turn-next", "turn-prev");
  }, 860);
}

function findCharacter(id) {
  return state.characters.find((character) => character.id === id);
}

function findGlossaryEntry(id) {
  return state.glossary.find((entry) => entry.id === id);
}

function formatCharacterLinks(ids) {
  return ids.map((id) => findCharacter(id)?.name).filter(Boolean).join(", ") || "Sense lligams";
}

function formatChronicleLinks(ids) {
  return ids
    .map((id) => state.chronicles.find((chronicle) => chronicle.id === id))
    .filter(Boolean)
    .map((chronicle) => `${chronicle.chapter} · ${chronicle.title}`)
    .join(", ") || "Sense lligams";
}

function splitTags(value) {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function paletteStyle(palette) {
  return `--portrait-a: ${palette[0]}; --portrait-b: ${palette[1]};`;
}

function characterTabLabel(tab) {
  return {
    lore: "Lore",
    sheet: "Fitxa",
    inventory: "Inventari",
    history: "Història personal",
  }[tab];
}

function renderTextCard(title, text, options = { rich: false }) {
  const content = options.rich ? renderChronicleRichText(text) : escapeHtml(text);
  return `
    <article class="section-card">
      <p class="eyebrow">${escapeHtml(title)}</p>
      <p>${content}</p>
    </article>
  `;
}

function renderInputField(name, label, value) {
  return `
    <label class="field">
      <span>${escapeHtml(label)}</span>
      <input name="${name}" value="${escapeAttribute(value)}" />
    </label>
  `;
}

function renderTextareaField(name, label, value) {
  return `
    <label class="field span-2">
      <span>${escapeHtml(label)}</span>
      <textarea name="${name}" rows="3">${escapeHtml(value)}</textarea>
    </label>
  `;
}

function renderReferenceTextareaField(name, label, value, rows = 3) {
  const inputId = `chronicle-ref-${name}`;
  return `
    <label class="field span-2 reference-field">
      <span>${escapeHtml(label)}</span>
      <textarea
        id="${inputId}"
        name="${name}"
        rows="${rows}"
        data-ref-input="glossary"
        data-suggestion-target="${inputId}-suggestions"
      >${escapeHtml(value)}</textarea>
      <div id="${inputId}-suggestions" class="reference-suggestions"></div>
      <small class="field-help">Escriu un nom del glossari i selecciona la suggerència per inserir una referència clicable.</small>
    </label>
  `;
}

function readString(formData, key) {
  return formData.get(key)?.toString().trim() || "";
}

function shortText(value, maxLength) {
  if (value.length <= maxLength) {
    return value;
  }
  return `${value.slice(0, maxLength - 1)}…`;
}

function splitLines(value) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function renderChronicleRichText(text) {
  return String(text || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `<p>${replaceGlossaryReferences(line)}</p>`)
    .join("") || "<p>Sense contingut.</p>";
}

function replaceGlossaryReferences(value) {
  return escapeHtml(value).replaceAll(
    /\[\[([a-zA-Z0-9-_]+)\|([^\]]+)\]\]/g,
    (_full, id, label) =>
      `<button type="button" class="glossary-inline-link" data-glossary-jump="${id}">${escapeHtml(label)}</button>`,
  );
}

function renderChronicleMedia(chronicle) {
  const images = (chronicle?.imageAssets || []).filter(Boolean);
  const notes = (chronicle?.voiceNotes || []).filter(Boolean);
  if (!images.length && !notes.length) {
    return renderTextCard("Recursos", "Sense imatges ni notes de veu vinculades encara.");
  }

  return `
    <article class="section-card chronicle-media-card">
      <p class="eyebrow">Recursos vinculats</p>
      ${images.length
        ? `<div class="chronicle-image-grid">
            ${images
              .map(
                (source, index) => `
                  <figure>
                    <img src="${escapeAttribute(source)}" alt="Imatge de crònica ${index + 1}" loading="lazy" />
                    <figcaption>${escapeHtml(source)}</figcaption>
                  </figure>
                `,
              )
              .join("")}
          </div>`
        : ""}
      ${notes.length
        ? `<div class="chronicle-audio-list">
            ${notes
              .map(
                (source) => `
                  <label>
                    <span>${escapeHtml(source)}</span>
                    <audio controls preload="none" src="${escapeAttribute(source)}"></audio>
                  </label>
                `,
              )
              .join("")}
          </div>`
        : ""}
    </article>
  `;
}

function renderReferenceSuggestions(textarea) {
  const targetId = textarea.dataset.suggestionTarget;
  if (!targetId) {
    return;
  }
  const container = document.querySelector(`#${targetId}`);
  if (!(container instanceof HTMLElement)) {
    return;
  }

  const token = getCurrentToken(textarea);
  if (!token || token.length < 2) {
    container.innerHTML = "";
    return;
  }

  const matches = state.glossary
    .filter((entry) => entry.name.toLowerCase().includes(token.toLowerCase()))
    .slice(0, 5);

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
  const match = before.match(/([a-zA-ZÀ-ÿ0-9'’-]{2,})$/);
  return match ? match[1] : "";
}

function insertGlossaryReference(textarea, glossaryId, glossaryName) {
  const cursor = textarea.selectionStart || 0;
  const before = textarea.value.slice(0, cursor);
  const after = textarea.value.slice(cursor);
  const match = before.match(/([a-zA-ZÀ-ÿ0-9'’-]{2,})$/);
  const replaceFrom = match ? cursor - match[1].length : cursor;
  const token = `[[${glossaryId}|${glossaryName}]]`;
  textarea.value = `${textarea.value.slice(0, replaceFrom)}${token}${after}`;
  const next = replaceFrom + token.length;
  textarea.setSelectionRange(next, next);
  textarea.focus();
  renderReferenceSuggestions(textarea);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll("\n", "&#10;");
}
