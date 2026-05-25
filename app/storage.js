import { DATA_VERSION, STORAGE_KEY, seedData } from "../data.js";
import { sanitizePlayerNotes, splitLines, splitTags } from "./utils.js";

const LEGACY_STORAGE_KEYS = ["campaign-compendium-v2"];

const DEFAULT_ACCESS = {
  roles: {
    dm: {
      editAnyCharacter: true,
      editOwnCharacter: true,
      editChronicles: true,
      editGlossary: true,
      managePermissions: true,
    },
    player: {
      editAnyCharacter: false,
      editOwnCharacter: true,
      editChronicles: false,
      editGlossary: false,
      managePermissions: false,
    },
    viewer: {
      editAnyCharacter: false,
      editOwnCharacter: false,
      editChronicles: false,
      editGlossary: false,
      managePermissions: false,
    },
  },
  users: {},
};

export function loadState() {
  const saved = readStoredState();
  if (!saved) {
    return structuredClone(seedData);
  }

  try {
    return migrateStoredState(JSON.parse(saved));
  } catch {
    return structuredClone(seedData);
  }
}

export function persistState(state) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(createPersistedPayload(state)));
  LEGACY_STORAGE_KEYS.forEach((key) => window.localStorage.removeItem(key));
}

export function createPersistedPayload(nextState) {
  return {
    version: DATA_VERSION,
    state: nextState,
  };
}

export function migrateStoredState(payload) {
  const isEnvelope =
    payload &&
    typeof payload === "object" &&
    Object.prototype.hasOwnProperty.call(payload, "state");
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

  return sanitizeState(nextState);
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
  if (!safe.chronicles.some((chronicle) => chronicle.id === safe.ui.selectedChronicleId)) {
    safe.ui.selectedChronicleId = safe.chronicles[0]?.id || "";
  }
  if (!safe.glossary.some((entry) => entry.id === safe.ui.selectedGlossaryId)) {
    safe.ui.selectedGlossaryId = safe.glossary[0]?.id || "";
  }

  return safe;
}

function sanitizeAccess(access) {
  const source = access && typeof access === "object" ? access : {};
  const roles = source.roles && typeof source.roles === "object" ? source.roles : {};
  const users = source.users && typeof source.users === "object" ? source.users : {};

  return {
    roles: Object.fromEntries(
      Object.entries({
        ...DEFAULT_ACCESS.roles,
        ...roles,
      }).map(([roleId, permissions]) => [
        roleId,
        {
          ...DEFAULT_ACCESS.roles.viewer,
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
            role: typeof user?.role === "string" ? user.role : "viewer",
            characterIds: Array.isArray(user?.characterIds) ? user.characterIds.map(String) : [],
          },
        ]),
    ),
  };
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
  return {
    ...structuredClone(fallback),
    ...character,
    lore: { ...structuredClone(fallback).lore, ...(character?.lore || {}) },
    sheet: { ...structuredClone(fallback).sheet, ...(character?.sheet || {}) },
    inventory: { ...structuredClone(fallback).inventory, ...(character?.inventory || {}) },
    playerNotes: sanitizePlayerNotes(character?.playerNotes),
    palette: Array.isArray(character?.palette) ? character.palette : fallback.palette,
    portrait: typeof character?.portrait === "string" && character.portrait ? character.portrait : fallback.portrait,
  };
}

function sanitizeChronicle(chronicle, fallback) {
  return {
    ...structuredClone(fallback),
    ...chronicle,
    characterIds: Array.isArray(chronicle?.characterIds) ? chronicle.characterIds : fallback.characterIds,
    imageAssets: Array.isArray(chronicle?.imageAssets) ? chronicle.imageAssets : splitLines(chronicle?.imageAssets || fallback.imageAssets?.join("\n") || ""),
    playerNotes: sanitizePlayerNotes(chronicle?.playerNotes),
    voiceNotes: Array.isArray(chronicle?.voiceNotes) ? chronicle.voiceNotes : splitLines(chronicle?.voiceNotes || fallback.voiceNotes?.join("\n") || ""),
    palette: Array.isArray(chronicle?.palette) ? chronicle.palette : fallback.palette,
  };
}

function sanitizeGlossary(entry, fallback) {
  return {
    ...structuredClone(fallback),
    ...entry,
    tags: Array.isArray(entry?.tags) ? entry.tags : splitTags(entry?.tags || fallback.tags.join(", ")),
    imageAssets: Array.isArray(entry?.imageAssets) ? entry.imageAssets : splitLines(entry?.imageAssets || fallback.imageAssets?.join("\n") || ""),
    characterIds: Array.isArray(entry?.characterIds) ? entry.characterIds : fallback.characterIds,
    chronicleIds: Array.isArray(entry?.chronicleIds) ? entry.chronicleIds : fallback.chronicleIds,
    playerNotes: sanitizePlayerNotes(entry?.playerNotes),
    palette: Array.isArray(entry?.palette) ? entry.palette : fallback.palette,
  };
}
