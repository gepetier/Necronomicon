import test from "node:test";
import assert from "node:assert/strict";

import { DATA_VERSION, seedData } from "../data.js";
import { createBackupPayload, readBackupAssetBundle, readBackupStatePayload } from "../app/backup.js";
import {
  collectAssetTokensFromState,
  collectEmbeddedDataUrlsFromState,
  createAssetToken,
  replaceAssetSourcesInState,
} from "../app/assets.js";
import { migrateStoredState } from "../app/storage.js";
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
