import { DATA_VERSION, STORAGE_KEY, seedData } from "../data.js";
import { sanitizePlayerNotes, splitLines, splitTags } from "./utils.js";

const LEGACY_STORAGE_KEYS = ["campaign-compendium-v2"];
const CAMPAIGN_LIBRARY_KIND = "necronomicon-campaign-library";
const DEFAULT_CAMPAIGN_ID = "meledar";
const DEFAULT_CAMPAIGN_NAME = "Meledar";
const DEFAULT_CAMPAIGN_SYSTEM = "D&D 5e";

let campaignLibrary = null;
let lastPersistenceError = null;

const DEFAULT_ACCESS = {
  roles: {
    superadmin: {
      editAnyCharacter: true,
      editOwnCharacter: true,
      editChronicles: true,
      editAssignedChronicles: true,
      editGlossary: true,
      editAssignedGlossary: true,
      managePermissions: true,
      manageCampaigns: true,
      publishCampaign: true,
    },
    gm: {
      editAnyCharacter: true,
      editOwnCharacter: true,
      editChronicles: true,
      editAssignedChronicles: true,
      editGlossary: true,
      editAssignedGlossary: true,
      managePermissions: false,
      manageCampaigns: false,
      publishCampaign: true,
    },
    player: {
      editAnyCharacter: false,
      editOwnCharacter: true,
      editChronicles: false,
      editAssignedChronicles: true,
      editGlossary: false,
      editAssignedGlossary: true,
      managePermissions: false,
      manageCampaigns: false,
      publishCampaign: false,
    },
  },
  users: {},
};

export function loadState() {
  const saved = readStoredState();
  if (!saved) {
    const initialState = sanitizeState(structuredClone(seedData));
    campaignLibrary = createLibraryFromState(initialState);
    return initialState;
  }

  try {
    const parsed = JSON.parse(saved);
    if (isCampaignLibraryPayload(parsed)) {
      campaignLibrary = normalizeCampaignLibrary(parsed);
      return getActiveCampaignState();
    }

    const singleState = migrateStoredState(parsed);
    campaignLibrary = createLibraryFromState(singleState);
    return singleState;
  } catch {
    const fallbackState = sanitizeState(structuredClone(seedData));
    campaignLibrary = createLibraryFromState(fallbackState);
    return fallbackState;
  }
}

export function persistState(state) {
  updateActiveCampaignState(state);
  const result = tryWriteCampaignLibrary();
  if (result.ok) {
    LEGACY_STORAGE_KEYS.forEach((key) => window.localStorage.removeItem(key));
  }
  return result;
}

export function getLastPersistenceError() {
  return lastPersistenceError;
}

export function createPersistedPayload(nextState) {
  return {
    version: DATA_VERSION,
    state: nextState,
  };
}

export function migrateStoredState(payload) {
  if (isCampaignLibraryPayload(payload)) {
    campaignLibrary = normalizeCampaignLibrary(payload);
    return getActiveCampaignState();
  }

  const isEnvelope =
    payload &&
    typeof payload === "object" &&
    Object.prototype.hasOwnProperty.call(payload, "state");
  if (isEnvelope && isCampaignLibraryPayload(payload.state)) {
    campaignLibrary = normalizeCampaignLibrary(payload.state);
    return getActiveCampaignState();
  }

  const version = isEnvelope ? Number(payload.version) || 0 : 0;
  let nextState = isEnvelope ? payload.state : payload;

  if (!nextState || typeof nextState !== "object") {
    return structuredClone(seedData);
  }

  if (version < 1) {
    nextState = migrateLegacySeedContent(nextState);
  }
  if (version < 2) {
    nextState = migrateLegacyUiState(nextState);
  }
  if (version < 3) {
    nextState = migrateCharacterPortraits(nextState);
  }
  if (version < 4) {
    nextState = migrateLocalEditingState(nextState);
  }
  if (version < 5) {
    nextState = migrateExpandedChroniclesAndGlossary(nextState);
  }
  if (version < 6) {
    nextState = migrateGlossaryImages(nextState);
  }
  if (version < 7) {
    nextState = migratePortadoresDelVeloDescription(nextState);
  }
  if (version < 8) {
    nextState = migrateGlossaryLatestState(nextState);
  }
  if (version < 9) {
    nextState = migrateSessionFourContent(nextState);
  }
  if (version < 10) {
    nextState = migrateSecondaryGlossaryCharacters(nextState);
  }
  if (version < 11) {
    nextState = migrateGlossaryCharacterCategoryName(nextState);
  }

  return sanitizeState(nextState);
}

export function getCampaignCatalog() {
  ensureCampaignLibrary();
  return {
    activeCampaignId: campaignLibrary.activeCampaignId,
    campaigns: campaignLibrary.campaigns.map((campaign) => ({
      id: campaign.id,
      name: campaign.name,
      system: campaign.system,
      createdAt: campaign.createdAt,
      updatedAt: campaign.updatedAt,
      isActive: campaign.id === campaignLibrary.activeCampaignId,
      access: campaign.state.access,
      counts: {
        characters: campaign.state.characters.length,
        chronicles: campaign.state.chronicles.length,
        glossary: campaign.state.glossary.length,
      },
    })),
  };
}

export function getActiveCampaignMeta() {
  ensureCampaignLibrary();
  const active = findActiveCampaignRecord();
  return {
    id: active.id,
    name: active.name,
    system: active.system,
    createdAt: active.createdAt,
    updatedAt: active.updatedAt,
  };
}

