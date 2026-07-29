export const CLOUD_CONFIG = {
  apiUrl: "https://script.google.com/macros/s/AKfycbwPm3QcltPGib-vwLWiElMZuELd-tq5aS2qohR_oNZt96IiPNOwumMYoIw7KZKJmBfXKQ/exec",
  // Visible al navegador: diferencia aquesta instal·lació, però no és una
  // contrasenya personal. L'accés real a Drive és el del desplegament.
  serviceAccessKey: "necronomicon-shared-drive-gateway-v1",
};

const LOGIN_NAME_STORAGE_KEY = "necronomicon-login-name";
// Apps Script pot necessitar uns segons addicionals en un arrencat en fred o
// mentre espera el bloqueig de la campanya. Les lectures d'actius ja disposen
// de 30 s; fem servir el mateix marge per a la campanya i les confirmacions.
const JSONP_TIMEOUT_MS = 30000;
const JSONP_MAX_PAYLOAD_LENGTH = 7000;

let jsonpCounter = 0;
let serverSessionToken = "";
let cloudRequestObserver = null;

export function setCloudRequestObserver(observer) {
  cloudRequestObserver = typeof observer === "function" ? observer : null;
}

export function getStoredLoginName() {
  return window.localStorage.getItem(LOGIN_NAME_STORAGE_KEY) || "";
}
export function storeLoginName(loginName) {
  const normalized = normalizeLoginName(loginName);
  if (normalized) window.localStorage.setItem(LOGIN_NAME_STORAGE_KEY, normalized);
}

export function clearStoredLoginName() {
  serverSessionToken = "";
  window.localStorage.removeItem(LOGIN_NAME_STORAGE_KEY);
}

export function normalizeLoginName(loginName) {
  return String(loginName || "").trim().replace(/\s+/g, " ").slice(0, 48);
}

export async function loadCampaignFromCloud(loginName) {
  await establishServerSession(loginName);
  return jsonpRequest({
    action: "loadCampaign",
    ...createAuthPayload(loginName),
  });
}
export async function saveCampaignToCloud(loginName, campaign, options = {}) {
  return postAndConfirm({
    action: "saveCampaign",
    ...createAuthPayload(loginName),
    campaign,
    expectedRevision: Math.max(0, Number(options.expectedRevision) || 0),
  }, loginName);
}

export async function saveCharacterToCloud(loginName, character, campaignId = "", options = {}) {
  const payload = {
    action: "saveCharacter",
    ...createAuthPayload(loginName),
    campaignId,
    character,
  };
  const compactPayload = options.preserveExistingPortrait
    ? createCharacterPayloadWithoutPortrait(payload)
    : null;
  return saveItemToCloud(payload, compactPayload, loginName);
}

export async function saveChronicleToCloud(loginName, chronicle, campaignId = "") {
  return saveItemToCloud({
    action: "saveChronicle",
    ...createAuthPayload(loginName),
    campaignId,
    chronicle,
  }, null, loginName);
}

export async function saveGlossaryEntryToCloud(loginName, entry, campaignId = "", options = {}) {
  const payload = {
    action: "saveGlossaryEntry",
    ...createAuthPayload(loginName),
    campaignId,
    entry,
  };
  const compactPayload = options.preserveExistingImageAssets
    ? createGlossaryEntryPayloadWithoutImages(payload)
    : null;
  return saveItemToCloud(payload, compactPayload, loginName);
}

export async function saveCharacterRosterToCloud(loginName, characterId, roster, campaignId = "") {
  return saveItemToCloud({
    action: "saveCharacterRoster",
    ...createAuthPayload(loginName),
    campaignId,
    characterId,
    roster: roster?.roster || {},
    assignedEmails: Array.isArray(roster?.assignedEmails) ? roster.assignedEmails : [],
  }, null, loginName);
}

export async function deleteCharacterFromCloud(loginName, characterId, campaignId = "") {
  return saveItemToCloud({
    action: "deleteCharacter",
    ...createAuthPayload(loginName),
    campaignId,
    itemId: characterId,
  }, null, loginName);
}

