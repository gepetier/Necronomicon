import test from "node:test";
import assert from "node:assert/strict";

import { DATA_VERSION, seedData } from "../data.js";
import { createBackupPayload, readBackupAssetBundle, readBackupStatePayload } from "../app/backup.js";
import {
  clearStoredCredential,
  createCharacterPayloadWithoutPortrait,
  createGlossaryEntryPayloadWithoutImages,
  getStoredCredential,
  storeCredential,
} from "../app/cloud-sync.js";
import {
  collectAssetTokensFromState,
  collectAssetTokensFromValue,
  collectEmbeddedDataUrlsFromState,
  collectDriveAssetTokensFromValue,
  collectMediaSourceRecordsFromValue,
  createAssetToken,
  createDriveAssetToken,
  replaceAssetSourcesInState,
  replaceAssetTokensInValue,
  replaceDriveAssetTokensInValue,
} from "../app/assets.js";
import {
  activateCampaign,
  createCampaign,
  deleteCampaign,
  getCampaignCatalog,
  getLastPersistenceError,
  loadState,
  migrateStoredState,
  persistState,
  updateCampaign,
} from "../app/storage.js";
import { plainTextFromRichText, renderRichText } from "../app/utils.js";
import { createCloudSaveQueue } from "../app/cloud-save-queue.js";
import { sanitizeMediaSource } from "../app/media-source.js";

test("backup payload wraps state and asset bundle", () => {
  const payload = createBackupPayload(seedData, [{ id: "asset-1", dataUrl: "data:image/png;base64,AAA" }], "2026-04-28T12:00:00.000Z");

  assert.equal(payload.kind, "necronomicon-backup");
  assert.equal(payload.version, DATA_VERSION);
  assert.equal(payload.exportedAt, "2026-04-28T12:00:00.000Z");
  assert.equal(readBackupAssetBundle(payload).length, 1);
  assert.deepEqual(readBackupStatePayload(payload), {
    version: DATA_VERSION,
    state: payload.state,
  });
});

test("cloud save queue retains distinct rapid saves and coalesces repeated items", () => {
  const queue = createCloudSaveQueue();
  queue.enqueue({ type: "character", characterId: "ilu", version: 1 });
  queue.enqueue({ type: "glossary", entryId: "nishaar" });
  queue.enqueue({ type: "character", characterId: "ilu", version: 2 });
  assert.deepEqual(queue.snapshot(), [
    { type: "character", characterId: "ilu", version: 2 },
    { type: "glossary", entryId: "nishaar" },
  ]);
});

test("full campaign save supersedes queued item saves", () => {
  const queue = createCloudSaveQueue();
  queue.enqueue({ type: "character", characterId: "ilu" });
  queue.enqueue({ type: "campaign" });
  queue.enqueue({ type: "glossary", entryId: "nishaar" });
  assert.deepEqual(queue.snapshot(), [{ type: "campaign" }]);
});

test("media sources reject executable and unsafe data URLs", () => {
  assert.equal(sanitizeMediaSource("javascript:alert(1)", "file"), "");
  assert.equal(sanitizeMediaSource("data:text/html,<script>alert(1)</script>", "file"), "");
  assert.equal(sanitizeMediaSource("file:///C:/secret.txt", "file"), "");
  assert.equal(sanitizeMediaSource("https://example.com/map.webp", "image"), "https://example.com/map.webp");
  assert.equal(sanitizeMediaSource("resources/imatges/ilu.jpg", "image"), "resources/imatges/ilu.jpg");
  assert.match(sanitizeMediaSource("data:image/png;base64,AAAA", "image"), /^data:image\/png/);
});

test("rich text marks unsafe media links without rendering a dangerous href", () => {
  const html = renderRichText("{{media:file|Obre|javascript:alert(1)}}");
  assert.doesNotMatch(html, /href=/);
  assert.doesNotMatch(html, /javascript:/);
  assert.match(html, /data-invalid-media-source/);
});