export function activateCampaign(campaignId, currentState) {
  ensureCampaignLibrary();
  updateActiveCampaignState(currentState);
  const target = campaignLibrary.campaigns.find((campaign) => campaign.id === campaignId);
  if (!target) {
    return getActiveCampaignState();
  }

  campaignLibrary.activeCampaignId = target.id;
  tryWriteCampaignLibrary();
  return getActiveCampaignState();
}

export function createCampaign({ name, system } = {}, currentState) {
  ensureCampaignLibrary();
  updateActiveCampaignState(currentState);

  const campaignName = String(name || "").trim() || "Nova campanya";
  const campaignSystem = String(system || "").trim() || "Sistema no especificat";
  const campaignId = createUniqueCampaignId(campaignName);
  const createdAt = new Date().toISOString();
  const newState = createStarterCampaignState({
    id: campaignId,
    name: campaignName,
    system: campaignSystem,
    createdAt,
  });

  campaignLibrary.campaigns.push({
    id: campaignId,
    name: campaignName,
    system: campaignSystem,
    createdAt,
    updatedAt: createdAt,
    version: DATA_VERSION,
    state: newState,
  });
  campaignLibrary.activeCampaignId = campaignId;
  tryWriteCampaignLibrary();
  return getActiveCampaignState();
}

export function updateCampaign(campaignId, { name, system } = {}, currentState) {
  ensureCampaignLibrary();
  updateActiveCampaignState(currentState);

  const target = campaignLibrary.campaigns.find((campaign) => campaign.id === campaignId);
  if (!target) {
    return getActiveCampaignState();
  }

  const campaignName = String(name || "").trim() || target.name;
  const campaignSystem = String(system || "").trim() || target.system || DEFAULT_CAMPAIGN_SYSTEM;
  const now = new Date().toISOString();

  target.name = campaignName;
  target.system = campaignSystem;
  target.updatedAt = now;
  target.state = sanitizeState({
    ...(target.state || {}),
    meta: {
      ...(target.state?.meta || {}),
      id: target.id,
      name: campaignName,
      system: campaignSystem,
      createdAt: target.createdAt,
      updatedAt: now,
    },
  });
  target.version = DATA_VERSION;
  tryWriteCampaignLibrary();
  return getActiveCampaignState();
}

export function deleteCampaign(campaignId, currentState) {
  ensureCampaignLibrary();
  updateActiveCampaignState(currentState);

  const targetIndex = campaignLibrary.campaigns.findIndex((campaign) => campaign.id === campaignId);
  if (targetIndex === -1 || campaignLibrary.campaigns.length <= 1) {
    return getActiveCampaignState();
  }

  const [removed] = campaignLibrary.campaigns.splice(targetIndex, 1);
  if (campaignLibrary.activeCampaignId === removed.id) {
    campaignLibrary.activeCampaignId = campaignLibrary.campaigns[Math.max(0, targetIndex - 1)]?.id
      || campaignLibrary.campaigns[0].id;
  }

  tryWriteCampaignLibrary();
  return getActiveCampaignState();
}

export function createCloudCampaignPayload(currentState) {
  ensureCampaignLibrary();
  updateActiveCampaignState(currentState);
  return createCampaignLibraryPayload();
}

function readStoredState() {
  const current = window.localStorage.getItem(STORAGE_KEY);
  if (current) {
    return current;
  }

  for (const key of LEGACY_STORAGE_KEYS) {
    const legacy = window.localStorage.getItem(key);
    if (legacy) {
      return legacy;
    }
  }

  return "";
}

function ensureCampaignLibrary() {
  if (!campaignLibrary) {
    campaignLibrary = createLibraryFromState(sanitizeState(structuredClone(seedData)));
  }
}

function isCampaignLibraryPayload(payload) {
  return Boolean(
    payload
      && typeof payload === "object"
      && (
        payload.kind === CAMPAIGN_LIBRARY_KIND
        || Array.isArray(payload.campaigns)
      ),
  );
}

function normalizeCampaignLibrary(payload) {
  const sourceCampaigns = Array.isArray(payload?.campaigns) ? payload.campaigns : [];
  const campaigns = sourceCampaigns
    .map((campaign) => normalizeCampaignRecord(campaign))
    .filter(Boolean);

  if (!campaigns.length) {
    return createLibraryFromState(sanitizeState(structuredClone(seedData)));
  }

  const activeCampaignId = campaigns.some((campaign) => campaign.id === payload.activeCampaignId)
    ? payload.activeCampaignId
    : campaigns[0].id;

  return {
    kind: CAMPAIGN_LIBRARY_KIND,
    version: DATA_VERSION,
    activeCampaignId,
    campaigns,
  };
}

function normalizeCampaignRecord(campaign) {
  if (!campaign || typeof campaign !== "object") {
    return null;
  }

  const fallbackId = createCampaignId(campaign.name || DEFAULT_CAMPAIGN_NAME);
  const id = String(campaign.id || campaign.state?.meta?.id || fallbackId).trim() || fallbackId;
  const name = String(campaign.name || campaign.state?.meta?.name || DEFAULT_CAMPAIGN_NAME).trim() || DEFAULT_CAMPAIGN_NAME;
  const system = String(campaign.system || campaign.state?.meta?.system || DEFAULT_CAMPAIGN_SYSTEM).trim() || DEFAULT_CAMPAIGN_SYSTEM;
  const createdAt = String(campaign.createdAt || campaign.state?.meta?.createdAt || new Date().toISOString());
  const updatedAt = String(campaign.updatedAt || campaign.state?.meta?.updatedAt || createdAt);
  const version = Number(campaign.version) || DATA_VERSION;
  const state = migrateStoredState({
    version,
    state: {
      ...(campaign.state || {}),
      meta: {
        ...(campaign.state?.meta || {}),
        id,
        name,
        system,
        createdAt,
        updatedAt,
      },
    },
  });

  return {
    id,
    name,
    system,
    createdAt,
    updatedAt,
    version: DATA_VERSION,
    state,
  };
}

