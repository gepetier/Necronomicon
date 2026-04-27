const params = new URLSearchParams(window.location.search);
const suite = params.get("suite") || "functional";
const mode = params.get("mode") || "desktop";
const iframe = document.querySelector("#appFrame");
const reportEl = document.querySelector("#report");
const statusEl = document.querySelector("#statusLabel");
const suiteLabelEl = document.querySelector("#suiteLabel");
const modeLabelEl = document.querySelector("#modeLabel");

suiteLabelEl.textContent = `suite=${suite}`;
modeLabelEl.textContent = `mode=${mode}`;

const STORAGE_KEYS = ["campaign-compendium", "campaign-compendium-v2"];

bootstrap().catch((error) => {
  publish({
    ok: false,
    suite,
    mode,
    error: error instanceof Error ? error.message : String(error),
    steps: [],
  });
});

async function bootstrap() {
  resetStorage(window.localStorage);
  const frameLoaded = onceLoaded(iframe);
  iframe.src = `/index.html?qaRun=${Date.now()}`;
  await frameLoaded;
  await delay(200);

  const context = createContext(iframe);
  const result = suite === "ui"
    ? await runUiSuite(context)
    : suite === "edit"
      ? await runEditSuite(context)
      : await runFunctionalSuite(context);

  publish(result);
}

function createContext(currentFrame) {
  const doc = currentFrame.contentDocument;
  const win = currentFrame.contentWindow;
  if (!doc || !win) {
    throw new Error("No s'ha pogut accedir al document de l'aplicacio.");
  }

  return {
    doc,
    win,
    mode,
    suite,
    click(selector) {
      const target = doc.querySelector(selector);
      if (!(target instanceof win.HTMLElement)) {
        throw new Error(`Element no trobat: ${selector}`);
      }
      target.click();
    },
    pressKey(key) {
      doc.dispatchEvent(new win.KeyboardEvent("keydown", { key, bubbles: true }));
    },
    type(selector, value) {
      const target = doc.querySelector(selector);
      if (!(target instanceof win.HTMLInputElement) && !(target instanceof win.HTMLTextAreaElement)) {
        throw new Error(`Camp no trobat: ${selector}`);
      }
      target.focus();
      target.value = value;
      target.dispatchEvent(new win.Event("input", { bubbles: true }));
      target.dispatchEvent(new win.Event("change", { bubbles: true }));
    },
    selectText(selector, value) {
      const target = doc.querySelector(selector);
      if (!(target instanceof win.HTMLInputElement) && !(target instanceof win.HTMLTextAreaElement)) {
        throw new Error(`Camp no trobat per seleccionar text: ${selector}`);
      }

      const start = target.value.indexOf(value);
      if (start === -1) {
        throw new Error(`Text no trobat al camp ${selector}: ${value}`);
      }

      target.focus();
      target.setSelectionRange(start, start + value.length);
      target.dispatchEvent(new win.MouseEvent("click", { bubbles: true }));
    },
    submit(selector) {
      const form = doc.querySelector(selector);
      if (!(form instanceof win.HTMLFormElement)) {
        throw new Error(`Formulari no trobat: ${selector}`);
      }
      form.requestSubmit();
    },
    qsa(selector) {
      return Array.from(doc.querySelectorAll(selector));
    },
  };
}

