export const CLOUD_CONFIG = {
  clientId: "386167885974-voguggv8fbvmqioec1p38vu3qf1fj33f.apps.googleusercontent.com",
  apiUrl: "https://script.google.com/macros/s/AKfycbwPm3QcltPGib-vwLWiElMZuELd-tq5aS2qohR_oNZt96IiPNOwumMYoIw7KZKJmBfXKQ/exec",
};

const GOOGLE_IDENTITY_SCRIPT = "https://accounts.google.com/gsi/client";
const CREDENTIAL_STORAGE_KEY = "necronomicon-google-credential";
const JSONP_TIMEOUT_MS = 15000;
const JSONP_MAX_PAYLOAD_LENGTH = 7000;

let googleIdentityPromise = null;
let jsonpCounter = 0;
let serverSessionToken = "";

export function getStoredCredential() {
  const credential = window.sessionStorage.getItem(CREDENTIAL_STORAGE_KEY) || "";
  window.localStorage.removeItem(CREDENTIAL_STORAGE_KEY);
  return credential;
}

export function storeCredential(credential) {
  if (credential) {
    window.sessionStorage.setItem(CREDENTIAL_STORAGE_KEY, credential);
    window.localStorage.removeItem(CREDENTIAL_STORAGE_KEY);
  }
}

export function clearStoredCredential() {
  serverSessionToken = "";
  window.sessionStorage.removeItem(CREDENTIAL_STORAGE_KEY);
  window.localStorage.removeItem(CREDENTIAL_STORAGE_KEY);
}

export function decodeCredential(credential) {
  const payload = decodeJwtPayload(credential);
  if (!payload) {
    return null;
  }

  const expiresAt = Number(payload.exp || 0) * 1000;
  return {
    email: String(payload.email || "").toLowerCase(),
    name: String(payload.name || payload.email || ""),
    picture: String(payload.picture || ""),
    expiresAt,
  };
}

export function isCredentialUsable(credential) {
  const decoded = decodeCredential(credential);
  const payload = decodeJwtPayload(credential);
  return Boolean(
    decoded
      && decoded.email
      && decoded.expiresAt > Date.now() + 60000
      && payload?.aud === CLOUD_CONFIG.clientId,
  );
}

export async function loadGoogleIdentity() {
  if (window.google?.accounts?.id) {
    return window.google;
  }

  if (!googleIdentityPromise) {
    googleIdentityPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = GOOGLE_IDENTITY_SCRIPT;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve(window.google);
      script.onerror = () => reject(new Error("No s'ha pogut carregar Google Identity Services."));
      document.head.append(script);
    });
  }

  return googleIdentityPromise;
}

export function renderGoogleButton(rootEl, callback) {
  if (!rootEl || !window.google?.accounts?.id) {
    return;
  }

  rootEl.innerHTML = "";
  window.google.accounts.id.initialize({
    client_id: CLOUD_CONFIG.clientId,
    callback,
    auto_select: true,
    cancel_on_tap_outside: false,
  });
  window.google.accounts.id.renderButton(rootEl, {
    theme: "filled_black",
    size: "large",
    text: "signin_with",
    shape: "pill",
    logo_alignment: "left",
    width: 320,
  });
  const removeHiddenGoogleButtonFromTabOrder = () => {
    rootEl.querySelectorAll("iframe").forEach((iframe) => iframe.setAttribute("tabindex", "-1"));
  };
  removeHiddenGoogleButtonFromTabOrder();
  window.requestAnimationFrame(removeHiddenGoogleButtonFromTabOrder);
}

export function promptGoogleSignIn() {
  if (window.google?.accounts?.id) {
    window.google.accounts.id.prompt();
  }
}

export async function loadCampaignFromCloud(idToken) {
  await establishServerSession(idToken);
  return jsonpRequest({
    action: "loadCampaign",
    ...createAuthPayload(idToken),
  });
}

export async function saveCampaignToCloud(idToken, campaign, options = {}) {
  return postAndConfirm({
    action: "saveCampaign",
    ...createAuthPayload(idToken),
    campaign,
    expectedRevision: Math.max(0, Number(options.expectedRevision) || 0),
  }, idToken);
}

export async function saveCharacterToCloud(idToken, character, campaignId = "", options = {}) {
  const payload = {
    action: "saveCharacter",
    ...createAuthPayload(idToken),
    campaignId,
    character,
  };
  const compactPayload = options.preserveExistingPortrait
    ? createCharacterPayloadWithoutPortrait(payload)
    : null;
  return saveItemToCloud(payload, compactPayload, idToken);
}

export async function saveChronicleToCloud(idToken, chronicle, campaignId = "") {
  return saveItemToCloud({
    action: "saveChronicle",
    ...createAuthPayload(idToken),
    campaignId,
    chronicle,
  }, null, idToken);
}