function createLibraryFromState(state) {
  const safeState = sanitizeState(state);
  const meta = safeState.meta || {};
  const id = String(meta.id || DEFAULT_CAMPAIGN_ID);
  const now = new Date().toISOString();
  const name = String(meta.name || DEFAULT_CAMPAIGN_NAME);
  const system = String(meta.system || DEFAULT_CAMPAIGN_SYSTEM);
  const createdAt = String(meta.createdAt || now);
  const updatedAt = String(meta.updatedAt || now);

  safeState.meta = {
    ...safeState.meta,
    id,
    name,
    system,
    createdAt,
    updatedAt,
  };

  return {
    kind: CAMPAIGN_LIBRARY_KIND,
    version: DATA_VERSION,
    activeCampaignId: id,
    campaigns: [
      {
        id,
        name,
        system,
        createdAt,
        updatedAt,
        version: DATA_VERSION,
        state: safeState,
      },
    ],
  };
}

function findActiveCampaignRecord() {
  ensureCampaignLibrary();
  return (
    campaignLibrary.campaigns.find((campaign) => campaign.id === campaignLibrary.activeCampaignId)
    || campaignLibrary.campaigns[0]
  );
}

function getActiveCampaignState() {
  const active = findActiveCampaignRecord();
  const state = migrateStoredState({
    version: active.version || DATA_VERSION,
    state: {
      ...(active.state || {}),
      meta: {
        ...(active.state?.meta || {}),
        id: active.id,
        name: active.name,
        system: active.system,
        createdAt: active.createdAt,
        updatedAt: active.updatedAt,
      },
    },
  });
  active.state = state;
  active.version = DATA_VERSION;
  return structuredClone(state);
}

function updateActiveCampaignState(state) {
  if (!state) {
    return;
  }

  ensureCampaignLibrary();
  const active = findActiveCampaignRecord();
  const now = new Date().toISOString();
  const meta = {
    ...(state.meta || {}),
    id: active.id,
    name: active.name,
    system: active.system,
    createdAt: active.createdAt,
    updatedAt: now,
  };
  const safeState = {
    ...state,
    meta,
  };

  active.name = meta.name;
  active.system = meta.system;
  active.updatedAt = now;
  active.version = DATA_VERSION;
  active.state = safeState;
}

function writeCampaignLibrary() {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(createCampaignLibraryPayload()));
}

function tryWriteCampaignLibrary() {
  try {
    writeCampaignLibrary();
    lastPersistenceError = null;
    return { ok: true, error: null };
  } catch (error) {
    lastPersistenceError = error instanceof Error ? error : new Error(String(error));
    return { ok: false, error: lastPersistenceError };
  }
}

function createCampaignLibraryPayload() {
  ensureCampaignLibrary();
  return {
    kind: CAMPAIGN_LIBRARY_KIND,
    version: DATA_VERSION,
    activeCampaignId: campaignLibrary.activeCampaignId,
    campaigns: campaignLibrary.campaigns.map((campaign) => ({
      id: campaign.id,
      name: campaign.name,
      system: campaign.system,
      createdAt: campaign.createdAt,
      updatedAt: campaign.updatedAt,
      version: DATA_VERSION,
      state: campaign.state,
    })),
  };
}

function createStarterCampaignState({ id, name, system, createdAt }) {
  const chronicleId = "sessio-1";
  const characterId = "protagonista";
  const glossaryId = "primer-lloc";

  return sanitizeState({
    meta: {
      id,
      name,
      system,
      createdAt,
      updatedAt: createdAt,
    },
    characters: [
      {
        id: characterId,
        name: "Nou personatge",
        title: "Fitxa inicial",
        lineage: "Arquetip",
        className: system,
        level: 1,
        summary: "Substitueix aquesta fitxa pel primer personatge o NPC important de la campanya.",
        quickNotes: "Objectius, trets destacats i ganxos de joc.",
        lore: {
          origin: "",
          bonds: "",
          secrets: "",
          goals: "",
          wounds: "",
        },
        sheet: {
          ac: "",
          hp: "",
          proficiency: "",
          abilities: "",
          features: "Anota aqui atributs, habilitats, avantatges, poders o qualsevol bloc de sistema que necessitis.",
        },
        inventory: {
          items: "",
          currency: "",
          artifacts: "",
          notes: "",
        },
        history: "",
        sigil: "N",
        portrait: "",
        playerNotes: [],
        palette: ["#4f3f34", "#c49a5d"],
      },
    ],
    chronicles: [
      {
        id: chronicleId,
        chapter: "Sessio 1",
        title: `Inici de ${name}`,
        date: "",
        summary: "",
        content: "Escriu aqui la primera cronica de la campanya.",
        highlights: "",
        imageNote: "",
        imageAssets: [],
        playerNotes: [],
        voiceNotes: [],
        characterIds: [characterId],
        palette: ["#64483d", "#c8a86d"],
      },
    ],
    glossary: [
      {
        id: glossaryId,
        name: "Primer lloc",
        category: "Llocs",
        description: "Canvia aquesta entrada pel primer lloc, faccio o concepte important.",
        tags: [system],
        notes: "",
        latestStatus: "",
        lastSeenChronicleId: chronicleId,
        imageAssets: [],
        playerNotes: [],
        characterIds: [],
        chronicleIds: [chronicleId],
        palette: ["#54616a", "#c6a26a"],
      },
    ],
    access: structuredClone(DEFAULT_ACCESS),
    ui: {
      ...structuredClone(seedData.ui),
      currentModule: "chronicles",
      selectedCharacterId: characterId,
      selectedCharacterTab: "sheet",
      showCharacterGrid: true,
      selectedChronicleId: chronicleId,
      showChronicleLanding: true,
      selectedGlossaryId: glossaryId,
      glossaryCategory: "Totes",
      glossaryChronicleIds: [],
      glossarySearch: "",
      chronicleIndexSearch: "",
      saveNotice: "",
    },
  });
}

