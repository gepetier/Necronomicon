const params = new URLSearchParams(window.location.search);
const scenario = params.get("scenario") || "characters-grid";
const frame = document.querySelector("#appFrame");
const requestedScrollY = Number(params.get("scrollY") || "0");

const STORAGE_KEYS = ["campaign-compendium", "campaign-compendium-v2"];
const ASSET_DB_NAME = "campaign-compendium-assets";

bootstrap().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  document.body.dataset.captureReady = "error";
  document.title = `error:${scenario}`;
});

async function bootstrap() {
  resetStorage(window.localStorage);
  await resetAssetStore(window.indexedDB);
  const frameLoaded = onceLoaded(frame);
  const appParams = new URLSearchParams({ captureRun: String(Date.now()) });
  if (scenario === "auth-landing") {
    appParams.set("authPreview", "1");
    appParams.set("authStatus", "Ofrenes pendents.");
  }
  if (scenario === "auth-waiting") {
    appParams.set("authPreview", "1");
    appParams.set("authStatus", "Sacrificant innocents...");
    appParams.set("authWaiting", "1");
  }
  frame.src = `/index.html?${appParams.toString()}`;
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
    "auth-landing": async () => {},
    "auth-waiting": async () => {},
    "characters-grid": async () => {},
    "sidebar-preview": async () => {
      const toggle = context.query("[data-sidebar-toggle]");
      if (!(toggle instanceof context.win.HTMLElement)) {
        throw new Error("No s'ha trobat el boto del menu lateral.");
      }
      toggle.dispatchEvent(new context.win.PointerEvent("pointerenter", { bubbles: true }));
      await delay(220);
    },
    "sidebar-pinned": async () => {
      await context.click("[data-sidebar-toggle]");
    },
    "options-tools": async () => {
      await context.click('[data-module-link="options"]');
    },
    "characters-grid-lightbox": async () => {
      await context.click(".portrait-media");
    },
    "character-detail-lore": async () => {
      await openCharacter(context);
    },
    "character-detail-sheet": async () => {
      await openCharacter(context);
      await context.click('[data-character-tab="sheet"]');
      await scrollCharacterSheetIntoView(context);
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
    "chronicles-character-return": async () => {
      await context.click('[data-module-link="chronicles"]');
      await openChronicle(context);
      const jump = context.doc.createElement("button");
      jump.type = "button";
      jump.dataset.referenceJump = "ilu";
      jump.textContent = "Ilu";
      context.doc.body.append(jump);
      jump.click();
      await delay(220);
    },
    "chronicles-read": async () => {
      await context.click('[data-module-link="chronicles"]');
      await openChronicle(context);
    },
    "chronicles-read-highlights": async () => {
      await context.click('[data-module-link="chronicles"]');
      await openChronicle(context);
    },
    "chronicles-edit": async () => {
      await context.click('[data-module-link="chronicles"]');
      await openChronicle(context);
      await context.click('[data-toggle-edit="chronicles"]');
    },
    "chronicles-edit-highlights": async () => {
      await context.click('[data-module-link="chronicles"]');
      await openChronicle(context);
      await context.click('[data-toggle-edit="chronicles"]');
    },
    "chronicles-edit-references": async () => {
      await context.click('[data-module-link="chronicles"]');
      await openChronicle(context);
      await context.click('[data-toggle-edit="chronicles"]');
      await context.type('form[data-form="chronicle"] textarea[name="content"]', "Catedral");
      await context.selectText('form[data-form="chronicle"] textarea[name="content"]', "Catedral");
    },
    "chronicles-search-empty": async () => {
      await context.click('[data-module-link="chronicles"]');
      await openChronicle(context);
      await context.type('input[name="chronicleIndexSearch"]', "zzzzzz");
    },
    "chronicles-notes": async () => {
      await context.click('[data-module-link="chronicles"]');
      await openChronicle(context);
      await context.click("[data-toggle-notes]");
    },
    "chronicles-reference-tooltip": async () => {
      await context.click('[data-module-link="chronicles"]');
      await openChronicle(context);
      const clone = context.doc.createElement("button");
      clone.type = "button";
      clone.className = "glossary-inline-link tooltip-capture-open";
      clone.dataset.referenceJump = "acantilado-del-silencio";
      clone.dataset.referenceTheme = "locations";
      clone.dataset.referenceTooltip = "glossary";
      clone.innerHTML = `
        Acantilado del Silencio
        <span class="glossary-reference-tooltip" aria-hidden="true">
          <span class="glossary-reference-tooltip-media">
            <span class="glossary-reference-tooltip-placeholder">A</span>
          </span>
          <span class="glossary-reference-tooltip-copy">
            <span class="glossary-reference-tooltip-kicker">Llocs</span>
            <strong>Acantilado del Silencio</strong>
            <span>Ciutat de judicis, pedra i culte on la campanya comença empresonada.</span>
          </span>
        </span>
      `;
      const showcase = context.doc.createElement("div");
      const isMobile = context.win.innerWidth < 720;
      showcase.style.position = "fixed";
      showcase.style.left = isMobile ? "42px" : "255px";
      showcase.style.top = isMobile ? "610px" : "560px";
      showcase.style.zIndex = "500";
      showcase.append(clone);
      context.doc.body.append(showcase);
      await delay(220);
    },
    "glossary-detail": async () => {
      await context.click('[data-module-link="glossary"]');
      await context.click('[data-glossary-filter="Faccions"]');
      await context.click('[data-glossary-id="portadores-del-velo"]');
      await scrollGlossaryDetailIntoView(context);
    },
    "glossary-return": async () => {
      await context.click('[data-module-link="chronicles"]');
      await openChronicle(context);
      const jump = context.doc.createElement("button");
      jump.type = "button";
      jump.dataset.referenceJump = "acantilado-del-silencio";
      jump.textContent = "Acantilado del Silencio";
      context.doc.body.append(jump);
      jump.click();
      await delay(220);
      await scrollGlossaryDetailIntoView(context);
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

async function openChronicle(context) {
  const firstChronicle = context.query("[data-chronicle-id]");
  if (!(firstChronicle instanceof context.win.HTMLElement)) {
    throw new Error("No s'ha trobat cap cronica.");
  }

  firstChronicle.click();
  await delay(180);
}

async function scrollGlossaryDetailIntoView(context) {
  if (context.win.innerWidth >= 720) {
    return;
  }

  const detail = context.query(".glossary-detail");
  if (detail instanceof context.win.HTMLElement) {
    detail.scrollIntoView({ block: "start", inline: "nearest" });
    await delay(180);
  }
}

async function scrollCharacterSheetIntoView(context) {
  const sheet = context.query(".dnd-sheet");
  if (sheet instanceof context.win.HTMLElement) {
    sheet.scrollIntoView({ block: "start", inline: "nearest" });
    await delay(180);
  }
}

function onceLoaded(targetFrame) {
  return new Promise((resolve) => {
    targetFrame.addEventListener("load", () => resolve(), { once: true });
  });
}

function resetStorage(storage) {
  STORAGE_KEYS.forEach((key) => storage.removeItem(key));
}

function resetAssetStore(indexedDb) {
  return new Promise((resolve) => {
    if (!indexedDb) {
      resolve();
      return;
    }

    const request = indexedDb.deleteDatabase(ASSET_DB_NAME);
    const fallback = window.setTimeout(() => resolve(), 400);
    const done = () => {
      window.clearTimeout(fallback);
      resolve();
    };
    request.addEventListener("success", done);
    request.addEventListener("error", done);
    request.addEventListener("blocked", done);
  });
}

function delay(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}
