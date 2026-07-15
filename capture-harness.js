import { DATA_VERSION, STORAGE_KEY, seedData } from "./data.js";

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
  if (scenario === "sidebar-campaign-switch" || scenario === "campaigns-dashboard") {
    seedCampaignSwitchCatalog(window.localStorage);
  }
  if (scenario.startsWith("baskins-character")) {
    seedBaskinsCampaignCatalog(window.localStorage);
  }
  const frameLoaded = onceLoaded(frame);
  const appParams = new URLSearchParams({ captureRun: String(Date.now()) });
  if (scenario === "options-player-access") {
    appParams.set("captureUserRole", "player");
    appParams.set("captureUserEmail", "player@preview.local");
  }
  if (scenario === "auth-landing") {
    appParams.set("authPreview", "1");
    appParams.set("authStatus", "Ofrenes pendents.");
  }
  if (scenario === "auth-waiting") {
    appParams.set("authPreview", "1");
    appParams.set("authStatus", "Obrint el compendi...");
    appParams.set("authWaiting", "1");
  }
  if (scenario === "auth-campaign-select") {
    appParams.set("authPreview", "1");
    appParams.set("authCampaignSelect", "1");
    appParams.set("authStatus", "Tria una campanya.");
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
    "auth-campaign-select": async () => {},
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
    "sidebar-campaign-switch": async () => {
      context.win.scrollTo(0, 0);
      await delay(120);
      const toggle = context.query("[data-sidebar-toggle]");
      if (toggle instanceof context.win.HTMLElement) {
        toggle.dispatchEvent(new context.win.PointerEvent("pointerenter", { bubbles: true }));
        context.doc.body.classList.add("sidebar-preview");
      }
      forceSidebarOpenForCapture(context);
      await delay(220);
    },
    "options-tools": async () => {
      await context.click('[data-module-link="options"]');
    },
    "office-characters": async () => {
      await enableOfficeMode(context);
    },
    "office-options": async () => {
      await enableOfficeMode(context);
      await context.click('[data-module-link="options"]');
    },
    "office-campaigns": async () => {
      await enableOfficeMode(context);
      await context.click('[data-module-link="campaigns"]');
    },
    "office-chronicles": async () => {
      await enableOfficeMode(context);
      await context.click('[data-module-link="chronicles"]');
    },
    "options-player-access": async () => {
      await context.click('[data-module-link="options"]');
    },
    "campaigns-dashboard": async () => {
      await context.click('[data-module-link="campaigns"]');
    },
    "campaigns-dashboard-edit": async () => {
      await context.click('[data-module-link="campaigns"]');
      const editor = context.query(".campaign-edit-disclosure");
      if (!(editor instanceof context.win.HTMLDetailsElement)) {
        throw new Error("No s'ha trobat l'editor de campanya.");
      }
      editor.open = true;
      await delay(180);
    },
    "baskins-character-sheet": async () => {
      await scrollCharacterSheetIntoView(context);
    },
    "baskins-character-tooltip": async () => {
      await scrollCharacterSheetIntoView(context);
      const concept = context.query(".savage-concept");
      if (concept instanceof context.win.HTMLElement) {
        concept.click();
      }
      await delay(180);
    },
    "baskins-character-loadout": async () => {
      await scrollCharacterSheetIntoView(context);
      const panel = context.query(".savage-loadout-panel");
      if (panel instanceof context.win.HTMLElement) {
        const rect = panel.getBoundingClientRect();
        const nextY = context.win.scrollY + rect.top - 160;
        context.win.scrollTo(0, nextY);
        if (context.doc.scrollingElement) {
          context.doc.scrollingElement.scrollTop = nextY;
        }
      }
      await delay(180);
    },
    "baskins-character-penalty": async () => {
      await scrollCharacterSheetIntoView(context);
      await context.click('[data-savage-state="wounds"][data-savage-delta="1"]');
      await context.click('[data-savage-state="fatigue"][data-savage-delta="1"]');
      await delay(220);
    },
    "characters-grid-lightbox": async () => {
      await context.click(".portrait-media");
    },
    "character-detail-sheet": async () => {
      await openCharacter(context);
      await context.click('[data-character-tab="sheet"]');
      await scrollCharacterSheetIntoView(context);
    },
    "character-detail-tabs": async () => {
      await openCharacter(context);
      await scrollCharacterTabsIntoView(context);
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
      await context.type('form[data-form="character-tab"] textarea[name="abilities"]', "Catedral");
      await context.selectText('form[data-form="character-tab"] textarea[name="abilities"]', "Catedral");
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
    "chronicles-read-session-3": async () => {
      await context.click('[data-module-link="chronicles"]');
      await openChronicle(context, "sagnatori");
      await scrollChronicleSpreadIntoView(context);
    },
    "chronicles-read-session-4": async () => {
      await context.click('[data-module-link="chronicles"]');
      await openChronicle(context, "sala-dels-plaers");
      await scrollChronicleSpreadIntoView(context);
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
    "chronicles-reference-search": async () => {
      await context.click('[data-module-link="chronicles"]');
      await openChronicle(context);
      await context.click('[data-toggle-edit="chronicles"]');
      await context.type('form[data-form="chronicle"] textarea[name="content"]', "Gat negre");
      await context.selectText('form[data-form="chronicle"] textarea[name="content"]', "Gat negre");
      await context.type('#chroniclesModule [data-reference-search]', "avatar de Nis'haar");
      await waitForReferenceSearchResult(context);
    },
    "chronicles-quick-glossary-modal": async () => {
      await context.click('[data-module-link="chronicles"]');
      await openChronicle(context);
      await context.click('[data-toggle-edit="chronicles"]');
      await context.type('form[data-form="chronicle"] textarea[name="content"]', "Arxiu nou");
      await context.selectText('form[data-form="chronicle"] textarea[name="content"]', "Arxiu nou");
      await context.click('#chroniclesModule [data-create-reference-entry]');
      const categorySelect = context.query('form[data-form="quick-glossary"] select[name="quickGlossaryCategory"]');
      if (categorySelect instanceof context.win.HTMLSelectElement) {
        categorySelect.value = "Esdeveniments";
      }
      const modal = context.query("#quickGlossaryModal");
      if (modal instanceof context.win.HTMLElement) {
        modal.style.placeItems = "start center";
      }
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
      clone.style.display = "none";
      showcase.style.display = "grid";
      showcase.style.gridTemplateColumns = isMobile ? "1fr" : "repeat(2, max-content)";
      showcase.style.gap = "16rem";
      const tooltipExamples = isMobile
        ? [await cloneOpenReferenceTooltip(context, "reina-elisabeth", "Reina Elisabeth")]
        : [
          await cloneOpenReferenceTooltip(context, "reina-elisabeth", "Reina Elisabeth"),
          await cloneOpenReferenceTooltip(context, "kaelor", "Kaelor"),
        ];
      showcase.append(clone, ...tooltipExamples);
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
      const imageButton = context.query("[data-glossary-image-button]");
      const imageButtonLabel = context.query("[data-glossary-image-button-label]");
      const imageStatus = context.query("[data-glossary-image-status]");
      if (imageButton instanceof context.win.HTMLElement) {
        imageButton.classList.add("is-processing");
        imageButton.setAttribute("aria-disabled", "true");
      }
      if (imageButtonLabel instanceof context.win.HTMLElement) {
        imageButtonLabel.textContent = "Processant imatge...";
      }
      if (imageStatus instanceof context.win.HTMLElement) {
        imageStatus.hidden = false;
        imageStatus.textContent = "Processant imatge...";
      }
      if (imageButton instanceof context.win.HTMLElement) {
        if (context.win.innerWidth >= 900) {
          const showcase = context.doc.createElement("section");
          showcase.className = "module-surface";
          showcase.style.cssText = "position:fixed;z-index:200;top:80px;left:50%;transform:translateX(-50%);width:min(560px,calc(100vw - 40px));padding:24px;";
          showcase.innerHTML = "<h3>Imatges</h3>";
          showcase.append(imageButton.closest(".glossary-image-picker")?.cloneNode(true));
          context.doc.body.append(showcase);
        } else {
          const imageButtonTop = imageButton.getBoundingClientRect().top + context.win.scrollY;
          context.win.scrollTo(0, Math.max(0, imageButtonTop - (context.win.innerHeight / 2)));
        }
      }
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

async function enableOfficeMode(context) {
  if (!context.doc.body.classList.contains("office-mode")) {
    await context.click("[data-toggle-office-mode]");
  }
  await delay(220);
}

async function openCharacter(context) {
  const firstCard = context.query("[data-character-card]");
  if (!(firstCard instanceof context.win.HTMLElement)) {
    throw new Error("No s'ha trobat cap personatge.");
  }

  firstCard.click();
  await delay(160);
}

async function createSecondCampaign(context) {
  await context.click('[data-module-link="options"]');
  await context.type('input[name="campaignName"]', "Savage Worlds");
  await context.type('input[name="campaignSystem"]', "Savage Worlds");
  const form = context.query('form[data-form="campaign-create"]');
  if (!(form instanceof context.win.HTMLFormElement)) {
    throw new Error("No s'ha trobat el formulari de nova campanya.");
  }
  form.requestSubmit();
  await delay(260);
}

function seedCampaignSwitchCatalog(storage) {
  const now = "2026-06-03T00:00:00.000Z";
  const meledarState = createCampaignStateForCapture({
    id: "meledar",
    name: "Meledar",
    system: "D&D 5e",
    createdAt: now,
  });
  const savageState = createCampaignStateForCapture({
    id: "savage-worlds",
    name: "Savage Worlds",
    system: "Savage Worlds",
    createdAt: now,
  });

  storage.setItem(STORAGE_KEY, JSON.stringify({
    kind: "necronomicon-campaign-library",
    version: DATA_VERSION,
    activeCampaignId: "savage-worlds",
    campaigns: [
      {
        id: "meledar",
        name: "Meledar",
        system: "D&D 5e",
        createdAt: now,
        updatedAt: now,
        version: DATA_VERSION,
        state: meledarState,
      },
      {
        id: "savage-worlds",
        name: "Savage Worlds",
        system: "Savage Worlds",
        createdAt: now,
        updatedAt: now,
        version: DATA_VERSION,
        state: savageState,
      },
    ],
    meta: savageState.meta,
    characters: savageState.characters,
    chronicles: savageState.chronicles,
    glossary: savageState.glossary,
    access: savageState.access,
    ui: savageState.ui,
  }));
}

function seedBaskinsCampaignCatalog(storage) {
  const now = "2026-06-04T00:00:00.000Z";
  const baskinsState = createCampaignStateForCapture({
    id: "baskins",
    name: "Baskins",
    system: "Savage Worlds",
    createdAt: now,
  });
  baskinsState.ui.selectedCharacterId = "ruth-baskin";
  baskinsState.ui.selectedCharacterTab = "sheet";
  baskinsState.ui.showCharacterGrid = false;

  storage.setItem(STORAGE_KEY, JSON.stringify({
    kind: "necronomicon-campaign-library",
    version: DATA_VERSION,
    activeCampaignId: "baskins",
    campaigns: [
      {
        id: "baskins",
        name: "Baskins",
        system: "Savage Worlds",
        createdAt: now,
        updatedAt: now,
        version: DATA_VERSION,
        state: baskinsState,
      },
    ],
    meta: baskinsState.meta,
    characters: baskinsState.characters,
    chronicles: baskinsState.chronicles,
    glossary: baskinsState.glossary,
    access: baskinsState.access,
    ui: baskinsState.ui,
  }));
}

function createCampaignStateForCapture({ id, name, system, createdAt }) {
  const state = structuredClone(seedData);
  state.meta = {
    ...(state.meta || {}),
    id,
    name,
    system,
    createdAt,
    updatedAt: createdAt,
  };
  state.ui = {
    ...(state.ui || {}),
    currentModule: "characters",
    saveNotice: "",
  };
  return state;
}

function forceSidebarOpenForCapture(context) {
  const shell = context.query(".app-shell");
  const sidebarScroll = context.query(".sidebar .sidebar-scroll");
  if (shell instanceof context.win.HTMLElement) {
    shell.style.gridTemplateColumns = "var(--sidebar-expanded) minmax(0, 1fr)";
  }
  if (sidebarScroll instanceof context.win.HTMLElement) {
    sidebarScroll.style.opacity = "1";
    sidebarScroll.style.visibility = "visible";
    sidebarScroll.style.pointerEvents = "auto";
    sidebarScroll.style.transform = "none";
  }
}

async function openChronicle(context, chronicleId = "") {
  const selector = chronicleId
    ? `[data-chronicle-id="${chronicleId}"]`
    : "[data-chronicle-id]";
  const chronicle = context.query(selector);
  if (!(chronicle instanceof context.win.HTMLElement)) {
    throw new Error("No s'ha trobat cap cronica.");
  }

  chronicle.scrollIntoView({ block: "center", inline: "nearest" });
  chronicle.click();
  await delay(180);
  context.win.scrollTo(0, 0);
  await delay(80);
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

async function scrollCharacterTabsIntoView(context) {
  const tabs = context.query(".tab-strip");
  if (tabs instanceof context.win.HTMLElement) {
    tabs.scrollIntoView({ block: "center", inline: "nearest" });
    await delay(180);
  }
}

async function waitForReferenceSearchResult(context) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 1200) {
    const input = context.query('#chroniclesModule [data-reference-search]');
    const result = context.query('#chroniclesModule [data-insert-reference="avatar-de-nishaar"]');
    if (
      input instanceof context.win.HTMLInputElement
      && input.value.includes("avatar")
      && result instanceof context.win.HTMLElement
    ) {
      return;
    }
    await delay(80);
  }

  throw new Error("No s'ha pogut preparar la captura del cercador de referencies.");
}

async function cloneOpenReferenceTooltip(context, referenceId, fallbackLabel) {
  const escapedId = context.win.CSS.escape(referenceId);
  const source = context.query(`[data-reference-jump="${escapedId}"]`);
  if (!(source instanceof context.win.HTMLElement)) {
    throw new Error(`No s'ha trobat la referencia ${referenceId}.`);
  }

  await waitForTooltipImageLayout(source);

  const clone = source.cloneNode(true);
  clone.classList.add("tooltip-capture-open");
  clone.style.position = "relative";
  clone.style.zIndex = "1";
  if (clone.firstChild) {
    clone.firstChild.textContent = fallbackLabel;
  }
  return clone;
}

async function waitForTooltipImageLayout(referenceElement) {
  const image = referenceElement.querySelector(".glossary-reference-tooltip img");
  if (!(image instanceof HTMLImageElement)) {
    return;
  }

  const startedAt = Date.now();
  while (Date.now() - startedAt < 1200) {
    const tooltip = referenceElement.querySelector(".glossary-reference-tooltip");
    if (
      image.complete
      && image.naturalWidth
      && tooltip instanceof HTMLElement
      && (
        tooltip.classList.contains("glossary-reference-tooltip-portrait")
        || tooltip.classList.contains("glossary-reference-tooltip-stacked")
      )
    ) {
      return;
    }
    await delay(80);
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

async function scrollChronicleSpreadIntoView(context) {
  if (context.win.innerWidth >= 720) {
    return;
  }

  const spread = context.query(".book-spread");
  if (spread instanceof context.win.HTMLElement) {
    spread.scrollIntoView({ block: "start", inline: "nearest" });
    await delay(180);
  }
}

function delay(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}