function createUniqueCampaignId(name) {
  ensureCampaignLibrary();
  const baseId = createCampaignId(name);
  const existingIds = new Set(campaignLibrary.campaigns.map((campaign) => campaign.id));
  if (!existingIds.has(baseId)) {
    return baseId;
  }

  let index = 2;
  while (existingIds.has(`${baseId}-${index}`)) {
    index += 1;
  }
  return `${baseId}-${index}`;
}

function createCampaignId(name) {
  const slug = String(name || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || `campanya-${Date.now()}`;
}

function migrateLegacySeedContent(candidate) {
  const next = structuredClone(candidate);
  const legacyCharacterIds = new Set(["iria", "darian", "mira", "tobin"]);
  const legacyChronicleIds = new Set(["s1", "s2", "s3"]);
  const legacyGlossaryIds = new Set(["port-gris", "custodis", "esbarzers-rogencs"]);

  if (Array.isArray(next.characters) && next.characters.some((character) => legacyCharacterIds.has(character?.id))) {
    next.characters = structuredClone(seedData.characters);
  }
  if (Array.isArray(next.chronicles) && next.chronicles.some((chronicle) => legacyChronicleIds.has(chronicle?.id))) {
    next.chronicles = structuredClone(seedData.chronicles);
  }
  if (Array.isArray(next.glossary) && next.glossary.some((entry) => legacyGlossaryIds.has(entry?.id))) {
    next.glossary = structuredClone(seedData.glossary);
  }

  return next;
}

function migrateLegacyUiState(candidate) {
  const next = structuredClone(candidate);
  next.ui = {
    ...structuredClone(seedData.ui),
    ...(next.ui || {}),
  };

  if (next.ui.selectedCharacterId === "iria") {
    next.ui.selectedCharacterId = seedData.ui.selectedCharacterId;
  }
  if (next.ui.selectedChronicleId === "s1") {
    next.ui.selectedChronicleId = seedData.ui.selectedChronicleId;
  }
  if (next.ui.selectedGlossaryId === "port-gris") {
    next.ui.selectedGlossaryId = seedData.ui.selectedGlossaryId;
  }

  return next;
}

function migrateCharacterPortraits(candidate) {
  const next = structuredClone(candidate);
  next.characters = (next.characters || []).map((character, index) => ({
    ...character,
    portrait:
      typeof character?.portrait === "string" && character.portrait
        ? character.portrait
        : seedData.characters[index]?.portrait || "",
  }));
  return next;
}

function migrateLocalEditingState(candidate) {
  const next = structuredClone(candidate);
  const legacyEditMode = Boolean(next.ui?.isEditMode);

  next.ui = {
    ...(next.ui || {}),
    editModes: {
      characters: legacyEditMode && (next.ui?.currentModule || "characters") === "characters",
      chronicles: legacyEditMode && next.ui?.currentModule === "chronicles",
      glossary: legacyEditMode && next.ui?.currentModule === "glossary",
    },
    drafts: structuredClone(seedData.ui.drafts),
  };

  delete next.ui.isEditMode;
  return next;
}

function migrateExpandedChroniclesAndGlossary(candidate) {
  const next = structuredClone(candidate);

  if (shouldReplaceLegacyChronicles(next.chronicles)) {
    next.chronicles = structuredClone(seedData.chronicles);
  }

  if (shouldReplaceLegacyGlossary(next.glossary)) {
    next.glossary = structuredClone(seedData.glossary);
  } else if (Array.isArray(next.glossary)) {
    const existingIds = new Set(next.glossary.map((entry) => entry?.id).filter(Boolean));
    seedData.glossary.forEach((entry) => {
      if (!existingIds.has(entry.id)) {
        next.glossary.push(structuredClone(entry));
      }
    });
  }

  return next;
}

function shouldReplaceLegacyChronicles(chronicles) {
  if (!Array.isArray(chronicles) || chronicles.length !== 3) {
    return false;
  }

  return (
    chronicles[0]?.id === "judici-acantilado"
    && chronicles[0]?.title === "Arribada a Acantilado del Silencio"
    && String(chronicles[0]?.content || "").includes("El grup arriba a [[acantilado-del-silencio|Acantilado del Silencio]] escortat")
    && chronicles[1]?.id === "ritual-fossa"
    && chronicles[1]?.title === "Eclipsi sobre la Fossa"
    && chronicles[2]?.id === "sagnatori"
    && chronicles[2]?.title === "Sota la sang i la pedra"
  );
}

function shouldReplaceLegacyGlossary(glossary) {
  if (!Array.isArray(glossary) || glossary.length !== 4) {
    return false;
  }

  const byId = new Map(glossary.map((entry) => [entry?.id, entry]));
  return (
    byId.has("acantilado-del-silencio")
    && byId.has("kaelor")
    && byId.has("zaher-ar-kal")
    && byId.has("nishaar")
    && String(byId.get("acantilado-del-silencio")?.description || "").includes("Ciutat aixecada sobre penya-segats blancs")
    && String(byId.get("kaelor")?.description || "").includes("Nom sota el qual Acantilado del Silencio justifica penitència")
  );
}

function migrateGlossaryImages(candidate) {
  const next = structuredClone(candidate);
  const imageSeedIds = new Set(
    (seedData.glossary || [])
      .filter((entry) => Array.isArray(entry?.imageAssets) && entry.imageAssets.length)
      .map((entry) => entry.id),
  );

  next.glossary = Array.isArray(next.glossary)
    ? next.glossary.map((entry) => {
      if (!imageSeedIds.has(entry?.id)) {
        return entry;
      }

      const seedEntry = seedData.glossary.find((item) => item.id === entry.id);
      if (!seedEntry) {
        return entry;
      }

      const hasImages = Array.isArray(entry?.imageAssets) && entry.imageAssets.length > 0;
      return hasImages
        ? entry
        : {
          ...entry,
          imageAssets: structuredClone(seedEntry.imageAssets || []),
        };
    })
    : next.glossary;

  return next;
}

function migratePortadoresDelVeloDescription(candidate) {
  const next = structuredClone(candidate);
  const legacyDescription =
    "Braç visible de l'ordre religiós d'Acantilado del Silencio: escorten presoners, custodien espais sagrats i imposen els rituals del clergat.";
  const seedDescription = seedData.glossary.find((entry) => entry.id === "portadores-del-velo")?.description || "";

  next.glossary = Array.isArray(next.glossary)
    ? next.glossary.map((entry) => {
      if (entry?.id !== "portadores-del-velo") {
        return entry;
      }

      return String(entry.description || "").trim() === legacyDescription
        ? { ...entry, description: seedDescription }
        : entry;
    })
    : next.glossary;

  return next;
}

function migrateGlossaryLatestState(candidate) {
  const next = structuredClone(candidate);

  next.glossary = Array.isArray(next.glossary)
    ? next.glossary.map((entry) => {
      const seedEntry = seedData.glossary.find((item) => item.id === entry?.id);
      if (!seedEntry) {
        return entry;
      }

      const nextEntry = { ...entry };

      if (!String(nextEntry.latestStatus || "").trim() && String(seedEntry.latestStatus || "").trim()) {
        nextEntry.latestStatus = seedEntry.latestStatus;
      }

      if (!String(nextEntry.lastSeenChronicleId || "").trim() && String(seedEntry.lastSeenChronicleId || "").trim()) {
        nextEntry.lastSeenChronicleId = seedEntry.lastSeenChronicleId;
      }

      if (
        nextEntry.id === "uric"
        && Array.isArray(nextEntry.chronicleIds)
        && nextEntry.chronicleIds.length === 1
        && nextEntry.chronicleIds[0] === "judici-acantilado"
      ) {
        nextEntry.chronicleIds = structuredClone(seedEntry.chronicleIds || nextEntry.chronicleIds);
      }

      return nextEntry;
    })
    : next.glossary;

  return next;
}

function migrateSessionFourContent(candidate) {
  const next = structuredClone(candidate);
  const sessionFour = seedData.chronicles.find((chronicle) => chronicle.id === "sala-dels-plaers");

  if (sessionFour) {
    next.chronicles = Array.isArray(next.chronicles) ? next.chronicles : [];
    if (!next.chronicles.some((chronicle) => chronicle?.id === sessionFour.id)) {
      next.chronicles.push(structuredClone(sessionFour));
    }
  }

  next.glossary = Array.isArray(next.glossary) ? next.glossary : [];
  const glossaryById = new Map(next.glossary.map((entry) => [entry?.id, entry]));

  seedData.glossary.forEach((seedEntry) => {
    const existingEntry = glossaryById.get(seedEntry.id);
    if (!existingEntry) {
      next.glossary.push(structuredClone(seedEntry));
      glossaryById.set(seedEntry.id, next.glossary.at(-1));
      return;
    }

    if ((seedEntry.chronicleIds || []).includes("sala-dels-plaers")) {
      existingEntry.chronicleIds = mergeUniqueStrings(existingEntry.chronicleIds, seedEntry.chronicleIds);
    }

    if (!String(existingEntry.latestStatus || "").trim() && String(seedEntry.latestStatus || "").trim()) {
      existingEntry.latestStatus = seedEntry.latestStatus;
    }

    if (!String(existingEntry.lastSeenChronicleId || "").trim() && String(seedEntry.lastSeenChronicleId || "").trim()) {
      existingEntry.lastSeenChronicleId = seedEntry.lastSeenChronicleId;
    }
  });

  return next;
}

function mergeUniqueStrings(currentValues, addedValues) {
  return [
    ...new Set([
      ...(Array.isArray(currentValues) ? currentValues.map(String) : []),
      ...(Array.isArray(addedValues) ? addedValues.map(String) : []),
    ].filter(Boolean)),
  ];
}

function migrateSecondaryGlossaryCharacters(candidate) {
  const next = structuredClone(candidate);
  const secondaryCharacterIds = new Set([
    "varron-thayne",
    "hermana-seraphe",
    "reina-elisabeth",
    "mijo",
    "uric",
    "elyse",
  ]);

  next.glossary = Array.isArray(next.glossary)
    ? next.glossary.map((entry) => (
      secondaryCharacterIds.has(entry?.id) && entry.category === "Altres"
        ? { ...entry, category: "Personatges" }
        : entry
    ))
    : next.glossary;

  return next;
}

function migrateGlossaryCharacterCategoryName(candidate) {
  const next = structuredClone(candidate);
  next.glossary = Array.isArray(next.glossary)
    ? next.glossary.map((entry) => (
      entry.category === "Personatges secundaris"
        ? { ...entry, category: "Personatges" }
        : entry
    ))
    : next.glossary;
  return next;
}

function sanitizeState(candidate) {
  const safe = structuredClone(seedData);
  if (!candidate || typeof candidate !== "object") {
    safe.meta = sanitizeCampaignMeta(null);
    return safe;
  }

  safe.meta = sanitizeCampaignMeta(candidate.meta);
  safe.characters = Array.isArray(candidate.characters) && candidate.characters.length
    ? candidate.characters.map((character, index) => sanitizeCharacter(character, seedData.characters[index] || seedData.characters[0]))
    : safe.characters;
  safe.characters = withBaskinsSeedCharacter(safe);
  safe.chronicles = Array.isArray(candidate.chronicles) && candidate.chronicles.length
    ? candidate.chronicles.map((chronicle, index) => sanitizeChronicle(chronicle, seedData.chronicles[index] || seedData.chronicles[0]))
    : safe.chronicles;
  safe.glossary = Array.isArray(candidate.glossary) && candidate.glossary.length
    ? candidate.glossary.map((entry, index) => sanitizeGlossary(entry, seedData.glossary[index] || seedData.glossary[0]))
    : safe.glossary;
  safe.access = sanitizeAccess(candidate.access);
  safe.ui = {
    ...safe.ui,
    ...candidate.ui,
    editModes: {
      ...safe.ui.editModes,
      ...(candidate.ui?.editModes || {}),
    },
    drafts: sanitizeDrafts(candidate.ui?.drafts, safe.ui.drafts),
  };

  if (!safe.ui.glossaryReturnView && candidate.ui?.glossaryReturnChronicleId) {
    safe.ui.glossaryReturnView = {
      currentModule: "chronicles",
      selectedChronicleId: candidate.ui.glossaryReturnChronicleId,
      selectedCharacterId: safe.ui.selectedCharacterId,
      selectedCharacterTab: safe.ui.selectedCharacterTab,
      showCharacterGrid: safe.ui.showCharacterGrid,
      selectedGlossaryId: safe.ui.selectedGlossaryId,
    };
  }

  if (typeof safe.ui.glossaryReturnTargetId !== "string") {
    safe.ui.glossaryReturnTargetId = "";
  }

  if (safe.ui.glossaryReturnView && typeof safe.ui.glossaryReturnView !== "object") {
    safe.ui.glossaryReturnView = null;
  }

  if (!safe.characters.some((character) => character.id === safe.ui.selectedCharacterId)) {
    safe.ui.selectedCharacterId = safe.characters[0]?.id || "";
  }
  if (!["sheet", "inventory", "history"].includes(safe.ui.selectedCharacterTab)) {
    safe.ui.selectedCharacterTab = "sheet";
  }
  if (!safe.chronicles.some((chronicle) => chronicle.id === safe.ui.selectedChronicleId)) {
    safe.ui.selectedChronicleId = safe.chronicles[0]?.id || "";
  }
  if (!safe.glossary.some((entry) => entry.id === safe.ui.selectedGlossaryId)) {
    safe.ui.selectedGlossaryId = safe.glossary[0]?.id || "";
  }

  return safe;
}

function withBaskinsSeedCharacter(state) {
  if (!isBaskinsSavageCampaign(state)) {
    return state.characters;
  }
  if (state.characters.some((character) => character.id === "ruth-baskin")) {
    return state.characters.map((character) => (
      character.id === "ruth-baskin" ? enrichBaskinsSeedCharacter(character) : character
    ));
  }

  return [
    ...state.characters,
    createBaskinsSeedCharacter(),
  ];
}

function enrichBaskinsSeedCharacter(character) {
  const seedCharacter = createBaskinsSeedCharacter();
  const seedArmor = "Abric reforcat | Armadura +2 | equipada | Proteccio discreta, impermeable fosc";
  const currentItems = character.inventory?.items || "";
  const enrichedItems = currentItems.includes("Abric reforcat")
    ? currentItems
    : `${currentItems || seedCharacter.inventory.items}\n${seedArmor}`.trim();
  const oldItems =
    "Rifle curt, revòlver gastat, ganivet de bota, llibreta de deutes, impermeable fosc, xiulet d'os, tres bales marcades amb inicials.";
  return {
    ...seedCharacter,
    ...character,
    sheet: {
      ...seedCharacter.sheet,
      ...(character.sheet || {}),
      abilities: String(character.sheet?.abilities || "").includes("Pas ")
        ? character.sheet.abilities
        : seedCharacter.sheet.abilities,
      savageState: {
        bennies: 3,
        wounds: 0,
        fatigue: 0,
        shaken: false,
        incapacitated: false,
        conviction: 0,
        powerPoints: 0,
        maxPowerPoints: 0,
        conditions: [],
        ammo: {},
        ...(character.sheet?.savageState || {}),
      },
    },
    inventory: {
      ...seedCharacter.inventory,
      ...(character.inventory || {}),
      items:
        !character.inventory?.items || character.inventory.items === oldItems
          ? seedCharacter.inventory.items
          : enrichedItems,
    },
  };
}

function isBaskinsSavageCampaign(state) {
  const metaText = `${state.meta?.id || ""} ${state.meta?.name || ""}`.toLowerCase();
  const systemText = String(state.meta?.system || "").toLowerCase();
  return metaText.includes("baskins") && systemText.includes("savage");
}

function createBaskinsSeedCharacter() {
  return {
    id: "ruth-baskin",
    name: "Ruth Baskin",
    title: "La caçadora que coneix el preu de cada favor",
    lineage: "Humana",
    className: "Rastrejadora d'ombres",
    level: 1,
    summary:
      "Ruth Baskin porta el cognom com una marca i una factura pendent. És una rastrejadora de pobles fronterers, hàbil trobant gent desapareguda, llegint mentides petites i cobrant deutes que ningú vol posar per escrit.",
    quickNotes:
      "Dispara primer si la conversa fa olor de trampa. Té una llibreta amb noms ratllats, un xiulet d'os i una relació massa familiar amb els corbs del camí vell.",
    lore: {
      origin:
        "Va créixer entre magatzems tancats, camins de pols i històries que els adults deixaven a mitges quan ella entrava a l'habitació. El seu primer encàrrec va ser trobar un germà perdut; el va trobar viu, però no humà del tot.",
      bonds:
        "Protegeix qualsevol criatura que hagi estat convertida en eina per algú més poderós. Desconfia dels jutges, dels notaris i dels predicadors massa nets.",
      secrets:
        "El seu cognom obre portes en llocs on ningú admet conèixer els Baskin. També tanca altres portes amb panys nous.",
      goals:
        "Vol descobrir qui fa servir el nom Baskin per moure diners, morts i miracles falsos entre assentaments.",
      wounds:
        "No dorm bé si no sap on són totes les sortides. Quan sent campanes llunyanes, compta inconscientment fins a tretze.",
    },
    sheet: {
      ac: "Parada 6",
      hp: "Duresa 5",
      proficiency: "Bennies 3",
      abilities:
        "Pas 6\nAgilitat d8, Astúcia d8, Esperit d6, Força d6, Vigor d8\nAtletisme d6, Disparar d8, Furtivitat d6, Investigar d8, Notar d8, Persuadir d6, Provocar d6, Reparar d6, Sobreviure d6",
      features:
        "Avantatges: Alerta, Ràpida desenfundant.\nComplicacions: Cautelosa, Lleial als innocents atrapats, Secret familiar.\nNotes: sap seguir rastres en terreny difícil i pot reconstruir una escena mirant què falta, no només què hi ha.",
      savageState: {
        bennies: 3,
        wounds: 0,
        fatigue: 0,
        shaken: false,
        incapacitated: false,
        conviction: 0,
        powerPoints: 0,
        maxPowerPoints: 0,
        conditions: [],
        ammo: {},
      },
    },
    inventory: {
      items:
        "Rifle curt | Disparar d8 | 2d6 | Rang 12/24/48 | Municio 6/6 | preparada\nRevolver gastat | Disparar d8 | 2d6+1 | Rang 12/24/48 | Municio 6/6 | preparada\nGanivet de bota | Atletisme d6 | For+d4 | Cos a cos\nAbric reforcat | Armadura +2 | equipada | Proteccio discreta, impermeable fosc\nLlibreta de deutes, xiulet d'os, tres bales marcades amb inicials.",
      currency: "14 dòlars, dues monedes antigues i un favor cobrat a mitges.",
      artifacts:
        "Xiulet d'os: els corbs responen quan el vent bufa de nord. Ruth encara no sap si els crida o si només els avisa.",
      notes:
        "Ideal com a aliada incòmoda, PNJ recurrent o personatge jugador amb ganxos directes sobre la família Baskin.",
    },
    history:
      "Ruth va aprendre aviat que una família pot ser una protecció, una condemna o una signatura falsificada. Després d'un incendi al registre del comtat, va començar a trobar documents amb el seu cognom lligat a compres impossibles: terres que no existien, cadàvers sense nom i una mina que apareixia als mapes només durant la lluna nova.\n\nAra segueix el rastre d'aquests papers. No busca venjança exactament; busca saber qui cobra quan els Baskin sagnen.",
    sigil: "RB",
    portrait: "",
    playerNotes: [],
    palette: ["#3f2d25", "#b8793e"],
  };
}

function sanitizeCampaignMeta(meta) {
  const source = meta && typeof meta === "object" ? meta : {};
  const now = new Date().toISOString();
  return {
    id: String(source.id || DEFAULT_CAMPAIGN_ID),
    name: String(source.name || DEFAULT_CAMPAIGN_NAME),
    system: String(source.system || DEFAULT_CAMPAIGN_SYSTEM),
    createdAt: String(source.createdAt || now),
    updatedAt: String(source.updatedAt || source.createdAt || now),
  };
}

function sanitizeAccess(access) {
  const source = access && typeof access === "object" ? access : {};
  const roles = source.roles && typeof source.roles === "object" ? source.roles : {};
  const users = source.users && typeof source.users === "object" ? source.users : {};
  const migratedRoles = { ...roles };

  if (roles.dm && !migratedRoles.gm) {
    migratedRoles.gm = roles.dm;
  }
  if (roles.viewer && !migratedRoles.player) {
    migratedRoles.player = roles.viewer;
  }
  delete migratedRoles.dm;
  delete migratedRoles.viewer;

  return {
    roles: Object.fromEntries(
      Object.entries({
        ...DEFAULT_ACCESS.roles,
        ...migratedRoles,
      }).map(([roleId, permissions]) => [
        normalizeRoleId(roleId),
        {
          ...DEFAULT_ACCESS.roles.player,
          ...(permissions && typeof permissions === "object" ? permissions : {}),
        },
      ]),
    ),
    users: Object.fromEntries(
      Object.entries(users)
        .filter(([email]) => typeof email === "string" && email.includes("@"))
        .map(([email, user]) => [
          email.toLowerCase(),
          {
            ...(user && typeof user === "object" ? user : {}),
            role: normalizeRoleId(typeof user?.role === "string" ? user.role : "player"),
            characterIds: Array.isArray(user?.characterIds) ? user.characterIds.map(String) : [],
            invitedAt: typeof user?.invitedAt === "string" ? user.invitedAt : "",
          },
        ]),
    ),
  };
}

function normalizeRoleId(roleId) {
  if (roleId === "dm") {
    return "gm";
  }
  if (roleId === "viewer") {
    return "player";
  }
  return ["superadmin", "gm", "player"].includes(roleId) ? roleId : String(roleId || "player");
}

function sanitizeDrafts(candidateDrafts, fallbackDrafts) {
  return {
    characters: {
      overview: { ...(fallbackDrafts.characters.overview || {}), ...(candidateDrafts?.characters?.overview || {}) },
      tabs: { ...(fallbackDrafts.characters.tabs || {}), ...(candidateDrafts?.characters?.tabs || {}) },
    },
    chronicles: { ...(fallbackDrafts.chronicles || {}), ...(candidateDrafts?.chronicles || {}) },
    glossary: { ...(fallbackDrafts.glossary || {}), ...(candidateDrafts?.glossary || {}) },
  };
}

function sanitizeCharacter(character, fallback) {
  const characterFallback = findCharacterFallback(character, fallback);
  return {
    ...structuredClone(characterFallback),
    ...character,
    lore: { ...structuredClone(characterFallback).lore, ...(character?.lore || {}) },
    sheet: { ...structuredClone(characterFallback).sheet, ...(character?.sheet || {}) },
    inventory: { ...structuredClone(characterFallback).inventory, ...(character?.inventory || {}) },
    playerNotes: sanitizePlayerNotes(character?.playerNotes),
    palette: Array.isArray(character?.palette) ? character.palette : characterFallback.palette,
    portrait: sanitizeCharacterPortrait(character, characterFallback),
  };
}

function findCharacterFallback(character, fallback) {
  const characterId = typeof character?.id === "string" ? character.id : "";
  return seedData.characters.find((seedCharacter) => seedCharacter.id === characterId) || fallback;
}

function sanitizeCharacterPortrait(character, fallback) {
  const portrait = typeof character?.portrait === "string" ? character.portrait.trim() : "";
  if (!portrait) {
    return fallback?.id === character?.id ? fallback.portrait : "";
  }

  return isPackagedCharacterPortrait(character?.id, portrait) ? fallback.portrait : portrait;
}

function isPackagedCharacterPortrait(characterId, portrait) {
  const fallback = seedData.characters.find((character) => character.id === characterId);
  if (!fallback?.portrait) {
    return false;
  }

  const normalizedPortrait = String(portrait || "").replaceAll("\\", "/").toLowerCase();
  const normalizedId = String(characterId || "").toLowerCase();
  return Boolean(
    normalizedId
      && (
        normalizedPortrait.includes(`/assets/${normalizedId}-`)
        || normalizedPortrait.includes(`/resources/imatges/${normalizedId}.`)
      ),
  );
}

function sanitizeChronicle(chronicle, fallback) {
  return {
    ...structuredClone(fallback),
    ...chronicle,
    characterIds: Array.isArray(chronicle?.characterIds) ? chronicle.characterIds : fallback.characterIds,
    editableByUserEmails: Array.isArray(chronicle?.editableByUserEmails)
      ? chronicle.editableByUserEmails.map((email) => String(email || "").trim().toLowerCase()).filter(Boolean)
      : [],
    imageAssets: Array.isArray(chronicle?.imageAssets) ? chronicle.imageAssets : splitLines(chronicle?.imageAssets || fallback.imageAssets?.join("\n") || ""),
    playerNotes: sanitizePlayerNotes(chronicle?.playerNotes),
    voiceNotes: Array.isArray(chronicle?.voiceNotes) ? chronicle.voiceNotes : splitLines(chronicle?.voiceNotes || fallback.voiceNotes?.join("\n") || ""),
    palette: Array.isArray(chronicle?.palette) ? chronicle.palette : fallback.palette,
  };
}

function sanitizeGlossary(entry, fallback) {
  const entryFallback = seedData.glossary.find((seedEntry) => seedEntry.id === entry?.id) || fallback;
  return {
    ...structuredClone(entryFallback),
    ...entry,
    tags: Array.isArray(entry?.tags) ? entry.tags : splitTags(entry?.tags || entryFallback.tags.join(", ")),
    imageAssets: sanitizeGlossaryImageAssets(entry, entryFallback),
    characterIds: Array.isArray(entry?.characterIds) ? entry.characterIds : entryFallback.characterIds,
    chronicleIds: Array.isArray(entry?.chronicleIds) ? entry.chronicleIds : entryFallback.chronicleIds,
    editableByUserEmails: Array.isArray(entry?.editableByUserEmails)
      ? entry.editableByUserEmails.map((email) => String(email || "").trim().toLowerCase()).filter(Boolean)
      : [],
    playerNotes: sanitizePlayerNotes(entry?.playerNotes),
    palette: Array.isArray(entry?.palette) ? entry.palette : entryFallback.palette,
  };
}

function sanitizeGlossaryImageAssets(entry, fallback) {
  const assets = Array.isArray(entry?.imageAssets)
    ? entry.imageAssets
    : splitLines(entry?.imageAssets || fallback.imageAssets?.join("\n") || "");
  const packagedFallback = fallback?.imageAssets?.[0] || "";

  return assets.map((source) => (
    packagedFallback && isPackagedGlossaryImage(entry?.id, source)
      ? packagedFallback
      : source
  ));
}

function isPackagedGlossaryImage(entryId, source) {
  const normalizedId = String(entryId || "").trim().toLowerCase();
  const normalizedSource = String(source || "").replaceAll("\\", "/").toLowerCase();
  if (!normalizedId || !normalizedSource) {
    return false;
  }

  return (
    normalizedSource.includes(`/assets/${normalizedId}-`)
    || normalizedSource.includes(`/resources/glossary/${normalizedId}.png`)
    || normalizedSource.includes(`/resources/glossary/${normalizedId}.jpg`)
  );
}
