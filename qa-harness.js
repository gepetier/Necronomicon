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
const ASSET_DB_NAME = "campaign-compendium-assets";

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
  if (suite !== "persistence-read") {
    resetStorage(window.localStorage);
    await resetAssetStore(window.indexedDB);
  }
  const frameLoaded = onceLoaded(iframe);
  iframe.src = `/index.html?qaRun=${Date.now()}`;
  await frameLoaded;
  await delay(200);

  const context = createContext(iframe);
  const result = suite === "ui"
    ? await runUiSuite(context)
    : suite === "edit"
      ? await runEditSuite(context)
      : suite === "persistence-write"
        ? await runPersistenceWriteSuite(context)
        : suite === "persistence-read"
          ? await runPersistenceReadSuite(context)
          : await runFunctionalSuite(context);

  publish(result);
}

function createContext(currentFrame) {
  const doc = currentFrame.contentDocument;
  const win = currentFrame.contentWindow;
  if (!doc || !win) {
    throw new Error("No s'ha pogut accedir al document de l'aplicacio.");
  }

  let downloadRecords = [];
  let restoreDownloadCapture = null;

  return {
    doc,
    win,
    mode,
    suite,
    q(selector) {
      return doc.querySelector(selector);
    },
    click(selector) {
      const target = doc.querySelector(selector);
      if (!(target instanceof win.HTMLElement)) {
        throw new Error(`Element no trobat: ${selector}`);
      }
      target.click();
    },
    pointerDown(selector) {
      const target = doc.querySelector(selector);
      if (!(target instanceof win.HTMLElement)) {
        throw new Error(`Element no trobat per pointerdown: ${selector}`);
      }
      const EventConstructor = typeof win.PointerEvent === "function" ? win.PointerEvent : win.MouseEvent;
      target.dispatchEvent(new EventConstructor("pointerdown", { bubbles: true, cancelable: true }));
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
    async setFiles(selector, files, options = {}) {
      const target = doc.querySelector(selector);
      if (!(target instanceof win.HTMLInputElement) || target.type !== "file") {
        throw new Error(`Input de fitxers no trobat: ${selector}`);
      }

      const fileList = await Promise.all((files || []).map(async (file) => {
        let content = file.content || "";
        if (file.url) {
          const response = await win.fetch(file.url, { cache: "no-store" });
          if (!response.ok) {
            throw new Error(`No s'ha pogut carregar el fitxer QA: ${file.url}`);
          }
          content = new Uint8Array(await response.arrayBuffer());
        } else if (file.canvas) {
          const canvas = doc.createElement("canvas");
          canvas.width = file.canvas.width || 64;
          canvas.height = file.canvas.height || 64;
          const context = canvas.getContext("2d");
          const gradient = context?.createLinearGradient(0, 0, canvas.width, canvas.height);
          gradient?.addColorStop(0, "#267ac5");
          gradient?.addColorStop(0.5, "#f4df8a");
          gradient?.addColorStop(1, "#335f45");
          if (context && gradient) {
            context.fillStyle = gradient;
            context.fillRect(0, 0, canvas.width, canvas.height);
          }
          const blob = await new Promise((resolve) => canvas.toBlob(resolve, file.type || "image/png"));
          content = blob ? new Uint8Array(await blob.arrayBuffer()) : "";
        }
        return new win.File(
          [content || ""],
          file.name || "qa-file.bin",
          { type: file.type || "application/octet-stream" },
        );
      }));

      if (typeof win.DataTransfer === "function") {
        const dataTransfer = new win.DataTransfer();
        fileList.forEach((file) => dataTransfer.items.add(file));
        Object.defineProperty(target, "files", {
          configurable: true,
          value: dataTransfer.files,
        });
      } else {
        Object.defineProperty(target, "files", {
          configurable: true,
          value: fileList,
        });
      }

      target.dispatchEvent(new win.Event("input", { bubbles: true }));
      target.dispatchEvent(new win.Event("change", { bubbles: true }));
      const waitAfterMs = Number.isFinite(options.waitAfterMs) ? options.waitAfterMs : 600;
      if (waitAfterMs > 0) {
        await delay(waitAfterMs);
      }
    },
    startDownloadCapture() {
      if (restoreDownloadCapture) {
        restoreDownloadCapture();
      }

      downloadRecords = [];
      const originalCreateObjectUrl = win.URL.createObjectURL.bind(win.URL);
      const originalRevokeObjectUrl = win.URL.revokeObjectURL.bind(win.URL);
      const originalAnchorClick = win.HTMLAnchorElement.prototype.click;
      const blobByUrl = new Map();

      win.URL.createObjectURL = (blob) => {
        const url = `blob:qa-download-${downloadRecords.length}-${Date.now()}`;
        blobByUrl.set(url, blob);
        return url;
      };

      win.URL.revokeObjectURL = (url) => {
        blobByUrl.delete(url);
      };

      win.HTMLAnchorElement.prototype.click = function click() {
        const href = this.getAttribute("href") || this.href || "";
        if (blobByUrl.has(href)) {
          downloadRecords.push({
            href,
            download: this.download || "",
            blob: blobByUrl.get(href),
          });
          return;
        }

        return originalAnchorClick.call(this);
      };

      restoreDownloadCapture = () => {
        win.URL.createObjectURL = originalCreateObjectUrl;
        win.URL.revokeObjectURL = originalRevokeObjectUrl;
        win.HTMLAnchorElement.prototype.click = originalAnchorClick;
      };
    },
    async readLatestDownloadText() {
      const latest = downloadRecords.at(-1);
      if (!latest?.blob) {
        return "";
      }

      return latest.blob.text();
    },
    getLatestDownloadMeta() {
      const latest = downloadRecords.at(-1);
      return latest
        ? {
          count: downloadRecords.length,
          download: latest.download,
        }
        : null;
    },
    stopDownloadCapture() {
      if (restoreDownloadCapture) {
        restoreDownloadCapture();
        restoreDownloadCapture = null;
      }
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

  context.click("[data-toggle-notes]");
  await delay(80);
  const characterNotesTitle = context.doc.querySelector(".notes-panel h3")?.textContent?.trim() || "";
  record(
    steps,
    context.doc.querySelector(".notes-panel.open") !== null && characterNotesTitle === firstName,
    "La fitxa de personatge pot obrir el panell de notes de jugadors",
    { characterNotesTitle },
  );

  context.type('.notes-panel-form input[name="author"]', "QA");
  context.type('.notes-panel-form textarea[name="text"]', "Nota de personatge");
  await delay(60);
  context.submit('form[data-form="player-note"]');
  await delay(80);
  const characterNoteText = context.doc.querySelector(".player-note-card p")?.textContent?.trim() || "";
  record(
    steps,
    characterNoteText === "Nota de personatge",
    "Les notes de jugador es poden desar des de la fitxa de personatge",
    { characterNoteText },
  );

  context.click("[data-close-notes]");
  await delay(80);
  record(
    steps,
    context.doc.querySelector(".notes-panel.open") === null,
    "El panell de notes del personatge es pot tancar",
  );

  context.click('[data-module-link="chronicles"]');
  await delay(80);
  const landingEntries = context.qsa(".chronicle-atlas-card");
  record(
    steps,
    context.doc.querySelector("#chroniclesModule.active") !== null
      && context.doc.querySelector(".chronicle-landing") !== null
      && landingEntries.length > 0,
    "Navegacio al modul de croniques amb landing index carregat",
    { chapters: landingEntries.length },
  );

  context.click('[data-module-link="glossary"]');
  await delay(80);
  const glossaryBefore = context.qsa(".glossary-entry");
  const searchSeed = glossaryBefore[0]?.querySelector("h3")?.textContent?.trim() || "";
  const searchTerm = searchSeed.slice(0, Math.min(5, searchSeed.length));
  context.type('input[name="glossarySearch"]', searchTerm);
  await delay(180);
  const glossaryAfter = context.qsa(".glossary-entry");
  const glossarySearchFocusName = context.doc.activeElement?.getAttribute?.("name") || "";
  const glossarySearchValue = context.doc.querySelector('input[name="glossarySearch"]')?.value || "";
  record(
    steps,
    glossaryBefore.length > 0
      && glossaryAfter.length > 0
      && glossaryAfter.length < glossaryBefore.length
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
  await delay(180);
  const accentInsensitiveResults = context.qsa(".glossary-entry h3").map((element) => element.textContent?.trim() || "");
  record(
    steps,
    accentInsensitiveResults.includes("Kaelor, el Portador del Silenci"),
    "La cerca del glossari es tolerant a accents i troba categories",
    { accentInsensitiveResults },
  );

  context.type('input[name="glossarySearch"]', "");
  await delay(180);
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

  context.click('[data-glossary-filter="Personatges"]');
  await delay(80);
  const secondaryCharacterResults = context.qsa(".glossary-entry h3").map((element) => element.textContent?.trim() || "");
  record(
    steps,
    secondaryCharacterResults.includes("Uric")
      && secondaryCharacterResults.includes("Reina Elisabeth d'Andoras")
      && !secondaryCharacterResults.includes("Zaher-Ar'Kal"),
    "La categoria de personatges secundaris separa PNJ, protagonistes i antagonistes",
    { secondaryCharacterResults },
  );
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
  context.qsa("[data-chronicle-id]")[0]?.click();
  await delay(80);
  const chronicleHasRemovedSections = Boolean(
    context.doc.querySelector(".chapter-highlights")
      || context.doc.querySelector(".chapter-summary"),
  );
  record(
    steps,
    context.doc.querySelector("#chroniclesModule.active") !== null
      && context.doc.querySelector(".book-spread") !== null
      && !chronicleHasRemovedSections,
    "La lectura de cronica obre el llibre sense resum d'ordre ni fites clau",
    { chronicleHasRemovedSections },
  );

  context.click('[data-module-link="options"]');
  await delay(80);
  context.click("[data-toggle-office-mode]");
  await delay(120);
  const officeNavLabel = context.doc.querySelector('[data-module-link="characters"]')?.textContent?.trim() || "";
  const officeToggleLabel = context.doc.querySelector(".office-mode-card [data-toggle-office-mode]")?.textContent?.trim() || "";
  record(
    steps,
    context.doc.body.classList.contains("office-mode")
      && officeNavLabel === "Contactes"
      && officeToggleLabel.includes("Desactiva"),
    "El mode oficina es pot activar i relabela la navegacio amb noms neutres",
    { officeNavLabel, officeToggleLabel },
  );

  context.click('[data-module-link="chronicles"]');
  await delay(120);
  const officeChronicleCards = context.qsa(".chronicle-atlas-card");
  officeChronicleCards[0]?.click();
  await delay(120);
  record(
    steps,
    context.doc.body.classList.contains("office-mode")
      && context.doc.querySelector("#chroniclesModule.active") !== null
      && officeChronicleCards.length > 0
      && context.doc.querySelector(".book-spread") !== null,
    "El mode oficina permet entrar a Documents i obrir una cronica",
    { officeChronicleCards: officeChronicleCards.length },
  );

  context.click("[data-toggle-office-mode]");
  await delay(120);
  record(
    steps,
    !context.doc.body.classList.contains("office-mode"),
    "El mode oficina es pot desactivar",
  );

  context.click('[data-module-link="campaigns"]');
  await delay(120);
  const inviteDisclosure = context.q("[data-campaign-invite-panel]");
  if (inviteDisclosure instanceof context.win.HTMLDetailsElement) inviteDisclosure.open = true;
  context.type('input[name="inviteEmail"]', "jugador.damakos@gmail.com");
  const inviteCharacter = context.q('select[name="inviteCharacterId"]');
  if (inviteCharacter instanceof context.win.HTMLSelectElement) {
    inviteCharacter.value = "damakos";
    inviteCharacter.dispatchEvent(new context.win.Event("change", { bubbles: true }));
  }
  context.submit('form[data-form="campaign-invite"]');
  await delay(180);
  const inviteReady = context.q(".campaign-invite-ready");
  const inviteLink = context.q('.campaign-invite-ready input')?.value || "";
  const normalizedInviteLink = inviteLink.replaceAll("&amp;", "&");
  const inviteParams = normalizedInviteLink ? new URL(normalizedInviteLink).searchParams : new URLSearchParams();
  record(
    steps,
    Boolean(inviteReady)
      && inviteParams.get("inviteCampaign") === "meledar"
      && inviteParams.get("inviteCharacter") === "damakos",
    "La campanya permet preparar una invitacio vinculada al correu i a Damakos",
    { inviteLink },
  );

  context.click('[data-module-link="options"]');
  await delay(120);
  const invitedUserDelete = context.q('button[data-delete-permission-user="jugador.damakos@gmail.com"]');
  const previousConfirm = context.win.confirm;
  context.win.confirm = () => true;
  invitedUserDelete?.click();
  context.win.confirm = previousConfirm;
  await delay(180);
  record(
    steps,
    Boolean(invitedUserDelete)
      && context.q('input[name="userEmail"][value="jugador.damakos@gmail.com"]') === null,
    "Opcions permet eliminar un correu dels permisos de la campanya",
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
    const landing = context.doc.querySelector(".chronicle-landing");
    const landingCards = context.qsa(".chronicle-atlas-card");
    record(
      steps,
      Boolean(landing) && landingCards.length > 0 && Boolean(sidebarPanel?.hidden),
      "La vista inicial de croniques mostra un landing index a PC",
      {
        sidebarHidden: sidebarPanel?.hidden ?? null,
        landingCards: landingCards.length,
      },
    );

    landingCards[0]?.click();
    await delay(80);
    const sidebarIndex = sidebarPanel?.querySelector(".book-index-sidebar");
    const bookLayout = context.doc.querySelector(".book-layout");
    const bookColumns = readColumnCount(context, bookLayout);
    record(
      steps,
      Boolean(sidebarIndex) && !sidebarPanel?.hidden && bookColumns === 1,
      "Obrir una cronica mostra subindex lateral i llibre separat a PC",
      { sidebarIndex: Boolean(sidebarIndex), sidebarHidden: sidebarPanel?.hidden ?? null, bookColumns },
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
    const landing = context.doc.querySelector(".chronicle-landing");
    const landingCards = context.qsa(".chronicle-atlas-card");
    record(
      steps,
      Boolean(landing) && landingCards.length > 0,
      "La vista inicial de croniques mostra un landing index a mobil",
      { landingCards: landingCards.length },
    );

    landingCards[0]?.click();
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
  context.type('form[data-form="character-tab"] textarea[name="abilities"]', "Catedral");
  await delay(80);
  context.selectText('form[data-form="character-tab"] textarea[name="abilities"]', "Catedral");
  await delay(80);
  const characterEditorSuggestions = context.qsa(".reference-suggestions .suggestion-chip")
    .map((element) => element.textContent?.trim() || "");
  record(
    steps,
    characterEditorSuggestions.some((label) => label.includes("Catedral del Silencio"))
      && characterEditorSuggestions.some((label) => label.includes("Multimedia")),
    "L'editor de personatges mostra referències temàtiques i l'opció de multimedia quan hi ha text seleccionat",
    { characterEditorSuggestions },
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

  context.qsa("[data-chronicle-id]")[0]?.click();
  await delay(80);
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
  record(
    steps,
    context.doc.querySelector('form[data-form="chronicle"] textarea[name="summary"]') === null
      && context.doc.querySelector('form[data-form="chronicle"] textarea[name="highlights"]') === null
      && context.doc.querySelector('form[data-form="chronicle"] textarea[name="content"]') !== null,
    "L'editor de croniques nomes mostra el cos narratiu editable",
  );

  context.type('form[data-form="chronicle"] input[name="title"]', "Cronica QA");
  await delay(60);
  const longChronicleContent = Array.from({ length: 40 }, (_, index) => `Linia antiga ${index + 1}`).join("\n")
    + "\nCatedral\n"
    + Array.from({ length: 40 }, (_, index) => `Linia posterior ${index + 1}`).join("\n");
  context.type('form[data-form="chronicle"] textarea[name="content"]', longChronicleContent);
  await delay(80);
  context.selectText('form[data-form="chronicle"] textarea[name="content"]', "Catedral");
  await delay(80);
  const longContentTextarea = context.doc.querySelector('form[data-form="chronicle"] textarea[name="content"]');
  const expectedReferenceScroll = 180;
  if (longContentTextarea instanceof context.win.HTMLTextAreaElement) {
    longContentTextarea.scrollTop = expectedReferenceScroll;
  }
  context.pointerDown('[data-insert-reference="catedral-del-silencio"]');
  await delay(120);
  const pointerInsertedContent = longContentTextarea?.value || "";
  const preservedReferenceScroll = longContentTextarea?.scrollTop ?? 0;
  record(
    steps,
    pointerInsertedContent.includes("[[catedral-del-silencio|Catedral]]")
      && Math.abs(preservedReferenceScroll - expectedReferenceScroll) <= 1,
    "La suggerencia de referencia no desplaca el cos de la cronica quan s'activa amb ratoli",
    { preservedReferenceScroll, expectedReferenceScroll },
  );

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
      && glossaryReferenceSuggestions.some((label) => label.includes("Multimedia"))
      && glossaryReferenceSuggestions.some((label) => label.includes("Nova entrada"))
      && referencedChronicleContent === "[[catedral-del-silencio|Catedral]]",
    "La referència de glossari conserva el text seleccionat i només canvia el destí de la referència",
    { glossaryReferenceSuggestions, referencedChronicleContent },
  );

  context.type('form[data-form="chronicle"] textarea[name="content"]', "La Catedral va quedar en silenci.");
  await delay(80);
  context.selectText('form[data-form="chronicle"] textarea[name="content"]', "Catedral");
  await delay(80);
  context.pointerDown('[data-insert-reference="catedral-del-silencio"]');
  context.click('[data-rich-action="bold"]');
  await delay(80);
  const clickThroughContent = context.doc.querySelector('form[data-form="chronicle"] textarea[name="content"]')?.value || "";
  record(
    steps,
    clickThroughContent === "La [[catedral-del-silencio|Catedral]] va quedar en silenci.",
    "Seleccionar una suggerencia no activa la negreta del paragraf per un clic residual",
    { clickThroughContent },
  );

  context.type('form[data-form="chronicle"] textarea[name="content"]', "Arxiu QA");
  await delay(80);
  context.selectText('form[data-form="chronicle"] textarea[name="content"]', "Arxiu QA");
  await delay(80);
  context.click('#chroniclesModule [data-create-reference-entry]');
  await delay(120);
  const quickGlossaryCategories = context.qsa('form[data-form="quick-glossary"] select[name="quickGlossaryCategory"] option')
    .map((option) => option.value);
  record(
    steps,
    quickGlossaryCategories.includes("Esdeveniments"),
    "La creacio rapida del glossari permet classificar entrades com a esdeveniments",
    { quickGlossaryCategories },
  );
  context.type('form[data-form="quick-glossary"] input[name="quickGlossaryName"]', "Arxiu QA");
  context.type('form[data-form="quick-glossary"] textarea[name="quickGlossaryDescription"]', "Entrada creada des de croniques.");
  await context.setFiles('form[data-form="quick-glossary"] input[name="quickGlossaryImage"]', [{
    name: "arxiu-qa.svg",
    type: "image/svg+xml",
    content: "<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32'><rect width='32' height='32' fill='red'/></svg>",
  }]);
  context.submit('form[data-form="quick-glossary"]');
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const createdEntry = context.win.__NECRONOMICON_QA__?.state?.glossary?.find?.((entry) => entry.name === "Arxiu QA");
    if (createdEntry?.imageAssets?.length === 1 && context.q("#quickGlossaryModal")?.hidden) {
      break;
    }
    await delay(100);
  }
  const quickCreatedContent = context.doc.querySelector('form[data-form="chronicle"] textarea[name="content"]')?.value || "";
  const quickCreatedEntry = context.win.__NECRONOMICON_QA__?.state?.glossary?.find?.((entry) => entry.name === "Arxiu QA");
  record(
    steps,
    quickCreatedContent === "[[arxiu-qa|Arxiu QA]]"
      && quickCreatedEntry?.description === "Entrada creada des de croniques."
      && quickCreatedEntry?.imageAssets?.length === 1,
    "La suggerencia Nova entrada crea glossari amb imatge i insereix la referencia a la cronica",
    {
      quickCreatedContent,
      quickCreatedCategory: quickCreatedEntry?.category || "",
      quickCreatedImages: quickCreatedEntry?.imageAssets?.length || 0,
    },
  );

  context.type('form[data-form="chronicle"] textarea[name="content"]', "Gat negre");
  await delay(80);
  context.selectText('form[data-form="chronicle"] textarea[name="content"]', "Gat negre");
  await delay(80);
  context.type('#chroniclesModule [data-reference-search]', "avatar de Nis'haar");
  await delay(100);
  const referenceSearchSuggestions = context.qsa(".reference-suggestions .suggestion-chip")
    .map((element) => element.textContent?.trim() || "");
  context.click('#chroniclesModule [data-insert-reference="avatar-de-nishaar"]');
  await delay(80);
  const searchedReferenceContent = context.doc.querySelector('form[data-form="chronicle"] textarea[name="content"]')?.value || "";
  record(
    steps,
    referenceSearchSuggestions.some((label) => label.includes("Avatar de Nisha'ar"))
      && searchedReferenceContent === "[[avatar-de-nishaar|Gat negre]]",
    "El cercador de suggerencies permet vincular un sinonim seleccionat amb una entrada diferent",
    { referenceSearchSuggestions, searchedReferenceContent },
  );

  context.type('form[data-form="chronicle"] textarea[name="content"]', "l'Ilu");
  await delay(80);
  context.selectText('form[data-form="chronicle"] textarea[name="content"]', "l'Ilu");
  await delay(80);
  const characterReferenceSuggestions = context.qsa(".reference-suggestions .suggestion-chip")
    .map((element) => element.textContent?.trim() || "");
  context.click('[data-insert-reference="ilu"]');
  await delay(80);
  const referencedCharacterContent = context.doc.querySelector('form[data-form="chronicle"] textarea[name="content"]')?.value || "";
  record(
    steps,
    characterReferenceSuggestions.some((label) => label.includes("Ilu") && label.includes("Protagonistes"))
      && referencedCharacterContent === "[[ilu|l'Ilu]]",
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
  const savedChronicleContent = context.doc.querySelector(".chapter-body")?.textContent?.trim() || "";
  record(
    steps,
    context.doc.querySelector(".editor-workspace-chronicle") === null
      && savedChronicleTitle === "Cronica desada QA"
      && savedChronicleContent.includes("Ilu"),
    "Desar una cronica tanca el mode edicio",
    { savedChronicleTitle, savedChronicleContent },
  );
  context.click('[data-reference-jump="ilu"]');
  await delay(80);
  const characterReturnChip = context.doc.querySelector("[data-return-to-chronicle]");
  record(
    steps,
    characterReturnChip !== null,
    "El salt de cronica a personatge mostra el retorn a la cronica",
  );
  const jumpedCharacterTitle = context.doc.querySelector(".detail-summary h3")?.textContent?.trim() || "";
  record(
    steps,
    context.doc.querySelector("#charactersModule.active") !== null
      && jumpedCharacterTitle === "Ilu",
    "Una referència de personatge desada dins una cronica obre la fitxa principal corresponent",
    { jumpedCharacterTitle },
  );
  context.click("[data-return-to-chronicle]");
  await delay(80);
  const returnedChronicleTitle = context.doc.querySelector(".page-header h3")?.textContent?.trim() || "";
  record(
    steps,
    context.doc.querySelector("#chroniclesModule.active") !== null
      && returnedChronicleTitle === "Cronica desada QA",
    "El retorn des de personatge restaura la cronica d'origen",
    { returnedChronicleTitle },
  );

  context.click('[data-module-link="glossary"]');
  await delay(80);
  record(
    steps,
    context.doc.querySelector("[data-create-glossary]") !== null,
    "Glossari mostra una accio visible per crear entrades",
  );

  const glossaryCountBeforeCreate = context.qsa("[data-glossary-id]").length;
  context.click("[data-create-glossary]");
  await delay(80);
  context.click("[data-discard-glossary-edit]");
  await delay(80);
  const glossaryCountAfterDiscardNew = context.qsa("[data-glossary-id]").length;
  record(
    steps,
    context.doc.querySelector(".editor-workspace-glossary") === null
      && glossaryCountAfterDiscardNew === glossaryCountBeforeCreate,
    "Descartar una entrada nova del glossari elimina la fitxa provisional",
    { glossaryCountBeforeCreate, glossaryCountAfterDiscardNew },
  );

  context.click("[data-edit-glossary-card]");
  await delay(80);
  record(
    steps,
    context.doc.querySelector(".editor-workspace-glossary") !== null
      && context.doc.querySelector('input[data-glossary-image-picker]') !== null,
    "L'editor de glossari s'obre des de la targeta de resultat",
  );
  const nativeGlossaryImageInput = context.doc.querySelector('input[data-glossary-image-picker]');
  const nativeGlossaryImageControl = context.doc.querySelector("label[data-glossary-image-button]");
  record(
    steps,
    nativeGlossaryImageInput instanceof context.win.HTMLInputElement
      && nativeGlossaryImageControl instanceof context.win.HTMLLabelElement
      && nativeGlossaryImageControl.htmlFor === nativeGlossaryImageInput.id,
    "El boto Afegeix imatge activa directament el selector natiu de fitxers",
    {
      inputId: nativeGlossaryImageInput?.id || "",
      controlFor: nativeGlossaryImageControl?.htmlFor || "",
    },
  );
  nativeGlossaryImageInput?.dispatchEvent(new context.win.MouseEvent("click", { bubbles: true }));
  await delay(40);
  const glossaryPickerSurvivedNativeClick = nativeGlossaryImageInput?.isConnected === true
    && context.doc.querySelector('input[data-glossary-image-picker]') === nativeGlossaryImageInput;
  record(
    steps,
    glossaryPickerSurvivedNativeClick,
    "El clic que obre el selector natiu no rerenderitza ni desconnecta l'input",
    { glossaryPickerSurvivedNativeClick },
  );
  const glossaryImageCountBeforeUpload = context.qsa(".glossary-editor-media-frame").length;
  const glossaryImageValueBeforeUpload = context.doc.querySelector('form[data-form="glossary"] textarea[name="imageAssets"]')?.value || "";
  await context.setFiles('form[data-form="glossary"] input[data-glossary-image-picker]', [{
    name: "apolion-qa.png",
    type: "image/png",
    url: "/__qa_upload_image",
  }], { waitAfterMs: 0 });
  const glossaryImageProcessingStatus = context.doc.querySelector("[data-glossary-image-status]")?.textContent || "";
  const glossarySaveDisabledWhileProcessing = context.doc.querySelector('form[data-form="glossary"] button[type="submit"]')?.disabled === true;
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const currentValue = context.doc.querySelector('form[data-form="glossary"] textarea[name="imageAssets"]')?.value || "";
    if (currentValue !== glossaryImageValueBeforeUpload) {
      break;
    }
    await delay(100);
  }
  const glossaryImageCountAfterUpload = context.qsa(".glossary-editor-media-frame").length;
  const uploadedGlossaryImageValue = context.doc.querySelector('form[data-form="glossary"] textarea[name="imageAssets"]')?.value || "";
  const glossaryImageUploadStatus = context.doc.querySelector("[data-glossary-image-status]")?.textContent || "";
  const glossaryUploadDebugText = context.doc.querySelector("[data-glossary-upload-debug-log]")?.textContent || "";
  record(
    steps,
    glossaryImageProcessingStatus.includes("Processant")
      && glossarySaveDisabledWhileProcessing
      && glossaryImageCountAfterUpload >= 1
      && uploadedGlossaryImageValue !== glossaryImageValueBeforeUpload
      && uploadedGlossaryImageValue.includes("asset://")
      && glossaryImageUploadStatus.includes("preparada")
      && glossaryUploadDebugText.includes("event change")
      && glossaryUploadDebugText.includes("IndexedDB correcte"),
    "El selector del glossari processa i previsualitza la imatge PNG seleccionada",
    {
      glossaryImageCountBeforeUpload,
      glossaryImageCountAfterUpload,
      glossaryImageProcessingStatus,
      glossarySaveDisabledWhileProcessing,
      glossaryImageValueBeforeUpload: glossaryImageValueBeforeUpload.slice(-80),
      uploadedGlossaryImageValue: uploadedGlossaryImageValue.slice(-80),
      glossaryImageUploadStatus,
      glossaryUploadDebugText,
    },
  );
  context.type('form[data-form="glossary"] textarea[name="description"]', "Catedral");
  await delay(80);
  context.selectText('form[data-form="glossary"] textarea[name="description"]', "Catedral");
  await delay(80);
  const glossaryEditorSuggestions = context.qsa(".reference-suggestions .suggestion-chip")
    .map((element) => element.textContent?.trim() || "");
  record(
    steps,
    glossaryEditorSuggestions.some((label) => label.includes("Catedral del Silencio"))
      && glossaryEditorSuggestions.some((label) => label.includes("Multimedia")),
    "L'editor de glossari mostra referències temàtiques i l'opció de multimedia quan hi ha text seleccionat",
    { glossaryEditorSuggestions },
  );

  const originalGlossaryName = context.doc.querySelector('form[data-form="glossary"] input[name="name"]')?.value || "";
  context.type('form[data-form="glossary"] input[name="name"]', "Entrada descartada QA");
  await delay(60);
  context.click("[data-discard-glossary-edit]");
  await delay(80);
  const discardedGlossaryTitle = context.doc.querySelector(".glossary-detail h3")?.textContent?.trim() || "";
  record(
    steps,
    context.doc.querySelector(".editor-workspace-glossary") === null
      && discardedGlossaryTitle === originalGlossaryName,
    "Descartar canvis del glossari tanca l'editor i conserva la fitxa original",
    { originalGlossaryName, discardedGlossaryTitle },
  );

  context.click("[data-edit-glossary-card]");
  await delay(80);
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
        && (glossaryImageSrc.startsWith("data:image/svg+xml") || glossaryImageSrc.startsWith("blob:")),
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


async function runPersistenceWriteSuite(context) {
  const steps = [];
  const quickName = "Arxiu persistent QA";
  const quickId = "arxiu-persistent-qa";
  const quickDescription = "Descripcio persistent creada des de croniques.";
  const directName = "Entrada directa persistent QA";
  const directId = "entrada-directa-persistent-qa";
  const directDescription = "Descripcio persistent creada des del menu de glossari.";

  context.click('[data-module-link="chronicles"]');
  await delay(100);
  context.qsa("[data-chronicle-id]")[0]?.click();
  await delay(100);
  context.click('[data-toggle-edit="chronicles"]');
  await delay(100);
  context.type('form[data-form="chronicle"] input[name="title"]', "Cronica persistent QA");
  context.type('form[data-form="chronicle"] textarea[name="content"]', `La referencia és ${quickName}.`);
  await delay(100);
  context.selectText('form[data-form="chronicle"] textarea[name="content"]', quickName);
  await delay(100);
  context.click('#chroniclesModule [data-create-reference-entry]');
  await delay(120);
  context.type('form[data-form="quick-glossary"] input[name="quickGlossaryName"]', quickName);
  context.type('form[data-form="quick-glossary"] textarea[name="quickGlossaryDescription"]', quickDescription);
  await context.setFiles('form[data-form="quick-glossary"] input[name="quickGlossaryImage"]', [{
    name: "arxiu-persistent-qa.png",
    type: "image/png",
    url: "/__qa_upload_image?fallback=1",
  }]);
  context.submit('form[data-form="quick-glossary"]');
  let quickEntry = null;
  for (let attempt = 0; attempt < 80; attempt += 1) {
    quickEntry = context.win.__NECRONOMICON_QA__?.state?.glossary?.find?.((entry) => entry.id === quickId) || null;
    if (quickEntry?.imageAssets?.length === 1 && context.q("#quickGlossaryModal")?.hidden) {
      break;
    }
    await delay(100);
  }

  quickEntry = quickEntry || context.win.__NECRONOMICON_QA__?.state?.glossary?.find?.((entry) => entry.id === quickId);
  const chronicleDraft = context.q('form[data-form="chronicle"] textarea[name="content"]')?.value || "";
  record(
    steps,
    quickEntry?.description === quickDescription
      && quickEntry?.imageAssets?.length === 1
      && chronicleDraft.includes(`[[${quickId}|${quickName}]]`),
    "Croniques > Nova entrada crea una entrada amb descripcio, imatge i referencia",
    {
      quickId: quickEntry?.id || "",
      imageAssets: quickEntry?.imageAssets?.length || 0,
      chronicleDraft,
      quickStatus: context.q("[data-quick-glossary-status]")?.textContent || "",
      quickBusy: context.q('form[data-form="quick-glossary"]')?.hasAttribute("aria-busy") || false,
    },
  );

  context.submit('form[data-form="chronicle"]');
  await delay(250);
  const reference = context.q(`[data-reference-jump="${quickId}"]`);
  reference?.classList.add("tooltip-capture-open");
  await delay(250);
  const tooltip = reference?.querySelector(".glossary-reference-tooltip");
  const tooltipImage = tooltip?.querySelector("img");
  await waitForLoadedImage(tooltipImage, 5000);
  const tooltipOpacity = tooltip ? context.win.getComputedStyle(tooltip).opacity : "";
  const tooltipPageOverflow = reference?.closest(".book-page")
    ? context.win.getComputedStyle(reference.closest(".book-page")).overflow
    : "";
  record(
    steps,
    Boolean(reference)
      && (tooltip?.textContent || "").includes(quickDescription)
      && isLoadedAssetImage(tooltipImage)
      && tooltipOpacity === "1"
      && tooltipPageOverflow === "visible",
    "La referencia desada activa el tooltip amb descripcio i imatge carregada",
    { tooltipOpacity, tooltipText: tooltip?.textContent?.trim() || "", tooltipSrc: tooltipImage?.src || "" },
  );

  context.click('[data-module-link="glossary"]');
  await delay(120);
  context.click("[data-create-glossary]");
  await delay(120);
  context.type('form[data-form="glossary"] input[name="name"]', directName);
  context.type('form[data-form="glossary"] textarea[name="description"]', directDescription);
  await context.setFiles('form[data-form="glossary"] input[data-glossary-image-picker]', [{
    name: "entrada-directa-persistent-qa.png",
    type: "image/png",
    url: "/__qa_upload_image",
  }]);
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const imageAssetsValue = context.q('form[data-form="glossary"] textarea[name="imageAssets"]')?.value || "";
    if (imageAssetsValue.includes("asset://")) {
      break;
    }
    await delay(100);
  }
  context.submit('form[data-form="glossary"]');
  await delay(300);

  const directEntry = context.win.__NECRONOMICON_QA__?.state?.glossary?.find?.((entry) => entry.name === directName);
  const directEntryId = directEntry?.id || directId;
  const directDetail = context.q(`[data-glossary-detail="${directEntryId}"]`);
  const directImage = directDetail?.querySelector("img");
  directImage?.scrollIntoView({ block: "center" });
  await waitForLoadedImage(directImage, 5000);
  record(
    steps,
    directEntry?.description === directDescription
      && directEntry?.imageAssets?.length === 1
      && (directDetail?.querySelector(".glossary-detail-body")?.textContent || "").includes(directDescription)
      && isLoadedAssetImage(directImage),
    "Glossari > Nova entrada desa descripcio activa i imatge carregada",
    { directId: directEntry?.id || "", imageAssets: directEntry?.imageAssets?.length || 0, imageSrc: directImage?.src || "" },
  );

  return makeSuiteResult(context, steps);
}

async function runPersistenceReadSuite(context) {
  const steps = [];
  const quickId = "arxiu-persistent-qa";
  const quickDescription = "Descripcio persistent creada des de croniques.";
  const directId = "entrada-directa-persistent-qa";
  const directDescription = "Descripcio persistent creada des del menu de glossari.";
  const state = context.win.__NECRONOMICON_QA__?.state;

  const quickEntry = state?.glossary?.find?.((entry) => entry.id === quickId);
  const directEntry = state?.glossary?.find?.((entry) => entry.name === "Entrada directa persistent QA");
  const savedChronicle = state?.chronicles?.find?.((entry) => entry.title === "Cronica persistent QA");
  record(
    steps,
    quickEntry?.description === quickDescription
      && directEntry?.description === directDescription
      && savedChronicle?.content?.includes?.(`[[${quickId}|Arxiu persistent QA]]`),
    "Despres de reiniciar Chrome, les dues entrades i la referencia continuen al model",
    { quickFound: Boolean(quickEntry), directFound: Boolean(directEntry), chronicleFound: Boolean(savedChronicle) },
  );

  context.click('[data-module-link="glossary"]');
  await delay(120);
  const directEntryId = directEntry?.id || directId;
  context.q(`[data-glossary-id="${directEntryId}"]`)?.click();
  await delay(180);
  const directDetail = context.q(`[data-glossary-detail="${directEntryId}"]`);
  const directImage = directDetail?.querySelector("img");
  directImage?.scrollIntoView({ block: "center" });
  await waitForLoadedImage(directImage, 5000);
  record(
    steps,
    (directDetail?.querySelector(".glossary-detail-body")?.textContent || "").includes(directDescription)
      && isLoadedAssetImage(directImage),
    "La fitxa directa conserva descripcio visible i imatge d'IndexedDB despres de netejar cache",
    { imageSrc: directImage?.src || "", description: directDetail?.querySelector(".glossary-detail-body")?.textContent?.trim() || "" },
  );

  context.click('[data-module-link="chronicles"]');
  await delay(120);
  if (savedChronicle?.id) {
    context.q(`[data-chronicle-id="${savedChronicle.id}"]`)?.click();
  }
  await delay(180);
  const reference = context.q(`[data-reference-jump="${quickId}"]`);
  reference?.classList.add("tooltip-capture-open");
  await delay(220);
  const tooltip = reference?.querySelector(".glossary-reference-tooltip");
  const tooltipImage = tooltip?.querySelector("img");
  await waitForLoadedImage(tooltipImage, 5000);
  const tooltipOpacity = tooltip ? context.win.getComputedStyle(tooltip).opacity : "";
  record(
    steps,
    Boolean(reference)
      && (tooltip?.textContent || "").includes(quickDescription)
      && isLoadedAssetImage(tooltipImage),
    "El tooltip de la referencia persisteix amb descripcio i imatge despres del reinici",
    { tooltipOpacity, tooltipSrc: tooltipImage?.src || "", tooltipText: tooltip?.textContent?.trim() || "" },
  );

  return makeSuiteResult(context, steps);
}

function makeSuiteResult(context, steps) {
  return {
    ok: steps.every((step) => step.ok),
    suite: context.suite,
    mode: context.mode,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    steps,
  };
}

function isLoadedAssetImage(image) {
  return image?.tagName === "IMG"
    && (image.src.startsWith("blob:") || image.src.startsWith("data:image/"))
    && image.complete
    && image.naturalWidth > 0;
}

async function waitForLoadedImage(image, timeoutMs = 1600) {
  if (image?.tagName !== "IMG") {
    return;
  }
  const startedAt = Date.now();
  while ((!image.complete || image.naturalWidth <= 0) && Date.now() - startedAt < timeoutMs) {
    await delay(80);
  }
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
  statusEl.textContent = `RUNNING ${steps.length}`;
  reportEl.textContent = JSON.stringify({
    suite,
    mode,
    steps,
  }, null, 2);
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

function onceLoaded(frame) {
  return new Promise((resolve) => {
    frame.addEventListener("load", () => resolve(), { once: true });
  });
}

function delay(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}
