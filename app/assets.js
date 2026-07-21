const DIRECT_MEDIA_KEYS = new Set(["portrait", "imageAssets", "voiceNotes"]);

export function collectMediaSourcesFromValue(value) {
  const sources = new Set();
  visitMediaValue(value, "", (source) => sources.add(source));
  return [...sources];
}

export function collectMediaSourceRecordsFromValue(value) {
  const records = new Map();
  visitMediaRecords(value, "", "", (source, key, ownerId) => {
    if (!records.has(source)) {
      records.set(source, { source, key, ownerId });
    }
  });
  return [...records.values()];
}

export function replaceMediaSourcesInValue(value, replacements) {
  return mapMediaValue(value, "", (source) => replacements.has(source) ? replacements.get(source) : source);
}
const ASSET_TOKEN_PREFIX = "asset://";
const DRIVE_ASSET_TOKEN_PREFIX = "drive-asset://";
const DATA_URL_PATTERN = /^data:/i;
const RICH_MEDIA_TOKEN_PATTERN = /\{\{media:(image|audio|video|file)\|([^|{}]+)\|([^{}]+)\}\}/g;

export { ASSET_TOKEN_PREFIX, DRIVE_ASSET_TOKEN_PREFIX };

export function createAssetToken(id) {
  return `${ASSET_TOKEN_PREFIX}${String(id || "").trim()}`;
}

export function createDriveAssetToken(id) {
  return `${DRIVE_ASSET_TOKEN_PREFIX}${String(id || "").trim()}`;
}

export function isAssetToken(value) {
  return isLocalAssetToken(value) || isDriveAssetToken(value);
}

export function isLocalAssetToken(value) {
  return typeof value === "string" && value.startsWith(ASSET_TOKEN_PREFIX);
}

export function isDriveAssetToken(value) {
  return typeof value === "string" && value.startsWith(DRIVE_ASSET_TOKEN_PREFIX);
}

export function getAssetIdFromToken(token) {
  if (isLocalAssetToken(token)) return token.slice(ASSET_TOKEN_PREFIX.length);
  if (isDriveAssetToken(token)) return token.slice(DRIVE_ASSET_TOKEN_PREFIX.length);
  return "";
}

export function getDriveAssetIdFromToken(token) {
  return isDriveAssetToken(token) ? token.slice(DRIVE_ASSET_TOKEN_PREFIX.length) : "";
}

export function isDataUrl(value) {
  return typeof value === "string" && DATA_URL_PATTERN.test(value.trim());
}

export function collectAssetTokensFromValue(value) {
  const tokens = new Set();
  visitAssetValue(value, (source) => {
    if (isLocalAssetToken(source)) {
      tokens.add(source);
    }
  });
  return [...tokens];
}

export function replaceAssetTokensInValue(value, replacements) {
  const replaceSource = (source) => replacements.has(source) ? replacements.get(source) : source;
  return mapAssetValue(value, replaceSource);
}

export function collectDriveAssetTokensFromValue(value) {
  const tokens = new Set();
  visitDriveAssetValue(value, (source) => tokens.add(source));
  return [...tokens];
}

export function replaceDriveAssetTokensInValue(value, replacements) {
  const replaceSource = (source) => replacements.has(source) ? replacements.get(source) : source;
  return mapDriveAssetValue(value, replaceSource);
}

export function inferAssetKindFromMimeType(mimeType) {
  const normalized = String(mimeType || "").toLowerCase();
  if (normalized.startsWith("image/")) {
    return "image";
  }
  if (normalized.startsWith("audio/")) {
    return "audio";
  }
  if (normalized.startsWith("video/")) {
    return "video";
  }
  return "file";
}

export function collectAssetTokensFromState(state) {
  const tokens = new Set();
  collectAssetSourcesFromState(state, (source) => {
    if (isLocalAssetToken(source)) {
      tokens.add(source);
    }
  });
  return [...tokens];
}

function visitAssetValue(value, onSource) {
  if (typeof value === "string") {
    if (isAssetToken(value)) {
      onSource(value);
    }
    for (const match of value.matchAll(RICH_MEDIA_TOKEN_PATTERN)) {
      onSource(match[3]);
    }
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => visitAssetValue(item, onSource));
    return;
  }

  if (value && typeof value === "object") {
    Object.values(value).forEach((item) => visitAssetValue(item, onSource));
  }
}

function visitMediaValue(value, key, onSource) {
  if (typeof value === "string") {
    if (DIRECT_MEDIA_KEYS.has(key) && value.trim()) onSource(value.trim());
    for (const match of value.matchAll(RICH_MEDIA_TOKEN_PATTERN)) {
      if (match[3].trim()) onSource(match[3].trim());
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => visitMediaValue(item, key, onSource));
    return;
  }
  if (value && typeof value === "object") {
    Object.entries(value).forEach(([childKey, item]) => visitMediaValue(item, childKey, onSource));
  }
}