test("asset helpers collect and replace embedded asset sources", () => {
  const mediaRecords = collectMediaSourceRecordsFromValue({ characters: [{ id: "ilu", portrait: "http://localhost:5173/resources/imatges/ilu.jpg" }] });
  assert.deepEqual(mediaRecords[0], { source: "http://localhost:5173/resources/imatges/ilu.jpg", key: "portrait", ownerId: "ilu" });

  const sample = structuredClone(seedData);
  sample.glossary[0].imageAssets = ["data:image/png;base64,AAAA"];
  sample.chronicles[0].content = "{{media:image|Mapa|data:image/png;base64,BBBB}}";
  sample.chronicles[0].highlights = "{{media:file|Document|asset://doc-1}}";

  assert.deepEqual(
    collectEmbeddedDataUrlsFromState(sample).sort(),
    ["data:image/png;base64,AAAA", "data:image/png;base64,BBBB"],
  );
  assert.deepEqual(collectAssetTokensFromState(sample), [createAssetToken("doc-1")]);

  const replaced = replaceAssetSourcesInState(sample, (source) => {
    if (source === "data:image/png;base64,AAAA") {
      return createAssetToken("img-1");
    }
    if (source === "data:image/png;base64,BBBB") {
      return createAssetToken("img-2");
    }
    return source;
  });

  assert.equal(replaced.changed, true);
  assert.deepEqual(replaced.state.glossary[0].imageAssets, [createAssetToken("img-1")]);
  assert.match(replaced.state.chronicles[0].content, /\{\{media:image\|Mapa\|asset:\/\/img-2\}\}/);
});

test("Drive asset helpers preserve remote identifiers separately from local tokens", () => {
  const token = createDriveAssetToken("drive-file-1");
  const value = { imageAssets: [token], notes: `{{media:file|Mapa|${token}}}` };
  assert.deepEqual(collectDriveAssetTokensFromValue(value), [token]);
  assert.deepEqual(
    replaceDriveAssetTokensInValue(value, new Map([[token, createAssetToken("drive-drive-file-1")]])),
    { imageAssets: ["asset://drive-drive-file-1"], notes: "{{media:file|Mapa|asset://drive-drive-file-1}}" },
  );
  assert.deepEqual(
    replaceDriveAssetTokensInValue(value, new Map([[token, ""]])),
    { imageAssets: [""], notes: "{{media:file|Mapa|}}" },
  );
});

test("cloud glossary compact payload preserves existing remote images", () => {
  const payload = createGlossaryEntryPayloadWithoutImages({
    action: "saveGlossaryEntry",
    idToken: "token",
    campaignId: "meledar",
    entry: {
      id: "arrossegats",
      name: "Arrosegats",
      description: "Descripcio actualitzada",
      imageAssets: ["data:image/webp;base64,AAAA"],
    },
  });

  assert.equal(payload.preserveExistingImageAssets, true);
  assert.equal(Object.hasOwn(payload.entry, "imageAssets"), false);
  assert.equal(payload.entry.name, "Arrosegats");
});

test("cloud character compact payload preserves existing remote portrait", () => {
  const payload = createCharacterPayloadWithoutPortrait({
    action: "saveCharacter",
    idToken: "token",
    campaignId: "meledar",
    character: {
      id: "ilu",
      name: "Ilu",
      level: 4,
      portrait: "data:image/webp;base64,AAAA",
    },
  });

  assert.equal(payload.preserveExistingPortrait, true);
  assert.equal(Object.hasOwn(payload.character, "portrait"), false);
  assert.equal(payload.character.level, 4);
});

test("cloud asset helpers materialize direct and rich-text asset tokens", () => {
  const imageToken = createAssetToken("glossary-image");
  const documentToken = createAssetToken("chronicle-document");
  const value = {
    imageAssets: [imageToken],
    notes: `{{media:file|Carta|${documentToken}}}`,
  };
  const replacements = new Map([
    [imageToken, "data:image/webp;base64,AAAA"],
    [documentToken, "data:application/pdf;base64,BBBB"],
  ]);

  assert.deepEqual(collectAssetTokensFromValue(value), [imageToken, documentToken]);
  assert.deepEqual(replaceAssetTokensInValue(value, replacements), {
    imageAssets: ["data:image/webp;base64,AAAA"],
    notes: "{{media:file|Carta|data:application/pdf;base64,BBBB}}",
  });
});

test("Google credential is session-scoped and legacy local storage is cleared", () => {
  const sessionValues = new Map();
  const localValues = new Map([["necronomicon-google-credential", "legacy-token"]]);
  const createStorage = (values) => ({
    getItem: (key) => values.get(key) || null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  });
  const previousWindow = globalThis.window;
  globalThis.window = {
    sessionStorage: createStorage(sessionValues),
    localStorage: createStorage(localValues),
  };

  try {
    storeCredential("session-token");
    assert.equal(getStoredCredential(), "session-token");
    assert.equal(localValues.has("necronomicon-google-credential"), false);
    clearStoredCredential();
    assert.equal(getStoredCredential(), "");
  } finally {
    globalThis.window = previousWindow;
  }
});