export async function deleteChronicleFromCloud(loginName, chronicleId, campaignId = "") {
  return saveItemToCloud({
    action: "deleteChronicle",
    ...createAuthPayload(loginName),
    campaignId,
    itemId: chronicleId,
  }, null, loginName);
}

export async function deleteGlossaryEntryFromCloud(loginName, entryId, campaignId = "") {
  return saveItemToCloud({
    action: "deleteGlossaryEntry",
    ...createAuthPayload(loginName),
    campaignId,
    itemId: entryId,
  }, null, loginName);
}

export async function repairCampaignAssetsInCloud(loginName, campaignId = "") {
  return saveItemToCloud({
    action: "repairCampaignAssets",
    ...createAuthPayload(loginName),
    campaignId,
  }, null, loginName);
}
export async function saveAssetToCloud(loginName, asset, context = {}) {
  const label = String(asset?.name || asset?.id || "imatge").trim() || "imatge";
  try {
    await establishServerSession(loginName);
    const operationId = createOperationId();
    await postWithoutCors({
      action: "saveAsset",
      ...createAuthPayload(loginName),
      operationId,
      campaignId: context.campaignId || "",
      targetType: context.targetType || "campaign",
      targetId: context.targetId || "",
      asset,
    });
    return jsonpRequest({ action: "claimAssetUpload", operationId });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`Pujada Drive fallida per "${label}": ${detail}`);
  }
}

export async function loadAssetFromCloud(loginName, assetRef, campaignId = "") {
  await establishServerSession(loginName);
  return jsonpRequest({
    action: "loadAsset",
    ...createAuthPayload(loginName),
    campaignId,
    assetRef,
  }, 30000);
}

export function createGlossaryEntryPayloadWithoutImages(payload) {
  const entry = payload?.entry && typeof payload.entry === "object"
    ? { ...payload.entry }
    : payload?.entry;
  if (entry && typeof entry === "object") {
    delete entry.imageAssets;
  }

  return {
    ...payload,
    entry,
    preserveExistingImageAssets: true,
  };
}

export function createCharacterPayloadWithoutPortrait(payload) {
  const character = payload?.character && typeof payload.character === "object"
    ? { ...payload.character }
    : payload?.character;
  if (character && typeof character === "object") {
    delete character.portrait;
  }

  return {
    ...payload,
    character,
    preserveExistingPortrait: true,
  };
}

async function saveItemToCloud(payload, compactPayload = null, loginName = "") {
  const operationId = createOperationId();
  const confirmedPayload = { ...payload, operationId };
  const confirmedCompactPayload = compactPayload ? { ...compactPayload, operationId } : null;
  const serialized = JSON.stringify(confirmedPayload);
  if (serialized.length <= JSONP_MAX_PAYLOAD_LENGTH) {
    const response = await jsonpRequest(confirmedPayload);
    assertConfirmedOperation(response, operationId);
    return response;
  }

  if (confirmedCompactPayload) {
    const compactSerialized = JSON.stringify(confirmedCompactPayload);
    if (compactSerialized.length <= JSONP_MAX_PAYLOAD_LENGTH) {
      const response = await jsonpRequest(confirmedCompactPayload);
      assertConfirmedOperation(response, operationId);
      return response;
    }
  }

  return postAndConfirm(confirmedPayload, loginName);
}

async function postAndConfirm(payload, loginName = "") {
  const operationId = String(payload.operationId || createOperationId());
  await postWithoutCors({ ...payload, operationId });
  const response = await loadCampaignFromCloud(loginName);
  assertConfirmedOperation(response, operationId);
  return response;
}

function assertConfirmedOperation(response, operationId) {
  // Keep the client compatible with an older deployment during the rollout.
  // Once the new backend is live it advertises revisions and every write must
  // be confirmed with the exact operation id returned by Drive.
  if (response?.capabilities?.campaignRevisions !== true) {
    return;
  }

  const confirmedOperationId = String(response?.campaign?.serverSync?.operationId || "");
  if (!confirmedOperationId || confirmedOperationId !== operationId) {
    throw new Error("Drive no ha confirmat l'escriptura. Recarrega la campanya abans de continuar.");
  }
}