function visitMediaRecords(value, key, ownerId, onSource) {
  if (typeof value === "string") {
    if (DIRECT_MEDIA_KEYS.has(key) && value.trim()) {
      onSource(value.trim(), key, ownerId);
    }
    for (const match of value.matchAll(RICH_MEDIA_TOKEN_PATTERN)) {
      if (match[3].trim()) onSource(match[3].trim(), "rich", ownerId);
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => visitMediaRecords(item, key, ownerId, onSource));
    return;
  }
  if (value && typeof value === "object") {
    const nextOwnerId = typeof value.id === "string" ? value.id : ownerId;
    Object.entries(value).forEach(([childKey, item]) => visitMediaRecords(item, childKey, nextOwnerId, onSource));
  }
}

function mapMediaValue(value, key, replaceSource) {
  if (typeof value === "string") {
    const direct = DIRECT_MEDIA_KEYS.has(key) ? replaceSource(value.trim()) : value;
    return direct.replaceAll(
      RICH_MEDIA_TOKEN_PATTERN,
      (_full, kind, label, source) => `{{media:${kind}|${label}|${replaceSource(source.trim())}}}`,
    );
  }
  if (Array.isArray(value)) return value.map((item) => mapMediaValue(item, key, replaceSource));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([childKey, item]) => [childKey, mapMediaValue(item, childKey, replaceSource)]),
    );
  }
  return value;
}

function visitDriveAssetValue(value, onSource) {
  if (typeof value === "string") {
    if (isDriveAssetToken(value)) onSource(value);
    for (const match of value.matchAll(RICH_MEDIA_TOKEN_PATTERN)) {
      if (isDriveAssetToken(match[3])) onSource(match[3]);
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => visitDriveAssetValue(item, onSource));
    return;
  }
  if (value && typeof value === "object") {
    Object.values(value).forEach((item) => visitDriveAssetValue(item, onSource));
  }
}

function mapDriveAssetValue(value, replaceSource) {
  if (typeof value === "string") {
    if (isDriveAssetToken(value)) return replaceSource(value);
    return value.replaceAll(
      RICH_MEDIA_TOKEN_PATTERN,
      (_full, kind, label, source) => `{{media:${kind}|${label}|${isDriveAssetToken(source) ? replaceSource(source) : source}}}`,
    );
  }
  if (Array.isArray(value)) return value.map((item) => mapDriveAssetValue(item, replaceSource));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, mapDriveAssetValue(item, replaceSource)]),
    );
  }
  return value;
}

function mapAssetValue(value, replaceSource) {
  if (typeof value === "string") {
    if (isAssetToken(value)) {
      return replaceSource(value);
    }
    return value.replaceAll(
      RICH_MEDIA_TOKEN_PATTERN,
      (_full, kind, label, source) => `{{media:${kind}|${label}|${replaceSource(source)}}}`,
    );
  }

  if (Array.isArray(value)) {
    return value.map((item) => mapAssetValue(item, replaceSource));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, mapAssetValue(item, replaceSource)]),
    );
  }

  return value;
}

export function collectEmbeddedDataUrlsFromState(state) {
  const values = new Set();
  collectAssetSourcesFromState(state, (source) => {
    if (isDataUrl(source)) {
      values.add(source.trim());
    }
  });
  return [...values];
}

export function replaceAssetSourcesInState(state, replacer) {
  let changed = false;
  const nextState = structuredClone(state);

  nextState.characters = (nextState.characters || []).map((character) => {
    const nextCharacter = { ...character };
    nextCharacter.portrait = replaceDirectSource(nextCharacter.portrait, replacer, markChanged);
    nextCharacter.summary = replaceSourcesInRichText(nextCharacter.summary, replacer, markChanged);
    nextCharacter.quickNotes = replaceSourcesInRichText(nextCharacter.quickNotes, replacer, markChanged);
    nextCharacter.history = replaceSourcesInRichText(nextCharacter.history, replacer, markChanged);

    if (nextCharacter.lore) {
      nextCharacter.lore = {
        ...nextCharacter.lore,
        origin: replaceSourcesInRichText(nextCharacter.lore.origin, replacer, markChanged),
        bonds: replaceSourcesInRichText(nextCharacter.lore.bonds, replacer, markChanged),
        secrets: replaceSourcesInRichText(nextCharacter.lore.secrets, replacer, markChanged),
        goals: replaceSourcesInRichText(nextCharacter.lore.goals, replacer, markChanged),
        wounds: replaceSourcesInRichText(nextCharacter.lore.wounds, replacer, markChanged),
      };
    }

    if (nextCharacter.sheet) {
      nextCharacter.sheet = {
        ...nextCharacter.sheet,
        abilities: replaceSourcesInRichText(nextCharacter.sheet.abilities, replacer, markChanged),
        features: replaceSourcesInRichText(nextCharacter.sheet.features, replacer, markChanged),
      };
    }

    if (nextCharacter.inventory) {
      nextCharacter.inventory = {
        ...nextCharacter.inventory,
        items: replaceSourcesInRichText(nextCharacter.inventory.items, replacer, markChanged),
        currency: replaceSourcesInRichText(nextCharacter.inventory.currency, replacer, markChanged),
        artifacts: replaceSourcesInRichText(nextCharacter.inventory.artifacts, replacer, markChanged),
        notes: replaceSourcesInRichText(nextCharacter.inventory.notes, replacer, markChanged),
      };
    }

    return nextCharacter;
  });

  nextState.chronicles = (nextState.chronicles || []).map((chronicle) => ({
    ...chronicle,
    imageAssets: replaceDirectSourceList(chronicle.imageAssets, replacer, markChanged),
    voiceNotes: replaceDirectSourceList(chronicle.voiceNotes, replacer, markChanged),
    summary: replaceSourcesInRichText(chronicle.summary, replacer, markChanged),
    content: replaceSourcesInRichText(chronicle.content, replacer, markChanged),
    highlights: replaceSourcesInRichText(chronicle.highlights, replacer, markChanged),
  }));

  nextState.glossary = (nextState.glossary || []).map((entry) => ({
    ...entry,
    description: replaceSourcesInRichText(entry.description, replacer, markChanged),
    notes: replaceSourcesInRichText(entry.notes, replacer, markChanged),
    latestStatus: replaceSourcesInRichText(entry.latestStatus, replacer, markChanged),
    imageAssets: replaceDirectSourceList(entry.imageAssets, replacer, markChanged),
  }));

  return {
    changed,
    state: nextState,
  };

  function markChanged() {
    changed = true;
  }
}

