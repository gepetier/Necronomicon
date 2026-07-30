export const CLOUD_CONFIG = {
  apiUrl: "https://script.google.com/macros/s/AKfycbwPm3QcltPGib-vwLWiElMZuELd-tq5aS2qohR_oNZt96IiPNOwumMYoIw7KZKJmBfXKQ/exec",
  // Visible al navegador: diferencia aquesta instal·lació, però no és una
  // contrasenya personal. L'accés real a Drive és el del desplegament.
  serviceAccessKey: "necronomicon-shared-drive-gateway-v1",
};

const LOGIN_NAME_STORAGE_KEY = "necronomicon-login-name";
const SERVER_SESSION_STORAGE_KEY = "necronomicon-server-session-v1";
// Apps Script pot necessitar uns segons addicionals en un arrencat en fred o
// mentre espera el bloqueig de la campanya. Les lectures d'actius ja disposen
// de 30 s; fem servir el mateix marge per a la campanya i les confirmacions.
const JSONP_TIMEOUT_MS = 30000;
const JSONP_MAX_PAYLOAD_LENGTH = 7000;
const ASSET_CLAIM_ATTEMPTS = 4;
const ASSET_CLAIM_RETRY_MS = 500;

let jsonpCounter = 0;
let cloudRequestCounter = 0;
let serverSessionToken = "";
let serverSessionLoginName = "";
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
  clearServerSession();
  window.localStorage.removeItem(LOGIN_NAME_STORAGE_KEY);
}

export function normalizeLoginName(loginName) {
  return String(loginName || "").trim().replace(/\s+/g, " ").slice(0, 48);
}

export async function loadCampaignFromCloud(loginName, options = {}) {
  const normalizedLoginName = normalizeLoginName(loginName);
  const session = await establishServerSession(normalizedLoginName, options);
  try {
    return await jsonpRequest({
      action: "loadCampaign",
      ...createAuthPayload(normalizedLoginName),
    }, JSONP_TIMEOUT_MS, options.diagnostic);
  } catch (error) {
    // Una sessio guardada a la pestanya pot haver caducat al servidor. La
    // refem una sola vegada abans de donar l'error al compendi.
    if (!session.reused || !isExpiredServerSessionError(error)) throw error;
    clearServerSession();
    await establishServerSession(normalizedLoginName, { ...options, force: true });
    return jsonpRequest({ action: "loadCampaign", ...createAuthPayload(normalizedLoginName) }, JSONP_TIMEOUT_MS, options.diagnostic);
  }
}

export async function saveCampaignToCloud(loginName, campaign, options = {}) {
  return postAndConfirm({
    action: "saveCampaign",
    ...createAuthPayload(loginName),
    campaign,
    expectedRevision: Math.max(0, Number(options.expectedRevision) || 0),
  }, loginName, options.diagnostic);
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
  return saveItemToCloud(payload, compactPayload, loginName, options.diagnostic);
}