async function runFunctionalSuite(context) {
  const steps = [];

  const initialCards = context.qsa("[data-character-card]");
  record(
    steps,
    initialCards.length === 4,
    "Render inicial amb 4 cartes de personatge",
    { cards: initialCards.length },
  );

  context.click(".portrait-media");
  await delay(80);
  record(
    steps,
    context.doc.querySelector("#imageLightbox:not([hidden])") !== null
      && context.doc.querySelector(".detail-card") === null,
    "Clicar la imatge d'una targeta obre el lightbox sense entrar al detall del personatge",
  );
  context.pressKey("Escape");
  await delay(80);
  record(
    steps,
    context.doc.querySelector("#imageLightbox[hidden]") !== null,
    "La tecla Escape tanca el lightbox d'imatges",
  );

  const firstName = initialCards[0]?.querySelector("h3")?.textContent?.trim() || "";
  context.click('[data-character-card="ilu"]');
  await delay(80);
  record(
    steps,
    Boolean(context.doc.querySelector(".detail-card")),
    "Obrir el detall d'un personatge des de la graella",
    { selectedCharacter: firstName },
  );

  const detailName = context.doc.querySelector(".detail-summary h3")?.textContent?.trim() || "";
  record(
    steps,
    detailName === firstName,
    "El detall mostra el mateix personatge seleccionat",
    { expected: firstName, actual: detailName },
  );

  context.click('[data-module-link="chronicles"]');
  await delay(80);
  const chapterEntries = context.qsa(".chapter-entry");
  record(
    steps,
    context.doc.querySelector("#chroniclesModule.active") !== null && chapterEntries.length > 0,
    "Navegacio al modul de croniques amb index carregat",
    { chapters: chapterEntries.length },
  );

  context.click('[data-module-link="glossary"]');
  await delay(80);
  const glossaryBefore = context.qsa(".glossary-entry");
  const searchSeed = glossaryBefore[0]?.querySelector("h3")?.textContent?.trim() || "";
  const searchTerm = searchSeed.slice(0, Math.min(5, searchSeed.length));
  context.type('input[name="glossarySearch"]', searchTerm);
  await delay(80);
  const glossaryAfter = context.qsa(".glossary-entry");
  const glossarySearchFocusName = context.doc.activeElement?.getAttribute?.("name") || "";
  const glossarySearchValue = context.doc.querySelector('input[name="glossarySearch"]')?.value || "";
  record(
    steps,
    glossaryBefore.length > 0
      && glossaryAfter.length > 0
      && glossaryAfter.length <= glossaryBefore.length
      && glossarySearchFocusName === "glossarySearch"
      && glossarySearchValue === searchTerm,
    "La cerca del glossari redueix o mante un subconjunt consistent",
    {
      before: glossaryBefore.length,
      after: glossaryAfter.length,
      searchTerm,
      glossarySearchFocusName,
      glossarySearchValue,
    },
  );

  context.type('input[name="glossarySearch"]', "religio");
  await delay(80);
  const accentInsensitiveResults = context.qsa(".glossary-entry h3").map((element) => element.textContent?.trim() || "");
  record(
    steps,
    accentInsensitiveResults.includes("Kaelor, el Portador del Silenci"),
    "La cerca del glossari es tolerant a accents i troba categories",
    { accentInsensitiveResults },
  );

  context.type('input[name="glossarySearch"]', "");
  await delay(80);
  context.click('input[data-glossary-session="judici-acantilado"]');
  await delay(80);
  const sessionResults = context.qsa(".glossary-entry h3").map((element) => element.textContent?.trim() || "");
  const sessionChecked = context.doc.querySelector('input[data-glossary-session="judici-acantilado"]')?.checked || false;
  record(
    steps,
    sessionResults.length > 0
      && sessionResults.includes("Acantilado del Silencio")
      && !sessionResults.includes("Sagnatori")
      && sessionChecked,
    "El filtre de sessions del glossari mostra nomes entrades referenciades a la sessio marcada",
    { sessionResults, sessionChecked },
  );

  context.click("[data-clear-glossary-filters]");
  await delay(80);
  context.qsa(".glossary-entry")[0]?.click();
  await delay(80);
  const glossaryTitle = context.doc.querySelector(".glossary-detail h3")?.textContent?.trim() || "";
  record(
    steps,
    glossaryTitle.length > 0,
    "La seleccio d'una entrada del glossari mostra el detall",
    { glossaryTitle },
  );

  context.click('[data-glossary-filter="Altres"]');
  await delay(80);
  context.click('[data-glossary-id="uric"]');
  await delay(80);
  const glossaryLatestCopy = context.doc.querySelector(".glossary-latest-copy")?.textContent?.trim() || "";
  const glossaryLatestChronicle = context.doc.querySelector(".glossary-latest-chronicle")?.textContent?.trim() || "";
  record(
    steps,
    glossaryLatestCopy.includes("Probablement mort")
      && glossaryLatestChronicle.includes("Ultima vegada vist a:")
      && glossaryLatestChronicle.includes("Sessió 2"),
    "El detall del glossari mostra l'estat actual i l'ultima sessio rellevant",
    { glossaryLatestCopy, glossaryLatestChronicle },
  );

  context.click('[data-glossary-filter="Religió"]');
  await delay(80);
  context.click('input[data-glossary-session="sagnatori"]');
  await delay(80);
  context.click('[data-module-link="chronicles"]');
  await delay(80);
  context.click('[data-reference-jump="acantilado-del-silencio"]');
  await delay(80);
  const jumpedGlossaryTitle = context.doc.querySelector(".glossary-detail h3")?.textContent?.trim() || "";
  const activeGlossaryCardTitle = context.doc.querySelector(".glossary-entry.active h3")?.textContent?.trim() || "";
  const jumpedGlossarySearch = context.doc.querySelector('input[name="glossarySearch"]')?.value || "";
  const activeGlossaryFilter = context.doc.querySelector('[data-glossary-filter][aria-selected="true"]')?.getAttribute("data-glossary-filter") || "";
  const activeGlossarySessions = context.qsa('input[data-glossary-session]:checked').map((element) => element.getAttribute("data-glossary-session") || "");
  record(
    steps,
    context.doc.querySelector("#glossaryModule.active") !== null
      && jumpedGlossaryTitle === "Acantilado del Silencio"
      && activeGlossaryCardTitle === "Acantilado del Silencio"
      && jumpedGlossarySearch === ""
      && activeGlossaryFilter === "Totes"
      && activeGlossarySessions.length === 0
      && context.doc.querySelector("[data-return-to-chronicle]") !== null,
    "El salt des de croniques obre el terme del glossari i neteja filtres incompatibles",
    {
      jumpedGlossaryTitle,
      activeGlossaryCardTitle,
      jumpedGlossarySearch,
      activeGlossaryFilter,
      activeGlossarySessions,
    },
  );

  context.click("[data-return-to-chronicle]");
  await delay(80);
  const selectedChronicleId = context.doc.querySelector('[data-chronicle-id][aria-selected="true"]')?.getAttribute("data-chronicle-id") || "";
  record(
    steps,
    context.doc.querySelector("#chroniclesModule.active") !== null && selectedChronicleId === "judici-acantilado",
    "El retorn des del glossari recupera la cronica d'origen",
    { selectedChronicleId },
  );

  return {
    ok: steps.every((step) => step.ok),
    suite: context.suite,
    mode: context.mode,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    steps,
  };
}