function collectAssetSourcesFromState(state, onSource) {
  (state?.characters || []).forEach((character) => {
    collectDirectSource(character?.portrait, onSource);
    collectRichTextSources(character?.summary, onSource);
    collectRichTextSources(character?.quickNotes, onSource);
    collectRichTextSources(character?.history, onSource);

    const lore = character?.lore || {};
    collectRichTextSources(lore.origin, onSource);
    collectRichTextSources(lore.bonds, onSource);
    collectRichTextSources(lore.secrets, onSource);
    collectRichTextSources(lore.goals, onSource);
    collectRichTextSources(lore.wounds, onSource);

    const sheet = character?.sheet || {};
    collectRichTextSources(sheet.abilities, onSource);
    collectRichTextSources(sheet.features, onSource);

    const inventory = character?.inventory || {};
    collectRichTextSources(inventory.items, onSource);
    collectRichTextSources(inventory.currency, onSource);
    collectRichTextSources(inventory.artifacts, onSource);
    collectRichTextSources(inventory.notes, onSource);
  });

  (state?.chronicles || []).forEach((chronicle) => {
    collectDirectSourceList(chronicle?.imageAssets, onSource);
    collectDirectSourceList(chronicle?.voiceNotes, onSource);
    collectRichTextSources(chronicle?.summary, onSource);
    collectRichTextSources(chronicle?.content, onSource);
    collectRichTextSources(chronicle?.highlights, onSource);
  });

  (state?.glossary || []).forEach((entry) => {
    collectRichTextSources(entry?.description, onSource);
    collectRichTextSources(entry?.notes, onSource);
    collectRichTextSources(entry?.latestStatus, onSource);
    collectDirectSourceList(entry?.imageAssets, onSource);
  });
}

function collectDirectSource(source, onSource) {
  if (typeof source === "string" && source.trim()) {
    onSource(source.trim());
  }
}

function collectDirectSourceList(sources, onSource) {
  if (!Array.isArray(sources)) {
    return;
  }

  sources.forEach((source) => collectDirectSource(source, onSource));
}

function collectRichTextSources(value, onSource) {
  const text = String(value || "");
  let match = RICH_MEDIA_TOKEN_PATTERN.exec(text);
  while (match) {
    collectDirectSource(match[3], onSource);
    match = RICH_MEDIA_TOKEN_PATTERN.exec(text);
  }
  RICH_MEDIA_TOKEN_PATTERN.lastIndex = 0;
}

function replaceDirectSource(source, replacer, onChange) {
  if (typeof source !== "string" || !source.trim()) {
    return source;
  }

  const nextSource = replacer(source.trim());
  if (nextSource !== source.trim()) {
    onChange();
  }
  return nextSource;
}

function replaceDirectSourceList(sources, replacer, onChange) {
  if (!Array.isArray(sources)) {
    return sources;
  }

  return sources.map((source) => replaceDirectSource(source, replacer, onChange));
}

function replaceSourcesInRichText(value, replacer, onChange) {
  const text = String(value || "");
  let touched = false;
  const next = text.replace(
    RICH_MEDIA_TOKEN_PATTERN,
    (full, kind, label, source) => {
      const nextSource = replacer(source.trim());
      if (nextSource !== source.trim()) {
        touched = true;
      }
      return `{{media:${kind}|${label}|${nextSource}}}`;
    },
  );

  if (touched) {
    onChange();
  }

  return next;
}