export async function saveChronicleToCloud(loginName, chronicle, campaignId = "", options = {}) {
  return saveItemToCloud({
    action: "saveChronicle",
    ...createAuthPayload(loginName),
    campaignId,
    chronicle,
  }, null, loginName, options.diagnostic);
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
  return saveItemToCloud(payload, compactPayload, loginName, options.diagnostic);
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
    await establishServerSession(loginName, { diagnostic: context.diagnostic });
    const operationId = createOperationId();
    await postWithoutCors({
      action: "saveAsset",
      ...createAuthPayload(loginName),
      operationId,
      campaignId: context.campaignId || "",
      targetType: context.targetType || "campaign",
      targetId: context.targetId || "",
      asset,
    }, context.diagnostic);
    return claimAssetUpload(operationId, context.diagnostic);
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

async function saveItemToCloud(payload, compactPayload = null, loginName = "", diagnostic = null) {
  const operationId = createOperationId();
  const confirmedPayload = { ...payload, operationId };
  const confirmedCompactPayload = compactPayload ? { ...compactPayload, operationId } : null;
  const serialized = JSON.stringify(confirmedPayload);
  if (serialized.length <= JSONP_MAX_PAYLOAD_LENGTH) {
    const response = await jsonpRequest(confirmedPayload, JSONP_TIMEOUT_MS, diagnostic);
    assertConfirmedOperation(response, operationId);
    return response;
  }

  if (confirmedCompactPayload) {
    const compactSerialized = JSON.stringify(confirmedCompactPayload);
    if (compactSerialized.length <= JSONP_MAX_PAYLOAD_LENGTH) {
      const response = await jsonpRequest(confirmedCompactPayload, JSONP_TIMEOUT_MS, diagnostic);
      assertConfirmedOperation(response, operationId);
      return response;
    }
  }

  return postAndConfirm(confirmedPayload, loginName, diagnostic);
}

async function postAndConfirm(payload, loginName = "", diagnostic = null) {
  const operationId = String(payload.operationId || createOperationId());
  await postWithoutCors({ ...payload, operationId }, diagnostic);
  const response = await loadCampaignFromCloud(loginName, { diagnostic });
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

async function establishServerSession(loginName, options = {}) {
  const normalizedLoginName = normalizeLoginName(loginName);
  if (!normalizedLoginName) return { active: false, reused: false };
  if (serverSessionToken && serverSessionLoginName === normalizedLoginName) {
    notifySessionReuse("memory", options.diagnostic);
    return { active: true, reused: true };
  }

  const restored = !options.force ? readStoredServerSession(normalizedLoginName) : "";
  if (restored) {
    serverSessionToken = restored;
    serverSessionLoginName = normalizedLoginName;
    notifySessionReuse("storage", options.diagnostic);
    return { active: true, reused: true };
  }

  const operationId = createOperationId();
  try {
    await postWithoutCors({ action: "createSession", loginName: normalizedLoginName, accessKey: CLOUD_CONFIG.serviceAccessKey, operationId }, options.diagnostic);
    const response = await jsonpRequest({ action: "claimSession", operationId }, JSONP_TIMEOUT_MS, options.diagnostic);
    serverSessionToken = String(response?.sessionToken || "");
    serverSessionLoginName = serverSessionToken ? normalizedLoginName : "";
    if (serverSessionToken) storeServerSession(normalizedLoginName, serverSessionToken);
  } catch {
    clearServerSession();
  }
  return { active: Boolean(serverSessionToken), reused: false };
}

function isExpiredServerSessionError(error) {
  const message = error instanceof Error ? error.message : String(error || "");
  return /sessio .*caduc|session .*expired|sessio .*no valida|session .*invalid/i.test(message);
}
function readStoredServerSession(loginName) {
  try {
    const stored = JSON.parse(window.sessionStorage.getItem(SERVER_SESSION_STORAGE_KEY) || "null");
    if (!stored || stored.loginName !== loginName || !stored.token) return "";
    return String(stored.token);
  } catch {
    return "";
  }
}

function storeServerSession(loginName, token) {
  try {
    window.sessionStorage.setItem(SERVER_SESSION_STORAGE_KEY, JSON.stringify({ loginName, token }));
  } catch {
    // La sessio es pot continuar reutilitzant en memoria si sessionStorage no esta disponible.
  }
}

function clearServerSession() {
  serverSessionToken = "";
  serverSessionLoginName = "";
  try { window.sessionStorage.removeItem(SERVER_SESSION_STORAGE_KEY); } catch { /* storage opcional */ }
}
function createAuthPayload(loginName) {
  return serverSessionToken
    ? { sessionToken: serverSessionToken }
    : {
      loginName: normalizeLoginName(loginName),
      accessKey: CLOUD_CONFIG.serviceAccessKey,
    };
}

async function claimAssetUpload(operationId, diagnostic = null) {
  let lastError = null;
  for (let attempt = 0; attempt < ASSET_CLAIM_ATTEMPTS; attempt += 1) {
    try {
      return await jsonpRequest({ action: "claimAssetUpload", operationId }, JSONP_TIMEOUT_MS, diagnostic);
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);
      if (!/pujada de la imatge no s'ha pogut confirmar/i.test(message) || attempt === ASSET_CLAIM_ATTEMPTS - 1) {
        throw error;
      }
      await waitForAssetClaim((attempt + 1) * ASSET_CLAIM_RETRY_MS);
    }
  }
  throw lastError || new Error("La pujada de la imatge no s'ha pogut confirmar.");
}

function waitForAssetClaim(delayMs) {
  return new Promise((resolve) => window.setTimeout(resolve, delayMs));
}

function jsonpRequest(payload, timeoutMs = JSONP_TIMEOUT_MS, trace = null) {
  return new Promise((resolve, reject) => {
    const startedAt = performance.now();
    const action = String(payload?.action || "request");
    const diagnostic = createCloudRequestDiagnostic(payload, trace);
    notifyCloudRequest({ action, transport: "jsonp", stage: "start", ...diagnostic });
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
      notifyCloudRequest({ action, transport: "jsonp", stage: "error", durationMs: elapsed(startedAt), error: error.message, ...diagnostic });
      reject(error);
    }, timeoutMs);

    window[callbackName] = (response) => {
      cleanup();
      if (timedOut) {
        return;
      }
      if (!response || response.ok === false) {
        const error = new Error(response?.error || "Resposta no valida de Google Drive.");
        notifyCloudRequest({ action, transport: "jsonp", stage: "error", durationMs: elapsed(startedAt), error: error.message, ...diagnostic });
        reject(error);
        return;
      }
      notifyCloudRequest({ action, transport: "jsonp", stage: "success", durationMs: elapsed(startedAt), serverTiming: response?.timing || null, uploadTiming: response?.uploadTiming || null, ...diagnostic });
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
      notifyCloudRequest({ action, transport: "jsonp", stage: "error", durationMs: elapsed(startedAt), error: error.message, ...diagnostic });
      reject(error);
    };
    document.head.append(script);
  });
}

async function postWithoutCors(payload, trace = null) {
  const startedAt = performance.now();
  const action = String(payload?.action || "request");
  const diagnostic = createCloudRequestDiagnostic(payload, trace);
  notifyCloudRequest({ action, transport: "post", stage: "start", ...diagnostic });
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
    notifyCloudRequest({ action, transport: "post", stage: "success", durationMs: elapsed(startedAt), ...diagnostic });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    notifyCloudRequest({ action, transport: "post", stage: "error", durationMs: elapsed(startedAt), error: message, ...diagnostic });
    throw error;
  }
}

function notifySessionReuse(reuse, trace = null) {
  const diagnostic = createCloudRequestDiagnostic({}, trace);
  notifyCloudRequest({
    action: "reuseSession",
    transport: "session",
    stage: "success",
    durationMs: 0,
    reuse,
    ...diagnostic,
  });
}
function createCloudRequestDiagnostic(payload, trace = null) {
  const reference = String(payload?.assetRef || payload?.asset?.id || "");
  return {
    requestId: `drive-${Date.now()}-${cloudRequestCounter++}`,
    traceId: String(trace?.traceId || ""),
    operation: String(trace?.operation || ""),
    resource: reference ? `asset-${hashDiagnosticReference(reference)}` : "",
  };
}

function hashDiagnosticReference(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
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