test("storage migration backfills glossary latest-session metadata", () => {
  const legacy = structuredClone(seedData);
  legacy.glossary = legacy.glossary.map((entry) => (
    entry.id === "uric"
      ? {
        ...entry,
        latestStatus: "",
        lastSeenChronicleId: "",
        chronicleIds: ["judici-acantilado"],
      }
      : entry
  ));

  const migrated = migrateStoredState({
    version: 7,
    state: legacy,
  });

  const uric = migrated.glossary.find((entry) => entry.id === "uric");
  assert.equal(uric.lastSeenChronicleId, "ritual-fossa");
  assert.equal(uric.chronicleIds.includes("ritual-fossa"), true);
  assert.match(uric.latestStatus, /Probablement mort/i);
});

test("rich text rendering preserves references and asset-backed media links", () => {
  const html = renderRichText("## Sessio\n- [[ilu|Ilu]]\n{{media:file|Mapa|asset://doc-1}}");

  assert.match(html, /<h4>Sessio<\/h4>/);
  assert.match(html, /data-reference-jump="ilu"/);
  assert.match(html, /data-asset-href="asset:\/\/doc-1"/);

  const plain = plainTextFromRichText("**Text** [[ilu|Ilu]] {{media:file|Mapa|asset://doc-1}}");
  assert.equal(plain, "Text Ilu Mapa");
});

test("storage wraps legacy state in a campaign catalog and creates a Savage Worlds campaign", () => {
  const previousWindow = globalThis.window;
  const storage = new Map();
  globalThis.window = {
    localStorage: {
      getItem: (key) => storage.get(key) || null,
      setItem: (key, value) => storage.set(key, String(value)),
      removeItem: (key) => storage.delete(key),
    },
  };

  try {
    persistState(structuredClone(seedData));
    const loaded = loadState();
    assert.equal(loaded.characters[0].id, seedData.characters[0].id);
    assert.equal(getCampaignCatalog().campaigns.length, 1);

    const savage = createCampaign(
      { name: "Deadlands: Santa Sang", system: "Savage Worlds" },
      loaded,
    );
    const catalog = getCampaignCatalog();

    assert.equal(catalog.campaigns.length, 2);
    assert.equal(catalog.campaigns.find((campaign) => campaign.isActive).system, "Savage Worlds");
    assert.equal(savage.meta.name, "Deadlands: Santa Sang");
    assert.equal(savage.chronicles[0].title, "Inici de Deadlands: Santa Sang");

    const renamed = updateCampaign(
      savage.meta.id,
      { name: "Deadlands: Sang Nova", system: "Savage Worlds Deluxe" },
      savage,
    );
    assert.equal(renamed.meta.name, "Deadlands: Sang Nova");
    assert.equal(renamed.meta.system, "Savage Worlds Deluxe");

    const meledarId = getCampaignCatalog().campaigns.find((campaign) => !campaign.isActive).id;
    const meledar = activateCampaign(meledarId, renamed);
    const afterDelete = deleteCampaign(renamed.meta.id, meledar);
    const finalCatalog = getCampaignCatalog();
    assert.equal(finalCatalog.campaigns.length, 1);
    assert.equal(finalCatalog.campaigns[0].id, meledarId);
    assert.equal(afterDelete.meta.id, meledarId);
  } finally {
    globalThis.window = previousWindow;
  }
});

test("storage persistence reports quota failures without throwing", () => {
  const previousWindow = globalThis.window;
  globalThis.window = {
    localStorage: {
      getItem: () => null,
      setItem: () => { throw new DOMException("Quota plena", "QuotaExceededError"); },
      removeItem: () => {},
    },
  };

  try {
    const result = persistState(structuredClone(seedData));
    assert.equal(result.ok, false);
    assert.equal(result.error?.name, "QuotaExceededError");
    assert.equal(getLastPersistenceError()?.name, "QuotaExceededError");
  } finally {
    globalThis.window = previousWindow;
  }
});

test("campaign activation continues when the local cache quota is full", () => {
  const previousWindow = globalThis.window;
  const meledar = structuredClone(seedData);
  const apolion = structuredClone(seedData);
  apolion.meta = {
    ...apolion.meta,
    id: "apolion",
    name: "Apolion",
    system: "Savage Worlds",
  };
  const storedCatalog = JSON.stringify({
    kind: "necronomicon-campaign-library",
    version: DATA_VERSION,
    activeCampaignId: "meledar",
    campaigns: [
      { id: "meledar", name: "Meledar", system: "D&D 5e", state: meledar },
      { id: "apolion", name: "Apolion", system: "Savage Worlds", state: apolion },
    ],
  });
  globalThis.window = {
    localStorage: {
      getItem: () => storedCatalog,
      setItem: () => { throw new DOMException("Quota plena", "QuotaExceededError"); },
      removeItem: () => {},
    },
  };

  try {
    const current = loadState();
    const activated = activateCampaign("apolion", current);
    assert.equal(activated.meta.id, "apolion");
    assert.equal(getCampaignCatalog().activeCampaignId, "apolion");
    assert.equal(getLastPersistenceError()?.name, "QuotaExceededError");
  } finally {
    globalThis.window = previousWindow;
  }
});

