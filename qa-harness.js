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
    throw new Error("No s'ha pogut accedir al document de l'aplicació.");
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
    "Navegació al mòdul de cròniques amb índex carregat",
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
    "La cerca del glossari redueix o manté un subconjunt consistent",
    { before: glossaryBefore.length, after: glossaryAfter.length, searchTerm },
  );

  glossaryAfter[0]?.click();
  await delay(80);
  const glossaryTitle = context.doc.querySelector(".glossary-detail h3")?.textContent?.trim() || "";
  record(
    steps,
    glossaryTitle.length > 0,
    "La selecció d'una entrada del glossari mostra el detall",
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
      "La graella inicial de personatges mostra múltiples columnes a PC",
      { gridColumns },
    );

    context.click('[data-module-link="chronicles"]');
    await delay(80);
    const bookLayout = context.doc.querySelector(".book-layout");
    const bookColumns = readColumnCount(context, bookLayout);
    record(
      steps,
      bookColumns >= 2,
      "La vista de cròniques separa índex i llibre a PC",
      { bookColumns },
    );
  } else {
    record(
      steps,
      appDisplay === "block",
      "Layout principal apilat a mòbil",
      { display: appDisplay },
    );
    record(
      steps,
      gridColumns === 1,
      "La graella inicial de personatges col·lapsa a una sola columna a mòbil",
      { gridColumns },
    );

    context.click('[data-module-link="chronicles"]');
    await delay(80);
    const bookLayout = context.doc.querySelector(".book-layout");
    const bookColumns = readColumnCount(context, bookLayout);
    record(
      steps,
      bookColumns === 1,
      "La vista de cròniques s'apila en una sola columna a mòbil",
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
    "La vista de personatges exposa un accés local a l'edició",
  );

  context.click("[data-open-character-editor]");
  await delay(80);
  record(
    steps,
    context.doc.querySelector(".editor-workspace-character") !== null,
    "L'editor de personatges s'obre des del mòdul",
  );

  context.type('form[data-form="character-overview"] input[name="title"]', "Títol QA");
  await delay(60);
  context.click('[data-module-link="chronicles"]');
  await delay(80);
  context.click('[data-module-link="characters"]');
  await delay(80);
  const persistedCharacterDraft = context.doc.querySelector('form[data-form="character-overview"] input[name="title"]')?.value || "";
  record(
    steps,
    persistedCharacterDraft === "Títol QA",
    "El draft de personatge es manté en navegar entre mòduls",
    { value: persistedCharacterDraft },
  );

  context.click('[data-module-link="chronicles"]');
  await delay(80);
  record(
    steps,
    context.doc.querySelector("[data-create-chronicle]") !== null,
    "Cròniques mostra una acció visible per crear noves entrades",
  );

  context.click('[data-toggle-edit="chronicles"]');
  await delay(80);
  record(
    steps,
    context.doc.querySelector(".editor-workspace-chronicle") !== null,
    "L'editor de cròniques és visible en el layout actual",
  );

  context.type('form[data-form="chronicle"] input[name="title"]', "Crònica QA");
  await delay(60);
  context.click('[data-module-link="glossary"]');
  await delay(80);
  context.click('[data-module-link="chronicles"]');
  await delay(80);
  const persistedChronicleDraft = context.doc.querySelector('form[data-form="chronicle"] input[name="title"]')?.value || "";
  record(
    steps,
    persistedChronicleDraft === "Crònica QA",
    "El draft de crònica es conserva entre canvis de mòdul",
    { value: persistedChronicleDraft },
  );

  context.click('[data-module-link="glossary"]');
  await delay(80);
  record(
    steps,
    context.doc.querySelector("[data-create-glossary]") !== null,
    "Glossari mostra una acció visible per crear entrades",
  );

  context.click('[data-toggle-edit="glossary"]');
  await delay(80);
  record(
    steps,
    context.doc.querySelector(".editor-workspace-glossary") !== null,
    "L'editor de glossari s'obre des del mòdul",
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
