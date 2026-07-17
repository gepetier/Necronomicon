import {
  createAssetToken,
  collectAssetTokensFromValue,
  collectDriveAssetTokensFromValue,
  createDriveAssetToken,
  getAssetIdFromToken,
  inferAssetKindFromMimeType,
  isAssetToken,
  replaceAssetTokensInValue,
  replaceDriveAssetTokensInValue,
} from "./assets.js";

const DB_NAME = "campaign-compendium-assets";
const DB_VERSION = 1;
const STORE_NAME = "assets";

const objectUrlCache = new Map();

export async function storeAssetFile(file) {
  const id = createAssetId();
  const blob = file instanceof Blob ? file : new Blob([file]);
  const mimeType = blob.type || "application/octet-stream";
  const record = {
    id,
    blob,
    name: typeof file?.name === "string" ? file.name : `asset-${id}`,
    mimeType,
    kind: inferAssetKindFromMimeType(mimeType),
    savedAt: new Date().toISOString(),
  };

  await writeRecord(record);
  return createAssetToken(id);
}

export async function storeAssetDataUrl(dataUrl, options = {}) {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  const id = createAssetId();
  const mimeType = blob.type || options.mimeType || "application/octet-stream";
  const record = {
    id,
    blob,
    name: options.name || `asset-${id}`,
    mimeType,
    kind: options.kind || inferAssetKindFromMimeType(mimeType),
    savedAt: new Date().toISOString(),
  };

  await writeRecord(record);
  return createAssetToken(id);
}

export async function getAssetObjectUrl(token) {
  if (!isAssetToken(token)) {
    return token;
  }

  if (objectUrlCache.has(token)) {
    return objectUrlCache.get(token);
  }

  const record = await readRecord(getAssetIdFromToken(token));
  if (!record?.blob) {
    return "";
  }

  const objectUrl = URL.createObjectURL(record.blob);
  objectUrlCache.set(token, objectUrl);
  return objectUrl;
}

export async function hydrateAssetReferences(root = document) {
  if (!(root instanceof Element) && root !== document) {
    return;
  }

  const scope = root === document ? document : root;
  const candidates = scope.querySelectorAll("[data-asset-src], [data-asset-href]");

  await Promise.all(
    Array.from(candidates).map(async (element) => {
      if (!(element instanceof HTMLElement)) {
        return;
      }

      const srcToken = element.dataset.assetSrc || "";
      const hrefToken = element.dataset.assetHref || "";

      if (srcToken) {
        const source = await getAssetObjectUrl(srcToken);
        if (source) {
          element.setAttribute("src", source);
        }
      }

      if (hrefToken) {
        const href = await getAssetObjectUrl(hrefToken);
        if (href) {
          element.setAttribute("href", href);
        }
      }
    }),
  );
}

export async function exportAssetBundle(tokens) {
  const bundle = [];
  const seenIds = new Set();

  for (const token of tokens) {
    const id = getAssetIdFromToken(token);
    if (!id || seenIds.has(id)) {
      continue;
    }

    const record = await readRecord(id);
    if (!record?.blob) {
      continue;
    }

    bundle.push({
      id,
      name: record.name || `asset-${id}`,
      mimeType: record.mimeType || record.blob.type || "application/octet-stream",
      kind: record.kind || inferAssetKindFromMimeType(record.mimeType || record.blob.type),
      dataUrl: await readBlobAsDataUrl(record.blob),
    });
    seenIds.add(id);
  }

  return bundle;
}

export async function materializeAssetTokens(value) {
  const tokens = collectAssetTokensFromValue(value);
  if (!tokens.length) {
    return value;
  }

  const bundle = await exportAssetBundle(tokens);
  const foundIds = new Set(bundle.map((entry) => String(entry?.id || "")));
  const missingTokens = tokens.filter((token) => !foundIds.has(getAssetIdFromToken(token)));
  if (missingTokens.length) {
    throw new Error("Falta el fitxer local d'una imatge. Torna-la a seleccionar abans de sincronitzar.");
  }
  const replacements = new Map(
    bundle
      .filter((entry) => entry?.id && entry?.dataUrl)
      .map((entry) => [createAssetToken(entry.id), entry.dataUrl]),
  );

  return replacements.size ? replaceAssetTokensInValue(value, replacements) : value;
}

export async function localizeDriveAssetBundle(value, bundle) {
  const driveTokens = collectDriveAssetTokensFromValue(value);
  if (!driveTokens.length) return value;

  const expectedTokens = new Set(driveTokens);
  const replacements = new Map();
  for (const entry of Array.isArray(bundle) ? bundle : []) {
    const remoteId = String(entry?.id || "").trim();
    const remoteToken = String(entry?.token || createDriveAssetToken(remoteId));
    if (!remoteId || !entry?.dataUrl || !expectedTokens.has(remoteToken)) continue;
    const localId = `drive-${remoteId}`;
    const response = await fetch(entry.dataUrl);
    const blob = await response.blob();
    await writeRecord({
      id: localId,
      blob,
      name: String(entry.name || `asset-${remoteId}`),
      mimeType: String(entry.mimeType || blob.type || "application/octet-stream"),
      kind: String(entry.kind || inferAssetKindFromMimeType(entry.mimeType || blob.type)),
      savedAt: new Date().toISOString(),
      remoteToken,
    });
    replacements.set(remoteToken, createAssetToken(localId));
  }

  return replaceDriveAssetTokensInValue(value, replacements);
}

export async function importAssetBundle(bundle) {
  for (const entry of Array.isArray(bundle) ? bundle : []) {
    if (!entry?.id || !entry?.dataUrl) {
      continue;
    }

    const response = await fetch(entry.dataUrl);
    const blob = await response.blob();
    await writeRecord({
      id: String(entry.id),
      blob,
      name: String(entry.name || `asset-${entry.id}`),
      mimeType: String(entry.mimeType || blob.type || "application/octet-stream"),
      kind: String(entry.kind || inferAssetKindFromMimeType(entry.mimeType || blob.type)),
      savedAt: new Date().toISOString(),
    });
  }
}

export async function clearAssetStore() {
  objectUrlCache.forEach((objectUrl) => {
    URL.revokeObjectURL(objectUrl);
  });
  objectUrlCache.clear();

  const db = await openDatabase();
  await new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const request = transaction.objectStore(STORE_NAME).clear();
    request.addEventListener("success", () => resolve());
    request.addEventListener("error", () => reject(request.error));
  });
}

function createAssetId() {
  return `asset-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.addEventListener("upgradeneeded", () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    });

    request.addEventListener("success", () => resolve(request.result));
    request.addEventListener("error", () => reject(request.error));
  });
}

async function writeRecord(record) {
  const db = await openDatabase();
  await new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const request = transaction.objectStore(STORE_NAME).put(record);
    request.addEventListener("success", () => resolve());
    request.addEventListener("error", () => reject(request.error));
  });
}

async function readRecord(id) {
  if (!id) {
    return null;
  }

  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const request = transaction.objectStore(STORE_NAME).get(id);
    request.addEventListener("success", () => resolve(request.result || null));
    request.addEventListener("error", () => reject(request.error));
  });
}

function readBlobAsDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(typeof reader.result === "string" ? reader.result : ""));
    reader.addEventListener("error", () => reject(reader.error));
    reader.readAsDataURL(blob);
  });
}