export async function saveGlossaryEntryToCloud(idToken, entry, campaignId = "", options = {}) {
  const payload = {
    action: "saveGlossaryEntry",
    ...createAuthPayload(idToken),
    campaignId,
    entry,
  };
  const compactPayload = options.preserveExistingImageAssets
    ? createGlossaryEntryPayloadWithoutImages(payload)
    : null;
  return saveItemToCloud(payload, compactPayload, idToken);
}

export async function saveCharacterRosterToCloud(idToken, characterId, roster, campaignId = "") {
  return saveItemToCloud({
    action: "saveCharacterRoster",
    ...createAuthPayload(idToken),
    campaignId,
    characterId,
    roster: roster?.roster || {},
    assignedEmails: Array.isArray(roster?.assignedEmails) ? roster.assignedEmails : [],
  }, null, idToken);
}

export async function deleteCharacterFromCloud(idToken, characterId, campaignId = "") {
  return saveItemToCloud({
    action: "deleteCharacter",
    ...createAuthPayload(idToken),
    campaignId,
    itemId: characterId,
  }, null, idToken);
}

export async function deleteChronicleFromCloud(idToken, chronicleId, campaignId = "") {
  return saveItemToCloud({
    action: "deleteChronicle",
    ...createAuthPayload(idToken),
    campaignId,
    itemId: chronicleId,
  }, null, idToken);
}

export async function deleteGlossaryEntryFromCloud(idToken, entryId, campaignId = "") {
  return saveItemToCloud({
    action: "deleteGlossaryEntry",
    ...createAuthPayload(idToken),
    campaignId,
    itemId: entryId,
  }, null, idToken);
}

export async function repairCampaignAssetsInCloud(idToken, campaignId = "") {
  return saveItemToCloud({
    action: "repairCampaignAssets",
    ...createAuthPayload(idToken),
    campaignId,
  }, null, idToken);
}
export async function saveAssetToCloud(idToken, asset, context = {}) {
  const label = String(asset?.name || asset?.id || "imatge").trim() || "imatge";
  try {
    await establishServerSession(idToken);
    const operationId = createOperationId();
    await postWithoutCors({
      action: "saveAsset",
      ...createAuthPayload(idToken),
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

export async function loadAssetFromCloud(idToken, assetRef, campaignId = "") {
  await establishServerSession(idToken);
  return jsonpRequest({
    action: "loadAsset",
    ...createAuthPayload(idToken),
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

async function saveItemToCloud(payload, compactPayload = null, idToken = "") {
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

  return postAndConfirm(confirmedPayload, idToken);
}

async function postAndConfirm(payload, idToken = "") {
  const operationId = String(payload.operationId || createOperationId());
  await postWithoutCors({ ...payload, operationId });
  const response = await loadCampaignFromCloud(idToken);
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

async function establishServerSession(idToken) {
  if (serverSessionToken || !idToken) return serverSessionToken;
  const operationId = createOperationId();
  try {
    await postWithoutCors({ action: "createSession", idToken, operationId });
    const response = await jsonpRequest({ action: "claimSession", operationId });
    serverSessionToken = String(response?.sessionToken || "");
  } catch {
    serverSessionToken = "";
  }
  return serverSessionToken;
}

function createAuthPayload(idToken) {
  return serverSessionToken ? { sessionToken: serverSessionToken } : { idToken };
}

function jsonpRequest(payload, timeoutMs = JSONP_TIMEOUT_MS) {
  return new Promise((resolve, reject) => {
    const callbackName = `__necronomiconCloudCallback${Date.now()}${jsonpCounter++}`;
    const script = document.createElement("script");
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error("Google Drive no ha respost a temps."));
    }, timeoutMs);

    window[callbackName] = (response) => {
      cleanup();
      if (!response || response.ok === false) {
        reject(new Error(response?.error || "Resposta no valida de Google Drive."));
        return;
      }
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
      reject(new Error("No s'ha pogut contactar amb Google Drive."));
    };
    document.head.append(script);
  });
}

async function postWithoutCors(payload) {
  await fetch(CLOUD_CONFIG.apiUrl, {
    method: "POST",
    mode: "no-cors",
    credentials: "omit",
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
    body: JSON.stringify(payload),
    keepalive: JSON.stringify(payload).length < 60000,
  });
}

function decodeJwtPayload(token) {
  const parts = String(token || "").split(".");
  if (parts.length < 2) {
    return null;
  }

  try {
    const normalized = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = `${normalized}${"=".repeat((4 - normalized.length % 4) % 4)}`;
    const binary = window.atob(padded);
    const json = decodeURIComponent(
      Array.from(binary)
        .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`)
        .join(""),
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}