async function runUiSuite(context) {
  const steps = [];
  const appShell = context.doc.querySelector(".app-shell");
  const characterGrid = context.doc.querySelector(".character-grid");
  const appDisplay = appShell ? context.win.getComputedStyle(appShell).display : "missing";
  const gridColumns = readColumnCount(context, characterGrid);

  if (mode === "desktop") {
    record(
      steps,
      appDisplay === "grid",
      "Layout principal en grid a PC",
      { display: appDisplay },
    );
    record(
      steps,
      gridColumns >= 2,
      "La graella inicial de personatges mostra multiples columnes a PC",
      { gridColumns },
    );

    context.click('[data-module-link="chronicles"]');
    await delay(80);
    const sidebarPanel = context.doc.querySelector("#sidebarContextPanel");
    const sidebarIndex = sidebarPanel?.querySelector(".book-index-sidebar");
    const bookLayout = context.doc.querySelector(".book-layout");
    const bookColumns = readColumnCount(context, bookLayout);
    record(
      steps,
      Boolean(sidebarIndex) && !sidebarPanel?.hidden && bookColumns === 1,
      "La vista de croniques mostra subindex lateral i llibre separat a PC",
      {
        sidebarIndex: Boolean(sidebarIndex),
        sidebarHidden: sidebarPanel?.hidden ?? null,
        bookColumns,
      },
    );
  } else {
    record(
      steps,
      appDisplay === "block",
      "Layout principal apilat a mobil",
      { display: appDisplay },
    );
    record(
      steps,
      gridColumns === 1,
      "La graella inicial de personatges col-lapsa a una sola columna a mobil",
      { gridColumns },
    );

    context.click('[data-module-link="chronicles"]');
    await delay(80);
    const bookLayout = context.doc.querySelector(".book-layout");
    const bookColumns = readColumnCount(context, bookLayout);
    record(
      steps,
      bookColumns === 1,
      "La vista de croniques s'apila en una sola columna a mobil",
      { bookColumns },
    );
  }

  return {
    ok: steps.every((step) => step.ok),
    suite: context.suite,
    mode: context.mode,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    steps,
  };
}

