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
  record(
    steps,
    glossaryBefore.length > 0 && glossaryAfter.length > 0 && glossaryAfter.length <= glossaryBefore.length,
    "La cerca del glossari redueix o mante un subconjunt consistent",
    { before: glossaryBefore.length, after: glossaryAfter.length, searchTerm },
  );

  glossaryAfter[0]?.click();
  await delay(80);
  const glossaryTitle = context.doc.querySelector(".glossary-detail h3")?.textContent?.trim() || "";
  record(
    steps,
    glossaryTitle.length > 0,
    "La seleccio d'una entrada del glossari mostra el detall",
    { glossaryTitle },
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
    const bookLayout = context.doc.querySelector(".book-layout");
    const bookColumns = readColumnCount(context, bookLayout);
    record(
      steps,
      bookColumns >= 2,
      "La vista de croniques separa index i llibre a PC",
      { bookColumns },
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

  context.click('[data-module-link="glossary"]');
  await delay(80);
  record(
    steps,
    context.doc.querySelector("[data-create-glossary]") !== null,
    "Glossari mostra una accio visible per crear entrades",
  );

  context.click('[data-toggle-edit="glossary"]');
  await delay(80);
  record(
    steps,
    context.doc.querySelector(".editor-workspace-glossary") !== null,
    "L'editor de glossari s'obre des del modul",
  );

  context.type('form[data-form="glossary"] input[name="name"]', "Entrada QA");
  await delay(60);
  context.submit('form[data-form="glossary"]');
  await delay(80);
  const saveNotice = context.doc.querySelector("#saveNotice")?.textContent?.trim() || "";
  record(
    steps,
    saveNotice.length > 0,
    "El desat mostra feedback visible a l'usuari",
    { notice: saveNotice },
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