test("storage migration classifies supporting glossary characters separately", () => {
  const legacy = structuredClone(seedData);
  legacy.glossary = legacy.glossary.map((entry) => (
    ["varron-thayne", "hermana-seraphe", "reina-elisabeth", "mijo", "uric", "elyse"].includes(entry.id)
      ? { ...entry, category: "Altres" }
      : entry
  ));

  const migrated = migrateStoredState({ version: 9, state: legacy });
  const byId = new Map(migrated.glossary.map((entry) => [entry.id, entry]));

  assert.equal(byId.get("uric")?.category, "Personatges");
  assert.equal(byId.get("reina-elisabeth")?.category, "Personatges");
  assert.equal(byId.get("dren")?.category, "Altres");
  assert.equal(byId.get("zaher-ar-kal")?.category, "Antagonistes");

  const versionTen = structuredClone(seedData);
  versionTen.glossary = versionTen.glossary.map((entry) => (
    entry.id === "uric" ? { ...entry, category: "Personatges secundaris" } : entry
  ));
  const renamed = migrateStoredState({ version: 10, state: versionTen });
  assert.equal(renamed.glossary.find((entry) => entry.id === "uric")?.category, "Personatges");
});

test("storage repairs stale packaged Meledar character portraits", () => {
  const migrated = migrateStoredState({
    version: DATA_VERSION,
    state: {
      ...structuredClone(seedData),
      characters: seedData.characters.map((character) => ({
        ...structuredClone(character),
        portrait: `/assets/${character.id}-oldhash.jpg`,
      })),
    },
  });

  const ilu = migrated.characters.find((character) => character.id === "ilu");
  assert.equal(ilu.portrait, seedData.characters.find((character) => character.id === "ilu").portrait);
});

test("storage version 12 removes legacy chronicle and glossary images once", () => {
  const legacyState = structuredClone(seedData);
  legacyState.glossary[0] = {
    ...legacyState.glossary[0],
    description: "{{media:image|Mapa antic|drive-asset://legacy-map}}",
    imageAssets: ["drive-asset://legacy-cover"],
  };
  legacyState.chronicles[0] = {
    ...legacyState.chronicles[0],
    imageAssets: ["asset://legacy-local"],
  };
  const migrated = migrateStoredState({ version: 11, state: legacyState });
  assert.deepEqual(migrated.glossary[0].imageAssets, []);
  assert.equal(migrated.glossary[0].description, "Mapa antic");
  assert.deepEqual(migrated.chronicles[0].imageAssets, []);
});


test("storage version 13 gives every character an active campaign roster", () => {
  const legacy = structuredClone(seedData);
  delete legacy.characters[0].roster;
  const migrated = migrateStoredState({ version: 12, state: legacy });
  assert.deepEqual(migrated.characters[0].roster, {
    status: "active",
    changedAt: "",
    changedBy: "",
  });
  assert.equal(migrated.ui.characterRosterFilter, "active");
});


test("storage version 14 enables character roster management for the legacy GM roles", () => {
  const legacy = structuredClone(seedData);
  legacy.access = { roles: { gm: { editAnyCharacter: true } }, users: {} };
  const migrated = migrateStoredState({ version: 13, state: legacy });
  assert.equal(migrated.access.roles.gm.manageCharacters, true);
  assert.equal(migrated.access.roles.gm.deleteCharacters, true);
  assert.equal(migrated.access.roles.player.manageCharacters, false);
});

test("storage seeds Ruth Baskin only for a Baskins Savage Worlds campaign", () => {
  const baskins = migrateStoredState({
    version: DATA_VERSION,
    state: {
      ...structuredClone(seedData),
      meta: {
        id: "baskins",
        name: "Baskins",
        system: "Savage Worlds",
      },
    },
  });
  const ruth = baskins.characters.find((character) => character.id === "ruth-baskin");
  assert.ok(ruth);
  assert.equal(ruth.portrait, "");
  assert.equal(ruth.sheet.savageState.bennies, 3);
  assert.equal(ruth.sheet.hp, "Duresa 5");
  assert.match(ruth.inventory.items, /Rifle curt \| Disparar d8/);
  assert.match(ruth.inventory.items, /Abric reforcat \| Armadura \+2 \| equipada/);

  const otherSavage = migrateStoredState({
    version: DATA_VERSION,
    state: {
      ...structuredClone(seedData),
      meta: {
        id: "deadlands",
        name: "Deadlands",
        system: "Savage Worlds",
      },
    },
  });
  assert.equal(otherSavage.characters.some((character) => character.id === "ruth-baskin"), false);
});