async function runEditSuite(context) {
  const steps = [];

  record(
    steps,
    context.doc.querySelector("[data-open-character-editor]") !== null,
    "La vista de personatges exposa un acces local a l'edicio",
  );

  context.click("[data-open-character-editor]");
  await delay(80);
  record(
    steps,
    context.doc.querySelector(".editor-workspace-character") !== null,
    "L'editor de personatges s'obre des del modul",
  );

  context.type('form[data-form="character-overview"] input[name="title"]', "Titol QA");
  await delay(60);
  context.click('[data-module-link="chronicles"]');
  await delay(80);
  context.click('[data-module-link="characters"]');
  await delay(80);
  const persistedCharacterDraft = context.doc.querySelector('form[data-form="character-overview"] input[name="title"]')?.value || "";
  record(
    steps,
    persistedCharacterDraft === "Titol QA",
    "El draft de personatge es mante en navegar entre moduls",
    { value: persistedCharacterDraft },
  );

  context.click("[data-save-character]");
  await delay(80);
  const savedCharacterTitle = context.doc.querySelector(".detail-portrait-inner p:last-child")?.textContent?.trim() || "";
  record(
    steps,
    context.doc.querySelector(".editor-workspace-character") === null && savedCharacterTitle === "Titol QA",
    "Desar el personatge aplica els canvis i tanca el mode edicio",
    { savedCharacterTitle },
  );

  context.click('[data-module-link="chronicles"]');
  await delay(80);
  record(
    steps,
    context.doc.querySelector("[data-create-chronicle]") !== null,
    "Croniques mostra una accio visible per crear noves entrades",
  );

  context.click('[data-toggle-edit="chronicles"]');
  await delay(80);
  record(
    steps,
    context.doc.querySelector(".editor-workspace-chronicle") !== null,
    "L'editor de croniques es visible en el layout actual",
  );
  record(
    steps,
    context.doc.querySelector(".chronicle-edit-sidebar") === null,
    "L'editor de croniques no mostra la sidebar lateral antiga",
  );

  context.type('form[data-form="chronicle"] input[name="title"]', "Cronica QA");
  await delay(60);
  context.type('form[data-form="chronicle"] textarea[name="content"]', "Catedral");
  await delay(80);
  context.selectText('form[data-form="chronicle"] textarea[name="content"]', "Catedral");
  await delay(80);
  const glossaryReferenceSuggestions = context.qsa(".reference-suggestions .suggestion-chip")
    .map((element) => element.textContent?.trim() || "");
  context.click('[data-insert-reference="catedral-del-silencio"]');
  await delay(80);
  const referencedChronicleContent = context.doc.querySelector('form[data-form="chronicle"] textarea[name="content"]')?.value || "";
  record(
    steps,
    glossaryReferenceSuggestions.some((label) => label.includes("Catedral del Silencio"))
      && referencedChronicleContent === "[[catedral-del-silencio|Catedral]]",
    "La referència de glossari conserva el text seleccionat i només canvia el destí de la referència",
    { glossaryReferenceSuggestions, referencedChronicleContent },
  );
  context.type('form[data-form="chronicle"] textarea[name="content"]', "Ilu");
  await delay(80);
  context.selectText('form[data-form="chronicle"] textarea[name="content"]', "Ilu");
  await delay(80);
  const characterReferenceSuggestions = context.qsa(".reference-suggestions .suggestion-chip")
    .map((element) => element.textContent?.trim() || "");
  context.click('[data-insert-reference="ilu"]');
  await delay(80);
  const referencedCharacterContent = context.doc.querySelector('form[data-form="chronicle"] textarea[name="content"]')?.value || "";
  record(
    steps,
    characterReferenceSuggestions.some((label) => label.includes("Ilu") && label.includes("Personatge"))
      && referencedCharacterContent === "[[ilu|Ilu]]",
    "La referÃ¨ncia de personatge conserva el text seleccionat i apunta a la fitxa principal",
    { characterReferenceSuggestions, referencedCharacterContent },
  );
  const originalConfirm = context.win.confirm;
  context.win.confirm = () => false;
  const nextChronicle = context.qsa("[data-chronicle-id]").find((element) => element.getAttribute("aria-selected") !== "true");
  nextChronicle?.click();
  await delay(80);
  context.win.confirm = originalConfirm;
  const selectedChronicleTitle = context.doc.querySelector('[data-chronicle-id][aria-selected="true"] .chapter-entry-copy p')?.textContent?.trim() || "";
  record(
    steps,
    context.doc.querySelector(".editor-workspace-chronicle") === null && selectedChronicleTitle.length > 0,
    "Canviar de cronica en edicio obliga a sortir del mode edicio i entrar a la seguent",
    { selectedChronicleTitle },
  );
  context.click('[data-toggle-edit="chronicles"]');
  await delay(80);
  const switchedChronicleDraft = context.doc.querySelector('form[data-form="chronicle"] input[name="title"]')?.value || "";
  record(
    steps,
    switchedChronicleDraft !== "Cronica QA",
    "Canviar de cronica no arrastra l'esborrany de l'anterior",
    { value: switchedChronicleDraft },
  );

  context.type('form[data-form="chronicle"] input[name="title"]', "Cronica QA");
  await delay(60);
  context.click('[data-module-link="glossary"]');
  await delay(80);
  context.click('[data-module-link="chronicles"]');
  await delay(80);
  const persistedChronicleDraft = context.doc.querySelector('form[data-form="chronicle"] input[name="title"]')?.value || "";
  record(
    steps,
    persistedChronicleDraft === "Cronica QA",
    "El draft de cronica es conserva entre canvis de modul",
    { value: persistedChronicleDraft },
  );
  context.click('[data-discard-chronicle-edit]');
  await delay(80);
  record(
    steps,
    context.doc.querySelector(".editor-workspace-chronicle") === null,
    "Descartar canvis tanca el mode edicio de croniques",
  );
  context.click('[data-toggle-edit="chronicles"]');
  await delay(80);
  const discardedChronicleDraft = context.doc.querySelector('form[data-form="chronicle"] input[name="title"]')?.value || "";
  record(
    steps,
    discardedChronicleDraft !== "Cronica QA",
    "Descartar canvis rebutja l'esborrany de la cronica actual",
    { value: discardedChronicleDraft },
  );

  context.type('form[data-form="chronicle"] input[name="title"]', "Cronica desada QA");
  await delay(60);
  context.type('form[data-form="chronicle"] textarea[name="content"]', "[[ilu|Ilu]]");
  await delay(60);
  context.submit('form[data-form="chronicle"]');
  await delay(80);
  const savedChronicleTitle = context.doc.querySelector(".page-header h3")?.textContent?.trim() || "";
  record(
    steps,
    context.doc.querySelector(".editor-workspace-chronicle") === null && savedChronicleTitle === "Cronica desada QA",
    "Desar una cronica tanca el mode edicio",
    { savedChronicleTitle },
  );
  context.click('[data-reference-jump="ilu"]');
  await delay(80);
  const jumpedCharacterTitle = context.doc.querySelector(".detail-summary h3")?.textContent?.trim() || "";
  record(
    steps,
    context.doc.querySelector("#charactersModule.active") !== null
      && jumpedCharacterTitle === "Ilu",
    "Una referència de personatge desada dins una cronica obre la fitxa principal corresponent",
    { jumpedCharacterTitle },
  );

  context.click('[data-module-link="glossary"]');
  await delay(80);
  record(
    steps,
    context.doc.querySelector("[data-create-glossary]") !== null,
    "Glossari mostra una accio visible per crear entrades",
  );

  context.click("[data-edit-glossary-card]");
  await delay(80);
  record(
    steps,
    context.doc.querySelector(".editor-workspace-glossary") !== null
      && context.doc.querySelector('input[data-glossary-image-picker]') !== null,
    "L'editor de glossari s'obre des de la targeta de resultat",
  );

  context.type('form[data-form="glossary"] input[name="name"]', "Entrada QA");
  context.type(
    'form[data-form="glossary"] textarea[name="imageAssets"]',
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><rect width="16" height="16" fill="%23c68f57"/></svg>',
  );
  await delay(60);
  context.submit('form[data-form="glossary"]');
  await delay(80);
  const saveNotice = context.doc.querySelector("#saveNotice")?.textContent?.trim() || "";
  const glossaryImageSrc = context.doc.querySelector(".glossary-detail img")?.getAttribute("src") || "";
  record(
    steps,
    saveNotice.length > 0
      && context.doc.querySelector(".editor-workspace-glossary") === null
      && glossaryImageSrc.startsWith("data:image/svg+xml"),
    "Desar una entrada del glossari mostra feedback, tanca el mode edicio i persisteix imatges",
    { notice: saveNotice, glossaryImageSrc },
  );

  return {
    ok: steps.every((step) => step.ok),
    suite: context.suite,
    mode: context.mode,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    steps,
  };
}

function readColumnCount(context, element) {
  if (!(element instanceof context.win.HTMLElement)) {
    return 0;
  }

  const columns = context.win.getComputedStyle(element).gridTemplateColumns;
  if (!columns || columns === "none") {
    return 0;
  }

  return columns.split(" ").filter(Boolean).length;
}

function record(steps, ok, name, details = {}) {
  steps.push({ ok, name, details });
}

function publish(result) {
  statusEl.textContent = result.ok ? "PASS" : "FAIL";
  statusEl.className = result.ok ? "qa-pass" : "qa-fail";
  reportEl.textContent = JSON.stringify(result, null, 2);
  document.body.dataset.qaStatus = result.ok ? "pass" : "fail";
}

function resetStorage(storage) {
  STORAGE_KEYS.forEach((key) => storage.removeItem(key));
}

function onceLoaded(frame) {
  return new Promise((resolve) => {
    frame.addEventListener("load", () => resolve(), { once: true });
  });
}

function delay(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}
