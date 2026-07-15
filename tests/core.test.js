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
  createAssetToken,
  replaceAssetSourcesInState,
  replaceAssetTokensInValue,
} from "../app/assets.js";
import {
  activateCampaign,
  createCampaign,
  deleteCampaign,
  getCampaignCatalog,
  loadState,
  migrateStoredState,
  persistState,
  updateCampaign,
} from "../app/storage.js";
import { plainTextFromRichText, renderRichText } from "../app/utils.js";

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

test("asset helpers collect and replace embedded asset sources", () => {
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

test("storage repairs stale packaged glossary illustration URLs", () => {
  const migrated = migrateStoredState({
    version: DATA_VERSION,
    state: {
      ...structuredClone(seedData),
      glossary: seedData.glossary.map((entry) => (
        entry.id === "nishaar"
          ? {
            ...structuredClone(entry),
            imageAssets: [
              "/assets/nishaar-oldhash.png",
              "https://example.com/custom-reference.png",
            ],
          }
          : structuredClone(entry)
      )),
    },
  });

  const nishaar = migrated.glossary.find((entry) => entry.id === "nishaar");
  assert.equal(nishaar.imageAssets[0], seedData.glossary.find((entry) => entry.id === "nishaar").imageAssets[0]);
  assert.equal(nishaar.imageAssets[1], "https://example.com/custom-reference.png");
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
