const params = new URLSearchParams(window.location.search);
const scenario = params.get("scenario") || "characters-grid";
const frame = document.querySelector("#appFrame");
const requestedScrollY = Number(params.get("scrollY") || "0");

const STORAGE_KEYS = ["campaign-compendium", "campaign-compendium-v2"];

bootstrap().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  document.body.dataset.captureReady = "error";
  document.title = `error:${scenario}`;
});

async function bootstrap() {
  resetStorage(window.localStorage);
  const frameLoaded = onceLoaded(frame);
  frame.src = `/index.html?captureRun=${Date.now()}`;
  await frameLoaded;
  await delay(220);

  const context = createContext(frame);
  await runScenario(context, scenario);

  if (requestedScrollY > 0) {
    context.win.scrollTo(0, requestedScrollY);
    await delay(220);
  }

  document.body.dataset.captureReady = "true";
  document.title = `ready:${scenario}`;
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
    async click(selector) {
      const target = doc.querySelector(selector);
      if (!(target instanceof win.HTMLElement)) {
        throw new Error(`Element no trobat: ${selector}`);
      }
      target.click();
      await delay(140);
    },
    async type(selector, value) {
      const target = doc.querySelector(selector);
      if (!(target instanceof win.HTMLInputElement) && !(target instanceof win.HTMLTextAreaElement)) {
        throw new Error(`Camp no trobat: ${selector}`);
      }
      target.focus();
      target.value = value;
      target.dispatchEvent(new win.Event("input", { bubbles: true }));
      target.dispatchEvent(new win.Event("change", { bubbles: true }));
      await delay(180);
    },
    async selectText(selector, value) {
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
      await delay(180);
    },
    query(selector) {
      return doc.querySelector(selector);
    },
    queryAll(selector) {
      return Array.from(doc.querySelectorAll(selector));
    },
  };
}

async function runScenario(context, scenarioName) {
  const handlers = {
    "characters-grid": async () => {},
    "characters-grid-lightbox": async () => {
      await context.click(".portrait-media");
    },
    "character-detail-lore": async () => {
      await openCharacter(context);
    },
    "character-detail-sheet": async () => {
      await openCharacter(context);
      await context.click('[data-character-tab="sheet"]');
    },
    "character-detail-inventory": async () => {
      await openCharacter(context);
      await context.click('[data-character-tab="inventory"]');
    },
    "character-detail-history": async () => {
      await openCharacter(context);
      await context.click('[data-character-tab="history"]');
    },
    "character-notes": async () => {
      await openCharacter(context);
      await context.click("[data-toggle-notes]");
    },
    "character-editor": async () => {
      await openCharacter(context);
      await context.click('[data-toggle-edit="characters"]');
    },
    "character-editor-references": async () => {
      await openCharacter(context);
      await context.click('[data-toggle-edit="characters"]');
      await context.type('form[data-form="character-tab"] textarea[name="origin"]', "Catedral");
      await context.selectText('form[data-form="character-tab"] textarea[name="origin"]', "Catedral");
    },
    "chronicles-read": async () => {
      await context.click('[data-module-link="chronicles"]');
    },
    "chronicles-edit": async () => {
      await context.click('[data-module-link="chronicles"]');
      await context.click('[data-toggle-edit="chronicles"]');
    },
    "chronicles-edit-references": async () => {
      await context.click('[data-module-link="chronicles"]');
      await context.click('[data-toggle-edit="chronicles"]');
      await context.type('form[data-form="chronicle"] textarea[name="content"]', "Catedral");
      await context.selectText('form[data-form="chronicle"] textarea[name="content"]', "Catedral");
    },
    "chronicles-search-empty": async () => {
      await context.click('[data-module-link="chronicles"]');
      await context.type('input[name="chronicleIndexSearch"]', "zzzzzz");
    },
    "chronicles-notes": async () => {
      await context.click('[data-module-link="chronicles"]');
      await context.click("[data-toggle-notes]");
    },
    "glossary-detail": async () => {
      await context.click('[data-module-link="glossary"]');
      await context.click('[data-glossary-filter="Faccions"]');
      await context.click('[data-glossary-id="portadores-del-velo"]');
    },
    "glossary-detail-lightbox": async () => {
      await context.click('[data-module-link="glossary"]');
      await context.click('[data-glossary-filter="Faccions"]');
      await context.click('[data-glossary-id="portadores-del-velo"]');
      await context.click(".glossary-media-frame img");
    },
    "glossary-edit": async () => {
      await context.click('[data-module-link="glossary"]');
      await context.click('[data-glossary-filter="Faccions"]');
      await context.click('[data-glossary-id="portadores-del-velo"]');
      await context.click("[data-edit-glossary-card]");
    },
    "glossary-edit-references": async () => {
      await context.click('[data-module-link="glossary"]');
      await context.click('[data-glossary-filter="Faccions"]');
      await context.click('[data-glossary-id="portadores-del-velo"]');
      await context.click("[data-edit-glossary-card]");
      await context.type('form[data-form="glossary"] textarea[name="description"]', "Catedral");
      await context.selectText('form[data-form="glossary"] textarea[name="description"]', "Catedral");
    },
    "glossary-filter-empty": async () => {
      await context.click('[data-module-link="glossary"]');
      await context.type('input[name="glossarySearch"]', "zzzzzz");
    },
    "glossary-notes": async () => {
      await context.click('[data-module-link="glossary"]');
      await context.click('[data-glossary-filter="Faccions"]');
      await context.click('[data-glossary-id="portadores-del-velo"]');
      await context.click("[data-toggle-notes]");
    },
  };

  const handler = handlers[scenarioName];
  if (!handler) {
    throw new Error(`Escenari desconegut: ${scenarioName}`);
  }

  await handler();
  await delay(260);
}

async function openCharacter(context) {
  const firstCard = context.query("[data-character-card]");
  if (!(firstCard instanceof context.win.HTMLElement)) {
    throw new Error("No s'ha trobat cap personatge.");
  }

  firstCard.click();
  await delay(160);
}

function onceLoaded(targetFrame) {
  return new Promise((resolve) => {
    targetFrame.addEventListener("load", () => resolve(), { once: true });
  });
}

function resetStorage(storage) {
  STORAGE_KEYS.forEach((key) => storage.removeItem(key));
}

function delay(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}