function createOperationId() {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }
  return `sync-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

async function establishServerSession(loginName) {
  if (serverSessionToken || !loginName) return serverSessionToken;
  const operationId = createOperationId();
  try {
    await postWithoutCors({
      action: "createSession",
      loginName: normalizeLoginName(loginName),
      accessKey: CLOUD_CONFIG.serviceAccessKey,
      operationId,
    });
    const response = await jsonpRequest({ action: "claimSession", operationId });
    serverSessionToken = String(response?.sessionToken || "");
  } catch {
    serverSessionToken = "";
  }
  return serverSessionToken;
}

function createAuthPayload(loginName) {
  return serverSessionToken
    ? { sessionToken: serverSessionToken }
    : {
      loginName: normalizeLoginName(loginName),
      accessKey: CLOUD_CONFIG.serviceAccessKey,
    };
}

function jsonpRequest(payload, timeoutMs = JSONP_TIMEOUT_MS) {
  return new Promise((resolve, reject) => {
    const startedAt = performance.now();
    const action = String(payload?.action || "request");
    notifyCloudRequest({ action, transport: "jsonp", stage: "start" });
    const callbackName = `__necronomiconCloudCallback${Date.now()}${jsonpCounter++}`;
    const script = document.createElement("script");
    let timedOut = false;
    const timeout = window.setTimeout(() => {
      // La resposta JSONP pot arribar just després del límit. Conservem un
      // callback inert fins que s'executi per evitar un ReferenceError global.
      timedOut = true;
      window.clearTimeout(timeout);
      script.remove();
      const error = new Error("Google Drive no ha respost a temps.");
      notifyCloudRequest({ action, transport: "jsonp", stage: "error", durationMs: elapsed(startedAt), error: error.message });
      reject(error);
    }, timeoutMs);

    window[callbackName] = (response) => {
      cleanup();
      if (timedOut) {
        return;
      }
      if (!response || response.ok === false) {
        const error = new Error(response?.error || "Resposta no valida de Google Drive.");
        notifyCloudRequest({ action, transport: "jsonp", stage: "error", durationMs: elapsed(startedAt), error: error.message });
        reject(error);
        return;
      }
      notifyCloudRequest({ action, transport: "jsonp", stage: "success", durationMs: elapsed(startedAt) });
      resolve(response);
    };

    function cleanup() {
      window.clearTimeout(timeout);
      delete window[callbackName];
      script.remove();
    }

    const url = new URL(CLOUD_CONFIG.apiUrl);
    url.searchParams.set("callback", callbackName);
    url.searchParams.set("payload", JSON.stringify(payload));
    script.referrerPolicy = "no-referrer";
    script.src = url.toString();
    script.onerror = () => {
      cleanup();
      const error = new Error("No s'ha pogut contactar amb Google Drive.");
      notifyCloudRequest({ action, transport: "jsonp", stage: "error", durationMs: elapsed(startedAt), error: error.message });
      reject(error);
    };
    document.head.append(script);
  });
}

async function postWithoutCors(payload) {
  const startedAt = performance.now();
  const action = String(payload?.action || "request");
  notifyCloudRequest({ action, transport: "post", stage: "start" });
  try {
    const body = JSON.stringify(payload);
    await fetch(CLOUD_CONFIG.apiUrl, {
      method: "POST",
      mode: "no-cors",
      credentials: "omit",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body,
      keepalive: body.length < 60000,
    });
    notifyCloudRequest({ action, transport: "post", stage: "success", durationMs: elapsed(startedAt) });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    notifyCloudRequest({ action, transport: "post", stage: "error", durationMs: elapsed(startedAt), error: message });
    throw error;
  }
}

function notifyCloudRequest(event) {
  try {
    cloudRequestObserver?.(event);
  } catch {
    // La diagnosi no ha d'alterar mai la sincronitzacio.
  }
}

function elapsed(startedAt) {
  return Math.max(0, Math.round(performance.now() - startedAt));
}
