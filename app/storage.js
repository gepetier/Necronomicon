import { DATA_VERSION, STORAGE_KEY, seedData } from "../data.js";
import { sanitizePlayerNotes, splitLines, splitTags } from "./utils.js";

const LEGACY_STORAGE_KEYS = ["campaign-compendium-v2"];

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
    characterIds: Array.isArray(entry?.characterIds) ? entry.characterIds : fallback.characterIds,
    chronicleIds: Array.isArray(entry?.chronicleIds) ? entry.chronicleIds : fallback.chronicleIds,
    playerNotes: sanitizePlayerNotes(entry?.playerNotes),
    palette: Array.isArray(entry?.palette) ? entry.palette : fallback.palette,
  };
}
